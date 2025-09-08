<template>
  <div class="bonus-simulation">
    <!-- Simulation Controls -->
    <div class="simulation-controls">
      <div class="controls-header">
        <h4>参数调整</h4>
        <div class="control-actions">
          <el-button size="small" @click="resetSimulation">
            <el-icon><RefreshLeft /></el-icon>
            重置
          </el-button>
          <el-button size="small" type="primary" @click="runSimulation" :loading="simulationLoading">
            <el-icon><VideoPlay /></el-icon>
            运行模拟
          </el-button>
        </div>
      </div>

      <!-- Performance Adjustment -->
      <div class="control-group">
        <div class="control-label">
          <span>绩效调整</span>
          <el-tooltip content="调整个人绩效系数，范围: 0.5-1.5" placement="top">
            <el-icon class="help-icon"><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
        <div class="control-content">
          <el-slider
            v-model="simulationParams.performanceAdjustment"
            :min="0.5"
            :max="1.5"
            :step="0.1"
            :format-tooltip="formatPerformanceTooltip"
            @change="onParameterChange"
          />
          <div class="control-value">{{ simulationParams.performanceAdjustment.toFixed(1) }}</div>
        </div>
        <div class="control-description">
          当前: {{ formatMultiplier(simulationParams.performanceAdjustment) }}
        </div>
      </div>

      <!-- Profit Adjustment -->
      <div class="control-group">
        <div class="control-label">
          <span>利润贡献调整</span>
          <el-tooltip content="模拟利润贡献变化，范围: 0.8-1.2" placement="top">
            <el-icon class="help-icon"><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
        <div class="control-content">
          <el-slider
            v-model="simulationParams.profitAdjustment"
            :min="0.8"
            :max="1.2"
            :step="0.05"
            :format-tooltip="formatProfitTooltip"
            @change="onParameterChange"
          />
          <div class="control-value">{{ simulationParams.profitAdjustment.toFixed(2) }}</div>
        </div>
        <div class="control-description">
          当前: {{ formatMultiplier(simulationParams.profitAdjustment) }}
        </div>
      </div>

      <!-- Position Adjustment -->
      <div class="control-group">
        <div class="control-label">
          <span>岗位价值调整</span>
          <el-tooltip content="模拟岗位价值变化，范围: 0.9-1.1" placement="top">
            <el-icon class="help-icon"><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
        <div class="control-content">
          <el-slider
            v-model="simulationParams.positionAdjustment"
            :min="0.9"
            :max="1.1"
            :step="0.02"
            :format-tooltip="formatPositionTooltip"
            @change="onParameterChange"
          />
          <div class="control-value">{{ simulationParams.positionAdjustment.toFixed(2) }}</div>
        </div>
        <div class="control-description">
          当前: {{ formatMultiplier(simulationParams.positionAdjustment) }}
        </div>
      </div>

      <!-- Project Participation -->
      <div class="control-group">
        <div class="control-label">
          <span>项目参与</span>
          <el-tooltip content="模拟额外项目参与情况" placement="top">
            <el-icon class="help-icon"><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>
        <div class="control-content">
          <el-switch
            v-model="simulationParams.projectParticipation"
            active-text="参与"
            inactive-text="不参与"
            @change="onParameterChange"
          />
          <div class="project-controls" v-if="simulationParams.projectParticipation">
            <el-input-number
              v-model="simulationParams.additionalProjects"
              :min="0"
              :max="5"
              size="small"
              controls-position="right"
              @change="onParameterChange"
            />
            <span class="project-label">个额外项目</span>
          </div>
        </div>
      </div>

      <!-- Preset Scenarios -->
      <div class="preset-scenarios">
        <div class="scenarios-label">快速场景</div>
        <div class="scenarios-buttons">
          <el-button size="small" @click="applyScenario('conservative')">保守方案</el-button>
          <el-button size="small" @click="applyScenario('moderate')">稳健方案</el-button>
          <el-button size="small" @click="applyScenario('aggressive')">积极方案</el-button>
          <el-button size="small" @click="applyScenario('optimal')">最优方案</el-button>
        </div>
      </div>
    </div>

    <!-- Simulation Results -->
    <div class="simulation-results" v-if="simulationResults.length > 0">
      <div class="results-header">
        <h4>模拟结果</h4>
        <div class="results-summary">
          <span class="current-bonus">当前: ¥{{ formatNumber(currentBonus) }}</span>
          <span class="projected-bonus" :class="getDifferenceClass(bestScenario?.difference || 0)">
            最佳: ¥{{ formatNumber(bestScenario?.projectedBonus || 0) }}
          </span>
        </div>
      </div>

      <!-- Results Comparison Chart -->
      <div ref="resultsChart" class="results-chart"></div>

      <!-- Results Table -->
      <div class="results-table">
        <el-table :data="simulationResults" stripe size="small">
          <el-table-column prop="scenario" label="场景" width="120" />
          <el-table-column label="原始奖金" width="100">
            <template #default="scope">
              ¥{{ formatNumber(scope.row.originalBonus) }}
            </template>
          </el-table-column>
          <el-table-column label="预测奖金" width="100">
            <template #default="scope">
              ¥{{ formatNumber(scope.row.projectedBonus) }}
            </template>
          </el-table-column>
          <el-table-column label="差异" width="100">
            <template #default="scope">
              <span :class="getDifferenceClass(scope.row.difference)">
                {{ scope.row.difference >= 0 ? '+' : '' }}¥{{ formatNumber(scope.row.difference) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="变化率" width="80">
            <template #default="scope">
              <span :class="getDifferenceClass(scope.row.difference)">
                {{ scope.row.percentageChange >= 0 ? '+' : '' }}{{ scope.row.percentageChange.toFixed(1) }}%
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="说明" min-width="200" />
        </el-table>
      </div>
    </div>

    <!-- Real-time Preview -->
    <div class="realtime-preview" v-if="realtimeResult">
      <div class="preview-header">
        <h4>实时预览</h4>
        <div class="preview-toggle">
          <el-switch v-model="enableRealtime" active-text="实时更新" />
        </div>
      </div>
      
      <div class="preview-content">
        <div class="preview-cards">
          <div class="preview-card original">
            <div class="card-label">当前奖金</div>
            <div class="card-value">¥{{ formatNumber(currentBonus) }}</div>
          </div>
          
          <div class="preview-card projected">
            <div class="card-label">预测奖金</div>
            <div class="card-value">¥{{ formatNumber(realtimeResult.projectedBonus) }}</div>
          </div>
          
          <div class="preview-card difference" :class="getDifferenceClass(realtimeResult.difference)">
            <div class="card-label">差异</div>
            <div class="card-value">
              {{ realtimeResult.difference >= 0 ? '+' : '' }}¥{{ formatNumber(realtimeResult.difference) }}
              <span class="percentage">({{ realtimeResult.percentageChange >= 0 ? '+' : '' }}{{ realtimeResult.percentageChange.toFixed(1) }}%)</span>
            </div>
          </div>
        </div>

        <!-- Breakdown Comparison -->
        <div class="breakdown-comparison">
          <div class="comparison-item">
            <span class="item-name">利润贡献</span>
            <span class="original-value">¥{{ formatNumber(currentBreakdown.profitContribution) }}</span>
            <el-icon class="arrow-icon"><ArrowRight /></el-icon>
            <span class="projected-value">¥{{ formatNumber(realtimeResult.breakdown.profitContribution) }}</span>
          </div>
          
          <div class="comparison-item">
            <span class="item-name">岗位价值</span>
            <span class="original-value">¥{{ formatNumber(currentBreakdown.positionValue) }}</span>
            <el-icon class="arrow-icon"><ArrowRight /></el-icon>
            <span class="projected-value">¥{{ formatNumber(realtimeResult.breakdown.positionValue) }}</span>
          </div>
          
          <div class="comparison-item">
            <span class="item-name">绩效奖金</span>
            <span class="original-value">¥{{ formatNumber(currentBreakdown.performance) }}</span>
            <el-icon class="arrow-icon"><ArrowRight /></el-icon>
            <span class="projected-value">¥{{ formatNumber(realtimeResult.breakdown.performance) }}</span>
          </div>
          
          <div v-if="realtimeResult.breakdown.projectBonus && realtimeResult.breakdown.projectBonus > 0" class="comparison-item">
            <span class="item-name">项目奖金</span>
            <span class="original-value">¥{{ formatNumber(currentBreakdown.projectBonus || 0) }}</span>
            <el-icon class="arrow-icon"><ArrowRight /></el-icon>
            <span class="projected-value">¥{{ formatNumber(realtimeResult.breakdown.projectBonus) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Export and Actions -->
    <div class="simulation-actions">
      <el-button @click="exportResults" :disabled="simulationResults.length === 0">
        <el-icon><Download /></el-icon>
        导出结果
      </el-button>
      <el-button @click="saveScenario" :disabled="simulationResults.length === 0">
        <el-icon><FolderAdd /></el-icon>
        保存场景
      </el-button>
      <el-button type="primary" @click="applyOptimalScenario" :disabled="!bestScenario">
        <el-icon><Check /></el-icon>
        应用最佳方案
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  RefreshLeft, VideoPlay, QuestionFilled, ArrowRight,
  Download, FolderAdd, Check
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import {
  getBonusSimulation,
  type BonusBreakdown,
  type PersonalEmployee,
  type SimulationScenario,
  type SimulationResult
} from '@/api/personalBonus'

interface Props {
  currentBonus: number
  currentBreakdown: BonusBreakdown
  employee: PersonalEmployee | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  simulationRun: [results: SimulationResult[]]
}>()

// Reactive data
const simulationLoading = ref(false)
const enableRealtime = ref(true)
const resultsChart = ref<HTMLElement>()
let chartInstance: echarts.ECharts | null = null

// Simulation parameters
const simulationParams = reactive({
  performanceAdjustment: 1.0,
  profitAdjustment: 1.0,
  positionAdjustment: 1.0,
  projectParticipation: false,
  additionalProjects: 1
})

// Results
const simulationResults = ref<SimulationResult[]>([])
const realtimeResult = ref<SimulationResult | null>(null)

// Computed
const bestScenario = computed(() => {
  if (simulationResults.value.length === 0) return null
  return simulationResults.value.reduce((best, current) => 
    current.projectedBonus > best.projectedBonus ? current : best
  )
})

// Utility functions
const formatNumber = (num: number) => {
  return new Intl.NumberFormat('zh-CN').format(Math.round(num || 0))
}

const formatMultiplier = (value: number) => {
  const percentage = (value - 1) * 100
  if (percentage > 0) return `+${percentage.toFixed(1)}%`
  if (percentage < 0) return `${percentage.toFixed(1)}%`
  return '标准'
}

const formatPerformanceTooltip = (value: number) => {
  return `绩效系数: ${value.toFixed(1)} (${formatMultiplier(value)})`
}

const formatProfitTooltip = (value: number) => {
  return `利润调整: ${value.toFixed(2)} (${formatMultiplier(value)})`
}

const formatPositionTooltip = (value: number) => {
  return `岗位调整: ${value.toFixed(2)} (${formatMultiplier(value)})`
}

const getDifferenceClass = (difference: number) => {
  if (difference > 0) return 'positive'
  if (difference < 0) return 'negative'
  return 'neutral'
}

// Simulation functions
const calculateRealtimeResult = () => {
  if (!enableRealtime.value || !props.currentBreakdown) return

  const result: SimulationResult = {
    scenario: '实时预览',
    originalBonus: props.currentBonus,
    projectedBonus: 0,
    difference: 0,
    percentageChange: 0,
    breakdown: {
      profitContribution: props.currentBreakdown.profitContribution * simulationParams.profitAdjustment,
      positionValue: props.currentBreakdown.positionValue * simulationParams.positionAdjustment,
      performance: props.currentBreakdown.performance * simulationParams.performanceAdjustment,
      projectBonus: 0
    },
    description: '基于当前参数的实时预测'
  }

  // Add project bonus if enabled
  if (simulationParams.projectParticipation) {
    const averageProjectBonus = 8000 // Estimated average project bonus
    result.breakdown.projectBonus = averageProjectBonus * simulationParams.additionalProjects
  }

  result.projectedBonus = Object.values(result.breakdown).reduce((sum, value) => sum + (value || 0), 0)
  result.difference = result.projectedBonus - result.originalBonus
  result.percentageChange = props.currentBonus > 0 ? (result.difference / props.currentBonus) * 100 : 0

  realtimeResult.value = result
}

const runSimulation = async () => {
  if (!props.employee) {
    ElMessage.error('员工信息不完整，无法进行模拟')
    return
  }

  simulationLoading.value = true

  try {
    // Prepare simulation scenarios
    const scenarios: Record<string, SimulationScenario> = {
      current: {
        name: '当前状态',
        performanceAdjustment: 1.0,
        profitAdjustment: 1.0,
        positionAdjustment: 1.0,
        projectParticipation: false
      },
      adjusted: {
        name: '调整后',
        performanceAdjustment: simulationParams.performanceAdjustment,
        profitAdjustment: simulationParams.profitAdjustment,
        positionAdjustment: simulationParams.positionAdjustment,
        projectParticipation: simulationParams.projectParticipation,
        additionalProjects: simulationParams.additionalProjects
      }
    }

    const response = await getBonusSimulation(scenarios)
    simulationResults.value = response.data.scenarios || []
    
    // Update chart
    nextTick(() => {
      updateResultsChart()
    })

    emit('simulationRun', simulationResults.value)
    ElMessage.success('模拟运行成功')

  } catch (error) {
    console.error('Simulation failed:', error)
    ElMessage.error('模拟运行失败')
  } finally {
    simulationLoading.value = false
  }
}

const resetSimulation = () => {
  simulationParams.performanceAdjustment = 1.0
  simulationParams.profitAdjustment = 1.0
  simulationParams.positionAdjustment = 1.0
  simulationParams.projectParticipation = false
  simulationParams.additionalProjects = 1
  realtimeResult.value = null
  simulationResults.value = []
  
  if (chartInstance) {
    chartInstance.clear()
  }
}

const applyScenario = (scenario: string) => {
  const scenarios = {
    conservative: {
      performanceAdjustment: 0.9,
      profitAdjustment: 0.95,
      positionAdjustment: 1.0,
      projectParticipation: false,
      additionalProjects: 0
    },
    moderate: {
      performanceAdjustment: 1.1,
      profitAdjustment: 1.05,
      positionAdjustment: 1.02,
      projectParticipation: true,
      additionalProjects: 1
    },
    aggressive: {
      performanceAdjustment: 1.3,
      profitAdjustment: 1.15,
      positionAdjustment: 1.05,
      projectParticipation: true,
      additionalProjects: 3
    },
    optimal: {
      performanceAdjustment: 1.2,
      profitAdjustment: 1.1,
      positionAdjustment: 1.05,
      projectParticipation: true,
      additionalProjects: 2
    }
  }

  const config = scenarios[scenario]
  if (config) {
    Object.assign(simulationParams, config)
    ElMessage.success(`已应用${scenario === 'conservative' ? '保守' : scenario === 'moderate' ? '稳健' : scenario === 'aggressive' ? '积极' : '最优'}方案`)
  }
}

// Chart functions
const updateResultsChart = () => {
  if (!chartInstance || !resultsChart.value || simulationResults.value.length === 0) return

  const chartData = simulationResults.value.map(result => ({
    name: result.scenario,
    original: result.originalBonus,
    projected: result.projectedBonus
  }))

  const option = {
    title: {
      text: '模拟结果对比',
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        let tooltip = `${params[0].name}<br/>`
        params.forEach((param: any) => {
          tooltip += `${param.seriesName}: ¥${formatNumber(param.value)}<br/>`
        })
        return tooltip
      }
    },
    legend: {
      data: ['原始奖金', '预测奖金'],
      bottom: 5
    },
    xAxis: {
      type: 'category',
      data: chartData.map(item => item.name)
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
    series: [
      {
        name: '原始奖金',
        type: 'bar',
        data: chartData.map(item => item.original),
        itemStyle: { color: '#909399' }
      },
      {
        name: '预测奖金',
        type: 'bar',
        data: chartData.map(item => item.projected),
        itemStyle: { color: '#409eff' }
      }
    ],
    grid: { left: '10%', right: '10%', bottom: '15%', top: '15%' }
  }

  chartInstance.setOption(option, true)
}

// Event handlers
const onParameterChange = () => {
  if (enableRealtime.value) {
    calculateRealtimeResult()
  }
}

const exportResults = () => {
  if (simulationResults.value.length === 0) return

  const data = simulationResults.value.map(result => ({
    场景: result.scenario,
    原始奖金: result.originalBonus,
    预测奖金: result.projectedBonus,
    差异: result.difference,
    变化率: result.percentageChange.toFixed(1) + '%',
    说明: result.description
  }))

  const csv = [
    Object.keys(data[0]).join(','),
    ...data.map(row => Object.values(row).join(','))
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  link.download = '奖金模拟结果.csv'
  link.click()
  URL.revokeObjectURL(url)

  ElMessage.success('模拟结果已导出')
}

const saveScenario = () => {
  ElMessageBox.prompt('请输入场景名称', '保存场景', {
    confirmButtonText: '保存',
    cancelButtonText: '取消',
    inputPlaceholder: '例如: 我的优化方案'
  }).then(({ value }) => {
    if (value) {
      // Save scenario logic here
      ElMessage.success(`场景 "${value}" 已保存`)
    }
  }).catch(() => {
    // User cancelled
  })
}

const applyOptimalScenario = () => {
  if (!bestScenario.value) return

  ElMessageBox.confirm(
    `确定要应用最佳方案吗？预计奖金将变为 ¥${formatNumber(bestScenario.value.projectedBonus)}`,
    '应用最佳方案',
    {
      confirmButtonText: '确定应用',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    ElMessage.success('最佳方案应用成功（这是模拟功能）')
  }).catch(() => {
    // User cancelled
  })
}

// Watchers
watch([
  () => simulationParams.performanceAdjustment,
  () => simulationParams.profitAdjustment,
  () => simulationParams.positionAdjustment,
  () => simulationParams.projectParticipation,
  () => simulationParams.additionalProjects
], () => {
  onParameterChange()
}, { deep: true })

// Lifecycle
onMounted(() => {
  nextTick(() => {
    if (resultsChart.value) {
      chartInstance = echarts.init(resultsChart.value)
    }
    calculateRealtimeResult()
  })
})
</script>

<style scoped>
.bonus-simulation {
  padding: 20px 0;
}

.simulation-controls {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.controls-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.controls-header h4 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.control-actions {
  display: flex;
  gap: 8px;
}

.control-group {
  margin-bottom: 24px;
}

.control-label {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.help-icon {
  margin-left: 4px;
  color: #909399;
  cursor: help;
}

.control-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.control-content .el-slider {
  flex: 1;
}

.control-value {
  min-width: 40px;
  text-align: center;
  font-weight: bold;
  color: #409eff;
}

.control-description {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.project-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.project-label {
  font-size: 12px;
  color: #606266;
}

.preset-scenarios {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.scenarios-label {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 12px;
}

.scenarios-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.simulation-results {
  margin-bottom: 24px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.results-header h4 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.results-summary {
  display: flex;
  gap: 16px;
  align-items: center;
}

.current-bonus {
  font-size: 14px;
  color: #606266;
}

.projected-bonus {
  font-size: 14px;
  font-weight: bold;
}

.projected-bonus.positive {
  color: #67c23a;
}

.projected-bonus.negative {
  color: #f56c6c;
}

.results-chart {
  height: 300px;
  margin-bottom: 20px;
}

.results-table {
  border-radius: 8px;
  overflow: hidden;
}

.positive {
  color: #67c23a;
}

.negative {
  color: #f56c6c;
}

.neutral {
  color: #606266;
}

.realtime-preview {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 24px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.preview-header h4 {
  margin: 0;
  color: white;
  font-size: 16px;
  font-weight: 600;
}

.preview-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.preview-card {
  background: rgba(255, 255, 255, 0.1);
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.card-label {
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.card-value {
  font-size: 18px;
  font-weight: bold;
}

.percentage {
  font-size: 12px;
  opacity: 0.9;
}

.preview-card.difference.positive .card-value {
  color: #a7f3d0;
}

.preview-card.difference.negative .card-value {
  color: #fca5a5;
}

.breakdown-comparison {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comparison-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.1);
  padding: 12px 16px;
  border-radius: 6px;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  flex: 1;
}

.original-value,
.projected-value {
  font-size: 13px;
  font-weight: bold;
}

.original-value {
  opacity: 0.7;
}

.arrow-icon {
  margin: 0 8px;
  opacity: 0.6;
}

.simulation-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

@media (max-width: 768px) {
  .bonus-simulation {
    padding: 12px 0;
  }
  
  .simulation-controls {
    padding: 16px;
  }
  
  .controls-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .control-actions {
    justify-content: space-between;
  }
  
  .control-content {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .scenarios-buttons {
    flex-direction: column;
  }
  
  .results-header {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .results-summary {
    justify-content: space-between;
  }
  
  .preview-cards {
    grid-template-columns: 1fr;
  }
  
  .comparison-item {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
  
  .simulation-actions {
    flex-direction: column;
  }
}
</style>