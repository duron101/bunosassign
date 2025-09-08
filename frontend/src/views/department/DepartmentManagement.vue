<template>
  <div class="department-management">
    <div class="page-header">
      <h2>部门管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          新增部门
        </el-button>
        <el-button @click="toggleViewMode">
          <el-icon><component :is="viewMode === 'tree' ? 'List' : 'Connection'" /></el-icon>
          {{ viewMode === 'tree' ? '列表视图' : '树形视图' }}
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选区 -->
    <el-card class="search-card" v-if="viewMode === 'list'">
      <el-form :model="queryForm" inline>
        <el-form-item label="搜索">
          <el-input
            v-model="queryForm.search"
            placeholder="部门名称/代码"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="业务线">
          <el-select v-model="queryForm.businessLineId" placeholder="请选择业务线" clearable>
            <el-option
              v-for="line in businessLines"
              :key="line.id"
              :label="line.name"
              :value="line.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="请选择状态" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 批量操作工具栏 -->
    <el-card class="batch-actions" v-if="selectedDepartments.length > 0 && viewMode === 'list'">
      <el-alert
        :title="`已选择 ${selectedDepartments.length} 个部门`"
        type="info"
        :closable="false"
      />
      <div class="batch-buttons">
        <el-button @click="handleBatchEnable">批量启用</el-button>
        <el-button @click="handleBatchDisable">批量禁用</el-button>
      </div>
    </el-card>

    <!-- 列表视图 -->
    <el-card class="table-card" v-if="viewMode === 'list'">
      <el-table
        :data="departments"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        stripe
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="name" label="部门名称" width="180" />
        <el-table-column prop="code" label="部门代码" width="120" />
        <el-table-column label="业务线" width="150">
          <template #default="{ row }">
            {{ row.businessLine?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="员工数量" width="100">
          <template #default="{ row }">
            <el-link type="primary" @click="viewEmployees(row)">
              {{ row.employeeCount || 0 }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="showDetailDialog(row)">
              详情
            </el-button>
            <el-button size="small" @click="showEditDialog(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
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

    <!-- 树形视图 -->
    <el-card class="tree-card" v-if="viewMode === 'tree'">
      <div class="tree-header">
        <h3>部门组织架构</h3>
        <p class="tree-description">按部门层级结构展示，业务线作为部门属性显示</p>
      </div>
      
      <el-tree
        :data="departmentTree"
        :props="treeProps"
        :expand-on-click-node="false"
        default-expand-all
        v-loading="treeLoading"
        class="department-tree"
      >
        <template #default="{ node, data }">
          <div class="tree-node">
            <div class="node-info">
              <span class="node-label">{{ data.name }}</span>
              <span class="node-code">({{ data.code }})</span>
              <el-tag v-if="data.BusinessLine" size="small" type="info" style="margin-left: 8px">
                {{ data.BusinessLine.name }}
              </el-tag>
              <el-tag size="small" style="margin-left: 8px">
                {{ data.employeeCount || 0 }}人
              </el-tag>
            </div>
            <div class="node-actions">
              <el-button type="primary" size="small" @click="showDetailDialog(data)">
                详情
              </el-button>
              <el-button size="small" @click="showEditDialog(data)">编辑</el-button>
              <el-button size="small" @click="addChildDepartment(data)">添加子部门</el-button>
              <el-button type="danger" size="small" @click="handleDelete(data)">删除</el-button>
            </div>
          </div>
        </template>
      </el-tree>
    </el-card>

    <!-- 部门详情对话框 -->
    <DepartmentDetailDialog
      v-model:visible="detailVisible"
      :department="currentDepartment"
      @edit="handleDetailEdit"
      @view-employees="handleDetailViewEmployees"
    />

    <!-- 部门表单对话框 -->
    <DepartmentFormDialog
      v-model:visible="formVisible"
      :department="currentDepartment"
      :parent-department="parentDepartment"
      :is-edit="isEdit"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, List, Connection } from '@element-plus/icons-vue'
import { shouldShowError } from '@/utils/error-handler'
// API导入
import {
  getDepartments,
  getDepartmentTree,
  deleteDepartment,
  batchOperateDepartments,
  type Department,
  type DepartmentQuery
} from '@/api/department'
import { getBusinessLines } from '@/api/businessLine'
import DepartmentDetailDialog from './components/DepartmentDetailDialog.vue'
import DepartmentFormDialog from './components/DepartmentFormDialog.vue'

// 路由实例
const router = useRouter()

// 响应式数据
const loading = ref(false)
const treeLoading = ref(false)
const departments = ref<Department[]>([])
const departmentTree = ref([])
const selectedDepartments = ref<Department[]>([])
const businessLines = ref([])

// 视图模式
const viewMode = ref<'list' | 'tree'>('list')

// 查询表单
const queryForm = reactive<DepartmentQuery>({
  page: 1,
  pageSize: 20,
  search: '',
  businessLineId: undefined,
  status: undefined
})

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0
})

// 树形配置
const treeProps = {
  children: 'children',
  label: 'name'
}

// 对话框状态
const detailVisible = ref(false)
const formVisible = ref(false)
const isEdit = ref(false)
const currentDepartment = ref<Department | null>(null)
const parentDepartment = ref<Department | null>(null)

// 获取部门列表
const getDepartmentList = async () => {
  loading.value = true
  try {
    const { data } = await getDepartments(queryForm)
    departments.value = data.departments
    pagination.total = data.pagination.total
    pagination.totalPages = data.pagination.totalPages
  } catch (error) {
    if (shouldShowError(error)) {
      ElMessage.error('获取部门列表失败')
    }
  } finally {
    loading.value = false
  }
}

// 获取部门树形结构
const loadDepartmentTree = async () => {
  treeLoading.value = true
  try {
    const { data } = await getDepartmentTree({})
    departmentTree.value = data
  } catch (error) {
    if (shouldShowError(error)) {
      ElMessage.error('获取部门树形结构失败')
    }
  } finally {
    treeLoading.value = false
  }
}

// 获取业务线列表
const getBusinessLineList = async () => {
  try {
    console.log('🔍 开始获取业务线列表...')
    const response = await getBusinessLines({ status: 1 })
    console.log('📡 业务线API响应:', response)
    
    if (response && response.data && response.data.businessLines) {
      businessLines.value = response.data.businessLines
      console.log('✅ 业务线数据设置成功:', businessLines.value)
    } else {
      console.warn('⚠️ API响应格式异常:', response)
      businessLines.value = []
    }
  } catch (error) {
    console.error('❌ 获取业务线列表失败:', error)
    businessLines.value = []
  }
}

// 切换视图模式
const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'list' ? 'tree' : 'list'
  if (viewMode.value === 'tree') {
    loadDepartmentTree()
  } else {
    getDepartmentList()
  }
}

// 搜索
const handleSearch = () => {
  queryForm.page = 1
  pagination.page = 1
  getDepartmentList()
}

// 重置搜索
const handleReset = () => {
  Object.assign(queryForm, {
    page: 1,
    pageSize: 20,
    search: '',
    businessLineId: undefined,
    status: undefined
  })
  pagination.page = 1
  getDepartmentList()
}

// 分页相关
const handleSizeChange = (size: number) => {
  queryForm.pageSize = size
  pagination.pageSize = size
  getDepartmentList()
}

const handleCurrentChange = (page: number) => {
  queryForm.page = page
  getDepartmentList()
}

// 选择变化
const handleSelectionChange = (selection: any[]) => {
  selectedDepartments.value = selection
}

// 显示新增对话框
const showCreateDialog = () => {
  currentDepartment.value = null
  parentDepartment.value = null
  isEdit.value = false
  formVisible.value = true
}

// 显示详情对话框
const showDetailDialog = (department: any) => {
  currentDepartment.value = department
  detailVisible.value = true
}

// 详情对话框编辑事件
const handleDetailEdit = (department: Department) => {
  currentDepartment.value = department
  parentDepartment.value = null
  isEdit.value = true
  detailVisible.value = false
  formVisible.value = true
}

// 详情对话框查看员工事件
const handleDetailViewEmployees = (department: Department) => {
  // 跳转到员工管理页面，并筛选该部门
  router.push({ path: '/employee', query: { departmentId: department.id } })
  detailVisible.value = false
}

// 显示编辑对话框
const showEditDialog = (department: any) => {
  currentDepartment.value = department
  parentDepartment.value = null
  isEdit.value = true
  formVisible.value = true
}

// 添加子部门
const addChildDepartment = (parentDept: any) => {
  currentDepartment.value = null
  parentDepartment.value = parentDept
  isEdit.value = false
  formVisible.value = true
}

// 查看员工
const viewEmployees = (department: any) => {
  // 跳转到员工管理页面，并筛选该部门
  router.push({ path: '/employee', query: { departmentId: department.id } })
}

// 删除部门
const handleDelete = async (department: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除部门 ${department.name} 吗？删除后将无法恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteDepartment(department.id)
    ElMessage.success('删除成功')
    
    if (viewMode.value === 'tree') {
      loadDepartmentTree()
    } else {
      getDepartmentList()
    }
  } catch (error) {
    if (error !== 'cancel' && shouldShowError(error)) {
      ElMessage.error('删除失败')
    }
  }
}

// 批量启用
const handleBatchEnable = async () => {
  try {
    const ids = selectedDepartments.value.map(dept => dept.id)
    await batchOperateDepartments('enable', ids)
    ElMessage.success('批量启用成功')
    selectedDepartments.value = []
    getDepartmentList()
  } catch (error) {
    if (shouldShowError(error)) {
      ElMessage.error('批量启用失败')
    }
  }
}

// 批量禁用
const handleBatchDisable = async () => {
  try {
    const ids = selectedDepartments.value.map(dept => dept.id)
    await batchOperateDepartments('disable', ids)
    ElMessage.success('批量禁用成功')
    selectedDepartments.value = []
    getDepartmentList()
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
  if (viewMode.value === 'tree') {
    loadDepartmentTree()
  } else {
    getDepartmentList()
  }
}

// 格式化日期时间
const formatDateTime = (dateTime: string) => {
  if (!dateTime) return '-'
  const date = new Date(dateTime)
  return date.toLocaleString('zh-CN')
}

// 页面加载时获取数据
onMounted(() => {
  console.log('=== DEPARTMENT MANAGEMENT onMounted ===')
  getDepartmentList()
  getBusinessLineList()
})
</script>

<style scoped>
.department-management {
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
.table-card,
.tree-card {
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

.tree-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.tree-header h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 16px;
}

.tree-description {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.department-tree {
  min-height: 400px;
}

.tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 0;
}

.node-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.node-label {
  font-weight: 500;
  color: #303133;
  margin-right: 8px;
}

.node-code {
  color: #909399;
  font-size: 12px;
}

.node-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s;
}

.tree-node:hover .node-actions {
  opacity: 1;
}

:deep(.el-tree-node__content) {
  padding: 0 8px;
  margin: 2px 0;
}

:deep(.el-tree-node__content:hover) {
  background-color: #f5f7fa;
}
</style>