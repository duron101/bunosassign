<template>
  <div class="project-status-tracker">
    <!-- 项目状态卡片 -->
    <el-row :gutter="20" class="status-cards">
      <el-col :span="6">
        <el-card class="status-card" :class="{ active: currentStatus === 'planning' }">
          <div class="status-icon">
            <el-icon><EditPen /></el-icon>
          </div>
          <div class="status-content">
            <h4>规划中</h4>
            <p>项目正在规划阶段</p>
            <div class="status-time" v-if="statusTimes.planning">
              {{ formatTime(statusTimes.planning) }}
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="status-card" :class="{ active: currentStatus === 'recruiting' }">
          <div class="status-icon">
            <el-icon><User /></el-icon>
          </div>
          <div class="status-content">
            <h4>招募团队</h4>
            <p>正在招募项目团队成员</p>
            <div class="status-time" v-if="statusTimes.recruiting">
              {{ formatTime(statusTimes.recruiting) }}
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="status-card" :class="{ active: currentStatus === 'active' }">
          <div class="status-icon">
            <el-icon><VideoPlay /></el-icon>
          </div>
          <div class="status-content">
            <h4>进行中</h4>
            <p>项目正在执行中</p>
            <div class="status-time" v-if="statusTimes.active">
              {{ formatTime(statusTimes.active) }}
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="status-card" :class="{ active: currentStatus === 'completed' }">
          <div class="status-icon">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="status-content">
            <h4>已完成</h4>
            <p>项目已完成交付</p>
            <div class="status-time" v-if="statusTimes.completed">
              {{ formatTime(statusTimes.completed) }}
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 申请统计 -->
    <div class="application-stats" v-if="showApplicationStats">
      <el-card>
        <template #header>
          <div class="stats-header">
            <h4>团队申请统计</h4>
            <el-button type="text" @click="showApplicationHistory">
              查看详情
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
        </template>
        
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-number">{{ applicationStats.total }}</div>
              <div class="stat-label">总申请数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item pending">
              <div class="stat-number">{{ applicationStats.pending }}</div>
              <div class="stat-label">待审批</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item approved">
              <div class="stat-number">{{ applicationStats.approved }}</div>
              <div class="stat-label">已批准</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item rejected">
              <div class="stat-number">{{ applicationStats.rejected }}</div>
              <div class="stat-label">已拒绝</div>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 项目进度条 -->
    <div class="progress-section" v-if="showProgress">
      <el-card>
        <template #header>
          <h4>项目进度</h4>
        </template>
        
        <div class="progress-info">
          <div class="progress-header">
            <span>整体进度</span>
            <span>{{ projectProgress }}%</span>
          </div>
          <el-progress 
            :percentage="projectProgress" 
            :color="progressColor"
            :stroke-width="12"
          />
        </div>
        
        <div class="milestone-list" v-if="milestones?.length">
          <h5>项目里程碑</h5>
          <div class="milestone-item" v-for="milestone in milestones" :key="milestone.id">
            <div class="milestone-status">
              <el-icon v-if="milestone.completed" class="completed">
                <CircleCheck />
              </el-icon>
              <el-icon v-else class="pending">
                <Clock />
              </el-icon>
            </div>
            <div class="milestone-content">
              <div class="milestone-title">{{ milestone.name }}</div>
              <div class="milestone-time">{{ milestone.targetDate }}</div>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 申请历史对话框 -->
    <el-dialog
      v-model="applicationHistoryVisible"
      title="团队申请历史"
      width="800px"
      @close="applicationHistoryVisible = false"
    >
      <div class="application-history">
        <div 
          class="application-item" 
          v-for="application in applicationHistory" 
          :key="application.id"
        >
          <div class="application-header">
            <div class="applicant-info">
              <el-avatar :size="40" :src="application.applicantAvatar">
                {{ application.applicantName.charAt(0) }}
              </el-avatar>
              <div class="applicant-details">
                <div class="applicant-name">{{ application.applicantName }}</div>
                <div class="applicant-role">{{ application.applicantRole }}</div>
              </div>
            </div>
            <div class="application-status">
              <el-tag 
                :type="getApplicationStatusType(application.status)"
                size="small"
              >
                {{ getApplicationStatusLabel(application.status) }}
              </el-tag>
              <div class="application-time">
                {{ formatTime(application.createdAt) }}
              </div>
            </div>
          </div>
          
          <div class="application-content">
            <div class="team-info" v-if="application.teamName">
              <strong>团队名称：</strong>{{ application.teamName }}
            </div>
            <div class="application-reason">
              <strong>申请理由：</strong>{{ application.reason }}
            </div>
            <div class="estimated-cost" v-if="application.estimatedCost">
              <strong>预估成本：</strong>{{ formatCurrency(application.estimatedCost) }}
            </div>
          </div>
          
          <div class="application-actions" v-if="application.status === 'pending' && canApproveTeam">
            <el-button size="small" type="success" @click="handleApprove(application)">
              批准
            </el-button>
            <el-button size="small" type="danger" @click="handleReject(application)">
              拒绝
            </el-button>
          </div>
        </div>
        
        <div class="empty-state" v-if="!applicationHistory?.length">
          <el-empty description="暂无申请记录" />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useProjectPermissions } from '@/composables/useProjectPermissions'

// Props
const props = defineProps({
  project: {
    type: Object,
    required: true
  },
  showApplicationStats: {
    type: Boolean,
    default: true
  },
  showProgress: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['approve-application', 'reject-application'])

// 权限控制
const { canApproveTeam } = useProjectPermissions()

// 响应式数据
const currentStatus = computed(() => props.project?.status || 'planning')
const projectProgress = computed(() => props.project?.progress || 0)
const applicationHistoryVisible = ref(false)

// 状态时间映射
const statusTimes = computed(() => {
  return {
    planning: props.project?.createdAt,
    recruiting: props.project?.recruitingStartTime,
    active: props.project?.startTime,
    completed: props.project?.completedTime
  }
})

// 申请统计
const applicationStats = computed(() => {
  const applications = props.project?.applications || []
  return {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    approved: applications.filter(app => app.status === 'approved').length,
    rejected: applications.filter(app => app.status === 'rejected').length
  }
})

// 申请历史
const applicationHistory = computed(() => props.project?.applications || [])

// 项目里程碑
const milestones = computed(() => props.project?.milestones || [])

// 进度条颜色
const progressColor = computed(() => {
  const progress = projectProgress.value
  if (progress < 30) return '#F56C6C'
  if (progress < 70) return '#E6A23C'
  return '#67C23A'
})

// 方法
const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatCurrency = (amount) => {
  if (!amount) return '0'
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0
  }).format(amount)
}

const getApplicationStatusType = (status) => {
  const statusMap = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return statusMap[status] || ''
}

const getApplicationStatusLabel = (status) => {
  const labelMap = {
    pending: '待审批',
    approved: '已批准',
    rejected: '已拒绝'
  }
  return labelMap[status] || status
}

const showApplicationHistory = () => {
  applicationHistoryVisible.value = true
}

const handleApprove = (application) => {
  emit('approve-application', application)
}

const handleReject = (application) => {
  emit('reject-application', application)
}
</script>

<style scoped>
.project-status-tracker {
  margin: 20px 0;
}

.status-cards {
  margin-bottom: 20px;
}

.status-card {
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.status-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.status-card.active {
  border-color: #409EFF;
  background: linear-gradient(135deg, #409EFF 0%, #67C23A 100%);
  color: white;
}

.status-icon {
  font-size: 24px;
  margin-bottom: 8px;
  color: #409EFF;
}

.status-card.active .status-icon {
  color: white;
}

.status-content h4 {
  margin: 0 0 5px 0;
  font-size: 16px;
  font-weight: 500;
}

.status-content p {
  margin: 0;
  font-size: 12px;
  opacity: 0.8;
}

.status-time {
  font-size: 11px;
  margin-top: 5px;
  opacity: 0.7;
}

.application-stats {
  margin-bottom: 20px;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-header h4 {
  margin: 0;
}

.stat-item {
  text-align: center;
  padding: 10px;
  border-radius: 8px;
  background: #f8f9fa;
}

.stat-item.pending {
  background: linear-gradient(135deg, #E6A23C, #F7BA2A);
  color: white;
}

.stat-item.approved {
  background: linear-gradient(135deg, #67C23A, #85CE61);
  color: white;
}

.stat-item.rejected {
  background: linear-gradient(135deg, #F56C6C, #F78989);
  color: white;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
}

.progress-section {
  margin-bottom: 20px;
}

.progress-info {
  margin-bottom: 20px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-weight: 500;
}

.milestone-list h5 {
  margin: 20px 0 10px 0;
  font-size: 14px;
  color: #666;
}

.milestone-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.milestone-item:last-child {
  border-bottom: none;
}

.milestone-status {
  margin-right: 12px;
  font-size: 16px;
}

.milestone-status .completed {
  color: #67C23A;
}

.milestone-status .pending {
  color: #E6A23C;
}

.milestone-content {
  flex: 1;
}

.milestone-title {
  font-weight: 500;
  margin-bottom: 2px;
}

.milestone-time {
  font-size: 12px;
  color: #999;
}

.application-history {
  max-height: 500px;
  overflow-y: auto;
}

.application-item {
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 15px;
  background: #fafafa;
}

.application-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.applicant-info {
  display: flex;
  align-items: center;
}

.applicant-details {
  margin-left: 10px;
}

.applicant-name {
  font-weight: 500;
  font-size: 14px;
}

.applicant-role {
  font-size: 12px;
  color: #999;
}

.application-status {
  text-align: right;
}

.application-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.application-content {
  margin: 10px 0;
  font-size: 14px;
  line-height: 1.5;
}

.application-content > div {
  margin-bottom: 5px;
}

.application-actions {
  margin-top: 10px;
  text-align: right;
}

.empty-state {
  text-align: center;
  padding: 40px;
}
</style>