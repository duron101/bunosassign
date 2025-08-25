<template>
  <el-dialog
    v-model="visible"
    title="员工详情"
    width="800px"
    :before-close="handleClose"
  >
    <div v-if="employee" class="employee-detail">
      <!-- 基本信息 -->
      <el-card class="info-card">
        <template #header>
          <span>基本信息</span>
        </template>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>工号：</label>
              <span>{{ employee.employeeNo }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>姓名：</label>
              <span>{{ employee.name }}</span>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>部门：</label>
              <span>{{ employee.Department?.name || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>岗位：</label>
              <span>{{ employee.Position?.name || '-' }}</span>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>职级：</label>
              <span>{{ employee.Position?.level || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>状态：</label>
              <el-tag :type="employee.status === 1 ? 'success' : 'danger'">
                {{ employee.status === 1 ? '在职' : '离职' }}
              </el-tag>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>年薪：</label>
              <span>¥{{ employee.annualSalary?.toLocaleString() }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>入职日期：</label>
              <span>{{ employee.entryDate }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 联系信息 -->
      <el-card class="info-card">
        <template #header>
          <span>联系信息</span>
        </template>

        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>手机号码：</label>
              <span>{{ employee.phone || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>邮箱：</label>
              <span>{{ employee.email || '-' }}</span>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>身份证号：</label>
              <span>{{ formatIdCard(employee.idCard) }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>紧急联系人：</label>
              <span>{{ employee.emergencyContact || '-' }}</span>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>紧急联系电话：</label>
              <span>{{ employee.emergencyPhone || '-' }}</span>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20" v-if="employee.address">
          <el-col :span="24">
            <div class="detail-item">
              <label>家庭住址：</label>
              <span>{{ employee.address }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 离职信息 -->
      <el-card class="info-card" v-if="employee.status === 0">
        <template #header>
          <span>离职信息</span>
        </template>

        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>离职日期：</label>
              <span>{{ employee.resignDate || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>交接状态：</label>
              <el-tag :type="getHandoverStatusType(employee.handoverStatus)">
                {{ getHandoverStatusText(employee.handoverStatus) }}
              </el-tag>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20" v-if="employee.resignReason">
          <el-col :span="24">
            <div class="detail-item">
              <label>离职原因：</label>
              <div class="resign-reason">{{ employee.resignReason }}</div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 系统信息 -->
      <el-card class="info-card">
        <template #header>
          <span>系统信息</span>
        </template>

        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>创建时间：</label>
              <span>{{ formatDateTime(employee.createdAt) }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>更新时间：</label>
              <span>{{ formatDateTime(employee.updatedAt) }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
      <el-button type="primary" @click="handleEdit">编辑</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Employee } from '@/api/employee'

interface Props {
  visible: boolean
  employee: Employee | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'edit', employee: Employee): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 关闭对话框
const handleClose = () => {
  visible.value = false
}

// 编辑员工
const handleEdit = () => {
  if (props.employee) {
    emit('edit', props.employee)
    handleClose()
  }
}

// 格式化身份证号（脱敏处理）
const formatIdCard = (idCard: string | undefined) => {
  if (!idCard) return '-'
  if (idCard.length === 18) {
    return idCard.slice(0, 6) + '****' + idCard.slice(-4)
  }
  return idCard
}

// 格式化日期时间
const formatDateTime = (dateTime: string) => {
  if (!dateTime) return '-'
  const date = new Date(dateTime)
  return date.toLocaleString('zh-CN')
}

// 获取交接状态类型
const getHandoverStatusType = (status: string | undefined) => {
  switch (status) {
    case 'completed': return 'success'
    case 'in_progress': return 'warning'
    case 'pending': return 'info'
    default: return 'info'
  }
}

// 获取交接状态文本
const getHandoverStatusText = (status: string | undefined) => {
  switch (status) {
    case 'completed': return '已完成'
    case 'in_progress': return '进行中'
    case 'pending': return '待交接'
    default: return '未知'
  }
}
</script>

<style scoped>
.employee-detail {
  max-height: 600px;
  overflow-y: auto;
}

.info-card {
  margin-bottom: 20px;
}

.info-card:last-child {
  margin-bottom: 0;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
  line-height: 1.5;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-item label {
  flex-shrink: 0;
  width: 100px;
  font-weight: 500;
  color: #606266;
}

.detail-item span,
.detail-item .el-tag {
  color: #303133;
}

.resign-reason {
  color: #303133;
  white-space: pre-wrap;
  line-height: 1.6;
}
</style>