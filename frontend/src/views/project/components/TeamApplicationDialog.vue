<template>
  <el-dialog
    v-model="visible"
    title="申请团队组建"
    width="800px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
    >
      <!-- 项目信息 -->
      <el-card class="form-section" header="项目信息" v-if="project">
        <el-descriptions :column="2">
          <el-descriptions-item label="项目名称">{{ project.name }}</el-descriptions-item>
          <el-descriptions-item label="项目代码">{{ project.code }}</el-descriptions-item>
          <el-descriptions-item label="预算">{{ formatCurrency(project.budget) }}</el-descriptions-item>
          <el-descriptions-item label="奖金规模">{{ formatCurrency(project.bonusScale) }}</el-descriptions-item>
        </el-descriptions>
        <el-form-item label="工作内容" style="margin-top: 15px">
          <div class="work-content">{{ project.workContent }}</div>
        </el-form-item>
      </el-card>

      <!-- 团队信息 -->
      <el-card class="form-section" header="团队信息">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="团队名称" prop="teamName">
              <el-input v-model="form.teamName" placeholder="请输入团队名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预估成本" prop="estimatedCost">
              <el-input-number
                v-model="form.estimatedCost"
                :min="0"
                :precision="2"
                style="width: 100%"
                placeholder="请输入预估成本"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="团队描述" prop="teamDescription">
          <el-input
            v-model="form.teamDescription"
            type="textarea"
            :rows="3"
            placeholder="请描述团队的组成、分工和协作方式"
          />
        </el-form-item>

        <el-form-item label="申请理由" prop="applicationReason">
          <el-input
            v-model="form.applicationReason"
            type="textarea"
            :rows="4"
            placeholder="请详细说明为什么需要这个团队配置，以及预期的项目成果"
          />
        </el-form-item>
      </el-card>

      <!-- 团队成员 -->
      <el-card class="form-section" header="团队成员配置">
        <div class="members-section">
          <div class="members-header">
            <span>已选择 {{ form.members.length }} 名成员</span>
            <el-button type="primary" size="small" @click="showMemberSelector">
              <el-icon><Plus /></el-icon>
              添加成员
            </el-button>
          </div>

          <div class="members-list" v-if="form.members.length > 0">
            <el-table :data="form.members" style="width: 100%">
              <el-table-column prop="Employee.name" label="姓名" width="100" />
              <el-table-column prop="Employee.employeeNo" label="工号" width="100" />
              <el-table-column prop="Employee.department" label="部门" width="120" />
              <el-table-column prop="Employee.position" label="岗位" width="120" />
              <el-table-column prop="roleName" label="项目角色" width="120">
                <template #default="{ row, $index }">
                  <el-select
                    v-model="row.roleName"
                    placeholder="选择角色"
                    size="small"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="role in projectRoles"
                      :key="role.code"
                      :label="role.name"
                      :value="role.name"
                    />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column prop="contributionWeight" label="贡献权重" width="120">
                <template #default="{ row, $index }">
                  <el-input-number
                    v-model="row.contributionWeight"
                    :min="0.1"
                    :max="5"
                    :step="0.1"
                    size="small"
                    style="width: 100%"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="estimatedWorkload" label="工作量占比" width="120">
                <template #default="{ row, $index }">
                  <el-input-number
                    v-model="row.estimatedWorkload"
                    :min="0.1"
                    :max="1"
                    :step="0.1"
                    :precision="1"
                    size="small"
                    style="width: 100%"
                  />
                </template>
              </el-table-column>
              <el-table-column prop="allocationPercentage" label="分配比例%" width="120">
                <template #default="{ row, $index }">
                  <el-input-number
                    v-model="row.allocationPercentage"
                    :min="10"
                    :max="100"
                    size="small"
                    style="width: 100%"
                  />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80" fixed="right">
                <template #default="{ row, $index }">
                  <el-button
                    type="danger"
                    size="small"
                    text
                    @click="removeMember($index)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <el-empty v-else description="暂无团队成员，请添加成员" />
        </div>
      </el-card>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          提交申请
        </el-button>
      </div>
    </template>

    <!-- 成员选择器 -->
    <MemberSelectorDialog
      v-model="memberSelectorVisible"
      :selected-members="form.members"
      @confirm="handleMembersSelected"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { projectCollaborationApi } from '@/api/projectCollaboration'
import type { TeamApplicationRequest, TeamMember } from '@/api/projectCollaboration'
import MemberSelectorDialog from './MemberSelectorDialog.vue'

// Props
const props = defineProps<{
  modelValue: boolean
  project: any
}>()

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  success: []
}>()

// 响应式数据
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formRef = ref()
const submitting = ref(false)
const memberSelectorVisible = ref(false)

// 表单数据
const form = reactive<TeamApplicationRequest>({
  teamName: '',
  teamDescription: '',
  applicationReason: '',
  estimatedCost: 0,
  members: []
})

// 项目角色列表
const projectRoles = ref([
  { code: 'PM', name: '项目经理' },
  { code: 'TECH_LEAD', name: '技术负责人' },
  { code: 'SENIOR_DEV', name: '高级开发工程师' },
  { code: 'DEVELOPER', name: '开发工程师' },
  { code: 'TESTER', name: '测试工程师' },
  { code: 'DESIGNER', name: 'UI/UX设计师' },
  { code: 'PRODUCT', name: '产品经理' }
])

// 表单验证规则
const rules = {
  teamName: [
    { required: true, message: '请输入团队名称', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  teamDescription: [
    { required: true, message: '请输入团队描述', trigger: 'blur' }
  ],
  applicationReason: [
    { required: true, message: '请输入申请理由', trigger: 'blur' }
  ]
}

// 监听项目变化
watch(() => props.project, (newProject) => {
  if (newProject) {
    // 根据项目信息初始化团队名称
    form.teamName = `${newProject.name}项目团队`
  }
}, { immediate: true })

// 显示成员选择器
const showMemberSelector = () => {
  memberSelectorVisible.value = true
}

// 处理成员选择
const handleMembersSelected = (selectedMembers: TeamMember[]) => {
  form.members = selectedMembers
}

// 移除成员
const removeMember = (index: number) => {
  form.members.splice(index, 1)
}

// 提交申请
const handleSubmit = async () => {
  try {
    await formRef.value?.validate()

    if (form.members.length === 0) {
      ElMessage.warning('请至少添加一名团队成员')
      return
    }

    // 验证成员角色是否都已选择
    const missingRoles = form.members.filter(member => !member.roleName)
    if (missingRoles.length > 0) {
      ElMessage.warning('请为所有成员分配项目角色')
      return
    }

    await ElMessageBox.confirm(
      `确定要为项目"${props.project.name}"申请团队组建吗？`,
      '确认申请',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    submitting.value = true

    await projectCollaborationApi.applyTeamBuilding(props.project.id, form)
    
    ElMessage.success('团队申请提交成功，请等待审批')
    emit('success')
    handleClose()

  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '申请提交失败')
    }
  } finally {
    submitting.value = false
  }
}

// 关闭对话框
const handleClose = () => {
  visible.value = false
  // 重置表单
  setTimeout(() => {
    Object.assign(form, {
      teamName: '',
      teamDescription: '',
      applicationReason: '',
      estimatedCost: 0,
      members: []
    })
    formRef.value?.clearValidate()
  }, 300)
}

// 格式化货币
const formatCurrency = (amount: number) => {
  if (!amount) return '¥0'
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}
</script>

<style scoped>
.form-section {
  margin-bottom: 20px;
}

.form-section :deep(.el-card__header) {
  background: #f5f7fa;
  font-weight: bold;
  color: #303133;
}

.work-content {
  background: #f9f9f9;
  padding: 10px;
  border-radius: 4px;
  color: #606266;
  line-height: 1.5;
}

.members-section {
  min-height: 200px;
}

.members-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.members-header span {
  color: #303133;
  font-weight: 500;
}

.members-list {
  margin-bottom: 20px;
}

.dialog-footer {
  text-align: right;
}
</style>