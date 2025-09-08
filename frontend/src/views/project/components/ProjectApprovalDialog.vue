<template>
  <el-dialog
    v-model="visible"
    :title="`项目审批 - ${application?.project?.name || ''}`"
    width="800px"
    :before-close="handleClose"
    class="project-approval-dialog"
  >
    <div class="approval-content" v-if="application">
      <!-- 申请信息卡片 -->
      <el-card class="application-info-card">
        <template #header>
          <div class="card-header">
            <h4>申请信息</h4>
            <el-tag 
              :type="getApplicationStatusType(application.status)"
              size="large"
            >
              {{ getApplicationStatusLabel(application.status) }}
            </el-tag>
          </div>
        </template>

        <el-row :gutter="20">
          <!-- 申请人信息 -->
          <el-col :span="12">
            <div class="applicant-section">
              <h5>申请人信息</h5>
              <div class="applicant-info">
                <el-avatar :size="50" :src="application.applicantAvatar">
                  {{ application.applicantName?.charAt(0) }}
                </el-avatar>
                <div class="applicant-details">
                  <div class="applicant-name">{{ application.applicantName }}</div>
                  <div class="applicant-role">{{ application.applicantRole }}</div>
                  <div class="applicant-department">{{ application.applicantDepartment }}</div>
                </div>
              </div>
            </div>
          </el-col>

          <!-- 申请时间和状态 -->
          <el-col :span="12">
            <div class="application-meta">
              <h5>申请详情</h5>
              <el-descriptions :column="1" size="small">
                <el-descriptions-item label="申请时间">
                  {{ formatDateTime(application.createdAt) }}
                </el-descriptions-item>
                <el-descriptions-item label="申请ID">
                  {{ application.id }}
                </el-descriptions-item>
                <el-descriptions-item label="预估成本">
                  {{ formatCurrency(application.estimatedCost) }}
                </el-descriptions-item>
                <el-descriptions-item label="团队规模" v-if="application.teamSize">
                  {{ application.teamSize }} 人
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </el-col>
        </el-row>

        <!-- 团队信息 -->
        <div class="team-section" v-if="application.teamName">
          <h5>团队信息</h5>
          <div class="team-info">
            <div class="team-name">
              <strong>团队名称：</strong>{{ application.teamName }}
            </div>
            <div class="team-description" v-if="application.teamDescription">
              <strong>团队描述：</strong>
              <p>{{ application.teamDescription }}</p>
            </div>
          </div>
        </div>

        <!-- 申请理由 -->
        <div class="reason-section">
          <h5>申请理由</h5>
          <div class="application-reason">
            {{ application.applicationReason || application.reason }}
          </div>
        </div>

        <!-- 团队成员列表 -->
        <div class="team-members-section" v-if="application.teamMembers?.length">
          <h5>拟定团队成员 ({{ application.teamMembers.length }} 人)</h5>
          <div class="members-grid">
            <div 
              class="member-card"
              v-for="member in application.teamMembers"
              :key="member.id"
            >
              <el-avatar :size="40" :src="member.avatar">
                {{ member.name?.charAt(0) }}
              </el-avatar>
              <div class="member-info">
                <div class="member-name">{{ member.name }}</div>
                <div class="member-position">{{ member.position }}</div>
                <div class="member-skills" v-if="member.skills?.length">
                  <el-tag 
                    v-for="skill in member.skills.slice(0, 2)" 
                    :key="skill"
                    size="small"
                    type="info"
                  >
                    {{ skill }}
                  </el-tag>
                  <span v-if="member.skills.length > 2" class="more-skills">
                    +{{ member.skills.length - 2 }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 项目信息卡片 -->
      <el-card class="project-info-card">
        <template #header>
          <h4>项目信息</h4>
        </template>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="项目名称">
            {{ application.project?.name }}
          </el-descriptions-item>
          <el-descriptions-item label="项目代码">
            {{ application.project?.code }}
          </el-descriptions-item>
          <el-descriptions-item label="项目预算">
            {{ formatCurrency(application.project?.budget) }}
          </el-descriptions-item>
          <el-descriptions-item label="奖金规模">
            {{ formatCurrency(application.project?.bonusScale) }}
          </el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag :type="getPriorityType(application.project?.priority)">
              {{ getPriorityLabel(application.project?.priority) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="计划工期">
            {{ getProjectDuration(application.project) }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="project-description" v-if="application.project?.workContent">
          <h5>工作内容</h5>
          <p class="work-content">{{ application.project.workContent }}</p>
        </div>

        <!-- 技能匹配度分析 -->
        <div class="skill-match-section" v-if="showSkillAnalysis">
          <h5>技能匹配度分析</h5>
          <div class="skill-match-grid">
            <div 
              class="skill-match-item"
              v-for="skill in application.project?.skillRequirements || []"
              :key="skill"
            >
              <div class="skill-name">{{ skill }}</div>
              <div class="match-progress">
                <el-progress 
                  :percentage="getSkillMatchPercentage(skill)"
                  :color="getSkillMatchColor(skill)"
                  :stroke-width="8"
                />
              </div>
              <div class="match-members">
                {{ getSkillMatchMembers(skill) }}
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 审批操作卡片 -->
      <el-card class="approval-action-card" v-if="application.status === 'pending'">
        <template #header>
          <h4>审批操作</h4>
        </template>

        <el-form :model="approvalForm" :rules="approvalRules" ref="approvalFormRef">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="审批结果" prop="decision">
                <el-radio-group v-model="approvalForm.decision">
                  <el-radio label="approve" size="large">
                    <el-icon color="#67C23A"><CircleCheck /></el-icon>
                    批准申请
                  </el-radio>
                  <el-radio label="reject" size="large">
                    <el-icon color="#F56C6C"><CircleClose /></el-icon>
                    拒绝申请
                  </el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="优先级调整" v-if="approvalForm.decision === 'approve'">
                <el-select v-model="approvalForm.priority" placeholder="保持原优先级">
                  <el-option label="低" value="low" />
                  <el-option label="中" value="medium" />
                  <el-option label="高" value="high" />
                  <el-option label="紧急" value="critical" />
                </el-select>
              </el-form-item>

              <el-form-item label="预算调整" v-if="approvalForm.decision === 'approve'">
                <el-input-number
                  v-model="approvalForm.budgetAdjustment"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                  placeholder="预算调整金额"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="审批意见" prop="comments">
            <el-input
              v-model="approvalForm.comments"
              type="textarea"
              :rows="4"
              :placeholder="approvalForm.decision === 'approve' ? '请输入批准意见和具体要求...' : '请说明拒绝理由...'"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>

          <!-- 批准时的额外设置 -->
          <div class="approval-settings" v-if="approvalForm.decision === 'approve'">
            <el-divider content-position="left">项目启动设置</el-divider>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="项目开始日期">
                  <el-date-picker
                    v-model="approvalForm.startDate"
                    type="date"
                    placeholder="选择开始日期"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="项目截止日期">
                  <el-date-picker
                    v-model="approvalForm.endDate"
                    type="date"
                    placeholder="选择截止日期"
                    style="width: 100%"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="自动通知">
              <el-checkbox-group v-model="approvalForm.notifications">
                <el-checkbox label="notifyApplicant">通知申请人</el-checkbox>
                <el-checkbox label="notifyTeamMembers">通知团队成员</el-checkbox>
                <el-checkbox label="notifyManagement">通知管理层</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </div>
        </el-form>
      </el-card>

      <!-- 历史审批记录 -->
      <el-card class="history-card" v-if="application.approvalHistory?.length">
        <template #header>
          <h4>审批历史</h4>
        </template>

        <el-timeline>
          <el-timeline-item
            v-for="record in application.approvalHistory"
            :key="record.id"
            :timestamp="formatDateTime(record.createdAt)"
            :type="getApprovalHistoryType(record.action)"
          >
            <div class="history-content">
              <div class="history-title">
                {{ getApprovalHistoryTitle(record.action) }}
              </div>
              <div class="history-approver">
                审批人：{{ record.approverName }}
              </div>
              <div class="history-comments" v-if="record.comments">
                意见：{{ record.comments }}
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
          v-if="application?.status === 'pending'" 
          type="danger"
          @click="handleQuickReject"
        >
          快速拒绝
        </el-button>
        <el-button 
          v-if="application?.status === 'pending'" 
          type="success"
          @click="handleQuickApprove"
        >
          快速批准
        </el-button>
        <el-button 
          v-if="application?.status === 'pending'" 
          type="primary"
          @click="handleSubmitApproval"
          :loading="submitting"
        >
          提交审批
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  application: {
    type: Object,
    default: () => null
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'approve', 'reject'])

// 响应式数据
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const submitting = ref(false)
const approvalFormRef = ref()
const showSkillAnalysis = ref(true)

// 审批表单
const approvalForm = ref({
  decision: '',
  comments: '',
  priority: '',
  budgetAdjustment: null,
  startDate: '',
  endDate: '',
  notifications: ['notifyApplicant']
})

// 表单验证规则
const approvalRules = {
  decision: [
    { required: true, message: '请选择审批结果', trigger: 'change' }
  ],
  comments: [
    { required: true, message: '请填写审批意见', trigger: 'blur' },
    { min: 10, message: '审批意见不少于10个字符', trigger: 'blur' }
  ]
}

// 监听申请数据变化，重置表单
watch(() => props.application, (newApp) => {
  if (newApp) {
    resetApprovalForm()
  }
}, { immediate: true })

// 方法
const handleClose = () => {
  visible.value = false
}

const resetApprovalForm = () => {
  approvalForm.value = {
    decision: '',
    comments: '',
    priority: '',
    budgetAdjustment: null,
    startDate: '',
    endDate: '',
    notifications: ['notifyApplicant']
  }
}

const handleQuickApprove = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要快速批准这个申请吗？',
      '快速批准',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'success'
      }
    )
    
    const approvalData = {
      decision: 'approve',
      comments: '快速批准',
      notifications: ['notifyApplicant', 'notifyTeamMembers']
    }
    
    emit('approve', { application: props.application, approval: approvalData })
    ElMessage.success('申请已批准')
    
  } catch {
    // 用户取消
  }
}

const handleQuickReject = async () => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      '请输入拒绝理由：',
      '快速拒绝',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputValidator: (value) => {
          if (!value || value.length < 10) {
            return '拒绝理由不能少于10个字符'
          }
          return true
        }
      }
    )
    
    const approvalData = {
      decision: 'reject',
      comments: reason,
      notifications: ['notifyApplicant']
    }
    
    emit('reject', { application: props.application, approval: approvalData })
    ElMessage.success('申请已拒绝')
    
  } catch {
    // 用户取消
  }
}

const handleSubmitApproval = async () => {
  try {
    await approvalFormRef.value.validate()
    
    submitting.value = true
    
    const approvalData = {
      ...approvalForm.value,
      applicationId: props.application.id,
      approverName: '当前用户', // 实际应该从用户store获取
      timestamp: new Date().toISOString()
    }
    
    if (approvalForm.value.decision === 'approve') {
      emit('approve', { application: props.application, approval: approvalData })
      ElMessage.success('申请已批准')
    } else {
      emit('reject', { application: props.application, approval: approvalData })
      ElMessage.success('申请已拒绝')
    }
    
  } catch (error) {
    console.error('审批提交失败:', error)
  } finally {
    submitting.value = false
  }
}

// 工具方法
const getApplicationStatusType = (status) => {
  const typeMap = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return typeMap[status] || ''
}

const getApplicationStatusLabel = (status) => {
  const labelMap = {
    pending: '待审批',
    approved: '已批准',
    rejected: '已拒绝'
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

const getApprovalHistoryType = (action) => {
  const typeMap = {
    approve: 'success',
    reject: 'danger',
    modify: 'primary'
  }
  return typeMap[action] || 'primary'
}

const getApprovalHistoryTitle = (action) => {
  const titleMap = {
    approve: '申请已批准',
    reject: '申请已拒绝',
    modify: '申请已修改'
  }
  return titleMap[action] || action
}

const getProjectDuration = (project) => {
  if (!project?.startDate || !project?.endDate) return '未设置'
  const start = new Date(project.startDate)
  const end = new Date(project.endDate)
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
  return `${days} 天`
}

const getSkillMatchPercentage = (skill) => {
  // 模拟技能匹配度计算
  const teamMembers = props.application?.teamMembers || []
  const matchingMembers = teamMembers.filter(member => 
    member.skills?.includes(skill)
  ).length
  
  return teamMembers.length > 0 ? (matchingMembers / teamMembers.length) * 100 : 0
}

const getSkillMatchColor = (skill) => {
  const percentage = getSkillMatchPercentage(skill)
  if (percentage >= 80) return '#67C23A'
  if (percentage >= 50) return '#E6A23C'
  return '#F56C6C'
}

const getSkillMatchMembers = (skill) => {
  const teamMembers = props.application?.teamMembers || []
  const matchingMembers = teamMembers.filter(member => 
    member.skills?.includes(skill)
  )
  
  return `${matchingMembers.length}/${teamMembers.length} 人具备`
}

const formatCurrency = (amount) => {
  if (!amount) return '未设置'
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0
  }).format(amount)
}

const formatDateTime = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}
</script>

<style scoped>
.project-approval-dialog {
  --el-dialog-border-radius: 12px;
}

.approval-content {
  max-height: 70vh;
  overflow-y: auto;
}

.application-info-card,
.project-info-card,
.approval-action-card,
.history-card {
  margin-bottom: 20px;
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

.applicant-section h5,
.application-meta h5,
.team-section h5,
.reason-section h5,
.team-members-section h5 {
  margin: 0 0 15px 0;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
}

.applicant-info {
  display: flex;
  align-items: center;
}

.applicant-details {
  margin-left: 15px;
}

.applicant-name {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.applicant-role,
.applicant-department {
  font-size: 14px;
  color: #909399;
  margin-bottom: 2px;
}

.team-info {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
}

.team-name {
  font-size: 14px;
  margin-bottom: 10px;
}

.team-description p {
  margin: 0;
  line-height: 1.6;
  color: #606266;
}

.application-reason {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  line-height: 1.6;
  color: #606266;
  border-left: 4px solid #409EFF;
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.member-card {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.member-info {
  margin-left: 10px;
  flex: 1;
}

.member-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.member-position {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.member-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.more-skills {
  font-size: 11px;
  color: #909399;
}

.project-description {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #f0f2f5;
}

.project-description h5 {
  margin: 0 0 10px 0;
  color: #606266;
  font-size: 14px;
}

.work-content {
  line-height: 1.6;
  color: #606266;
  margin: 0;
}

.skill-match-section {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #f0f2f5;
}

.skill-match-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
}

.skill-match-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.skill-name {
  font-weight: 500;
  margin-bottom: 8px;
}

.match-progress {
  margin-bottom: 6px;
}

.match-members {
  font-size: 12px;
  color: #909399;
}

.approval-settings {
  margin-top: 20px;
}

.history-content {
  padding-left: 10px;
}

.history-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.history-approver {
  font-size: 13px;
  color: #606266;
  margin-bottom: 2px;
}

.history-comments {
  font-size: 13px;
  color: #909399;
}

.dialog-footer {
  text-align: right;
}

:deep(.el-radio) {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

:deep(.el-radio__label) {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>