<template>
  <div class="project-publish">
    <div class="page-header">
      <h2>发布项目</h2>
      <el-button @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      class="publish-form"
    >
      <!-- 基本信息 -->
      <el-card class="form-section" header="基本信息">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="项目名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入项目名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="项目代码" prop="code">
              <el-input v-model="form.code" placeholder="请输入项目代码" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="项目描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入项目描述"
          />
        </el-form-item>

        <el-form-item label="工作内容" prop="workContent">
          <el-input
            v-model="form.workContent"
            type="textarea"
            :rows="5"
            placeholder="请详细描述项目的工作内容、目标和交付物"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="优先级" prop="priority">
              <el-select v-model="form.priority" placeholder="请选择优先级" style="width: 100%">
                <el-option label="低" value="low" />
                <el-option label="中" value="medium" />
                <el-option label="高" value="high" />
                <el-option label="紧急" value="critical" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="开始日期" prop="startDate">
              <el-date-picker
                v-model="form.startDate"
                type="date"
                placeholder="选择开始日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="结束日期" prop="endDate">
              <el-date-picker
                v-model="form.endDate"
                type="date"
                placeholder="选择结束日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 预算信息 -->
      <el-card class="form-section" header="预算信息">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="项目预算" prop="budget">
              <el-input-number
                v-model="form.budget"
                :min="0"
                :precision="2"
                style="width: 100%"
                placeholder="请输入项目预算"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="预计奖金规模" prop="bonusScale">
              <el-input-number
                v-model="form.bonusScale"
                :min="0"
                :precision="2"
                style="width: 100%"
                placeholder="请输入预计奖金规模"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="利润目标" prop="profitTarget">
              <el-input-number
                v-model="form.profitTarget"
                :min="0"
                :precision="2"
                style="width: 100%"
                placeholder="请输入利润目标"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 技能要求 -->
      <el-card class="form-section" header="技能要求">
        <el-form-item label="所需技能">
          <div class="skills-container">
            <el-tag
              v-for="(skill, index) in form.skillRequirements"
              :key="index"
              closable
              @close="removeSkill(index)"
              class="skill-tag"
            >
              {{ skill }}
            </el-tag>
            <el-input
              v-if="skillInputVisible"
              ref="skillInputRef"
              v-model="skillInputValue"
              size="small"
              class="skill-input"
              @keyup.enter="handleSkillInputConfirm"
              @blur="handleSkillInputConfirm"
            />
            <el-button
              v-else
              size="small"
              type="success"
              @click="showSkillInput"
            >
              + 添加技能
            </el-button>
          </div>
        </el-form-item>
      </el-card>

      <!-- 项目需求 -->
      <el-card class="form-section" header="项目需求">
        <div class="requirements-list">
          <div
            v-for="(req, index) in form.requirements"
            :key="index"
            class="requirement-item"
          >
            <div class="requirement-header">
              <el-select v-model="req.type" placeholder="需求类型" style="width: 120px">
                <el-option label="技术需求" value="technical" />
                <el-option label="业务需求" value="business" />
                <el-option label="质量需求" value="quality" />
              </el-select>
              <el-input
                v-model="req.title"
                placeholder="需求标题"
                style="flex: 1; margin: 0 10px"
              />
              <el-select v-model="req.priority" placeholder="优先级" style="width: 100px">
                <el-option label="低" value="low" />
                <el-option label="中" value="medium" />
                <el-option label="高" value="high" />
                <el-option label="紧急" value="critical" />
              </el-select>
              <el-checkbox v-model="req.isMandatory" style="margin: 0 10px">
                必须满足
              </el-checkbox>
              <el-button
                type="danger"
                size="small"
                text
                @click="removeRequirement(index)"
              >
                删除
              </el-button>
            </div>
            <el-input
              v-model="req.description"
              type="textarea"
              :rows="2"
              placeholder="需求详细描述"
              style="margin-top: 10px"
            />
            <div class="acceptance-criteria">
              <label>验收标准：</label>
              <div class="criteria-list">
                <div
                  v-for="(criteria, cIndex) in req.acceptanceCriteria"
                  :key="cIndex"
                  class="criteria-item"
                >
                  <el-input
                    v-model="req.acceptanceCriteria[cIndex]"
                    size="small"
                    placeholder="验收标准"
                  />
                  <el-button
                    type="danger"
                    size="small"
                    text
                    @click="req.acceptanceCriteria.splice(cIndex, 1)"
                  >
                    删除
                  </el-button>
                </div>
                <el-button
                  size="small"
                  type="success"
                  text
                  @click="req.acceptanceCriteria.push('')"
                >
                  + 添加验收标准
                </el-button>
              </div>
            </div>
          </div>
        </div>
        <el-button type="primary" @click="addRequirement">
          <el-icon><Plus /></el-icon>
          添加需求
        </el-button>
      </el-card>

      <!-- 操作按钮 -->
      <div class="form-actions">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :loading="publishing" @click="handlePublish">
          发布项目
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Plus } from '@element-plus/icons-vue'
import { projectApi } from '@/api/project'
import type { ProjectCreateData } from '@/types/project'
import type { ProjectRequirement } from '@/api/projectCollaboration'
import { useRouter } from 'vue-router'

const router = useRouter()

// 表单引用
const formRef = ref()
const skillInputRef = ref()

// 表单数据
const form = reactive<ProjectCreateData>({
  name: '',
  code: '',
  description: '',
  workContent: '',
  budget: undefined,
  bonusScale: undefined,
  profitTarget: undefined,
  skillRequirements: [],
  startDate: undefined,
  endDate: undefined,
  priority: 'medium',
  requirements: []
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入项目代码', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' },
    { pattern: /^[A-Z0-9_-]+$/, message: '只能包含大写字母、数字、下划线和中划线', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入项目描述', trigger: 'blur' }
  ],
  workContent: [
    { required: true, message: '请输入工作内容', trigger: 'blur' }
  ],
  priority: [
    { required: true, message: '请选择优先级', trigger: 'change' }
  ]
}

// 状态
const publishing = ref(false)
const skillInputVisible = ref(false)
const skillInputValue = ref('')

// 添加技能
const showSkillInput = () => {
  skillInputVisible.value = true
  nextTick(() => {
    skillInputRef.value?.focus()
  })
}

const handleSkillInputConfirm = () => {
  const inputValue = skillInputValue.value.trim()
  if (inputValue && !form.skillRequirements.includes(inputValue)) {
    form.skillRequirements.push(inputValue)
  }
  skillInputVisible.value = false
  skillInputValue.value = ''
}

const removeSkill = (index: number) => {
  form.skillRequirements.splice(index, 1)
}

// 添加需求
const addRequirement = () => {
  const newRequirement: ProjectRequirement = {
    type: 'technical',
    title: '',
    description: '',
    priority: 'medium',
    isMandatory: true,
    acceptanceCriteria: []
  }
  form.requirements.push(newRequirement)
}

const removeRequirement = (index: number) => {
  form.requirements.splice(index, 1)
}

// 发布项目
const handlePublish = async () => {
  try {
    await formRef.value?.validate()
    
    await ElMessageBox.confirm(
      '确定要发布此项目吗？发布后项目经理可以申请团队组建。',
      '确认发布',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    publishing.value = true

    const publishData = {
      name: form.name,
      code: form.code,
      description: form.description,
      startDate: form.startDate ? new Date(form.startDate).toISOString().split('T')[0] : undefined,
      endDate: form.endDate ? new Date(form.endDate).toISOString().split('T')[0] : undefined,
      budget: form.budget,
      profitTarget: form.profitTarget,
      priority: form.priority
    }

    await projectApi.createProject(publishData)
    
    ElMessage.success('项目创建成功')
    router.push('/project/management')

  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '发布失败')
    }
  } finally {
    publishing.value = false
  }
}

// 取消
const handleCancel = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要取消吗？未保存的数据将丢失。',
      '确认取消',
      {
        confirmButtonText: '确定',
        cancelButtonText: '继续编辑',
        type: 'warning'
      }
    )
    router.back()
  } catch {
    // 用户取消
  }
}
</script>

<style scoped>
.project-publish {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.publish-form {
  background: #fff;
}

.form-section {
  margin-bottom: 20px;
}

.form-section :deep(.el-card__header) {
  background: #f5f7fa;
  font-weight: bold;
  color: #303133;
}

.skills-container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.skill-tag {
  margin: 0;
}

.skill-input {
  width: 120px;
}

.requirements-list {
  margin-bottom: 20px;
}

.requirement-item {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 15px;
  background: #fafafa;
}

.requirement-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.acceptance-criteria {
  margin-top: 15px;
}

.acceptance-criteria label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 8px;
  display: block;
}

.criteria-list {
  padding-left: 20px;
}

.criteria-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 10px;
}

.criteria-item .el-input {
  flex: 1;
}

.form-actions {
  text-align: center;
  padding-top: 30px;
  border-top: 1px solid #ebeef5;
}

.form-actions .el-button {
  min-width: 100px;
  margin: 0 10px;
}
</style>