<template>
  <div class="notification-management">
    <el-card class="management-card">
      <template #header>
        <div class="card-header">
          <span class="title">通知管理</span>
          <div class="header-actions">
            <el-button type="primary" @click="showCreateDialog">
              <el-icon><Plus /></el-icon>
              发送通知
            </el-button>
            <el-button @click="refreshData">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 统计信息 -->
      <div class="stats-section">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-statistic title="总通知数" :value="stats.total" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="未读通知" :value="stats.unread" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="已读通知" :value="stats.read" />
          </el-col>
          <el-col :span="6">
            <el-statistic title="今日通知" :value="stats.byDate[today] || 0" />
          </el-col>
        </el-row>
      </div>

      <!-- 筛选条件 -->
      <div class="filter-section">
        <el-form :model="filterForm" inline>
          <el-form-item label="通知类型">
            <el-select v-model="filterForm.notificationType" placeholder="选择类型" clearable>
              <el-option
                v-for="type in notificationTypes"
                :key="type.value"
                :label="type.label"
                :value="type.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filterForm.status" placeholder="选择状态" clearable>
              <el-option label="未读" value="unread" />
              <el-option label="已读" value="read" />
            </el-select>
          </el-form-item>
          <el-form-item label="日期范围">
            <el-date-picker
              v-model="filterForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="applyFilter">筛选</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 通知列表 -->
      <div class="notification-list">
        <el-table
          v-loading="loading"
          :data="notifications"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="notificationType" label="类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getNotificationTypeTag(row.notificationType)">
                {{ getNotificationTypeLabel(row.notificationType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="标题" min-width="200" />
          <el-table-column prop="content" label="内容" min-width="300" show-overflow-tooltip />
          <el-table-column prop="userId" label="接收用户" width="120" />
          <el-table-column prop="isRead" label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.isRead ? 'success' : 'warning'">
                {{ row.isRead ? '已读' : '未读' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="viewNotification(row)">查看</el-button>
              <el-button
                size="small"
                type="danger"
                @click="deleteNotification(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>

      <!-- 批量操作 -->
      <div class="batch-actions" v-if="selectedNotifications.length > 0">
        <el-button @click="batchMarkRead">批量标记已读</el-button>
        <el-button @click="batchMarkUnread">批量标记未读</el-button>
        <el-button type="danger" @click="batchDelete">批量删除</el-button>
      </div>
    </el-card>

    <!-- 发送通知对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="发送通知"
      width="600px"
      :before-close="handleCloseCreateDialog"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createFormRules"
        label-width="100px"
      >
        <el-form-item label="通知类型" prop="notificationType">
          <el-select v-model="createForm.notificationType" placeholder="选择通知类型">
            <el-option
              v-for="type in notificationTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="createForm.title" placeholder="输入通知标题" />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="createForm.content"
            type="textarea"
            :rows="4"
            placeholder="输入通知内容"
          />
        </el-form-item>
        <el-form-item label="接收用户" prop="userIds">
          <el-select
            v-model="createForm.userIds"
            multiple
            filterable
            placeholder="选择接收用户"
          >
            <el-option
              v-for="user in users"
              :key="user.id"
              :label="user.username"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="createForm.priority" placeholder="选择优先级">
            <el-option label="低" value="low" />
            <el-option label="普通" value="normal" />
            <el-option label="高" value="high" />
            <el-option label="紧急" value="urgent" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="sendNotification" :loading="sending">
            发送
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 通知详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="通知详情"
      width="500px"
    >
      <div v-if="selectedNotification" class="notification-detail">
        <div class="detail-item">
          <label>类型：</label>
          <el-tag :type="getNotificationTypeTag(selectedNotification.notificationType)">
            {{ getNotificationTypeLabel(selectedNotification.notificationType) }}
          </el-tag>
        </div>
        <div class="detail-item">
          <label>标题：</label>
          <span>{{ selectedNotification.title }}</span>
        </div>
        <div class="detail-item">
          <label>内容：</label>
          <p>{{ selectedNotification.content }}</p>
        </div>
        <div class="detail-item">
          <label>接收用户：</label>
          <span>{{ selectedNotification.userId }}</span>
        </div>
        <div class="detail-item">
          <label>状态：</label>
          <el-tag :type="selectedNotification.isRead ? 'success' : 'warning'">
            {{ selectedNotification.isRead ? '已读' : '未读' }}
          </el-tag>
        </div>
        <div class="detail-item">
          <label>创建时间：</label>
          <span>{{ formatDateTime(selectedNotification.createdAt) }}</span>
        </div>
        <div v-if="selectedNotification.readAt" class="detail-item">
          <label>阅读时间：</label>
          <span>{{ formatDateTime(selectedNotification.readAt) }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { NotificationType, type Notification, type NotificationQueryParams } from '@/types/notification'

// 响应式数据
const loading = ref(false)
const sending = ref(false)
const createDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const selectedNotifications = ref<Notification[]>([])
const selectedNotification = ref<Notification | null>(null)

// 通知类型选项
const notificationTypes = [
  { label: '项目发布', value: NotificationType.PROJECT_PUBLISHED },
  { label: '团队申请', value: NotificationType.TEAM_APPLIED },
  { label: '需要审批', value: NotificationType.APPROVAL_NEEDED },
  { label: '已批准', value: NotificationType.APPROVED },
  { label: '已拒绝', value: NotificationType.REJECTED },
  { label: '需要修改', value: NotificationType.MODIFICATION_REQUIRED },
  { label: '系统公告', value: NotificationType.SYSTEM_ANNOUNCEMENT },
  { label: '项目更新', value: NotificationType.PROJECT_UPDATE },
  { label: '团队变更', value: NotificationType.TEAM_CHANGE },
  { label: '截止提醒', value: NotificationType.DEADLINE_REMINDER }
]

// 筛选表单
const filterForm = reactive<NotificationQueryParams>({
  page: 1,
  pageSize: 20,
  notificationType: undefined,
  status: undefined,
  dateRange: undefined
})

// 创建表单
const createForm = reactive({
  notificationType: '',
  title: '',
  content: '',
  userIds: [] as string[],
  priority: 'normal'
})

// 表单验证规则
const createFormRules: FormRules = {
  notificationType: [
    { required: true, message: '请选择通知类型', trigger: 'change' }
  ],
  title: [
    { required: true, message: '请输入通知标题', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入通知内容', trigger: 'blur' }
  ],
  userIds: [
    { required: true, message: '请选择接收用户', trigger: 'change' }
  ]
}

// 数据
const notifications = ref<Notification[]>([])
const users = ref<any[]>([])
const stats = reactive({
  total: 0,
  unread: 0,
  read: 0,
  byDate: {} as Record<string, number>
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0
})

// 计算属性
const today = computed(() => {
  return new Date().toISOString().split('T')[0]
})

// 表单引用
const createFormRef = ref<FormInstance>()

// 方法
const refreshData = async () => {
  loading.value = true
  try {
    // 这里应该调用实际的API
    // const response = await notificationApi.getNotifications(filterForm)
    // notifications.value = response.data.notifications
    // Object.assign(pagination, response.data.pagination)
    
    // 模拟数据
    await new Promise(resolve => setTimeout(resolve, 1000))
    notifications.value = []
    pagination.total = 0
    pagination.totalPages = 0
    
    ElMessage.success('数据刷新成功')
  } catch (error) {
    ElMessage.error('数据刷新失败')
  } finally {
    loading.value = false
  }
}

const applyFilter = () => {
  filterForm.page = 1
  refreshData()
}

const resetFilter = () => {
  Object.assign(filterForm, {
    page: 1,
    pageSize: 20,
    notificationType: undefined,
    status: undefined,
    dateRange: undefined
  })
  refreshData()
}

const handleSelectionChange = (selection: Notification[]) => {
  selectedNotifications.value = selection
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  refreshData()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  refreshData()
}

const showCreateDialog = () => {
  createDialogVisible.value = true
  // 重置表单
  Object.assign(createForm, {
    notificationType: '',
    title: '',
    content: '',
    userIds: [],
    priority: 'normal'
  })
}

const handleCloseCreateDialog = () => {
  createFormRef.value?.resetFields()
  createDialogVisible.value = false
}

const sendNotification = async () => {
  if (!createFormRef.value) return
  
  try {
    await createFormRef.value.validate()
    sending.value = true
    
    // 这里应该调用实际的API
    // await notificationApi.createNotification(createForm)
    
    // 模拟发送
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('通知发送成功')
    createDialogVisible.value = false
    refreshData()
  } catch (error) {
    ElMessage.error('通知发送失败')
  } finally {
    sending.value = false
  }
}

const viewNotification = (notification: Notification) => {
  selectedNotification.value = notification
  detailDialogVisible.value = true
}

const deleteNotification = async (notification: Notification) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条通知吗？',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 这里应该调用实际的API
    // await notificationApi.deleteNotification(notification.id)
    
    ElMessage.success('删除成功')
    refreshData()
  } catch (error) {
    // 用户取消删除
  }
}

const batchMarkRead = async () => {
  try {
    // 这里应该调用实际的API
    // await notificationApi.batchMarkRead(selectedNotifications.value.map(n => n.id))
    
    ElMessage.success('批量标记已读成功')
    refreshData()
  } catch (error) {
    ElMessage.error('批量操作失败')
  }
}

const batchMarkUnread = async () => {
  try {
    // 这里应该调用实际的API
    // await notificationApi.batchMarkUnread(selectedNotifications.value.map(n => n.id))
    
    ElMessage.success('批量标记未读成功')
    refreshData()
  } catch (error) {
    ElMessage.error('批量操作失败')
  }
}

const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedNotifications.value.length} 条通知吗？`,
      '确认批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 这里应该调用实际的API
    // await notificationApi.batchDelete(selectedNotifications.value.map(n => n.id))
    
    ElMessage.success('批量删除成功')
    refreshData()
  } catch (error) {
    // 用户取消删除
  }
}

const getNotificationTypeTag = (type: string) => {
  const tagMap: Record<string, string> = {
    [NotificationType.PROJECT_PUBLISHED]: 'success',
    [NotificationType.TEAM_APPLIED]: 'warning',
    [NotificationType.APPROVAL_NEEDED]: 'danger',
    [NotificationType.APPROVED]: 'success',
    [NotificationType.REJECTED]: 'danger',
    [NotificationType.MODIFICATION_REQUIRED]: 'warning',
    [NotificationType.SYSTEM_ANNOUNCEMENT]: 'info',
    [NotificationType.PROJECT_UPDATE]: 'primary',
    [NotificationType.TEAM_CHANGE]: 'warning',
    [NotificationType.DEADLINE_REMINDER]: 'danger'
  }
  return tagMap[type] || 'info'
}

const getNotificationTypeLabel = (type: string) => {
  const typeOption = notificationTypes.find(t => t.value === type)
  return typeOption ? typeOption.label : type
}

const formatDateTime = (date: Date | string) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.notification-management {
  padding: 20px;
}

.management-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.stats-section {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.filter-section {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.notification-list {
  margin-bottom: 20px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.batch-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.notification-detail {
  padding: 20px;
}

.detail-item {
  margin-bottom: 15px;
  display: flex;
  align-items: flex-start;
}

.detail-item label {
  font-weight: bold;
  min-width: 100px;
  margin-right: 10px;
}

.detail-item p {
  margin: 0;
  white-space: pre-wrap;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
