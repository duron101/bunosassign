<template>
  <div class="three-dimensional-breakdown">
    <!-- Loading State -->
    <div v-if="loading" class="loading-skeleton">
      <el-skeleton :rows="4" animated />
    </div>
    
    <!-- Main Content -->
    <div v-else class="breakdown-content">
      <!-- Chart Controls -->
      <div class="chart-controls">
        <el-radio-group v-model="chartType" size="small" @change="updateChart">
          <el-radio-button label="pie">饼图</el-radio-button>
          <el-radio-button label="donut">环形图</el-radio-button>
          <el-radio-button label="bar">柱状图</el-radio-button>
        </el-radio-group>
      </div>

      <!-- Interactive Chart -->
      <div ref="chartContainer" class="chart-container"></div>

      <!-- Breakdown Details -->
      <div class="breakdown-details">
        <div class="details-header">
          <h4>奖金构成明细</h4>
          <div class="total-amount">总计: ¥{{ formatNumber(total) }}</div>
        </div>
        
        <div class="details-list">
          <!-- Profit Contribution -->
          <div class="detail-item profit" @click="highlightSegment('profit')" :class="{ active: highlightedSegment === 'profit' }">
            <div class="item-icon">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="item-content">
              <div class="item-header">
                <span class="item-name">利润贡献奖金</span>
                <span class="item-amount">¥{{ formatNumber(breakdown.profitContribution) }}</span>
              </div>
              <div class="item-details">
                <div class="item-percentage">{{ getProfitPercentage() }}%</div>
                <div class="item-description">基于公司整体利润分配</div>
              </div>
              <el-progress 
                :percentage="getProfitPercentage()" 
                :stroke-width="6" 
                :show-text="false"
                color="#f093fb"
              />
            </div>
          </div>

          <!-- Position Value -->
          <div class="detail-item position" @click="highlightSegment('position')" :class="{ active: highlightedSegment === 'position' }">
            <div class="item-icon">
              <el-icon><Trophy /></el-icon>
            </div>
            <div class="item-content">
              <div class="item-header">
                <span class="item-name">岗位价值奖金</span>
                <span class="item-amount">¥{{ formatNumber(breakdown.positionValue) }}</span>
              </div>
              <div class="item-details">
                <div class="item-percentage">{{ getPositionPercentage() }}%</div>
                <div class="item-description">基于岗位基准价值评估</div>
              </div>
              <el-progress 
                :percentage="getPositionPercentage()" 
                :stroke-width="6" 
                :show-text="false"
                color="#4facfe"
              />
            </div>
          </div>

          <!-- Performance -->
          <div class="detail-item performance" @click="highlightSegment('performance')" :class="{ active: highlightedSegment === 'performance' }">
            <div class="item-icon">
              <el-icon><Medal /></el-icon>
            </div>
            <div class="item-content">
              <div class="item-header">
                <span class="item-name">绩效奖金</span>
                <span class="item-amount">¥{{ formatNumber(breakdown.performance) }}</span>
              </div>
              <div class="item-details">
                <div class="item-percentage">{{ getPerformancePercentage() }}%</div>
                <div class="item-description">基于个人绩效表现</div>
              </div>
              <el-progress 
                :percentage="getPerformancePercentage()" 
                :stroke-width="6" 
                :show-text="false"
                color="#43e97b"
              />
            </div>
          </div>

          <!-- Project Bonus (if exists) -->
          <div v-if="breakdown.projectBonus && breakdown.projectBonus > 0" 
               class="detail-item project" 
               @click="highlightSegment('project')" 
               :class="{ active: highlightedSegment === 'project' }">
            <div class="item-icon">
              <el-icon><FolderOpened /></el-icon>
            </div>
            <div class="item-content">
              <div class="item-header">
                <span class="item-name">项目奖金</span>
                <span class="item-amount">¥{{ formatNumber(breakdown.projectBonus) }}</span>
              </div>
              <div class="item-details">
                <div class="item-percentage">{{ getProjectPercentage() }}%</div>
                <div class="item-description">项目参与额外奖金</div>
              </div>
              <el-progress 
                :percentage="getProjectPercentage()" 
                :stroke-width="6" 
                :show-text="false"
                color="#e6a23c"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Insights -->
      <div class="insights-section">
        <h4>数据洞察</h4>
        <div class="insights-grid">
          <div class="insight-card">
            <div class="insight-icon">
              <el-icon><PieChart /></el-icon>
            </div>
            <div class="insight-content">
              <div class="insight-title">主要构成</div>
              <div class="insight-value">{{ getDominantComponent() }}</div>
            </div>
          </div>
          
          <div class="insight-card">
            <div class="insight-icon">
              <el-icon><DataAnalysis /></el-icon>
            </div>
            <div class="insight-content">
              <div class="insight-title">均衡度</div>
              <div class="insight-value">{{ getBalanceScore() }}</div>
            </div>
          </div>
          
          <div class="insight-card">
            <div class="insight-icon">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="insight-content">
              <div class="insight-title">改进建议</div>
              <div class="insight-value">{{ getImprovementTip() }}</div>
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
        <el-button size="small" @click="shareBreakdown">
          <el-icon><Share /></el-icon>
          分享分析
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  TrendCharts, Trophy, Medal, FolderOpened, PieChart, DataAnalysis,
  Download, Share
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { BonusBreakdown } from '@/api/personalBonus'

interface Props {
  breakdown: BonusBreakdown
  total: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// Reactive data
const chartType = ref('donut')
const highlightedSegment = ref('')
const chartContainer = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

// Chart colors
const colors = {
  profit: '#f093fb',
  position: '#4facfe', 
  performance: '#43e97b',
  project: '#e6a23c'
}

// Utility functions
const formatNumber = (num: number) => {
  return new Intl.NumberFormat('zh-CN').format(num || 0)
}

const getProfitPercentage = () => {
  return props.total > 0 ? Math.round((props.breakdown.profitContribution / props.total) * 100) : 0
}

const getPositionPercentage = () => {
  return props.total > 0 ? Math.round((props.breakdown.positionValue / props.total) * 100) : 0
}

const getPerformancePercentage = () => {
  return props.total > 0 ? Math.round((props.breakdown.performance / props.total) * 100) : 0
}

const getProjectPercentage = () => {
  if (!props.breakdown.projectBonus) return 0
  return props.total > 0 ? Math.round((props.breakdown.projectBonus / props.total) * 100) : 0
}

const getDominantComponent = () => {
  const components = [
    { name: '利润贡献', value: props.breakdown.profitContribution },
    { name: '岗位价值', value: props.breakdown.positionValue },
    { name: '绩效奖金', value: props.breakdown.performance }
  ]
  
  if (props.breakdown.projectBonus && props.breakdown.projectBonus > 0) {
    components.push({ name: '项目奖金', value: props.breakdown.projectBonus })
  }
  
  const max = components.reduce((prev, current) => 
    (prev.value > current.value) ? prev : current
  )
  
  return max.name
}

const getBalanceScore = () => {
  const values = [
    props.breakdown.profitContribution,
    props.breakdown.positionValue,
    props.breakdown.performance
  ]
  
  if (props.breakdown.projectBonus && props.breakdown.projectBonus > 0) {
    values.push(props.breakdown.projectBonus)
  }
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)
  const cv = mean > 0 ? stdDev / mean : 0
  
  if (cv < 0.3) return '均衡'
  if (cv < 0.6) return '一般'
  return '不均衡'
}

const getImprovementTip = () => {
  const percentages = [
    { name: '绩效', value: getPerformancePercentage() },
    { name: '岗位价值', value: getPositionPercentage() },
    { name: '利润贡献', value: getProfitPercentage() }
  ]
  
  const lowest = percentages.reduce((prev, current) => 
    (prev.value < current.value) ? prev : current
  )
  
  return `提升${lowest.name}`
}

// Chart functions
const updateChart = () => {
  if (!chartInstance || !chartContainer.value) return
  
  const chartData = [
    { name: '利润贡献', value: props.breakdown.profitContribution, color: colors.profit },
    { name: '岗位价值', value: props.breakdown.positionValue, color: colors.position },
    { name: '绩效奖金', value: props.breakdown.performance, color: colors.performance }
  ]
  
  if (props.breakdown.projectBonus && props.breakdown.projectBonus > 0) {
    chartData.push({ 
      name: '项目奖金', 
      value: props.breakdown.projectBonus, 
      color: colors.project 
    })
  }
  
  let option: any = {}
  
  if (chartType.value === 'bar') {
    option = {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = params[0]
          const percentage = props.total > 0 ? ((data.value / props.total) * 100).toFixed(1) : '0.0'
          return `${data.name}<br/>金额: ¥${formatNumber(data.value)}<br/>占比: ${percentage}%`
        }
      },
      xAxis: {
        type: 'category',
        data: chartData.map(item => item.name),
        axisLabel: {
          rotate: 45,
          fontSize: 12
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
      series: [{
        data: chartData.map(item => ({
          value: item.value,
          itemStyle: { color: item.color }
        })),
        type: 'bar',
        barWidth: '60%',
        label: {
          show: true,
          position: 'top',
          formatter: (params: any) => {
            const percentage = props.total > 0 ? ((params.value / props.total) * 100).toFixed(1) : '0.0'
            return `${percentage}%`
          }
        }
      }],
      grid: {
        left: '10%',
        right: '10%',
        bottom: '20%',
        top: '10%'
      }
    }
  } else {
    // Pie or Donut chart
    const radius = chartType.value === 'donut' ? ['40%', '70%'] : ['0%', '70%']
    
    option = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `${params.name}<br/>金额: ¥${formatNumber(params.value)}<br/>占比: ${params.percent}%`
        }
      },
      legend: {
        orient: 'horizontal',
        bottom: '5%',
        itemGap: 20
      },
      series: [{
        type: 'pie',
        radius: radius,
        center: ['50%', '45%'],
        data: chartData.map(item => ({
          name: item.name,
          value: item.value,
          itemStyle: { color: item.color }
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          formatter: '{b}\n{d}%',
          fontSize: 12
        }
      }]
    }
  }
  
  chartInstance.setOption(option, true)
}

const highlightSegment = (segment: string) => {
  highlightedSegment.value = highlightedSegment.value === segment ? '' : segment
  
  if (chartInstance) {
    // Highlight corresponding chart segment
    const segmentMap = {
      profit: 0,
      position: 1,
      performance: 2,
      project: 3
    }
    
    const index = segmentMap[segment]
    if (index !== undefined) {
      if (highlightedSegment.value === segment) {
        chartInstance.dispatchAction({
          type: 'highlight',
          seriesIndex: 0,
          dataIndex: index
        })
      } else {
        chartInstance.dispatchAction({
          type: 'downplay',
          seriesIndex: 0,
          dataIndex: index
        })
      }
    }
  }
}

const exportChart = () => {
  if (chartInstance) {
    const url = chartInstance.getDataURL({
      type: 'png',
      backgroundColor: '#fff'
    })
    
    const link = document.createElement('a')
    link.download = '奖金构成分析.png'
    link.href = url
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('图表导出成功')
  }
}

const shareBreakdown = () => {
  const text = `我的奖金构成分析:
利润贡献: ¥${formatNumber(props.breakdown.profitContribution)} (${getProfitPercentage()}%)
岗位价值: ¥${formatNumber(props.breakdown.positionValue)} (${getPositionPercentage()}%)
绩效奖金: ¥${formatNumber(props.breakdown.performance)} (${getPerformancePercentage()}%)
总计: ¥${formatNumber(props.total)}`
  
  if (navigator.share) {
    navigator.share({
      title: '奖金构成分析',
      text: text
    })
  } else {
    navigator.clipboard.writeText(text).then(() => {
      ElMessage.success('分析数据已复制到剪贴板')
    }).catch(() => {
      ElMessage.error('复制失败')
    })
  }
}

// Watchers
watch(() => props.breakdown, () => {
  nextTick(() => {
    updateChart()
  })
}, { deep: true })

watch(() => props.total, () => {
  nextTick(() => {
    updateChart()
  })
})

// Lifecycle
onMounted(() => {
  nextTick(() => {
    if (chartContainer.value) {
      chartInstance = echarts.init(chartContainer.value)
      updateChart()
      
      // Add chart click event
      chartInstance.on('click', (params: any) => {
        const segmentMap = ['profit', 'position', 'performance', 'project']
        const segment = segmentMap[params.dataIndex]
        if (segment) {
          highlightSegment(segment)
        }
      })
    }
  })
})
</script>

<style scoped>
.three-dimensional-breakdown {
  padding: 20px 0;
}

.loading-skeleton {
  padding: 20px;
}

.chart-controls {
  margin-bottom: 20px;
  text-align: center;
}

.chart-container {
  width: 100%;
  height: 300px;
  margin-bottom: 24px;
}

.breakdown-details {
  margin-bottom: 24px;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #f0f0f0;
}

.details-header h4 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.total-amount {
  font-size: 16px;
  font-weight: bold;
  color: #409eff;
}

.details-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
}

.detail-item:hover {
  background: #e3f2fd;
  border-color: #409eff;
  transform: translateY(-2px);
}

.detail-item.active {
  background: #e3f2fd;
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.item-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 20px;
  color: white;
}

.detail-item.profit .item-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.detail-item.position .item-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.detail-item.performance .item-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.detail-item.project .item-icon {
  background: linear-gradient(135deg, #ffd54f 0%, #ff8f00 100%);
}

.item-content {
  flex: 1;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.item-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.item-amount {
  font-size: 16px;
  font-weight: bold;
  color: #409eff;
}

.item-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.item-percentage {
  font-size: 14px;
  font-weight: 600;
  color: #67c23a;
}

.item-description {
  font-size: 12px;
  color: #909399;
}

.insights-section {
  margin-bottom: 24px;
}

.insights-section h4 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.insight-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
}

.insight-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 18px;
}

.insight-content {
  flex: 1;
}

.insight-title {
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.insight-value {
  font-size: 14px;
  font-weight: 600;
}

.export-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

@media (max-width: 768px) {
  .three-dimensional-breakdown {
    padding: 12px 0;
  }
  
  .chart-container {
    height: 250px;
  }
  
  .details-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
  
  .detail-item {
    flex-direction: column;
    text-align: center;
    padding: 12px;
  }
  
  .item-icon {
    margin: 0 0 12px 0;
  }
  
  .insights-grid {
    grid-template-columns: 1fr;
  }
  
  .export-actions {
    flex-direction: column;
  }
}
</style>