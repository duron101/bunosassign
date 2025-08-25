<template>
  <div class="bonus-calculation">
    <div class="page-header">
      <h2>奖金计算</h2>
      <div class="header-actions">
        <el-button 
          type="primary" 
          @click="showCreatePoolDialog"
          :disabled="calculating"
        >
          <el-icon><Plus /></el-icon>
          创建奖金池
        </el-button>
        <el-button 
          @click="refreshData"
          :loading="loading"
        >
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-title">奖金池总数</div>
          <div class="stat-number">{{ statistics.totalPools }}</div>
          <div class="stat-subtitle">已创建</div>
        </div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-title">总金额</div>
          <div class="stat-number">¥{{ formatNumber(statistics.totalAmount) }}</div>
          <div class="stat-subtitle">累计奖金池</div>
        </div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-title">已分配</div>
          <div class="stat-number">{{ statistics.allocatedPools }}</div>
          <div class="stat-subtitle">完成计算</div>
        </div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-title">受益人数</div>
          <div class="stat-number">{{ statistics.totalEmployees }}</div>
          <div class="stat-subtitle">参与员工</div>
        </div>
      </el-card>
    </div>

    <!-- 奖金池列表 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>奖金池列表</span>
          <div class="header-controls">
            <el-select 
              v-model="queryForm.status" 
              placeholder="筛选状态" 
              clearable
              style="width: 120px"
              @change="handleSearch"
            >
              <el-option label="草稿" value="draft" />
              <el-option label="已计算" value="calculated" />
              <el-option label="已分配" value="allocated" />
            </el-select>
          </div>
        </div>
      </template>

      <el-table
        :data="bonusPools"
        v-loading="loading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="period" label="计算周期" width="120" />
        <el-table-column label="公司利润" width="140">
          <template #default="{ row }">
            ¥{{ formatNumber(row.totalProfit) }}
          </template>
        </el-table-column>
        <el-table-column label="奖金池比例" width="100">
          <template #default="{ row }">
            {{ (row.poolRatio * 100).toFixed(1) }}%
          </template>
        </el-table-column>
        <el-table-column label="奖金池金额" width="140">
          <template #default="{ row }">
            ¥{{ formatNumber(row.poolAmount) }}
          </template>
        </el-table-column>
        <el-table-column label="可分配金额" width="140">
          <template #default="{ row }">
            ¥{{ formatNumber(row.distributableAmount) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              size="small" 
              @click="showCalculateDialog(row)"
              :disabled="calculating || row.status === 'allocated'"
            >
              {{ row.status === 'draft' ? '计算' : '重新计算' }}
            </el-button>
            <el-button 
              size="small" 
              @click="showResultDialog(row)"
              :disabled="row.status === 'draft'"
            >
              查看结果
            </el-button>
            <el-dropdown @command="(cmd) => handleMoreAction(cmd, row)">
              <el-button size="small">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit" :disabled="row.status === 'allocated'">
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item command="copy">复制</el-dropdown-item>
                  <el-dropdown-item command="export" :disabled="row.status === 'draft'">
                    导出结果
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 创建奖金池对话框 -->
    <el-dialog
      v-model="createPoolVisible"
      title="创建奖金池"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="poolFormRef"
        :model="poolForm"
        :rules="poolFormRules"
        label-width="120px"
      >
        <el-form-item label="计算周期" prop="period">
          <el-input 
            v-model="poolForm.period" 
            placeholder="例如：2025-Q1, 2025-H1"
          />
        </el-form-item>
        <el-form-item label="公司总利润" prop="totalProfit">
          <el-input-number
            v-model="poolForm.totalProfit"
            :min="0"
            :precision="2"
            style="width: 100%"
            controls-position="right"
          />
        </el-form-item>
        <el-form-item label="奖金池比例" prop="poolRatio">
          <el-slider
            v-model="poolForm.poolRatio"
            :min="0.05"
            :max="0.3"
            :step="0.01"
            :format-tooltip="(val) => `${(val * 100).toFixed(1)}%`"
            style="width: 80%; margin-right: 20px"
          />
          <span>{{ (poolForm.poolRatio * 100).toFixed(1) }}%</span>
        </el-form-item>
        <el-form-item label="预留调节金" prop="reserveRatio">
          <el-slider
            v-model="poolForm.reserveRatio"
            :min="0"
            :max="0.1"
            :step="0.005"
            :format-tooltip="(val) => `${(val * 100).toFixed(2)}%`"
            style="width: 80%; margin-right: 20px"
          />
          <span>{{ (poolForm.reserveRatio * 100).toFixed(2) }}%</span>
        </el-form-item>
        <el-form-item label="CEO特别奖励" prop="specialRatio">
          <el-slider
            v-model="poolForm.specialRatio"
            :min="0"
            :max="0.1"
            :step="0.005"
            :format-tooltip="(val) => `${(val * 100).toFixed(2)}%`"
            style="width: 80%; margin-right: 20px"
          />
          <span>{{ (poolForm.specialRatio * 100).toFixed(2) }}%</span>
        </el-form-item>
        
        <!-- 计算预览 -->
        <el-divider content-position="left">计算预览</el-divider>
        <div class="calculation-preview">
          <div class="preview-item">
            <span>奖金池总额：</span>
            <strong>¥{{ formatNumber(poolForm.totalProfit * poolForm.poolRatio) }}</strong>
          </div>
          <div class="preview-item">
            <span>预留调节金：</span>
            <span>¥{{ formatNumber(poolForm.totalProfit * poolForm.poolRatio * poolForm.reserveRatio) }}</span>
          </div>
          <div class="preview-item">
            <span>CEO特别奖励：</span>
            <span>¥{{ formatNumber(poolForm.totalProfit * poolForm.poolRatio * poolForm.specialRatio) }}</span>
          </div>
          <div class="preview-item highlight">
            <span>可分配金额：</span>
            <strong>¥{{ formatNumber(poolForm.totalProfit * poolForm.poolRatio * (1 - poolForm.reserveRatio - poolForm.specialRatio)) }}</strong>
          </div>
        </div>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="createPoolVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleCreatePool"
            :loading="submitting"
          >
            创建
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 计算参数对话框 -->
    <el-dialog
      v-model="calculateVisible"
      title="奖金计算参数"
      width="800px"
      :close-on-click-modal="false"
    >
      <div v-if="currentPool">
        <div class="pool-info">
          <h4>奖金池信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="计算周期">{{ currentPool.period }}</el-descriptions-item>
            <el-descriptions-item label="可分配金额">¥{{ formatNumber(currentPool.distributableAmount) }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <el-divider />

        <el-form
          ref="calculateFormRef"
          :model="calculateForm"
          label-width="120px"
        >
          <h4>计算方式</h4>
          <el-form-item label="计算模式">
            <el-radio-group v-model="calculateForm.mode">
              <el-radio label="full">全员计算</el-radio>
              <el-radio label="department">按部门计算</el-radio>
              <el-radio label="line">按业务线计算</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item 
            v-if="calculateForm.mode === 'department'" 
            label="选择部门"
          >
            <el-select 
              v-model="calculateForm.departments" 
              multiple 
              placeholder="请选择部门"
              style="width: 100%"
            >
              <el-option
                v-for="dept in departments"
                :key="dept.id"
                :label="dept.name"
                :value="dept.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item 
            v-if="calculateForm.mode === 'line'" 
            label="选择业务线"
          >
            <el-select 
              v-model="calculateForm.businessLines" 
              multiple 
              placeholder="请选择业务线"
              style="width: 100%"
            >
              <el-option
                v-for="line in businessLines"
                :key="line.id"
                :label="line.name"
                :value="line.id"
              />
            </el-select>
          </el-form-item>

          <h4>高级选项</h4>
          <el-form-item label="最低分数阈值">
            <el-input-number
              v-model="calculateForm.minScoreThreshold"
              :min="0"
              :max="1"
              :step="0.1"
              :precision="2"
            />
          </el-form-item>
          
          <el-form-item label="是否模拟">
            <el-switch v-model="calculateForm.simulation" />
            <span class="form-item-help">模拟模式下不会保存结果</span>
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="calculateVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleCalculate"
            :loading="calculating"
          >
            {{ calculateForm.simulation ? '开始模拟' : '开始计算' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 计算进度对话框 -->
    <el-dialog
      v-model="progressVisible"
      title="计算进度"
      width="500px"
      :close-on-click-modal="false"
      :show-close="false"
    >
      <div class="progress-content">
        <el-progress 
          :percentage="progress.percentage" 
          :status="progress.status"
          stroke-width="8"
        />
        <p class="progress-text">{{ progress.text }}</p>
        <div class="progress-details" v-if="progress.details">
          <p v-for="detail in progress.details" :key="detail">{{ detail }}</p>
        </div>
      </div>

      <template #footer v-if="progress.status === 'success'">
        <div class="dialog-footer">
          <el-button @click="progressVisible = false">关闭</el-button>
          <el-button 
            type="primary" 
            @click="viewCalculationResult"
          >
            查看结果
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 计算结果对话框 -->
    <el-dialog
      v-model="resultVisible"
      title="计算结果"
      width="900px"
      :close-on-click-modal="false"
    >
      <div v-if="calculationResult">
        <!-- 结果汇总 -->
        <div class="result-summary">
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="summary-item">
                <div class="summary-number">{{ calculationResult.summary.totalEmployees }}</div>
                <div class="summary-label">参与员工</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="summary-item">
                <div class="summary-number">¥{{ formatNumber(calculationResult.summary.totalBonus) }}</div>
                <div class="summary-label">总奖金</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="summary-item">
                <div class="summary-number">¥{{ formatNumber(calculationResult.summary.averageBonus) }}</div>
                <div class="summary-label">平均奖金</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="summary-item">
                <div class="summary-number">{{ ((calculationResult.summary.totalBonus / currentPool?.distributableAmount) * 100).toFixed(1) }}%</div>
                <div class="summary-label">分配比例</div>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 条线统计 -->
        <el-divider content-position="left">条线分布</el-divider>
        <el-table :data="calculationResult.lineStats" stripe>
          <el-table-column prop="lineName" label="业务线" />
          <el-table-column prop="employees" label="员工数量" />
          <el-table-column label="总奖金">
            <template #default="{ row }">
              ¥{{ formatNumber(row.totalBonus) }}
            </template>
          </el-table-column>
          <el-table-column label="平均奖金">
            <template #default="{ row }">
              ¥{{ formatNumber(row.averageBonus) }}
            </template>
          </el-table-column>
          <el-table-column label="占比">
            <template #default="{ row }">
              {{ ((row.totalBonus / calculationResult.summary.totalBonus) * 100).toFixed(1) }}%
            </template>
          </el-table-column>
        </el-table>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="resultVisible = false">关闭</el-button>
          <el-button 
            type="primary" 
            @click="exportResult"
            :loading="exporting"
          >
            导出结果
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, ArrowDown } from '@element-plus/icons-vue'
import { businessLineApi } from '@/api/businessLine'
import { departmentApi } from '@/api/department'
import type { BusinessLine } from '@/types/businessLine'
import type { Department } from '@/api/department'

// 响应式数据
const loading = ref(false)
const calculating = ref(false)
const submitting = ref(false)
const exporting = ref(false)

const bonusPools = ref<any[]>([])
const selectedPools = ref<any[]>([])
const departments = ref<Department[]>([])
const businessLines = ref<BusinessLine[]>([])

// 统计数据
const statistics = reactive({
  totalPools: 0,
  totalAmount: 0,
  allocatedPools: 0,
  totalEmployees: 0
})

// 查询表单
const queryForm = reactive({
  status: undefined
})

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 对话框状态
const createPoolVisible = ref(false)
const calculateVisible = ref(false)
const progressVisible = ref(false)
const resultVisible = ref(false)

const currentPool = ref(null)
const calculationResult = ref(null)

// 表单
const poolFormRef = ref()
const calculateFormRef = ref()

const poolForm = reactive({
  period: '',
  totalProfit: 10000000,
  poolRatio: 0.15,
  reserveRatio: 0.02,
  specialRatio: 0.03
})

const calculateForm = reactive({
  mode: 'full',
  departments: [],
  businessLines: [],
  minScoreThreshold: 0,
  simulation: false
})

// 进度
const progress = reactive({
  percentage: 0,
  status: '',
  text: '',
  details: []
})

// 表单验证规则
const poolFormRules = {
  period: [
    { required: true, message: '请输入计算周期', trigger: 'blur' }
  ],
  totalProfit: [
    { required: true, message: '请输入公司总利润', trigger: 'blur' },
    { type: 'number', min: 0, message: '利润不能为负数', trigger: 'blur' }
  ]
}

// 工具函数
const formatNumber = (num: number) => {
  return new Intl.NumberFormat('zh-CN').format(num || 0)
}

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleString('zh-CN')
}

const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    draft: 'info',
    calculated: 'warning',
    allocated: 'success'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    draft: '草稿',
    calculated: '已计算',
    allocated: '已分配'
  }
  return statusMap[status] || status
}

// 数据加载
const loadBonusPools = async () => {
  loading.value = true
  try {
    // 模拟数据
    bonusPools.value = [
      {
        id: 1,
        period: '2025-Q1',
        totalProfit: 10000000,
        poolRatio: 0.15,
        poolAmount: 1500000,
        reserveRatio: 0.02,
        specialRatio: 0.03,
        distributableAmount: 1425000,
        status: 'draft',
        createdAt: new Date().toISOString()
      }
    ]
    
    // 更新统计
    statistics.totalPools = bonusPools.value.length
    statistics.totalAmount = bonusPools.value.reduce((sum, pool) => sum + pool.poolAmount, 0)
    statistics.allocatedPools = bonusPools.value.filter(pool => pool.status === 'allocated').length
    statistics.totalEmployees = 150
    
  } catch (error) {
    ElMessage.error('加载奖金池列表失败')
  } finally {
    loading.value = false
  }
}

const loadBasicData = async () => {
  try {
    console.log('🔄 正在加载基础数据...')
    
    // 加载业务线数据
    const businessLinesResponse = await businessLineApi.getBusinessLines({ 
      pageSize: 100, 
      status: 1 
    })
    
    if (businessLinesResponse && businessLinesResponse.data) {
      businessLines.value = businessLinesResponse.data.businessLines || []
      console.log('✅ 成功加载业务线数据:', businessLines.value.length, '个业务线')
    }
    
    // 加载部门数据
    const departmentsResponse = await departmentApi.getDepartmentOptions({ 
      status: 1 
    })
    
    if (departmentsResponse && departmentsResponse.data) {
      departments.value = departmentsResponse.data.departments || []
      console.log('✅ 成功加载部门数据:', departments.value.length, '个部门')
    }
    
    console.log('✅ 基础数据加载完成')
    
  } catch (error) {
    console.error('❌ 加载基础数据失败:', error)
    ElMessage.error('加载基础数据失败: ' + (error.response?.data?.message || error.message))
    
    // 设置空数组作为默认值
    businessLines.value = []
    departments.value = []
  }
}

// 事件处理
const refreshData = () => {
  loadBonusPools()
}

const handleSearch = () => {
  loadBonusPools()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  loadBonusPools()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  loadBonusPools()
}

const handleSelectionChange = (selection) => {
  selectedPools.value = selection
}

const showCreatePoolDialog = () => {
  // 重置表单
  Object.assign(poolForm, {
    period: '',
    totalProfit: 10000000,
    poolRatio: 0.15,
    reserveRatio: 0.02,
    specialRatio: 0.03
  })
  createPoolVisible.value = true
}

const handleCreatePool = async () => {
  if (!poolFormRef.value) return
  
  try {
    await poolFormRef.value.validate()
    submitting.value = true
    
    // 调用API创建奖金池
    console.log('创建奖金池:', poolForm)
    
    ElMessage.success('奖金池创建成功')
    createPoolVisible.value = false
    loadBonusPools()
    
  } catch (error) {
    console.error('创建奖金池失败:', error)
    ElMessage.error('创建失败')
  } finally {
    submitting.value = false
  }
}

const showCalculateDialog = (pool) => {
  currentPool.value = pool
  Object.assign(calculateForm, {
    mode: 'full',
    departments: [],
    businessLines: [],
    minScoreThreshold: 0,
    simulation: false
  })
  calculateVisible.value = true
}

const handleCalculate = async () => {
  calculating.value = true
  calculateVisible.value = false
  progressVisible.value = true
  
  try {
    // 重置进度
    Object.assign(progress, {
      percentage: 0,
      status: 'active',
      text: '准备计算...',
      details: []
    })
    
    // 模拟计算进度
    const steps = [
      { percentage: 20, text: '加载员工数据...', details: ['获取员工列表', '验证员工信息'] },
      { percentage: 40, text: '执行三维评估...', details: ['计算利润贡献度', '评估岗位价值', '统计绩效表现'] },
      { percentage: 60, text: '应用分配规则...', details: ['按业务线分配', '应用权重系数'] },
      { percentage: 80, text: '计算个人奖金...', details: ['基础奖金计算', '卓越贡献奖励'] },
      { percentage: 100, text: '计算完成', details: ['保存计算结果', '生成统计报告'] }
    ]
    
    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      Object.assign(progress, step)
    }
    
    progress.status = 'success'
    
    // 设置模拟结果
    calculationResult.value = {
      summary: {
        totalEmployees: 150,
        totalBonus: 1350000,
        averageBonus: 9000,
        maxBonus: 45000,
        minBonus: 3000
      },
      lineStats: [
        { lineName: '实施', employees: 80, totalBonus: 742500, averageBonus: 9281 },
        { lineName: '售前', employees: 30, totalBonus: 270000, averageBonus: 9000 },
        { lineName: '市场', employees: 25, totalBonus: 202500, averageBonus: 8100 },
        { lineName: '运营', employees: 15, totalBonus: 135000, averageBonus: 9000 }
      ]
    }
    
  } catch (error) {
    progress.status = 'exception'
    progress.text = '计算失败'
    ElMessage.error('计算失败')
  } finally {
    calculating.value = false
  }
}

const viewCalculationResult = () => {
  progressVisible.value = false
  resultVisible.value = true
}

const showResultDialog = (pool) => {
  currentPool.value = pool
  // 这里应该加载真实的计算结果
  calculationResult.value = {
    summary: {
      totalEmployees: 150,
      totalBonus: 1350000,
      averageBonus: 9000,
      maxBonus: 45000,
      minBonus: 3000
    },
    lineStats: [
      { lineName: '实施', employees: 80, totalBonus: 742500, averageBonus: 9281 },
      { lineName: '售前', employees: 30, totalBonus: 270000, averageBonus: 9000 },
      { lineName: '市场', employees: 25, totalBonus: 202500, averageBonus: 8100 },
      { lineName: '运营', employees: 15, totalBonus: 135000, averageBonus: 9000 }
    ]
  }
  resultVisible.value = true
}

const exportResult = async () => {
  exporting.value = true
  try {
    // 导出逻辑
    ElMessage.success('导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}

const handleMoreAction = async (command, pool) => {
  switch (command) {
    case 'edit':
      // 编辑奖金池
      break
    case 'copy':
      // 复制奖金池
      break
    case 'export':
      // 导出结果
      break
    case 'delete':
      try {
        await ElMessageBox.confirm(
          `确定要删除奖金池 ${pool.period} 吗？删除后将无法恢复。`,
          '确认删除',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        ElMessage.success('删除成功')
        loadBonusPools()
      } catch (error) {
        // 用户取消
      }
      break
  }
}

// 页面加载时初始化数据
onMounted(() => {
  loadBonusPools()
  loadBasicData()
})
</script>

<style scoped>
.bonus-calculation {
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

.header-actions {
  display: flex;
  gap: 12px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 8px;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-content {
  text-align: center;
}

.stat-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 4px;
}

.stat-subtitle {
  font-size: 12px;
  color: #999;
}

.table-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.calculation-preview {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 6px;
  margin-top: 16px;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.preview-item.highlight {
  font-size: 16px;
  font-weight: bold;
  border-top: 1px solid #ddd;
  padding-top: 8px;
  margin-top: 8px;
}

.form-item-help {
  font-size: 12px;
  color: #999;
  margin-left: 8px;
}

.pool-info {
  margin-bottom: 20px;
}

.progress-content {
  text-align: center;
  padding: 20px 0;
}

.progress-text {
  margin: 16px 0 8px;
  font-size: 14px;
  color: #666;
}

.progress-details {
  margin-top: 16px;
  font-size: 12px;
  color: #999;
}

.result-summary {
  margin-bottom: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.summary-item {
  text-align: center;
}

.summary-number {
  font-size: 20px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 4px;
}

.summary-label {
  font-size: 14px;
  color: #666;
}
</style>