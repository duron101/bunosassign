<template>
  <div class="my-projects">
    <div class="page-header">
      <h2>我的项目</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showJoinDialog">
          <el-icon><Plus /></el-icon>
          申请加入项目
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">{{ stats.totalProjects }}</div>
            <div class="stat-label">参与项目</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">{{ stats.activeProjects }}</div>
            <div class="stat-label">活跃项目</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">{{ stats.pendingApplications }}</div>
            <div class="stat-label">待审批申请</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">{{ formatCurrency(stats.totalProjectBonus) }}</div>
            <div class="stat-label">项目奖金</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 项目列表 -->
    <div class="table-section">
      <vxe-table
        ref="projectTable"
        :data="projectList"
        stripe
        border
        show-overflow="title"
        height="500"
        empty-text="暂无项目数据"
        :empty-render="{ name: 'AEmpty' }"
      >
        <template #loading>
          <div v-if="loading" class="loading-overlay">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>加载中...</span>
          </div>
        </template>
        <vxe-column field="projectName" title="项目名称" width="200">
          <template #default="scope">
            <div v-if="scope && scope.row" class="project-info">
              <div class="project-name">{{ scope.row.projectName }}</div>
              <div class="project-code">{{ scope.row.projectCode }}</div>
            </div>
          </template>
        </vxe-column>
        
        <vxe-column field="status" title="参与状态" width="120">
          <template #default="scope">
            <el-tag
              v-if="scope && scope.row"
              :type="getMemberStatusType(scope.row.status)"
              size="small"
            >
              {{ getMemberStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </vxe-column>

        <vxe-column field="roleName" title="项目角色" width="120">
          <template #default="scope">
            <span v-if="scope && scope.row && scope.row.roleName">{{ scope.row.roleName }}</span>
            <span v-else-if="scope && scope.row" class="text-muted">未分配</span>
          </template>
        </vxe-column>

        <vxe-column field="participationRatio" title="参与度" width="100">
          <template #default="scope">
            <span v-if="scope && scope.row && scope.row.participationRatio">{{ Math.round(scope.row.participationRatio * 100) }}%</span>
            <span v-else-if="scope && scope.row">-</span>
          </template>
        </vxe-column>

        <vxe-column field="projectStatus" title="项目状态" width="100">
          <template #default="scope">
            <el-tag
              v-if="scope && scope.row"
              :type="getProjectStatusType(scope.row.projectStatus)"
              size="small"
            >
              {{ getProjectStatusLabel(scope.row.projectStatus) }}
            </el-tag>
          </template>
        </vxe-column>

        <vxe-column field="joinDate" title="加入时间" width="120">
          <template #default="scope">
            <span v-if="scope && scope.row && scope.row.joinDate">{{ formatDate(scope.row.joinDate) }}</span>
            <span v-else-if="scope && scope.row">-</span>
          </template>
        </vxe-column>

        <vxe-column field="projectBonus" title="项目奖金" width="120">
          <template #default="scope">
            <span v-if="scope && scope.row && scope.row.projectBonus" class="bonus-amount">
              {{ formatCurrency(scope.row.projectBonus) }}
            </span>
            <span v-else-if="scope && scope.row">-</span>
          </template>
        </vxe-column>

        <vxe-column title="操作" width="180" fixed="right">
          <template #default="scope">
            <div v-if="scope && scope.row">
              <el-button
                v-if="scope.row.status === 'pending'"
                type="danger"
                size="small"
                text
                @click="cancelApplication(scope.row)"
              >
                取消申请
              </el-button>
              <el-button
                v-if="scope.row.status === 'approved'"
                type="primary"
                size="small"
                text
                @click="viewProjectDetails(scope.row)"
              >
                查看详情
              </el-button>
              <el-button
                v-if="scope.row.status === 'approved'"
                type="success"
                size="small"
                text
                @click="viewProjectBonus(scope.row)"
              >
                奖金详情
              </el-button>
            </div>
          </template>
        </vxe-column>
      </vxe-table>
    </div>

    <!-- 申请加入项目对话框 -->
    <el-dialog
      v-model="joinDialogVisible"
      title="申请加入项目"
      width="600px"
      @close="resetJoinForm"
    >
      <el-form
        ref="joinFormRef"
        :model="joinForm"
        :rules="joinFormRules"
        label-width="80px"
      >
        <el-form-item label="选择项目" prop="projectId">
          <el-select
            v-model="joinForm.projectId"
            placeholder="请选择要加入的项目"
            style="width: 100%"
            filterable
            @change="handleProjectSelect"
          >
            <el-option
              v-for="project in availableProjects"
              :key="project._id"
              :label="`${project.name} (${project.code})`"
              :value="project._id"
            >
              <div class="project-option">
                <div class="project-name">{{ project.name }}</div>
                <div class="project-desc">{{ project.description }}</div>
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="申请理由" prop="applyReason">
          <el-input
            v-model="joinForm.applyReason"
            type="textarea"
            :rows="4"
            placeholder="请说明申请加入此项目的理由和优势"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="期望角色">
          <el-select
            v-model="joinForm.expectedRole"
            placeholder="请选择期望的项目角色"
            style="width: 100%"
          >
            <el-option
              v-for="role in projectRoles"
              :key="role._id"
              :label="role.name"
              :value="role._id"
            >
              <div>
                <span>{{ role.name }}</span>
                <span class="role-desc">{{ role.description }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="joinDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitJoinApplication" :loading="submitting">
            提交申请
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 项目奖金详情对话框 -->
    <el-dialog
      v-model="bonusDialogVisible"
      title="项目奖金详情"
      width="800px"
    >
      <div v-if="selectedProjectBonus">
        <div class="bonus-overview">
          <h4>奖金概况</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="项目名称">
              {{ selectedProjectBonus.projectName }}
            </el-descriptions-item>
            <el-descriptions-item label="奖金期间">
              {{ selectedProjectBonus.period }}
            </el-descriptions-item>
            <el-descriptions-item label="我的角色">
              {{ selectedProjectBonus.roleName }}
            </el-descriptions-item>
            <el-descriptions-item label="参与度">
              {{ Math.round(selectedProjectBonus.participationRatio * 100) }}%
            </el-descriptions-item>
            <el-descriptions-item label="角色权重">
              {{ selectedProjectBonus.roleWeight }}
            </el-descriptions-item>
            <el-descriptions-item label="绩效系数">
              {{ selectedProjectBonus.performanceCoeff }}
            </el-descriptions-item>
            <el-descriptions-item label="项目奖金">
              <span class="bonus-amount">{{ formatCurrency(selectedProjectBonus.bonusAmount) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getBonusStatusType(selectedProjectBonus.bonusStatus)">
                {{ getBonusStatusLabel(selectedProjectBonus.bonusStatus) }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="bonus-calculation" style="margin-top: 20px;">
          <h4>计算说明</h4>
          <div class="calculation-formula">
            <p>项目奖金 = 项目奖金池 × 角色权重 × 绩效系数 × 参与度</p>
            <p>
              = {{ formatCurrency(selectedProjectBonus.poolTotalAmount) }} × 
              {{ selectedProjectBonus.roleWeight }} × 
              {{ selectedProjectBonus.performanceCoeff }} × 
              {{ Math.round(selectedProjectBonus.participationRatio * 100) }}% = 
              <strong>{{ formatCurrency(selectedProjectBonus.bonusAmount) }}</strong>
            </p>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Loading } from '@element-plus/icons-vue'
import { projectMemberApi } from '@/api/projectMember'
import { projectApi } from '@/api/project'
import { formatCurrency, formatDate } from '@/utils/format'

// 数据定义
const loading = ref(false)
const projectList = ref([])
const availableProjects = ref([])
const projectRoles = ref([])
const stats = reactive({
  totalProjects: 0,
  activeProjects: 0,
  pendingApplications: 0,
  totalProjectBonus: 0
})

// 申请加入项目相关
const joinDialogVisible = ref(false)
const joinFormRef = ref()
const submitting = ref(false)
const joinForm = reactive({
  projectId: '',
  applyReason: '',
  expectedRole: ''
})

const joinFormRules = {
  projectId: [
    { required: true, message: '请选择要加入的项目', trigger: 'change' }
  ],
  applyReason: [
    { required: true, message: '请填写申请理由', trigger: 'blur' },
    { min: 10, message: '申请理由至少10个字符', trigger: 'blur' }
  ]
}

// 奖金详情相关
const bonusDialogVisible = ref(false)
const selectedProjectBonus = ref(null)

// 状态和标签映射
const MEMBER_STATUS_LABELS = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已拒绝'
}

const PROJECT_STATUS_LABELS = {
  planning: '规划中',
  active: '进行中',
  completed: '已完成',
  suspended: '暂停'
}

const BONUS_STATUS_LABELS = {
  calculated: '已计算',
  approved: '已审批',
  distributed: '已发放'
}

// 方法定义
const getMemberStatusType = (status) => {
  const types = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return types[status] || 'info'
}

const getMemberStatusLabel = (status) => {
  return MEMBER_STATUS_LABELS[status] || '未知'
}

const getProjectStatusType = (status) => {
  const types = {
    planning: 'info',
    active: 'success',
    completed: 'primary',
    suspended: 'warning'
  }
  return types[status] || 'info'
}

const getProjectStatusLabel = (status) => {
  return PROJECT_STATUS_LABELS[status] || '未知'
}

const getBonusStatusType = (status) => {
  const types = {
    calculated: 'warning',
    approved: 'primary',
    distributed: 'success'
  }
  return types[status] || 'info'
}

const getBonusStatusLabel = (status) => {
  return BONUS_STATUS_LABELS[status] || '未知'
}

// 加载我的项目列表
const loadMyProjects = async () => {
  try {
    loading.value = true
    const response = await projectMemberApi.getMyProjects()
    
    // 确保数据是数组并且每个元素都是有效的对象
    if (response && response.data && Array.isArray(response.data)) {
      projectList.value = response.data.filter(item => item && typeof item === 'object')
    } else {
      projectList.value = []
    }
    
    // 计算统计数据
    stats.totalProjects = projectList.value.length
    stats.activeProjects = projectList.value.filter(p => p && p.projectStatus === 'active').length
    stats.pendingApplications = projectList.value.filter(p => p && p.status === 'pending').length
    stats.totalProjectBonus = projectList.value
      .filter(p => p && p.projectBonus && !isNaN(Number(p.projectBonus)))
      .reduce((sum, p) => sum + Number(p.projectBonus), 0)
      
  } catch (error) {
    console.error('加载项目列表失败:', error)
    ElMessage.error('加载项目列表失败: ' + (error.message || '未知错误'))
    projectList.value = []
    
    // 重置统计数据
    stats.totalProjects = 0
    stats.activeProjects = 0
    stats.pendingApplications = 0
    stats.totalProjectBonus = 0
  } finally {
    loading.value = false
  }
}

// 加载可申请的项目
const loadAvailableProjects = async () => {
  try {
    const response = await projectApi.getAvailableProjects()
    availableProjects.value = response.data
  } catch (error) {
    ElMessage.error('加载可申请项目失败: ' + error.message)
  }
}

// 加载项目角色列表
const loadProjectRoles = async () => {
  try {
    const response = await projectMemberApi.getProjectRoles()
    projectRoles.value = response.data
  } catch (error) {
    ElMessage.error('加载项目角色失败: ' + error.message)
  }
}

// 显示申请加入项目对话框
const showJoinDialog = async () => {
  await loadAvailableProjects()
  await loadProjectRoles()
  joinDialogVisible.value = true
}

// 重置申请表单
const resetJoinForm = () => {
  Object.assign(joinForm, {
    projectId: '',
    applyReason: '',
    expectedRole: ''
  })
  joinFormRef.value?.resetFields()
}

// 提交加入申请
const submitJoinApplication = async () => {
  try {
    const valid = await joinFormRef.value.validate()
    if (!valid) return

    submitting.value = true
    await projectMemberApi.applyToJoin({
      projectId: joinForm.projectId,
      applyReason: joinForm.applyReason,
      expectedRole: joinForm.expectedRole
    })

    ElMessage.success('申请提交成功，请等待项目经理审批')
    joinDialogVisible.value = false
    await loadMyProjects()
    
  } catch (error) {
    ElMessage.error('提交申请失败: ' + error.message)
  } finally {
    submitting.value = false
  }
}

// 取消申请
const cancelApplication = async (row) => {
  try {
    await ElMessageBox.confirm('确定要取消此项目申请吗？', '确认取消', {
      type: 'warning'
    })

    await projectMemberApi.cancelApplication(row._id)
    ElMessage.success('申请已取消')
    await loadMyProjects()
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消申请失败: ' + error.message)
    }
  }
}

// 查看项目详情
const viewProjectDetails = (row) => {
  // TODO: 跳转到项目详情页
  ElMessage.info('项目详情功能开发中')
}

// 查看项目奖金详情
const viewProjectBonus = async (row) => {
  try {
    const response = await projectMemberApi.getProjectBonusDetails(row.projectId, '2024Q4')
    selectedProjectBonus.value = response.data
    bonusDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取奖金详情失败: ' + error.message)
  }
}

// 生命周期
onMounted(() => {
  loadMyProjects()
})
</script>

<style scoped>
.my-projects {
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

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.table-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.project-info .project-name {
  font-weight: 500;
  color: #303133;
}

.project-info .project-code {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.bonus-amount {
  color: #67c23a;
  font-weight: 500;
}

.text-muted {
  color: #c0c4cc;
}

.project-option {
  line-height: 1.4;
}

.project-option .project-name {
  font-weight: 500;
}

.project-option .project-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.role-desc {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.bonus-overview h4 {
  margin-bottom: 16px;
  color: #303133;
}

.calculation-formula {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.6;
}

.calculation-formula p {
  margin: 8px 0;
}
</style>