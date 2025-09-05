<template>
  <div class="dashboard-overview">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>管理驾驶舱</h2>
      <div class="header-actions">
        <el-date-picker
          v-model="dateRange"
          type="monthrange"
          range-separator="至"
          start-placeholder="开始月份"
          end-placeholder="结束月份"
          format="YYYY-MM"
          value-format="YYYY-MM"
          @change="handleDateChange"
        />
        <el-button @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
      </div>
    </div>

    <!-- 核心指标卡片 -->
    <el-row :gutter="20" class="metrics-cards">
      <el-col :span="6">
        <el-card class="metric-card">
          <div class="metric-content">
            <div class="metric-icon total-bonus">
              <el-icon><Money /></el-icon>
            </div>
            <div class="metric-info">
              <div class="metric-value">¥{{ formatNumber(metrics.totalBonus) }}</div>
              <div class="metric-label">本期总奖金</div>
              <div class="metric-change positive">
                <el-icon><CaretTop /></el-icon>
                {{ metrics.bonusGrowth }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="metric-card">
          <div class="metric-content">
            <div class="metric-icon avg-bonus">
              <el-icon><User /></el-icon>
            </div>
            <div class="metric-info">
              <div class="metric-value">¥{{ formatNumber(metrics.avgBonus) }}</div>
              <div class="metric-label">人均奖金</div>
              <div class="metric-change positive">
                <el-icon><CaretTop /></el-icon>
                {{ metrics.avgGrowth }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="metric-card">
          <div class="metric-content">
            <div class="metric-icon utilization">
              <el-icon><DataAnalysis /></el-icon>
            </div>
            <div class="metric-info">
              <div class="metric-value">{{ (metrics.utilizationRate * 100).toFixed(1) }}%</div>
              <div class="metric-label">奖金池利用率</div>
              <div class="metric-change neutral">
                <el-icon><Minus /></el-icon>
                {{ metrics.utilizationChange }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="metric-card">
          <div class="metric-content">
            <div class="metric-icon employees">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div class="metric-info">
              <div class="metric-value">{{ metrics.totalEmployees }}</div>
              <div class="metric-label">参与员工数</div>
              <div class="metric-change positive">
                <el-icon><CaretTop /></el-icon>
                {{ metrics.employeeGrowth }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-section">
      <!-- 奖金趋势图 -->
      <el-col :span="12">
        <el-card class="chart-card" header="奖金发放趋势">
          <div class="chart-controls">
            <el-radio-group v-model="trendType" size="small" @change="updateTrendChart">
              <el-radio-button label="total">总奖金</el-radio-button>
              <el-radio-button label="avg">人均奖金</el-radio-button>
              <el-radio-button label="count">发放人数</el-radio-button>
            </el-radio-group>
          </div>
          <div ref="trendChart" class="chart" style="height: 300px;"></div>
        </el-card>
      </el-col>

      <!-- 业务线分布饼图 -->
      <el-col :span="12">
        <el-card class="chart-card" header="业务线奖金分布">
          <div class="chart-controls">
            <el-radio-group v-model="distributionType" size="small" @change="updateDistributionChart">
              <el-radio-button label="amount">金额分布</el-radio-button>
              <el-radio-button label="people">人数分布</el-radio-button>
            </el-radio-group>
          </div>
          <div ref="distributionChart" class="chart" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细分析区域 -->
    <el-row :gutter="20" class="analysis-section">
      <!-- 部门排行榜 -->
      <el-col :span="8">
        <el-card class="ranking-card" header="部门奖金排行">
          <div class="ranking-list">
            <div 
              v-for="(dept, index) in departmentRanking" 
              :key="dept.id"
              class="ranking-item"
              :class="{ 'top-three': index < 3 }"
            >
              <div class="ranking-position">
                <span class="rank-number" :class="`rank-${index + 1}`">{{ index + 1 }}</span>
              </div>
              <div class="ranking-info">
                <div class="dept-name">{{ dept.name }}</div>
                <div class="dept-bonus">¥{{ formatNumber(dept.totalBonus) }}</div>
              </div>
              <div class="ranking-progress">
                <el-progress 
                  :percentage="(dept.totalBonus / departmentRanking[0].totalBonus * 100)" 
                  :show-text="false"
                  :stroke-width="6"
                />
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 奖金分布直方图 -->
      <el-col :span="16">
        <el-card class="chart-card" header="奖金分布区间统计">
          <div class="distribution-stats">
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-value">{{ bonusDistribution.ranges.length }}</div>
                <div class="stat-label">分布区间</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">¥{{ formatNumber(bonusDistribution.median) }}</div>
                <div class="stat-label">中位数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ bonusDistribution.giniCoefficient.toFixed(3) }}</div>
                <div class="stat-label">基尼系数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ bonusDistribution.standardDeviation.toFixed(0) }}</div>
                <div class="stat-label">标准差</div>
              </div>
            </div>
          </div>
          <div ref="histogramChart" class="chart" style="height: 250px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 实时动态 -->
    <el-row :gutter="20" class="activities-section">
      <el-col :span="24">
        <el-card header="系统动态">
          <div class="activities-container">
            <el-timeline>
              <el-timeline-item
                v-for="activity in recentActivities"
                :key="activity.id"
                :timestamp="activity.timestamp"
                :type="activity.type"
              >
                <div class="activity-content">
                  <div class="activity-title">{{ activity.title }}</div>
                  <div class="activity-description">{{ activity.description }}</div>
                  <div class="activity-user">by {{ activity.user }}</div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Refresh, Money, User, DataAnalysis, UserFilled,
  CaretTop, CaretBottom, Minus
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { 
  getDashboardOverview, 
  getTrendData, 
  getDistributionData,
  type DashboardMetrics,
  type DepartmentRanking,
  type BonusDistribution,
  type SystemActivity,
  type TrendDataPoint,
  type DistributionDataPoint
} from '@/api/dashboard'

// 响应式数据
const loading = ref(false)
const dateRange = ref([])
const trendType = ref('total')
const distributionType = ref('amount')

// 核心指标
const metrics = reactive<DashboardMetrics>({
  totalBonus: 0,
  avgBonus: 0,
  utilizationRate: 0,
  totalEmployees: 0,
  bonusGrowth: 0,
  avgGrowth: 0,
  utilizationChange: 0,
  employeeGrowth: 0
})

// 部门排行数据
const departmentRanking = ref<DepartmentRanking[]>([])

// 奖金分布统计
const bonusDistribution = reactive<BonusDistribution>({
  ranges: [],
  median: 0,
  giniCoefficient: 0,
  standardDeviation: 0
})

// 系统动态
const recentActivities = ref<SystemActivity[]>([])

// 图表引用
const trendChart = ref()
const distributionChart = ref()
const histogramChart = ref()

// 工具函数
const formatNumber = (num: number) => {
  return new Intl.NumberFormat('zh-CN').format(num || 0)
}

// 事件处理
const refreshData = async () => {
  loading.value = true
  try {
    await loadDashboardData()
    ElMessage.success('数据刷新成功')
  } catch (error) {
    console.error('刷新数据失败:', error)
    ElMessage.error('数据刷新失败')
  } finally {
    loading.value = false
  }
}

// 加载驾驶舱数据
const loadDashboardData = async () => {
  try {
    const [startDate, endDate] = dateRange.value
    const response = await getDashboardOverview({ startDate, endDate })
    
    if (response.code === 200 && response.data) {
      // 更新核心指标
      Object.assign(metrics, response.data.metrics)
      
      // 更新部门排行
      departmentRanking.value = response.data.departmentRanking
      
      // 更新奖金分布
      Object.assign(bonusDistribution, response.data.bonusDistribution)
      
      // 更新系统动态
      recentActivities.value = response.data.recentActivities
      
      // 更新图表
      nextTick(() => {
        updateTrendChart()
        updateDistributionChart()
        updateHistogramChart()
      })
    }
  } catch (error) {
    console.error('加载驾驶舱数据失败:', error)
    throw error
  }
}

const handleDateChange = (dates: string[]) => {
  console.log('日期范围变更:', dates)
  // 清除缓存
  trendDataCache.value = {}
  distributionDataCache.value = {}
  // 根据日期范围重新加载数据
  refreshData()
}

// 趋势数据缓存
const trendDataCache = ref<Record<string, TrendDataPoint[]>>({})

// 图表更新函数
const updateTrendChart = async () => {
  if (!trendChart.value) return

  const chart = echarts.init(trendChart.value)
  
  try {
    // 获取趋势数据
    if (!trendDataCache.value[trendType.value]) {
      const response = await getTrendData({ type: trendType.value, months: 6 })
      if (response.code === 200) {
        trendDataCache.value[trendType.value] = response.data
      }
    }
    
    const trendData = trendDataCache.value[trendType.value] || []
    
    let chartData: number[]
    let seriesName: string
    
    switch (trendType.value) {
      case 'total':
        chartData = trendData.map(d => d.totalBonus)
        seriesName = '总奖金(万元)'
        break
      case 'avg':
        chartData = trendData.map(d => d.avgBonus)
        seriesName = '人均奖金(元)'
        break
      case 'count':
        chartData = trendData.map(d => d.employeeCount)
        seriesName = '发放人数'
        break
      default:
        chartData = []
        seriesName = '数据'
    }
    
    const periods = trendData.map(d => d.period)
    
    chart.setOption({
      title: {
        text: `${seriesName}趋势`,
        left: 'center',
        textStyle: { fontSize: 14 }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const point = params[0]
          return `${point.name}<br/>${seriesName}: ${formatNumber(point.value)}`
        }
      },
      xAxis: {
        type: 'category',
        data: periods
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (value: number) => {
            if (trendType.value === 'total') {
              return (value / 10000).toFixed(0) + '万'
            }
            return formatNumber(value)
          }
        }
      },
      series: [{
        data: chartData,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#409EFF', width: 3 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
            ]
          }
        }
      }],
      grid: { left: '10%', right: '10%', bottom: '15%', top: '20%' }
    })
  } catch (error) {
    console.error('更新趋势图表失败:', error)
  }
}

// 分布数据缓存
const distributionDataCache = ref<Record<string, DistributionDataPoint[]>>({})

const updateDistributionChart = async () => {
  if (!distributionChart.value) return

  const chart = echarts.init(distributionChart.value)
  
  try {
    // 获取分布数据
    if (!distributionDataCache.value[distributionType.value]) {
      const response = await getDistributionData({ type: distributionType.value })
      if (response.code === 200) {
        distributionDataCache.value[distributionType.value] = response.data
      }
    }
    
    const currentData = distributionDataCache.value[distributionType.value] || []
    
    chart.setOption({
      title: {
        text: distributionType.value === 'amount' ? '业务线奖金金额分布' : '业务线人数分布',
        left: 'center',
        textStyle: { fontSize: 14 }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const unit = distributionType.value === 'amount' ? '元' : '人'
          return `${params.name}<br/>${formatNumber(params.value)}${unit} (${params.percent}%)`
        }
      },
      series: [{
        type: 'pie',
        radius: ['30%', '70%'],
        data: currentData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          formatter: '{b}\n{d}%'
        }
      }]
    })
  } catch (error) {
    console.error('更新分布图表失败:', error)
  }
}

const updateHistogramChart = () => {
  if (!histogramChart.value) return

  const chart = echarts.init(histogramChart.value)
  
  chart.setOption({
    title: {
      text: '奖金分布直方图',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const point = params[0]
        return `区间: ${point.name}<br/>人数: ${point.value}人`
      }
    },
    xAxis: {
      type: 'category',
      data: bonusDistribution.ranges.map(r => 
        `${(r.min/1000).toFixed(0)}-${(r.max/1000).toFixed(0)}k`
      ),
      axisLabel: { rotate: 45 }
    },
    yAxis: {
      type: 'value',
      name: '人数',
      axisLabel: { formatter: '{value}人' }
    },
    series: [{
      data: bonusDistribution.ranges.map(r => r.count),
      type: 'bar',
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#67C23A' },
            { offset: 1, color: '#85CE61' }
          ]
        }
      }
    }],
    grid: { left: '10%', right: '10%', bottom: '25%', top: '15%' }
  })
}

// 页面加载
onMounted(() => {
  // 设置默认日期范围为当前月份
  const now = new Date()
  const currentMonth = now.toISOString().slice(0, 7)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1).toISOString().slice(0, 7)
  dateRange.value = [lastMonth, currentMonth]

  // 加载数据
  loadDashboardData()
})
</script>

<style scoped>
.dashboard-overview {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: white;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.page-header h2 {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.metrics-cards {
  margin-bottom: 20px;
}

.metric-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.metric-card:hover {
  transform: translateY(-2px);
}

.metric-content {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.metric-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: white;
}

.metric-icon.total-bonus {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.metric-icon.avg-bonus {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.metric-icon.utilization {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.metric-icon.employees {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.metric-info {
  flex: 1;
}

.metric-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.metric-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.metric-change {
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
}

.metric-change.positive {
  color: #67c23a;
}

.metric-change.negative {
  color: #f56c6c;
}

.metric-change.neutral {
  color: #e6a23c;
}

.charts-section,
.analysis-section,
.activities-section {
  margin-bottom: 20px;
}

.chart-card,
.ranking-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.chart-controls {
  margin-bottom: 16px;
  text-align: center;
}

.chart {
  width: 100%;
}

.ranking-list {
  max-height: 400px;
  overflow-y: auto;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.ranking-item:last-child {
  border-bottom: none;
}

.ranking-item.top-three .rank-number {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #8b4513;
}

.ranking-position {
  margin-right: 12px;
}

.rank-number {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #e4e7ed;
  color: #606266;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}

.rank-number.rank-1 {
  background: linear-gradient(135deg, #ffd700, #ffa500);
  color: white;
}

.rank-number.rank-2 {
  background: linear-gradient(135deg, #c0c0c0, #a8a8a8);
  color: white;
}

.rank-number.rank-3 {
  background: linear-gradient(135deg, #cd7f32, #a0522d);
  color: white;
}

.ranking-info {
  flex: 1;
  margin-right: 12px;
}

.dept-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.dept-bonus {
  font-size: 12px;
  color: #67c23a;
  font-weight: bold;
}

.ranking-progress {
  width: 100px;
}

.distribution-stats {
  margin-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.activities-container {
  max-height: 400px;
  overflow-y: auto;
}

.activity-content {
  margin-left: 8px;
}

.activity-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.activity-description {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.activity-user {
  font-size: 12px;
  color: #909399;
}
</style>