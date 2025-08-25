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

// 响应式数据
const loading = ref(false)
const dateRange = ref([])
const trendType = ref('total')
const distributionType = ref('amount')

// 核心指标
const metrics = reactive({
  totalBonus: 15600000,
  avgBonus: 24000,
  utilizationRate: 0.94,
  totalEmployees: 650,
  bonusGrowth: 12.5,
  avgGrowth: 8.3,
  utilizationChange: -2.1,
  employeeGrowth: 5.2
})

// 部门排行数据
const departmentRanking = ref([
  { id: 1, name: '实施部', totalBonus: 5460000 },
  { id: 2, name: '售前部', totalBonus: 3900000 },
  { id: 3, name: '研发部', totalBonus: 3120000 },
  { id: 4, name: '市场部', totalBonus: 1560000 },
  { id: 5, name: '运营部', totalBonus: 1560000 }
])

// 奖金分布统计
const bonusDistribution = reactive({
  ranges: [
    { min: 0, max: 10000, count: 45 },
    { min: 10000, max: 20000, count: 120 },
    { min: 20000, max: 30000, count: 180 },
    { min: 30000, max: 40000, count: 150 },
    { min: 40000, max: 50000, count: 85 },
    { min: 50000, max: 100000, count: 60 },
    { min: 100000, max: 200000, count: 10 }
  ],
  median: 28500,
  giniCoefficient: 0.285,
  standardDeviation: 15420
})

// 系统动态
const recentActivities = ref([
  {
    id: 1,
    title: '奖金计算完成',
    description: '2025年第一季度奖金计算任务已完成',
    user: '系统管理员',
    timestamp: '2025-01-04 14:30',
    type: 'success'
  },
  {
    id: 2,
    title: '新增模拟场景',
    description: '创建了"保守分配方案"模拟场景',
    user: '张经理',
    timestamp: '2025-01-04 11:20',
    type: 'primary'
  },
  {
    id: 3,
    title: '敏感性分析报告',
    description: '完成了奖金池比例敏感性分析',
    user: '李分析师',
    timestamp: '2025-01-04 09:15',
    type: 'info'
  },
  {
    id: 4,
    title: '数据导入',
    description: '导入了150条员工绩效数据',
    user: 'HR部门',
    timestamp: '2025-01-03 16:45',
    type: 'warning'
  }
])

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
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('数据刷新成功')
  } catch (error) {
    ElMessage.error('数据刷新失败')
  } finally {
    loading.value = false
  }
}

const handleDateChange = (dates: string[]) => {
  console.log('日期范围变更:', dates)
  // 根据日期范围重新加载数据
  refreshData()
}

// 图表更新函数
const updateTrendChart = () => {
  if (!trendChart.value) return

  const chart = echarts.init(trendChart.value)
  
  const mockData = {
    total: {
      data: [12500000, 13200000, 13800000, 14500000, 15100000, 15600000],
      name: '总奖金(万元)'
    },
    avg: {
      data: [19500, 20800, 21500, 22800, 23400, 24000],
      name: '人均奖金(元)'
    },
    count: {
      data: [580, 595, 610, 625, 640, 650],
      name: '发放人数'
    }
  }

  const currentData = mockData[trendType.value]
  
  chart.setOption({
    title: {
      text: `${currentData.name}趋势`,
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const point = params[0]
        return `${point.name}<br/>${currentData.name}: ${formatNumber(point.value)}`
      }
    },
    xAxis: {
      type: 'category',
      data: ['2024-08', '2024-09', '2024-10', '2024-11', '2024-12', '2025-01']
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
      data: currentData.data,
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
}

const updateDistributionChart = () => {
  if (!distributionChart.value) return

  const chart = echarts.init(distributionChart.value)
  
  const mockData = {
    amount: [
      { name: '实施部', value: 5460000 },
      { name: '售前部', value: 3900000 },
      { name: '研发部', value: 3120000 },
      { name: '市场部', value: 1560000 },
      { name: '运营部', value: 1560000 }
    ],
    people: [
      { name: '实施部', value: 230 },
      { name: '售前部', value: 165 },
      { name: '研发部', value: 140 },
      { name: '市场部', value: 65 },
      { name: '运营部', value: 50 }
    ]
  }

  const currentData = mockData[distributionType.value]
  
  chart.setOption({
    title: {
      text: distributionType.value === 'amount' ? '奖金金额分布' : '人数分布',
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

  nextTick(() => {
    updateTrendChart()
    updateDistributionChart()
    updateHistogramChart()
  })
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