<template>
  <div class="report-management">
    <div class="page-header">
      <h2>报表管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateReportDialog">
          <el-icon><Plus /></el-icon>
          创建报表
        </el-button>
        <el-button @click="refreshData" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 报表分类导航 -->
    <el-card class="category-nav">
      <el-tabs v-model="activeCategory" @tab-change="handleCategoryChange">
        <el-tab-pane label="全部报表" name="all">
          <el-icon><Document /></el-icon>
        </el-tab-pane>
        <el-tab-pane label="奖金报表" name="bonus">
          <el-icon><Money /></el-icon>
        </el-tab-pane>
        <el-tab-pane label="统计报表" name="statistics">
          <el-icon><DataAnalysis /></el-icon>
        </el-tab-pane>
        <el-tab-pane label="自定义报表" name="custom">
          <el-icon><Setting /></el-icon>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 快速报表模板 -->
    <el-card class="quick-templates" header="快速报表">
      <el-row :gutter="20">
        <el-col :span="6" v-for="template in quickTemplates" :key="template.id">
          <div class="template-card" @click="generateQuickReport(template)">
            <div class="template-icon" :class="template.type">
              <el-icon>
                <component :is="template.icon" />
              </el-icon>
            </div>
            <div class="template-info">
              <div class="template-name">{{ template.name }}</div>
              <div class="template-desc">{{ template.description }}</div>
            </div>
            <div class="template-action">
              <el-button type="primary" size="small">生成</el-button>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 报表列表 -->
    <el-card class="report-list" header="报表列表">
      <div class="list-controls">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-input
              v-model="searchText"
              placeholder="搜索报表名称或描述"
              prefix-icon="Search"
              clearable
              @input="handleSearch"
            />
          </el-col>
          <el-col :span="4">
            <el-select v-model="filterStatus" placeholder="状态筛选" clearable @change="refreshData">
              <el-option label="全部" value="" />
              <el-option label="生成中" value="generating" />
              <el-option label="已完成" value="completed" />
              <el-option label="已失败" value="failed" />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-select v-model="sortBy" placeholder="排序方式" @change="refreshData">
              <el-option label="创建时间" value="createdAt" />
              <el-option label="更新时间" value="updatedAt" />
              <el-option label="报表名称" value="name" />
            </el-select>
          </el-col>
        </el-row>
      </div>

      <el-table :data="reports" stripe v-loading="loading">
        <el-table-column prop="name" label="报表名称" min-width="200">
          <template #default="{ row }">
            <div class="report-name">
              <el-icon class="report-icon" :class="row.category">
                <component :is="getReportIcon(row.category)" />
              </el-icon>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="category" label="分类" width="100">
          <template #default="{ row }">
            <el-tag :type="getCategoryTagType(row.category)">
              {{ getCategoryName(row.category) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="size" label="文件大小" width="100">
          <template #default="{ row }">
            <span v-if="row.size">{{ formatFileSize(row.size) }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="createdBy" label="创建人" width="100" />
        
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'completed'"
              type="primary"
              size="small"
              @click="downloadReport(row)"
            >
              <el-icon><Download /></el-icon>
              下载
            </el-button>
            
            <el-button
              v-if="row.status === 'completed'"
              size="small"
              @click="previewReport(row)"
            >
              <el-icon><View /></el-icon>
              预览
            </el-button>
            
            <el-button
              v-if="row.status === 'failed'"
              type="warning"
              size="small"
              @click="regenerateReport(row)"
            >
              <el-icon><RefreshRight /></el-icon>
              重试
            </el-button>
            
            <el-popconfirm
              title="确定删除这个报表吗？"
              @confirm="deleteReport(row)"
            >
              <template #reference>
                <el-button type="danger" size="small">
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

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

    <!-- 创建报表对话框 -->
    <el-dialog
      v-model="createReportVisible"
      title="创建自定义报表"
      width="800px"
      :close-on-click-modal="false"
    >
      <el-form :model="reportForm" :rules="reportRules" ref="reportFormRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="报表名称" prop="name">
              <el-input v-model="reportForm.name" placeholder="请输入报表名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="报表分类" prop="category">
              <el-select v-model="reportForm.category" placeholder="请选择分类">
                <el-option label="奖金报表" value="bonus" />
                <el-option label="统计报表" value="statistics" />
                <el-option label="自定义报表" value="custom" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="报表描述">
          <el-input
            v-model="reportForm.description"
            type="textarea"
            rows="3"
            placeholder="请输入报表描述"
          />
        </el-form-item>
        
        <el-form-item label="数据范围" prop="dateRange">
          <el-date-picker
            v-model="reportForm.dateRange"
            type="monthrange"
            range-separator="至"
            start-placeholder="开始月份"
            end-placeholder="结束月份"
            format="YYYY年MM月"
            value-format="YYYY-MM"
          />
        </el-form-item>
        
        <el-form-item label="包含字段" prop="fields">
          <el-checkbox-group v-model="reportForm.fields">
            <el-row :gutter="10">
              <el-col :span="8" v-for="field in availableFields" :key="field.value">
                <el-checkbox :label="field.value">{{ field.label }}</el-checkbox>
              </el-col>
            </el-row>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item label="筛选条件">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-select v-model="reportForm.filters.department" placeholder="部门筛选" multiple clearable>
                <el-option label="实施部" value="1" />
                <el-option label="售前部" value="2" />
                <el-option label="研发部" value="3" />
                <el-option label="市场部" value="4" />
              </el-select>
            </el-col>
            <el-col :span="8">
              <el-select v-model="reportForm.filters.businessLine" placeholder="业务线筛选" multiple clearable>
                <el-option label="实施" value="1" />
                <el-option label="售前" value="2" />
                <el-option label="市场" value="3" />
                <el-option label="运营" value="4" />
              </el-select>
            </el-col>
            <el-col :span="8">
              <el-input-number
                v-model="reportForm.filters.minBonus"
                placeholder="最低奖金"
                :min="0"
                style="width: 100%"
              />
            </el-col>
          </el-row>
        </el-form-item>
        
        <el-form-item label="输出格式" prop="format">
          <el-radio-group v-model="reportForm.format">
            <el-radio label="excel">Excel表格</el-radio>
            <el-radio label="pdf">PDF文档</el-radio>
            <el-radio label="csv">CSV文件</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="createReportVisible = false">取消</el-button>
        <el-button type="primary" @click="createReport" :loading="creating">
          创建报表
        </el-button>
      </template>
    </el-dialog>

    <!-- 报表预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      :title="previewReportData ? `预览: ${previewReportData.name}` : '报表预览'"
      width="90%"
      :close-on-click-modal="false"
    >
      <div v-if="previewData" class="report-preview">
        <div class="preview-header">
          <h3>{{ previewReportData?.name }}</h3>
          <div class="preview-meta">
            <span>生成时间: {{ formatDate(previewReportData?.createdAt) }}</span>
            <span>文件大小: {{ formatFileSize(previewReportData?.size) }}</span>
          </div>
        </div>
        
        <el-table :data="previewData" stripe max-height="500">
          <el-table-column
            v-for="column in previewColumns"
            :key="column.prop"
            :prop="column.prop"
            :label="column.label"
            :width="column.width"
          />
        </el-table>
        
        <div class="preview-footer">
          <span>共 {{ previewData.length }} 条记录</span>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
        <el-button type="primary" @click="downloadReport(previewReportData)">
          <el-icon><Download /></el-icon>
          下载报表
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, markRaw } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Refresh, Document, Money, DataAnalysis, Setting,
  Download, View, RefreshRight, Delete, Search
} from '@element-plus/icons-vue'
import {
  getReports, createReport as createReportApi, deleteReport as deleteReportApi,
  downloadReport as downloadReportApi, previewReport as previewReportApi,
  regenerateReport as regenerateReportApi, getReportTemplates,
  createReportFromTemplate
} from '@/api/reports'

// 响应式数据
const loading = ref(false)
const creating = ref(false)
const activeCategory = ref('all')
const searchText = ref('')
const filterStatus = ref('')
const sortBy = ref('createdAt')
const createReportVisible = ref(false)
const previewVisible = ref(false)
const previewReportData = ref(null)
const previewData = ref([])
const previewColumns = ref([])

// 分页数据
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 快速模板映射图标
const getTemplateIcon = (type) => {
  const icons = {
    'bonus': markRaw(Money),
    'detail': markRaw(Document),
    'analysis': markRaw(DataAnalysis),
    'statistics': markRaw(Setting)
  }
  return icons[type] || markRaw(Document)
}

// 快速模板计算属性
const quickTemplates = computed(() => {
  return reportTemplates.value.map(template => ({
    ...template,
    icon: getTemplateIcon(template.type)
  }))
})

// 报表列表数据
const reports = ref([])
const reportTemplates = ref([])

// 表单数据
const reportForm = reactive({
  name: '',
  category: '',
  description: '',
  dateRange: [],
  fields: [],
  filters: {
    department: [],
    businessLine: [],
    minBonus: null
  },
  format: 'excel'
})

const reportRules = {
  name: [{ required: true, message: '请输入报表名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择报表分类', trigger: 'change' }],
  dateRange: [{ required: true, message: '请选择数据范围', trigger: 'change' }],
  fields: [{ required: true, message: '请选择包含字段', trigger: 'change' }],
  format: [{ required: true, message: '请选择输出格式', trigger: 'change' }]
}

const availableFields = [
  { label: '员工姓名', value: 'employeeName' },
  { label: '员工工号', value: 'employeeId' },
  { label: '部门', value: 'department' },
  { label: '岗位', value: 'position' },
  { label: '总奖金', value: 'totalBonus' },
  { label: '基础奖金', value: 'baseBonus' },
  { label: '绩效奖金', value: 'performanceBonus' },
  { label: '利润贡献度', value: 'profitScore' },
  { label: '岗位价值', value: 'positionScore' },
  { label: '绩效表现', value: 'performanceScore' }
]

// 计算属性

// 工具函数
const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

const getCategoryName = (category: string) => {
  const names = {
    bonus: '奖金',
    statistics: '统计',
    custom: '自定义'
  }
  return names[category] || category
}

const getCategoryTagType = (category: string) => {
  const types = {
    bonus: 'success',
    statistics: 'info',
    custom: 'warning'
  }
  return types[category] || ''
}

const getStatusName = (status: string) => {
  const names = {
    generating: '生成中',
    completed: '已完成',
    failed: '已失败'
  }
  return names[status] || status
}

const getStatusTagType = (status: string) => {
  const types = {
    generating: 'warning',
    completed: 'success',
    failed: 'danger'
  }
  return types[status] || ''
}

const getReportIcon = (category: string) => {
  const icons = {
    bonus: markRaw(Money),
    statistics: markRaw(DataAnalysis),
    custom: markRaw(Setting)
  }
  return icons[category] || markRaw(Document)
}

// 事件处理
const refreshData = async () => {
  loading.value = true
  try {
    // 加载报表列表
    const reportsRes = await getReports({
      page: pagination.page,
      pageSize: pagination.pageSize,
      category: activeCategory.value === 'all' ? undefined : activeCategory.value,
      status: filterStatus.value || undefined,
      search: searchText.value || undefined
    })
    
    if (reportsRes.data && reportsRes.data.reports) {
      reports.value = reportsRes.data.reports
      pagination.total = reportsRes.data.pagination.total
    }
    
    // 加载报表模板
    const templatesRes = await getReportTemplates()
    if (templatesRes.data) {
      reportTemplates.value = templatesRes.data
    }
    
    ElMessage.success('数据刷新成功')
  } catch (error) {
    console.error('刷新数据失败:', error)
    ElMessage.error('刷新失败: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

const handleCategoryChange = (category: string) => {
  pagination.page = 1
  refreshData()
}

const handleSearch = () => {
  pagination.page = 1
  refreshData()
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  refreshData()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  refreshData()
}

const generateQuickReport = async (template: any) => {
  try {
    ElMessage.info(`正在生成${template.name}...`)
    
    // 使用模板创建报表
    await createReportFromTemplate(template.id, {
      dateRange: [new Date().toISOString().slice(0, 7), new Date().toISOString().slice(0, 7)],
      filters: template.defaultFilters || {}
    })
    
    ElMessage.success('报表生成成功')
    refreshData()
  } catch (error) {
    console.error('报表生成失败:', error)
    ElMessage.error('报表生成失败: ' + (error.response?.data?.message || error.message))
  }
}

const showCreateReportDialog = () => {
  createReportVisible.value = true
}

const createReport = async () => {
  creating.value = true
  try {
    await createReportApi({
      name: reportForm.name,
      category: reportForm.category,
      description: reportForm.description,
      dateRange: reportForm.dateRange,
      fields: reportForm.fields,
      filters: reportForm.filters,
      format: reportForm.format
    })
    
    ElMessage.success('报表创建成功')
    createReportVisible.value = false
    refreshData()
  } catch (error) {
    console.error('报表创建失败:', error)
    ElMessage.error('报表创建失败: ' + (error.response?.data?.message || error.message))
  } finally {
    creating.value = false
  }
}

const downloadReport = async (report: any) => {
  try {
    ElMessage.info('正在下载报表...')
    
    const response = await downloadReportApi(report.id)
    
    // 创建下载链接
    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${report.name}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    ElMessage.error('下载失败: ' + (error.response?.data?.message || error.message))
  }
}

const previewReport = async (report: any) => {
  try {
    previewReportData.value = report
    
    // 加载预览数据
    const response = await previewReportApi(report.id)
    
    if (response.data) {
      previewData.value = response.data.preview || []
      previewColumns.value = response.data.columns || []
    }
    
    previewVisible.value = true
  } catch (error) {
    console.error('预览失败:', error)
    ElMessage.error('预览失败: ' + (error.response?.data?.message || error.message))
  }
}

const regenerateReport = async (report: any) => {
  try {
    await ElMessageBox.confirm('确定重新生成这个报表吗？', '确认操作')
    ElMessage.info('正在重新生成报表...')
    
    await regenerateReportApi(report.id)
    
    ElMessage.success('报表重新生成成功')
    refreshData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('重新生成失败:', error)
      ElMessage.error('重新生成失败: ' + (error.response?.data?.message || error.message))
    }
  }
}

const deleteReport = async (report: any) => {
  try {
    await deleteReportApi(report.id)
    ElMessage.success('报表删除成功')
    refreshData()
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error('删除失败: ' + (error.response?.data?.message || error.message))
  }
}

// 页面加载
onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.report-management {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: white;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.category-nav,
.quick-templates,
.report-list {
  margin-bottom: 20px;
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.template-card {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
}

.template-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

.template-icon {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 24px;
  color: white;
}

.template-icon.bonus {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.template-icon.detail {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.template-icon.analysis {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.template-icon.statistics {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.template-info {
  flex: 1;
}

.template-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.template-desc {
  font-size: 12px;
  color: #909399;
}

.template-action {
  margin-left: 12px;
}

.list-controls {
  margin-bottom: 20px;
}

.report-name {
  display: flex;
  align-items: center;
}

.report-icon {
  margin-right: 8px;
  font-size: 16px;
}

.report-icon.bonus {
  color: #67c23a;
}

.report-icon.statistics {
  color: #409eff;
}

.report-icon.custom {
  color: #e6a23c;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.report-preview {
  max-height: 600px;
  overflow-y: auto;
}

.preview-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.preview-header h3 {
  margin: 0 0 8px 0;
  color: #303133;
}

.preview-meta {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #909399;
}

.preview-footer {
  margin-top: 16px;
  text-align: right;
  font-size: 14px;
  color: #909399;
}
</style>