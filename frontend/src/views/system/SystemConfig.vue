<template>
  <div class="system-config">
    <div class="page-header">
      <h2>系统配置</h2>
      <div class="header-actions">
        <el-button type="primary" @click="saveAllConfigs" :loading="saving">
          <el-icon><Check /></el-icon>
          保存所有配置
        </el-button>
        <el-button @click="resetConfigs">
          <el-icon><RefreshLeft /></el-icon>
          重置配置
        </el-button>
      </div>
    </div>

    <!-- 配置分类导航 -->
    <el-card class="config-nav">
      <el-tabs v-model="activeCategory" @tab-change="handleCategoryChange">
        <el-tab-pane label="基础配置" name="basic">
          <el-icon><Setting /></el-icon>
        </el-tab-pane>
        <el-tab-pane label="奖金规则" name="bonus">
          <el-icon><Money /></el-icon>
        </el-tab-pane>
        <el-tab-pane label="计算参数" name="calculation">
          <el-icon><Operation /></el-icon>
        </el-tab-pane>
        <el-tab-pane label="通知设置" name="notification">
          <el-icon><Bell /></el-icon>
        </el-tab-pane>
        <el-tab-pane label="安全设置" name="security">
          <el-icon><Lock /></el-icon>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 基础配置 -->
    <div v-if="activeCategory === 'basic'" class="config-section">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card header="系统基本信息">
            <el-form :model="basicConfig" label-width="120px">
              <el-form-item label="系统名称">
                <el-input v-model="basicConfig.systemName" placeholder="请输入系统名称" />
              </el-form-item>
              <el-form-item label="公司名称">
                <el-input v-model="basicConfig.companyName" placeholder="请输入公司名称" />
              </el-form-item>
              <el-form-item label="系统版本">
                <el-input v-model="basicConfig.version" readonly />
              </el-form-item>
              <el-form-item label="时区设置">
                <el-select v-model="basicConfig.timezone" placeholder="请选择时区">
                  <el-option label="北京时间 (GMT+8)" value="Asia/Shanghai" />
                  <el-option label="纽约时间 (GMT-5)" value="America/New_York" />
                  <el-option label="伦敦时间 (GMT+0)" value="Europe/London" />
                  <el-option label="东京时间 (GMT+9)" value="Asia/Tokyo" />
                </el-select>
              </el-form-item>
              <el-form-item label="默认语言">
                <el-select v-model="basicConfig.language" placeholder="请选择语言">
                  <el-option label="简体中文" value="zh-CN" />
                  <el-option label="English" value="en-US" />
                </el-select>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card header="业务配置">
            <el-form :model="basicConfig" label-width="120px">
              <el-form-item label="财年开始月">
                <el-select v-model="basicConfig.fiscalYearStart" placeholder="请选择月份">
                  <el-option 
                    v-for="month in 12" 
                    :key="month" 
                    :label="`${month}月`" 
                    :value="month" 
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="奖金发放周期">
                <el-select v-model="basicConfig.bonusCycle" placeholder="请选择周期">
                  <el-option label="月度" value="monthly" />
                  <el-option label="季度" value="quarterly" />
                  <el-option label="年度" value="yearly" />
                </el-select>
              </el-form-item>
              <el-form-item label="默认货币">
                <el-select v-model="basicConfig.currency" placeholder="请选择货币">
                  <el-option label="人民币 (CNY)" value="CNY" />
                  <el-option label="美元 (USD)" value="USD" />
                  <el-option label="欧元 (EUR)" value="EUR" />
                </el-select>
              </el-form-item>
              <el-form-item label="小数位数">
                <el-input-number
                  v-model="basicConfig.decimalPlaces"
                  :min="0"
                  :max="4"
                  placeholder="小数位数"
                />
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 奖金规则配置 -->
    <div v-if="activeCategory === 'bonus'" class="config-section">
      <el-card header="奖金分配规则">
        <el-form :model="bonusConfig" label-width="160px">
          <el-divider content-position="left">三维模型权重</el-divider>
          
          <el-form-item label="利润贡献度权重">
            <el-slider
              v-model="bonusConfig.profitWeight"
              :min="0.1"
              :max="0.8"
              :step="0.05"
              :format-tooltip="val => `${(val * 100).toFixed(0)}%`"
              @change="normalizeWeights"
            />
            <div class="weight-value">{{ (bonusConfig.profitWeight * 100).toFixed(0) }}%</div>
          </el-form-item>
          
          <el-form-item label="岗位价值权重">
            <el-slider
              v-model="bonusConfig.positionWeight"
              :min="0.1"
              :max="0.8"
              :step="0.05"
              :format-tooltip="val => `${(val * 100).toFixed(0)}%`"
              @change="normalizeWeights"
            />
            <div class="weight-value">{{ (bonusConfig.positionWeight * 100).toFixed(0) }}%</div>
          </el-form-item>
          
          <el-form-item label="绩效表现权重">
            <el-slider
              v-model="bonusConfig.performanceWeight"
              :min="0.1"
              :max="0.8"
              :step="0.05"
              :format-tooltip="val => `${(val * 100).toFixed(0)}%`"
              @change="normalizeWeights"
            />
            <div class="weight-value">{{ (bonusConfig.performanceWeight * 100).toFixed(0) }}%</div>
          </el-form-item>
          
          <div class="weight-validation">
            <span :class="getWeightValidationClass()">
              总权重: {{ getTotalWeight() }}%
            </span>
          </div>

          <el-divider content-position="left">奖金池设置</el-divider>
          
          <el-form-item label="默认奖金池比例">
            <el-input-number
              v-model="bonusConfig.defaultPoolRatio"
              :min="0.05"
              :max="0.5"
              :step="0.01"
              :precision="3"
            />
            <span class="unit">（占总利润比例）</span>
          </el-form-item>
          
          <el-form-item label="储备金比例">
            <el-input-number
              v-model="bonusConfig.reserveRatio"
              :min="0.01"
              :max="0.1"
              :step="0.005"
              :precision="3"
            />
            <span class="unit">（占奖金池比例）</span>
          </el-form-item>
          
          <el-form-item label="特殊奖励比例">
            <el-input-number
              v-model="bonusConfig.specialRatio"
              :min="0.01"
              :max="0.1"
              :step="0.005"
              :precision="3"
            />
            <span class="unit">（占奖金池比例）</span>
          </el-form-item>

          <el-divider content-position="left">奖金限制</el-divider>
          
          <el-form-item label="最低奖金系数">
            <el-input-number
              v-model="bonusConfig.minBonusRatio"
              :min="0.1"
              :max="1.0"
              :step="0.1"
              :precision="1"
            />
            <span class="unit">倍</span>
          </el-form-item>
          
          <el-form-item label="最高奖金系数">
            <el-input-number
              v-model="bonusConfig.maxBonusRatio"
              :min="2.0"
              :max="10.0"
              :step="0.5"
              :precision="1"
            />
            <span class="unit">倍</span>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 计算参数配置 -->
    <div v-if="activeCategory === 'calculation'" class="config-section">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card header="计算算法设置">
            <el-form :model="calculationConfig" label-width="140px">
              <el-form-item label="默认算法">
                <el-select v-model="calculationConfig.defaultAlgorithm" placeholder="请选择算法">
                  <el-option label="基于得分算法" value="score-based" />
                  <el-option label="分层算法" value="tier-based" />
                  <el-option label="比例算法" value="percentage" />
                  <el-option label="固定金额算法" value="fixed" />
                  <el-option label="混合算法" value="hybrid" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="计算精度">
                <el-input-number
                  v-model="calculationConfig.precision"
                  :min="2"
                  :max="8"
                  placeholder="小数位数"
                />
              </el-form-item>
              
              <el-form-item label="舍入规则">
                <el-select v-model="calculationConfig.roundingRule" placeholder="请选择舍入规则">
                  <el-option label="四舍五入" value="round" />
                  <el-option label="向下取整" value="floor" />
                  <el-option label="向上取整" value="ceil" />
                  <el-option label="银行家舍入" value="banker" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="并发处理">
                <el-switch
                  v-model="calculationConfig.enableConcurrent"
                  active-text="启用"
                  inactive-text="禁用"
                />
              </el-form-item>
              
              <el-form-item label="最大线程数">
                <el-input-number
                  v-model="calculationConfig.maxThreads"
                  :min="1"
                  :max="16"
                  :disabled="!calculationConfig.enableConcurrent"
                />
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card header="数据处理设置">
            <el-form :model="calculationConfig" label-width="140px">
              <el-form-item label="批处理大小">
                <el-input-number
                  v-model="calculationConfig.batchSize"
                  :min="100"
                  :max="10000"
                  :step="100"
                />
                <span class="unit">条/批次</span>
              </el-form-item>
              
              <el-form-item label="超时时间">
                <el-input-number
                  v-model="calculationConfig.timeout"
                  :min="30"
                  :max="3600"
                  :step="30"
                />
                <span class="unit">秒</span>
              </el-form-item>
              
              <el-form-item label="重试次数">
                <el-input-number
                  v-model="calculationConfig.retryCount"
                  :min="0"
                  :max="5"
                />
              </el-form-item>
              
              <el-form-item label="缓存策略">
                <el-select v-model="calculationConfig.cacheStrategy" placeholder="请选择缓存策略">
                  <el-option label="不缓存" value="none" />
                  <el-option label="内存缓存" value="memory" />
                  <el-option label="Redis缓存" value="redis" />
                  <el-option label="文件缓存" value="file" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="缓存过期时间">
                <el-input-number
                  v-model="calculationConfig.cacheExpiry"
                  :min="60"
                  :max="86400"
                  :step="60"
                />
                <span class="unit">秒</span>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 通知设置 -->
    <div v-if="activeCategory === 'notification'" class="config-section">
      <el-card header="通知配置">
        <el-form :model="notificationConfig" label-width="160px">
          <el-divider content-position="left">邮件通知</el-divider>
          
          <el-form-item label="启用邮件通知">
            <el-switch
              v-model="notificationConfig.email.enabled"
              active-text="启用"
              inactive-text="禁用"
            />
          </el-form-item>
          
          <el-form-item label="SMTP服务器" v-if="notificationConfig.email.enabled">
            <el-input v-model="notificationConfig.email.smtpHost" placeholder="smtp.example.com" />
          </el-form-item>
          
          <el-form-item label="SMTP端口" v-if="notificationConfig.email.enabled">
            <el-input-number
              v-model="notificationConfig.email.smtpPort"
              :min="1"
              :max="65535"
            />
          </el-form-item>
          
          <el-form-item label="发送者邮箱" v-if="notificationConfig.email.enabled">
            <el-input v-model="notificationConfig.email.senderEmail" placeholder="noreply@company.com" />
          </el-form-item>
          
          <el-form-item label="通知场景" v-if="notificationConfig.email.enabled">
            <el-checkbox-group v-model="notificationConfig.email.events">
              <el-checkbox label="calculation_completed">计算完成</el-checkbox>
              <el-checkbox label="calculation_failed">计算失败</el-checkbox>
              <el-checkbox label="pool_created">奖金池创建</el-checkbox>
              <el-checkbox label="bonus_distributed">奖金发放</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-divider content-position="left">系统通知</el-divider>
          
          <el-form-item label="启用系统通知">
            <el-switch
              v-model="notificationConfig.system.enabled"
              active-text="启用"
              inactive-text="禁用"
            />
          </el-form-item>
          
          <el-form-item label="通知保留天数" v-if="notificationConfig.system.enabled">
            <el-input-number
              v-model="notificationConfig.system.retentionDays"
              :min="7"
              :max="365"
            />
            <span class="unit">天</span>
          </el-form-item>
          
          <el-form-item label="最大通知数量" v-if="notificationConfig.system.enabled">
            <el-input-number
              v-model="notificationConfig.system.maxCount"
              :min="100"
              :max="10000"
              :step="100"
            />
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 安全设置 -->
    <div v-if="activeCategory === 'security'" class="config-section">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card header="登录安全">
            <el-form :model="securityConfig" label-width="140px">
              <el-form-item label="密码最小长度">
                <el-input-number
                  v-model="securityConfig.password.minLength"
                  :min="6"
                  :max="32"
                />
              </el-form-item>
              
              <el-form-item label="密码复杂度">
                <el-checkbox-group v-model="securityConfig.password.requirements">
                  <el-checkbox label="uppercase">包含大写字母</el-checkbox>
                  <el-checkbox label="lowercase">包含小写字母</el-checkbox>
                  <el-checkbox label="number">包含数字</el-checkbox>
                  <el-checkbox label="special">包含特殊字符</el-checkbox>
                </el-checkbox-group>
              </el-form-item>
              
              <el-form-item label="密码有效期">
                <el-input-number
                  v-model="securityConfig.password.expireDays"
                  :min="0"
                  :max="365"
                />
                <span class="unit">天（0表示永不过期）</span>
              </el-form-item>
              
              <el-form-item label="登录失败限制">
                <el-input-number
                  v-model="securityConfig.login.maxFailures"
                  :min="3"
                  :max="10"
                />
                <span class="unit">次</span>
              </el-form-item>
              
              <el-form-item label="账户锁定时间">
                <el-input-number
                  v-model="securityConfig.login.lockoutDuration"
                  :min="5"
                  :max="1440"
                />
                <span class="unit">分钟</span>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card header="会话安全">
            <el-form :model="securityConfig" label-width="140px">
              <el-form-item label="会话超时时间">
                <el-input-number
                  v-model="securityConfig.session.timeout"
                  :min="30"
                  :max="1440"
                />
                <span class="unit">分钟</span>
              </el-form-item>
              
              <el-form-item label="记住登录">
                <el-switch
                  v-model="securityConfig.session.rememberMe"
                  active-text="允许"
                  inactive-text="禁止"
                />
              </el-form-item>
              
              <el-form-item label="单点登录">
                <el-switch
                  v-model="securityConfig.session.singleSignOn"
                  active-text="启用"
                  inactive-text="禁用"
                />
              </el-form-item>
              
              <el-form-item label="IP白名单">
                <el-switch
                  v-model="securityConfig.access.enableWhitelist"
                  active-text="启用"
                  inactive-text="禁用"
                />
              </el-form-item>
              
              <el-form-item label="API访问限制" v-if="securityConfig.access.enableWhitelist">
                <el-input
                  v-model="securityConfig.access.whitelist"
                  type="textarea"
                  rows="3"
                  placeholder="每行一个IP地址或IP段，如：192.168.1.1 或 192.168.1.0/24"
                />
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 配置预览和导入导出 -->
    <el-card class="config-actions" header="配置管理">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-button @click="exportConfigs" :loading="exporting">
            <el-icon><Download /></el-icon>
            导出配置
          </el-button>
          <el-button @click="showImportDialog">
            <el-icon><Upload /></el-icon>
            导入配置
          </el-button>
        </el-col>
        <el-col :span="8">
          <el-button @click="previewConfigs">
            <el-icon><View /></el-icon>
            预览配置
          </el-button>
          <el-button @click="validateConfigs">
            <el-icon><CircleCheck /></el-icon>
            验证配置
          </el-button>
        </el-col>
        <el-col :span="8">
          <el-button type="danger" @click="resetToDefaults">
            <el-icon><Delete /></el-icon>
            恢复默认
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 导入配置对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="导入配置"
      width="600px"
    >
      <el-upload
        class="upload-demo"
        drag
        :auto-upload="false"
        :on-change="handleFileChange"
        accept=".json"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          将配置文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            只能上传JSON格式的配置文件
          </div>
        </template>
      </el-upload>
      
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="importConfigs" :loading="importing">
          导入配置
        </el-button>
      </template>
    </el-dialog>

    <!-- 配置预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      title="配置预览"
      width="80%"
    >
      <el-input
        v-model="configPreview"
        type="textarea"
        :rows="20"
        readonly
        class="config-preview"
      />
      
      <template #footer>
        <el-button @click="previewDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="copyToClipboard">
          <el-icon><CopyDocument /></el-icon>
          复制配置
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Check, RefreshLeft, Setting, Money, Operation, Bell, Lock,
  Download, Upload, View, CircleCheck, Delete, UploadFilled, CopyDocument
} from '@element-plus/icons-vue'

// 响应式数据
const saving = ref(false)
const exporting = ref(false)
const importing = ref(false)
const activeCategory = ref('basic')
const importDialogVisible = ref(false)
const previewDialogVisible = ref(false)
const configPreview = ref('')
const uploadFile = ref(null)

// 基础配置
const basicConfig = reactive({
  systemName: '奖金模拟系统',
  companyName: '示例公司',
  version: 'v0.5.0',
  timezone: 'Asia/Shanghai',
  language: 'zh-CN',
  fiscalYearStart: 1,
  bonusCycle: 'quarterly',
  currency: 'CNY',
  decimalPlaces: 2
})

// 奖金规则配置
const bonusConfig = reactive({
  profitWeight: 0.4,
  positionWeight: 0.3,
  performanceWeight: 0.3,
  defaultPoolRatio: 0.15,
  reserveRatio: 0.02,
  specialRatio: 0.03,
  minBonusRatio: 0.8,
  maxBonusRatio: 3.0
})

// 计算参数配置
const calculationConfig = reactive({
  defaultAlgorithm: 'score-based',
  precision: 4,
  roundingRule: 'round',
  enableConcurrent: true,
  maxThreads: 4,
  batchSize: 1000,
  timeout: 300,
  retryCount: 3,
  cacheStrategy: 'memory',
  cacheExpiry: 3600
})

// 通知配置
const notificationConfig = reactive({
  email: {
    enabled: true,
    smtpHost: 'smtp.company.com',
    smtpPort: 587,
    senderEmail: 'noreply@company.com',
    events: ['calculation_completed', 'calculation_failed']
  },
  system: {
    enabled: true,
    retentionDays: 30,
    maxCount: 1000
  }
})

// 安全配置
const securityConfig = reactive({
  password: {
    minLength: 8,
    requirements: ['uppercase', 'lowercase', 'number', 'special'],
    expireDays: 90
  },
  login: {
    maxFailures: 5,
    lockoutDuration: 30
  },
  session: {
    timeout: 120,
    rememberMe: true,
    singleSignOn: false
  },
  access: {
    enableWhitelist: false,
    whitelist: ''
  }
})

// 计算属性
const getTotalWeight = () => {
  return ((bonusConfig.profitWeight + bonusConfig.positionWeight + bonusConfig.performanceWeight) * 100).toFixed(0)
}

const getWeightValidationClass = () => {
  const total = parseFloat(getTotalWeight())
  if (Math.abs(total - 100) < 1) return 'weight-valid'
  return 'weight-invalid'
}

// 方法
const normalizeWeights = () => {
  const total = bonusConfig.profitWeight + bonusConfig.positionWeight + bonusConfig.performanceWeight
  if (Math.abs(total - 1) > 0.01) {
    // 可以选择自动调整或提示用户
    console.log('权重总和不为100%，当前为：', (total * 100).toFixed(1) + '%')
  }
}

const handleCategoryChange = (category: string) => {
  console.log('切换到配置分类:', category)
}

const saveAllConfigs = async () => {
  saving.value = true
  try {
    // 验证配置
    if (Math.abs(bonusConfig.profitWeight + bonusConfig.positionWeight + bonusConfig.performanceWeight - 1) > 0.01) {
      ElMessage.error('三维模型权重总和必须为100%')
      return
    }

    // 模拟保存API调用
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    ElMessage.success('配置保存成功')
  } catch (error) {
    ElMessage.error('配置保存失败')
  } finally {
    saving.value = false
  }
}

const resetConfigs = async () => {
  try {
    await ElMessageBox.confirm('确定要重置所有配置吗？这将恢复到上次保存的状态。', '确认重置')
    
    // 重置到默认值
    Object.assign(bonusConfig, {
      profitWeight: 0.4,
      positionWeight: 0.3,
      performanceWeight: 0.3,
      defaultPoolRatio: 0.15,
      reserveRatio: 0.02,
      specialRatio: 0.03,
      minBonusRatio: 0.8,
      maxBonusRatio: 3.0
    })
    
    ElMessage.success('配置已重置')
  } catch (error) {
    // 用户取消操作
  }
}

const exportConfigs = async () => {
  exporting.value = true
  try {
    const configs = {
      basic: basicConfig,
      bonus: bonusConfig,
      calculation: calculationConfig,
      notification: notificationConfig,
      security: securityConfig,
      exportTime: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(configs, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `system-config-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    ElMessage.success('配置导出成功')
  } catch (error) {
    ElMessage.error('配置导出失败')
  } finally {
    exporting.value = false
  }
}

const showImportDialog = () => {
  importDialogVisible.value = true
}

const handleFileChange = (file: any) => {
  uploadFile.value = file.raw
}

const importConfigs = async () => {
  if (!uploadFile.value) {
    ElMessage.warning('请选择要导入的配置文件')
    return
  }
  
  importing.value = true
  try {
    const text = await uploadFile.value.text()
    const configs = JSON.parse(text)
    
    // 验证配置格式
    if (!configs.basic || !configs.bonus || !configs.calculation) {
      throw new Error('配置文件格式不正确')
    }
    
    // 导入配置
    Object.assign(basicConfig, configs.basic)
    Object.assign(bonusConfig, configs.bonus)
    Object.assign(calculationConfig, configs.calculation)
    Object.assign(notificationConfig, configs.notification)
    Object.assign(securityConfig, configs.security)
    
    ElMessage.success('配置导入成功')
    importDialogVisible.value = false
  } catch (error) {
    ElMessage.error('配置导入失败：' + error.message)
  } finally {
    importing.value = false
  }
}

const previewConfigs = () => {
  const configs = {
    basic: basicConfig,
    bonus: bonusConfig,
    calculation: calculationConfig,
    notification: notificationConfig,
    security: securityConfig
  }
  
  configPreview.value = JSON.stringify(configs, null, 2)
  previewDialogVisible.value = true
}

const validateConfigs = () => {
  const errors = []
  
  // 验证权重
  const totalWeight = bonusConfig.profitWeight + bonusConfig.positionWeight + bonusConfig.performanceWeight
  if (Math.abs(totalWeight - 1) > 0.01) {
    errors.push('三维模型权重总和必须为100%')
  }
  
  // 验证奖金比例
  if (bonusConfig.minBonusRatio >= bonusConfig.maxBonusRatio) {
    errors.push('最低奖金系数必须小于最高奖金系数')
  }
  
  // 验证邮件配置
  if (notificationConfig.email.enabled && !notificationConfig.email.smtpHost) {
    errors.push('启用邮件通知时必须配置SMTP服务器')
  }
  
  if (errors.length === 0) {
    ElMessage.success('配置验证通过')
  } else {
    ElMessage.error('配置验证失败：\n' + errors.join('\n'))
  }
}

const resetToDefaults = async () => {
  try {
    await ElMessageBox.confirm('确定要恢复所有配置到默认值吗？此操作不可撤销。', '确认重置', {
      type: 'warning'
    })
    
    // 恢复默认配置
    Object.assign(basicConfig, {
      systemName: '奖金模拟系统',
      companyName: '示例公司',
      timezone: 'Asia/Shanghai',
      language: 'zh-CN',
      fiscalYearStart: 1,
      bonusCycle: 'quarterly',
      currency: 'CNY',
      decimalPlaces: 2
    })
    
    Object.assign(bonusConfig, {
      profitWeight: 0.4,
      positionWeight: 0.3,
      performanceWeight: 0.3,
      defaultPoolRatio: 0.15,
      reserveRatio: 0.02,
      specialRatio: 0.03,
      minBonusRatio: 0.8,
      maxBonusRatio: 3.0
    })
    
    ElMessage.success('已恢复默认配置')
  } catch (error) {
    // 用户取消操作
  }
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(configPreview.value)
    ElMessage.success('配置已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}
</script>

<style scoped>
.system-config {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background: white;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.config-nav,
.config-actions {
  margin-bottom: 20px;
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.config-section {
  margin-bottom: 20px;
}

.config-section .el-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.weight-value {
  text-align: center;
  font-size: 14px;
  color: #409eff;
  font-weight: bold;
  margin-top: 8px;
}

.weight-validation {
  text-align: center;
  padding: 12px;
  margin: 16px 0;
  border-radius: 6px;
  background: #f8f9fa;
  font-size: 16px;
  font-weight: bold;
}

.weight-valid {
  color: #67c23a;
}

.weight-invalid {
  color: #f56c6c;
}

.unit {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}

.config-preview {
  font-family: 'Courier New', monospace;
  background: #f8f9fa;
}

.upload-demo {
  margin: 20px 0;
}

.el-upload__tip {
  margin-top: 8px;
  color: #606266;
  font-size: 12px;
}
</style>