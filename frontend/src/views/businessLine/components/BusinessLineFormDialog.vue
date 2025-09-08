<template>
  <el-dialog
    v-model="visible"
    :title="mode === 'create' ? '新增业务线' : '编辑业务线'"
    width="600px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="loading"
    >
      <el-form-item label="业务线名称" prop="name">
        <el-input
          v-model="formData.name"
          placeholder="请输入业务线名称"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="业务线代码" prop="code">
        <el-input
          v-model="formData.code"
          placeholder="请输入业务线代码"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>

      <el-form-item label="负责人" prop="managerId">
        <el-select
          v-model="formData.managerId"
          placeholder="请选择负责人"
          clearable
          filterable
          style="width: 100%"
        >
          <el-option
            v-for="employee in employees"
            :key="employee.id"
            :label="`${employee.name} (${employee.employeeNo})`"
            :value="employee.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="利润目标" prop="profitTarget">
        <el-input-number
          v-model="formData.profitTarget"
          :min="0"
          :precision="2"
          placeholder="请输入利润目标"
          style="width: 100%"
        />
        <div class="form-tip">单位：万元</div>
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          :rows="3"
          placeholder="请输入业务线描述"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>

      <!-- KPI指标配置 -->
      <el-form-item label="KPI指标">
        <div class="kpi-metrics">
          <div v-if="formData.kpiMetrics.length === 0" class="no-kpi">
            <el-text type="info">暂无KPI指标</el-text>
            <el-button link type="primary" @click="addKpiMetric">
              <el-icon><Plus /></el-icon>
              添加指标
            </el-button>
          </div>
          <div v-else>
            <div class="kpi-header">
              <el-row :gutter="12" align="middle">
                <el-col :span="8">
                  <div class="kpi-column-title">指标名称</div>
                </el-col>
                <el-col :span="6">
                  <div class="kpi-column-title">目标值</div>
                </el-col>
                <el-col :span="6">
                  <div class="kpi-column-title">权重 (0-1)</div>
                </el-col>
                <el-col :span="4">
                  <div class="kpi-column-title">操作</div>
                </el-col>
              </el-row>
            </div>
            <div v-for="(metric, index) in formData.kpiMetrics" :key="index" class="kpi-item">
              <el-row :gutter="12" align="middle">
                <el-col :span="8">
                  <el-input
                    v-model="metric.name"
                    placeholder="请输入指标名称"
                    size="small"
                  />
                </el-col>
                <el-col :span="6">
                  <el-input-number
                    v-model="metric.target"
                    :min="0"
                    :precision="2"
                    placeholder="目标值"
                    size="small"
                    style="width: 100%"
                  />
                </el-col>
                <el-col :span="6">
                  <el-input-number
                    v-model="metric.weight"
                    :min="0"
                    :max="1"
                    :step="0.1"
                    :precision="2"
                    placeholder="权重"
                    size="small"
                    style="width: 100%"
                  />
                </el-col>
                <el-col :span="4">
                  <el-button
                    link
                    type="danger"
                    size="small"
                    @click="removeKpiMetric(index)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </el-col>
              </el-row>
            </div>
            <el-button link type="primary" @click="addKpiMetric" style="margin-top: 8px">
              <el-icon><Plus /></el-icon>
              添加指标
            </el-button>
          </div>
          <div class="kpi-tip">
            KPI权重总和建议为1.0，用于业务线绩效评估
          </div>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          {{ mode === 'create' ? '创建' : '保存' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElForm } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { businessLineApi } from '@/api/businessLine'
import { employeeApi } from '@/api/employee'
import type { BusinessLine, BusinessLineCreateData, BusinessLineUpdateData } from '@/types/businessLine'

interface Props {
  modelValue: boolean
  businessLine: BusinessLine | null
  mode: 'create' | 'edit'
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref<InstanceType<typeof ElForm>>()
const loading = ref(false)
const employees = ref<Array<{ id: string; name: string; employeeNo: string }>>([])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 表单数据
const formData = reactive({
  name: '',
  code: '',
  description: '',
  managerId: undefined as string | undefined,
  profitTarget: 0,
  kpiMetrics: [] as Array<{
    name: string
    target: number
    weight: number
  }>
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入业务线名称', trigger: 'blur' },
    { min: 2, max: 100, message: '业务线名称长度为2-100个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入业务线代码', trigger: 'blur' },
    { min: 2, max: 50, message: '业务线代码长度为2-50个字符', trigger: 'blur' },
    { pattern: /^[A-Z0-9_]+$/, message: '业务线代码只能包含大写字母、数字和下划线', trigger: 'blur' }
  ],
  profitTarget: [
    { type: 'number' as const, min: 0, message: '利润目标不能小于0', trigger: 'blur' }
  ]
}

// 初始化表单数据
const initFormData = () => {
  if (props.mode === 'edit' && props.businessLine) {
    formData.name = props.businessLine.name
    formData.code = props.businessLine.code
    formData.description = props.businessLine.description || ''
    formData.managerId = props.businessLine.managerId
    formData.profitTarget = props.businessLine.profitTarget || 0
    formData.kpiMetrics = props.businessLine.kpiMetrics ? [...props.businessLine.kpiMetrics] : []
  } else {
    formData.name = ''
    formData.code = ''
    formData.description = ''
    formData.managerId = undefined
    formData.profitTarget = 0
    formData.kpiMetrics = []
  }
}

// 添加KPI指标
const addKpiMetric = () => {
  formData.kpiMetrics.push({
    name: '',
    target: 0,
    weight: 0
  })
}

// 删除KPI指标
const removeKpiMetric = (index: number) => {
  formData.kpiMetrics.splice(index, 1)
}

// 获取员工列表
const getEmployees = async () => {
  try {
    const response = await employeeApi.getEmployees({
      pageSize: 1000,
      status: 1
    })
    employees.value = response.data.employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      employeeNo: emp.employeeNo
    }))
  } catch (error) {
    console.warn('获取员工列表失败:', error)
  }
}

// 处理提交
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    
    loading.value = true
    
    // 验证KPI权重总和
    if (formData.kpiMetrics.length > 0) {
      const totalWeight = formData.kpiMetrics.reduce((sum, metric) => sum + metric.weight, 0)
      if (Math.abs(totalWeight - 1) > 0.01) {
        ElMessage.warning('KPI指标权重总和应该为1.0')
        return
      }
      
      // 验证KPI指标名称不能为空
      const hasEmptyName = formData.kpiMetrics.some(metric => !metric.name.trim())
      if (hasEmptyName) {
        ElMessage.warning('请填写所有KPI指标名称')
        return
      }
    }

    const submitData: BusinessLineCreateData | BusinessLineUpdateData = {
      name: formData.name,
      code: formData.code.toUpperCase(),
      description: formData.description || undefined,
      managerId: formData.managerId,
      profitTarget: formData.profitTarget,
      kpiMetrics: formData.kpiMetrics.length > 0 ? formData.kpiMetrics : undefined
    }

    if (props.mode === 'create') {
      await businessLineApi.createBusinessLine(submitData as BusinessLineCreateData)
      ElMessage.success('业务线创建成功')
    } else if (props.businessLine) {
      await businessLineApi.updateBusinessLine(props.businessLine.id, submitData as BusinessLineUpdateData)
      ElMessage.success('业务线更新成功')
    }

    emit('success')
    handleClose()
  } catch (error: any) {
    if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else {
      ElMessage.error(props.mode === 'create' ? '创建失败' : '更新失败')
    }
  } finally {
    loading.value = false
  }
}

// 处理关闭
const handleClose = () => {
  formRef.value?.resetFields()
  initFormData()
  visible.value = false
}

// 监听对话框显示
watch(visible, (newVal) => {
  if (newVal) {
    initFormData()
  }
})

// 初始化
onMounted(() => {
  getEmployees()
})
</script>

<style lang="scss" scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.kpi-metrics {
  width: 100%;
  
  .kpi-header {
    margin-bottom: 12px;
    padding: 8px 0;
    border-bottom: 1px solid #ebeef5;
    
    .kpi-column-title {
      font-size: 12px;
      color: #606266;
      font-weight: 500;
      text-align: center;
    }
  }
  
  .no-kpi {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px;
    border: 1px dashed #dcdfe6;
    border-radius: 6px;
    justify-content: center;
  }
  
  .kpi-item {
    margin-bottom: 8px;
    padding: 12px;
    border: 1px solid #ebeef5;
    border-radius: 6px;
    background: #fafafa;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .kpi-tip {
    margin-top: 8px;
    font-size: 12px;
    color: #909399;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>