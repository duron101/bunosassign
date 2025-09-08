<template>
  <el-dialog
    v-model="dialogVisible"
    title="项目权重配置"
    width="700px"
    :before-close="handleClose"
  >
    <div v-loading="loading" class="weight-config-content">
      <div v-if="project" class="project-info">
        <h4>{{ project.name }} ({{ project.code }})</h4>
        <p class="text-muted">调整项目的业务线权重配置，总权重必须等于100%</p>
      </div>

      <el-form 
        ref="formRef" 
        :model="formData" 
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="调整原因" prop="reason">
          <el-input
            v-model="formData.reason"
            type="textarea"
            :rows="2"
            placeholder="请说明权重调整的原因"
          />
        </el-form-item>

        <div class="weight-list">
          <div class="weight-header">
            <div class="business-line">业务线</div>
            <div class="default-weight">默认权重</div>
            <div class="custom-weight">项目权重</div>
            <div class="actions">操作</div>
          </div>

          <div 
            v-for="(config, index) in weightConfigs" 
            :key="config.businessLineId"
            class="weight-item"
          >
            <div class="business-line">
              <div class="line-name">{{ config.businessLineName }}</div>
              <div class="line-code">{{ config.businessLineCode }}</div>
            </div>
            
            <div class="default-weight">
              <el-tag type="info" size="small">
                {{ formatPercent(config.defaultWeight) }}
              </el-tag>
            </div>
            
            <div class="custom-weight">
              <el-input-number
                v-model="config.currentWeight"
                :min="0"
                :max="1"
                :precision="3"
                :step="0.01"
                size="small"
                @change="handleWeightChange"
              />
            </div>
            
            <div class="actions">
              <el-button 
                size="small" 
                text 
                @click="resetToDefault(index)"
                :disabled="!config.isCustom"
              >
                重置
              </el-button>
            </div>
          </div>

          <div class="weight-total">
            <div class="total-label">总权重：</div>
            <div class="total-value" :class="{ 'error': !isWeightValid }">
              {{ formatPercent(totalWeight) }}
            </div>
            <div v-if="!isWeightValid" class="total-error">
              总权重必须等于100%
            </div>
          </div>
        </div>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button @click="handleReset">重置所有</el-button>
        <el-button 
          type="primary" 
          @click="handleSubmit" 
          :loading="loading"
          :disabled="!isWeightValid"
        >
          保存配置
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { projectApi } from '@/api/project'
import type { Project, WeightConfig } from '@/types/project'

// Props & Emits
interface Props {
  modelValue: boolean
  project?: Project | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = withDefaults(defineProps<Props>(), {
  project: null
})

const emit = defineEmits<Emits>()

// Types
interface WeightConfigItem extends WeightConfig {
  currentWeight: number
}

interface FormData {
  reason: string
}

// Refs
const formRef = ref<FormInstance>()
const loading = ref(false)
const weightConfigs = ref<WeightConfigItem[]>([])

const formData = reactive<FormData>({
  reason: ''
})

// Computed
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const totalWeight = computed(() => {
  return weightConfigs.value.reduce((sum, config) => sum + config.currentWeight, 0)
})

const isWeightValid = computed(() => {
  return Math.abs(totalWeight.value - 1) < 0.001
})

// 表单验证规则
const formRules: FormRules = {
  reason: [
    { max: 500, message: '调整原因不能超过500个字符', trigger: 'blur' }
  ]
}

// 监听对话框显示
watch(dialogVisible, (visible) => {
  if (visible && props.project) {
    nextTick(() => {
      loadProjectWeights()
    })
  }
})

// 加载项目权重配置
const loadProjectWeights = async () => {
  if (!props.project) return
  
  loading.value = true
  try {
    const response = await projectApi.getProjectWeights(props.project.id)
    weightConfigs.value = response.data.weightConfig.map(config => ({
      ...config,
      currentWeight: config.effectiveWeight
    }))
    
    // 清空表单
    formData.reason = ''
    formRef.value?.clearValidate()
  } catch (error) {
    console.error('加载权重配置失败:', error)
    ElMessage.error('加载权重配置失败')
  } finally {
    loading.value = false
  }
}

// 处理权重变化
const handleWeightChange = () => {
  // 标记为自定义权重
  weightConfigs.value.forEach(config => {
    const isCustom = Math.abs(config.currentWeight - config.defaultWeight) > 0.001
    config.isCustom = isCustom
  })
}

// 重置单个权重到默认值
const resetToDefault = (index: number) => {
  const config = weightConfigs.value[index]
  config.currentWeight = config.defaultWeight
  config.isCustom = false
  handleWeightChange()
}

// 重置所有权重
const handleReset = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重置所有权重到默认值吗？',
      '确认重置',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    weightConfigs.value.forEach(config => {
      config.currentWeight = config.defaultWeight
      config.isCustom = false
    })
    
    ElMessage.success('已重置所有权重到默认值')
  } catch (error) {
    // 用户取消
  }
}

// 处理提交
const handleSubmit = async () => {
  if (!formRef.value || !props.project) return

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  if (!isWeightValid.value) {
    ElMessage.error('权重总和必须等于100%')
    return
  }

  loading.value = true
  try {
    const weights = weightConfigs.value.map(config => ({
      businessLineId: config.businessLineId,
      weight: config.currentWeight
    }))

    await projectApi.updateProjectWeights(props.project.id, {
      weights,
      reason: formData.reason || '项目权重调整'
    })

    ElMessage.success('权重配置保存成功')
    emit('success')
    handleClose()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '权重配置保存失败')
  } finally {
    loading.value = false
  }
}

// 格式化百分比
const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`
}

// 处理关闭
const handleClose = () => {
  dialogVisible.value = false
}
</script>

<style scoped>
.weight-config-content {
  max-height: 500px;
}

.project-info {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.project-info h4 {
  margin: 0 0 8px 0;
  color: #303133;
}

.project-info p {
  margin: 0;
  font-size: 14px;
}

.text-muted {
  color: #909399;
}

.weight-list {
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.weight-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: #fafafa;
  border-bottom: 1px solid #ebeef5;
  font-weight: 500;
  color: #606266;
}

.weight-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f5f7fa;
}

.weight-item:last-child {
  border-bottom: none;
}

.business-line {
  flex: 2;
  min-width: 0;
}

.line-name {
  font-weight: 500;
  color: #303133;
}

.line-code {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.default-weight {
  flex: 1;
  text-align: center;
}

.custom-weight {
  flex: 1;
  text-align: center;
}

.actions {
  flex: 1;
  text-align: center;
}

.weight-total {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-top: 1px solid #ebeef5;
}

.total-label {
  font-weight: 500;
  color: #606266;
  margin-right: 8px;
}

.total-value {
  font-weight: 500;
  font-size: 16px;
  color: #67c23a;
}

.total-value.error {
  color: #f56c6c;
}

.total-error {
  color: #f56c6c;
  font-size: 12px;
  margin-left: 8px;
}

.dialog-footer {
  text-align: right;
}

:deep(.el-input-number) {
  width: 120px;
}

:deep(.el-input-number .el-input__inner) {
  text-align: center;
}
</style>