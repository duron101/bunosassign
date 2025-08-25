<template>
  <div class="project-management">
    <div class="page-header">
      <h2>项目管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          新增项目
        </el-button>
        <el-button type="success" @click="goToProjectPublish">
          <el-icon><Plus /></el-icon>
          发布项目
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
        <el-form-item label="搜索">
          <el-input
            v-model="queryForm.search"
            placeholder="项目名称、代码或描述"
            style="width: 200px"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option
              v-for="(label, value) in PROJECT_STATUS_LABELS"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="queryForm.priority" placeholder="全部优先级" clearable style="width: 120px">
            <el-option
              v-for="(label, value) in PROJECT_PRIORITY_LABELS"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
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

    <!-- 统计卡片区域 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="4">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-value">{{ statistics.total }}</div>
              <div class="stat-label">项目总数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-value">{{ statistics.active }}</div>
              <div class="stat-label">进行中</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-value">{{ statistics.completed }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-value">{{ statistics.planning }}</div>
              <div class="stat-label">规划中</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-value">{{ formatCurrency(statistics.totalBudget) }}</div>
              <div class="stat-label">总预算</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-value">{{ formatCurrency(statistics.totalProfitTarget) }}</div>
              <div class="stat-label">利润目标</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 项目财务概览 -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="6">
          <el-card class="finance-card profit-card">
            <div class="finance-item">
              <div class="finance-icon">
                <el-icon><Money /></el-icon>
              </div>
              <div class="finance-content">
                <div class="finance-value">{{ formatCurrency(financialStats.totalBudget) }}</div>
                <div class="finance-label">项目总预算</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="finance-card cost-card">
            <div class="finance-item">
              <div class="finance-icon">
                <el-icon><Wallet /></el-icon>
              </div>
              <div class="finance-content">
                <div class="finance-value">{{ formatCurrency(financialStats.totalCost) }}</div>
                <div class="finance-label">当前总成本</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="finance-card expected-profit-card">
            <div class="finance-item">
              <div class="finance-icon">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="finance-content">
                <div class="finance-value" :class="getProfitClass(financialStats.expectedProfit)">
                  {{ formatCurrency(financialStats.expectedProfit) }}
                </div>
                <div class="finance-label">预期利润</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="finance-card bonus-card">
            <div class="finance-item">
              <div class="finance-icon">
                <el-icon><Present /></el-icon>
              </div>
              <div class="finance-content">
                <div class="finance-value">{{ formatCurrency(financialStats.estimatedBonus) }}</div>
                <div class="finance-label">预估奖金</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 项目列表 -->
    <div class="table-section">
      <el-table
        v-loading="loading"
        :data="projects"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="项目名称" min-width="150">
          <template #default="{ row }">
            <div class="project-name">
              <span class="name">{{ row.name }}</span>
              <el-tag 
                :type="PROJECT_STATUS_COLORS[(row as any).status]" 
                size="small"
                class="status-tag"
              >
                {{ PROJECT_STATUS_LABELS[(row as any).status] }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="项目代码" width="120" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="Manager" label="项目经理" width="120">
          <template #default="{ row }">
            <span v-if="row.Manager">{{ row.Manager.name }}</span>
            <span v-else class="text-muted">未指定</span>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="PROJECT_PRIORITY_COLORS[(row as any).priority]" size="small">
              {{ PROJECT_PRIORITY_LABELS[(row as any).priority] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startDate" label="开始日期" width="100">
          <template #default="{ row }">
            <span v-if="row.startDate">{{ formatDate(row.startDate) }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="endDate" label="结束日期" width="100">
          <template #default="{ row }">
            <span v-if="row.endDate">{{ formatDate(row.endDate) }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="budget" label="预算" width="120" align="right">
          <template #default="{ row }">
            <span v-if="row.budget">{{ formatCurrency(row.budget) }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="财务概览" width="200" align="center">
          <template #default="{ row }">
            <div class="finance-overview">
              <div class="finance-row">
                <span class="finance-label">成本:</span>
                <span class="finance-value cost-value">
                  {{ formatCurrency((row as any).cost || 0) }}
                </span>
              </div>
              <div class="finance-row">
                <span class="finance-label">利润:</span>
                <span class="finance-value" :class="getProfitClass((row as any).expectedProfit || 0)">
                  {{ formatCurrency((row as any).expectedProfit || 0) }}
                </span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="showDetailDialog(row)">详情</el-button>
            <el-button link type="primary" @click="showEditDialog(row)">编辑</el-button>
            <el-button link type="warning" @click="showWeightDialog(row)">权重配置</el-button>
            <el-dropdown @command="handleCommand">
              <el-button link type="primary">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="`status_${row.id}`">
                    修改状态
                  </el-dropdown-item>
                  <el-dropdown-item :command="`delete_${row.id}`" class="danger-item">
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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

    <!-- 批量操作工具栏 -->
    <div v-if="selectedProjects.length > 0" class="batch-actions">
      <el-alert
        :title="`已选择 ${selectedProjects.length} 项`"
        type="info"
        show-icon
        :closable="false"
      />
      <div class="batch-buttons">
        <el-button @click="handleBatchStatusChange('active')">批量激活</el-button>
        <el-button @click="handleBatchStatusChange('on_hold')">批量暂停</el-button>
      </div>
    </div>

    <!-- 项目详情对话框 -->
    <ProjectDetailDialog
      v-model="detailVisible"
      :project="currentProject"
      @edit="handleEditFromDetail"
    />

    <!-- 项目表单对话框 -->
    <ProjectFormDialog
      v-model="formVisible"
      :project="currentProject"
      :mode="isEdit ? 'edit' : 'create'"
      @success="handleFormSuccess"
    />

    <!-- 权重配置对话框 -->
    <ProjectWeightDialog
      v-model="weightConfigVisible"
      :project="currentProject"
      @success="handleWeightSuccess"
    />

    <!-- 状态修改对话框 -->
    <el-dialog v-model="statusDialogVisible" title="修改项目状态" width="400px">
      <el-form>
        <el-form-item label="项目状态">
          <el-select v-model="newStatus" placeholder="请选择状态" style="width: 100%">
            <el-option
              v-for="(label, value) in PROJECT_STATUS_LABELS"
              :key="value"
              :label="label"
              :value="value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="statusDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleStatusChange">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, Download, Search, Refresh, ArrowDown, Money, Wallet, TrendCharts, Present
} from '@element-plus/icons-vue'
import { projectApi } from '@/api/project'
import ProjectDetailDialog from './components/ProjectDetailDialog.vue'
import ProjectFormDialog from './components/ProjectFormDialog.vue'
import ProjectWeightDialog from './components/ProjectWeightDialog.vue'
import type { 
  Project, 
  ProjectListParams, 
  ProjectStatistics,
  ProjectStatus,
  ProjectPriority 
} from '@/types/project'
import { 
  PROJECT_STATUS_LABELS, 
  PROJECT_STATUS_COLORS,
  PROJECT_PRIORITY_LABELS,
  PROJECT_PRIORITY_COLORS,
  ProjectStatus as Status
} from '@/types/project'

// 路由
const router = useRouter()

// 响应式数据
const loading = ref(false)
const projects = ref<Project[]>([])
const selectedProjects = ref<Project[]>([])
const currentProject = ref<Project | null>(null)

// 对话框控制
const detailVisible = ref(false)
const formVisible = ref(false)
const weightConfigVisible = ref(false)
const statusDialogVisible = ref(false)
const isEdit = ref(false)
const newStatus = ref<ProjectStatus>()

// 查询表单
const queryForm = reactive<ProjectListParams & { page: number; pageSize: number }>({
  page: 1,
  pageSize: 20,
  search: '',
  status: undefined,
  priority: undefined
})

// 分页信息
const pagination = reactive({
  total: 0,
  page: 1,
  pageSize: 20,
  totalPages: 0
})

// 统计信息
const statistics = reactive<ProjectStatistics>({
  total: 0,
  planning: 0,
  active: 0,
  completed: 0,
  cancelled: 0,
  onHold: 0,
  totalBudget: 0,
  totalProfitTarget: 0
})

// 项目财务概览统计
const financialStats = reactive({
  totalBudget: 0,
  totalCost: 0,
  expectedProfit: 0,
  estimatedBonus: 0
})

// 计算统计信息
const calculateStatistics = () => {
  statistics.total = projects.value.length
  statistics.active = projects.value.filter(p => (p as any).status === 'active').length
  statistics.completed = projects.value.filter(p => (p as any).status === 'completed').length
  statistics.planning = projects.value.filter(p => (p as any).status === 'planning').length
  statistics.totalBudget = projects.value.reduce((sum, p) => sum + (p.budget || 0), 0)
  statistics.totalProfitTarget = projects.value.reduce((sum, p) => sum + (p.profitTarget || 0), 0)

  // 计算项目财务概览
  financialStats.totalBudget = projects.value.reduce((sum, p) => sum + (p.budget || 0), 0)
  financialStats.totalCost = projects.value.reduce((sum, p) => sum + ((p as any).cost || 0), 0)
  financialStats.expectedProfit = financialStats.totalBudget - financialStats.totalCost
  financialStats.estimatedBonus = projects.value.reduce((sum, p) => sum + ((p as any).estimatedBonus || 0), 0)
}

// 加载项目列表
const loadProjects = async () => {
  loading.value = true
  try {
    const response = await projectApi.getProjects(queryForm)
    projects.value = response.data.projects
    Object.assign(pagination, response.data.pagination)
    calculateStatistics()
  } catch (error) {
    ElMessage.error('加载项目列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  queryForm.page = 1
  loadProjects()
}

// 重置搜索
const handleReset = () => {
  Object.assign(queryForm, {
    page: 1,
    pageSize: 20,
    search: '',
    status: undefined,
    priority: undefined
  })
  loadProjects()
}

// 显示创建对话框
const showCreateDialog = () => {
  currentProject.value = null
  isEdit.value = false
  formVisible.value = true
}

// 显示编辑对话框
const showEditDialog = (project: Project) => {
  currentProject.value = project
  isEdit.value = true
  formVisible.value = true
}

// 从详情页编辑
const handleEditFromDetail = (project: Project) => {
  showEditDialog(project)
}

// 显示详情对话框
const showDetailDialog = (project: Project) => {
  currentProject.value = project
  detailVisible.value = true
}

// 显示权重配置对话框
const showWeightDialog = (project: Project) => {
  currentProject.value = project
  weightConfigVisible.value = true
}

// 表单成功回调
const handleFormSuccess = () => {
  loadProjects()
}

// 权重配置成功回调
const handleWeightSuccess = () => {
  // 可以在这里刷新列表或显示消息
}

// 选择变化处理
const handleSelectionChange = (selection: Project[]) => {
  selectedProjects.value = selection
}

// 命令处理
const handleCommand = (command: string) => {
  const [action, id] = command.split('_')
  const projectId = parseInt(id)
  
  switch (action) {
    case 'status':
      handleStatusCommand(projectId)
      break
    case 'delete':
      handleDeleteCommand(projectId)
      break
  }
}

// 状态修改命令
const handleStatusCommand = (projectId: number) => {
  const project = projects.value.find(p => p.id === projectId)
  if (project) {
    currentProject.value = project
    newStatus.value = project.status
    statusDialogVisible.value = true
  }
}

// 状态修改确认
const handleStatusChange = async () => {
  if (!currentProject.value || !newStatus.value) return
  
  try {
    await projectApi.updateProject(currentProject.value.id, {
      status: newStatus.value
    })
    ElMessage.success('项目状态修改成功')
    statusDialogVisible.value = false
    loadProjects()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '状态修改失败')
  }
}

// 删除命令
const handleDeleteCommand = async (projectId: number) => {
  const project = projects.value.find(p => p.id === projectId)
  if (!project) return
  
  try {
    await ElMessageBox.confirm(
      `确定要删除项目 "${project.name}" 吗？此操作不可恢复！`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await projectApi.deleteProject(projectId)
    ElMessage.success('项目删除成功')
    loadProjects()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '删除失败')
    }
  }
}

// 批量状态修改
const handleBatchStatusChange = async (status: ProjectStatus) => {
  if (selectedProjects.value.length === 0) return
  
  try {
    await ElMessageBox.confirm(
      `确定要将选中的 ${selectedProjects.value.length} 个项目状态修改为"${PROJECT_STATUS_LABELS[status]}"吗？`,
      '批量修改状态',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 批量更新状态
    const updatePromises = selectedProjects.value.map(project =>
      projectApi.updateProject(project.id, { status })
    )
    
    await Promise.all(updatePromises)
    ElMessage.success('批量状态修改成功')
    loadProjects()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('批量状态修改失败')
    }
  }
}

// 导出数据
const handleExport = () => {
  // TODO: 实现数据导出功能
  ElMessage.info('导出功能开发中...')
}

// 格式化日期
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

// 格式化货币
const formatCurrency = (amount: number): string => {
  if (amount === 0) return '¥0'
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// 获取利润颜色类
const getProfitClass = (profit: number) => {
  if (profit > 0) {
    return 'profit-positive'
  } else if (profit < 0) {
    return 'profit-negative'
  } else {
    return ''
  }
}

// 跳转到项目发布页面
const goToProjectPublish = () => {
  router.push('/project/publish')
}

// 组件挂载
onMounted(() => {
  loadProjects()
})
</script>

<style scoped>
.project-management {
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
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stats-section {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-item {
  padding: 10px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.table-section {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.project-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.name {
  font-weight: 500;
}

.status-tag {
  flex-shrink: 0;
}

.text-muted {
  color: #909399;
}

.pagination-wrapper {
  padding: 20px;
  text-align: right;
  border-top: 1px solid #ebeef5;
}

.batch-actions {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  padding: 10px 20px;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 20px;
  z-index: 1000;
}

.batch-buttons {
  display: flex;
  gap: 10px;
}

:deep(.danger-item) {
  color: #f56c6c;
}

:deep(.el-table) {
  border-radius: 4px 4px 0 0;
}

.finance-card {
  text-align: center;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 10px;
}

.finance-item {
  display: flex;
  align-items: center;
  padding: 15px 0;
}

.finance-icon {
  font-size: 36px;
  color: #409eff;
  margin-right: 15px;
}

.finance-content {
  text-align: left;
}

.finance-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.profit-positive {
  color: #67c23a; /* 绿色 */
}

.profit-negative {
  color: #f56c6c; /* 红色 */
}

.finance-overview {
  text-align: center;
}

.finance-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 12px;
}

.finance-row:last-child {
  margin-bottom: 0;
}

.finance-label {
  color: #606266;
  font-weight: 500;
}

.finance-value {
  font-weight: bold;
}

.cost-value {
  color: #e6a23c; /* 橙色 */
}

.profit-positive {
  color: #67c23a; /* 绿色 */
}

.profit-negative {
  color: #f56c6c; /* 红色 */
}
</style>