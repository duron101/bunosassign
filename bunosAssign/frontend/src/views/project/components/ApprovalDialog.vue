<template>
  <el-dialog
    v-model="visible"
    :title="`${getActionTitle()}团队申请`"
    width="900px"
    :before-close="handleClose"
  >
    <!-- 申请信息 -->
    <el-card class="info-section" header="申请信息" v-if="application">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-descriptions :column="1" size="small">
            <el-descriptions-item label="项目名称">{{ application.Project?.name }}</el-descriptions-item>
            <el-descriptions-item label="团队名称">{{ application.teamName }}</el-descriptions-item>
            <el-descriptions-item label="申请人">{{ application.Applicant?.realName }}</el-descriptions-item>
            <el-descriptions-item label="提交时间">{{ formatDate(application.submittedAt) }}</el-descriptions-item>
          </el-descriptions>
        </el-col>
        <el-col :span="12">
          <el-descriptions :column="1" size="small">
            <el-descriptions-item label="团队人数">{{ application.totalMembers }}人</el-descriptions-item>
            <el-descriptions-item label="预估成本">{{ formatCurrency(application.estimatedCost) }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusType(application.status)">
                {{ getStatusLabel(application.status) }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-col>
      </el-row>
      
      <el-divider />
      
      <div class="description-section">
        <h4>团队描述</h4>
        <p class="description-text">{{ application.teamDescription }}</p>
        
        <h4>申请理由</h4>
        <p class="description-text">{{ application.applicationReason }}</p>
      </div>
    </el-card>

    <!-- 团队成员 -->
    <el-card class="members-section" header="团队成员" v-if="members.length > 0">
      <el-table :data="members" style="width: 100%">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="Employee.name" label="姓名" width="100" />
        <el-table-column prop="Employee.employeeNo" label="工号" width="100" />
        <el-table-column prop="Employee.department" label="部门" width="120" />
        <el-table-column prop="Employee.position" label="岗位" width="120" />
        <el-table-column prop="roleName" label="项目角色" width="120" />
        <el-table-column prop="contributionWeight" label="贡献权重" width="100" align="center" />
        <el-table-column prop="estimatedWorkload" label="工作量占比" width="120" align="center">
          <template #default="{ row }">
            {{ (row.estimatedWorkload * 100).toFixed(0) }}%
          </template>
        </el-table-column>
        <el-table-column prop="allocationPercentage" label="分配比例" width="100" align="center">
          <template #default="{ row }">
            {{ row.allocationPercentage }}%
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" v-if="application?.action === 'modify'">
          <template #default="{ row, $index }">
            <el-button
              size="small"
              type="warning"
              @click="toggleMemberModification(row, $index)"
            >
              {{ getMemberActionLabel(row) }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 审批表单 -->
    <el-card class="approval-section" header="审批意见">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="审批操作" v-if="!application?.action">
          <el-radio-group v-model="form.action">
            <el-radio label="approve">
              <span style="color: #67C23A">批准申请</span>
            </el-radio>
            <el-radio label="modify">
              <span style="color: #E6A23C">要求修改</span>
            </el-radio>
            <el-radio label="reject">
              <span style="color: #F56C6C">拒绝申请</span>
            </el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item 
          :label="form.action === 'approve' ? '批准意见' : form.action === 'modify' ? '修改要求' : '拒绝理由'" 
          prop="comments"
        >
          <el-input
            v-model="form.comments"
            type="textarea"
            :rows="4"
            :placeholder="getCommentsPlaceholder()"
          />
        </el-form-item>

        <!-- 修改建议 -->
        <div v-if="form.action === 'modify' && modifications.length > 0" class="modifications-section">
          <h4>成员调整建议</h4>
          <el-table :data="modifications" size="small">
            <el-table-column prop="memberName" label="成员" width="120" />
            <el-table-column prop="action" label="建议操作" width="100">
              <template #default="{ row }">
                <el-tag :type="row.action === 'remove' ? 'danger' : 'warning'" size="small">
                  {{ row.action === 'remove' ? '移除' : '调整' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="理由" min-width="200" />
            <el-table-column label="操作" width="80">
              <template #default="{ $index }">
                <el-button size="small" text type="danger" @click="modifications.splice($index, 1)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-form>
    </el-card>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button 
          type="primary" 
          :loading="submitting" 
          @click="handleSubmit"
          :class="getSubmitButtonClass()"
        >
          {{ getSubmitButtonText() }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { projectCollaborationApi } from '@/api/projectCollaboration'
import type { ApprovalRequest } from '@/api/projectCollaboration'

// Props
const props = defineProps<{
  modelValue: boolean
  application: any
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
const members = ref([])
const modifications = ref([])

// 表单数据
const form = reactive<ApprovalRequest>({
  action: 'approve',
  comments: '',
  modifications: []
})

// 表单验证规则
const rules = {
  comments: [
    { required: true, message: '请输入审批意见', trigger: 'blur' },
    { min: 10, message: '审批意见至少10个字符', trigger: 'blur' }
  ]
}

// 获取操作标题
const getActionTitle = () => {
  if (props.application?.action) {
    const titles = {
      approve: '批准',
      modify: '修改',
      reject: '拒绝'
    }
    return titles[props.application.action] || '审批'
  }
  return '审批'
}

// 获取状态类型
const getStatusType = (status: string) => {
  const types = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    modified: 'info'
  }
  return types[status] || 'info'
}

// 获取状态标签
const getStatusLabel = (status: string) => {
  const labels = {
    pending: '待审批',
    approved: '已批准',
    rejected: '已拒绝',
    modified: '已修改'
  }
  return labels[status] || status
}

// 获取意见占位符
const getCommentsPlaceholder = () => {
  const placeholders = {
    approve: '请输入批准意见（如：团队配置合理，同意组建）',
    modify: '请详细说明需要修改的内容和理由',
    reject: '请详细说明拒绝的理由'
  }
  return placeholders[form.action] || '请输入审批意见'
}

// 获取提交按钮文本
const getSubmitButtonText = () => {
  const texts = {
    approve: '确认批准',
    modify: '要求修改',
    reject: '确认拒绝'
  }
  return texts[form.action] || '提交'
}

// 获取提交按钮样式
const getSubmitButtonClass = () => {
  const classes = {
    approve: 'success-button',
    modify: 'warning-button',
    reject: 'danger-button'
  }
  return classes[form.action] || ''
}

// 切换成员修改状态
const toggleMemberModification = (member: any, index: number) => {
  const existingIndex = modifications.value.findIndex(mod => mod.memberId === member.id)
  
  if (existingIndex >= 0) {
    // 移除修改建议
    modifications.value.splice(existingIndex, 1)
  } else {
    // 添加修改建议
    modifications.value.push({
      memberId: member.id,
      memberName: member.Employee?.name,
      action: 'remove',
      reason: '建议移除该成员'
    })
  }
}

// 获取成员操作标签
const getMemberActionLabel = (member: any) => {
  const modification = modifications.value.find(mod => mod.memberId === member.id)
  return modification ? '取消标记' : '标记移除'
}

// 加载团队成员
const loadTeamMembers = async () => {
  if (!props.application?.id) return
  
  try {
    const response = await projectCollaborationApi.getProjectCollaboration(props.application.projectId)
    members.value = response.data.members.filter(member => 
      member.applicationId === props.application.id
    )
  } catch (error) {
    console.error('加载团队成员失败:', error)
  }
}

// 提交审批
const handleSubmit = async () => {
  try {
    await formRef.value?.validate()

    const actionTexts = {
      approve: '批准',
      modify: '要求修改',
      reject: '拒绝'
    }

    await ElMessageBox.confirm(
      `确定要${actionTexts[form.action]}这个团队申请吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: form.action === 'approve' ? 'success' : form.action === 'reject' ? 'error' : 'warning'
      }
    )

    submitting.value = true

    const requestData: ApprovalRequest = {
      action: form.action,
      comments: form.comments,
      modifications: form.action === 'modify' ? modifications.value : undefined
    }

    await projectCollaborationApi.approveTeamApplication(props.application.id, requestData)
    
    ElMessage.success(`团队申请${actionTexts[form.action]}成功`)
    emit('success')
    handleClose()

  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '操作失败')
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
      action: 'approve',
      comments: '',
      modifications: []
    })
    modifications.value = []
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

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 监听申请变化
watch(() => props.application, (newApplication) => {
  if (newApplication) {
    if (newApplication.action) {
      form.action = newApplication.action
    }
    loadTeamMembers()
  }
}, { immediate: true })
</script>

<style scoped>
.info-section {
  margin-bottom: 20px;
}

.info-section :deep(.el-card__header) {
  background: #f5f7fa;
}

.description-section h4 {
  margin: 15px 0 10px 0;
  color: #303133;
  font-size: 14px;
}

.description-text {
  color: #606266;
  line-height: 1.6;
  margin: 0 0 15px 0;
  background: #f9f9f9;
  padding: 10px;
  border-radius: 4px;
}

.members-section {
  margin-bottom: 20px;
}

.members-section :deep(.el-card__header) {
  background: #f5f7fa;
}

.approval-section :deep(.el-card__header) {
  background: #f5f7fa;
}

.modifications-section {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

.modifications-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 14px;
}

.dialog-footer {
  text-align: right;
}

:deep(.success-button) {
  background-color: #67C23A;
  border-color: #67C23A;
}

:deep(.warning-button) {
  background-color: #E6A23C;
  border-color: #E6A23C;
}

:deep(.danger-button) {
  background-color: #F56C6C;
  border-color: #F56C6C;
}
</style>