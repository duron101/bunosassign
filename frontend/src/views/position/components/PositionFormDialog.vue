<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑岗位' : '新增岗位'"
    width="700px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      @submit.prevent
    >
      <!-- 基本信息 -->
      <el-card class="form-section">
        <template #header>
          <span>基本信息</span>
        </template>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="岗位名称" prop="name">
              <el-input
                v-model="form.name"
                placeholder="请输入岗位名称"
                maxlength="100"
                show-word-limit
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="岗位代码" prop="code">
              <el-input
                v-model="form.code"
                placeholder="请输入岗位代码"
                maxlength="50"
                :disabled="isEdit"
              />
              <div class="form-tip">岗位代码创建后不可修改</div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="职级" prop="level">
              <el-select v-model="form.level" placeholder="请选择职级" style="width: 100%">
                <el-option
                  v-for="level in levelOptions"
                  :key="level.value"
                  :label="level.label"
                  :value="level.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="基准值" prop="benchmarkValue">
              <el-input-number
                v-model="form.benchmarkValue"
                :min="0.1"
                :max="3.0"
                :step="0.1"
                :precision="2"
                placeholder="请输入基准值"
                style="width: 100%"
              />
              <div class="form-tip">基准值范围：0.1-3.0，影响奖金计算权重</div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="岗位描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入岗位描述"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>
      </el-card>

      <!-- 岗位职责 -->
      <el-card class="form-section">
        <template #header>
          <div class="section-header">
            <span>岗位职责</span>
            <el-button size="small" @click="addResponsibility">
              <el-icon><Plus /></el-icon>
              添加职责
            </el-button>
          </div>
        </template>

        <div v-if="form.responsibilities.length === 0" class="empty-list">
          暂无岗位职责，点击"添加职责"按钮添加
        </div>

        <div
          v-for="(responsibility, index) in form.responsibilities"
          :key="index"
          class="list-item"
        >
          <el-input
            v-model="form.responsibilities[index]"
            placeholder="请输入岗位职责"
            maxlength="200"
          />
          <el-button
            type="danger"
            size="small"
            @click="removeResponsibility(index)"
          >
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </el-card>

      <!-- 任职要求 -->
      <el-card class="form-section">
        <template #header>
          <div class="section-header">
            <span>任职要求</span>
            <el-button size="small" @click="addRequirement">
              <el-icon><Plus /></el-icon>
              添加要求
            </el-button>
          </div>
        </template>

        <div v-if="form.requirements.length === 0" class="empty-list">
          暂无任职要求，点击"添加要求"按钮添加
        </div>

        <div
          v-for="(requirement, index) in form.requirements"
          :key="index"
          class="list-item"
        >
          <el-input
            v-model="form.requirements[index]"
            placeholder="请输入任职要求"
            maxlength="200"
          />
          <el-button
            type="danger"
            size="small"
            @click="removeRequirement(index)"
          >
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </el-card>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        {{ isEdit ? '更新' : '创建' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import {
  createPosition,
  updatePosition,
  type Position,
  type PositionForm
} from '@/api/position'

interface Props {
  visible: boolean
  position: Position | null
  isEdit: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const loading = ref(false)

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

const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 扩展表单接口以支持数组字段
interface ExtendedPositionForm extends PositionForm {
  responsibilities: string[]
  requirements: string[]
}

// 表单数据
const form = reactive<ExtendedPositionForm>({
  name: '',
  code: '',
  level: '',
  benchmarkValue: 0,
  description: '',
  responsibilities: [],
  requirements: []
})

// 表单验证规则
const rules: FormRules = {
  name: [
    { required: true, message: '请输入岗位名称', trigger: 'blur' },
    { min: 2, max: 100, message: '岗位名称长度为 2 到 100 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入岗位代码', trigger: 'blur' },
    { min: 2, max: 50, message: '岗位代码长度为 2 到 50 个字符', trigger: 'blur' },
    { pattern: /^[A-Z0-9_-]+$/, message: '岗位代码只能包含大写字母、数字、下划线和连字符', trigger: 'blur' }
  ],
  level: [
    { required: true, message: '请选择职级', trigger: 'change' }
  ],
  benchmarkValue: [
    { required: true, message: '请输入基准值', trigger: 'blur' },
    { type: 'number', min: 0.1, max: 3.0, message: '基准值范围为 0.1-3.0', trigger: 'blur' }
  ],
  description: [
    { max: 1000, message: '岗位描述不能超过 1000 个字符', trigger: 'blur' }
  ]
}

// 监听对话框显示状态
watch(() => props.visible, (val) => {
  if (val) {
    resetForm()
    if (props.isEdit && props.position) {
      populateForm()
    }
  }
})

// 重置表单
const resetForm = () => {
  Object.assign(form, {
    name: '',
    code: '',
    level: '',
    benchmarkValue: 0,
    description: '',
    responsibilities: [],
    requirements: []
  })
  
  formRef.value?.clearValidate()
}

// 填充表单数据（编辑时）
const populateForm = () => {
  if (!props.position) return
  
  Object.assign(form, {
    name: props.position.name,
    code: props.position.code,
    level: props.position.level,
    benchmarkValue: props.position.benchmarkValue,
    description: props.position.description || '',
    responsibilities: props.position.responsibilities ? [...props.position.responsibilities] : [],
    requirements: props.position.requirements ? [...props.position.requirements] : []
  })
}

// 添加职责
const addResponsibility = () => {
  form.responsibilities.push('')
}

// 移除职责
const removeResponsibility = (index: number) => {
  form.responsibilities.splice(index, 1)
}

// 添加要求
const addRequirement = () => {
  form.requirements.push('')
}

// 移除要求
const removeRequirement = (index: number) => {
  form.requirements.splice(index, 1)
}

// 关闭对话框
const handleClose = () => {
  visible.value = false
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    // 过滤掉空的职责和要求
    const filteredResponsibilities = form.responsibilities.filter(item => item.trim())
    const filteredRequirements = form.requirements.filter(item => item.trim())
    
    const submitData = {
      ...form,
      responsibilities: filteredResponsibilities,
      requirements: filteredRequirements
    }
    
    loading.value = true
    
    if (props.isEdit && props.position) {
      await updatePosition(props.position.id, submitData)
      ElMessage.success('岗位更新成功')
    } else {
      await createPosition(submitData)
      ElMessage.success('岗位创建成功')
    }
    
    emit('success')
    handleClose()
  } catch (error) {
    if (error !== false) { // 不是表单验证失败
      ElMessage.error(props.isEdit ? '岗位更新失败' : '岗位创建失败')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-section {
  margin-bottom: 20px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.empty-list {
  text-align: center;
  color: #909399;
  padding: 40px 0;
  border: 2px dashed #dcdfe6;
  border-radius: 6px;
  background-color: #fafafa;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.list-item:last-child {
  margin-bottom: 0;
}

.list-item .el-input {
  flex: 1;
}

:deep(.el-card__header) {
  padding: 12px 20px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__inner) {
  text-align: left;
}
</style>