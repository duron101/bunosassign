<template>
  <div class="simulation-analysis">
    <div class="page-header">
      <h2>模拟分析</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateScenarioDialog">
          <el-icon><Plus /></el-icon>
          新建场景
        </el-button>
        <el-button @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 功能导航 -->
    <el-card class="nav-card">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="参数模拟" name="parameter">
          <el-icon><Setting /></el-icon>
        </el-tab-pane>
        <el-tab-pane label="场景对比" name="comparison">
          <el-icon><DataAnalysis /></el-icon>
        </el-tab-pane>
        <el-tab-pane label="敏感性分析" name="sensitivity">
          <el-icon><TrendCharts /></el-icon>
        </el-tab-pane>
        <el-tab-pane label="历史分析" name="history">
          <el-icon><Clock /></el-icon>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 参数模拟 -->
    <div v-if="activeTab === 'parameter'" class="parameter-simulation">
      <el-row :gutter="20">
        <!-- 左侧参数调整区 -->
        <el-col :span="8">
          <el-card class="parameter-card" header="参数调整">
            <el-form :model="simulationParams" label-width="120px">
              <el-divider content-position="left">基础参数</el-divider>
              
              <el-form-item label="奖金池">
                <el-select 
                  v-model="simulationParams.bonusPoolId" 
                  placeholder="请选择奖金池"
                  @change="handlePoolChange"
                >
                  <el-option
                    v-for="pool in bonusPools"
                    :key="pool.id"
                    :label="`${pool.period} - ¥${formatNumber(pool.distributableAmount)}`"
                    :value="pool.id"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="公司利润">
                <el-input-number
                  v-model="simulationParams.totalProfit"
                  :min="0"
                  :step="100000"
                  :precision="0"
                  controls-position="right"
                  style="width: 100%"
                  @change="calculateImpact"
                />
                <div class="param-change" v-if="currentPool">
                  <span :class="getProfitChangeClass()">
                    {{ getProfitChangeText() }}
                  </span>
                </div>
              </el-form-item>

              <el-form-item label="奖金池比例">
                <el-slider
                  v-model="simulationParams.poolRatio"
                  :min="0.05"
                  :max="0.3"
                  :step="0.005"
                  :format-tooltip="val => `${(val * 100).toFixed(1)}%`"
                  @change="calculateImpact"
                />
                <div class="slider-value">{{ (simulationParams.poolRatio * 100).toFixed(1) }}%</div>
              </el-form-item>

              <el-divider content-position="left">条线权重</el-divider>
              
              <el-form-item 
                v-for="line in businessLines" 
                :key="line._id || line.id" 
                :label="line.name"
              >
                <el-slider
                  v-model="simulationParams.lineWeights[line._id || line.id]"
                  :min="0.05"
                  :max="0.7"
                  :step="0.05"
                  :format-tooltip="val => `${(val * 100).toFixed(0)}%`"
                  @change="normalizeWeights"
                />
                <div class="slider-value">{{ (simulationParams.lineWeights[line._id || line.id] * 100).toFixed(0) }}%</div>
              </el-form-item>

              <div class="weight-validation">
                <span :class="getWeightValidationClass()">
                  总权重: {{ getTotalWeight() }}%
                </span>
              </div>

              <el-divider content-position="left">高级选项</el-divider>

              <el-form-item label="保底系数">
                <el-slider
                  v-model="simulationParams.minBonusRatio"
                  :min="0.5"
                  :max="1.2"
                  :step="0.1"
                  :format-tooltip="val => `${val.toFixed(1)}x`"
                  @change="calculateImpact"
                />
                <div class="slider-value">{{ simulationParams.minBonusRatio.toFixed(1) }}x</div>
              </el-form-item>

              <el-form-item label="上限系数">
                <el-slider
                  v-model="simulationParams.maxBonusRatio"
                  :min="2.0"
                  :max="5.0"
                  :step="0.1"
                  :format-tooltip="val => `${val.toFixed(1)}x`"
                  @change="calculateImpact"
                />
                <div class="slider-value">{{ simulationParams.maxBonusRatio.toFixed(1) }}x</div>
              </el-form-item>

              <el-form-item>
                <el-button 
                  type="primary" 
                  @click="runSimulation"
                  :loading="simulating"
                  style="width: 100%"
                >
                  运行模拟
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>

        <!-- 右侧结果展示区 -->
        <el-col :span="16">
          <el-card class="result-card" header="模拟结果">
            <div v-if="simulationResult">
              <!-- 影响概览 -->
              <div class="impact-overview">
                <el-row :gutter="20">
                  <el-col :span="8">
                    <div class="impact-item">
                      <div class="impact-value" :class="getImpactClass(simulationResult.totalBonusChange)">
                        {{ formatPercentage(simulationResult.totalBonusChange) }}
                      </div>
                      <div class="impact-label">总奖金变化</div>
                    </div>
                  </el-col>
                  <el-col :span="8">
                    <div class="impact-item">
                      <div class="impact-value" :class="getImpactClass(simulationResult.avgBonusChange)">
                        {{ formatPercentage(simulationResult.avgBonusChange) }}
                      </div>
                      <div class="impact-label">人均奖金变化</div>
                    </div>
                  </el-col>
                  <el-col :span="8">
                    <div class="impact-item">
                      <div class="impact-value">
                        {{ simulationResult.affectedEmployees }}人
                      </div>
                      <div class="impact-label">受影响员工</div>
                    </div>
                  </el-col>
                </el-row>
              </div>

              <!-- 条线影响图表 -->
              <el-divider content-position="left">条线影响分析</el-divider>
              <div class="chart-container">
                <div ref="lineImpactChart" class="chart" style="height: 300px;"></div>
              </div>

              <!-- 奖金分布变化 -->
              <el-divider content-position="left">奖金分布变化</el-divider>
              <div class="distribution-comparison">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <div class="distribution-chart">
                      <h4>当前分布</h4>
                      <div ref="currentDistChart" class="chart" style="height: 250px;"></div>
                    </div>
                  </el-col>
                  <el-col :span="12">
                    <div class="distribution-chart">
                      <h4>模拟分布</h4>
                      <div ref="simDistChart" class="chart" style="height: 250px;"></div>
                    </div>
                  </el-col>
                </el-row>
              </div>

              <!-- 详细对比表 -->
              <el-divider content-position="left">详细对比</el-divider>
              <el-table :data="simulationResult.lineComparison" stripe>
                <el-table-column prop="lineName" label="业务线" />
                <el-table-column label="当前奖金">
                  <template #default="{ row }">
                    ¥{{ formatNumber(row.currentBonus) }}
                  </template>
                </el-table-column>
                <el-table-column label="模拟奖金">
                  <template #default="{ row }">
                    ¥{{ formatNumber(row.simulatedBonus) }}
                  </template>
                </el-table-column>
                <el-table-column label="变化金额">
                  <template #default="{ row }">
                    <span :class="getImpactClass(row.change)">
                      {{ row.change > 0 ? '+' : '' }}¥{{ formatNumber(Math.abs(row.changAmount)) }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="变化率">
                  <template #default="{ row }">
                    <span :class="getImpactClass(row.change)">
                      {{ formatPercentage(row.change) }}
                    </span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            
            <div v-else class="no-result">
              <el-empty description="请调整参数并运行模拟" />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 场景对比 -->
    <div v-if="activeTab === 'comparison'" class="scenario-comparison">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card header="保存的场景">
            <div class="scenario-list">
              <div 
                v-for="scenario in savedScenarios" 
                :key="scenario.id"
                class="scenario-item"
                :class="{ active: selectedScenarios.includes(scenario.id) }"
                @click="toggleScenario(scenario.id)"
              >
                <div class="scenario-header">
                  <span class="scenario-name">{{ scenario.name }}</span>
                  <el-checkbox 
                    :model-value="selectedScenarios.includes(scenario.id)"
                    @change="toggleScenario(scenario.id)"
                  />
                </div>
                <div class="scenario-desc">{{ scenario.description }}</div>
                <div class="scenario-meta">
                  创建于: {{ formatDate(scenario.createdAt) }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="18">
          <el-card header="场景对比分析">
            <div v-if="selectedScenarios.length > 0">
              <!-- 对比雷达图 -->
              <div class="comparison-radar">
                <div ref="comparisonRadarChart" class="chart" style="height: 400px;"></div>
              </div>

              <!-- 对比表格 -->
              <el-table :data="comparisonData" stripe class="comparison-table">
                <el-table-column prop="metric" label="指标" fixed />
                <el-table-column 
                  v-for="scenario in getSelectedScenariosData()" 
                  :key="scenario.id"
                  :label="scenario.name"
                  min-width="120"
                >
                  <template #default="{ row }">
                    <span :class="getComparisonValueClass(row.values[scenario.id], row.type)">
                      {{ formatComparisonValue(row.values[scenario.id], row.type) }}
                    </span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            
            <div v-else class="no-comparison">
              <el-empty description="请至少选择一个场景进行对比" />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 敏感性分析 -->
    <div v-if="activeTab === 'sensitivity'" class="sensitivity-analysis">
      <el-card header="敏感性分析">
        <div class="sensitivity-controls">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="分析参数">
                <el-select v-model="sensitivityParams.parameter" @change="runSensitivityAnalysisFunc">
                  <el-option label="公司利润" value="totalProfit" />
                  <el-option label="奖金池比例" value="poolRatio" />
                  <el-option 
                    v-for="line in businessLines" 
                    :key="line._id || line.id"
                    :label="`${line.name}条线权重`" 
                    :value="`lineWeight_${line._id || line.id}`" 
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="变化范围">
                <el-select v-model="sensitivityParams.range" @change="runSensitivityAnalysisFunc">
                  <el-option label="±10%" value="0.1" />
                  <el-option label="±20%" value="0.2" />
                  <el-option label="±30%" value="0.3" />
                  <el-option label="±50%" value="0.5" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="步长">
                <el-select v-model="sensitivityParams.step" @change="runSensitivityAnalysisFunc">
                  <el-option label="2%" value="0.02" />
                  <el-option label="5%" value="0.05" />
                  <el-option label="10%" value="0.1" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-button type="primary" @click="runSensitivityAnalysisFunc" :loading="analyzing">
                分析
              </el-button>
            </el-col>
          </el-row>
        </div>

        <div v-if="sensitivityResult" class="sensitivity-result">
          <div class="sensitivity-chart">
            <div ref="sensitivityChart" class="chart" style="height: 400px;"></div>
          </div>
          
          <div class="sensitivity-summary">
            <el-descriptions title="敏感性摘要" :column="2" border>
              <el-descriptions-item label="最敏感指标">
                {{ sensitivityResult.mostSensitive.metric }}
              </el-descriptions-item>
              <el-descriptions-item label="敏感度系数">
                {{ sensitivityResult.mostSensitive.coefficient.toFixed(3) }}
              </el-descriptions-item>
              <el-descriptions-item label="建议变化范围">
                {{ sensitivityResult.recommendedRange }}
              </el-descriptions-item>
              <el-descriptions-item label="风险等级">
                <el-tag :type="getRiskLevelType(sensitivityResult.riskLevel)">
                  {{ sensitivityResult.riskLevel }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 历史分析 -->
    <div v-if="activeTab === 'history'" class="history-analysis">
      <el-card header="历史数据分析">
        <div class="history-controls">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-date-picker
                v-model="historyParams.dateRange"
                type="monthrange"
                range-separator="至"
                start-placeholder="开始月份"
                end-placeholder="结束月份"
                @change="loadHistoryData"
              />
            </el-col>
            <el-col :span="6">
              <el-select v-model="historyParams.metric" @change="updateHistoryChart">
                <el-option label="总奖金" value="totalBonus" />
                <el-option label="人均奖金" value="avgBonus" />
                <el-option label="奖金池利用率" value="utilizationRate" />
              </el-select>
            </el-col>
          </el-row>
        </div>

        <div v-if="historyData" class="history-result">
          <div class="history-chart">
            <div ref="historyChart" class="chart" style="height: 400px;"></div>
          </div>
          
          <div class="history-insights">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-statistic title="平均增长率" :value="historyData.avgGrowthRate" suffix="%" />
              </el-col>
              <el-col :span="8">
                <el-statistic title="最大波动" :value="historyData.maxVolatility" suffix="%" />
              </el-col>
              <el-col :span="8">
                <el-statistic title="趋势预测" :value="historyData.trendPrediction" suffix="%" />
              </el-col>
            </el-row>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 创建场景对话框 -->
    <el-dialog
      v-model="createScenarioVisible"
      title="创建模拟场景"
      width="500px"
    >
      <el-form :model="scenarioForm" label-width="100px">
        <el-form-item label="场景名称" required>
          <el-input v-model="scenarioForm.name" placeholder="请输入场景名称" />
        </el-form-item>
        <el-form-item label="场景描述">
          <el-input 
            v-model="scenarioForm.description" 
            type="textarea" 
            rows="3"
            placeholder="请输入场景描述"
          />
        </el-form-item>
        <el-form-item label="基于奖金池">
          <el-select v-model="scenarioForm.basePoolId" placeholder="请选择基础奖金池">
            <el-option
              v-for="pool in bonusPools"
              :key="pool.id"
              :label="pool.period"
              :value="pool.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="公开场景">
          <el-switch v-model="scenarioForm.isPublic" />
          <span class="form-help">其他用户可查看此场景</span>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="createScenarioVisible = false">取消</el-button>
        <el-button type="primary" @click="createScenario" :loading="creating">
          创建
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Plus, Refresh, Setting, DataAnalysis, TrendCharts, Clock 
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { 
  runParameterSimulation,
  getSimulationScenarios,
  saveSimulationScenario,
  deleteSimulationScenario,
  runSensitivityAnalysis,
  getHistoryAnalysis
} from '@/api/simulation'
import { getBonusPools } from '@/api/calculation'
import { businessLineApi } from '@/api/businessLine'

// 响应式数据
const loading = ref(false)
const simulating = ref(false)
const analyzing = ref(false)
const creating = ref(false)

const activeTab = ref('parameter')
const bonusPools = ref([])
const businessLines = ref([])

const currentPool = ref(null)
const simulationResult = ref(null)
const sensitivityResult = ref(null)
const historyData = ref(null)
const savedScenarios = ref([])
const selectedScenarios = ref([])

// 对话框状态
const createScenarioVisible = ref(false)

// 表单数据
const simulationParams = reactive({
  bonusPoolId: null,
  totalProfit: 10000000,
  poolRatio: 0.15,
  lineWeights: {},
  minBonusRatio: 0.8,
  maxBonusRatio: 3.0
})

const sensitivityParams = reactive({
  parameter: 'totalProfit',
  range: '0.2',
  step: '0.05'
})

const historyParams = reactive({
  dateRange: null,
  metric: 'totalBonus'
})

const scenarioForm = reactive({
  name: '',
  description: '',
  basePoolId: null,
  isPublic: false
})

// 图表引用
const lineImpactChart = ref()
const currentDistChart = ref()
const simDistChart = ref()
const comparisonRadarChart = ref()
const sensitivityChart = ref()
const historyChart = ref()

// 计算属性
const comparisonData = computed(() => {
  if (selectedScenarios.value.length === 0) return []
  
  return [
    {
      metric: '总奖金',
      type: 'currency',
      values: selectedScenarios.value.reduce((acc, id) => {
        const scenario = savedScenarios.value.find(s => s.id === id)
        acc[id] = scenario?.totalBonus || 0
        return acc
      }, {})
    },
    {
      metric: '人均奖金',
      type: 'currency',
      values: selectedScenarios.value.reduce((acc, id) => {
        const scenario = savedScenarios.value.find(s => s.id === id)
        acc[id] = scenario?.avgBonus || 0
        return acc
      }, {})
    },
    {
      metric: '奖金池利用率',
      type: 'percentage',
      values: selectedScenarios.value.reduce((acc, id) => {
        const scenario = savedScenarios.value.find(s => s.id === id)
        acc[id] = scenario?.utilizationRate || 0
        return acc
      }, {})
    }
  ]
})

// 工具函数
const formatNumber = (num) => {
  return new Intl.NumberFormat('zh-CN').format(num || 0)
}

const formatPercentage = (num) => {
  const sign = num > 0 ? '+' : ''
  return `${sign}${(num * 100).toFixed(1)}%`
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const getImpactClass = (value) => {
  if (value > 0) return 'positive-impact'
  if (value < 0) return 'negative-impact'
  return 'neutral-impact'
}

const getProfitChangeClass = () => {
  if (!currentPool.value) return ''
  const change = (simulationParams.totalProfit - currentPool.value.totalProfit) / currentPool.value.totalProfit
  return getImpactClass(change)
}

const getProfitChangeText = () => {
  if (!currentPool.value) return ''
  const change = (simulationParams.totalProfit - currentPool.value.totalProfit) / currentPool.value.totalProfit
  return formatPercentage(change)
}

const getWeightValidationClass = () => {
  const total = getTotalWeight()
  if (Math.abs(total - 100) < 1) return 'weight-valid'
  return 'weight-invalid'
}

const getTotalWeight = () => {
  return Object.values(simulationParams.lineWeights).reduce((sum, weight) => sum + weight * 100, 0).toFixed(0)
}

const getRiskLevelType = (level) => {
  const typeMap = {
    '低': 'success',
    '中': 'warning',
    '高': 'danger'
  }
  return typeMap[level] || 'info'
}

// 加载业务线数据
const loadBusinessLines = async () => {
  try {
    console.log('🔄 正在加载业务线数据...')
    const response = await businessLineApi.getBusinessLines({ pageSize: 100 })
    console.log('📊 业务线API响应:', response)
    
    // 处理后端返回的数据结构
    let lines = []
    if (response && response.data) {
      if (response.data.businessLines && Array.isArray(response.data.businessLines)) {
        lines = response.data.businessLines
        console.log('✅ 使用标准响应格式加载业务线')
      } else if (Array.isArray(response.data)) {
        lines = response.data
        console.log('✅ 使用直接数组格式加载业务线')
      }
    }
    
    // 过滤有效业务线并设置到组件状态
    businessLines.value = lines.filter(line => line && (line._id || line.id) && line.status === 1)
    console.log('✅ 成功加载业务线列表:', businessLines.value.length, '个业务线')
    console.log('📋 业务线详情:', businessLines.value.map(l => ({ id: l._id || l.id, name: l.name, code: l.code })))
    
    // 初始化权重配置
    initializeLineWeights()
    
  } catch (error) {
    console.error('❌ 加载业务线数据失败:', error)
    ElMessage.error('加载业务线数据失败: ' + (error.response?.data?.message || error.message))
    businessLines.value = []
  }
}

// 初始化业务线权重
const initializeLineWeights = () => {
  // 清空现有权重
  Object.keys(simulationParams.lineWeights).forEach(key => {
    delete simulationParams.lineWeights[key]
  })
  
  // 为每个业务线设置默认权重
  if (businessLines.value.length > 0) {
    const defaultWeight = 1.0 / businessLines.value.length // 平均分配
    businessLines.value.forEach(line => {
      const lineId = line._id || line.id
      simulationParams.lineWeights[lineId] = getDefaultWeightByCode(line.code) || defaultWeight
    })
  }
  
  console.log('✅ 初始化业务线权重:', simulationParams.lineWeights)
}

// 根据业务线代码获取默认权重
const getDefaultWeightByCode = (code) => {
  const defaultWeights = {
    'implementation': 0.55,  // 实施
    'presales': 0.20,        // 售前
    'marketing': 0.15,       // 市场
    'operation': 0.10        // 运营
  }
  return defaultWeights[code] || null
}

// 事件处理
const refreshData = async () => {
  loading.value = true
  try {
    // 加载业务线数据
    await loadBusinessLines()
    
    // 加载奖金池数据
    const poolsRes = await getBonusPools({ pageSize: 100 })
    bonusPools.value = poolsRes.data.bonusPools || []
    
    // 加载保存的场景
    const scenariosRes = await getSimulationScenarios({ pageSize: 100 })
    savedScenarios.value = scenariosRes.data.scenarios || []
    
  } catch (error) {
    console.error('加载数据失败:', error)
    console.error('错误详情:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText
    })
    ElMessage.error(`加载数据失败: ${error.response?.data?.message || error.message}`)
  } finally {
    loading.value = false
  }
}

const handleTabChange = (tabName) => {
  // 切换标签时的处理逻辑
  if (tabName === 'sensitivity' && !sensitivityResult.value) {
    // 自动运行敏感性分析
    nextTick(() => {
      runSensitivityAnalysisFunc()
    })
  }
}

const handlePoolChange = () => {
  currentPool.value = bonusPools.value.find(pool => pool.id === simulationParams.bonusPoolId)
  if (currentPool.value) {
    simulationParams.totalProfit = currentPool.value.totalProfit
    simulationParams.poolRatio = currentPool.value.poolRatio
  }
}

const normalizeWeights = () => {
  // 自动调整权重以确保总和为100%
  const total = Object.values(simulationParams.lineWeights).reduce((sum, weight) => sum + weight, 0)
  if (Math.abs(total - 1) > 0.01) {
    // 不自动调整，让用户手动调整
  }
}

const calculateImpact = () => {
  // 实时计算参数变化的影响
  if (!currentPool.value) return
  
  // 这里可以添加实时计算逻辑
}

const runSimulation = async () => {
  if (!simulationParams.bonusPoolId) {
    ElMessage.warning('请先选择奖金池')
    return
  }

  if (businessLines.value.length === 0) {
    ElMessage.warning('业务线数据加载中，请稍后重试')
    return
  }

  simulating.value = true
  try {
    const requestData = {
      bonusPoolId: simulationParams.bonusPoolId,
      totalProfit: simulationParams.totalProfit,
      poolRatio: simulationParams.poolRatio,
      lineWeights: simulationParams.lineWeights,
      minBonusRatio: simulationParams.minBonusRatio,
      maxBonusRatio: simulationParams.maxBonusRatio,
      businessLines: businessLines.value.map(line => ({
        id: line._id || line.id,
        name: line.name,
        code: line.code
      }))
    }
    
    console.log('🔄 运行参数模拟:', requestData)
    
    const res = await runParameterSimulation(requestData)
    
    simulationResult.value = res.data
    
    // 更新图表
    nextTick(() => {
      updateSimulationCharts()
    })
    
    ElMessage.success('参数模拟完成')
    
  } catch (error) {
    console.error('模拟失败:', error)
    ElMessage.error('模拟计算失败: ' + (error.response?.data?.message || error.message))
  } finally {
    simulating.value = false
  }
}

const runSensitivityAnalysisFunc = async () => {
  if (!simulationParams.bonusPoolId) {
    ElMessage.warning('请先选择奖金池')
    return
  }

  analyzing.value = true
  try {
    // 构建请求数据
    const requestData = {
      bonusPoolId: simulationParams.bonusPoolId,
      parameter: sensitivityParams.parameter,
      range: sensitivityParams.range,
      step: sensitivityParams.step,
      lineWeights: simulationParams.lineWeights,
      businessLines: businessLines.value.map(line => ({
        id: line._id || line.id,
        name: line.name,
        code: line.code
      }))
    }
    
    console.log('🔄 运行敏感性分析:', requestData)
    
    const res = await runSensitivityAnalysis(requestData)
    
    sensitivityResult.value = res.data
    
    nextTick(() => {
      updateSensitivityChart()
    })
    
    ElMessage.success('敏感性分析完成')
    
  } catch (error) {
    console.error('敏感性分析失败:', error)
    ElMessage.error('敏感性分析失败: ' + (error.response?.data?.message || error.message))
  } finally {
    analyzing.value = false
  }
}

const loadHistoryData = async () => {
  if (!historyParams.dateRange) return
  
  try {
    const res = await getHistoryAnalysis({
      dateRange: historyParams.dateRange,
      metric: historyParams.metric
    })
    
    historyData.value = res.data
    
    nextTick(() => {
      updateHistoryChart()
    })
    
  } catch (error) {
    console.error('加载历史数据失败:', error)
    ElMessage.error('加载历史数据失败')
  }
}

const toggleScenario = (scenarioId) => {
  const index = selectedScenarios.value.indexOf(scenarioId)
  if (index > -1) {
    selectedScenarios.value.splice(index, 1)
  } else {
    if (selectedScenarios.value.length < 4) {
      selectedScenarios.value.push(scenarioId)
    } else {
      ElMessage.warning('最多可对比4个场景')
    }
  }
  
  nextTick(() => {
    updateComparisonChart()
  })
}

const getSelectedScenariosData = () => {
  return savedScenarios.value.filter(scenario => selectedScenarios.value.includes(scenario.id))
}

const formatComparisonValue = (value, type) => {
  if (type === 'currency') {
    return `¥${formatNumber(value)}`
  } else if (type === 'percentage') {
    return `${(value * 100).toFixed(1)}%`
  }
  return value
}

const getComparisonValueClass = (value, type) => {
  // 根据值的大小返回不同的样式类
  return ''
}

const showCreateScenarioDialog = () => {
  Object.assign(scenarioForm, {
    name: '',
    description: '',
    basePoolId: null,
    isPublic: false
  })
  createScenarioVisible.value = true
}

const createScenario = async () => {
  if (!scenarioForm.name) {
    ElMessage.warning('请输入场景名称')
    return
  }
  
  creating.value = true
  try {
    await saveSimulationScenario({
      name: scenarioForm.name,
      description: scenarioForm.description,
      basePoolId: scenarioForm.basePoolId,
      parameters: simulationParams,
      isPublic: scenarioForm.isPublic
    })
    
    ElMessage.success('场景创建成功')
    createScenarioVisible.value = false
    refreshData()
    
  } catch (error) {
    console.error('创建场景失败:', error)
    ElMessage.error('创建场景失败')
  } finally {
    creating.value = false
  }
}

// 图表更新函数
const updateSimulationCharts = () => {
  // 更新条线影响图表
  if (lineImpactChart.value) {
    const chart = echarts.init(lineImpactChart.value)
    chart.setOption({
      title: { text: '条线奖金变化对比' },
      tooltip: { trigger: 'axis' },
      legend: { data: ['当前', '模拟'] },
      xAxis: {
        type: 'category',
        data: businessLines.value.map(line => line.name)
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: '当前',
          type: 'bar',
          data: businessLines.value.map(line => {
            const lineId = line._id || line.id
            return simulationResult.value?.lineComparison?.find(item => item.lineId === lineId)?.currentBonus || 0
          })
        },
        {
          name: '模拟',
          type: 'bar',
          data: businessLines.value.map(line => {
            const lineId = line._id || line.id
            return simulationResult.value?.lineComparison?.find(item => item.lineId === lineId)?.simulatedBonus || 0
          })
        }
      ]
    })
  }
}

const updateComparisonChart = () => {
  if (comparisonRadarChart.value && selectedScenarios.value.length > 0) {
    const chart = echarts.init(comparisonRadarChart.value)
    // 雷达图配置
    chart.setOption({
      title: { text: '场景对比雷达图' },
      radar: {
        indicator: [
          { name: '总奖金', max: 2000000 },
          { name: '人均奖金', max: 15000 },
          { name: '利用率', max: 1 },
          { name: '满意度', max: 100 }
        ]
      },
      series: [{
        type: 'radar',
        data: selectedScenarios.value.map(id => {
          const scenario = savedScenarios.value.find(s => s.id === id)
          return {
            name: scenario.name,
            value: [scenario.totalBonus, scenario.avgBonus, scenario.utilizationRate, 85]
          }
        })
      }]
    })
  }
}

const updateSensitivityChart = () => {
  if (sensitivityChart.value && sensitivityResult.value) {
    const chart = echarts.init(sensitivityChart.value)
    const data = sensitivityResult.value.data || []
    
    chart.setOption({
      title: { 
        text: `${sensitivityResult.value.parameterDisplayName || sensitivityResult.value.parameter}敏感性分析`,
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const point = params[0]
          const changeRatio = (point.data.changeRatio * 100).toFixed(1)
          const impact = ((point.data.impact - 1) * 100).toFixed(1)
          return `变化: ${changeRatio > 0 ? '+' : ''}${changeRatio}%<br/>影响: ${impact > 0 ? '+' : ''}${impact}%`
        }
      },
      xAxis: {
        type: 'category',
        data: data.map(d => `${(d.changeRatio * 100).toFixed(0)}%`),
        name: '参数变化',
        nameLocation: 'middle',
        nameGap: 30
      },
      yAxis: { 
        type: 'value',
        name: '影响系数',
        nameLocation: 'middle',
        nameGap: 50,
        axisLabel: {
          formatter: '{value}'
        }
      },
      series: [{
        type: 'line',
        data: data.map(d => ({
          value: d.impact,
          changeRatio: d.changeRatio,
          impact: d.impact
        })),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: '#409EFF',
          width: 2
        }
      }],
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        top: '15%'
      }
    })
  }
}

const updateHistoryChart = () => {
  if (historyChart.value && historyData.value) {
    const chart = echarts.init(historyChart.value)
    const data = historyData.value
    
    chart.setOption({
      title: { 
        text: `历史${getMetricDisplayName(data.metric)}趋势分析`,
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const point = params[0]
          return `${point.name}<br/>${getMetricDisplayName(data.metric)}: ${formatChartValue(point.value, data.metric)}`
        }
      },
      xAxis: {
        type: 'category',
        data: data.periods || [],
        name: '时间周期',
        nameLocation: 'middle',
        nameGap: 30
      },
      yAxis: { 
        type: 'value',
        name: getMetricDisplayName(data.metric),
        nameLocation: 'middle',
        nameGap: 50,
        axisLabel: {
          formatter: (value) => formatChartValue(value, data.metric)
        }
      },
      series: [{
        type: 'line',
        data: data.values || [],
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          color: '#67C23A',
          width: 2
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
              { offset: 1, color: 'rgba(103, 194, 58, 0.1)' }
            ]
          }
        }
      }],
      grid: {
        left: '10%',
        right: '10%',
        bottom: '15%',
        top: '15%'
      }
    })
  }
}

const getMetricDisplayName = (metric) => {
  const names = {
    totalBonus: '总奖金',
    avgBonus: '人均奖金',
    utilizationRate: '奖金池利用率'
  }
  return names[metric] || metric
}

const formatChartValue = (value, metric) => {
  if (metric === 'utilizationRate') {
    return `${(value * 100).toFixed(1)}%`
  } else if (metric.includes('Bonus')) {
    return `¥${formatNumber(value)}`
  }
  return value
}

// 页面加载
onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.simulation-analysis {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.nav-card {
  margin-bottom: 20px;
}

.parameter-card,
.result-card {
  height: fit-content;
}

.param-change {
  font-size: 12px;
  margin-top: 4px;
}

.positive-impact {
  color: #67c23a;
}

.negative-impact {
  color: #f56c6c;
}

.neutral-impact {
  color: #909399;
}

.slider-value {
  text-align: center;
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.weight-validation {
  text-align: center;
  padding: 10px;
  margin: 10px 0;
  border-radius: 4px;
  background: #f8f9fa;
}

.weight-valid {
  color: #67c23a;
}

.weight-invalid {
  color: #f56c6c;
}

.impact-overview {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.impact-item {
  text-align: center;
}

.impact-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
}

.impact-label {
  font-size: 14px;
  color: #666;
}

.chart-container,
.distribution-comparison {
  margin: 20px 0;
}

.distribution-chart h4 {
  text-align: center;
  margin-bottom: 10px;
}

.scenario-list {
  max-height: 500px;
  overflow-y: auto;
}

.scenario-item {
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.scenario-item:hover {
  border-color: #409eff;
}

.scenario-item.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.scenario-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.scenario-name {
  font-weight: bold;
}

.scenario-desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.scenario-meta {
  font-size: 11px;
  color: #999;
}

.comparison-table {
  margin-top: 20px;
}

.sensitivity-controls {
  margin-bottom: 20px;
}

.sensitivity-summary {
  margin-top: 20px;
}

.history-controls {
  margin-bottom: 20px;
}

.history-insights {
  margin-top: 20px;
}

.no-result,
.no-comparison {
  text-align: center;
  padding: 40px;
}

.form-help {
  font-size: 12px;
  color: #999;
  margin-left: 8px;
}

.chart {
  width: 100%;
}
</style>