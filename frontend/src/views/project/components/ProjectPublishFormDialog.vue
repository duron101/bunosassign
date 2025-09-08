<template>
  <el-dialog
    v-model="dialogVisible"
    title="发布项目"
    width="900px"
    :before-close="handleClose"
    :close-on-click-modal="false"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      v-loading="loading"
    >
      <!-- 基本信息 -->
      <div class="form-section">
        <div class="section-title">基本信息</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="项目名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入项目名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目代码" prop="code">
              <el-input v-model="formData.code" placeholder="请输入项目代码" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="项目描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入项目描述"
          />
        </el-form-item>

        <el-form-item label="工作内容" prop="workContent">
          <el-input
            v-model="formData.workContent"
            type="textarea"
            :rows="4"
            placeholder="请详细描述项目工作内容、目标和交付物"
          />
        </el-form-item>
      </div>

      <!-- 项目设置 -->
      <div class="form-section">
        <div class="section-title">项目设置</div>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="项目经理" prop="managerId">
              <el-select
                v-model="formData.managerId"
                placeholder="请选择项目经理"
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
          </el-col>
          <el-col :span="8">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="formData.priority" placeholder="请选择优先级" style="width: 100%">
                <el-option
                  v-for="(label, value) in PROJECT_PRIORITY_LABELS"
                  :key="value"
                  :label="label"
                  :value="value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="奖金系数" prop="bonusScale">
              <el-input-number
                v-model="formData.bonusScale"
                :min="0"
                :max="5"
                :precision="2"
                :step="0.1"
                placeholder="奖金系数"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="开始日期" prop="startDate">
              <el-date-picker
                v-model="formData.startDate"
                type="date"
                placeholder="选择开始日期"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="结束日期" prop="endDate">
              <el-date-picker
                v-model="formData.endDate"
                type="date"
                placeholder="选择结束日期"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="项目预算" prop="budget">
              <el-input-number
                v-model="formData.budget"
                :min="0"
                :precision="2"
                :step="1000"
                placeholder="项目预算"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 团队规模设置 -->
      <div class="form-section">
        <div class="section-title">团队规模</div>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="团队最小人数" prop="teamSize.min">
              <el-input-number
                v-model="formData.teamSize.min"
                :min="1"
                :max="50"
                placeholder="最小人数"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="团队最大人数" prop="teamSize.max">
              <el-input-number
                v-model="formData.teamSize.max"
                :min="1"
                :max="50"
                placeholder="最大人数"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- 技能要求 -->
      <div class="form-section">
        <div class="section-title">
          技能要求
          <el-button
            type="primary"
            size="small"
            @click="addSkillRequirement"
            style="margin-left: 10px;"
          >
            添加技能
          </el-button>
        </div>
        
        <div v-if="formData.skillRequirements.length === 0" class="empty-placeholder">
          暂无技能要求，点击"添加技能"按钮开始设置
        </div>
        
        <div
          v-for="(skill, index) in formData.skillRequirements"
          :key="`skill-${index}`"
          class="skill-item"
        >
          <el-row :gutter="16">
            <el-col :span="6">
              <el-form-item :prop="`skillRequirements.${index}.skill`" :rules="[{ required: true, message: '请输入技能名称', trigger: 'blur' }]">
                <el-input
                  v-model="skill.skill"
                  placeholder="技能名称"
                />
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item :prop="`skillRequirements.${index}.level`">
                <el-select v-model="skill.level" placeholder="技能等级">
                  <el-option label="初级" value="beginner" />
                  <el-option label="中级" value="intermediate" />
                  <el-option label="高级" value="advanced" />
                  <el-option label="专家" value="expert" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="3">
              <el-form-item>
                <el-checkbox v-model="skill.required">必需</el-checkbox>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item :prop="`skillRequirements.${index}.description`">
                <el-input
                  v-model="skill.description"
                  placeholder="技能描述（可选）"
                />
              </el-form-item>
            </el-col>
            <el-col :span="3">
              <el-form-item>
                <el-button
                  type="danger"
                  size="small"
                  @click="removeSkillRequirement(index)"
                >
                  删除
                </el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- 项目需求 -->
      <div class="form-section">
        <div class="section-title">
          项目需求
          <el-button
            type="primary"
            size="small"
            @click="addProjectRequirement"
            style="margin-left: 10px;"
          >
            添加需求
          </el-button>
        </div>
        
        <div v-if="formData.requirements.length === 0" class="empty-placeholder">
          暂无项目需求，点击"添加需求"按钮开始设置
        </div>
        
        <div
          v-for="(requirement, index) in formData.requirements"
          :key="`requirement-${index}`"
          class="requirement-item"
        >
          <el-row :gutter="16">
            <el-col :span="4">
              <el-form-item :prop="`requirements.${index}.type`" :rules="[{ required: true, message: '请选择需求类型', trigger: 'change' }]">
                <el-select v-model="requirement.type" placeholder="需求类型">
                  <el-option label="技术需求" value="technical" />
                  <el-option label="业务需求" value="business" />
                  <el-option label="质量需求" value="quality" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item :prop="`requirements.${index}.title`" :rules="[{ required: true, message: '请输入需求标题', trigger: 'blur' }]">
                <el-input
                  v-model="requirement.title"
                  placeholder="需求标题"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item :prop="`requirements.${index}.description`" :rules="[{ required: true, message: '请输入需求描述', trigger: 'blur' }]">
                <el-input
                  v-model="requirement.description"
                  placeholder="需求描述"
                />
              </el-form-item>
            </el-col>
            <el-col :span="3">
              <el-form-item :prop="`requirements.${index}.priority`">
                <el-select v-model="requirement.priority" placeholder="优先级">
                  <el-option
                    v-for="(label, value) in PROJECT_PRIORITY_LABELS"
                    :key="value"
                    :label="label"
                    :value="value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="3">
              <el-form-item>
                <el-button
                  type="danger"
                  size="small"
                  @click="removeProjectRequirement(index)"
                >
                  删除
                </el-button>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="2">
              <el-form-item>
                <el-checkbox v-model="requirement.isMandatory">强制</el-checkbox>
              </el-form-item>
            </el-col>
            <el-col :span="22">
              <el-form-item :prop="`requirements.${index}.acceptanceCriteria`" label="验收标准">
                <el-input
                  v-model="acceptanceCriteriaStrings[index]"
                  type="textarea"
                  :rows="2"
                  placeholder="验收标准，用分号(;)分隔多个标准"
                  @input="updateAcceptanceCriteria(index, $event)"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          发布项目
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { projectCollaborationApi } from '@/api/projectCollaboration'
import { employeeApi } from '@/api/employee'
import type { 
  ProjectPublishData, 
  SkillRequirement, 
  ProjectRequirement,
  ProjectPriority 
} from '@/types/project'
import { 
  PROJECT_PRIORITY_LABELS, 
  ProjectPriority as Priority 
} from '@/types/project'

// Props & Emits
interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Refs
const formRef = ref<FormInstance>()
const loading = ref(false)
const employees = ref<Array<{ id: string; name: string; employeeNo: string }>>([])

// Computed
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

// 表单数据
const defaultFormData: ProjectPublishData & { 
  skillRequirements: SkillRequirement[]; 
  requirements: ProjectRequirement[];
  teamSize: { min: number; max: number }
} = {
  name: '',
  code: '',
  description: '',
  workContent: '',
  managerId: undefined,
  startDate: '',
  endDate: '',
  budget: undefined,
  profitTarget: undefined,
  bonusScale: 1.0,
  priority: Priority.MEDIUM,
  skillRequirements: [],
  requirements: [],
  teamSize: {
    min: 1,
    max: 10
  }
}

const formData = reactive({ ...defaultFormData })

// 用于处理验收标准的辅助数组（字符串形式）
const acceptanceCriteriaStrings = ref<string[]>([])

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 2, max: 100, message: '项目名称长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入项目代码', trigger: 'blur' },
    { min: 2, max: 50, message: '项目代码长度在 2 到 50 个字符', trigger: 'blur' },
    { pattern: /^[A-Za-z0-9_-]+$/, message: '项目代码只能包含字母、数字、下划线和横线', trigger: 'blur' }
  ],
  workContent: [
    { required: true, message: '请输入工作内容', trigger: 'blur' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ],
  'teamSize.min': [
    { required: true, message: '请设置团队最小人数', trigger: 'change' }
  ],
  'teamSize.max': [
    { required: true, message: '请设置团队最大人数', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (value && formData.teamSize.min && value < formData.teamSize.min) {
          callback(new Error('团队最大人数不能小于最小人数'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  endDate: [
    {
      validator: (rule, value, callback) => {
        if (value && formData.startDate && new Date(value) <= new Date(formData.startDate)) {
          callback(new Error('结束日期必须晚于开始日期'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
}

// 监听对话框显示，重置表单
watch(dialogVisible, (visible) => {
  if (visible) {
    nextTick(() => {
      initForm()
      loadEmployees()
    })
  }
})

// 初始化表单
const initForm = () => {
  Object.assign(formData, defaultFormData)
  acceptanceCriteriaStrings.value = []
  formRef.value?.clearValidate()
}

// 加载员工列表
const loadEmployees = async () => {
  try {
    const response = await employeeApi.getEmployees({ pageSize: 1000 })
    employees.value = response.data.employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      employeeNo: emp.employeeNo
    }))
  } catch (error) {
    console.error('加载员工列表失败:', error)
  }
}

// 添加技能要求
const addSkillRequirement = () => {
  formData.skillRequirements.push({
    skill: '',
    level: 'intermediate',
    required: false,
    description: ''
  })
}

// 删除技能要求
const removeSkillRequirement = (index: number) => {
  formData.skillRequirements.splice(index, 1)
}

// 添加项目需求
const addProjectRequirement = () => {
  const index = formData.requirements.length
  formData.requirements.push({
    type: 'technical',
    title: '',
    description: '',
    priority: Priority.MEDIUM,
    isMandatory: false,
    acceptanceCriteria: []
  })
  acceptanceCriteriaStrings.value[index] = ''
}

// 删除项目需求
const removeProjectRequirement = (index: number) => {
  formData.requirements.splice(index, 1)
  acceptanceCriteriaStrings.value.splice(index, 1)
}

// 更新验收标准
const updateAcceptanceCriteria = (index: number, value: string) => {
  acceptanceCriteriaStrings.value[index] = value
  formData.requirements[index].acceptanceCriteria = value
    .split(';')
    .map(item => item.trim())
    .filter(item => item.length > 0)
}

// 处理关闭
const handleClose = () => {
  dialogVisible.value = false
}

// 处理提交
const handleSubmit = async () => {
  if (!formRef.value) return

  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const data: ProjectPublishData = {
      name: formData.name,
      code: formData.code,
      description: formData.description || undefined,
      workContent: formData.workContent,
      managerId: formData.managerId || undefined,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      budget: formData.budget || undefined,
      profitTarget: formData.profitTarget || undefined,
      bonusScale: formData.bonusScale || 1.0,
      priority: formData.priority,
      skillRequirements: formData.skillRequirements.filter(skill => skill.skill.trim()),
      requirements: formData.requirements.filter(req => req.title.trim() && req.description.trim()),
      teamSize: formData.teamSize
    }

    await projectCollaborationApi.publishProject(data)
    ElMessage.success('项目发布成功')
    
    emit('success')
    handleClose()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '项目发布失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-section {
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 6px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
  padding-bottom: 8px;
  border-bottom: 2px solid #409eff;
  display: flex;
  align-items: center;
}

.empty-placeholder {
  color: #909399;
  text-align: center;
  padding: 20px;
  font-style: italic;
}

.skill-item,
.requirement-item {
  margin-bottom: 16px;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.skill-item:last-child,
.requirement-item:last-child {
  margin-bottom: 0;
}

.dialog-footer {
  text-align: right;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-select) {
  width: 100%;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

.requirement-item {
  border-left: 4px solid #409eff;
}

.skill-item {
  border-left: 4px solid #67c23a;
}
</style>