<template>
  <el-dialog
    v-model="visible"
    title="岗位详情"
    width="700px"
    :before-close="handleClose"
  >
    <div v-if="position" class="position-detail">
      <!-- 基本信息 -->
      <el-card class="info-card">
        <template #header>
          <span>基本信息</span>
        </template>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>岗位名称：</label>
              <span>{{ position.name }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>岗位代码：</label>
              <span>{{ position.code }}</span>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>职级：</label>
              <el-tag :type="getLevelTagType(position.level)">
                {{ position.level }}
              </el-tag>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>基准值：</label>
              <span class="benchmark-value">{{ position.benchmarkValue }}</span>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>员工数量：</label>
              <span>{{ position.employeeCount || 0 }}人</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>状态：</label>
              <el-tag :type="position.status === 1 ? 'success' : 'danger'">
                {{ position.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20" v-if="position.description">
          <el-col :span="24">
            <div class="detail-item">
              <label>岗位描述：</label>
              <div class="description">{{ position.description }}</div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 职责要求 -->
      <el-card class="info-card">
        <template #header>
          <span>职责与要求</span>
        </template>

        <div v-if="position.responsibilities?.length > 0" class="responsibilities">
          <label>岗位职责：</label>
          <ul class="responsibility-list">
            <li v-for="(item, index) in position.responsibilities" :key="index">
              {{ item }}
            </li>
          </ul>
        </div>

        <div v-if="position.requirements?.length > 0" class="requirements">
          <label>任职要求：</label>
          <ul class="requirement-list">
            <li v-for="(item, index) in position.requirements" :key="index">
              {{ item }}
            </li>
          </ul>
        </div>

        <div v-if="(!position.responsibilities?.length && !position.requirements?.length)" class="no-data">
          暂无职责和要求信息
        </div>
      </el-card>

      <!-- 员工分布 -->
      <el-card class="info-card" v-if="employeeStats">
        <template #header>
          <span>员工分布</span>
        </template>

        <el-row :gutter="20">
          <el-col :span="8">
            <div class="stat-item">
              <div class="stat-number">{{ employeeStats.total }}</div>
              <div class="stat-label">总员工数</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-item">
              <div class="stat-number">{{ employeeStats.active }}</div>
              <div class="stat-label">在职员工</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-item">
              <div class="stat-number">{{ employeeStats.resigned }}</div>
              <div class="stat-label">离职员工</div>
            </div>
          </el-col>
        </el-row>

        <div v-if="employeeStats.byDepartment?.length > 0" class="department-stats">
          <label>部门分布：</label>
          <div class="department-list">
            <div
              v-for="dept in employeeStats.byDepartment"
              :key="dept.departmentId"
              class="department-item"
            >
              <span class="department-name">{{ dept.Department?.name }}</span>
              <span class="department-count">{{ dept.count }}人</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 基准值分析 -->
      <el-card class="info-card">
        <template #header>
          <span>基准值分析</span>
        </template>

        <div class="benchmark-analysis">
          <div class="benchmark-chart">
            <div class="chart-item">
              <div class="chart-label">当前基准值</div>
              <div class="chart-value current">{{ position.benchmarkValue }}</div>
            </div>
            <div class="chart-item">
              <div class="chart-label">同级别平均值</div>
              <div class="chart-value average">{{ levelAverage.toFixed(2) }}</div>
            </div>
            <div class="chart-item">
              <div class="chart-label">相对水平</div>
              <div class="chart-value" :class="getRelativeLevel()">
                {{ getRelativeLevelText() }}
              </div>
            </div>
          </div>
          
          <div class="benchmark-suggestion">
            <el-alert
              :title="getBenchmarkSuggestion()"
              :type="getSuggestionType()"
              :closable="false"
              show-icon
            />
          </div>
        </div>
      </el-card>

      <!-- 系统信息 -->
      <el-card class="info-card">
        <template #header>
          <span>系统信息</span>
        </template>

        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>创建时间：</label>
              <span>{{ formatDateTime(position.createdAt) }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>更新时间：</label>
              <span>{{ formatDateTime(position.updatedAt) }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
      <el-button type="primary" @click="handleEdit">编辑</el-button>
      <el-button type="success" @click="viewEmployees">查看员工</el-button>
      <el-button type="warning" @click="adjustBenchmark">调整基准值</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Position } from '@/api/position'

interface Props {
  visible: boolean
  position: Position | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'edit', position: Position): void
  (e: 'view-employees', position: Position): void
  (e: 'adjust-benchmark', position: Position): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const employeeStats = ref(null)
const levelAverage = ref(0)

const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 监听对话框显示状态
watch(() => props.visible, (val) => {
  if (val && props.position) {
    loadPositionDetails()
  }
})

// 加载岗位详细信息
const loadPositionDetails = async () => {
  if (!props.position) return

  try {
    // 这里可以调用API获取更详细的信息
    // 暂时模拟数据
    employeeStats.value = {
      total: props.position.employeeCount || 0,
      active: props.position.employeeCount || 0,
      resigned: 0,
      byDepartment: []
    }
    
    // 模拟同级别平均基准值
    levelAverage.value = 3.5
  } catch (error) {
    console.error('获取岗位详细信息失败:', error)
  }
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

// 获取相对水平
const getRelativeLevel = () => {
  if (!props.position) return 'normal'
  const diff = props.position.benchmarkValue - levelAverage.value
  if (diff > 0.5) return 'high'
  if (diff < -0.5) return 'low'
  return 'normal'
}

// 获取相对水平文本
const getRelativeLevelText = () => {
  const level = getRelativeLevel()
  switch (level) {
    case 'high': return '偏高'
    case 'low': return '偏低'
    default: return '正常'
  }
}

// 获取基准值建议
const getBenchmarkSuggestion = () => {
  const level = getRelativeLevel()
  switch (level) {
    case 'high':
      return '基准值偏高，建议结合岗位实际价值和市场水平进行调整'
    case 'low':
      return '基准值偏低，可能影响人才吸引力，建议适当提升'
    default:
      return '基准值设置合理，与同级别岗位保持良好水平'
  }
}

// 获取建议类型
const getSuggestionType = () => {
  const level = getRelativeLevel()
  switch (level) {
    case 'high': return 'warning'
    case 'low': return 'error'
    default: return 'success'
  }
}

// 关闭对话框
const handleClose = () => {
  visible.value = false
}

// 编辑岗位
const handleEdit = () => {
  if (props.position) {
    emit('edit', props.position)
    handleClose()
  }
}

// 查看员工
const viewEmployees = () => {
  if (props.position) {
    emit('view-employees', props.position)
    handleClose()
  }
}

// 调整基准值
const adjustBenchmark = () => {
  if (props.position) {
    emit('adjust-benchmark', props.position)
    handleClose()
  }
}

// 格式化日期时间
const formatDateTime = (dateTime: string) => {
  if (!dateTime) return '-'
  const date = new Date(dateTime)
  return date.toLocaleString('zh-CN')
}
</script>

<style scoped>
.position-detail {
  max-height: 600px;
  overflow-y: auto;
}

.info-card {
  margin-bottom: 20px;
}

.info-card:last-child {
  margin-bottom: 0;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
  line-height: 1.5;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-item label {
  flex-shrink: 0;
  width: 100px;
  font-weight: 500;
  color: #606266;
}

.detail-item span,
.detail-item .el-tag {
  color: #303133;
}

.benchmark-value {
  font-weight: 600;
  color: #409eff;
  font-size: 16px;
}

.description {
  color: #303133;
  white-space: pre-wrap;
  line-height: 1.6;
}

.responsibilities,
.requirements {
  margin-bottom: 20px;
}

.responsibilities:last-child,
.requirements:last-child {
  margin-bottom: 0;
}

.responsibilities label,
.requirements label {
  display: block;
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
}

.responsibility-list,
.requirement-list {
  margin: 0;
  padding-left: 20px;
  color: #303133;
}

.responsibility-list li,
.requirement-list li {
  margin-bottom: 8px;
  line-height: 1.6;
}

.responsibility-list li:last-child,
.requirement-list li:last-child {
  margin-bottom: 0;
}

.no-data {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.department-stats {
  margin-top: 20px;
}

.department-stats label {
  display: block;
  font-weight: 500;
  color: #606266;
  margin-bottom: 12px;
}

.department-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.department-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.department-name {
  color: #303133;
  font-weight: 500;
}

.department-count {
  color: #409eff;
  font-weight: 600;
}

.benchmark-analysis {
  padding: 0;
}

.benchmark-chart {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.chart-item {
  text-align: center;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.chart-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
}

.chart-value {
  font-size: 24px;
  font-weight: 700;
}

.chart-value.current {
  color: #409eff;
}

.chart-value.average {
  color: #67c23a;
}

.chart-value.high {
  color: #e6a23c;
}

.chart-value.low {
  color: #f56c6c;
}

.chart-value.normal {
  color: #67c23a;
}

.benchmark-suggestion {
  margin-top: 20px;
}

:deep(.el-card__header) {
  padding: 12px 20px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-alert) {
  margin: 0;
}
</style>