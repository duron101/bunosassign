<template>
  <div class="project-bonus-management">
    <div class="page-header">
      <h2>项目奖金池管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showCreatePoolDialog">
          <el-icon><Plus /></el-icon>
          创建奖金池
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
              v-for="project in allProjects"
              v-if="allProjects && allProjects.length > 0"
              :key="project._id"
              :label="project.name"
              :value="project._id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="期间">
          <el-select 
            v-model="queryForm.period" 
            placeholder="选择期间" 
            clearable 
            style="width: 120px"
            @change="handleSearch"
          >
            <el-option label="2024Q1" value="2024Q1" />
            <el-option label="2024Q2" value="2024Q2" />
            <el-option label="2024Q3" value="2024Q3" />
            <el-option label="2024Q4" value="2024Q4" />
            <el-option label="2025Q1" value="2025Q1" />
          </el-select>
        </el-form-item>

        <el-form-item label="状态">
          <el-select 
            v-model="queryForm.status" 
            placeholder="奖金池状态" 
            clearable 
            style="width: 120px"
            @change="handleSearch"
          >
            <el-option label="待审批" value="pending" />
            <el-option label="已审批" value="approved" />
            <el-option label="已分配" value="distributed" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 奖金池列表 -->
    <div class="table-section">
      <vxe-table
        ref="poolTable"
        :data="poolList"
        stripe
        border
        show-overflow="title"
        height="500"
      >
        <template #loading>
          <div v-if="loading" class="loading-overlay">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>加载中...</span>
          </div>
        </template>
        <vxe-column field="projectName" title="项目名称" width="200">
          <template #default="scope">
            <div v-if="scope?.row" class="project-info">
              <div class="project-name">{{ scope.row.projectName }}</div>
              <div class="project-code">{{ scope.row.projectCode }}</div>
            </div>
          </template>
        </vxe-column>

        <vxe-column field="period" title="奖金期间" width="100" />

        <vxe-column field="totalAmount" title="奖金总额" width="120">
          <template #default="scope">
            <span v-if="scope?.row" class="amount">{{ formatCurrency(scope.row.totalAmount) }}</span>
          </template>
        </vxe-column>

        <vxe-column field="profitRatio" title="利润分配比例" width="120">
          <template #default="scope">
            <span v-if="scope?.row?.profitRatio">{{ Math.round(scope.row.profitRatio * 100) }}%</span>
            <span v-else>-</span>
          </template>
        </vxe-column>

        <vxe-column field="memberCount" title="成员数量" width="100">
          <template #default="scope">
            <span v-if="scope?.row">{{ scope.row.memberCount || 0 }}人</span>
          </template>
        </vxe-column>

        <vxe-column field="averageBonus" title="平均奖金" width="120">
          <template #default="scope">
            <span v-if="scope?.row?.memberCount > 0" class="amount">
              {{ formatCurrency(scope.row.totalAmount / scope.row.memberCount) }}
            </span>
            <span v-else>-</span>
          </template>
        </vxe-column>

        <vxe-column field="status" title="状态" width="100">
          <template #default="scope">
            <el-tag v-if="scope?.row" :type="getStatusType(scope.row.status)" size="small">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </vxe-column>

        <vxe-column field="createdAt" title="创建时间" width="120">
          <template #default="scope">
            <span v-if="scope?.row">{{ formatDate(scope.row.createdAt) }}</span>
          </template>
        </vxe-column>

        <vxe-column title="操作" width="320" fixed="right">
          <template #default="scope">
            <div v-if="scope?.row">
              <!-- 编辑按钮 - 只有pending状态可以编辑 -->
              <el-button
                v-if="scope.row.status === 'pending'"
                type="primary"
                size="small"
                text
                @click="showEditDialog(scope.row)"
              >
                编辑
              </el-button>
              
              <!-- 删除按钮 - 只有pending状态可以删除 -->
              <el-button
                v-if="scope.row.status === 'pending'"
                type="danger"
                size="small"
                text
                @click="handleDelete(scope.row)"
              >
                删除
              </el-button>
              
              <el-button
                v-if="scope.row.status === 'pending'"
                type="primary"
                size="small"
                text
                @click="calculateBonus(scope.row)"
              >
                计算分配
              </el-button>
              <el-button
                v-if="scope.row.status === 'calculated'"
                type="success"
                size="small"
                text
                @click="approveBonus(scope.row)"
              >
                审批
              </el-button>
              <el-button
                size="small"
                text
                @click="viewDetails(scope.row)"
              >
                查看详情
              </el-button>
              <el-button
                v-if="scope.row.status === 'approved'"
                type="warning"
                size="small"
                text
                @click="exportReport(scope.row)"
              >
                导出
              </el-button>
            </div>
          </template>
        </vxe-column>
      </vxe-table>
    </div>

    <!-- 创建奖金池对话框 -->
    <el-dialog
      v-model="createPoolDialogVisible"
      title="创建项目奖金池"
      width="600px"
      @close="resetCreateForm"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createFormRules"
        label-width="100px"
      >
        <el-form-item label="选择项目" prop="projectId">
          <el-select
            v-model="createForm.projectId"
            placeholder="请选择项目"
            style="width: 100%"
            @change="handleProjectChange"
          >
            <el-option
              v-for="project in allProjects"
              v-if="allProjects && allProjects.length > 0"
              :key="project._id"
              :label="`${project.name} (${project.code})`"
              :value="project._id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="奖金期间" prop="period">
          <el-select
            v-model="createForm.period"
            placeholder="请选择奖金期间"
            style="width: 100%"
          >
            <el-option label="2024Q1" value="2024Q1" />
            <el-option label="2024Q2" value="2024Q2" />
            <el-option label="2024Q3" value="2024Q3" />
            <el-option label="2024Q4" value="2024Q4" />
            <el-option label="2025Q1" value="2025Q1" />
          </el-select>
        </el-form-item>

        <el-form-item label="项目利润" prop="projectProfit">
          <el-input-number
            v-model="createForm.projectProfit"
            :min="0"
            :max="10000000"
            :step="1000"
            placeholder="项目利润"
            style="width: 100%"
            @change="calculateTotalAmount"
          >
            <template #append>元</template>
          </el-input-number>
          <div class="help-text">该项目在指定期间内的利润总额</div>
        </el-form-item>

        <el-form-item label="分配比例" prop="profitRatio">
          <el-slider
            v-model="createForm.profitRatio"
            :min="5"
            :max="50"
            :step="1"
            show-stops
            show-input
            @change="calculateTotalAmount"
          />
          <div class="help-text">从项目利润中提取多少比例作为奖金池</div>
        </el-form-item>

        <el-form-item label="奖金总额" prop="totalAmount">
          <el-input-number
            v-model="createForm.totalAmount"
            :min="1000"
            :max="1000000"
            :step="1000"
            placeholder="奖金总额"
            style="width: 100%"
          >
            <template #append>元</template>
          </el-input-number>
          <div class="calculation-result">
            <span v-if="createForm.projectProfit && createForm.profitRatio">
              建议金额: {{ formatCurrency(createForm.projectProfit * createForm.profitRatio / 100) }}
            </span>
          </div>
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="createForm.remark"
            type="textarea"
            :rows="3"
            placeholder="奖金池创建的备注信息"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createPoolDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCreatePool" :loading="submitting">
            创建奖金池
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑奖金池对话框 -->
    <el-dialog
      v-model="editPoolDialogVisible"
      title="编辑项目奖金池"
      width="600px"
      @close="resetEditForm"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editFormRules"
        label-width="100px"
      >
        <!-- 项目信息（只读） -->
        <el-form-item label="项目名称">
          <el-input
            :value="editForm.projectName"
            readonly
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="奖金期间">
          <el-input
            :value="editForm.period"
            readonly
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="项目利润" prop="projectProfit">
          <el-input-number
            v-model="editForm.projectProfit"
            :min="0"
            :max="10000000"
            :step="1000"
            placeholder="项目利润"
            style="width: 100%"
            @change="calculateEditTotalAmount"
          >
            <template #append>元</template>
          </el-input-number>
          <div class="help-text">该项目在指定期间内的利润总额</div>
        </el-form-item>

        <el-form-item label="分配比例" prop="profitRatio">
          <el-slider
            v-model="editForm.profitRatio"
            :min="5"
            :max="50"
            :step="1"
            show-stops
            show-input
            @change="calculateEditTotalAmount"
          />
          <div class="help-text">从项目利润中提取多少比例作为奖金池</div>
        </el-form-item>

        <el-form-item label="奖金总额" prop="totalAmount">
          <el-input-number
            v-model="editForm.totalAmount"
            :min="1000"
            :max="1000000"
            :step="1000"
            placeholder="奖金总额"
            style="width: 100%"
          >
            <template #append>元</template>
          </el-input-number>
          <div class="calculation-result">
            <span v-if="editForm.projectProfit && editForm.profitRatio">
              建议金额: {{ formatCurrency(editForm.projectProfit * editForm.profitRatio / 100) }}
            </span>
          </div>
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
            placeholder="奖金池备注信息"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editPoolDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEditPool" :loading="submitting">
            保存修改
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 奖金分配详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="项目奖金分配详情"
      width="1000px"
    >
      <div v-if="selectedPool">
        <!-- 奖金池概况 -->
        <div class="pool-overview">
          <h4>奖金池概况</h4>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="项目名称">
              {{ selectedPool.projectName }}
            </el-descriptions-item>
            <el-descriptions-item label="奖金期间">
              {{ selectedPool.period }}
            </el-descriptions-item>
            <el-descriptions-item label="奖金总额">
              <span class="amount">{{ formatCurrency(selectedPool.totalAmount) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="成员数量">
              {{ selectedPool.memberCount }}人
            </el-descriptions-item>
            <el-descriptions-item label="平均奖金">
              <span class="amount">
                {{ formatCurrency(selectedPool.memberCount > 0 ? selectedPool.totalAmount / selectedPool.memberCount : 0) }}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusType(selectedPool.status)">
                {{ getStatusLabel(selectedPool.status) }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 成员分配列表 -->
        <div class="allocations-section" v-if="poolAllocations.length > 0">
          <h4>成员分配明细</h4>
          <vxe-table
            :data="poolAllocations"
            stripe
            border
            height="400"
          >
            <vxe-column field="employeeName" title="员工姓名" width="120" />
            <vxe-column field="roleName" title="项目角色" width="120" />
            <vxe-column field="roleWeight" title="角色权重" width="100">
              <template #default="scope">
                <span v-if="scope?.row">{{ scope.row.roleWeight?.toFixed(1) }}</span>
              </template>
            </vxe-column>
            <vxe-column field="performanceCoeff" title="绩效系数" width="100">
              <template #default="scope">
                <span v-if="scope?.row">{{ scope.row.performanceCoeff?.toFixed(2) }}</span>
              </template>
            </vxe-column>
            <vxe-column field="participationRatio" title="参与度" width="100">
              <template #default="scope">
                <span v-if="scope?.row">{{ Math.round((scope.row.participationRatio || 1) * 100) }}%</span>
              </template>
            </vxe-column>
            <vxe-column field="calculatedWeight" title="计算权重" width="100">
              <template #default="scope">
                <span v-if="scope?.row">{{ scope.row.calculatedWeight?.toFixed(3) }}</span>
              </template>
            </vxe-column>
            <vxe-column field="bonusAmount" title="奖金金额" width="120">
              <template #default="scope">
                <span v-if="scope?.row" class="amount">{{ formatCurrency(scope.row.bonusAmount) }}</span>
              </template>
            </vxe-column>
            <vxe-column field="status" title="状态" width="100">
              <template #default="scope">
                <el-tag v-if="scope?.row" :type="getStatusType(scope.row.status)" size="small">
                  {{ getStatusLabel(scope.row.status) }}
                </el-tag>
              </template>
            </vxe-column>
          </vxe-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Loading } from '@element-plus/icons-vue'
import { projectApi } from '@/api/project'
import { formatCurrency, formatDate } from '@/utils/format'
import * as projectBonusApi from '@/api/projectBonus'

// 数据定义
const loading = ref(false)
const submitting = ref(false)
const poolList = ref([])
const allProjects = ref([])

// 查询表单
const queryForm = reactive({
  projectId: '',
  period: '',
  status: ''
})

// 创建奖金池对话框
const createPoolDialogVisible = ref(false)
const createFormRef = ref()
const createForm = reactive({
  projectId: '',
  period: '',
  projectProfit: 0,
  profitRatio: 20,
  totalAmount: 0,
  remark: ''
})

const createFormRules = {
  projectId: [
    { required: true, message: '请选择项目', trigger: 'change' }
  ],
  period: [
    { required: true, message: '请选择奖金期间', trigger: 'change' }
  ],
  projectProfit: [
    { required: true, message: '请输入项目利润', trigger: 'blur' },
    { type: 'number', min: 0, message: '项目利润不能小于0', trigger: 'blur' }
  ],
  totalAmount: [
    { required: true, message: '请输入奖金总额', trigger: 'blur' },
    { type: 'number', min: 1000, message: '奖金总额不能小于1000元', trigger: 'blur' }
  ]
}

// 编辑奖金池对话框
const editPoolDialogVisible = ref(false)
const editFormRef = ref()
const editForm = reactive({
  _id: '',
  projectId: '',
  projectName: '',
  period: '',
  projectProfit: null,
  profitRatio: 20,
  totalAmount: null,
  description: ''
})

const editFormRules = {
  projectProfit: [
    { required: true, message: '项目利润不能为空', trigger: 'blur' },
    { type: 'number', min: 0, message: '项目利润不能小于0', trigger: 'blur' }
  ],
  profitRatio: [
    { required: true, message: '分配比例不能为空', trigger: 'blur' },
    { type: 'number', min: 5, max: 50, message: '分配比例应在5%-50%之间', trigger: 'blur' }
  ],
  totalAmount: [
    { required: true, message: '奖金总额不能为空', trigger: 'blur' },
    { type: 'number', min: 1000, message: '奖金总额不能小于1000元', trigger: 'blur' }
  ]
}

// 详情对话框
const detailDialogVisible = ref(false)
const selectedPool = ref(null)
const poolAllocations = ref([])

// 状态映射
const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    calculated: 'primary',
    approved: 'success',
    distributed: 'info'
  }
  return types[status] || 'info'
}

const getStatusLabel = (status) => {
  const labels = {
    pending: '待计算',
    calculated: '已计算',
    approved: '已审批',
    distributed: '已发放'
  }
  return labels[status] || '未知'
}

// 方法定义
const loadPoolList = async () => {
  try {
    loading.value = true
    
    const queryParams = {
      projectId: queryForm.projectId || undefined,
      period: queryForm.period || undefined,
      status: queryForm.status || undefined
    }
    
    const response = await projectBonusApi.getBonusPools(queryParams)
    poolList.value = response.data || []
    
    // 备用模拟数据（如果API失败）
    if (!response.data || response.data.length === 0) {
      // 模拟数据
    poolList.value = [
      {
        _id: '1',
        projectId: 'proj1',
        projectName: '电商平台升级',
        projectCode: 'PROJ001',
        period: '2024Q4',
        totalAmount: 100000,
        profitRatio: 0.2,
        memberCount: 8,
        status: 'pending',
        createdAt: new Date()
      }
    ]
  } catch (error) {
    ElMessage.error('加载奖金池列表失败: ' + error.message)
  } finally {
    loading.value = false
  }
}

const loadAllProjects = async () => {
  try {
    const response = await projectApi.getProjects()
    
    // 验证返回的数据格式
    if (response && response.data) {
      // 处理嵌套数据结构：response.data.projects 或 response.data
      const projectsData = response.data.projects || response.data
      
      if (Array.isArray(projectsData)) {
        // 过滤掉没有_id字段的项目，确保数据完整性
        allProjects.value = projectsData.filter(project => 
          project && project._id && typeof project._id === 'string' && project._id.trim() !== ''
        )
        
        console.log('✅ 项目列表加载成功，共', allProjects.value.length, '个项目')
      } else {
        console.warn('⚠️ 项目数据不是数组格式:', projectsData)
        allProjects.value = []
      }
    } else {
      console.warn('⚠️ API返回的数据格式不正确:', response)
      allProjects.value = []
    }
  } catch (error) {
    console.error('❌ 加载项目列表失败:', error)
    ElMessage.error('加载项目列表失败: ' + error.message)
    allProjects.value = []
  }
}

// 操作方法
const handleSearch = () => {
  loadPoolList()
}

const refreshList = () => {
  handleSearch()
}

const showCreatePoolDialog = () => {
  resetCreateForm()
  createPoolDialogVisible.value = true
}

const resetCreateForm = () => {
  Object.assign(createForm, {
    projectId: '',
    period: '',
    projectProfit: 0,
    profitRatio: 20,
    totalAmount: 0,
    remark: ''
  })
  createFormRef.value?.resetFields()
}

const handleProjectChange = (projectId) => {
  // 项目变更时可以加载该项目的历史利润数据
  console.log('Selected project:', projectId)
}

const calculateTotalAmount = () => {
  if (createForm.projectProfit && createForm.profitRatio) {
    createForm.totalAmount = Math.round(createForm.projectProfit * createForm.profitRatio / 100)
  }
}

const submitCreatePool = async () => {
  try {
    const valid = await createFormRef.value.validate()
    if (!valid) return

    submitting.value = true
    await projectBonusApi.createBonusPool({
      projectId: createForm.projectId,
      period: createForm.period,
      totalAmount: createForm.totalAmount,
      profitRatio: createForm.profitRatio / 100,
      remark: createForm.remark
    })

    ElMessage.success('奖金池创建成功')
    createPoolDialogVisible.value = false
    await loadPoolList()
    
  } catch (error) {
    ElMessage.error('创建失败: ' + error.message)
  } finally {
    submitting.value = false
  }
}

const calculateBonus = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要计算项目 "${row.projectName}" 的奖金分配吗？`,
      '计算奖金分配',
      { type: 'warning' }
    )

    await projectBonusApi.calculateBonus(row._id)
    ElMessage.success('奖金计算完成')
    await loadPoolList()
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('计算失败: ' + error.message)
    }
  }
}

const approveBonus = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要审批项目 "${row.projectName}" 的奖金分配吗？`,
      '审批奖金分配',
      { type: 'warning' }
    )

    await projectBonusApi.approveBonus(row._id)
    ElMessage.success('奖金分配已审批')
    await loadPoolList()
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('审批失败: ' + error.message)
    }
  }
}

const viewDetails = async (row) => {
  try {
    selectedPool.value = row
    // TODO: 加载分配详情
    // const response = await projectBonusApi.getBonusDetails(row.projectId, row.period)
    // poolAllocations.value = response.data.allocations || []
    
    // 模拟数据
    poolAllocations.value = [
      {
        employeeName: '张三',
        roleName: '技术负责人',
        roleWeight: 3.0,
        performanceCoeff: 1.1,
        participationRatio: 1.0,
        calculatedWeight: 3.3,
        bonusAmount: 25000,
        status: 'calculated'
      }
    ]
    
    detailDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取详情失败: ' + error.message)
  }
}

const exportReport = async (row) => {
  try {
    // TODO: 实现导出功能
    ElMessage.success('导出功能开发中')
  } catch (error) {
    ElMessage.error('导出失败: ' + error.message)
  }
}

// 显示编辑对话框
const showEditDialog = (row) => {
  // 复制数据到编辑表单
  Object.assign(editForm, {
    _id: row._id,
    projectId: row.projectId,
    projectName: row.projectName,
    period: row.period,
    projectProfit: row.projectProfit || (row.totalAmount / (row.profitRatio || 0.2)),
    profitRatio: (row.profitRatio || 0.2) * 100,
    totalAmount: row.totalAmount,
    description: row.description || ''
  })
  
  editPoolDialogVisible.value = true
}

// 重置编辑表单
const resetEditForm = () => {
  Object.assign(editForm, {
    _id: '',
    projectId: '',
    projectName: '',
    period: '',
    projectProfit: null,
    profitRatio: 20,
    totalAmount: null,
    description: ''
  })
  
  if (editFormRef.value) {
    editFormRef.value.resetFields()
  }
}

// 计算编辑表单的奖金总额
const calculateEditTotalAmount = () => {
  if (editForm.projectProfit && editForm.profitRatio) {
    editForm.totalAmount = Math.round(editForm.projectProfit * editForm.profitRatio / 100)
  }
}

// 提交编辑表单
const submitEditPool = async () => {
  if (!editFormRef.value) return
  
  try {
    await editFormRef.value.validate()
    
    submitting.value = true
    
    const updateData = {
      totalAmount: editForm.totalAmount,
      profitRatio: editForm.profitRatio / 100,
      description: editForm.description
    }
    
    // 调用编辑API
    await projectBonusApi.updateBonusPool(editForm._id, updateData)
    
    ElMessage.success('奖金池编辑成功')
    editPoolDialogVisible.value = false
    await loadPoolList()
    
  } catch (error) {
    if (error.message) {
      ElMessage.error('编辑失败: ' + error.message)
    }
  } finally {
    submitting.value = false
  }
}

// 删除奖金池
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除项目"${row.projectName}"在${row.period}期间的奖金池吗？\n` +
      `奖金总额：${formatCurrency(row.totalAmount)}\n` +
      `注意：此操作不可恢复！`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: false
      }
    )
    
    // 调用删除API
    await projectBonusApi.deleteBonusPool(row._id)
    
    ElMessage.success('奖金池删除成功')
    await loadPoolList()
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败: ' + (error.message || error))
    }
  }
}

// 生命周期
onMounted(async () => {
  await loadAllProjects()
  await loadPoolList()
})
</script>

<style scoped>
.project-bonus-management {
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

.project-info .project-name {
  font-weight: 500;
  color: #303133;
}

.project-info .project-code {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.amount {
  color: #67c23a;
  font-weight: 500;
}

.help-text {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
  line-height: 1.4;
}

.calculation-result {
  margin-top: 8px;
  font-size: 14px;
  color: #409eff;
}

.pool-overview {
  margin-bottom: 24px;
}

.pool-overview h4 {
  margin-bottom: 16px;
  color: #303133;
}

.allocations-section h4 {
  margin-bottom: 16px;
  color: #303133;
}
</style>