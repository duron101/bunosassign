<template>
  <el-dialog
    v-model="dialogVisible"
    title="项目详情"
    width="800px"
    :before-close="handleClose"
  >
    <div v-loading="loading" class="project-detail">
      <el-row :gutter="20" v-if="project">
        <!-- 基本信息 -->
        <el-col :span="24">
          <el-card class="detail-card">
            <template #header>
              <div class="card-header">
                <span>基本信息</span>
                <div class="project-status">
                  <el-tag :type="PROJECT_STATUS_COLORS[project.status]" size="large">
                    {{ PROJECT_STATUS_LABELS[project.status] }}
                  </el-tag>
                  <el-tag :type="PROJECT_PRIORITY_COLORS[project.priority]" class="ml-2">
                    {{ PROJECT_PRIORITY_LABELS[project.priority] }}优先级
                  </el-tag>
                </div>
              </div>
            </template>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="detail-item">
                  <label>项目名称：</label>
                  <span>{{ project.name }}</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="detail-item">
                  <label>项目代码：</label>
                  <span>{{ project.code }}</span>
                </div>
              </el-col>
            </el-row>

            <div class="detail-item">
              <label>项目描述：</label>
              <span>{{ project.description || '暂无描述' }}</span>
            </div>

            <el-row :gutter="20">
              <el-col :span="12">
                <div class="detail-item">
                  <label>项目经理：</label>
                  <span v-if="project.Manager">
                    {{ project.Manager.name }} ({{ project.Manager.employeeNo }})
                  </span>
                  <span v-else class="text-muted">未指定</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="detail-item">
                  <label>创建时间：</label>
                  <span>{{ formatDateTime(project.createdAt) }}</span>
                </div>
              </el-col>
            </el-row>
          </el-card>
        </el-col>

        <!-- 时间和预算信息 -->
        <el-col :span="24">
          <el-card class="detail-card">
            <template #header>
              <span>时间和预算</span>
            </template>
            
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="detail-item">
                  <label>开始日期：</label>
                  <span v-if="project.startDate">{{ formatDate(project.startDate) }}</span>
                  <span v-else class="text-muted">未设置</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="detail-item">
                  <label>结束日期：</label>
                  <span v-if="project.endDate">{{ formatDate(project.endDate) }}</span>
                  <span v-else class="text-muted">未设置</span>
                </div>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <div class="detail-item">
                  <label>项目预算：</label>
                  <span v-if="project.budget">{{ formatCurrency(project.budget) }}</span>
                  <span v-else class="text-muted">未设置</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="detail-item">
                  <label>利润目标：</label>
                  <span v-if="project.profitTarget">{{ formatCurrency(project.profitTarget) }}</span>
                  <span v-else class="text-muted">未设置</span>
                </div>
              </el-col>
            </el-row>

            <!-- 项目时间线 -->
            <div v-if="project.startDate && project.endDate" class="project-timeline">
              <label>项目时间线：</label>
              <div class="timeline-info">
                <span>{{ getProjectDuration() }} 天</span>
                <span class="ml-2">进度: {{ getProjectProgress() }}%</span>
              </div>
              <el-progress :percentage="getProjectProgress()" class="mt-2" />
            </div>
          </el-card>
        </el-col>

        <!-- 权重配置信息 -->
        <el-col :span="24">
          <el-card class="detail-card">
            <template #header>
              <div class="card-header">
                <span>权重配置</span>
                <el-button size="small" @click="showWeightDialog" :disabled="!project">
                  <el-icon><Setting /></el-icon>
                  配置权重
                </el-button>
              </div>
            </template>
            
            <div v-if="weightConfig.length > 0" class="weight-config">
              <el-row :gutter="10" class="weight-header">
                <el-col :span="8">业务线</el-col>
                <el-col :span="4">默认权重</el-col>
                <el-col :span="4">项目权重</el-col>
                <el-col :span="4">生效权重</el-col>
                <el-col :span="4">状态</el-col>
              </el-row>
              <el-row 
                v-for="config in weightConfig" 
                :key="config.businessLineId" 
                :gutter="10" 
                class="weight-row"
              >
                <el-col :span="8">
                  <span>{{ config.businessLineName }}</span>
                  <span class="text-muted">({{ config.businessLineCode }})</span>
                </el-col>
                <el-col :span="4">{{ formatPercent(config.defaultWeight) }}</el-col>
                <el-col :span="4">
                  <span v-if="config.isCustom">{{ formatPercent(config.customWeight!) }}</span>
                  <span v-else class="text-muted">-</span>
                </el-col>
                <el-col :span="4">{{ formatPercent(config.effectiveWeight) }}</el-col>
                <el-col :span="4">
                  <el-tag 
                    :type="config.isCustom ? 'warning' : 'info'" 
                    size="small"
                  >
                    {{ config.isCustom ? '自定义' : '默认' }}
                  </el-tag>
                </el-col>
              </el-row>
            </div>
            <div v-else class="text-muted text-center">
              暂无权重配置信息
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="handleEdit" v-if="project">
          <el-icon><Edit /></el-icon>
          编辑项目
        </el-button>
      </div>
    </template>

    <!-- 权重配置对话框 -->
    <ProjectWeightDialog
      v-model="weightDialogVisible"
      :project="project"
      @success="loadProjectWeights"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Edit, Setting } from '@element-plus/icons-vue'
import { projectApi } from '@/api/project'
import ProjectWeightDialog from './ProjectWeightDialog.vue'
import type { Project, WeightConfig } from '@/types/project'
import { 
  PROJECT_STATUS_LABELS, 
  PROJECT_STATUS_COLORS,
  PROJECT_PRIORITY_LABELS,
  PROJECT_PRIORITY_COLORS 
} from '@/types/project'

// Props & Emits
interface Props {
  modelValue: boolean
  project?: Project | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'edit', project: Project): void
}

const props = withDefaults(defineProps<Props>(), {
  project: null
})

const emit = defineEmits<Emits>()

// Refs
const loading = ref(false)
const weightConfig = ref<WeightConfig[]>([])
const weightDialogVisible = ref(false)

// Computed
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

// 监听对话框显示
watch(dialogVisible, (visible) => {
  if (visible && props.project) {
    loadProjectWeights()
  }
})

// 加载项目权重配置
const loadProjectWeights = async () => {
  if (!props.project) return
  
  loading.value = true
  try {
    const response = await projectApi.getProjectWeights(props.project.id)
    weightConfig.value = response.data.weightConfig
  } catch (error) {
    console.error('加载权重配置失败:', error)
  } finally {
    loading.value = false
  }
}

// 格式化日期
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

// 格式化日期时间
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 格式化货币
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY'
  }).format(amount)
}

// 格式化百分比
const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`
}

// 计算项目持续时间
const getProjectDuration = (): number => {
  if (!props.project?.startDate || !props.project?.endDate) return 0
  
  const start = new Date(props.project.startDate)
  const end = new Date(props.project.endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// 计算项目进度
const getProjectProgress = (): number => {
  if (!props.project?.startDate || !props.project?.endDate) return 0
  
  const start = new Date(props.project.startDate)
  const end = new Date(props.project.endDate)
  const now = new Date()
  
  if (now < start) return 0
  if (now > end) return 100
  
  const totalTime = end.getTime() - start.getTime()
  const elapsedTime = now.getTime() - start.getTime()
  
  return Math.round((elapsedTime / totalTime) * 100)
}

// 显示权重配置对话框
const showWeightDialog = () => {
  weightDialogVisible.value = true
}

// 处理编辑
const handleEdit = () => {
  if (props.project) {
    emit('edit', props.project)
    handleClose()
  }
}

// 处理关闭
const handleClose = () => {
  dialogVisible.value = false
}
</script>

<style scoped>
.project-detail {
  max-height: 600px;
  overflow-y: auto;
}

.detail-card {
  margin-bottom: 20px;
}

.detail-card:last-child {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-status {
  display: flex;
  align-items: center;
}

.detail-item {
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
}

.detail-item label {
  font-weight: 500;
  min-width: 80px;
  color: #606266;
}

.detail-item span {
  color: #303133;
  word-break: break-all;
}

.text-muted {
  color: #909399;
}

.ml-2 {
  margin-left: 8px;
}

.mt-2 {
  margin-top: 8px;
}

.project-timeline {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.timeline-info {
  margin-top: 8px;
  color: #606266;
}

.weight-config {
  margin-top: 10px;
}

.weight-header {
  font-weight: 500;
  color: #606266;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 8px;
  margin-bottom: 8px;
}

.weight-row {
  padding: 8px 0;
  border-bottom: 1px solid #f5f7fa;
  align-items: center;
}

.weight-row:last-child {
  border-bottom: none;
}

.dialog-footer {
  text-align: right;
}

.text-center {
  text-align: center;
  padding: 20px;
}
</style>