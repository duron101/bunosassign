<template>
  <el-dialog
    v-model="visible"
    title="选择团队成员"
    width="900px"
    :before-close="handleClose"
  >
    <!-- 搜索筛选 -->
    <div class="search-section">
      <el-form :model="queryForm" inline>
        <el-form-item label="搜索">
          <el-input
            v-model="queryForm.search"
            placeholder="姓名、工号"
            style="width: 180px"
            clearable
            @keyup.enter="loadEmployees"
          />
        </el-form-item>
        <el-form-item label="部门">
          <el-select v-model="queryForm.departmentId" placeholder="全部部门" clearable style="width: 150px">
            <el-option
              v-for="dept in departments"
              :key="dept.id"
              :label="dept.name"
              :value="dept.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="岗位">
          <el-select v-model="queryForm.positionId" placeholder="全部岗位" clearable style="width: 150px">
            <el-option
              v-for="pos in positions"
              :key="pos.id"
              :label="pos.name"
              :value="pos.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadEmployees">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 员工列表 -->
    <div class="employees-section">
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="employees"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="employeeNo" label="工号" width="120" />
        <el-table-column prop="Department.name" label="部门" width="120" />
        <el-table-column prop="Position.name" label="岗位" width="120" />
        <el-table-column prop="Position.level" label="级别" width="80" />
        <el-table-column prop="annualSalary" label="年薪" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.annualSalary) }}
          </template>
        </el-table-column>
        <el-table-column prop="entryDate" label="入职时间" width="100">
          <template #default="{ row }">
            {{ formatDate(row.entryDate) }}
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryForm.page"
          v-model:page-size="queryForm.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadEmployees"
          @current-change="loadEmployees"
        />
      </div>
    </div>

    <!-- 已选成员 -->
    <div class="selected-section" v-if="selectedEmployees.length > 0">
      <h4>已选择成员 ({{ selectedEmployees.length }})</h4>
      <div class="selected-list">
        <el-tag
          v-for="employee in selectedEmployees"
          :key="employee.id"
          closable
          @close="removeSelectedEmployee(employee)"
          class="selected-tag"
        >
          {{ employee.name }} ({{ employee.employeeNo }})
        </el-tag>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :disabled="selectedEmployees.length === 0">
          确定选择 ({{ selectedEmployees.length }})
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { employeeApi } from '@/api/employee'
import { departmentApi } from '@/api/department'
import { positionApi } from '@/api/position'
import type { TeamMember } from '@/api/projectCollaboration'

// Props
const props = defineProps<{
  modelValue: boolean
  selectedMembers: TeamMember[]
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [members: TeamMember[]]
}>()

// 响应式数据
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const tableRef = ref()
const loading = ref(false)
const employees = ref([])
const selectedEmployees = ref([])
const departments = ref([])
const positions = ref([])

// 查询表单
const queryForm = reactive({
  page: 1,
  pageSize: 20,
  search: '',
  departmentId: '',
  positionId: ''
})

// 分页信息
const pagination = reactive({
  total: 0,
  page: 1,
  pageSize: 20,
  totalPages: 0
})

// 加载员工列表
const loadEmployees = async () => {
  loading.value = true
  try {
    const response = await employeeApi.getEmployees(queryForm)
    employees.value = response.data.employees
    Object.assign(pagination, response.data.pagination)
    
    // 设置已选中的员工
    await nextTick()
    setSelectedRows()
    
  } catch (error) {
    ElMessage.error('加载员工列表失败')
  } finally {
    loading.value = false
  }
}

// 加载部门列表
const loadDepartments = async () => {
  try {
    const response = await departmentApi.getDepartments({ pageSize: 1000 })
    departments.value = response.data.departments
  } catch (error) {
    console.error('加载部门列表失败:', error)
  }
}

// 加载岗位列表
const loadPositions = async () => {
  try {
    const response = await positionApi.getPositions({ pageSize: 1000 })
    positions.value = response.data.positions
  } catch (error) {
    console.error('加载岗位列表失败:', error)
  }
}

// 设置已选中的行
const setSelectedRows = () => {
  if (!tableRef.value) return
  
  const selectedIds = props.selectedMembers.map(member => member.employeeId)
  employees.value.forEach(employee => {
    if (selectedIds.includes(employee.id)) {
      tableRef.value.toggleRowSelection(employee, true)
    }
  })
}

// 处理选择变化
const handleSelectionChange = (selection: any[]) => {
  selectedEmployees.value = selection
}

// 移除已选员工
const removeSelectedEmployee = (employee: any) => {
  if (tableRef.value) {
    tableRef.value.toggleRowSelection(employee, false)
  }
  selectedEmployees.value = selectedEmployees.value.filter(emp => emp.id !== employee.id)
}

// 重置搜索
const handleReset = () => {
  Object.assign(queryForm, {
    page: 1,
    pageSize: 20,
    search: '',
    departmentId: '',
    positionId: ''
  })
  loadEmployees()
}

// 确认选择
const handleConfirm = () => {
  if (selectedEmployees.value.length === 0) {
    ElMessage.warning('请选择至少一名成员')
    return
  }

  // 转换为TeamMember格式
  const teamMembers: TeamMember[] = selectedEmployees.value.map(employee => ({
    employeeId: employee.id,
    roleId: '',
    roleName: '',
    contributionWeight: 1.0,
    estimatedWorkload: 1.0,
    allocationPercentage: 100,
    reason: '',
    Employee: {
      id: employee.id,
      name: employee.name,
      employeeNo: employee.employeeNo,
      department: employee.Department?.name,
      position: employee.Position?.name
    }
  }))

  emit('confirm', teamMembers)
  handleClose()
}

// 关闭对话框
const handleClose = () => {
  visible.value = false
}

// 格式化货币
const formatCurrency = (amount: number) => {
  if (!amount) return '¥0'
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 监听对话框显示状态
watch(visible, (newVisible) => {
  if (newVisible) {
    loadEmployees()
    // 初始化已选择的员工
    selectedEmployees.value = props.selectedMembers.map(member => ({
      id: member.employeeId,
      name: member.Employee?.name,
      employeeNo: member.Employee?.employeeNo
    })).filter(emp => emp.name) // 过滤掉无效数据
  }
})

// 组件挂载
onMounted(() => {
  loadDepartments()
  loadPositions()
})
</script>

<style scoped>
.search-section {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.employees-section {
  margin-bottom: 20px;
}

.pagination-wrapper {
  margin-top: 15px;
  text-align: right;
}

.selected-section {
  border-top: 1px solid #ebeef5;
  padding-top: 15px;
  margin-top: 20px;
}

.selected-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 14px;
}

.selected-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.selected-tag {
  margin: 0;
}

.dialog-footer {
  text-align: right;
}
</style>