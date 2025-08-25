<template>
  <div class="position-management">
    <div class="page-header">
      <h2>岗位管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          新增岗位
        </el-button>
        <el-button @click="showBenchmarkDialog">
          <el-icon><Edit /></el-icon>
          批量调整基准值
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card
        v-for="stat in levelStats"
        :key="stat.level"
        class="stat-card"
        shadow="hover"
      >
        <div class="stat-content">
          <div class="stat-title">{{ stat.level }}</div>
          <div class="stat-number">{{ stat.positionCount || 0 }}个岗位</div>
          <div class="stat-subtitle">{{ stat.employeeCount || 0 }}名员工</div>
          <div class="stat-value">基准值均值: {{ (stat.avgBenchmarkValue || 0).toFixed(2) }}</div>
        </div>
      </el-card>
    </div>

    <!-- 搜索筛选区 -->
    <el-card class="search-card">
      <el-form :model="queryForm" inline>
        <el-form-item label="搜索">
          <el-input
            v-model="queryForm.search"
            placeholder="岗位名称/代码"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="职级">
          <el-select v-model="queryForm.level" placeholder="请选择职级" clearable>
            <el-option
              v-for="level in levelOptions"
              :key="level.value"
              :label="level.label"
              :value="level.value"
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
    <el-card class="batch-actions" v-if="selectedPositions.length > 0">
      <el-alert
        :title="`已选择 ${selectedPositions.length} 个岗位`"
        type="info"
        :closable="false"
      />
      <div class="batch-buttons">
        <el-button @click="handleBatchEnable">批量启用</el-button>
        <el-button @click="handleBatchDisable">批量禁用</el-button>
        <el-button @click="showBatchBenchmarkDialog">批量调整基准值</el-button>
      </div>
    </el-card>

    <!-- 岗位列表 -->
    <el-card class="table-card">
      <el-table
        :data="positions"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        stripe
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="name" label="岗位名称" width="180" />
        <el-table-column prop="code" label="岗位代码" width="120" />
        <el-table-column prop="level" label="职级" width="100">
          <template #default="{ row }">
            <el-tag :type="getLevelTagType(row.level)">
              {{ row.level }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="benchmarkValue" label="基准值" width="100" sortable>
          <template #default="{ row }">
            <span class="benchmark-value">{{ row.benchmarkValue }}</span>
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
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="showDetailDialog(row)">
              详情
            </el-button>
            <el-button size="small" @click="showEditDialog(row)">编辑</el-button>
            <el-button size="small" @click="adjustBenchmark(row)">调整基准值</el-button>
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

    <!-- 岗位详情对话框 -->
    <PositionDetailDialog
      v-model:visible="detailVisible"
      :position="currentPosition"
      @edit="handleDetailEdit"
      @view-employees="handleDetailViewEmployees"
      @adjust-benchmark="handleDetailAdjustBenchmark"
    />

    <!-- 岗位表单对话框 -->
    <PositionFormDialog
      v-model:visible="formVisible"
      :position="currentPosition"
      :is-edit="isEdit"
      @success="handleFormSuccess"
    />

    <!-- 基准值调整对话框 -->
    <BenchmarkAdjustDialog
      v-model:visible="benchmarkVisible"
      :positions="benchmarkPositions"
      :is-batch="isBatchBenchmark"
      @success="handleBenchmarkSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Download } from '@element-plus/icons-vue'
import { shouldShowError } from '@/utils/error-handler'
import {
  getPositions,
  deletePosition,
  batchOperatePositions,
  getPositionStatistics,
  type Position,
  type PositionQuery
} from '@/api/position'
import PositionDetailDialog from './components/PositionDetailDialog.vue'
import PositionFormDialog from './components/PositionFormDialog.vue'
import BenchmarkAdjustDialog from './components/BenchmarkAdjustDialog.vue'

// 路由实例
const router = useRouter()

// 响应式数据
const loading = ref(false)
const positions = ref<Position[]>([])
const selectedPositions = ref<Position[]>([])
const levelStats = ref([])
const levelOptions = ref([
  { value: 'P1', label: 'P1 - 初级' },
  { value: 'P2', label: 'P2 - 中级' },
  { value: 'P3', label: 'P3 - 高级' },
  { value: 'P4', label: 'P4 - 资深' },
  { value: 'P5', label: 'P5 - 专家' },
  { value: 'P6', label: 'P6 - 高级专家' },
  { value: 'P7', label: 'P7 - 首席专家' },
  { value: 'M1', label: 'M1 - 组长' },
  { value: 'M2', label: 'M2 - 经理' },
  { value: 'M3', label: 'M3 - 高级经理' },
  { value: 'M4', label: 'M4 - 总监' }
])

// 查询表单
const queryForm = reactive<PositionQuery>({
  page: 1,
  pageSize: 20,
  search: '',
  level: undefined,
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
const benchmarkVisible = ref(false)
const isEdit = ref(false)
const isBatchBenchmark = ref(false)
const currentPosition = ref<Position | null>(null)
const benchmarkPositions = ref<Position[]>([])

// 获取岗位列表
const getPositionList = async () => {
  loading.value = true
  try {
    const { data } = await getPositions(queryForm)
    positions.value = data.positions
    pagination.total = data.pagination.total
    pagination.totalPages = data.pagination.totalPages
  } catch (error) {
    // 只在非认证错误时显示错误消息
    if (shouldShowError(error)) {
      ElMessage.error('获取岗位列表失败')
    }
  } finally {
    loading.value = false
  }
}

// 获取统计信息
const getLevelStatistics = async () => {
  try {
    const { data } = await getPositionStatistics()
    levelStats.value = data
  } catch (error) {
    console.error('获取统计信息失败:', error)
  }
}

// 搜索
const handleSearch = () => {
  queryForm.page = 1
  pagination.page = 1
  getPositionList()
}

// 重置搜索
const handleReset = () => {
  Object.assign(queryForm, {
    page: 1,
    pageSize: 20,
    search: '',
    level: undefined,
    status: undefined
  })
  pagination.page = 1
  getPositionList()
}

// 分页相关
const handleSizeChange = (size: number) => {
  queryForm.pageSize = size
  pagination.pageSize = size
  getPositionList()
}

const handleCurrentChange = (page: number) => {
  queryForm.page = page
  getPositionList()
}

// 选择变化
const handleSelectionChange = (selection: Position[]) => {
  selectedPositions.value = selection
}

// 获取职级标签类型
const getLevelTagType = (level: string) => {
  if (level.startsWith('P')) {
    const num = parseInt(level.substring(1))
    if (num <= 2) return 'info'
    if (num <= 4) return 'success'
    return 'warning'
  } else if (level.startsWith('M')) {
    return 'danger'
  }
  return 'info'
}

// 显示新增对话框
const showCreateDialog = () => {
  currentPosition.value = null
  isEdit.value = false
  formVisible.value = true
}

// 显示详情对话框
const showDetailDialog = (position: Position) => {
  currentPosition.value = position
  detailVisible.value = true
}

// 详情对话框编辑事件
const handleDetailEdit = (position: Position) => {
  currentPosition.value = position
  isEdit.value = true
  detailVisible.value = false
  formVisible.value = true
}

// 详情对话框查看员工事件
const handleDetailViewEmployees = (position: Position) => {
  // 跳转到员工管理页面，并筛选该岗位
  router.push({ path: '/employee', query: { positionId: position.id } })
  detailVisible.value = false
}

// 详情对话框调整基准值事件
const handleDetailAdjustBenchmark = (position: Position) => {
  benchmarkPositions.value = [position]
  isBatchBenchmark.value = false
  detailVisible.value = false
  benchmarkVisible.value = true
}

// 显示编辑对话框
const showEditDialog = (position: Position) => {
  currentPosition.value = position
  isEdit.value = true
  formVisible.value = true
}

// 调整单个基准值
const adjustBenchmark = (position: Position) => {
  benchmarkPositions.value = [position]
  isBatchBenchmark.value = false
  benchmarkVisible.value = true
}

// 显示批量基准值对话框
const showBenchmarkDialog = () => {
  benchmarkPositions.value = positions.value
  isBatchBenchmark.value = true
  benchmarkVisible.value = true
}

// 显示选中岗位批量基准值对话框
const showBatchBenchmarkDialog = () => {
  benchmarkPositions.value = selectedPositions.value
  isBatchBenchmark.value = true
  benchmarkVisible.value = true
}

// 查看员工
const viewEmployees = (position: Position) => {
  // 跳转到员工管理页面，并筛选该岗位
  router.push({ path: '/employee', query: { positionId: position.id } })
}

// 删除岗位
const handleDelete = async (position: Position) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除岗位 ${position.name} 吗？删除后将无法恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deletePosition(position.id)
    ElMessage.success('删除成功')
    getPositionList()
    getLevelStatistics()
  } catch (error) {
    if (error !== 'cancel' && shouldShowError(error)) {
      ElMessage.error('删除失败')
    }
  }
}

// 批量启用
const handleBatchEnable = async () => {
  try {
    const ids = selectedPositions.value.map(pos => pos.id)
    await batchOperatePositions('enable', ids)
    ElMessage.success('批量启用成功')
    selectedPositions.value = []
    getPositionList()
  } catch (error) {
    if (shouldShowError(error)) {
      ElMessage.error('批量启用失败')
    }
  }
}

// 批量禁用
const handleBatchDisable = async () => {
  try {
    const ids = selectedPositions.value.map(pos => pos.id)
    await batchOperatePositions('disable', ids)
    ElMessage.success('批量禁用成功')
    selectedPositions.value = []
    getPositionList()
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
  getPositionList()
  getLevelStatistics()
}

// 基准值调整成功回调
const handleBenchmarkSuccess = () => {
  getPositionList()
  getLevelStatistics()
}

// 格式化日期时间
const formatDateTime = (dateTime: string) => {
  if (!dateTime) return '-'
  const date = new Date(dateTime)
  return date.toLocaleString('zh-CN')
}

// 页面加载时获取数据
onMounted(() => {
  getPositionList()
  getLevelStatistics()
})
</script>

<style scoped>
.position-management {
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

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  border: 1px solid #e4e7ed;
}

.stat-content {
  text-align: center;
  padding: 8px;
}

.stat-title {
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.stat-subtitle {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 12px;
  color: #909399;
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

.benchmark-value {
  font-weight: 600;
  color: #409eff;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

:deep(.stat-card .el-card__body) {
  padding: 16px;
}
</style>