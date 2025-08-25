<template>
  <el-dialog
    v-model="visible"
    title="权重配置"
    width="900px"
    @close="handleClose"
  >
    <div class="weight-config-content" v-loading="loading">
      <!-- 项目选择 -->
      <div class="project-section">
        <h3>选择项目</h3>
        <el-select
          v-model="selectedProjectId"
          placeholder="选择项目进行权重配置"
          style="width: 100%"
          @change="handleProjectChange"
        >
          <el-option
            v-for="project in projects"
            :key="project.id"
            :label="`${project.name} (${project.code})`"
            :value="project.id"
          />
        </el-select>
        <div class="section-tip">
          选择项目后可以为该项目配置特定的业务线权重，未选择项目时显示默认权重配置
        </div>
      </div>

      <!-- 权重配置表格 -->
      <div v-if="weightConfigs.length > 0" class="weight-table-section">
        <h3>
          权重配置
          <el-button link type="primary" @click="resetToDefault" :disabled="!selectedProjectId">
            重置为默认权重
          </el-button>
        </h3>
        
        <el-table :data="weightConfigs" style="width: 100%">
          <el-table-column prop="businessLineName" label="业务线" width="150" />
          <el-table-column prop="businessLineCode" label="代码" width="100" />
          <el-table-column label="默认权重" width="120" align="center">
            <template #default="{ row }">
              <el-tag type="info" size="small">{{ formatPercent(row.defaultWeight) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="项目权重" width="200" align="center">
            <template #default="{ row, $index }">
              <div class="weight-input">
                <el-input-number
                  v-model="row.effectiveWeight"
                  :min="0"
                  :max="1"
                  :step="0.01"
                  :precision="3"
                  size="small"
                  style="width: 120px"
                  @change="handleWeightChange($index)"
                />
                
              </div>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.isCustom" type="warning" size="small">自定义</el-tag>
              <el-tag v-else type="info" size="small">默认</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="权重占比" min-width="150">
            <template #default="{ row }">
              <div class="weight-bar">
                <div 
                  class="weight-fill"
                  :style="{ width: `${(row.effectiveWeight * 100)}%` }"
                ></div>
                <span class="weight-text">{{ formatPercent(row.effectiveWeight) }}</span>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 权重总和验证 -->
        <div class="weight-summary">
          <div class="summary-item">
            <span class="label">权重总和：</span>
            <span :class="['value', totalWeight === 1 ? 'valid' : 'invalid']">
              {{ formatPercent(totalWeight) }}
            </span>
          </div>
          <div v-if="totalWeight !== 1" class="weight-warning">
            <el-alert
              :title="`权重总和必须为100%，当前为${formatPercent(totalWeight)}`"
              type="warning"
              :closable="false"
              show-icon
            />
          </div>
        </div>

        <!-- 调整原因 -->
        <div v-if="selectedProjectId" class="reason-section">
          <h4>调整原因</h4>
          <el-input
            v-model="adjustReason"
            type="textarea"
            :rows="2"
            placeholder="请说明权重调整的原因..."
            maxlength="500"
            show-word-limit
          />
        </div>

        <!-- 快速调整工具 -->
        <div class="quick-adjust-section">
          <h4>快速调整工具</h4>
          <div class="adjust-tools">
            <el-button @click="averageDistribute" size="small">
              平均分配
            </el-button>
            <el-button @click="copyFromDefault" size="small">
              复制默认权重
            </el-button>
            <el-button @click="normalizeWeights" size="small" :disabled="totalWeight === 0">
              权重标准化
            </el-button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <el-empty description="暂无权重配置数据" />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleSave"
          :disabled="!canSave"
          :loading="saving"
        >
          保存配置
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { businessLineApi } from '@/api/businessLine'
import { projectApi } from '@/api/project'
import type { BusinessLine } from '@/types/businessLine'
import type { WeightConfig, Project } from '@/types/project'

interface Props {
  modelValue: boolean
  businessLine?: BusinessLine | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const loading = ref(false)
const saving = ref(false)
const projects = ref<Project[]>([])
const selectedProjectId = ref<string | undefined>()
const weightConfigs = ref<WeightConfig[]>([])
const adjustReason = ref('')

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 计算权重总和
const totalWeight = computed(() => {
  return weightConfigs.value.reduce((sum, config) => sum + config.effectiveWeight, 0)
})

// 是否可以保存
const canSave = computed(() => {
  return selectedProjectId.value && Math.abs(totalWeight.value - 1) < 0.001
})

// 格式化百分比
const formatPercent = (value: number) => {
  return `${(value * 100).toFixed(1)}%`
}

// 获取项目列表
const getProjects = async () => {
  try {
    const response = await projectApi.getProjects({ pageSize: 1000 })
    projects.value = response.data.projects
  } catch (error) {
    console.warn('获取项目列表失败:', error)
  }
}

// 获取权重配置
const getWeightConfig = async (projectId?: number) => {
  try {
    loading.value = true
    
    if (!projectId) {
      // 显示默认权重配置
      const response = await businessLineApi.getBusinessLines({ pageSize: 1000 })
      weightConfigs.value = response.data.businessLines.map(bl => ({
        businessLineId: bl.id,
        businessLineName: bl.name,
        businessLineCode: bl.code,
        defaultWeight: bl.weight || 0,
        customWeight: undefined,
        isCustom: false,
        effectiveWeight: bl.weight || 0,
        reason: undefined,
        effectiveDate: undefined,
        configId: undefined
      }))
    } else {
      // 获取项目特定权重配置
      try {
        const response = await projectApi.getProjectWeights(projectId)
        if (response.data.weightConfig && response.data.weightConfig.length > 0) {
          weightConfigs.value = response.data.weightConfig
        } else {
          // 如果没有项目特定配置，使用默认配置
          await getWeightConfig()
        }
      } catch (error) {
        console.warn('获取项目权重配置失败，使用默认配置:', error)
        await getWeightConfig()
      }
    }
  } catch (error) {
    ElMessage.error('获取权重配置失败')
    console.error('获取权重配置失败:', error)
  } finally {
    loading.value = false
  }
}

// 处理项目变更
const handleProjectChange = (projectId: string | undefined) => {
  getWeightConfig(projectId)
  adjustReason.value = ''
}

// 处理权重变更
const handleWeightChange = (index: number) => {
  const config = weightConfigs.value[index]
  // 标记为自定义权重（允许权重为0）
  if (selectedProjectId.value && Math.abs(config.effectiveWeight - config.defaultWeight) > 0.001) {
    config.isCustom = true
  } else {
    config.isCustom = false
  }
}

// 平均分配权重
const averageDistribute = () => {
  const averageWeight = 1 / weightConfigs.value.length
  weightConfigs.value.forEach((config, index) => {
    config.effectiveWeight = averageWeight
    handleWeightChange(index)
  })
}

// 复制默认权重
const copyFromDefault = () => {
  weightConfigs.value.forEach((config, index) => {
    config.effectiveWeight = config.defaultWeight
    handleWeightChange(index)
  })
}

// 权重标准化
const normalizeWeights = () => {
  const total = totalWeight.value
  if (total === 0) return
  
  weightConfigs.value.forEach((config, index) => {
    config.effectiveWeight = config.effectiveWeight / total
    handleWeightChange(index)
  })
}

// 重置为默认权重
const resetToDefault = async () => {
  if (!selectedProjectId.value) return
  
  try {
    await ElMessageBox.confirm(
      '确定要重置为默认权重配置吗？这将清除所有自定义权重设置。',
      '确认重置',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await projectApi.resetProjectWeights(selectedProjectId.value)
    ElMessage.success('重置成功')
    getWeightConfig(selectedProjectId.value)
    emit('success')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('重置失败')
    }
  }
}

// 保存配置
const handleSave = async () => {
  if (!selectedProjectId.value || !canSave.value) return
  
  try {
    saving.value = true
    
    const weights = weightConfigs.value.map(config => ({
      businessLineId: config.businessLineId,
      weight: config.effectiveWeight
    }))
    
    await projectApi.updateProjectWeights(selectedProjectId.value, {
      weights,
      reason: adjustReason.value || undefined
    })
    
    ElMessage.success('权重配置保存成功')
    emit('success')
    handleClose()
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 处理关闭
const handleClose = () => {
  visible.value = false
  selectedProjectId.value = undefined
  weightConfigs.value = []
  adjustReason.value = ''
}

// 监听对话框显示
watch(visible, (newVal) => {
  if (newVal) {
    getProjects()
    // 显示默认权重配置
    getWeightConfig()
  }
})

// 初始化
onMounted(() => {
  if (visible.value) {
    getProjects()
    getWeightConfig()
  }
})
</script>

<style lang="scss" scoped>
.weight-config-content {
  .project-section,
  .weight-table-section,
  .reason-section,
  .quick-adjust-section {
    margin-bottom: 24px;
    
    h3, h4 {
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    h4 {
      font-size: 14px;
    }
  }
  
  .section-tip {
    margin-top: 8px;
    font-size: 12px;
    color: #909399;
  }
  
  .weight-input {
    display: flex;
    align-items: center;
    gap: 4px;
    
    .percent-label {
      font-size: 12px;
      color: #909399;
    }
  }
  
  .weight-bar {
    position: relative;
    height: 20px;
    background: #f5f7fa;
    border-radius: 10px;
    overflow: hidden;
    
    .weight-fill {
      height: 100%;
      background: linear-gradient(90deg, #409eff 0%, #67c23a 100%);
      transition: width 0.3s ease;
    }
    
    .weight-text {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 12px;
      font-weight: 500;
      color: #303133;
    }
  }
  
  .weight-summary {
    margin-top: 16px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 6px;
    
    .summary-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      
      .label {
        font-weight: 500;
        margin-right: 8px;
      }
      
      .value {
        font-size: 18px;
        font-weight: bold;
        
        &.valid {
          color: #67c23a;
        }
        
        &.invalid {
          color: #f56c6c;
        }
      }
    }
    
    .weight-warning {
      margin-top: 8px;
    }
  }
  
  .adjust-tools {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .empty-state {
    padding: 40px 0;
    text-align: center;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>