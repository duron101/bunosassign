<template>
  <div class="personal-bonus-dashboard">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <h2>个人奖金仪表板</h2>
        <div class="current-period">当前期间: {{ currentPeriod || '2025-01' }}</div>
      </div>
      <div class="header-actions">
        <el-select
          v-model="selectedPeriod"
          placeholder="选择期间"
          @change="handlePeriodChange"
          style="width: 150px; margin-right: 12px;"
        >
          <el-option
            v-for="period in availablePeriods"
            :key="period.value"
            :label="period.label"
            :value="period.value"
          />
        </el-select>
        <el-button @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
        <el-button type="primary" @click="exportReport">
          <el-icon><Download /></el-icon>
          导出报告
        </el-button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="6" animated />
    </div>

    <!-- No Employee Associated Message -->
    <div v-else-if="!employee" class="no-employee-message">
      <el-empty description="您尚未关联员工记录">
        <template #description>
          <p>您尚未关联员工记录，请联系HR进行账户关联</p>
        </template>
        <el-button type="primary" @click="contactHR">联系HR</el-button>
      </el-empty>
    </div>

    <!-- Main Dashboard Content -->
    <div v-else class="dashboard-content">
      <!-- Overview Cards -->
      <el-row :gutter="20" class="overview-cards">
        <el-col :span="6">
          <el-card class="metric-card total-bonus">
            <div class="metric-content">
              <div class="metric-icon">
                <el-icon><Money /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">¥{{ formatNumber(bonusData.totalBonus) }}</div>
                <div class="metric-label">本期总奖金</div>
                <div class="metric-description">包含基础奖金和项目奖金</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card class="metric-card profit-contribution">
            <div class="metric-content">
              <div class="metric-icon">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">¥{{ formatNumber(bonusData.bonusBreakdown.profitContribution) }}</div>
                <div class="metric-label">利润贡献奖金</div>
                <div class="metric-description">基于公司整体利润分配</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card class="metric-card position-value">
            <div class="metric-content">
              <div class="metric-icon">
                <el-icon><Trophy /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">¥{{ formatNumber(bonusData.bonusBreakdown.positionValue) }}</div>
                <div class="metric-label">岗位价值奖金</div>
                <div class="metric-description">基于岗位基准价值</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card class="metric-card performance-bonus">
            <div class="metric-content">
              <div class="metric-icon">
                <el-icon><Medal /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">¥{{ formatNumber(bonusData.bonusBreakdown.performance) }}</div>
                <div class="metric-label">绩效奖金</div>
                <div class="metric-description">基于个人绩效表现</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- Three-Dimensional Analysis & Trends -->
      <el-row :gutter="20" class="analysis-section">
        <el-col :span="12">
          <el-card class="analysis-card" header="三维奖金构成分析">
            <ThreeDimensionalBreakdown
              :breakdown="bonusData.bonusBreakdown"
              :total="bonusData.totalBonus"
              :loading="loading"
            />
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card class="analysis-card" header="奖金趋势分析">
            <HistoricalTrendsChart
              :trend-data="trendData"
              :loading="trendLoading"
              @period-change="handleTrendPeriodChange"
            />
          </el-card>
        </el-col>
      </el-row>

      <!-- Performance & Projects -->
      <el-row :gutter="20" class="detail-section">
        <el-col :span="8">
          <el-card class="detail-card" header="绩效表现">
            <div v-if="performanceMetrics" class="performance-detail">
              <div class="performance-score">
                <div class="score-circle">
                  <div class="score-value">{{ (performanceMetrics.overallScore * 100).toFixed(0) }}</div>
                  <div class="score-label">综合评分</div>
                </div>
              </div>
              <div class="performance-metrics">
                <div class="metric-item">
                  <span class="metric-name">工作效率</span>
                  <el-progress :percentage="performanceMetrics.efficiency * 100" />
                </div>
                <div class="metric-item">
                  <span class="metric-name">创新能力</span>
                  <el-progress :percentage="performanceMetrics.innovation * 100" />
                </div>
                <div class="metric-item">
                  <span class="metric-name">团队协作</span>
                  <el-progress :percentage="performanceMetrics.teamwork * 100" />
                </div>
                <div v-if="performanceMetrics.leadership" class="metric-item">
                  <span class="metric-name">领导力</span>
                  <el-progress :percentage="performanceMetrics.leadership * 100" />
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无绩效数据" />
          </el-card>
        </el-col>

        <el-col :span="16">
          <el-card class="detail-card" header="项目参与情况">
            <div v-if="projectData && projectData.projectBonus.allocations.length > 0" class="project-participation">
              <div class="project-summary">
                <el-row :gutter="16">
                  <el-col :span="6">
                    <div class="summary-item">
                      <div class="summary-value">¥{{ formatNumber(projectData.summary.totalProjectBonus) }}</div>
                      <div class="summary-label">项目奖金总额</div>
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="summary-item">
                      <div class="summary-value">{{ projectData.summary.activeProjects }}</div>
                      <div class="summary-label">参与项目数</div>
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="summary-item">
                      <div class="summary-value">¥{{ formatNumber(projectData.summary.averageBonusPerProject) }}</div>
                      <div class="summary-label">平均项目奖金</div>
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="summary-item">
                      <div class="summary-value">{{ (projectData.summary.projectContributionRatio * 100).toFixed(1) }}%</div>
                      <div class="summary-label">项目奖金占比</div>
                    </div>
                  </el-col>
                </el-row>
              </div>
              
              <div class="project-list">
                <div 
                  v-for="project in projectData.projectBonus.allocations"
                  :key="project.projectId"
                  class="project-item"
                >
                  <div class="project-info">
                    <div class="project-name">{{ project.projectName }}</div>
                    <div class="project-role">{{ project.role }}</div>
                  </div>
                  <div class="project-bonus">¥{{ formatNumber(project.bonusAmount) }}</div>
                  <div class="project-status">
                    <el-tag :type="getProjectStatusType(project.status)">{{ project.status }}</el-tag>
                  </div>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无项目参与记录" />
          </el-card>
        </el-col>
      </el-row>

      <!-- Simulation & Suggestions -->
      <el-row :gutter="20" class="interaction-section">
        <el-col :span="14">
          <el-card class="simulation-card" header="奖金模拟分析">
            <BonusSimulation
              :current-bonus="bonusData.totalBonus"
              :current-breakdown="bonusData.bonusBreakdown"
              :employee="employee"
              @simulation-run="handleSimulationResult"
            />
          </el-card>
        </el-col>

        <el-col :span="10">
          <el-card class="suggestions-card" header="改进建议">
            <ImprovementSuggestions
              :suggestions="improvementSuggestions"
              :loading="suggestionsLoading"
              @suggestion-complete="handleSuggestionComplete"
            />
          </el-card>
        </el-col>
      </el-row>

      <!-- Peer Comparison (if available) -->
      <el-row v-if="peerComparison" :gutter="20" class="comparison-section">
        <el-col :span="24">
          <el-card header="同级别员工对比（匿名）">
            <div class="peer-comparison">
              <div class="comparison-overview">
                <el-row :gutter="20">
                  <el-col :span="6">
                    <div class="comparison-stat">
                      <div class="stat-value">{{ peerComparison.totalPeers }}</div>
                      <div class="stat-label">对比员工数</div>
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="comparison-stat">
                      <div class="stat-value">第{{ peerComparison.myPercentile }}百分位</div>
                      <div class="stat-label">我的排名</div>
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="comparison-stat">
                      <div class="stat-value">¥{{ formatNumber(peerComparison.averageBonus) }}</div>
                      <div class="stat-label">平均奖金</div>
                    </div>
                  </el-col>
                  <el-col :span="6">
                    <div class="comparison-stat">
                      <div class="stat-value" :class="getComparisonClass(peerComparison.comparedToAverage)">
                        {{ peerComparison.comparedToAverage >= 0 ? '+' : '' }}{{ formatNumber(peerComparison.comparedToAverage) }}
                      </div>
                      <div class="stat-label">与平均值差异</div>
                    </div>
                  </el-col>
                </el-row>
              </div>
              
              <div class="comparison-message">
                <el-alert
                  :title="peerComparison.message"
                  :type="getPeerComparisonAlertType(peerComparison.myRanking)"
                  show-icon
                  :closable="false"
                />
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh, Download, Money, TrendCharts, Trophy, Medal
} from '@element-plus/icons-vue'
import {
  getPersonalBonusOverview,
  getBonusTrend,
  getPerformanceDetail,
  getProjectParticipation,
  getImprovementSuggestions,
  getPeerComparison,
  type PersonalBonusOverviewResponse,
  type PersonalEmployee,
  type PerformanceMetrics,
  type ProjectParticipationResponse,
  type ImprovementSuggestion,
  type PeerComparison,
  type BonusTrendResponse,
  type BonusBreakdown
} from '@/api/personalBonus'
import ThreeDimensionalBreakdown from './components/ThreeDimensionalBreakdown.vue'
import HistoricalTrendsChart from './components/HistoricalTrendsChart.vue'
import BonusSimulation from './components/BonusSimulation.vue'
import ImprovementSuggestions from './components/ImprovementSuggestions.vue'

// Reactive data
const loading = ref(false)
const trendLoading = ref(false)
const suggestionsLoading = ref(false)
const selectedPeriod = ref('')
const currentPeriod = ref('')

// Core data
const employee = ref<PersonalEmployee | null>(null)
const bonusData = reactive({
  totalBonus: 0,
  bonusBreakdown: {
    profitContribution: 0,
    positionValue: 0,
    performance: 0,
    projectBonus: 0
  } as BonusBreakdown
})

const performanceMetrics = ref<PerformanceMetrics | null>(null)
const projectData = ref<ProjectParticipationResponse['data'] | null>(null)
const improvementSuggestions = ref<ImprovementSuggestion[]>([])
const peerComparison = ref<PeerComparison | null>(null)
const trendData = ref<BonusTrendResponse['data'] | null>(null)

// Available periods for selection
const availablePeriods = computed(() => {
  const periods = []
  const now = new Date()
  
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = date.toISOString().slice(0, 7)
    const label = `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月`
    periods.push({ value, label })
  }
  
  return periods
})

// Utility functions
const formatNumber = (num: number) => {
  return new Intl.NumberFormat('zh-CN').format(num || 0)
}

const getProjectStatusType = (status: string) => {
  const statusMap = {
    'active': 'success',
    'completed': 'info',
    'pending': 'warning',
    'cancelled': 'danger'
  }
  return statusMap[status] || 'info'
}

const getComparisonClass = (value: number) => {
  return value >= 0 ? 'positive' : 'negative'
}

const getPeerComparisonAlertType = (ranking: string) => {
  const rankingMap = {
    'top': 'success',
    'average': 'info',
    'bottom': 'warning'
  }
  return rankingMap[ranking] || 'info'
}

// Event handlers
const handlePeriodChange = async (period: string) => {
  selectedPeriod.value = period
  currentPeriod.value = period
  await loadDashboardData()
}

const handleTrendPeriodChange = (periods: number) => {
  loadTrendData(periods)
}

const handleSimulationResult = (results: any) => {
  console.log('Simulation results:', results)
  ElMessage.success('模拟分析完成')
}

const handleSuggestionComplete = (suggestionId: string) => {
  const suggestion = improvementSuggestions.value.find(s => s.id === suggestionId)
  if (suggestion) {
    suggestion.completed = true
    ElMessage.success('建议已标记为完成')
  }
}

const refreshData = async () => {
  await loadDashboardData()
}

const exportReport = async () => {
  try {
    ElMessage.info('导出功能开发中...')
  } catch (error) {
    ElMessage.error('导出失败')
  }
}

const contactHR = () => {
  ElMessageBox.alert(
    '请联系HR部门进行员工账户关联，联系方式：hr@company.com 或 内线1001',
    '联系HR',
    {
      confirmButtonText: '确定',
      type: 'info'
    }
  )
}

// Data loading functions
const loadDashboardData = async () => {
  loading.value = true
  
  try {
    // Load overview data
    const overviewRes = await getPersonalBonusOverview(selectedPeriod.value)
    const overviewData = overviewRes.data
    
    if (!overviewData.employee) {
      employee.value = null
      return
    }
    
    employee.value = overviewData.employee
    currentPeriod.value = overviewData.currentPeriod
    
    // Update bonus data
    Object.assign(bonusData, overviewData.bonusData)
    
    // Load additional data in parallel
    const [performanceRes, projectRes, suggestionsRes, comparisonRes] = await Promise.allSettled([
      getPerformanceDetail(selectedPeriod.value),
      getProjectParticipation(selectedPeriod.value),
      getImprovementSuggestions(),
      getPeerComparison(selectedPeriod.value)
    ])
    
    // Handle performance data
    if (performanceRes.status === 'fulfilled' && performanceRes.value.data.performanceMetrics) {
      performanceMetrics.value = performanceRes.value.data.performanceMetrics
    }
    
    // Handle project data
    if (projectRes.status === 'fulfilled' && projectRes.value.data.projectBonus) {
      projectData.value = projectRes.value.data
    }
    
    // Handle suggestions data
    if (suggestionsRes.status === 'fulfilled' && suggestionsRes.value.data.suggestions) {
      improvementSuggestions.value = suggestionsRes.value.data.suggestions
    }
    
    // Handle peer comparison data
    if (comparisonRes.status === 'fulfilled' && comparisonRes.value.data.comparison) {
      peerComparison.value = comparisonRes.value.data.comparison
    }
    
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const loadTrendData = async (periods = 12) => {
  trendLoading.value = true
  
  try {
    const trendRes = await getBonusTrend(periods)
    trendData.value = trendRes.data
  } catch (error) {
    console.error('Failed to load trend data:', error)
    ElMessage.error('加载趋势数据失败')
  } finally {
    trendLoading.value = false
  }
}

// Lifecycle
onMounted(() => {
  // Set default period to current month
  const now = new Date()
  selectedPeriod.value = now.toISOString().slice(0, 7)
  currentPeriod.value = selectedPeriod.value
  
  // Load all data
  loadDashboardData()
  loadTrendData()
})
</script>

<style scoped>
.personal-bonus-dashboard {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.header-left h2 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.current-period {
  color: #909399;
  font-size: 14px;
}

.header-actions {
  display: flex;
  align-items: center;
}

.loading-container {
  background: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.no-employee-message {
  background: white;
  padding: 60px 20px;
  border-radius: 12px;
  text-align: center;
}

.overview-cards {
  margin-bottom: 20px;
}

.metric-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transition: transform 0.2s;
  overflow: hidden;
}

.metric-card:hover {
  transform: translateY(-2px);
}

.metric-card.total-bonus {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.metric-card.profit-contribution {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.metric-card.position-value {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.metric-card.performance-bonus {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
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
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
}

.metric-info {
  flex: 1;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 4px;
}

.metric-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.metric-description {
  font-size: 12px;
  opacity: 0.7;
}

.analysis-section,
.detail-section,
.interaction-section,
.comparison-section {
  margin-bottom: 20px;
}

.analysis-card,
.detail-card,
.simulation-card,
.suggestions-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  height: 100%;
}

.performance-detail {
  padding: 10px 0;
}

.performance-score {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.score-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
}

.score-value {
  font-size: 24px;
  font-weight: bold;
  line-height: 1;
}

.score-label {
  font-size: 12px;
  opacity: 0.8;
}

.performance-metrics {
  space-y: 12px;
}

.metric-item {
  margin-bottom: 12px;
}

.metric-name {
  display: block;
  font-size: 14px;
  color: #606266;
  margin-bottom: 6px;
}

.project-participation {
  padding: 10px 0;
}

.project-summary {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.summary-item {
  text-align: center;
}

.summary-value {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 4px;
}

.summary-label {
  font-size: 12px;
  color: #909399;
}

.project-list {
  max-height: 300px;
  overflow-y: auto;
}

.project-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.project-item:last-child {
  border-bottom: none;
}

.project-info {
  flex: 1;
}

.project-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.project-role {
  font-size: 12px;
  color: #909399;
}

.project-bonus {
  font-size: 16px;
  font-weight: bold;
  color: #67c23a;
  margin-right: 16px;
}

.peer-comparison {
  padding: 10px 0;
}

.comparison-overview {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.comparison-stat {
  text-align: center;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 4px;
}

.stat-value.positive {
  color: #67c23a;
}

.stat-value.negative {
  color: #f56c6c;
}

.stat-label {
  font-size: 12px;
  color: #909399;
}

.comparison-message {
  margin-top: 16px;
}

@media (max-width: 768px) {
  .personal-bonus-dashboard {
    padding: 12px;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: space-between;
  }
  
  .overview-cards .el-col,
  .analysis-section .el-col,
  .detail-section .el-col,
  .interaction-section .el-col {
    margin-bottom: 16px;
  }
}
</style>