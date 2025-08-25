<template>
  <el-dialog
    v-model="visible"
    :title="isBatch ? '批量调整基准值' : '调整基准值'"
    :width="isBatch ? '800px' : '600px'"
    :before-close="handleClose"
  >
    <div class="benchmark-adjust">
      <!-- 调整说明 -->
      <el-alert
        title="基准值调整说明"
        type="info"
        :closable="false"
        show-icon
      >
        <template #default>
          <ul class="notice-list">
            <li>基准值范围：0-10，影响奖金计算权重</li>
            <li>调整后将影响后续奖金计算，请谨慎操作</li>
            <li>建议结合岗位价值和市场水平进行调整</li>
          </ul>
        </template>
      </el-alert>

      <!-- 单个调整 -->
      <el-card v-if="!isBatch && positions.length === 1" class="adjust-card">
        <template #header>
          <span>{{ positions[0].name }} ({{ positions[0].code }})</span>
        </template>
        
        <div class="single-adjust">
          <div class="current-info">
            <div class="info-item">
              <label>当前基准值：</label>
              <span class="current-value">{{ positions[0].benchmarkValue }}</span>
            </div>
            <div class="info-item">
              <label>职级：</label>
              <el-tag :type="getLevelTagType(positions[0].level)">
                {{ positions[0].level }}
              </el-tag>
            </div>
          </div>
          
          <el-form :model="singleForm" :rules="singleRules" ref="singleFormRef">
            <el-form-item label="新基准值" prop="benchmarkValue">
              <el-input-number
                v-model="singleForm.benchmarkValue"
                :min="0"
                :max="10"
                :step="0.1"
                :precision="2"
                style="width: 200px"
              />
            </el-form-item>
            
            <el-form-item label="调整原因" prop="reason">
              <el-input
                v-model="singleForm.reason"
                type="textarea"
                :rows="3"
                placeholder="请说明调整原因"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
          </el-form>
        </div>
      </el-card>

      <!-- 批量调整 -->
      <div v-else class="batch-adjust">
        <!-- 调整方式选择 -->
        <el-card class="method-card">
          <template #header>
            <span>调整方式</span>
          </template>
          
          <el-radio-group v-model="adjustMethod" @change="handleMethodChange">
            <el-radio value="percentage">按百分比调整</el-radio>
            <el-radio value="fixed">按固定值调整</el-radio>
            <el-radio value="individual">逐一设置</el-radio>
          </el-radio-group>

          <div class="method-form">
            <div v-if="adjustMethod === 'percentage'" class="percentage-adjust">
              <el-form :model="batchForm" inline>
                <el-form-item label="调整百分比">
                  <el-input-number
                    v-model="batchForm.percentage"
                    :min="-50"
                    :max="100"
                    :step="1"
                    :precision="0"
                    style="width: 120px"
                  />
                  <span style="margin-left: 8px">%</span>
                </el-form-item>
                <el-form-item>
                  <el-button @click="applyPercentageAdjust">应用</el-button>
                </el-form-item>
              </el-form>
              <div class="method-tip">
                例如：输入10%，则所有基准值增加10%；输入-10%，则所有基准值减少10%
              </div>
            </div>

            <div v-if="adjustMethod === 'fixed'" class="fixed-adjust">
              <el-form :model="batchForm" inline>
                <el-form-item label="调整数值">
                  <el-input-number
                    v-model="batchForm.fixedValue"
                    :min="-10"
                    :max="10"
                    :step="0.1"
                    :precision="2"
                    style="width: 120px"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button @click="applyFixedAdjust">应用</el-button>
                </el-form-item>
              </el-form>
              <div class="method-tip">
                例如：输入0.5，则所有基准值增加0.5；输入-0.5，则所有基准值减少0.5
              </div>
            </div>
          </div>
        </el-card>

        <!-- 岗位列表 -->
        <el-card class="positions-card">
          <template #header>
            <span>岗位列表 ({{ adjustedPositions.length }}个)</span>
          </template>
          
          <el-table :data="adjustedPositions" stripe>
            <el-table-column prop="name" label="岗位名称" width="150" />
            <el-table-column prop="code" label="岗位代码" width="120" />
            <el-table-column prop="level" label="职级" width="100">
              <template #default="{ row }">
                <el-tag :type="getLevelTagType(row.level)" size="small">
                  {{ row.level }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="原基准值" width="100">
              <template #default="{ row }">
                <span class="original-value">{{ row.originalBenchmarkValue }}</span>
              </template>
            </el-table-column>
            <el-table-column label="新基准值" width="120">
              <template #default="{ row, $index }">
                <el-input-number
                  v-model="row.benchmarkValue"
                  :min="0"
                  :max="10"
                  :step="0.1"
                  :precision="2"
                  size="small"
                  style="width: 100px"
                />
              </template>
            </el-table-column>
            <el-table-column label="变化" width="100">
              <template #default="{ row }">
                <span 
                  :class="getChangeClass(row)"
                  class="change-value"
                >
                  {{ getChangeText(row) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="变化率" width="100">
              <template #default="{ row }">
                <span 
                  :class="getChangeClass(row)"
                  class="change-percentage"
                >
                  {{ getChangePercentage(row) }}
                </span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 批量原因 -->
        <el-card class="reason-card">
          <template #header>
            <span>调整原因</span>
          </template>
          
          <el-input
            v-model="batchForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请说明批量调整的原因"
            maxlength="500"
            show-word-limit
          />
        </el-card>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button @click="resetChanges">重置</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确认调整
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  updatePosition,
  batchUpdateBenchmarkValues,
  type Position
} from '@/api/position'

interface Props {
  visible: boolean
  positions: Position[]
  isBatch: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const singleFormRef = ref<FormInstance>()
const loading = ref(false)
const adjustMethod = ref('individual')

const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 单个调整表单
const singleForm = reactive({
  benchmarkValue: 0,
  reason: ''
})

// 单个调整验证规则
const singleRules: FormRules = {
  benchmarkValue: [
    { required: true, message: '请输入基准值', trigger: 'blur' },
    { type: 'number', min: 0, max: 10, message: '基准值范围为 0-10', trigger: 'blur' }
  ],
  reason: [
    { required: true, message: '请输入调整原因', trigger: 'blur' },
    { min: 5, max: 200, message: '调整原因长度为 5 到 200 个字符', trigger: 'blur' }
  ]
}

// 批量调整表单
const batchForm = reactive({
  percentage: 0,
  fixedValue: 0,
  reason: ''
})

// 调整后的岗位列表
const adjustedPositions = ref<(Position & { originalBenchmarkValue: number })[]>([])

// 监听对话框显示状态
watch(() => props.visible, (val) => {
  if (val) {
    initializeData()
  }
})

// 初始化数据
const initializeData = () => {
  if (!props.isBatch && props.positions.length === 1) {
    singleForm.benchmarkValue = props.positions[0].benchmarkValue
    singleForm.reason = ''
  } else {
    adjustedPositions.value = props.positions.map(pos => ({
      ...pos,
      originalBenchmarkValue: pos.benchmarkValue
    }))
    batchForm.percentage = 0
    batchForm.fixedValue = 0
    batchForm.reason = ''
    adjustMethod.value = 'individual'
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

// 处理调整方式变化
const handleMethodChange = () => {
  // 重置所有岗位的基准值为原始值
  adjustedPositions.value.forEach(pos => {
    pos.benchmarkValue = pos.originalBenchmarkValue
  })
}

// 应用百分比调整
const applyPercentageAdjust = () => {
  const percentage = batchForm.percentage / 100
  adjustedPositions.value.forEach(pos => {
    const newValue = pos.originalBenchmarkValue * (1 + percentage)
    pos.benchmarkValue = Math.max(0, Math.min(10, Math.round(newValue * 100) / 100))
  })
}

// 应用固定值调整
const applyFixedAdjust = () => {
  const fixedValue = batchForm.fixedValue
  adjustedPositions.value.forEach(pos => {
    const newValue = pos.originalBenchmarkValue + fixedValue
    pos.benchmarkValue = Math.max(0, Math.min(10, Math.round(newValue * 100) / 100))
  })
}

// 获取变化值
const getChangeText = (position: any) => {
  const change = position.benchmarkValue - position.originalBenchmarkValue
  if (change === 0) return '0'
  return change > 0 ? `+${change.toFixed(2)}` : change.toFixed(2)
}

// 获取变化率
const getChangePercentage = (position: any) => {
  const change = position.benchmarkValue - position.originalBenchmarkValue
  if (change === 0) return '0%'
  const percentage = (change / position.originalBenchmarkValue) * 100
  return percentage > 0 ? `+${percentage.toFixed(1)}%` : `${percentage.toFixed(1)}%`
}

// 获取变化样式类
const getChangeClass = (position: any) => {
  const change = position.benchmarkValue - position.originalBenchmarkValue
  if (change > 0) return 'positive-change'
  if (change < 0) return 'negative-change'
  return 'no-change'
}

// 重置变化
const resetChanges = () => {
  if (!props.isBatch) {
    singleForm.benchmarkValue = props.positions[0].benchmarkValue
  } else {
    adjustedPositions.value.forEach(pos => {
      pos.benchmarkValue = pos.originalBenchmarkValue
    })
    batchForm.percentage = 0
    batchForm.fixedValue = 0
  }
}

// 关闭对话框
const handleClose = () => {
  visible.value = false
}

// 提交调整
const handleSubmit = async () => {
  try {
    if (!props.isBatch) {
      // 单个调整
      if (!singleFormRef.value) return
      await singleFormRef.value.validate()
      
      // 检查是否有变化
      if (singleForm.benchmarkValue === props.positions[0].benchmarkValue) {
        ElMessage.warning('基准值没有变化')
        return
      }

      await ElMessageBox.confirm(
        `确定要将 ${props.positions[0].name} 的基准值从 ${props.positions[0].benchmarkValue} 调整为 ${singleForm.benchmarkValue} 吗？`,
        '确认调整',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      loading.value = true
      const positionId = props.positions[0]._id || props.positions[0].id
      if (!positionId) {
        ElMessage.error('岗位ID无效')
        return
      }
      await updatePosition(positionId, {
        benchmarkValue: singleForm.benchmarkValue
      })
      ElMessage.success('基准值调整成功')
    } else {
      // 批量调整
      if (!batchForm.reason.trim()) {
        ElMessage.error('请输入调整原因')
        return
      }

      // 检查是否有变化
      const hasChanges = adjustedPositions.value.some(pos => 
        pos.benchmarkValue !== pos.originalBenchmarkValue
      )
      
      if (!hasChanges) {
        ElMessage.warning('没有岗位基准值发生变化')
        return
      }

      const changedCount = adjustedPositions.value.filter(pos => 
        pos.benchmarkValue !== pos.originalBenchmarkValue
      ).length

      await ElMessageBox.confirm(
        `确定要调整 ${changedCount} 个岗位的基准值吗？`,
        '确认批量调整',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      loading.value = true
      const updateData = adjustedPositions.value
        .filter(pos => pos.benchmarkValue !== pos.originalBenchmarkValue)
        .filter(pos => {
          // 优先使用_id，如果没有则使用id
          const positionId = pos._id || pos.id
          return positionId !== null && positionId !== undefined && positionId !== '' && positionId !== 0
        })
        .map(pos => ({
          id: (pos._id || pos.id) as string | number,
          benchmarkValue: pos.benchmarkValue
        }))
        .filter(item => item.id !== undefined)

      if (updateData.length === 0) {
        ElMessage.warning('没有有效的岗位数据需要更新')
        return
      }

      console.log('🔍 准备发送的基准值更新数据:', updateData)
      console.log('🔍 数据类型检查:', updateData.map(item => ({
        id: item.id,
        idType: typeof item.id,
        benchmarkValue: item.benchmarkValue,
        benchmarkValueType: typeof item.benchmarkValue
      })))

      console.log('🔍 准备发送的基准值更新数据:', updateData)

      const response = await batchUpdateBenchmarkValues(updateData)
      console.log('🔍 基准值更新响应:', response)
      
      if (response.code === 200) {
        ElMessage.success(`成功调整 ${updateData.length} 个岗位的基准值`)
      } else {
        ElMessage.error(response.message || '调整失败')
        return
      }
    }

    emit('success')
    handleClose()
  } catch (error: any) {
    if (error !== 'cancel' && error !== false) {
      console.error('🔍 基准值调整错误详情:', error)
      if (error.response?.data?.message) {
        ElMessage.error(`调整失败: ${error.response.data.message}`)
      } else if (error.message) {
        ElMessage.error(`调整失败: ${error.message}`)
      } else {
        ElMessage.error('调整失败')
      }
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.benchmark-adjust {
  max-height: 600px;
  overflow-y: auto;
}

.adjust-card,
.method-card,
.positions-card,
.reason-card {
  margin-bottom: 20px;
}

.adjust-card:last-child,
.method-card:last-child,
.positions-card:last-child,
.reason-card:last-child {
  margin-bottom: 0;
}

.notice-list {
  margin: 0;
  padding-left: 20px;
  color: #409eff;
}

.notice-list li {
  margin-bottom: 4px;
  line-height: 1.5;
}

.notice-list li:last-child {
  margin-bottom: 0;
}

.single-adjust {
  padding: 0;
}

.current-info {
  background-color: #f5f7fa;
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item label {
  flex-shrink: 0;
  width: 100px;
  font-weight: 500;
  color: #606266;
}

.current-value {
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
}

.method-form {
  margin-top: 16px;
}

.method-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
  line-height: 1.5;
}

.original-value {
  color: #909399;
  text-decoration: line-through;
}

.change-value,
.change-percentage {
  font-weight: 600;
}

.positive-change {
  color: #67c23a;
}

.negative-change {
  color: #f56c6c;
}

.no-change {
  color: #909399;
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
  margin-bottom: 20px;
}

:deep(.el-alert__content) {
  padding-right: 0;
}
</style>