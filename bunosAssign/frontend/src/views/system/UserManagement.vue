<template>
  <div class="user-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-button type="primary" @click="showCreateDialog">
            <el-icon><Plus /></el-icon>
            新增用户
          </el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-form :model="searchForm" inline>
          <el-form-item label="关键词">
            <el-input
              v-model="searchForm.search"
              placeholder="用户名/姓名/邮箱"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item label="角色">
            <el-select v-model="searchForm.roleId" placeholder="请选择角色" clearable>
              <el-option
                v-for="role in roleOptions"
                :key="role.id"
                :label="role.name"
                :value="role.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="部门">
            <el-select v-model="searchForm.departmentId" placeholder="请选择部门" clearable>
              <el-option
                v-for="dept in departmentOptions"
                :key="dept.id"
                :label="dept.name"
                :value="dept.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
              <el-option label="启用" :value="1" />
              <el-option label="禁用" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 批量操作 -->
      <div class="batch-actions" v-show="selectedUsers.length > 0">
        <el-button type="success" @click="batchEnable">批量启用</el-button>
        <el-button type="warning" @click="batchDisable">批量禁用</el-button>
        <span class="selected-count">已选择 {{ selectedUsers.length }} 项</span>
      </div>

      <!-- 用户表格 -->
      <el-table
        :data="userList"
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="realName" label="姓名" width="100" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column prop="Role.name" label="角色" width="100" />
        <el-table-column prop="Department.name" label="部门" width="120" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastLogin" label="最后登录" width="160">
          <template #default="{ row }">
            {{ row.lastLogin ? formatDate(row.lastLogin) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="showEditDialog(row)">
              编辑
            </el-button>
            <el-button type="warning" size="small" @click="showResetPasswordDialog(row)">
              重置密码
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="fetchUserList"
          @current-change="fetchUserList"
        />
      </div>
    </el-card>

    <!-- 创建/编辑用户对话框 -->
    <el-dialog
      v-model="userDialog.visible"
      :title="userDialog.mode === 'create' ? '新增用户' : '编辑用户'"
      width="600px"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username" v-if="userDialog.mode === 'create'">
          <el-input v-model="userForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="userDialog.mode === 'create'">
          <el-input v-model="userForm.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="选择员工" prop="employeeId" v-if="userDialog.mode === 'create'">
          <div class="employee-selector">
            <el-select
              v-model="userForm.employeeId"
              placeholder="请选择员工"
              filterable
              clearable
              @change="handleEmployeeSelect"
              style="width: 100%"
            >
              <el-option
                v-for="employee in availableEmployees"
                :key="employee.id"
                :label="`${employee.name} (${employee.employeeNo}) - ${employee.department?.name || '未知部门'}`"
                :value="employee.id"
              >
                <div class="employee-option">
                  <span class="employee-name">{{ employee.name }}</span>
                  <span class="employee-info">{{ employee.employeeNo }} - {{ employee.department?.name || '未知部门' }}</span>
                </div>
              </el-option>
            </el-select>
            <div class="employee-search" v-if="!userForm.employeeId">
              <el-input
                v-model="employeeSearchKeyword"
                placeholder="搜索员工姓名或工号"
                @input="searchEmployees"
                clearable
                style="margin-top: 8px"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="姓名" prop="realName">
          <el-input 
            v-model="userForm.realName" 
            placeholder="请输入真实姓名或选择员工后自动填充"
            :readonly="!!userForm.employeeId"
          />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="角色" prop="roleId">
          <el-select v-model="userForm.roleId" placeholder="请选择角色">
            <el-option
              v-for="role in roleOptions"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="部门" prop="departmentId">
          <el-select v-model="userForm.departmentId" placeholder="请选择部门" clearable>
            <el-option
              v-for="dept in departmentOptions"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status" v-if="userDialog.mode === 'edit'">
          <el-radio-group v-model="userForm.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="userDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="handleUserSubmit" :loading="userDialog.loading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog v-model="resetPasswordDialog.visible" title="重置密码" width="400px">
      <el-form
        ref="resetPasswordFormRef"
        :model="resetPasswordForm"
        :rules="resetPasswordRules"
        label-width="100px"
      >
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="resetPasswordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetPasswordDialog.visible = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleResetPassword"
          :loading="resetPasswordDialog.loading"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { getUserList, createUser, updateUser, deleteUser, resetUserPassword, batchOperateUsers } from '@/api/user'
import { getRoleList } from '@/api/role'
import { getDepartmentOptions } from '@/api/department'
import { getAvailableEmployees } from '@/api/employee'

// 搜索表单
const searchForm = reactive({
  search: '',
  roleId: '', // 使用空字符串作为初始值
  departmentId: '', // 使用空字符串作为初始值
  status: 1 // 使用1作为默认状态
})

// 用户列表
interface User {
  id: string // 改为字符串类型，与NeDB的_id字段一致
  username: string
  realName: string
  email?: string
  phone?: string
  roleId: string // 改为字符串类型，与NeDB的_id字段一致
  departmentId?: string
  status: number
  lastLogin?: string
  createdAt: string
  Role?: RoleOption
  Department?: DepartmentOption
}

const userList = ref<User[]>([])
const loading = ref(false)
const selectedUsers = ref<User[]>([])

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 角色和部门选项
interface RoleOption {
  id: string // 改为字符串类型，与NeDB的_id字段一致
  name: string
  description?: string
}

interface DepartmentOption {
  id: string
  name: string
  code: string
  description?: string
}

const roleOptions = ref<RoleOption[]>([])
const departmentOptions = ref<DepartmentOption[]>([])

// 用户对话框
const userDialog = reactive({
  visible: false,
  mode: 'create' as 'create' | 'edit',
  loading: false,
  userId: '' // 改为字符串类型
})

const userForm = reactive({
  username: '',
  password: '',
  realName: '',
  email: '',
  phone: '',
  roleId: '', // 使用空字符串作为初始值，与字符串类型一致
  departmentId: '', // 使用空字符串作为初始值
  status: 1,
  employeeId: '' // 新增：用于存储选择的员工ID
})

const userFormRef = ref<FormInstance>()

// 重置密码对话框
const resetPasswordDialog = reactive({
  visible: false,
  loading: false,
  userId: '' // 改为字符串类型
})

const resetPasswordForm = reactive({
  newPassword: ''
})

const resetPasswordFormRef = ref<FormInstance>()

// 表单验证规则
const userRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 30, message: '用户名长度在 3 到 30 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '密码至少8位，需包含字母和数字', trigger: 'blur' },
    { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/, message: '密码至少8位，需包含字母和数字', trigger: 'blur' }
  ],
  realName: [
    { required: true, message: '请输入真实姓名', trigger: 'blur' },
    { min: 2, max: 50, message: '姓名长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  roleId: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

const resetPasswordRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, message: '密码至少8位，需包含字母和数字', trigger: 'blur' },
    { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/, message: '密码至少8位，需包含字母和数字', trigger: 'blur' }
  ]
}

// 获取用户列表
const fetchUserList = async () => {
  loading.value = true
  try {
    // 处理搜索参数，将空字符串转换为undefined
    const cleanSearchForm = {
      search: searchForm.search || undefined,
      roleId: searchForm.roleId || undefined,
      departmentId: searchForm.departmentId || undefined,
      status: searchForm.status || undefined
    }
    
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...cleanSearchForm
    }
    console.log('获取用户列表参数:', params)
    
    const res = await getUserList(params)
    console.log('用户列表API返回数据:', res)
    
    if (res.data && res.data.users) {
      userList.value = res.data.users
      pagination.total = res.data.pagination.total
      console.log('设置用户列表数据:', userList.value)
      console.log('设置分页信息:', pagination)
    } else {
      console.error('用户列表数据格式不正确:', res)
      userList.value = []
      pagination.total = 0
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
    userList.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

// 获取角色选项
const fetchRoleOptions = async () => {
  try {
    const res = await getRoleList({ pageSize: 100 })
    if (res.data && res.data.roles) {
      // 创建新的对象，避免响应式问题
      const processedRoles = res.data.roles.map((role: any) => ({
        id: role.id || '', // 保持字符串类型
        name: role.name || '',
        description: role.description || ''
      }))
      roleOptions.value = processedRoles
    } else {
      roleOptions.value = []
    }
  } catch (error) {
    console.error('获取角色列表失败:', error)
    roleOptions.value = []
  }
}

// 获取部门选项
const fetchDepartmentOptions = async () => {
  try {
    console.log('开始获取部门选项...')
    const res = await getDepartmentOptions({ status: 1 })
    console.log('部门选项API返回数据:', res)
    
    if (res.data && res.data.departments) {
      // 创建新的对象，避免响应式问题
      const processedDepartments = res.data.departments.map((dept: any) => {
        console.log('处理部门数据:', dept)
        // 创建全新的对象，避免响应式引用问题
        // 保持ID为字符串类型，避免类型转换问题
        return {
          id: dept.id || '',
          name: dept.name || '',
          code: dept.code || '',
          description: dept.description || ''
        }
      })
      
      console.log('处理后的部门选项:', processedDepartments)
      // 直接赋值，避免响应式问题
      departmentOptions.value = processedDepartments
    } else {
      console.error('部门数据格式不正确:', res)
      departmentOptions.value = []
    }
  } catch (error: any) {
    console.error('获取部门列表失败:', error)
    console.error('错误详情:', error.response?.data || error.message)
    departmentOptions.value = []
  }
}

// 获取可用员工列表
const fetchAvailableEmployees = async () => {
  try {
    const res = await getAvailableEmployees()
    if (res.data && res.data.employees) {
      availableEmployees.value = res.data.employees
    } else {
      availableEmployees.value = []
    }
  } catch (error) {
    console.error('获取可用员工列表失败:', error)
    availableEmployees.value = []
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchUserList()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    search: '',
    roleId: '',
    departmentId: '',
    status: 1
  })
  // 重置分页到第一页
  pagination.page = 1
  handleSearch()
}

// 选择变化
const handleSelectionChange = (selection: User[]) => {
  selectedUsers.value = selection
}

// 批量启用
const batchEnable = async () => {
  try {
    await batchOperateUsers({
      action: 'enable',
      userIds: selectedUsers.value.map((user: User) => user.id)
    })
    ElMessage.success('批量启用成功')
    fetchUserList()
  } catch (error) {
    ElMessage.error('批量启用失败')
  }
}

// 批量禁用
const batchDisable = async () => {
  try {
    await batchOperateUsers({
      action: 'disable',
      userIds: selectedUsers.value.map((user: User) => user.id)
    })
    ElMessage.success('批量禁用成功')
    fetchUserList()
  } catch (error) {
    ElMessage.error('批量禁用失败')
  }
}

// 显示创建对话框
const showCreateDialog = () => {
  userDialog.mode = 'create'
  userDialog.visible = true
  resetUserForm()
}

// 显示编辑对话框
const showEditDialog = (row: User) => {
  userDialog.mode = 'edit'
  userDialog.visible = true
  Object.assign(userForm, {
    username: row.username,
    realName: row.realName,
    email: row.email,
    phone: row.phone,
    roleId: row.roleId,
    departmentId: row.departmentId,
    status: row.status
  })
  userDialog.userId = row.id
}

// 重置用户表单
const resetUserForm = () => {
  Object.assign(userForm, {
    username: '',
    password: '',
    realName: '',
    email: '',
    phone: '',
    roleId: '', // 使用空字符串，与字符串类型一致
    departmentId: '', // 使用空字符串
    status: 1,
    employeeId: '' // 重置员工选择
  })
  userFormRef.value?.clearValidate()
}

// 提交用户表单
const handleUserSubmit = async () => {
  if (!userFormRef.value) return

  try {
    await userFormRef.value.validate()
    userDialog.loading = true

    // 处理表单数据，将空字符串转换为undefined
    const formData = {
      ...userForm,
      email: userForm.email && userForm.email.trim() ? userForm.email.trim() : undefined,
      phone: userForm.phone && userForm.phone.trim() ? userForm.phone.trim() : undefined,
      roleId: userForm.roleId || '', // 保持字符串类型
      departmentId: userForm.departmentId || undefined,
      status: userForm.status, // 包含status字段
      employeeId: userForm.employeeId || undefined // 包含员工ID
    }
    
    console.log('提交的表单数据:', formData)

    if (userDialog.mode === 'create') {
      const result = await createUser(formData)
      console.log('创建用户结果:', result)
      ElMessage.success('用户创建成功')
      // 重置分页到第一页，确保新用户可见
      pagination.page = 1
    } else {
      await updateUser(userDialog.userId, formData)
      ElMessage.success('用户更新成功')
    }

    userDialog.visible = false
    // 延迟刷新列表，确保后端数据已更新
    setTimeout(() => {
      fetchUserList()
    }, 100)
  } catch (error) {
    if (error !== false) {
      ElMessage.error(userDialog.mode === 'create' ? '用户创建失败' : '用户更新失败')
    }
  } finally {
    userDialog.loading = false
  }
}

// 显示重置密码对话框
const showResetPasswordDialog = (row: User) => {
  resetPasswordDialog.visible = true
  resetPasswordDialog.userId = row.id
  resetPasswordForm.newPassword = ''
  resetPasswordFormRef.value?.clearValidate()
}

// 重置密码
const handleResetPassword = async () => {
  if (!resetPasswordFormRef.value) return

  try {
    await resetPasswordFormRef.value.validate()
    resetPasswordDialog.loading = true

    await resetUserPassword(resetPasswordDialog.userId, {
      newPassword: resetPasswordForm.newPassword
    })

    ElMessage.success('密码重置成功')
    resetPasswordDialog.visible = false
  } catch (error) {
    if (error !== false) {
      ElMessage.error('密码重置失败')
    }
  } finally {
    resetPasswordDialog.loading = false
  }
}

// 删除用户
const handleDelete = async (row: User) => {
  try {
    await ElMessageBox.confirm(`确定要删除用户"${row.realName}"吗？`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteUser(row.id)
    ElMessage.success('用户删除成功')
    fetchUserList()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('用户删除失败')
    }
  }
}

// 格式化日期
const formatDate = (date: string | undefined) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

// 搜索员工
const employeeSearchKeyword = ref('')
const availableEmployees = ref<any[]>([])

const searchEmployees = async () => {
  if (!employeeSearchKeyword.value) {
    availableEmployees.value = []
    return
  }

  try {
    const params = {
      search: employeeSearchKeyword.value
    }
    const res = await getAvailableEmployees(params)
    if (res.data && res.data.employees) {
      availableEmployees.value = res.data.employees
    } else {
      availableEmployees.value = []
    }
  } catch (error) {
    console.error('搜索员工失败:', error)
    availableEmployees.value = []
  }
}

const handleEmployeeSelect = (employeeId: string) => {
  const selectedEmployee = availableEmployees.value.find(emp => emp.id === employeeId)
  if (selectedEmployee) {
    userForm.realName = selectedEmployee.name
    userForm.departmentId = selectedEmployee.departmentId
    if (selectedEmployee.email) {
      userForm.email = selectedEmployee.email
    }
    if (selectedEmployee.phone) {
      userForm.phone = selectedEmployee.phone
    }
  } else {
    userForm.realName = ''
    userForm.departmentId = ''
    userForm.email = ''
    userForm.phone = ''
  }
}

onMounted(() => {
  fetchUserList()
  fetchRoleOptions()
  fetchDepartmentOptions()
  fetchAvailableEmployees() // 组件挂载时加载可用员工列表
})
</script>

<style scoped>
.user-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-bar {
  margin-bottom: 20px;
}

.batch-actions {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.selected-count {
  color: #909399;
  font-size: 14px;
  margin-left: 10px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.employee-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.employee-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.employee-option:hover {
  background-color: #f5f7fa;
}

.employee-option .employee-name {
  font-weight: bold;
  color: #303133;
}

.employee-option .employee-info {
  font-size: 12px;
  color: #909399;
}

.employee-search {
  margin-top: 8px;
}
</style>