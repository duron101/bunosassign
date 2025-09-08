<template>
  <el-dialog
    v-model="visible"
    :title="`项目详情 - ${project?.name || ''}`"
    width="90%"
    :before-close="handleClose"
    class="enhanced-project-dialog"
  >
    <div class="project-detail-content" v-if="project">
      <!-- 项目状态跟踪器 -->
      <ProjectStatusTracker
        :project="project"
        :show-application-stats="true"
        :show-progress="project.status === 'active' || project.status === 'completed'"
        @approve-application="handleApproveApplication"
        @reject-application="handleRejectApplication"
      />

      <!-- 项目信息卡片 -->
      <el-row :gutter="20">
        <!-- 基本信息 -->
        <el-col :span="12">
          <el-card class="info-card">
            <template #header>
              <div class="card-header">
                <h4>基本信息</h4>
                <el-button 
                  v-if="canEditProject" 
                  type="text" 
                  size="small"
                  @click="showEditDialog"
                >
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
              </div>
            </template>
            
            <el-descriptions :column="2" border>
              <el-descriptions-item label="项目名称">
                {{ project.name }}
              </el-descriptions-item>
              <el-descriptions-item label="项目代码">
                {{ project.code }}
              </el-descriptions-item>
              <el-descriptions-item label="项目状态">
                <el-tag :type="getStatusType(project.status)">
                  {{ getStatusLabel(project.status) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="优先级">
                <el-tag :type="getPriorityType(project.priority)">
                  {{ getPriorityLabel(project.priority) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="项目预算">
                {{ formatCurrency(project.budget) }}
              </el-descriptions-item>
              <el-descriptions-item label="奖金规模">
                {{ formatCurrency(project.bonusScale) }}
              </el-descriptions-item>
              <el-descriptions-item label="开始日期">
                {{ formatDate(project.startDate) }}
              </el-descriptions-item>
              <el-descriptions-item label="结束日期">
                {{ formatDate(project.endDate) }}
              </el-descriptions-item>
            </el-descriptions>

            <div class="description-section" v-if="project.description">
              <h5>项目描述</h5>
              <p class="description-text">{{ project.description }}</p>
            </div>

            <div class="work-content-section" v-if="project.workContent">
              <h5>工作内容</h5>
              <div class="work-content-text">
                {{ project.workContent }}
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 技能要求和团队信息 -->
        <el-col :span="12">
          <!-- 技能要求 -->
          <el-card class="info-card" v-if="project.skillRequirements?.length">
            <template #header>
              <h4>技能要求</h4>
            </template>
            
            <div class="skills-container">
              <el-tag
                v-for="skill in project.skillRequirements"
                :key="skill"
                class="skill-tag"
                type="info"
              >
                {{ skill }}
              </el-tag>
            </div>
          </el-card>

          <!-- 团队信息 -->
          <el-card class="info-card team-card">
            <template #header>
              <div class="card-header">
                <h4>团队信息</h4>
                <el-button 
                  v-if="canManageTeam" 
                  type="text" 
                  size="small"
                  @click="showTeamManagement"
                >
                  <el-icon><UserFilled /></el-icon>
                  管理团队
                </el-button>
              </div>
            </template>
            
            <div class="team-stats">
              <div class="team-stat-item">
                <div class="stat-number">{{ teamMembers?.length || 0 }}</div>
                <div class="stat-label">团队成员</div>
              </div>
              <div class="team-stat-item">
                <div class="stat-number">{{ project.teamSize || 'N/A' }}</div>
                <div class="stat-label">目标规模</div>
              </div>
              <div class="team-stat-item">
                <div class="stat-number">{{ getTeamRoleCount() }}</div>
                <div class="stat-label">职能角色</div>
              </div>
            </div>

            <div class="team-members" v-if="teamMembers?.length">
              <h5>团队成员</h5>
              <div class="member-list">
                <div 
                  class="member-item"
                  v-for="member in teamMembers"
                  :key="member.id"
                >
                  <el-avatar :size="32" :src="member.avatar">
                    {{ member.name?.charAt(0) }}
                  </el-avatar>
                  <div class="member-info">
                    <div class="member-name">{{ member.name }}</div>
                    <div class="member-role">{{ member.role || '成员' }}</div>
                  </div>
                  <div class="member-actions" v-if="canManageTeam">
                    <el-button 
                      type="text" 
                      size="small"
                      @click="showMemberDetail(member)"
                    >
                      详情
                    </el-button>
                  </div>
                </div>
              </div>
            </div>

            <div class="empty-team" v-else>
              <el-empty description="暂无团队成员" :image-size="60" />
              <el-button 
                v-if="canApplyProject && project.status !== 'completed'"
                type="primary" 
                size="small"
                @click="showApplicationDialog"
              >
                申请加入
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 项目活动时间线 -->
      <el-card class="timeline-card" v-if="showTimeline">
        <template #header>
          <h4>项目活动</h4>
        </template>
        
        <el-timeline>
          <el-timeline-item
            v-for="activity in projectActivities"
            :key="activity.id"
            :timestamp="formatDateTime(activity.createdAt)"
            :type="getActivityType(activity.type)"
          >
            <div class="activity-content">
              <div class="activity-title">{{ activity.title }}</div>
              <div class="activity-description" v-if="activity.description">
                {{ activity.description }}
              </div>
              <div class="activity-user" v-if="activity.user">
                由 {{ activity.user.name }} 操作
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </el-card>
    </div>

    <!-- 对话框底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button 
          v-if="canApplyProject && project?.status !== 'completed'" 
          type="primary"
          @click="showApplicationDialog"
        >
          申请加入项目
        </el-button>
        <el-button 
          v-if="canEditProject" 
          type="success"
          @click="showEditDialog"
        >
          编辑项目
        </el-button>
      </div>
    </template>

    <!-- 团队申请对话框 -->
    <TeamApplicationDialog
      v-model="applicationDialogVisible"
      :project="project"
      @submit="handleApplicationSubmit"
    />

    <!-- 团队管理对话框 -->
    <el-dialog
      v-model="teamManagementVisible"
      title="团队管理"
      width="600px"
    >
      <div class="team-management">
        <!-- 团队管理内容 -->
        <el-table :data="teamMembers" style="width: 100%">
          <el-table-column prop="name" label="姓名" />
          <el-table-column prop="role" label="角色" />
          <el-table-column prop="joinDate" label="加入时间" />
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button 
                type="text" 
                size="small"
                @click="removeMember(scope.row)"
              >
                移除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ProjectStatusTracker from './ProjectStatusTracker.vue'
import TeamApplicationDialog from './TeamApplicationDialog.vue'
import { useProjectPermissions } from '@/composables/useProjectPermissions'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  project: {
    type: Object,
    default: () => null
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'edit', 'apply', 'approve-application', 'reject-application'])

// 权限控制
const { 
  canEditProject: canEdit, 
  canApplyProject, 
  canManageTeam: canManage,
  canApproveTeam 
} = useProjectPermissions()

// 响应式数据
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const applicationDialogVisible = ref(false)
const teamManagementVisible = ref(false)
const showTimeline = ref(true)

// 计算属性
const canEditProject = computed(() => {
  return canEdit.value || (props.project?.managerId === getCurrentUserId())
})

const canManageTeam = computed(() => {
  return canManage.value || (props.project?.managerId === getCurrentUserId())
})

const teamMembers = computed(() => {
  return props.project?.members || []
})

const projectActivities = computed(() => {
  const activities = []
  
  // 项目创建
  if (props.project?.createdAt) {
    activities.push({
      id: 'created',
      type: 'created',
      title: '项目创建',
      description: '项目已创建并发布',
      createdAt: props.project.createdAt,
      user: { name: '系统' }
    })
  }

  // 团队申请记录
  if (props.project?.applications) {
    props.project.applications.forEach(app => {
      activities.push({
        id: `app-${app.id}`,
        type: 'application',
        title: '团队申请',
        description: `${app.applicantName} 申请加入项目`,
        createdAt: app.createdAt,
        user: { name: app.applicantName }
      })
    })
  }

  return activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

// 方法
const getCurrentUserId = () => {
  // 从用户 store 获取当前用户 ID
  return 1 // 临时返回，实际应从 store 获取
}

const handleClose = () => {
  visible.value = false
}

const showEditDialog = () => {
  emit('edit', props.project)
}

const showApplicationDialog = () => {
  applicationDialogVisible.value = true
}

const showTeamManagement = () => {
  teamManagementVisible.value = true
}

const showMemberDetail = (member) => {
  console.log('显示成员详情:', member)
}

const handleApplicationSubmit = (application) => {
  emit('apply', application)
  applicationDialogVisible.value = false
}

const handleApproveApplication = (application) => {
  emit('approve-application', application)
}

const handleRejectApplication = (application) => {
  emit('reject-application', application)
}

const removeMember = async (member) => {
  try {
    await ElMessageBox.confirm(
      `确定要从项目中移除 ${member.name} 吗？`,
      '确认移除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    // 执行移除操作
    ElMessage.success('成员已移除')
  } catch {
    // 用户取消
  }
}

// 工具方法
const getStatusType = (status) => {
  const typeMap = {
    planning: 'info',
    recruiting: 'warning',
    active: 'success',
    completed: ''
  }
  return typeMap[status] || ''
}

const getStatusLabel = (status) => {
  const labelMap = {
    planning: '规划中',
    recruiting: '招募团队',
    active: '进行中',
    completed: '已完成'
  }
  return labelMap[status] || status
}

const getPriorityType = (priority) => {
  const typeMap = {
    low: 'info',
    medium: '',
    high: 'warning',
    critical: 'danger'
  }
  return typeMap[priority] || ''
}

const getPriorityLabel = (priority) => {
  const labelMap = {
    low: '低',
    medium: '中',
    high: '高',
    critical: '紧急'
  }
  return labelMap[priority] || priority
}

const getActivityType = (type) => {
  const typeMap = {
    created: 'primary',
    application: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return typeMap[type] || 'primary'
}

const getTeamRoleCount = () => {
  const roles = new Set()
  teamMembers.value?.forEach(member => {
    if (member.role) roles.add(member.role)
  })
  return roles.size
}

const formatCurrency = (amount) => {
  if (!amount) return '未设置'
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0
  }).format(amount)
}

const formatDate = (date) => {
  if (!date) return '未设置'
  return new Date(date).toLocaleDateString('zh-CN')
}

const formatDateTime = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}
</script>

<style scoped>
.enhanced-project-dialog {
  --el-dialog-border-radius: 12px;
}

.project-detail-content {
  padding: 0;
}

.info-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h4 {
  margin: 0;
  color: #303133;
}

.description-section,
.work-content-section {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #f0f2f5;
}

.description-section h5,
.work-content-section h5 {
  margin: 0 0 10px 0;
  color: #606266;
  font-size: 14px;
}

.description-text,
.work-content-text {
  line-height: 1.6;
  color: #606266;
  margin: 0;
}

.skills-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.skill-tag {
  margin: 0;
  border-radius: 4px;
}

.team-card {
  height: fit-content;
}

.team-stats {
  display: flex;
  justify-content: space-around;
  text-align: center;
  padding: 15px 0;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  margin-bottom: 20px;
}

.team-stat-item .stat-number {
  font-size: 20px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 4px;
}

.team-stat-item .stat-label {
  font-size: 12px;
  color: #909399;
}

.member-list {
  max-height: 300px;
  overflow-y: auto;
}

.member-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f0f2f5;
}

.member-item:last-child {
  border-bottom: none;
}

.member-info {
  flex: 1;
  margin-left: 10px;
}

.member-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.member-role {
  font-size: 12px;
  color: #909399;
}

.member-actions {
  margin-left: auto;
}

.empty-team {
  text-align: center;
  padding: 20px;
}

.timeline-card {
  margin-top: 20px;
}

.activity-content {
  padding-left: 10px;
}

.activity-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.activity-description {
  color: #606266;
  font-size: 13px;
  margin-bottom: 2px;
}

.activity-user {
  color: #909399;
  font-size: 12px;
}

.dialog-footer {
  text-align: right;
}

.team-management {
  max-height: 400px;
  overflow-y: auto;
}
</style>