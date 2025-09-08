<template>
  <el-dialog
    v-model="visible"
    :title="getDialogTitle()"
    width="600px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      @submit.prevent
    >
      <el-form-item label="部门名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入部门名称"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="部门代码" prop="code">
        <el-input
          v-model="form.code"
          placeholder="请输入部门代码"
          maxlength="50"
          :disabled="isEdit"
        />
        <div class="form-tip">部门代码创建后不可修改</div>
      </el-form-item>

      <el-form-item label="父部门" prop="parentId">
        <el-tree-select
          v-model="form.parentId"
          :data="departmentTreeOptions"
          :render-after-expand="false"
          placeholder="请选择父部门（不选择则为顶级部门）"
          style="width: 100%"
          clearable
          :props="treeSelectProps"
          :disabled-node="disabledNode"
        />
      </el-form-item>

      <el-form-item label="所属业务线" prop="businessLineId">
        <el-select v-model="form.businessLineId" placeholder="请选择业务线" clearable style="width: 100%">
          <el-option
            v-for="line in businessLines"
            :key="line.id"
            :label="line.name"
            :value="line.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="部门负责人" prop="managerId">
        <el-select
          v-model="form.managerId"
          placeholder="请选择部门负责人"
          clearable
          filterable
          style="width: 100%"
        >
          <el-option
            v-for="emp in employees"
            :key="emp.id"
            :label="`${emp.name} (${emp.employeeNo})`"
            :value="emp.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="部门描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="4"
          placeholder="请输入部门描述"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
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
// API导入
import {
  createDepartment,
  updateDepartment,
  getDepartmentTree,
  type Department,
  type DepartmentForm
} from '@/api/department'
import { getBusinessLines } from '@/api/businessLine'
import { getEmployees } from '@/api/employee'

interface Props {
  visible: boolean
  department: Department | null
  parentDepartment: Department | null
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
const businessLines = ref([])
const employees = ref([])
const departmentTreeOptions = ref([])

const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 表单数据
const form = reactive<DepartmentForm>({
  name: '',
  code: '',
  parentId: undefined,
  businessLineId: undefined,
  managerId: undefined,
  description: ''
})

// 表单验证规则
const rules: FormRules = {
  name: [
    { required: true, message: '请输入部门名称', trigger: 'blur' },
    { min: 2, max: 100, message: '部门名称长度为 2 到 100 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入部门代码', trigger: 'blur' },
    { min: 2, max: 50, message: '部门代码长度为 2 到 50 个字符', trigger: 'blur' },
    { pattern: /^[A-Z0-9_-]+$/, message: '部门代码只能包含大写字母、数字、下划线和连字符', trigger: 'blur' }
  ],
  description: [
    { max: 500, message: '部门描述不能超过 500 个字符', trigger: 'blur' }
  ]
}

// 树形选择器配置
const treeSelectProps = {
  children: 'children',
  label: 'name',
  value: 'id'
}

// 获取对话框标题
const getDialogTitle = () => {
  if (props.parentDepartment) {
    return `添加子部门 - ${props.parentDepartment.name}`
  }
  return props.isEdit ? '编辑部门' : '新增部门'
}

// 禁用当前部门及其子部门（编辑时不能将自己设为父部门）
const disabledNode = (data: any) => {
  if (!props.isEdit || !props.department) return false
  return data.id === props.department.id || isChildDepartment(data, props.department.id)
}

// 检查是否为子部门
const isChildDepartment = (node: any, parentId: number): boolean => {
  if (node.parentId === parentId) return true
  if (node.children) {
    return node.children.some((child: any) => isChildDepartment(child, parentId))
  }
  return false
}

// 监听对话框显示状态
watch(() => props.visible, (val) => {
  if (val) {
    resetForm()
    if (props.isEdit && props.department) {
      populateForm()
    } else if (props.parentDepartment) {
      form.parentId = props.parentDepartment.id
    }
  }
})

// 重置表单
const resetForm = () => {
  Object.assign(form, {
    name: '',
    code: '',
    parentId: undefined,
    businessLineId: undefined,
    managerId: undefined,
    description: ''
  })
  
  formRef.value?.clearValidate()
}

// 填充表单数据（编辑时）
const populateForm = () => {
  if (!props.department) return
  
  Object.assign(form, {
    name: props.department.name,
    code: props.department.code,
    parentId: props.department.parentId,
    businessLineId: props.department.businessLineId,
    managerId: props.department.managerId,
    description: props.department.description || ''
  })
}

// 获取业务线列表
const getBusinessLineList = async () => {
  try {
    const { data } = await getBusinessLines({ status: 1 })
    businessLines.value = data.businessLines
  } catch (error) {
    console.error('获取业务线列表失败:', error)
    ElMessage.error('获取业务线列表失败')
  }
}

// 获取员工列表
const getEmployeeList = async () => {
  try {
    const { data } = await getEmployees({ status: 1, pageSize: 1000 })
    employees.value = data.employees
  } catch (error) {
    console.error('获取员工列表失败:', error)
    ElMessage.error('获取员工列表失败')
  }
}

// 获取部门树形选项
const getDepartmentTreeOptions = async () => {
  try {
    const { data } = await getDepartmentTree()
    departmentTreeOptions.value = data
  } catch (error) {
    console.error('获取部门树形结构失败:', error)
    ElMessage.error('获取部门树形结构失败')
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
    await formRef.value.validate()
    loading.value = true
    
    // 清理表单数据，只包含有值的字段
    const submitData: DepartmentForm = {
      name: form.name,
      code: form.code,
      description: form.description || ''
    }
    
    // 只添加有值的字段，确保类型正确
    if (form.parentId !== undefined && form.parentId !== null) {
      submitData.parentId = form.parentId
    }
    if (form.businessLineId !== undefined && form.businessLineId !== null) {
      submitData.businessLineId = form.businessLineId
    }
    if (form.managerId !== undefined && form.managerId !== null) {
      submitData.managerId = form.managerId
    }
    
    console.log('🔍 部门表单提交数据:', {
      originalForm: form,
      cleanedData: submitData
    })
    
    if (props.isEdit && props.department) {
      await updateDepartment(props.department.id, submitData)
      ElMessage.success('部门更新成功')
    } else {
      await createDepartment(submitData)
      ElMessage.success('部门创建成功')
    }
    
    emit('success')
    handleClose()
  } catch (error) {
    if (error !== false) { // 不是表单验证失败
      ElMessage.error(props.isEdit ? '部门更新失败' : '部门创建失败')
    }
  } finally {
    loading.value = false
  }
}

// 组件挂载时获取基础数据
onMounted(() => {
  getBusinessLineList()
  getEmployeeList()
  getDepartmentTreeOptions()
})
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

:deep(.el-tree-select__popper) {
  max-height: 300px;
}
</style>