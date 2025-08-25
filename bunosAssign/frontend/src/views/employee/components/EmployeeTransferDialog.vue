<template>
  <el-dialog
    v-model="visible"
    title="员工调动"
    width="600px"
    :before-close="handleClose"
  >
    <div v-if="employee" class="transfer-dialog">
      <!-- 当前信息 -->
      <el-card class="current-info">
        <template #header>
          <span>当前信息</span>
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
              <label>当前部门：</label>
              <span>{{ employee.Department?.name || '-' }}</span>
            </div>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="info-item">
              <label>当前岗位：</label>
              <span>{{ employee.Position?.name || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="info-item">
              <label>当前年薪：</label>
              <span>¥{{ employee.annualSalary?.toLocaleString() }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 调动信息 -->
      <el-card class="transfer-form">
        <template #header>
          <span>调动信息</span>
        </template>
        
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="100px"
          @submit.prevent
        >
          <el-form-item label="目标部门" prop="departmentId">
            <el-select
              v-model="form.departmentId"
              placeholder="请选择目标部门（不选择则保持不变）"
              clearable
              style="width: 100%"
            >
              <el-option
                v-for="dept in departments"
                :key="dept.id"
                :label="dept.name"
                :value="dept.id"
                :disabled="dept.id === employee.departmentId"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="目标岗位" prop="positionId">
            <el-select
              v-model="form.positionId"
              placeholder="请选择目标岗位（不选择则保持不变）"
              clearable
              style="width: 100%"
            >
              <el-option
                v-for="pos in positions"
                :key="pos.id"
                :label="`${pos.name} (${pos.level})`"
                :value="pos.id"
                :disabled="pos.id === employee.positionId"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="调整年薪" prop="annualSalary">
            <el-input-number
              v-model="form.annualSalary"
              :min="0"
              :step="1000"
              placeholder="请输入新年薪（不填则保持不变）"
              style="width: 100%"
            />
          </el-form-item>

          <el-form-item label="生效日期" prop="effectiveDate">
            <el-date-picker
              v-model="form.effectiveDate"
              type="date"
              placeholder="请选择生效日期"
              style="width: 100%"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>

          <el-form-item label="调动原因" prop="transferReason">
            <el-input
              v-model="form.transferReason"
              type="textarea"
              :rows="4"
              placeholder="请输入调动原因"
            />
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 变更预览 -->
      <el-card class="change-preview" v-if="hasChanges">
        <template #header>
          <span>变更预览</span>
        </template>
        
        <div class="change-list">
          <div v-if="departmentChange" class="change-item">
            <el-icon><Right /></el-icon>
            <span>部门：{{ employee.Department?.name }} → {{ getTargetDepartmentName() }}</span>
          </div>
          
          <div v-if="positionChange" class="change-item">
            <el-icon><Right /></el-icon>
            <span>岗位：{{ employee.Position?.name }} → {{ getTargetPositionName() }}</span>
          </div>
          
          <div v-if="salaryChange" class="change-item">
            <el-icon><Right /></el-icon>
            <span>年薪：¥{{ employee.annualSalary?.toLocaleString() }} → ¥{{ form.annualSalary?.toLocaleString() }}</span>
          </div>
        </div>
      </el-card>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit" :disabled="!hasChanges">
        确认调动
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Right } from '@element-plus/icons-vue'
import {
  transferEmployee,
  type Employee,
  type TransferForm
} from '@/api/employee'
import { getDepartments } from '@/api/department'
import { getPositions } from '@/api/position'

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
const departments = ref([])
const positions = ref([])

const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 表单数据
const form = reactive<TransferForm>({
  departmentId: undefined,
  positionId: undefined,
  annualSalary: undefined,
  transferReason: '',
  effectiveDate: ''
})

// 表单验证规则
const rules: FormRules = {
  transferReason: [
    { required: true, message: '请输入调动原因', trigger: 'blur' },
    { min: 5, max: 500, message: '调动原因长度为 5 到 500 个字符', trigger: 'blur' }
  ],
  effectiveDate: [
    { required: true, message: '请选择生效日期', trigger: 'change' }
  ],
  annualSalary: [
    { type: 'number', min: 0, message: '年薪必须大于等于0', trigger: 'blur' }
  ]
}

// 计算是否有变更
const hasChanges = computed(() => {
  return departmentChange.value || positionChange.value || salaryChange.value
})

// 部门变更
const departmentChange = computed(() => {
  return form.departmentId && form.departmentId !== props.employee?.departmentId
})

// 岗位变更
const positionChange = computed(() => {
  return form.positionId && form.positionId !== props.employee?.positionId
})

// 薪资变更
const salaryChange = computed(() => {
  return form.annualSalary && form.annualSalary !== props.employee?.annualSalary
})

// 监听对话框显示状态
watch(() => props.visible, (val) => {
  if (val) {
    resetForm()
  }
})

// 重置表单
const resetForm = () => {
  Object.assign(form, {
    departmentId: undefined,
    positionId: undefined,
    annualSalary: undefined,
    transferReason: '',
    effectiveDate: new Date().toISOString().split('T')[0] // 默认今天
  })
  
  formRef.value?.clearValidate()
}

// 获取目标部门名称
const getTargetDepartmentName = () => {
  const dept = departments.value.find((d: any) => d.id === form.departmentId)
  return dept?.name || ''
}

// 获取目标岗位名称
const getTargetPositionName = () => {
  const pos = positions.value.find((p: any) => p.id === form.positionId)
  return pos?.name || ''
}

// 获取部门列表
const getDepartmentList = async () => {
  try {
    const { data } = await getDepartments({ status: 1 })
    departments.value = data.departments
  } catch (error) {
    console.error('获取部门列表失败:', error)
  }
}

// 获取岗位列表
const getPositionList = async () => {
  try {
    const { data } = await getPositions({ status: 1 })
    positions.value = data.positions
  } catch (error) {
    console.error('获取岗位列表失败:', error)
  }
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
    
    if (!hasChanges.value) {
      ElMessage.warning('请至少选择一项需要变更的内容')
      return
    }
    
    loading.value = true
    
    await transferEmployee(props.employee.id, form)
    ElMessage.success('员工调动成功')
    
    emit('success')
    handleClose()
  } catch (error) {
    if (error !== false) { // 不是表单验证失败
      ElMessage.error('员工调动失败')
    }
  } finally {
    loading.value = false
  }
}

// 组件挂载时获取基础数据
onMounted(() => {
  getDepartmentList()
  getPositionList()
})
</script>

<style scoped>
.transfer-dialog {
  max-height: 600px;
  overflow-y: auto;
}

.current-info,
.transfer-form,
.change-preview {
  margin-bottom: 20px;
}

.current-info:last-child,
.transfer-form:last-child,
.change-preview:last-child {
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

.change-list {
  padding: 0;
}

.change-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 12px;
  background-color: #f0f9ff;
  border-left: 3px solid #3b82f6;
  border-radius: 4px;
}

.change-item:last-child {
  margin-bottom: 0;
}

.change-item .el-icon {
  margin-right: 8px;
  color: #3b82f6;
}

.change-item span {
  color: #1f2937;
  font-size: 14px;
}

:deep(.el-card__header) {
  padding: 12px 20px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

:deep(.el-card__body) {
  padding: 20px;
}
</style>