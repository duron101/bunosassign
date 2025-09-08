<template>
  <div class="business-line-management">
    <div class="page-header">
      <h2>业务线管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          新增业务线
        </el-button>
        <el-button @click="handleExport">
          <el-icon><Download /></el-icon>
          导出数据
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <div class="search-section">
      <el-form :model="queryForm" inline>
        <el-form-item label="搜索">
          <el-input
            v-model="queryForm.search"
            placeholder="业务线名称、代码或描述"
            style="width: 200px"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 统计卡片区域 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-value">{{ statistics.total }}</div>
              <div class="stat-label">业务线总数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-value">{{ statistics.active }}</div>
              <div class="stat-label">启用状态</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-value">{{ statistics.totalDepartments }}</div>
              <div class="stat-label">关联部门</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-item">
              <div class="stat-value">{{ statistics.totalEmployees }}</div>
              <div class="stat-label">关联员工</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 业务线列表 -->
    <div class="table-section">
      <el-table
        v-loading="loading"
        :data="businessLines"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="业务线名称" min-width="150">
          <template #default="{ row }">
            <div class="business-line-name">
              <span class="name">{{ row.name }}</span>
              <el-tag v-if="row.status === 0" type="danger" size="small">已禁用</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="业务线代码" width="120" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="Manager" label="负责人" width="120">
          <template #default="{ row }">
            <span v-if="row.Manager">{{ row.Manager.name }}</span>
            <span v-else class="text-muted">未指定</span>
          </template>
        </el-table-column>
        <el-table-column prop="weight" label="默认权重" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ formatPercent(row.weight) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="profitTarget" label="利润目标" width="120" align="right">
          <template #default="{ row }">
            <span v-if="row.profitTarget">{{ formatCurrency(row.profitTarget) }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="departmentCount" label="部门数" width="80" align="center" />
        <el-table-column prop="employeeCount" label="员工数" width="80" align="center" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="showDetailDialog(row)">详情</el-button>
            <el-button link type="primary" @click="showEditDialog(row)">编辑</el-button>
            <el-button link type="warning" @click="showWeightDialog(row)">权重配置</el-button>
            <el-dropdown @command="handleCommand">
              <el-button link type="primary">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="`${row.status === 1 ? 'disable' : 'enable'}_${row.id}`">
                    {{ row.status === 1 ? '禁用' : '启用' }}
                  </el-dropdown-item>
                  <el-dropdown-item :command="`delete_${row.id}`" class="danger-item">
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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
          @size-change="handleSearch"
          @current-change="handleSearch"
        />
      </div>
    </div>

    <!-- 批量操作工具栏 -->
    <div v-if="selectedBusinessLines.length > 0" class="batch-actions">
      <el-alert
        :title="`已选择 ${selectedBusinessLines.length} 项`"
        type="info"
        show-icon
        :closable="false"
      />
      <div class="batch-buttons">
        <el-button @click="handleBatchEnable">批量启用</el-button>
        <el-button @click="handleBatchDisable">批量禁用</el-button>
      </div>
    </div>

    <!-- 业务线详情对话框 -->
    <BusinessLineDetailDialog
      v-model="detailVisible"
      :business-line="currentBusinessLine"
    />

    <!-- 业务线表单对话框 -->
    <BusinessLineFormDialog
      v-model="formVisible"
      :business-line="currentBusinessLine"
      :mode="isEdit ? 'edit' : 'create'"
      @success="handleFormSuccess"
    />

    <!-- 权重配置对话框 -->
    <WeightConfigDialog
      v-model="weightConfigVisible"
      :business-line="currentBusinessLine"
      @success="handleWeightSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Search, Refresh, ArrowDown } from '@element-plus/icons-vue'
import { shouldShowError } from '@/utils/error-handler'
// API导入
import { businessLineApi } from '@/api/businessLine'
import BusinessLineDetailDialog from './components/BusinessLineDetailDialog.vue'
import BusinessLineFormDialog from './components/BusinessLineFormDialog.vue'
import WeightConfigDialog from './components/WeightConfigDialog.vue'
import type { BusinessLine } from '@/types/businessLine'

// 响应式数据
const loading = ref(false)
const businessLines = ref([])
const selectedBusinessLines = ref([])

// 查询表单
const queryForm = reactive({
  page: 1,
  pageSize: 20,
  search: '',
  status: undefined
})

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0
})

// 统计数据
const statistics = ref({
  total: 0,
  active: 0,
  totalDepartments: 0,
  totalEmployees: 0
})

// 对话框状态
const detailVisible = ref(false)
const formVisible = ref(false)
const weightConfigVisible = ref(false)
const isEdit = ref(false)
const currentBusinessLine = ref(null)

// 计算属性
const formatPercent = (value: number) => {
  return `${(value * 100).toFixed(1)}%`
}

const formatCurrency = (value: number) => {
  return `¥${value.toLocaleString()}`
}

// 获取业务线列表
const getBusinessLineList = async () => {
  loading.value = true
  try {
    const response = await businessLineApi.getBusinessLines({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: queryForm.search || undefined,
      status: queryForm.status
    })
    
    businessLines.value = response.data.businessLines
    pagination.total = response.data.pagination.total
    
    // 更新统计数据
    updateStatistics()
  } catch (error) {
    if (shouldShowError(error)) {
      ElMessage.error('获取业务线列表失败')
    }
  } finally {
    loading.value = false
  }
}

// 更新统计数据
const updateStatistics = () => {
  statistics.value.total = businessLines.value.length
  statistics.value.active = businessLines.value.filter(item => item.status === 1).length
  statistics.value.totalDepartments = businessLines.value.reduce((sum, item) => sum + (item.departmentCount || 0), 0)
  statistics.value.totalEmployees = businessLines.value.reduce((sum, item) => sum + (item.employeeCount || 0), 0)
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  getBusinessLineList()
}

// 重置搜索
const handleReset = () => {
  queryForm.search = ''
  queryForm.status = undefined
  handleSearch()
}

// 选择变更
const handleSelectionChange = (selection: BusinessLine[]) => {
  selectedBusinessLines.value = selection
}

// 显示创建对话框
const showCreateDialog = () => {
  currentBusinessLine.value = null
  isEdit.value = false
  formVisible.value = true
}

// 显示编辑对话框
const showEditDialog = (row: BusinessLine) => {
  currentBusinessLine.value = row
  isEdit.value = true
  formVisible.value = true
}

// 显示详情对话框
const showDetailDialog = (row: BusinessLine) => {
  currentBusinessLine.value = row
  detailVisible.value = true
}

// 显示权重配置对话框
const showWeightDialog = (row: BusinessLine) => {
  currentBusinessLine.value = row
  weightConfigVisible.value = true
}

// 处理命令
const handleCommand = async (command: string) => {
  const [action, id] = command.split('_')
  const businessLineId = id
  
  if (action === 'enable' || action === 'disable') {
    await handleToggleStatus(businessLineId, action === 'enable')
  } else if (action === 'delete') {
    await handleDelete(businessLineId)
  }
}

// 切换状态
const handleToggleStatus = async (id: string, enable: boolean) => {
  try {
    await businessLineApi.updateBusinessLine(id, { status: enable ? 1 : 0 })
    ElMessage.success(`${enable ? '启用' : '禁用'}成功`)
    getBusinessLineList()
  } catch (error) {
    if (shouldShowError(error)) {
      ElMessage.error(`${enable ? '启用' : '禁用'}失败`)
    }
  }
}

// 删除业务线
const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个业务线吗？删除后不可恢复。',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await businessLineApi.deleteBusinessLine(id)
    ElMessage.success('删除成功')
    getBusinessLineList()
  } catch (error) {
    if (error !== 'cancel' && shouldShowError(error)) {
      ElMessage.error('删除失败')
    }
  }
}

// 批量启用
const handleBatchEnable = async () => {
  try {
    const ids = selectedBusinessLines.value.map(item => item.id)
    await businessLineApi.batchBusinessLines('enable', ids)
    ElMessage.success('批量启用成功')
    getBusinessLineList()
    selectedBusinessLines.value = []
  } catch (error) {
    if (shouldShowError(error)) {
      ElMessage.error('批量启用失败')
    }
  }
}

// 批量禁用
const handleBatchDisable = async () => {
  try {
    const ids = selectedBusinessLines.value.map(item => item.id)
    await businessLineApi.batchBusinessLines('disable', ids)
    ElMessage.success('批量禁用成功')
    getBusinessLineList()
    selectedBusinessLines.value = []
  } catch (error) {
    if (shouldShowError(error)) {
      ElMessage.error('批量禁用失败')
    }
  }
}

// 导出数据
const handleExport = async () => {
  try {
    // TODO: 实现导出功能
    ElMessage.info('导出功能开发中...')
  } catch (error) {
    if (shouldShowError(error)) {
      ElMessage.error('导出失败')
    }
  }
}

// 表单成功回调
const handleFormSuccess = () => {
  getBusinessLineList()
}

// 权重配置成功回调
const handleWeightSuccess = () => {
  getBusinessLineList()
}

// 初始化
onMounted(() => {
  console.log('=== BUSINESS LINE MANAGEMENT onMounted ===')
  getBusinessLineList()
})
</script>

<style lang="scss" scoped>
.business-line-management {
  padding: 20px;
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h2 {
      margin: 0;
      color: #303133;
    }
    
    .header-actions {
      display: flex;
      gap: 12px;
    }
  }
  
  .search-section {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .stats-section {
    margin-bottom: 20px;
    
    .stat-card {
      text-align: center;
      
      .stat-item {
        .stat-value {
          font-size: 28px;
          font-weight: bold;
          color: #409eff;
          margin-bottom: 8px;
        }
        
        .stat-label {
          font-size: 14px;
          color: #909399;
        }
      }
    }
  }
  
  .table-section {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    
    .business-line-name {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .name {
        font-weight: 500;
      }
    }
    
    .text-muted {
      color: #909399;
    }
    
    .pagination-wrapper {
      padding: 20px;
      display: flex;
      justify-content: center;
    }
  }
  
  .batch-actions {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #fff;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 16px;
    z-index: 1000;
    
    .batch-buttons {
      display: flex;
      gap: 8px;
    }
  }
}

:deep(.danger-item) {
  color: #f56c6c !important;
}
</style>