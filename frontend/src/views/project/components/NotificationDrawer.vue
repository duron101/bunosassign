<template>
  <el-drawer
    v-model="visible"
    title="项目通知"
    size="400px"
    direction="rtl"
  >
    <template #header>
      <div class="drawer-header">
        <span class="title">项目通知</span>
        <div class="header-actions">
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="badge">
            <el-button size="small" text @click="markAllAsRead" :disabled="unreadCount === 0">
              全部已读
            </el-button>
          </el-badge>
        </div>
      </div>
    </template>

    <!-- 筛选选项 -->
    <div class="filter-section">
      <el-radio-group v-model="filterType" size="small" @change="loadNotifications">
        <el-radio-button label="all">全部</el-radio-button>
        <el-radio-button label="unread">未读</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 通知列表 -->
    <div class="notifications-list" v-loading="loading">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="['notification-item', { 'unread': !notification.isRead }]"
        @click="handleNotificationClick(notification)"
      >
        <div class="notification-header">
          <span class="notification-type">
            <el-icon :class="getNotificationIcon(notification.notificationType)">
              <component :is="getNotificationIcon(notification.notificationType)" />
            </el-icon>
          </span>
          <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
        </div>
        
        <h4 class="notification-title">{{ notification.title }}</h4>
        <p class="notification-content">{{ notification.content }}</p>
        
        <div class="notification-footer" v-if="!notification.isRead">
          <el-button 
            size="small" 
            text 
            type="primary" 
            @click.stop="markAsRead(notification)"
          >
            标记已读
          </el-button>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty 
        v-if="!loading && notifications.length === 0" 
        :description="filterType === 'unread' ? '暂无未读通知' : '暂无通知'"
        :image-size="120"
      />

      <!-- 加载更多 -->
      <div class="load-more" v-if="hasMore">
        <el-button 
          text 
          type="primary" 
          @click="loadMore" 
          :loading="loadingMore"
        >
          加载更多
        </el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Bell, 
  MessageBox, 
  Document, 
  Check, 
  Close, 
  Warning,
  InfoFilled
} from '@element-plus/icons-vue'
import { projectCollaborationApi } from '@/api/projectCollaboration'

// Props
const props = defineProps<{
  modelValue: boolean
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'notification-read': []
}>()

// 响应式数据
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const loading = ref(false)
const loadingMore = ref(false)
const notifications = ref([])
const filterType = ref('all')

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  hasMore: false
})

// 未读数量
const unreadCount = ref(0)

// 是否还有更多数据
const hasMore = computed(() => {
  return notifications.value.length < pagination.total
})

// 获取通知图标
const getNotificationIcon = (type: string) => {
  const icons = {
    project_published: Document,
    team_applied: MessageBox,
    approval_needed: Warning,
    approved: Check,
    rejected: Close,
    modification_required: InfoFilled
  }
  return icons[type] || Bell
}

// 获取通知图标类名
const getNotificationIconClass = (type: string) => {
  const classes = {
    project_published: 'icon-info',
    team_applied: 'icon-warning',
    approval_needed: 'icon-danger',
    approved: 'icon-success',
    rejected: 'icon-danger',
    modification_required: 'icon-warning'
  }
  return classes[type] || 'icon-info'
}

// 加载通知列表
const loadNotifications = async (append = false) => {
  if (!append) {
    loading.value = true
    pagination.page = 1
  } else {
    loadingMore.value = true
  }

  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      unreadOnly: filterType.value === 'unread'
    }

    const response = await projectCollaborationApi.getMyNotifications(params)
    
    if (append) {
      notifications.value.push(...response.data.notifications)
    } else {
      notifications.value = response.data.notifications
    }
    
    Object.assign(pagination, response.data.pagination)
    unreadCount.value = response.data.unreadCount

  } catch (error) {
    ElMessage.error('加载通知失败')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 加载更多
const loadMore = () => {
  if (hasMore.value && !loadingMore.value) {
    pagination.page += 1
    loadNotifications(true)
  }
}

// 标记单个通知为已读
const markAsRead = async (notification: any) => {
  try {
    await projectCollaborationApi.markNotificationRead(notification.id)
    
    // 更新本地状态
    notification.isRead = true
    notification.readAt = new Date()
    unreadCount.value = Math.max(0, unreadCount.value - 1)
    
    emit('notification-read')
    
  } catch (error) {
    ElMessage.error('标记已读失败')
  }
}

// 标记所有通知为已读
const markAllAsRead = async () => {
  try {
    await projectCollaborationApi.markAllNotificationsRead()
    
    // 更新本地状态
    notifications.value.forEach(notification => {
      if (!notification.isRead) {
        notification.isRead = true
        notification.readAt = new Date()
      }
    })
    
    unreadCount.value = 0
    emit('notification-read')
    ElMessage.success('已全部标记为已读')
    
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 处理通知点击
const handleNotificationClick = async (notification: any) => {
  // 如果未读，先标记为已读
  if (!notification.isRead) {
    await markAsRead(notification)
  }
  
  // 根据通知类型跳转到相应页面
  handleNotificationNavigation(notification)
}

// 处理通知导航
const handleNotificationNavigation = (notification: any) => {
  if (!notification.relatedId) return
  
  const { notificationType, relatedId, projectId } = notification
  
  // 这里可以根据通知类型跳转到相应页面
  // 例如：
  switch (notificationType) {
    case 'project_published':
      // 跳转到项目详情页
      break
    case 'team_applied':
    case 'approval_needed':
      // 跳转到审批页面
      break
    case 'approved':
    case 'rejected':
    case 'modification_required':
      // 跳转到我的申请页面
      break
  }
}

// 格式化时间
const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) {
    return '刚刚'
  } else if (minutes < 60) {
    return `${minutes}分钟前`
  } else if (hours < 24) {
    return `${hours}小时前`
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

// 监听显示状态
watch(visible, (newVisible) => {
  if (newVisible) {
    loadNotifications()
  }
})
</script>

<style scoped>
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}

.header-actions .badge {
  margin-left: 10px;
}

.filter-section {
  padding: 0 0 20px 0;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 20px;
}

.notifications-list {
  height: calc(100vh - 160px);
  overflow-y: auto;
}

.notification-item {
  padding: 15px;
  border-bottom: 1px solid #f0f2f5;
  cursor: pointer;
  transition: background-color 0.3s;
  border-radius: 8px;
  margin-bottom: 8px;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item.unread {
  background-color: #f0f9ff;
  border-left: 4px solid #409eff;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.notification-type {
  display: flex;
  align-items: center;
}

.notification-type .el-icon {
  font-size: 16px;
  margin-right: 5px;
}

.icon-info {
  color: #409eff;
}

.icon-success {
  color: #67c23a;
}

.icon-warning {
  color: #e6a23c;
}

.icon-danger {
  color: #f56c6c;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

.notification-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.notification-content {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  margin: 0 0 10px 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.notification-footer {
  text-align: right;
}

.load-more {
  text-align: center;
  padding: 20px;
}

/* 滚动条样式 */
.notifications-list::-webkit-scrollbar {
  width: 6px;
}

.notifications-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.notifications-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.notifications-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>