<template>
  <div class="project-cost-management">
    <div class="page-header">
      <h2>项目成本管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateCostDialog">
          <el-icon><Plus /></el-icon>
          录入成本
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <div class="search-section">
      <el-form :model="queryForm" inline>
        <el-form-item label="项目">
          <el-select v-model="queryForm.projectId" placeholder="选择项目" clearable style="width: 200px">
            <el-option
              v-for="project in projectOptions"
              :key="project._id || project.id || `project-${Math.random()}`"
              :label="project.name || '未知项目'"
              :value="project._id || project.id || ''"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="成本类型">
          <el-select v-model="queryForm.costType" placeholder="选择类型" clearable style="width: 150px">
            <el-option label="人力成本" value="人力成本" />
            <el-option label="材料成本" value="材料成本" />
            <el-option label="其他成本" value="其他成本" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="queryForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 财务概览统计 -->
    <div class="finance-overview">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="overview-card">
            <div class="overview-item">
              <div class="overview-icon budget-icon">
                <el-icon><Money /></el-icon>
              </div>
              <div class="overview-content">
                <div class="overview-value">{{ formatCurrency(financialOverview.totalBudget) }}</div>
                <div class="overview-label">总预算</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="overview-card">
            <div class="overview-item">
              <div class="overview-icon cost-icon">
                <el-icon><Wallet /></el-icon>
              </div>
              <div class="overview-content">
                <div class="overview-value">{{ formatCurrency(financialOverview.totalCost) }}</div>
                <div class="overview-label">总成本</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="overview-card">
            <div class="overview-item">
              <div class="overview-icon profit-icon">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="overview-content">
                <div class="overview-value" :class="getProfitClass(financialOverview.expectedProfit)">
                  {{ formatCurrency(financialOverview.expectedProfit) }}
                </div>
                <div class="overview-label">预期利润</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="overview-card">
            <div class="overview-item">
              <div class="overview-icon bonus-icon">
                <el-icon><Present /></el-icon>
              </div>
              <div class="overview-content">
                <div class="overview-value">{{ formatCurrency(financialOverview.estimatedBonus) }}</div>
                <div class="overview-label">预估奖金</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 成本记录列表 -->
    <div class="table-section">
      <el-table
        v-loading="loading"
        :data="costRecords"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="Project.name" label="项目名称" min-width="150" />
        <el-table-column prop="costType" label="成本类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getCostTypeTagType(row.costType)" size="small">
              {{ row.costType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="120" align="right">
          <template #default="{ row }">
            <span class="cost-amount">{{ formatCurrency(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="date" label="发生日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="recordedBy" label="记录人" width="100" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="showEditCostDialog(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDeleteCost(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryForm.page"
          v-model:page-size="queryForm.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSearch"
          @current-change="handleSearch"
        />
      </div>
    </div>

    <!-- 成本录入对话框 -->
    <el-dialog
      v-model="costDialogVisible"
      :title="isEdit ? '编辑成本记录' : '录入成本记录'"
      width="600px"
    >
      <el-form ref="costFormRef" :model="costForm" :rules="costFormRules" label-width="100px">
        <el-form-item label="项目" prop="projectId">
          <el-select v-model="costForm.projectId" placeholder="选择项目" style="width: 100%">
            <el-option
              v-for="project in projectOptions"
              :key="project._id || project.id || `project-${Math.random()}`"
              :label="project.name || '未知项目'"
              :value="project._id || project.id || ''"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="成本类型" prop="costType">
          <el-select v-model="costForm.costType" placeholder="选择成本类型" style="width: 100%">
            <el-option label="人力成本" value="人力成本" />
            <el-option label="材料成本" value="材料成本" />
            <el-option label="其他成本" value="其他成本" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number
            v-model="costForm.amount"
            :min="0"
            :precision="2"
            style="width: 100%"
            placeholder="请输入成本金额"
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="costForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入成本描述"
          />
        </el-form-item>
        <el-form-item label="发生日期" prop="date">
          <el-date-picker
            v-model="costForm.date"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="costDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitCost" :loading="submitting">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Search, Refresh, Money, Wallet, TrendCharts, Present } from '@element-plus/icons-vue'
import { projectCostApi } from '@/api/projectCosts'
import { projectApi } from '@/api/project'
import type { ProjectCost, ProjectCostQuery, ProjectCostResponse } from '@/api/projectCosts'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const costDialogVisible = ref(false)
const isEdit = ref(false)
const selectedCosts = ref<ProjectCost[]>([])

// 查询表单
const queryForm = reactive<ProjectCostQuery & { dateRange?: string[] }>({
  page: 1,
  pageSize: 20,
  projectId: '',
  costType: '',
  dateRange: []
})

// 分页信息
const pagination = reactive({
  total: 0,
  page: 1,
  pageSize: 20,
  totalPages: 0
})

// 成本记录列表
const costRecords = ref<ProjectCost[]>([])

// 项目选项
const projectOptions = ref<any[]>([])

// 财务概览
const financialOverview = reactive({
  totalBudget: 0,
  totalCost: 0,
  expectedProfit: 0,
  estimatedBonus: 0
})

// 成本表单
const costForm = reactive({
  projectId: '',
  costType: '',
  amount: 0,
  description: '',
  date: ''
})

// 表单验证规则
const costFormRules = {
  projectId: [{ required: true, message: '请选择项目', trigger: 'change' }],
  costType: [{ required: true, message: '请选择成本类型', trigger: 'change' }],
  amount: [{ required: true, message: '请输入成本金额', trigger: 'blur' }],
  description: [{ required: true, message: '请输入成本描述', trigger: 'blur' }],
  date: [{ required: true, message: '请选择发生日期', trigger: 'change' }]
}

const costFormRef = ref()

// 组件挂载
onMounted(() => {
  loadProjects()
  loadCostRecords()
  loadFinancialOverview()
})

// 加载项目列表
const loadProjects = async () => {
  try {
    console.log('🔍 开始加载项目列表...')
    const response = await projectApi.getProjects()
    console.log('📊 项目API响应:', response)
    
    // 处理不同的API响应结构
    let projects = []
    if (response.data) {
      // 如果直接是数组
      if (Array.isArray(response.data)) {
        projects = response.data
      }
      // 如果是 {projects: [...], pagination: {...}} 结构
      else if (response.data.projects && Array.isArray(response.data.projects)) {
        projects = response.data.projects
        console.log('📋 从projects属性获取数据，数量:', projects.length)
      }
      // 如果是其他结构，尝试找到数组
      else if (typeof response.data === 'object') {
        // 查找任何包含数组的属性
        for (const key in response.data) {
          if (Array.isArray(response.data[key])) {
            projects = response.data[key]
            console.log(`📋 找到数组数据在属性: ${key}，数量: ${projects.length}`)
            break
          }
        }
      }
    }
    
    console.log('📋 解析后的项目数据:', projects)
    console.log('📋 项目数据类型:', typeof projects, Array.isArray(projects))
    
    // 检查projects是否为数组
    if (!Array.isArray(projects)) {
      console.warn('⚠️ 无法解析项目数据为数组:', response.data)
      projectOptions.value = []
      return
    }
    
    const validProjects = projects.filter(project => 
      project && (project._id || project.id) && project.name
    )
    console.log('✅ 有效项目数量:', validProjects.length)
    projectOptions.value = validProjects
  } catch (error) {
    console.error('❌ 加载项目列表失败:', error)
    ElMessage.error('加载项目列表失败')
    projectOptions.value = []
  }
}

// 加载成本记录
const loadCostRecords = async () => {
  loading.value = true
  try {
    console.log('🔍 开始加载成本记录...')
    const params = { ...queryForm }
    console.log('📋 查询参数:', params)
    
    if (queryForm.dateRange && queryForm.dateRange.length === 2) {
      // 处理日期范围查询
      // 这里可以根据实际需求调整
    }
    
    const response = await projectCostApi.getCosts(params)
    console.log('📊 成本记录API响应:', response)
    
    costRecords.value = response.data.costs || []
    Object.assign(pagination, response.data.pagination || {})
    console.log('✅ 成本记录加载成功，数量:', costRecords.value.length)
  } catch (error) {
    console.error('❌ 加载成本记录失败:', error)
    
    // 根据错误类型显示不同的错误信息
    if (error.response?.status === 500) {
      ElMessage.warning('服务器暂时不可用，显示默认数据')
      // 设置默认的空数据
      costRecords.value = []
      pagination.total = 0
      pagination.page = 1
      pagination.pageSize = 20
      pagination.totalPages = 0
    } else {
      ElMessage.error('加载成本记录失败')
    }
    
    costRecords.value = []
  } finally {
    loading.value = false
  }
}

// 加载财务概览
const loadFinancialOverview = async () => {
  try {
    console.log('🔍 开始加载财务概览...')
    const response = await projectCostApi.getAllProjectCostSummaries()
    console.log('📊 财务概览API响应:', response)
    
    const summaries = response.data || []
    console.log('📋 财务汇总数据:', summaries)
    
    // 安全地计算财务数据，避免undefined或null值
    financialOverview.totalBudget = summaries.reduce((sum, s) => sum + (Number(s?.totalBudget) || 0), 0)
    financialOverview.totalCost = summaries.reduce((sum, s) => sum + (Number(s?.totalCost) || 0), 0)
    financialOverview.expectedProfit = summaries.reduce((sum, s) => sum + (Number(s?.expectedProfit) || 0), 0)
    financialOverview.estimatedBonus = summaries.reduce((sum, s) => sum + (Number(s?.estimatedBonus) || 0), 0)
    
    console.log('✅ 财务概览计算完成:', financialOverview)
  } catch (error) {
    console.error('❌ 加载财务概览失败:', error)
    
    // 根据错误类型显示不同的错误信息
    if (error.response?.status === 500) {
      ElMessage.warning('服务器暂时不可用，显示默认数据')
    } else {
      ElMessage.error('加载财务概览失败')
    }
    
    // 设置默认值，避免页面显示异常
    financialOverview.totalBudget = 0
    financialOverview.totalCost = 0
    financialOverview.expectedProfit = 0
    financialOverview.estimatedBonus = 0
  }
}

// 搜索
const handleSearch = () => {
  queryForm.page = 1
  loadCostRecords()
}

// 重置
const handleReset = () => {
  queryForm.projectId = ''
  queryForm.costType = ''
  queryForm.dateRange = []
  queryForm.page = 1
  loadCostRecords()
}

// 显示创建成本对话框
const showCreateCostDialog = () => {
  isEdit.value = false
  Object.assign(costForm, {
    projectId: '',
    costType: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  })
  costDialogVisible.value = true
}

// 显示编辑成本对话框
const showEditCostDialog = (cost: ProjectCost) => {
  isEdit.value = true
  Object.assign(costForm, {
    projectId: cost.projectId,
    costType: cost.costType,
    amount: cost.amount,
    description: cost.description,
    date: cost.date
  })
  costDialogVisible.value = true
}

// 提交成本表单
const handleSubmitCost = async () => {
  if (!costFormRef.value) return
  
  try {
    await costFormRef.value.validate()
    submitting.value = true
    
    if (isEdit.value) {
      // 编辑模式需要成本ID，这里简化处理
      ElMessage.info('编辑功能待实现')
    } else {
      await projectCostApi.createCost(costForm)
      ElMessage.success('成本记录创建成功')
      costDialogVisible.value = false
      loadCostRecords()
      loadFinancialOverview()
    }
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

// 删除成本记录
const handleDeleteCost = async (cost: ProjectCost) => {
  try {
    await ElMessageBox.confirm('确定要删除这条成本记录吗？', '确认删除', {
      type: 'warning'
    })
    
    await projectCostApi.deleteCost(cost._id!)
    ElMessage.success('删除成功')
    loadCostRecords()
    loadFinancialOverview()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 选择变化
const handleSelectionChange = (selection: ProjectCost[]) => {
  selectedCosts.value = selection
}

// 导出数据
const handleExport = () => {
  ElMessage.info('导出功能待实现')
}

// 工具函数
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(amount || 0)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const getCostTypeTagType = (costType: string) => {
  const types: Record<string, string> = {
    '人力成本': 'primary',
    '材料成本': 'success',
    '其他成本': 'warning'
  }
  return types[costType] || 'info'
}

const getStatusTagType = (status: string) => {
  const types: Record<string, string> = {
    'pending': 'warning',
    'confirmed': 'success',
    'rejected': 'danger'
  }
  return types[status] || 'info'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'pending': '待审核',
    'confirmed': '已确认',
    'rejected': '已拒绝'
  }
  return labels[status] || status
}

const getProfitClass = (profit: number) => {
  if (profit > 0) {
    return 'profit-positive'
  } else if (profit < 0) {
    return 'profit-negative'
  }
  return ''
}
</script>

<style scoped>
.project-cost-management {
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
  gap: 10px;
}

.search-section {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.finance-overview {
  margin-bottom: 20px;
}

.overview-card {
  text-align: center;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.overview-item {
  display: flex;
  align-items: center;
  padding: 20px 0;
}

.overview-icon {
  font-size: 48px;
  margin-right: 20px;
}

.budget-icon {
  color: #409eff;
}

.cost-icon {
  color: #e6a23c;
}

.profit-icon {
  color: #67c23a;
}

.bonus-icon {
  color: #f56c6c;
}

.overview-content {
  text-align: left;
}

.overview-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.overview-label {
  font-size: 14px;
  color: #909399;
}

.profit-positive {
  color: #67c23a;
}

.profit-negative {
  color: #f56c6c;
}

.table-section {
  background: white;
  border-radius: 4px;
  padding: 20px;
}

.cost-amount {
  font-weight: bold;
  color: #e6a23c;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: right;
}

.batch-actions {
  margin-top: 20px;
  padding: 15px;
  background: #f0f9ff;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.batch-buttons {
  display: flex;
  gap: 10px;
}
</style>
