<template>
  <div class="historical-trends-chart">
    <!-- Chart Controls -->
    <div class="chart-controls">
      <div class="controls-left">
        <el-radio-group v-model="chartType" size="small" @change="updateChart">
          <el-radio-button label="line">趋势线</el-radio-button>
          <el-radio-button label="bar">柱状图</el-radio-button>
          <el-radio-button label="area">面积图</el-radio-button>
        </el-radio-group>
      </div>
      
      <div class="controls-right">
        <el-select v-model="selectedPeriods" size="small" @change="handlePeriodChange">
          <el-option label="最近6个月" :value="6" />
          <el-option label="最近12个月" :value="12" />
          <el-option label="最近24个月" :value="24" />
          <el-option label="全部历史" :value="0" />
        </el-select>
        
        <el-button size="small" @click="toggleDataType">
          <el-icon><Switch /></el-icon>
          {{ dataType === 'total' ? '显示分类' : '显示总计' }}
        </el-button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="8" animated />
    </div>

    <!-- No Data -->
    <div v-else-if="!trendData || !trendData.chartData" class="no-data">
      <el-empty description="暂无历史数据">
        <template #description>
          <p>暂无足够的历史数据进行趋势分析</p>
        </template>
      </el-empty>
    </div>

    <!-- Chart Content -->
    <div v-else class="chart-content">
      <!-- Trend Summary -->
      <div class="trend-summary">
        <div class="summary-cards">
          <div class="summary-card trend-card" :class="getTrendClass()">
            <div class="card-icon">
              <el-icon>
                <component :is="getTrendIcon()" />
              </el-icon>
            </div>
            <div class="card-content">
              <div class="card-title">趋势状态</div>
              <div class="card-value">{{ getTrendLabel() }}</div>
              <div class="card-description">{{ trendData.trendAnalysis?.message || '暂无分析' }}</div>
            </div>
          </div>

          <div class="summary-card growth-card">
            <div class="card-icon">
              <el-icon><DataAnalysis /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-title">增长率</div>
              <div class="card-value" :class="getGrowthClass()">
                {{ ((trendData.trendAnalysis?.growthRate || 0) * 100).toFixed(1) }}%
              </div>
              <div class="card-description">与历史平均对比</div>
            </div>
          </div>

          <div class="summary-card average-card">
            <div class="card-icon">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-title">近期平均</div>
              <div class="card-value">¥{{ formatNumber(trendData.trendAnalysis?.recentAverage || 0) }}</div>
              <div class="card-description">最近{{ Math.min(3, trendData.trendAnalysis?.totalPeriods || 0) }}期平均</div>
            </div>
          </div>

          <div class="summary-card best-card">
            <div class="card-icon">
              <el-icon><Trophy /></el-icon>
            </div>
            <div class="card-content">
              <div class="card-title">最佳表现</div>
              <div class="card-value">¥{{ formatNumber(trendData.summary?.bestMonth?.amount || 0) }}</div>
              <div class="card-description">{{ trendData.summary?.bestMonth?.period || '暂无数据' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Chart -->
      <div ref="chartContainer" class="main-chart"></div>

      <!-- Data Table -->
      <div v-if="showDataTable" class="data-table">
        <div class="table-header">
          <h4>详细数据</h4>
          <el-button size="small" @click="toggleDataTable">
            <el-icon><View /></el-icon>
            隐藏表格
          </el-button>
        </div>
        
        <el-table :data="tableData" stripe size="small" max-height="300">
          <el-table-column prop="period" label="期间" width="100" />
          <el-table-column label="总奖金" width="120">
            <template #default="scope">
              ¥{{ formatNumber(scope.row.totalAmount) }}
            </template>
          </el-table-column>
          <el-table-column v-if="scope.row.regularBonus" label="基础奖金" width="120">
            <template #default="scope">
              ¥{{ formatNumber(scope.row.regularBonus) }}
            </template>
          </el-table-column>
          <el-table-column v-if="scope.row.projectBonus" label="项目奖金" width="120">
            <template #default="scope">
              ¥{{ formatNumber(scope.row.projectBonus) }}
            </template>
          </el-table-column>
          <el-table-column label="环比增长" width="100">
            <template #default="scope">
              <span :class="getCompareClass(scope.row.monthlyGrowth)">
                {{ scope.row.monthlyGrowth >= 0 ? '+' : '' }}{{ scope.row.monthlyGrowth.toFixed(1) }}%
              </span>
            </template>
          </el-table-column>
          <el-table-column label="同比增长" width="100">
            <template #default="scope">
              <span :class="getCompareClass(scope.row.yearlyGrowth)">
                {{ scope.row.yearlyGrowth >= 0 ? '+' : '' }}{{ scope.row.yearlyGrowth.toFixed(1) }}%
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Show Data Table Button -->
      <div v-else class="show-table-btn">
        <el-button size="small" @click="toggleDataTable">
          <el-icon><DataBoard /></el-icon>
          显示详细数据
        </el-button>
      </div>

      <!-- Insights -->
      <div class="insights-section">
        <div class="insights-header">
          <h4>数据洞察</h4>
          <div class="insights-period">基于最近 {{ trendData.trendAnalysis?.totalPeriods || 0 }} 期数据</div>
        </div>
        
        <div class="insights-content">
          <div class="insight-item" v-for="insight in getInsights()" :key="insight.title">
            <div class="insight-icon" :class="insight.type">
              <el-icon>
                <component :is="insight.icon" />
              </el-icon>
            </div>
            <div class="insight-content">
              <div class="insight-title">{{ insight.title }}</div>
              <div class="insight-description">{{ insight.description }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Export Actions -->
      <div class="export-actions">
        <el-button size="small" @click="exportChart">
          <el-icon><Download /></el-icon>
          导出图表
        </el-button>
        <el-button size="small" @click="exportData">
          <el-icon><Document /></el-icon>
          导出数据
        </el-button>
        <el-button size="small" @click="shareAnalysis">
          <el-icon><Share /></el-icon>
          分享分析
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Switch, DataAnalysis, TrendCharts, Trophy, View, DataBoard,
  Download, Document, Share, Top, Bottom, Minus
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { BonusTrendResponse } from '@/api/personalBonus'

interface Props {
  trendData: BonusTrendResponse['data'] | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  periodChange: [periods: number]
}>()

// Reactive data
const chartType = ref('line')
const selectedPeriods = ref(12)
const dataType = ref<'total' | 'category'>('total')
const showDataTable = ref(false)
const chartContainer = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

// Computed
const tableData = computed(() => {
  if (!props.trendData?.chartData) return []
  
  const { periods, totalAmounts, regularBonuses, projectBonuses } = props.trendData.chartData
  
  return periods.map((period, index) => ({
    period,
    totalAmount: totalAmounts[index] || 0,
    regularBonus: regularBonuses.find(r => r.period === period)?.amount || 0,
    projectBonus: projectBonuses.find(p => p.period === period)?.amount || 0,
    monthlyGrowth: index > 0 ? ((totalAmounts[index] - totalAmounts[index - 1]) / totalAmounts[index - 1]) * 100 : 0,
    yearlyGrowth: index >= 12 ? ((totalAmounts[index] - totalAmounts[index - 12]) / totalAmounts[index - 12]) * 100 : 0
  })).reverse() // Show newest first in table
})

// Utility functions
const formatNumber = (num: number) => {
  return new Intl.NumberFormat('zh-CN').format(Math.round(num || 0))
}

const getTrendClass = () => {
  if (!props.trendData?.trendAnalysis) return 'neutral'
  const trend = props.trendData.trendAnalysis.trend
  return {
    'rising': 'positive',
    'declining': 'negative',
    'stable': 'neutral'
  }[trend] || 'neutral'
}

const getTrendIcon = () => {
  if (!props.trendData?.trendAnalysis) return 'Minus'
  const trend = props.trendData.trendAnalysis.trend
  return {
    'rising': 'Top',
    'declining': 'Bottom',
    'stable': 'Minus'
  }[trend] || 'Minus'
}

const getTrendLabel = () => {
  if (!props.trendData?.trendAnalysis) return '稳定'
  const trend = props.trendData.trendAnalysis.trend
  return {
    'rising': '上升',
    'declining': '下降',
    'stable': '稳定',
    'insufficient_data': '数据不足'
  }[trend] || '稳定'
}

const getGrowthClass = () => {
  if (!props.trendData?.trendAnalysis) return 'neutral'
  const growth = props.trendData.trendAnalysis.growthRate
  if (growth > 0.05) return 'positive'
  if (growth < -0.05) return 'negative'
  return 'neutral'
}

const getCompareClass = (value: number) => {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'neutral'
}

const getInsights = () => {
  if (!props.trendData?.trendAnalysis) return []
  
  const insights = []
  const analysis = props.trendData.trendAnalysis
  
  // Trend insight
  if (analysis.trend === 'rising') {
    insights.push({
      title: '持续增长',
      description: `您的奖金呈现良好的增长趋势，增长率为 ${(analysis.growthRate * 100).toFixed(1)}%`,
      icon: 'Top',
      type: 'positive'
    })
  } else if (analysis.trend === 'declining') {
    insights.push({
      title: '需要关注',
      description: `奖金有下降趋势，建议分析原因并制定改进计划`,
      icon: 'Bottom',
      type: 'warning'
    })
  } else {
    insights.push({
      title: '表现稳定',
      description: `奖金水平保持相对稳定，可考虑寻找突破机会`,
      icon: 'Minus',
      type: 'info'
    })
  }
  
  // Volatility insight
  if (analysis.volatility > 5000) {
    insights.push({
      title: '波动较大',
      description: `奖金波动性较高，可能与项目参与或绩效变化相关`,
      icon: 'DataAnalysis',
      type: 'warning'
    })
  } else {
    insights.push({
      title: '表现稳健',
      description: `奖金波动性较小，表现稳定可预期`,
      icon: 'DataAnalysis',
      type: 'positive'
    })
  }
  
  // Best performance insight
  if (props.trendData.summary?.bestMonth?.amount > analysis.recentAverage * 1.2) {
    insights.push({
      title: '存在峰值',
      description: `${props.trendData.summary.bestMonth.period} 的表现特别突出，可分析成功因素`,
      icon: 'Trophy',
      type: 'info'
    })
  }
  
  return insights
}

// Chart functions
const updateChart = () => {
  if (!chartInstance || !props.trendData?.chartData) return
  
  const { periods, totalAmounts, regularBonuses, projectBonuses } = props.trendData.chartData
  
  let option: any = {
    title: {
      text: '奖金趋势分析',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: 'bold' }
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        let tooltip = `${params[0].axisValue}<br/>`
        params.forEach((param: any) => {
          tooltip += `${param.seriesName}: ¥${formatNumber(param.value)}<br/>`
        })
        return tooltip
      }
    },
    legend: {
      data: dataType.value === 'total' ? ['总奖金'] : ['基础奖金', '项目奖金'],
      bottom: 10
    },
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%',
      top: '15%'
    },
    xAxis: {
      type: 'category',
      data: periods,
      axisLabel: {
        rotate: 45,
        formatter: (value: string) => {
          // Format date for better readability
          return value.replace('-', '年') + '月'
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => {
          if (value >= 10000) {
            return (value / 10000).toFixed(1) + 'w'
          }
          return value.toString()
        }
      }
    },
    series: []
  }
  
  if (dataType.value === 'total') {
    // Show total amounts only
    const seriesConfig = {
      name: '总奖金',
      data: totalAmounts,
      smooth: true
    }
    
    if (chartType.value === 'line') {
      option.series.push({
        ...seriesConfig,
        type: 'line',
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 3, color: '#409EFF' },
        itemStyle: { color: '#409EFF' }
      })
    } else if (chartType.value === 'area') {
      option.series.push({
        ...seriesConfig,
        type: 'line',
        symbol: 'circle',
        symbolSize: 4,
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(64, 158, 255, 0.6)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
            ]
          }
        },
        lineStyle: { width: 2, color: '#409EFF' },
        itemStyle: { color: '#409EFF' }
      })
    } else {
      option.series.push({
        ...seriesConfig,
        type: 'bar',
        barWidth: '60%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#409EFF' },
              { offset: 1, color: '#79BBFF' }
            ]
          }
        }
      })
    }
  } else {
    // Show category breakdown
    const regularData = periods.map(period => {
      const regular = regularBonuses.find(r => r.period === period)
      return regular ? regular.amount : 0
    })
    
    const projectData = periods.map(period => {
      const project = projectBonuses.find(p => p.period === period)
      return project ? project.amount : 0
    })
    
    const baseConfig = {
      type: chartType.value === 'area' ? 'line' : chartType.value,
      stack: chartType.value === 'area' ? 'total' : undefined,
      smooth: chartType.value !== 'bar'
    }
    
    option.series.push(
      {
        ...baseConfig,
        name: '基础奖金',
        data: regularData,
        itemStyle: { color: '#67C23A' },
        areaStyle: chartType.value === 'area' ? { color: 'rgba(103, 194, 58, 0.3)' } : undefined
      },
      {
        ...baseConfig,
        name: '项目奖金',
        data: projectData,
        itemStyle: { color: '#E6A23C' },
        areaStyle: chartType.value === 'area' ? { color: 'rgba(230, 162, 60, 0.3)' } : undefined
      }
    )
  }
  
  chartInstance.setOption(option, true)
}

// Event handlers
const handlePeriodChange = (periods: number) => {
  emit('periodChange', periods)
}

const toggleDataType = () => {
  dataType.value = dataType.value === 'total' ? 'category' : 'total'
  updateChart()
}

const toggleDataTable = () => {
  showDataTable.value = !showDataTable.value
}

const exportChart = () => {
  if (chartInstance) {
    const url = chartInstance.getDataURL({
      type: 'png',
      backgroundColor: '#fff'
    })
    
    const link = document.createElement('a')
    link.download = '奖金趋势分析.png'
    link.href = url
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('图表导出成功')
  }
}

const exportData = () => {
  if (!tableData.value.length) return
  
  const headers = ['期间', '总奖金', '基础奖金', '项目奖金', '环比增长(%)', '同比增长(%)']
  const csvContent = [
    headers.join(','),
    ...tableData.value.map(row => [
      row.period,
      row.totalAmount,
      row.regularBonus,
      row.projectBonus,
      row.monthlyGrowth.toFixed(1),
      row.yearlyGrowth.toFixed(1)
    ].join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  link.download = '奖金历史数据.csv'
  link.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('数据导出成功')
}

const shareAnalysis = () => {
  if (!props.trendData) return
  
  const analysis = props.trendData.trendAnalysis
  const summary = props.trendData.summary
  
  const shareText = `我的奖金趋势分析:
趋势状态: ${getTrendLabel()}
增长率: ${(analysis.growthRate * 100).toFixed(1)}%
平均奖金: ¥${formatNumber(analysis.recentAverage)}
最佳表现: ¥${formatNumber(summary.bestMonth.amount)} (${summary.bestMonth.period})
分析期间: ${analysis.totalPeriods}个月`

  if (navigator.share) {
    navigator.share({
      title: '奖金趋势分析',
      text: shareText
    })
  } else {
    navigator.clipboard.writeText(shareText).then(() => {
      ElMessage.success('分析结果已复制到剪贴板')
    }).catch(() => {
      ElMessage.error('复制失败')
    })
  }
}

// Watchers
watch(() => props.trendData, () => {
  nextTick(() => {
    updateChart()
  })
}, { deep: true })

// Lifecycle
onMounted(() => {
  nextTick(() => {
    if (chartContainer.value) {
      chartInstance = echarts.init(chartContainer.value)
      updateChart()
      
      // Resize handler
      window.addEventListener('resize', () => {
        if (chartInstance) {
          chartInstance.resize()
        }
      })
    }
  })
})
</script>

<style scoped>
.historical-trends-chart {
  padding: 20px 0;
}

.chart-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.controls-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.loading-container {
  padding: 40px 20px;
}

.no-data {
  padding: 60px 20px;
  text-align: center;
}

.chart-content {
  width: 100%;
}

.trend-summary {
  margin-bottom: 24px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.summary-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s ease;
}

.summary-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.summary-card.trend-card.positive {
  border-left: 4px solid #67c23a;
}

.summary-card.trend-card.negative {
  border-left: 4px solid #f56c6c;
}

.summary-card.trend-card.neutral {
  border-left: 4px solid #e6a23c;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: #f0f9ff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 20px;
  color: #409eff;
}

.card-content {
  flex: 1;
}

.card-title {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.card-value {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.card-value.positive {
  color: #67c23a;
}

.card-value.negative {
  color: #f56c6c;
}

.card-value.neutral {
  color: #e6a23c;
}

.card-description {
  font-size: 12px;
  color: #c0c4cc;
}

.main-chart {
  width: 100%;
  height: 400px;
  margin-bottom: 24px;
}

.data-table {
  margin-bottom: 24px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.table-header h4 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.show-table-btn {
  text-align: center;
  margin-bottom: 24px;
}

.positive {
  color: #67c23a;
}

.negative {
  color: #f56c6c;
}

.neutral {
  color: #909399;
}

.insights-section {
  margin-bottom: 24px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.insights-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.insights-header h4 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.insights-period {
  font-size: 12px;
  color: #909399;
}

.insights-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.insight-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  background: white;
  border-radius: 6px;
}

.insight-icon {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 16px;
}

.insight-icon.positive {
  background: #f0f9ff;
  color: #67c23a;
}

.insight-icon.negative,
.insight-icon.warning {
  background: #fef0f0;
  color: #f56c6c;
}

.insight-icon.info {
  background: #f4f4f5;
  color: #909399;
}

.insight-content {
  flex: 1;
}

.insight-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.insight-description {
  font-size: 12px;
  color: #606266;
  line-height: 1.4;
}

.export-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

@media (max-width: 768px) {
  .historical-trends-chart {
    padding: 12px 0;
  }
  
  .chart-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .controls-left,
  .controls-right {
    justify-content: center;
  }
  
  .summary-cards {
    grid-template-columns: 1fr;
  }
  
  .main-chart {
    height: 300px;
  }
  
  .table-header {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .insights-content {
    gap: 8px;
  }
  
  .insight-item {
    padding: 8px;
  }
  
  .export-actions {
    flex-direction: column;
  }
}
</style>