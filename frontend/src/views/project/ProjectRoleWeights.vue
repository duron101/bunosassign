<template>
  <div class="project-role-weights">
    <div class="page-header">
      <h2>项目角色权重配置</h2>
      <div class="header-actions">
        <el-button 
          v-if="canUpdateWeights" 
          type="primary" 
          @click="saveWeights" 
          :loading="saving"
          :disabled="!selectedProjectId"
        >
          <el-icon><Check /></el-icon>
          保存配置
        </el-button>
        <el-button 
          v-if="canUpdateWeights" 
          @click="resetToDefault"
          :disabled="!selectedProjectId"
        >
          <el-icon><Refresh /></el-icon>
          重置默认
        </el-button>
        <el-tag v-if="!canUpdateWeights" type="info">只读模式</el-tag>
      </div>
    </div>

    <!-- 项目选择区域 -->
    <div class="project-selector">
      <el-form inline>
        <el-form-item label="选择项目">
          <el-select
            v-model="selectedProjectId"
            placeholder="请选择要配置的项目"
            style="width: 300px"
            @change="loadProjectWeights"
          >
            <el-option
              v-for="project in validProjects"
              :key="project._id"
              :label="`${project.name} (${project.code})`"
              :value="project._id"
            >
              <div class="project-option">
                <div class="project-name">{{ project.name }}</div>
                <div class="project-desc">{{ project.description }}</div>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
    </div>

    <template v-if="selectedProjectId">
      <!-- 权重配置面板 -->
      <div class="weights-panel">
        <div class="panel-header">
          <h3>角色权重配置</h3>
          <div class="weight-summary">
            <span>总权重比例: </span>
            <el-tag :type="getTotalWeightType()">{{ getTotalWeight().toFixed(1) }}</el-tag>
          </div>
        </div>

        <div class="weights-content">
          <div class="weights-grid">
            <div
              v-for="role in validRoles"
              :key="role._id"
              class="weight-item"
            >
              <div class="role-header">
                <div class="role-info">
                  <h4 class="role-name">{{ role.name }}</h4>
                  <p class="role-desc">{{ role.description }}</p>
                </div>
                <div class="role-weight-display">
                  <span class="weight-value">{{ (weights[role._id] || 1).toFixed(1) }}</span>
                </div>
              </div>

              <div class="weight-controls">
                <el-slider
                  v-model="weights[role._id]"
                  :min="0.1"
                  :max="5.0"
                  :step="0.1"
                  :disabled="!canUpdateWeights"
                  show-stops
                  style="margin: 10px 0;"
                  @change="updateWeight(role._id, $event)"
                />
                
                <div class="weight-input-group">
                  <el-input-number
                    v-model="weights[role._id]"
                    :min="0.1"
                    :max="5.0"
                    :precision="1"
                    :step="0.1"
                    :disabled="!canUpdateWeights"
                    size="small"
                    style="width: 100px"
                    @change="updateWeight(role._id, $event)"
                  />
                  <el-button
                    v-if="canUpdateWeights"
                    size="small"
                    text
                    @click="resetRoleWeight(role._id)"
                  >
                    重置
                  </el-button>
                </div>
              </div>

              <div class="weight-info">
                <div class="weight-level">
                  <el-tag :type="getWeightLevelType(weights[role._id])" size="small">
                    {{ getWeightLevelLabel(weights[role._id]) }}
                  </el-tag>
                </div>
                <div class="weight-percentage">
                  占比: {{ getWeightPercentage(role._id) }}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 预览面板 -->
      <div class="preview-panel">
        <div class="panel-header">
          <h3>奖金分配预览</h3>
          <div class="preview-controls">
            <el-input-number
              v-model="previewAmount"
              :min="1000"
              :max="1000000"
              :step="1000"
              placeholder="项目奖金总额"
              style="width: 150px"
              @change="updatePreview"
            >
              <template #prepend>总额</template>
              <template #append>元</template>
            </el-input-number>
          </div>
        </div>

        <div class="preview-content">
          <vxe-table
            :data="previewData"
            stripe
            border
            height="300"
          >
            <vxe-column field="roleName" title="角色名称" width="150" />
            <vxe-column field="weight" title="权重系数" width="100">
              <template #default="{ row }">
                {{ row.weight.toFixed(1) }}
              </template>
            </vxe-column>
            <vxe-column field="percentage" title="权重占比" width="100">
              <template #default="{ row }">
                {{ row.percentage }}%
              </template>
            </vxe-column>
            <vxe-column field="baseAmount" title="基础奖金" width="120">
              <template #default="{ row }">
                <span class="amount">{{ formatCurrency(row.baseAmount) }}</span>
              </template>
            </vxe-column>
            <vxe-column field="description" title="权重说明" show-overflow="tooltip" />
          </vxe-table>
        </div>
      </div>

      <!-- 权重模板 -->
      <div class="templates-panel">
        <div class="panel-header">
          <h3>权重模板</h3>
          <div class="template-actions">
            <el-button 
              v-if="canUpdateWeights" 
              size="small" 
              @click="saveAsTemplate"
              :disabled="!selectedProjectId"
            >
              保存为模板
            </el-button>
          </div>
        </div>

        <div class="templates-content">
          <el-row :gutter="20">
            <el-col :span="8" v-for="template in weightTemplates" :key="template.id">
              <div 
                class="template-card" 
                :class="{ disabled: !canUpdateWeights }"
                @click="canUpdateWeights && applyTemplate(template)"
              >
                <div class="template-header">
                  <h4>{{ template.name }}</h4>
                  <el-tag size="small">{{ template.type }}</el-tag>
                </div>
                <div class="template-weights">
                  <div
                    v-for="(weight, roleId) in template.weights"
                    :key="roleId"
                    class="template-weight-item"
                  >
                    <span class="role">{{ getRoleName(roleId) }}</span>
                    <span class="weight">{{ weight.toFixed(1) }}</span>
                  </div>
                </div>
                <div class="template-desc">{{ template.description }}</div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </template>

    <!-- 保存模板对话框 -->
    <el-dialog
      v-model="templateDialogVisible"
      title="保存权重模板"
      width="500px"
    >
      <el-form
        ref="templateFormRef"
        :model="templateForm"
        :rules="templateFormRules"
        label-width="80px"
      >
        <el-form-item label="模板名称" prop="name">
          <el-input
            v-model="templateForm.name"
            placeholder="请输入模板名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="模板类型" prop="type">
          <el-select v-model="templateForm.type" placeholder="请选择模板类型">
            <el-option label="技术团队" value="tech_team" />
            <el-option label="产品团队" value="product_team" />
            <el-option label="综合团队" value="mixed_team" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>

        <el-form-item label="模板描述">
          <el-input
            v-model="templateForm.description"
            type="textarea"
            :rows="3"
            placeholder="请描述此模板的适用场景"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="templateDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitTemplate" :loading="saving">
            保存模板
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, Refresh } from '@element-plus/icons-vue'
import { projectBonusApi, projectMemberApi } from '@/api/projectMember'
import { projectApi } from '@/api/project'
import { formatCurrency } from '@/utils/format'
import { useUserStore } from '@/store/modules/user'

// 数据定义
const loading = ref(false)
const saving = ref(false)
const selectedProjectId = ref('')
const myProjects = ref([])
const projectRoles = ref([])
const weights = reactive({})
const previewAmount = ref(100000)

// 用户权限管理
const userStore = useUserStore()

// 权限计算属性
const canViewWeights = computed(() => {
  return userStore.hasAnyPermission([
    'project:weights:view_own', 
    'project:weights:view_all', 
    'project:*', 
    '*'
  ])
})

const canUpdateWeights = computed(() => {
  return userStore.hasAnyPermission([
    'project:weights:update_own', 
    'project:weights:update_all', 
    'project:*', 
    '*'
  ])
})

const canUpdateAllWeights = computed(() => {
  return userStore.hasAnyPermission([
    'project:weights:update_all', 
    'project:*', 
    '*'
  ])
})

const canApproveWeights = computed(() => {
  return userStore.hasAnyPermission([
    'project:weights:approve', 
    'project:*', 
    '*'
  ])
})

// 计算属性：确保数据有效性
const validProjects = computed(() => {
  return myProjects.value.filter(project => project && project._id)
})

const validRoles = computed(() => {
  return projectRoles.value.filter(role => role && role._id)
})

// 预览数据
const previewData = computed(() => {
  if (!validRoles.value.length) return []
  
  const totalWeight = getTotalWeight()
  return validRoles.value.map(role => {
    const weight = weights[role._id] || 1
    const percentage = totalWeight > 0 ? ((weight / totalWeight) * 100).toFixed(1) : '0.0'
    const baseAmount = totalWeight > 0 ? (previewAmount.value * weight / totalWeight) : 0
    
    return {
      roleName: role.name,
      weight,
      percentage,
      baseAmount,
      description: getWeightDescription(weight)
    }
  })
})

// 模板相关
const templateDialogVisible = ref(false)
const templateFormRef = ref()
const templateForm = reactive({
  name: '',
  type: 'tech_team', // 设置默认值
  description: ''
})

const templateFormRules = {
  name: [
    { required: true, message: '请输入模板名称', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择模板类型', trigger: 'change' }
  ]
}

const weightTemplates = ref([
  {
    id: 1,
    name: '标准技术团队',
    type: '技术',
    description: '适用于以开发为主的技术项目',
    weights: {
      'tech_lead': 3.0,
      'senior_dev': 2.5,
      'developer': 2.0,
      'junior_dev': 1.5,
      'tester': 1.8,
      'devops': 2.0
    }
  },
  {
    id: 2,
    name: '产品导向团队',
    type: '产品',
    description: '适用于产品设计和用户体验重要的项目',
    weights: {
      'product_mgr': 2.8,
      'ui_designer': 2.3,
      'tech_lead': 2.5,
      'developer': 2.0,
      'tester': 1.8
    }
  },
  {
    id: 3,
    name: '均衡团队',
    type: '综合',
    description: '各角色权重相对均衡的配置',
    weights: {
      'tech_lead': 2.2,
      'senior_dev': 2.0,
      'developer': 1.8,
      'product_mgr': 2.0,
      'ui_designer': 1.8,
      'tester': 1.8
    }
  }
])

// 方法定义
const getTotalWeight = () => {
  return Object.values(weights).reduce((sum, weight) => sum + (weight || 0), 0)
}

const getTotalWeightType = () => {
  const total = getTotalWeight()
  if (total < 5) return 'warning'
  if (total > 15) return 'danger'
  return 'success'
}

const getWeightLevelType = (weight) => {
  if (weight >= 3.0) return 'danger'
  if (weight >= 2.0) return 'warning'
  if (weight >= 1.5) return 'success'
  return 'info'
}

const getWeightLevelLabel = (weight) => {
  if (weight >= 3.0) return '核心'
  if (weight >= 2.0) return '重要'
  if (weight >= 1.5) return '一般'
  return '辅助'
}

const getWeightPercentage = (roleId) => {
  const weight = weights[roleId] || 0
  const total = getTotalWeight()
  return total > 0 ? ((weight / total) * 100).toFixed(1) : '0.0'
}

const getWeightDescription = (weight) => {
  if (weight >= 3.0) return '核心角色，承担主要责任和风险'
  if (weight >= 2.5) return '高级角色，具有重要影响力'
  if (weight >= 2.0) return '重要角色，承担关键任务'
  if (weight >= 1.5) return '一般角色，参与日常工作'
  return '辅助角色，提供支持服务'
}

const getRoleName = (roleId) => {
  const role = projectRoles.value.find(r => r._id === roleId)
  return role ? role.name : roleId
}

// 数据加载
const loadMyProjects = async () => {
  try {
    console.log('🔄 正在加载我管理的项目列表...')
    const response = await projectApi.getProjects({ manager: true })
    console.log('📊 项目API响应:', response)
    
    // 处理后端返回的数据结构 { code: 200, data: { projects: [...] } }
    let projects = []
    if (response && response.data) {
      if (response.data.projects && Array.isArray(response.data.projects)) {
        // 后端标准响应格式：{ code: 200, data: { projects: [...] } }
        projects = response.data.projects
        console.log('✅ 使用标准响应格式加载项目')
      } else if (Array.isArray(response.data)) {
        // 直接数组格式：{ data: [...] }
        projects = response.data
        console.log('✅ 使用直接数组格式加载项目')
      }
    }
    
    // 过滤有效项目并设置到组件状态
    myProjects.value = projects.filter(project => project && project._id)
    console.log('✅ 成功加载项目列表:', myProjects.value.length, '个项目')
    console.log('📋 项目详情:', myProjects.value.map(p => ({ id: p._id, name: p.name, code: p.code })))
  } catch (error) {
    console.error('❌ 加载项目列表失败:', error)
    ElMessage.error('加载项目列表失败: ' + error.message)
    myProjects.value = []
  }
}

const loadProjectRoles = async () => {
  try {
    const response = await projectMemberApi.getProjectRoles()
    // 确保数据是数组并且每个角色都有有效的 _id
    if (response && response.data && Array.isArray(response.data)) {
      projectRoles.value = response.data.filter(role => role && role._id)
    } else {
      projectRoles.value = []
    }
    
    // 初始化权重
    projectRoles.value.forEach(role => {
      if (!weights[role._id]) {
        weights[role._id] = getDefaultWeight(role.code)
      }
    })
  } catch (error) {
    ElMessage.error('加载项目角色失败: ' + error.message)
    projectRoles.value = []
  }
}

const loadProjectWeights = async () => {
  if (!selectedProjectId.value) return

  try {
    const response = await projectBonusApi.getRoleWeights(selectedProjectId.value)
    if (response.data) {
      // 加载项目特定的权重配置
      Object.assign(weights, response.data)
    } else {
      // 使用默认权重
      resetToDefault()
    }
  } catch (error) {
    ElMessage.error('加载权重配置失败: ' + error.message)
    resetToDefault()
  }
}

const getDefaultWeight = (roleCode) => {
  const defaultWeights = {
    'tech_lead': 3.0,
    'senior_dev': 2.5,
    'developer': 2.0,
    'junior_dev': 1.5,
    'tester': 1.8,
    'product_mgr': 2.2,
    'ui_designer': 1.8,
    'devops': 2.0
  }
  return defaultWeights[roleCode] || 1.0
}

// 操作方法
const updateWeight = (roleId, value) => {
  weights[roleId] = value
  updatePreview()
}

const resetRoleWeight = (roleId) => {
  const role = projectRoles.value.find(r => r._id === roleId)
  if (role) {
    weights[roleId] = getDefaultWeight(role.code)
  }
}

const resetToDefault = () => {
  projectRoles.value.forEach(role => {
    weights[role._id] = getDefaultWeight(role.code)
  })
}

const updatePreview = () => {
  // 预览数据会自动更新，这里可以添加其他逻辑
}

const saveWeights = async () => {
  if (!selectedProjectId.value) {
    ElMessage.warning('请先选择项目')
    return
  }

  if (!canUpdateWeights.value) {
    ElMessage.warning('您没有权限修改项目角色权重配置')
    return
  }

  try {
    saving.value = true
    await projectBonusApi.setRoleWeights(selectedProjectId.value, { weights })
    ElMessage.success('权重配置保存成功')
  } catch (error) {
    if (error.response?.status === 403) {
      ElMessage.error('权限不足：您没有权限修改此项目的角色权重配置')
    } else {
      ElMessage.error('保存失败: ' + (error.response?.data?.message || error.message))
    }
  } finally {
    saving.value = false
  }
}

const applyTemplate = async (template) => {
  try {
    await ElMessageBox.confirm(
      `确定要应用 "${template.name}" 模板吗？这将覆盖当前的权重配置。`,
      '应用模板',
      { type: 'warning' }
    )

    Object.assign(weights, template.weights)
    ElMessage.success('模板应用成功')
    
  } catch (error) {
    // 用户取消
  }
}

const saveAsTemplate = () => {
  templateForm.name = ''
  templateForm.type = ''
  templateForm.description = ''
  templateDialogVisible.value = true
}

const submitTemplate = async () => {
  try {
    const valid = await templateFormRef.value.validate()
    if (!valid) return

    const newTemplate = {
      id: Date.now(),
      name: templateForm.name,
      type: templateForm.type,
      description: templateForm.description,
      weights: { ...weights }
    }

    weightTemplates.value.push(newTemplate)
    templateDialogVisible.value = false
    ElMessage.success('模板保存成功')
    
  } catch (error) {
    ElMessage.error('保存模板失败: ' + error.message)
  }
}

// 生命周期
onMounted(async () => {
  await loadProjectRoles()
  await loadMyProjects()
})
</script>

<style scoped>
.project-role-weights {
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

.project-selector {
  background: white;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.project-option .project-name {
  font-weight: 500;
}

.project-option .project-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.weights-panel,
.preview-panel,
.templates-panel {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 16px;
}

.panel-header h3 {
  margin: 0;
  color: #303133;
}

.weight-summary {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #606266;
}

.weights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.weight-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s;
}

.weight-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.role-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.role-name {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #303133;
}

.role-desc {
  margin: 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.role-weight-display {
  text-align: right;
}

.weight-value {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
}

.weight-input-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.weight-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  font-size: 12px;
}

.weight-percentage {
  color: #909399;
}

.preview-controls {
  display: flex;
  align-items: center;
}

.amount {
  color: #67c23a;
  font-weight: 500;
}

.templates-content {
  margin-top: 16px;
}

.template-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
  height: 200px;
  display: flex;
  flex-direction: column;
}

.template-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.template-header h4 {
  margin: 0;
  color: #303133;
}

.template-weights {
  flex: 1;
  margin-bottom: 12px;
}

.template-weight-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 12px;
}

.template-weight-item .role {
  color: #606266;
}

.template-weight-item .weight {
  color: #409eff;
  font-weight: 500;
}

.template-desc {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.template-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.template-card.disabled:hover {
  border-color: #ebeef5;
  box-shadow: none;
}
</style>