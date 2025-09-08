<template>
  <el-dialog
    v-model="visible"
    title="员工离职"
    width="600px"
    :before-close="handleClose"
  >
    <div v-if="employee" class="resign-dialog">
      <!-- 员工信息 -->
      <el-card class="employee-info">
        <template #header>
          <span>员工信息</span>
        </template>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="info-item">
              <label>员工：</label>
              <span>{{ employee.name }} ({{ employee.employeeNo }})</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item">
              <label>部门：</label>
              <span>{{ employee.Department?.name || '-' }}</span>
            </div>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="info-item">
              <label>岗位：</label>
              <span>{{ employee.Position?.name || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item">
              <label>入职日期：</label>
              <span>{{ employee.entryDate }}</span>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <div class="info-item">
              <label>工作时长：</label>
              <span>{{ getWorkDuration() }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 离职信息 -->
      <el-card class="resign-form">
        <template #header>
          <span>离职信息</span>
        </template>
        
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="100px"
          @submit.prevent
        >
          <el-form-item label="离职日期" prop="resignDate">
            <el-date-picker
              v-model="form.resignDate"
              type="date"
              placeholder="请选择离职日期"
              style="width: 100%"
              value-format="YYYY-MM-DD"
              :disabled-date="disabledDate"
            />
          </el-form-item>

          <el-form-item label="交接状态" prop="handoverStatus">
            <el-radio-group v-model="form.handoverStatus">
              <el-radio value="pending">待交接</el-radio>
              <el-radio value="in_progress">进行中</el-radio>
              <el-radio value="completed">已完成</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="离职原因" prop="resignReason">
            <el-input
              v-model="form.resignReason"
              type="textarea"
              :rows="5"
              placeholder="请详细说明离职原因，包括个人发展、工作环境、薪资待遇等方面的考虑"
              maxlength="1000"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 注意事项 -->
      <el-card class="notice-card">
        <template #header>
          <span>注意事项</span>
        </template>
        
        <el-alert
          title="离职处理提醒"
          type="warning"
          :closable="false"
          show-icon
        >
          <ul class="notice-list">
            <li>员工离职后状态将变更为"离职"，无法参与奖金计算</li>
            <li>请确保工作交接完成，避免影响业务连续性</li>
            <li>离职信息提交后可在员工详情中查看</li>
            <li>如需撤销离职，请联系系统管理员</li>
          </ul>
        </el-alert>
      </el-card>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="danger" :loading="loading" @click="handleSubmit">
        确认离职
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  resignEmployee,
  type Employee,
  type ResignForm
} from '@/api/employee'

interface Props {
  visible: boolean
  employee: Employee | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const loading = ref(false)

const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 表单数据
const form = reactive<ResignForm>({
  resignDate: '',
  resignReason: '',
  handoverStatus: 'pending'
})

// 表单验证规则
const rules: FormRules = {
  resignDate: [
    { required: true, message: '请选择离职日期', trigger: 'change' }
  ],
  resignReason: [
    { required: true, message: '请输入离职原因', trigger: 'blur' },
    { min: 10, max: 1000, message: '离职原因长度为 10 到 1000 个字符', trigger: 'blur' }
  ],
  handoverStatus: [
    { required: true, message: '请选择交接状态', trigger: 'change' }
  ]
}

// 监听对话框显示状态
watch(() => props.visible, (val) => {
  if (val) {
    resetForm()
  }
})

// 重置表单
const resetForm = () => {
  Object.assign(form, {
    resignDate: new Date().toISOString().split('T')[0], // 默认今天
    resignReason: '',
    handoverStatus: 'pending'
  })
  
  formRef.value?.clearValidate()
}

// 计算工作时长
const getWorkDuration = () => {
  if (!props.employee?.entryDate) return '-'
  
  const entryDate = new Date(props.employee.entryDate)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - entryDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  const years = Math.floor(diffDays / 365)
  const months = Math.floor((diffDays % 365) / 30)
  const days = diffDays % 30
  
  let duration = ''
  if (years > 0) duration += `${years}年`
  if (months > 0) duration += `${months}个月`
  if (days > 0) duration += `${days}天`
  
  return duration || '不足1天'
}

// 禁用日期（不能选择入职日期之前的日期）
const disabledDate = (date: Date) => {
  if (!props.employee?.entryDate) return false
  const entryDate = new Date(props.employee.entryDate)
  return date < entryDate
}

// 关闭对话框
const handleClose = () => {
  visible.value = false
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value || !props.employee) return
  
  try {
    await formRef.value.validate()
    
    // 二次确认
    await ElMessageBox.confirm(
      `确定要为员工 ${props.employee.name} 办理离职手续吗？此操作不可逆转。`,
      '确认离职',
      {
        confirmButtonText: '确定离职',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: false
      }
    )
    
    loading.value = true
    
    await resignEmployee(props.employee.id, form)
    ElMessage.success('员工离职处理成功')
    
    emit('success')
    handleClose()
  } catch (error) {
    if (error !== 'cancel' && error !== false) { // 不是取消或表单验证失败
      ElMessage.error('员工离职处理失败')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.resign-dialog {
  max-height: 600px;
  overflow-y: auto;
}

.employee-info,
.resign-form,
.notice-card {
  margin-bottom: 20px;
}

.employee-info:last-child,
.resign-form:last-child,
.notice-card:last-child {
  margin-bottom: 0;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  line-height: 1.5;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item label {
  flex-shrink: 0;
  width: 80px;
  font-weight: 500;
  color: #606266;
}

.info-item span {
  color: #303133;
}

.notice-list {
  margin: 0;
  padding-left: 20px;
  color: #e6a23c;
}

.notice-list li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.notice-list li:last-child {
  margin-bottom: 0;
}

:deep(.el-card__header) {
  padding: 12px 20px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-alert) {
  margin: 0;
}

:deep(.el-alert__content) {
  padding-right: 0;
}
</style>