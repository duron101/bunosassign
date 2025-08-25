<template>
  <div class="personal-bonus">
    <div class="page-header">
      <h2>个人奖金查询</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showExportDialog">
          <el-icon><Download /></el-icon>
          导出报告
        </el-button>
      </div>
    </div>

    <!-- 查询条件 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="查询期间">
          <el-date-picker
            v-model="searchForm.period"
            type="month"
            placeholder="选择月份"
            format="YYYY年MM月"
            value-format="YYYY-MM"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="员工工号">
          <el-input
            v-model="searchForm.employeeId"
            placeholder="请输入员工工号"
            style="width: 200px"
            clearable
          />
        </el-form-item>
        <el-form-item label="员工姓名">
          <el-input
            v-model="searchForm.employeeName"
            placeholder="请输入员工姓名"
            style="width: 200px"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch" :loading="searching">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="resetSearch">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 查询结果 -->
    <el-card v-if="bonusInfo" class="result-card">
      <!-- 员工基本信息 -->
      <div class="employee-info">
        <div class="employee-avatar">
          <el-avatar :size="80">{{ bonusInfo.employeeName.charAt(0) }}</el-avatar>
        </div>
        <div class="employee-details">
          <h3>{{ bonusInfo.employeeName }}</h3>
          <div class="info-item">
            <span class="label">工号:</span>
            <span class="value">{{ bonusInfo.employeeId }}</span>
          </div>
          <div class="info-item">
            <span class="label">部门:</span>
            <span class="value">{{ bonusInfo.department }}</span>
          </div>
          <div class="info-item">
            <span class="label">岗位:</span>
            <span class="value">{{ bonusInfo.position }}</span>
          </div>
          <div class="info-item">
            <span class="label">业务线:</span>
            <span class="value">{{ bonusInfo.businessLine }}</span>
          </div>
        </div>
        <div class="period-info">
          <div class="period-label">查询期间</div>
          <div class="period-value">{{ formatPeriod(searchForm.period) }}</div>
        </div>
      </div>

      <el-divider />

      <!-- 奖金概览 -->
      <div class="bonus-overview">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="overview-card total">
              <div class="overview-icon">
                <el-icon><Money /></el-icon>
              </div>
              <div class="overview-content">
                <div class="overview-value">¥{{ formatNumber(bonusInfo.totalBonus) }}</div>
                <div class="overview-label">总奖金</div>
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="overview-card base">
              <div class="overview-icon">
                <el-icon><Wallet /></el-icon>
              </div>
              <div class="overview-content">
                <div class="overview-value">¥{{ formatNumber(bonusInfo.baseBonus) }}</div>
                <div class="overview-label">基础奖金</div>
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="overview-card performance">
              <div class="overview-icon">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="overview-content">
                <div class="overview-value">¥{{ formatNumber(bonusInfo.performanceBonus) }}</div>
                <div class="overview-label">绩效奖金</div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 详细计算过程 -->
      <el-card class="calculation-detail" header="计算明细">
        <el-table :data="bonusInfo.calculationDetails" stripe>
          <el-table-column prop="dimension" label="计算维度" width="120" />
          <el-table-column prop="score" label="得分" width="80">
            <template #default="{ row }">
              <span>{{ row.score.toFixed(1) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="weight" label="权重" width="80">
            <template #default="{ row }">
              <span>{{ (row.weight * 100).toFixed(1) }}%</span>
            </template>
          </el-table-column>
          <el-table-column prop="weightedScore" label="加权得分" width="100">
            <template #default="{ row }">
              <span>{{ row.weightedScore.toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="金额(元)" width="120">
            <template #default="{ row }">
              <span class="amount-value">¥{{ formatNumber(row.amount) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="说明" />
        </el-table>
        
        <div class="calculation-summary">
          <div class="summary-item">
            <span class="summary-label">综合得分:</span>
            <span class="summary-value">{{ bonusInfo.totalScore.toFixed(2) }}分</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">奖金系数:</span>
            <span class="summary-value">{{ bonusInfo.bonusRatio.toFixed(3) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">基准奖金:</span>
            <span class="summary-value">¥{{ formatNumber(bonusInfo.baseAmount) }}</span>
          </div>
          <div class="summary-item total-summary">
            <span class="summary-label">最终奖金:</span>
            <span class="summary-value">¥{{ formatNumber(bonusInfo.totalBonus) }}</span>
          </div>
        </div>
      </el-card>

      <!-- 历史对比 -->
      <el-card class="history-comparison" header="历史对比">
        <div class="comparison-chart">
          <div ref="historyChart" style="height: 300px;"></div>
        </div>
        <div class="comparison-stats">
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-value positive">{{ bonusInfo.compared.monthlyGrowth }}%</div>
                <div class="stat-label">环比增长</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-value positive">{{ bonusInfo.compared.yearlyGrowth }}%</div>
                <div class="stat-label">同比增长</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-value">{{ bonusInfo.compared.departmentRanking }}</div>
                <div class="stat-label">部门排名</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="stat-value">{{ bonusInfo.compared.companyRanking }}</div>
                <div class="stat-label">公司排名</div>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>

      <!-- 绩效分析 -->
      <el-card class="performance-analysis" header="绩效分析">
        <div class="performance-radar">
          <div ref="performanceChart" style="height: 350px;"></div>
        </div>
        <div class="performance-insights">
          <h4>分析洞察</h4>
          <ul class="insights-list">
            <li v-for="insight in bonusInfo.insights" :key="insight.id" class="insight-item">
              <el-icon class="insight-icon" :class="insight.type">
                <InfoFilled v-if="insight.type === 'info'" />
                <SuccessFilled v-if="insight.type === 'success'" />
                <WarningFilled v-if="insight.type === 'warning'" />
              </el-icon>
              <span class="insight-text">{{ insight.text }}</span>
            </li>
          </ul>
        </div>
      </el-card>
    </el-card>

    <!-- 空状态 -->
    <el-card v-else-if="hasSearched" class="empty-card">
      <el-empty description="未找到相关奖金信息">
        <el-button type="primary" @click="resetSearch">重新查询</el-button>
      </el-empty>
    </el-card>

    <!-- 导出对话框 -->
    <el-dialog
      v-model="exportDialogVisible"
      title="导出奖金报告"
      width="500px"
    >
      <el-form :model="exportForm" label-width="100px">
        <el-form-item label="导出格式">
          <el-radio-group v-model="exportForm.format">
            <el-radio label="pdf">PDF报告</el-radio>
            <el-radio label="excel">Excel表格</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="包含内容">
          <el-checkbox-group v-model="exportForm.content">
            <el-checkbox label="basic">基本信息</el-checkbox>
            <el-checkbox label="calculation">计算明细</el-checkbox>
            <el-checkbox label="history">历史对比</el-checkbox>
            <el-checkbox label="performance">绩效分析</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exportDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleExport" :loading="exporting">
          导出
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Download, Search, RefreshLeft, Money, Wallet, TrendCharts,
  InfoFilled, SuccessFilled, WarningFilled
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'

// 响应式数据
const searching = ref(false)
const exporting = ref(false)
const hasSearched = ref(false)
const exportDialogVisible = ref(false)

// 表单数据
const searchForm = reactive({
  period: '',
  employeeId: '',
  employeeName: ''
})

const exportForm = reactive({
  format: 'pdf',
  content: ['basic', 'calculation']
})

// 奖金信息
const bonusInfo = ref(null)

// 图表引用
const historyChart = ref()
const performanceChart = ref()

// 工具函数
const formatNumber = (num: number) => {
  return new Intl.NumberFormat('zh-CN').format(num || 0)
}

const formatPeriod = (period: string) => {
  if (!period) return ''
  const [year, month] = period.split('-')
  return `${year}年${month}月`
}

// 事件处理
const handleSearch = async () => {
  if (!searchForm.period) {
    ElMessage.warning('请选择查询期间')
    return
  }

  if (!searchForm.employeeId && !searchForm.employeeName) {
    ElMessage.warning('请输入员工工号或姓名')
    return
  }

  searching.value = true
  hasSearched.value = true

  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 模拟数据
    bonusInfo.value = {
      employeeId: searchForm.employeeId || 'EMP001',
      employeeName: searchForm.employeeName || '张三',
      department: '实施部',
      position: '高级实施顾问',
      businessLine: '实施',
      totalBonus: 28500,
      baseBonus: 15000,
      performanceBonus: 13500,
      totalScore: 85.6,
      bonusRatio: 1.425,
      baseAmount: 20000,
      calculationDetails: [
        {
          dimension: '利润贡献度',
          score: 88.5,
          weight: 0.4,
          weightedScore: 35.4,
          amount: 11400,
          description: '基于项目收益和客户满意度'
        },
        {
          dimension: '岗位价值',
          score: 82.0,
          weight: 0.3,
          weightedScore: 24.6,
          amount: 8200,
          description: '根据岗位职级和技能要求'
        },
        {
          dimension: '绩效表现',
          score: 87.2,
          weight: 0.3,
          weightedScore: 26.16,
          amount: 8900,
          description: '个人KPI完成情况'
        }
      ],
      compared: {
        monthlyGrowth: 12.8,
        yearlyGrowth: 15.6,
        departmentRanking: 15,
        companyRanking: 85
      },
      insights: [
        {
          id: 1,
          type: 'success',
          text: '本月奖金较上月增长12.8%，表现优秀'
        },
        {
          id: 2,
          type: 'info',
          text: '利润贡献度得分88.5分，在部门中排名前20%'
        },
        {
          id: 3,
          type: 'warning',
          text: '岗位价值得分相对较低，建议提升专业技能'
        }
      ]
    }

    nextTick(() => {
      updateHistoryChart()
      updatePerformanceChart()
    })

  } catch (error) {
    ElMessage.error('查询失败，请重试')
  } finally {
    searching.value = false
  }
}

const resetSearch = () => {
  Object.assign(searchForm, {
    period: '',
    employeeId: '',
    employeeName: ''
  })
  bonusInfo.value = null
  hasSearched.value = false
}

const showExportDialog = () => {
  if (!bonusInfo.value) {
    ElMessage.warning('请先查询奖金信息')
    return
  }
  exportDialogVisible.value = true
}

const handleExport = async () => {
  exporting.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 2000))
    ElMessage.success('导出成功')
    exportDialogVisible.value = false
  } catch (error) {
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}

// 图表更新函数
const updateHistoryChart = () => {
  if (!historyChart.value) return

  const chart = echarts.init(historyChart.value)
  
  chart.setOption({
    title: {
      text: '近6个月奖金趋势',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const point = params[0]
        return `${point.name}<br/>奖金: ¥${formatNumber(point.value)}`
      }
    },
    xAxis: {
      type: 'category',
      data: ['2024-08', '2024-09', '2024-10', '2024-11', '2024-12', '2025-01']
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => `¥${(value/1000).toFixed(0)}k`
      }
    },
    series: [{
      data: [22000, 24500, 26800, 25200, 27100, 28500],
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
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

const updatePerformanceChart = () => {
  if (!performanceChart.value) return

  const chart = echarts.init(performanceChart.value)
  
  chart.setOption({
    title: {
      text: '绩效维度雷达图',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {},
    radar: {
      indicator: [
        { name: '利润贡献度', max: 100 },
        { name: '岗位价值', max: 100 },
        { name: '绩效表现', max: 100 },
        { name: '团队协作', max: 100 },
        { name: '创新能力', max: 100 },
        { name: '学习成长', max: 100 }
      ],
      radius: '60%'
    },
    series: [{
      type: 'radar',
      data: [
        {
          value: [88.5, 82.0, 87.2, 85.5, 78.8, 83.2],
          name: '个人得分',
          itemStyle: { color: '#409EFF' },
          areaStyle: { color: 'rgba(64, 158, 255, 0.3)' }
        },
        {
          value: [75.0, 80.0, 78.5, 82.0, 85.0, 80.5],
          name: '部门平均',
          itemStyle: { color: '#67C23A' },
          areaStyle: { color: 'rgba(103, 194, 58, 0.2)' }
        }
      ]
    }]
  })
}
</script>

<style scoped>
.personal-bonus {
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
}

.header-actions {
  display: flex;
  gap: 12px;
}

.search-card,
.result-card,
.empty-card {
  margin-bottom: 20px;
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.employee-info {
  display: flex;
  align-items: center;
  padding: 20px 0;
}

.employee-avatar {
  margin-right: 20px;
}

.employee-details {
  flex: 1;
}

.employee-details h3 {
  margin: 0 0 12px 0;
  font-size: 24px;
  color: #303133;
}

.info-item {
  display: flex;
  margin-bottom: 8px;
}

.info-item .label {
  width: 60px;
  color: #909399;
  margin-right: 8px;
}

.info-item .value {
  color: #303133;
  font-weight: 500;
}

.period-info {
  text-align: right;
}

.period-label {
  color: #909399;
  font-size: 14px;
  margin-bottom: 4px;
}

.period-value {
  color: #409EFF;
  font-size: 18px;
  font-weight: bold;
}

.bonus-overview {
  margin: 20px 0;
}

.overview-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 12px;
  color: white;
}

.overview-card.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.overview-card.base {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.overview-card.performance {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.overview-icon {
  font-size: 32px;
  margin-right: 16px;
}

.overview-content {
  flex: 1;
}

.overview-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 4px;
}

.overview-label {
  font-size: 14px;
  opacity: 0.9;
}

.calculation-detail,
.history-comparison,
.performance-analysis {
  margin: 20px 0;
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.amount-value {
  color: #67c23a;
  font-weight: bold;
}

.calculation-summary {
  margin-top: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 120px;
}

.summary-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.summary-item.total-summary .summary-value {
  color: #409EFF;
  font-size: 20px;
}

.comparison-stats {
  margin-top: 20px;
}

.stat-card {
  text-align: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-value.positive {
  color: #67c23a;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.performance-radar {
  margin-bottom: 20px;
}

.performance-insights h4 {
  margin: 0 0 16px 0;
  color: #303133;
}

.insights-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.insight-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.insight-icon {
  margin-right: 8px;
  font-size: 16px;
}

.insight-icon.success {
  color: #67c23a;
}

.insight-icon.info {
  color: #409eff;
}

.insight-icon.warning {
  color: #e6a23c;
}

.insight-text {
  color: #303133;
}
</style>