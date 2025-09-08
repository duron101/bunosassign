<template>
  <div class="project-member-approval">
    <div class="page-header">
      <h2>项目成员申请审批</h2>
      <div class="header-actions">
        <el-button type="success" @click="batchApprove" :disabled="selectedIds.length === 0">
          <el-icon><Check /></el-icon>
          批量通过
        </el-button>
        <el-button @click="refreshList">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 筛选区域 -->
    <div class="filter-section">
      <el-form :model="queryForm" inline>
        <el-form-item label="项目">
          <el-select 
            v-model="queryForm.projectId" 
            placeholder="选择项目" 
            clearable 
            style="width: 200px"
            @change="handleSearch"
          >
            <el-option
              v-for="project in validProjects"
              :key="project._id || project.id || project.code"
              :label="project.name || project.projectName || '未知项目'"
              :value="project._id || project.id || project.code"
            />
            <el-option
              v-if="validProjects.length === 0"
              label="暂无可用项目"
              value=""
              disabled
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="状态">
          <el-select 
            v-model="queryForm.status" 
            placeholder="申请状态" 
            clearable 
            style="width: 120px"
            @change="handleSearch"
          >
            <el-option label="待审批" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 申请列表 -->
    <div class="table-section">
      <vxe-table
        ref="applicationTable"
        :data="validApplications"
        stripe
        border
        show-overflow="title"
        height="600"
        @checkbox-change="handleSelectionChange"
        @checkbox-all="handleSelectAll"
      >
        <template #loading>
          <div v-if="loading" class="loading-overlay">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>加载中...</span>
          </div>
        </template>
        <vxe-column type="checkbox" width="60" />
        
        <vxe-column field="employeeName" title="员工姓名" width="120">
          <template #default="{ row }">
            <div class="employee-info">
              <div class="name">{{ row.employeeName }}</div>
              <div class="code">{{ row.employeeCode }}</div>
            </div>
          </template>
        </vxe-column>

        <vxe-column field="departmentName" title="部门" width="120" />

        <vxe-column field="positionName" title="岗位" width="120" />

        <vxe-column field="projectName" title="申请项目" width="200">
          <template #default="{ row }">
            <div class="project-info">
              <div class="name">{{ row.projectName }}</div>
              <div class="code">{{ row.projectCode }}</div>
            </div>
          </template>
        </vxe-column>

        <vxe-column field="expectedRoleName" title="期望角色" width="120">
          <template #default="{ row }">
            <span v-if="row.expectedRoleName">{{ row.expectedRoleName }}</span>
            <span v-else class="text-muted">未指定</span>
          </template>
        </vxe-column>

        <vxe-column field="applyReason" title="申请理由" width="250" show-overflow="tooltip" />

        <vxe-column field="status" title="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </vxe-column>

        <vxe-column field="appliedAt" title="申请时间" width="120">
          <template #default="{ row }">
            {{ formatDate(row.appliedAt) }}
          </template>
        </vxe-column>

        <vxe-column title="操作" width="200" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button
                type="success"
                size="small"
                text
                @click="handleApprove(row)"
              >
                通过
              </el-button>
              <el-button
                type="danger"
                size="small"
                text
                @click="handleReject(row)"
              >
                拒绝
              </el-button>
            </template>
            <template v-else-if="row.status === 'approved'">
              <el-button
                type="primary"
                size="small"
                text
                @click="manageRoles(row)"
              >
                管理角色
              </el-button>
            </template>
            <el-button
              size="small"
              text
              @click="viewDetails(row)"
            >
              查看详情
            </el-button>
          </template>
        </vxe-column>
      </vxe-table>
    </div>

    <!-- 审批对话框 -->
    <el-dialog
      v-model="approvalDialogVisible"
      :title="approvalForm.action === 'approve' ? '通过申请' : '拒绝申请'"
      width="600px"
    >
      <div v-if="currentApplication">
        <div class="application-summary">
          <h4>申请信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="员工">{{ currentApplication.employeeName }}</el-descriptions-item>
            <el-descriptions-item label="项目">{{ currentApplication.projectName }}</el-descriptions-item>
            <el-descriptions-item label="期望角色">{{ currentApplication.expectedRoleName || '未指定' }}</el-descriptions-item>
            <el-descriptions-item label="申请时间">{{ formatDate(currentApplication.appliedAt) }}</el-descriptions-item>
          </el-descriptions>
          <div style="margin-top: 16px;">
            <strong>申请理由：</strong>
            <p>{{ currentApplication.applyReason }}</p>
          </div>
        </div>

        <el-form
          ref="approvalFormRef"
          :model="approvalForm"
          :rules="approvalFormRules"
          label-width="80px"
          style="margin-top: 20px;"
        >
          <el-form-item 
            v-if="approvalForm.action === 'approve'" 
            label="分配角色" 
            prop="roleId"
          >
            <el-select
              v-model="approvalForm.roleId"
              placeholder="请选择项目角色"
              style="width: 100%"
            >
              <el-option
                v-for="role in validRoles"
                :key="role._id || role.id || role.code"
                :label="role.name || role.roleName || '未知角色'"
                :value="role._id || role.id || role.code"
              >
                <div>
                  <span>{{ role.name || role.roleName || '未知角色' }}</span>
                  <span class="role-desc">{{ role.description || role.roleDescription || '' }}</span>
                </div>
              </el-option>
              <el-option
                v-if="validRoles.length === 0"
                label="暂无可用角色"
                value=""
                disabled
              />
            </el-select>
          </el-form-item>

          <el-form-item 
            v-if="approvalForm.action === 'approve'" 
            label="参与度"
          >
            <el-slider
              v-model="approvalForm.participationRatio"
              :min="10"
              :max="100"
              :step="5"
              show-stops
              show-input
              style="width: 100%"
            />
            <div class="help-text">设置该员工在此项目中的参与度百分比</div>
          </el-form-item>

          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="approvalForm.remark"
              type="textarea"
              :rows="3"
              :placeholder="approvalForm.action === 'approve' ? '审批通过的备注信息' : '拒绝理由'"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="approvalDialogVisible = false">取消</el-button>
          <el-button 
            :type="approvalForm.action === 'approve' ? 'success' : 'danger'"
            @click="submitApproval" 
            :loading="submitting"
          >
            {{ approvalForm.action === 'approve' ? '通过申请' : '拒绝申请' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 角色管理对话框 -->
    <el-dialog
      v-model="roleManageDialogVisible"
      title="管理项目角色"
      width="500px"
    >
      <div v-if="currentMember">
        <div class="member-info">
          <h4>成员信息</h4>
          <p><strong>员工：</strong>{{ currentMember.employeeName }}</p>
          <p><strong>项目：</strong>{{ currentMember.projectName }}</p>
        </div>

        <el-form
          ref="roleFormRef"
          :model="roleForm"
          :rules="roleFormRules"
          label-width="80px"
        >
          <el-form-item label="项目角色" prop="roleId">
            <el-select
              v-model="roleForm.roleId"
              placeholder="请选择项目角色"
              style="width: 100%"
            >
              <el-option
                v-for="role in validRoles"
                :key="role._id || role.id || role.code"
                :label="role.name || role.roleName || '未知角色'"
                :value="role._id || role.id || role.code"
              />
              <el-option
                v-if="validRoles.length === 0"
                label="暂无可用角色"
                value=""
                disabled
              />
            </el-select>
          </el-form-item>

          <el-form-item label="参与度">
            <el-slider
              v-model="roleForm.participationRatio"
              :min="10"
              :max="100"
              :step="5"
              show-stops
              show-input
              style="width: 100%"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="roleManageDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="updateMemberRole" :loading="submitting">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, Refresh, Loading } from '@element-plus/icons-vue'
import { projectMemberApi } from '@/api/projectMember'
import { projectApi } from '@/api/project'
import { formatDate } from '@/utils/format'

// 数据定义
const loading = ref(false)
const submitting = ref(false)
const applicationList = ref([])
const myProjects = ref([])
const projectRoles = ref([])
const selectedIds = ref([])

// 查询表单
const queryForm = reactive({
  projectId: '',
  status: 'pending'
})

// 审批对话框
const approvalDialogVisible = ref(false)
const approvalFormRef = ref()
const currentApplication = ref(null)
const approvalForm = reactive({
  action: 'approve',
  roleId: '',
  participationRatio: 100,
  remark: ''
})

const approvalFormRules = {
  roleId: [
    { required: true, message: '请选择项目角色', trigger: 'change' }
  ]
}

// 角色管理对话框
const roleManageDialogVisible = ref(false)
const roleFormRef = ref()
const currentMember = ref(null)
const roleForm = reactive({
  roleId: '',
  participationRatio: 100
})

const roleFormRules = {
  roleId: [
    { required: true, message: '请选择项目角色', trigger: 'change' }
  ]
}

// 计算属性：过滤有效数据
const validProjects = computed(() => {
  return myProjects.value.filter(project => 
    project && 
    typeof project === 'object' && 
    (project._id || project.id || project.code)
  )
})

const validRoles = computed(() => {
  return projectRoles.value.filter(role => 
    role && 
    typeof role === 'object' && 
    (role._id || role.id || role.code)
  )
})

const validApplications = computed(() => {
  return applicationList.value.filter(application => 
    application && 
    typeof application === 'object' && 
    application._id
  )
})

// 状态映射
const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return types[status] || 'info'
}

const getStatusLabel = (status) => {
  const labels = {
    pending: '待审批',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return labels[status] || '未知'
}

// 表格选择
const handleSelectionChange = ({ checked, row }) => {
  if (!row || !row._id) {
    console.warn('🔍 无效的行数据:', row)
    return
  }
  
  if (checked) {
    if (!selectedIds.value.includes(row._id)) {
      selectedIds.value.push(row._id)
    }
  } else {
    const index = selectedIds.value.indexOf(row._id)
    if (index > -1) {
      selectedIds.value.splice(index, 1)
    }
  }
}

const handleSelectAll = ({ checked, records }) => {
  if (checked && Array.isArray(records)) {
    // 过滤掉无效的记录
    const validRecords = records.filter(row => row && row._id)
    selectedIds.value = validRecords.map(row => row._id)
  } else {
    selectedIds.value = []
  }
}

// 加载数据方法
const loadApplications = async () => {
  try {
    loading.value = true
    const response = await projectMemberApi.getProjectApplications(
      queryForm.projectId, 
      queryForm.status
    )
    
    // 数据验证和清理
    if (response.data && Array.isArray(response.data)) {
      // 过滤掉无效的申请对象
      applicationList.value = response.data.filter(application => 
        application && 
        typeof application === 'object' && 
        application._id
      )
    } else {
      applicationList.value = []
      console.warn('🔍 API返回的申请数据格式不正确:', response.data)
    }
  } catch (error) {
    ElMessage.error('加载申请列表失败: ' + error.message)
    applicationList.value = []
  } finally {
    loading.value = false
  }
}

const loadMyProjects = async () => {
  try {
    const response = await projectApi.getProjects({ manager: true })
    
    // 数据验证和清理
    if (response.data && Array.isArray(response.data)) {
      // 过滤掉无效的项目对象
      myProjects.value = response.data.filter(project => 
        project && 
        typeof project === 'object' && 
        (project._id || project.id || project.code)
      )
    } else {
      myProjects.value = []
      console.warn('🔍 API返回的项目数据格式不正确:', response.data)
    }
    
    // 调试信息：检查项目数据结构
    console.log('🔍 MyProjects loaded:', myProjects.value)
    if (myProjects.value.length > 0) {
      console.log('🔍 First project structure:', myProjects.value[0])
    }
  } catch (error) {
    ElMessage.error('加载我管理的项目失败: ' + error.message)
    myProjects.value = []
  }
}

const loadProjectRoles = async () => {
  try {
    const response = await projectMemberApi.getProjectRoles()
    
    // 数据验证和清理
    if (response.data && Array.isArray(response.data)) {
      // 过滤掉无效的角色对象
      projectRoles.value = response.data.filter(role => 
        role && 
        typeof role === 'object' && 
        (role._id || role.id || role.code)
      )
    } else {
      projectRoles.value = []
      console.warn('🔍 API返回的角色数据格式不正确:', response.data)
    }
    
    // 调试信息：检查角色数据结构
    console.log('🔍 ProjectRoles loaded:', projectRoles.value)
    if (projectRoles.value.length > 0) {
      console.log('🔍 First role structure:', projectRoles.value[0])
    }
  } catch (error) {
    ElMessage.error('加载项目角色失败: ' + error.message)
    projectRoles.value = []
  }
}

// 操作方法
const handleSearch = () => {
  selectedIds.value = []
  loadApplications()
}

const refreshList = () => {
  handleSearch()
}

const handleApprove = (row) => {
  if (!row || !row._id) {
    ElMessage.error('申请数据无效')
    return
  }
  
  currentApplication.value = row
  approvalForm.action = 'approve'
  approvalForm.roleId = row.expectedRoleId || ''
  approvalForm.participationRatio = 100
  approvalForm.remark = ''
  approvalDialogVisible.value = true
}

const handleReject = (row) => {
  if (!row || !row._id) {
    ElMessage.error('申请数据无效')
    return
  }
  
  currentApplication.value = row
  approvalForm.action = 'reject'
  approvalForm.remark = ''
  approvalDialogVisible.value = true
}

const submitApproval = async () => {
  try {
    if (approvalForm.action === 'approve') {
      const valid = await approvalFormRef.value.validate()
      if (!valid) return
    }

    submitting.value = true

    if (approvalForm.action === 'approve') {
      if (!currentApplication.value?._id) {
        ElMessage.error('申请数据无效')
        return
      }
      await projectMemberApi.approveApplication(currentApplication.value._id, {
        roleId: approvalForm.roleId,
        participationRatio: approvalForm.participationRatio / 100,
        remark: approvalForm.remark
      })
      ElMessage.success('申请已通过')
    } else {
      if (!currentApplication.value?._id) {
        ElMessage.error('申请数据无效')
        return
      }
      await projectMemberApi.rejectApplication(currentApplication.value._id, {
        remark: approvalForm.remark
      })
      ElMessage.success('申请已拒绝')
    }

    approvalDialogVisible.value = false
    await loadApplications()
    
  } catch (error) {
    ElMessage.error('操作失败: ' + error.message)
  } finally {
    submitting.value = false
  }
}

const batchApprove = async () => {
  try {
    await ElMessageBox.confirm(`确定批量通过选中的 ${selectedIds.value.length} 个申请吗？`, '批量审批', {
      type: 'warning'
    })

    const data = {
      memberIds: selectedIds.value,
      defaultRoleId: validRoles.value[0]?._id || validRoles.value[0]?.id || validRoles.value[0]?.code, // 使用第一个有效角色作为默认角色
      participationRatio: 1.0
    }

    await projectMemberApi.batchApproveApplications(data)
    ElMessage.success('批量审批完成')
    selectedIds.value = []
    await loadApplications()
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量审批失败: ' + error.message)
    }
  }
}

const manageRoles = (row) => {
  if (!row || !row._id) {
    ElMessage.error('成员数据无效')
    return
  }
  
  currentMember.value = row
  roleForm.roleId = row.roleId
  roleForm.participationRatio = Math.round((row.participationRatio || 1) * 100)
  roleManageDialogVisible.value = true
}

const updateMemberRole = async () => {
  try {
    const valid = await roleFormRef.value.validate()
    if (!valid) return

    if (!currentMember.value?._id) {
      ElMessage.error('成员数据无效')
      return
    }

    submitting.value = true
    await projectMemberApi.updateMemberRole(currentMember.value._id, {
      roleId: roleForm.roleId,
      participationRatio: roleForm.participationRatio / 100
    })

    ElMessage.success('角色更新成功')
    roleManageDialogVisible.value = false
    await loadApplications()
    
  } catch (error) {
    ElMessage.error('更新角色失败: ' + error.message)
  } finally {
    submitting.value = false
  }
}

const viewDetails = (row) => {
  if (!row || !row._id) {
    ElMessage.error('申请数据无效')
    return
  }
  
  // TODO: 显示申请详情
  ElMessage.info('查看详情功能开发中')
}

// 生命周期
onMounted(async () => {
  await loadMyProjects()
  await loadProjectRoles()
  await loadApplications()
})
</script>

<style scoped>
.project-member-approval {
  padding: 20px;
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

.filter-section {
  background: white;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.table-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.employee-info .name {
  font-weight: 500;
  color: #303133;
}

.employee-info .code {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.project-info .name {
  font-weight: 500;
  color: #303133;
}

.project-info .code {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.text-muted {
  color: #c0c4cc;
}

.application-summary h4 {
  margin-bottom: 16px;
  color: #303133;
}

.member-info {
  margin-bottom: 20px;
}

.member-info h4 {
  margin-bottom: 12px;
  color: #303133;
}

.member-info p {
  margin: 8px 0;
  line-height: 1.5;
}

.role-desc {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.help-text {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}
</style>