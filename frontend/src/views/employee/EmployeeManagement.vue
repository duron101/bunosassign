<template>
  <div class="employee-management">
    <div class="page-header">
      <h2>员工管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          新增员工
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选区 -->
    <el-card class="search-card">
      <el-form :model="queryForm" inline>
        <el-form-item label="搜索">
          <el-input
            v-model="queryForm.search"
            placeholder="工号/姓名"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="部门">
          <el-select v-model="queryForm.departmentId" placeholder="请选择部门" clearable>
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="岗位">
          <el-select v-model="queryForm.positionId" placeholder="请选择岗位" clearable>
            <el-option
              v-for="pos in positions"
              :key="pos.id"
              :label="pos.name"
              :value="pos.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="请选择状态" clearable>
            <el-option label="在职" :value="1" />
            <el-option label="离职" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 批量操作工具栏 -->
    <el-card class="batch-actions" v-if="selectedEmployees.length > 0">
      <el-alert
        :title="`已选择 ${selectedEmployees.length} 个员工`"
        type="info"
        :closable="false"
      />
      <div class="batch-buttons">
        <el-button @click="handleBatchEnable">批量启用</el-button>
        <el-button @click="handleBatchDisable">批量禁用</el-button>
      </div>
    </el-card>

    <!-- 员工列表 -->
    <el-card class="table-card">
      <el-table
        :data="employees"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        stripe
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="employeeNo" label="工号" width="120" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column label="部门" width="120">
          <template #default="{ row }">
            {{ row.department?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="岗位" width="120">
          <template #default="{ row }">
            {{ row.position?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="职级" width="100">
          <template #default="{ row }">
            {{ row.position?.level || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="电话" width="120" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <!-- 薪酬列（根据权限动态显示） -->
        <el-table-column 
          v-if="canViewSalary" 
          label="年薪" 
          width="120"
        >
          <template #default="{ row }">
            {{ formatCurrency(row.annualSalary) }}
          </template>
        </el-table-column>
        
        <!-- 无权限时显示占位符列 -->
        <el-table-column 
          v-else 
          label="薪酬" 
          width="120"
        >
          <template #default>
            <el-tag type="info" size="small">保密</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="entryDate" label="入职日期" width="120" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '在职' : '离职' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="showDetailDialog(row)">
              详情
            </el-button>
            <el-button size="small" @click="showEditDialog(row)">编辑</el-button>
            <el-dropdown @command="(cmd) => handleMoreAction(cmd, row)">
              <el-button size="small">
                更多<el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="transfer">调动</el-dropdown-item>
                  <el-dropdown-item command="resign" v-if="row.status === 1">离职</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 员工详情对话框 -->
    <EmployeeDetailDialog
      v-model:visible="detailVisible"
      :employee="currentEmployee"
    />

    <!-- 员工编辑对话框 -->
    <EmployeeFormDialog
      v-model:visible="formVisible"
      :employee="currentEmployee"
      :is-edit="isEdit"
      @success="handleFormSuccess"
    />

    <!-- 员工调岗对话框 -->
    <EmployeeTransferDialog
      v-model:visible="transferVisible"
      :employee="currentEmployee"
      @success="handleTransferSuccess"
    />

    <!-- 员工离职对话框 -->
    <EmployeeResignDialog
      v-model:visible="resignVisible"
      :employee="currentEmployee"
      @success="handleResignSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, ArrowDown } from '@element-plus/icons-vue'
import { shouldShowError } from '@/utils/error-handler'
import { useSalaryPermission } from '@/composables/useSalaryPermission'
// API导入
import {
  getEmployees,
  deleteEmployee,
  batchOperateEmployees,
  type Employee,
  type EmployeeQuery
} from '@/api/employee'
import { getDepartments } from '@/api/department'
import { getPositions } from '@/api/position'
import EmployeeDetailDialog from './components/EmployeeDetailDialog.vue'
import EmployeeFormDialog from './components/EmployeeFormDialog.vue'
import EmployeeResignDialog from './components/EmployeeResignDialog.vue'
import EmployeeTransferDialog from './components/EmployeeTransferDialog.vue'

// 权限控制
const { canViewSalary, formatCurrency } = useSalaryPermission()

// 路由实例
const route = useRoute()

// 响应式数据
const loading = ref(false)
const employees = ref<Employee[]>([])
const departments = ref([])
const positions = ref([])
const selectedEmployees = ref<Employee[]>([])

// 查询表单
const queryForm = reactive<EmployeeQuery>({
  page: 1,
  pageSize: 20,
  search: '',
  departmentId: undefined,
  positionId: undefined,
  status: undefined
})

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0
})

// 对话框状态
const detailVisible = ref(false)
const formVisible = ref(false)
const resignVisible = ref(false)
const transferVisible = ref(false)
const isEdit = ref(false)
const currentEmployee = ref<Employee | null>(null)

// 获取员工列表
const getEmployeeList = async () => {
  loading.value = true
  try {
    const { data } = await getEmployees(queryForm)
    employees.value = data.employees
    pagination.total = data.pagination.total
    pagination.totalPages = data.pagination.totalPages
  } catch (error) {
    if (shouldShowError(error)) {
      ElMessage.error('获取员工列表失败')
    }
  } finally {
    loading.value = false
  }
}

// 获取部门列表
const getDepartmentList = async () => {
  try {
    const { data } = await getDepartments({ status: 1 })
    departments.value = data.departments
  } catch (error) {
    if (shouldShowError(error)) {
      ElMessage.error('获取部门列表失败')
    }
  }
}

// 获取岗位列表
const getPositionList = async () => {
  try {
    const { data } = await getPositions({ status: 1 })
    positions.value = data.positions
  } catch (error) {
    if (shouldShowError(error)) {
      ElMessage.error('获取岗位列表失败')
    }
  }
}

// 搜索
const handleSearch = () => {
  queryForm.page = 1
  pagination.page = 1
  getEmployeeList()
}

// 重置搜索
const handleReset = () => {
  Object.assign(queryForm, {
    page: 1,
    pageSize: 20,
    search: '',
    departmentId: undefined,
    positionId: undefined,
    status: undefined
  })
  pagination.page = 1
  getEmployeeList()
}

// 分页相关
const handleSizeChange = (size: number) => {
  queryForm.pageSize = size
  pagination.pageSize = size
  getEmployeeList()
}

const handleCurrentChange = (page: number) => {
  queryForm.page = page
  getEmployeeList()
}

// 选择变化
const handleSelectionChange = (selection: Employee[]) => {
  selectedEmployees.value = selection
}

// 显示新增对话框
const showCreateDialog = () => {
  currentEmployee.value = null
  isEdit.value = false
  formVisible.value = true
}

// 显示详情对话框
const showDetailDialog = (employee: Employee) => {
  currentEmployee.value = employee
  detailVisible.value = true
}

// 显示编辑对话框
const showEditDialog = (employee: Employee) => {
  currentEmployee.value = employee
  isEdit.value = true
  formVisible.value = true
}

// 处理更多操作
const handleMoreAction = (command: string, employee: Employee) => {
  currentEmployee.value = employee
  
  switch (command) {
    case 'transfer':
      transferVisible.value = true
      break
    case 'resign':
      resignVisible.value = true
      break
    case 'delete':
      handleDelete(employee)
      break
  }
}

// 删除员工
const handleDelete = async (employee: Employee) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除员工 ${employee.name} 吗？删除后将无法恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteEmployee(employee.id)
    ElMessage.success('删除成功')
    getEmployeeList()
  } catch (error) {
    if (shouldShowError(error)) {
      ElMessage.error('删除失败')
    }
  }
}

// 批量启用
const handleBatchEnable = async () => {
  try {
    const ids = selectedEmployees.value.map(emp => emp.id)
    await batchOperateEmployees('enable', ids)
    ElMessage.success('批量启用成功')
    selectedEmployees.value = []
    getEmployeeList()
  } catch (error) {
    if (shouldShowError(error)) {
      ElMessage.error('批量启用失败')
    }
  }
}

// 批量禁用
const handleBatchDisable = async () => {
  try {
    const ids = selectedEmployees.value.map(emp => emp.id)
    await batchOperateEmployees('disable', ids)
    ElMessage.success('批量禁用成功')
    selectedEmployees.value = []
    getEmployeeList()
  } catch (error) {
    if (shouldShowError(error)) {
      ElMessage.error('批量禁用失败')
    }
  }
}

// 导出数据
const handleExport = () => {
  ElMessage.info('导出功能正在开发中...')
}

// 表单成功回调
const handleFormSuccess = () => {
  getEmployeeList()
}

// 转移成功回调
const handleTransferSuccess = () => {
  getEmployeeList()
}

// 离职成功回调
const handleResignSuccess = () => {
  getEmployeeList()
}

// 页面加载时获取数据
onMounted(() => {
  console.log('=== EMPLOYEE MANAGEMENT onMounted ===')
  console.log('Current user store state:', {
    hasToken: !!localStorage.getItem('token'),
    hasUser: false, // 暂时不获取用户信息
    path: window.location.pathname
  })
  
  // 检查URL查询参数，如果是从部门管理页面跳转过来的，自动设置部门筛选
  const departmentId = route.query.departmentId
  if (departmentId) {
    console.log('从部门管理页面跳转过来，自动筛选部门:', departmentId)
    queryForm.departmentId = departmentId as string
  }
  
  // 检查URL查询参数，如果是从岗位管理页面跳转过来的，自动设置岗位筛选
  const positionId = route.query.positionId
  if (positionId) {
    console.log('从岗位管理页面跳转过来，自动筛选岗位:', positionId)
    queryForm.positionId = positionId as string
  }
  
  getEmployeeList()
  getDepartmentList()
  getPositionList()
})
</script>

<style scoped>
.employee-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.search-card,
.batch-actions,
.table-card {
  margin-bottom: 20px;
}

.batch-actions {
  background-color: #f0f9ff;
  border-color: #3b82f6;
}

.batch-actions .el-card__body {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
}

.batch-buttons {
  display: flex;
  gap: 12px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

/* 导入对话框样式 */
.import-content {
  padding: 10px 0;
}

.import-tips {
  margin-bottom: 20px;
}

.import-tips ul {
  margin: 10px 0 0 0;
  padding-left: 20px;
}

.import-tips li {
  margin: 5px 0;
  color: #606266;
}

.template-download {
  text-align: center;
  margin: 20px 0;
}

.file-upload {
  margin: 20px 0;
}

.upload-excel {
  width: 100%;
}

.import-result {
  margin-top: 20px;
}

.error-list {
  margin-top: 15px;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #f56c6c;
  border-radius: 4px;
  padding: 10px;
  background: #fef0f0;
}

.error-list h4 {
  margin: 0 0 10px 0;
  color: #f56c6c;
}

.error-list ul {
  margin: 0;
  padding-left: 20px;
}

.error-item {
  color: #f56c6c;
  font-size: 14px;
  margin: 5px 0;
}
</style>