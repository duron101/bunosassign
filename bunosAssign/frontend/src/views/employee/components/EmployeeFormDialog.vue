<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑员工' : '新增员工'"
    width="800px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      @submit.prevent
    >
      <!-- 基本信息 -->
      <el-card class="form-section">
        <template #header>
          <span>基本信息</span>
        </template>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工号" prop="employeeNo" required>
              <el-input
                v-model="form.employeeNo"
                placeholder="请输入工号"
                :disabled="isEdit"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名" prop="name" required>
              <el-input v-model="form.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="部门" prop="departmentId" required>
              <el-select v-model="form.departmentId" placeholder="请选择部门" style="width: 100%">
                <el-option
                  v-for="dept in departments"
                  :key="dept.id"
                  :label="dept.name"
                  :value="dept.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="岗位" prop="positionId" required>
              <el-select v-model="form.positionId" placeholder="请选择岗位" style="width: 100%">
                <el-option
                  v-for="pos in positions"
                  :key="pos.id"
                  :label="`${pos.name} (${pos.level})`"
                  :value="pos.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="年薪" prop="annualSalary" required>
              <el-input-number
                v-model="form.annualSalary"
                :min="0"
                :step="1000"
                placeholder="请输入年薪"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入职日期" prop="entryDate" required>
              <el-date-picker
                v-model="form.entryDate"
                type="date"
                placeholder="请选择入职日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 联系信息 -->
      <el-card class="form-section">
        <template #header>
          <span>联系信息</span>
        </template>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="手机号码" prop="phone">
              <el-input v-model="form.phone" placeholder="请输入手机号码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="身份证号" prop="idCard">
              <el-input v-model="form.idCard" placeholder="请输入身份证号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="紧急联系人" prop="emergencyContact">
              <el-input v-model="form.emergencyContact" placeholder="请输入紧急联系人" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="紧急联系电话" prop="emergencyPhone">
              <el-input v-model="form.emergencyPhone" placeholder="请输入紧急联系电话" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="家庭住址" prop="address">
              <el-input
                v-model="form.address"
                type="textarea"
                :rows="3"
                placeholder="请输入家庭住址"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        {{ isEdit ? '更新' : '创建' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {
  createEmployee,
  updateEmployee,
  type Employee,
  type EmployeeForm
} from '@/api/employee'
import { getDepartments } from '@/api/department'
import { getPositions } from '@/api/position'

interface Props {
  visible: boolean
  employee: Employee | null
  isEdit: boolean
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
const form = reactive<EmployeeForm>({
  employeeNo: '',
  name: '',
  departmentId: null as any,
  positionId: null as any,
  annualSalary: null as any,
  entryDate: '',
  phone: '',
  email: '',
  idCard: '',
  emergencyContact: '',
  emergencyPhone: '',
  address: ''
})

// 表单验证规则
const rules: FormRules = {
  employeeNo: [
    { required: true, message: '请输入工号', trigger: 'blur' },
    { min: 1, max: 50, message: '工号长度为 1 到 50 个字符', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 50, message: '姓名长度为 2 到 50 个字符', trigger: 'blur' }
  ],
  departmentId: [
    { required: true, message: '请选择部门', trigger: 'change' }
  ],
  positionId: [
    { required: true, message: '请选择岗位', trigger: 'change' }
  ],
  annualSalary: [
    { required: true, message: '请输入年薪', trigger: 'blur' },
    { type: 'number', min: 0, message: '年薪必须大于等于0', trigger: 'blur' }
  ],
  entryDate: [
    { required: true, message: '请选择入职日期', trigger: 'change' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  idCard: [
    { pattern: /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/, message: '请输入正确的身份证号', trigger: 'blur' }
  ]
}

// 监听对话框显示状态
watch(() => props.visible, (val) => {
  if (val) {
    resetForm()
    if (props.isEdit && props.employee) {
      populateForm()
    }
  }
})

// 重置表单
const resetForm = () => {
  Object.assign(form, {
    employeeNo: '',
    name: '',
    departmentId: null as any,
    positionId: null as any,
    annualSalary: null as any,
    entryDate: '',
    phone: '',
    email: '',
    idCard: '',
    emergencyContact: '',
    emergencyPhone: '',
    address: ''
  })
  
  formRef.value?.clearValidate()
}

// 填充表单数据（编辑时）
const populateForm = () => {
  if (!props.employee) return
  
  Object.assign(form, {
    employeeNo: props.employee.employeeNo,
    name: props.employee.name,
    departmentId: props.employee.departmentId,
    positionId: props.employee.positionId,
    annualSalary: props.employee.annualSalary,
    entryDate: props.employee.entryDate,
    phone: props.employee.phone || '',
    email: props.employee.email || '',
    idCard: props.employee.idCard || '',
    emergencyContact: props.employee.emergencyContact || '',
    emergencyPhone: props.employee.emergencyPhone || '',
    address: props.employee.address || ''
  })
}

// 获取部门列表
const getDepartmentList = async () => {
  try {
    console.log('🔍 开始获取部门列表...')
    const { data } = await getDepartments({ status: 1 })
    console.log('📊 部门列表响应:', data)
    departments.value = data.departments
    console.log('✅ 部门列表获取成功，共', departments.value.length, '个部门')
  } catch (error) {
    console.error('❌ 获取部门列表失败:', error)
  }
}

// 获取岗位列表
const getPositionList = async () => {
  try {
    console.log('🔍 开始获取岗位列表...')
    const { data } = await getPositions({ status: 1 })
    console.log('📊 岗位列表响应:', data)
    positions.value = data.positions
    console.log('✅ 岗位列表获取成功，共', positions.value.length, '个岗位')
  } catch (error) {
    console.error('❌ 获取岗位列表失败:', error)
  }
}

// 关闭对话框
const handleClose = () => {
  visible.value = false
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    console.log('🔍 开始提交表单...')
    console.log('📝 原始表单数据:', JSON.stringify(form, null, 2))
    
    // 验证表单
    await formRef.value.validate()
    console.log('✅ 表单验证通过')
    
    // 准备提交数据，正确处理不同类型字段
    const submitData = {
      ...form,
      // departmentId 和 positionId 保持字符串格式（MongoDB ObjectId）
      departmentId: form.departmentId || '',
      positionId: form.positionId || '',
      // 只有 annualSalary 需要转换为数字
      annualSalary: form.annualSalary ? Number(form.annualSalary) : 0
    }
    
    console.log('🔍 数据类型转换结果:', {
      original: {
        departmentId: form.departmentId,
        positionId: form.positionId,
        annualSalary: form.annualSalary
      },
      converted: {
        departmentId: submitData.departmentId,
        positionId: submitData.positionId,
        annualSalary: submitData.annualSalary
      }
    })
    
    // 验证必填字段
    if (!submitData.departmentId || !submitData.positionId || submitData.annualSalary === 0) {
      console.error('❌ 必填字段为空或未选择:', {
        departmentId: submitData.departmentId,
        positionId: submitData.positionId,
        annualSalary: submitData.annualSalary
      })
      ElMessage.error('请选择部门和岗位，并填写年薪')
      return
    }
    
    // 验证年薪是否为有效数字
    if (isNaN(submitData.annualSalary)) {
      console.error('❌ 年薪数据类型转换失败:', {
        annualSalary: form.annualSalary
      })
      ElMessage.error('请填写有效的年薪')
      return
    }
    
    // 验证其他必填字段
    if (!submitData.employeeNo || !submitData.name || !submitData.entryDate) {
      console.error('❌ 其他必填字段为空:', {
        employeeNo: submitData.employeeNo,
        name: submitData.name,
        entryDate: submitData.entryDate
      })
      ElMessage.error('请填写工号、姓名和入职日期')
      return
    }
    
    console.log('📤 提交数据:', JSON.stringify(submitData, null, 2))
    
    loading.value = true
    
    if (props.isEdit && props.employee) {
      console.log('🔄 更新员工...')
      await updateEmployee(props.employee.id, submitData)
      ElMessage.success('员工更新成功')
    } else {
      console.log('🆕 创建员工...')
      const result = await createEmployee(submitData)
      console.log('✅ 创建员工成功:', result)
      ElMessage.success('员工创建成功')
    }
    
    emit('success')
    handleClose()
  } catch (error) {
    console.error('❌ 表单提交失败:', error)
    if (error !== false) { // 不是表单验证失败
      ElMessage.error(props.isEdit ? '员工更新失败' : '员工创建失败')
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
.form-section {
  margin-bottom: 20px;
}

.form-section:last-child {
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
</style>