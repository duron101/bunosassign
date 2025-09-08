<template>
  <div class="career-path-template-manager">
    <div class="manager-header">
      <h3>职业路径模板管理</h3>
      <div class="header-actions">
        <el-button type="primary" @click="showAddTemplateDialog">
          <el-icon><Plus /></el-icon>
          新增模板
        </el-button>
        <el-button @click="showImportDialog">
          <el-icon><Upload /></el-icon>
          导入模板
        </el-button>
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <div class="manager-content">
      <!-- 左侧筛选和模板列表 -->
      <div class="left-panel">
        <el-card class="filter-card">
          <template #header>
            <span>筛选条件</span>
          </template>
          
          <el-form :model="filterForm" label-width="80px">
            <el-form-item label="职级">
              <el-select v-model="filterForm.level" placeholder="请选择职级" clearable style="width: 100%">
                <el-option label="P3" value="P3" />
                <el-option label="P4" value="P4" />
                <el-option label="P5" value="P5" />
                <el-option label="P6" value="P6" />
                <el-option label="M1" value="M1" />
                <el-option label="M2" value="M2" />
                <el-option label="M3" value="M3" />
                <el-option label="M4" value="M4" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="岗位类别">
              <el-select v-model="filterForm.category" placeholder="请选择岗位类别" clearable style="width: 100%">
                <el-option label="技术研发" value="tech" />
                <el-option label="项目管理" value="management" />
                <el-option label="售前业务" value="presale" />
                <el-option label="技术管理" value="tech-management" />
                <el-option label="综合运营" value="comprehensive-ops" />
                <el-option label="市场商务" value="market-business" />
                <el-option label="业务支持" value="support" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="状态">
              <el-select v-model="filterForm.status" placeholder="请选择状态" clearable style="width: 100%">
                <el-option label="启用" value="active" />
                <el-option label="禁用" value="inactive" />
                <el-option label="草稿" value="draft" />
              </el-select>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="handleFilter" block>筛选</el-button>
            </el-form-item>
            
            <el-form-item>
              <el-button @click="handleResetFilter" block>重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
        
        <el-card class="templates-card">
          <template #header">
            <div class="card-header">
              <span>模板列表</span>
              <el-button type="text" @click="showAddTemplateDialog">
                <el-icon><Plus /></el-icon>
                新增
              </el-button>
            </div>
          </template>
          
          <div class="templates-list">
            <div
              v-for="template in filteredTemplates"
              :key="template.id"
              class="template-item"
              :class="{ 'active': selectedTemplate?.id === template.id }"
              @click="selectTemplate(template)"
            >
              <div class="template-header">
                <h4>{{ template.name }}</h4>
                <el-tag :type="getStatusTagType(template.status)" size="small">
                  {{ getStatusLabel(template.status) }}
                </el-tag>
              </div>
              
              <div class="template-info">
                <p><strong>职级：</strong>{{ template.level }}</p>
                <p><strong>类别：</strong>{{ template.category }}</p>
                <p><strong>版本：</strong>{{ template.version }}</p>
                <p><strong>使用次数：</strong>{{ template.usageCount }}</p>
              </div>
              
              <div class="template-actions">
                <el-button type="text" size="small" @click.stop="editTemplate(template)">
                  编辑
                </el-button>
                <el-button type="text" size="small" @click.stop="copyTemplate(template)">
                  复制
                </el-button>
                <el-button type="text" size="small" @click.stop="deleteTemplate(template)">
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 右侧模板详情和路径可视化 -->
      <div class="right-panel">
        <el-card class="detail-card">
          <template #header>
            <span>{{ selectedTemplate ? `${selectedTemplate.name} - 模板详情` : '请选择模板' }}</span>
          </template>
          
          <div v-if="selectedTemplate" class="template-detail">
            <!-- 基本信息 -->
            <el-descriptions :column="2" border>
              <el-descriptions-item label="模板名称">{{ selectedTemplate.name }}</el-descriptions-item>
              <el-descriptions-item label="模板代码">{{ selectedTemplate.code }}</el-descriptions-item>
              <el-descriptions-item label="适用职级">{{ selectedTemplate.level }}</el-descriptions-item>
              <el-descriptions-item label="岗位类别">{{ selectedTemplate.category }}</el-descriptions-item>
              <el-descriptions-item label="版本号">{{ selectedTemplate.version }}</el-descriptions-item>
              <el-descriptions-item label="使用次数">{{ selectedTemplate.usageCount }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="getStatusTagType(selectedTemplate.status)">
                  {{ getStatusLabel(selectedTemplate.status) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="是否默认">
                <el-tag :type="selectedTemplate.isDefault ? 'success' : 'info'">
                  {{ selectedTemplate.isDefault ? '是' : '否' }}
                </el-tag>
              </el-descriptions-item>
            </el-descriptions>
            
            <!-- 职业路径可视化 -->
            <el-divider content-position="left">职业发展路径</el-divider>
            <div class="career-path-visualization">
              <div class="path-node current">
                <div class="node-content">
                  <h4>{{ selectedTemplate.level }}</h4>
                  <p>{{ selectedTemplate.category }}</p>
                </div>
                <div class="node-arrow">↓</div>
              </div>
              
              <div class="path-node next">
                <div class="node-content">
                  <h4>{{ selectedTemplate.careerPath.nextLevel }}</h4>
                  <p>预计{{ selectedTemplate.careerPath.estimatedTime }}</p>
                </div>
              </div>
              
              <!-- 横向发展 -->
              <div class="lateral-moves">
                <h5>横向发展</h5>
                <div class="moves-grid">
                  <div
                    v-for="move in selectedTemplate.careerPath.lateralMoves"
                    :key="move"
                    class="move-item"
                  >
                    {{ move }}
                  </div>
                </div>
              </div>
              
              <!-- 专业方向 -->
              <div class="specializations">
                <h5>专业方向</h5>
                <div class="specs-grid">
                  <div
                    v-for="spec in selectedTemplate.careerPath.specializations"
                    :key="spec"
                    class="spec-item"
                  >
                    {{ spec }}
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 技能发展路径 -->
            <el-divider content-position="left">技能发展路径</el-divider>
            <div class="skill-development">
              <div class="skill-section">
                <h5>核心技能</h5>
                <div class="skill-tags">
                  <el-tag
                    v-for="skill in selectedTemplate.skillDevelopment.coreSkills"
                    :key="skill"
                    type="primary"
                    size="small"
                  >
                    {{ skill }}
                  </el-tag>
                </div>
              </div>
              
              <div class="skill-section">
                <h5>进阶技能</h5>
                <div class="skill-tags">
                  <el-tag
                    v-for="skill in selectedTemplate.skillDevelopment.advancedSkills"
                    :key="skill"
                    type="success"
                    size="small"
                  >
                    {{ skill }}
                  </el-tag>
                </div>
              </div>
              
              <div class="skill-section">
                <h5>领导力技能</h5>
                <div class="skill-tags">
                  <el-tag
                    v-for="skill in selectedTemplate.skillDevelopment.leadershipSkills"
                    :key="skill"
                    type="warning"
                    size="small"
                  >
                    {{ skill }}
                  </el-tag>
                </div>
              </div>
            </div>
            
            <!-- 晋升要求 -->
            <el-divider content-position="left">晋升要求</el-divider>
            <div class="promotion-requirements">
              <el-row :gutter="20">
                <el-col :span="12">
                  <h5>基础要求</h5>
                  <ul>
                    <li>最低经验：{{ selectedTemplate.careerPath.requirements.minExperience }}</li>
                    <li>技能评估：{{ selectedTemplate.careerPath.requirements.skillAssessment }}</li>
                    <li>项目贡献：{{ selectedTemplate.careerPath.requirements.projectContribution }}</li>
                  </ul>
                </el-col>
                <el-col :span="12">
                  <h5>学习路径</h5>
                  <ul>
                    <li v-for="course in selectedTemplate.skillDevelopment.learningPath.courses" :key="course">
                      {{ course }}
                    </li>
                  </ul>
                </el-col>
              </el-row>
            </div>
          </div>
          
          <div v-else class="no-selection">
            <el-empty description="请从左侧选择模板查看详情" />
          </div>
        </el-card>
      </div>
    </div>

    <!-- 新增/编辑模板对话框 -->
    <el-dialog
      v-model="templateDialogVisible"
      :title="isEditTemplate ? '编辑职业路径模板' : '新增职业路径模板'"
      width="80%"
      :before-close="handleCloseTemplateDialog"
      top="5vh"
    >
      <el-form :model="templateForm" :rules="templateRules" ref="templateFormRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="模板名称" prop="name">
              <el-input v-model="templateForm.name" placeholder="请输入模板名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="模板代码" prop="code">
              <el-input v-model="templateForm.code" placeholder="请输入模板代码" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="适用职级" prop="level">
              <el-select v-model="templateForm.level" placeholder="请选择职级" style="width: 100%">
                <el-option label="P3" value="P3" />
                <el-option label="P4" value="P4" />
                <el-option label="P5" value="P5" />
                <el-option label="P6" value="P6" />
                <el-option label="M1" value="M1" />
                <el-option label="M2" value="M2" />
                <el-option label="M3" value="M3" />
                <el-option label="M4" value="M4" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="岗位类别" prop="category">
              <el-select v-model="templateForm.category" placeholder="请选择岗位类别" style="width: 100%">
                <el-option label="技术研发" value="tech" />
                <el-option label="项目管理" value="management" />
                <el-option label="售前业务" value="presale" />
                <el-option label="技术管理" value="tech-management" />
                <el-option label="综合运营" value="comprehensive-ops" />
                <el-option label="市场商务" value="market-business" />
                <el-option label="业务支持" value="support" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="版本号" prop="version">
              <el-input v-model="templateForm.version" placeholder="请输入版本号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select v-model="templateForm.status" placeholder="请选择状态" style="width: 100%">
                <el-option label="草稿" value="draft" />
                <el-option label="启用" value="active" />
                <el-option label="禁用" value="inactive" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="模板描述" prop="description">
          <el-input
            v-model="templateForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入模板描述"
          />
        </el-form-item>
        
        <!-- 职业路径配置 -->
        <el-divider content-position="left">职业路径配置</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="下一级别" prop="careerPath.nextLevel">
              <el-input v-model="templateForm.careerPath.nextLevel" placeholder="请输入下一级别岗位" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预计时间" prop="careerPath.estimatedTime">
              <el-input v-model="templateForm.careerPath.estimatedTime" placeholder="请输入预计晋升时间" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="横向发展" prop="careerPath.lateralMoves">
          <el-select
            v-model="templateForm.careerPath.lateralMoves"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请输入横向发展岗位，按回车确认"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="专业方向" prop="careerPath.specializations">
          <el-select
            v-model="templateForm.careerPath.specializations"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请输入专业方向，按回车确认"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="成长领域" prop="careerPath.growthAreas">
          <el-select
            v-model="templateForm.careerPath.growthAreas"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请输入成长领域，按回车确认"
            style="width: 100%"
          />
        </el-form-item>
        
        <!-- 晋升要求配置 -->
        <el-divider content-position="left">晋升要求配置</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最低经验" prop="careerPath.requirements.minExperience">
              <el-input v-model="templateForm.careerPath.requirements.minExperience" placeholder="请输入最低经验要求" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="技能评估" prop="careerPath.requirements.skillAssessment">
              <el-input v-model="templateForm.careerPath.requirements.skillAssessment" placeholder="请输入技能评估要求" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="项目贡献" prop="careerPath.requirements.projectContribution">
              <el-input v-model="templateForm.careerPath.requirements.projectContribution" placeholder="请输入项目贡献要求" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="绩效等级" prop="careerPath.requirements.performanceLevel">
              <el-input v-model="templateForm.careerPath.requirements.performanceLevel" placeholder="请输入绩效等级要求" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 技能发展配置 -->
        <el-divider content-position="left">技能发展配置</el-divider>
        <el-form-item label="核心技能" prop="skillDevelopment.coreSkills">
          <el-select
            v-model="templateForm.skillDevelopment.coreSkills"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请输入核心技能，按回车确认"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="进阶技能" prop="skillDevelopment.advancedSkills">
          <el-select
            v-model="templateForm.skillDevelopment.advancedSkills"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请输入进阶技能，按回车确认"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="领导力技能" prop="skillDevelopment.leadershipSkills">
          <el-select
            v-model="templateForm.skillDevelopment.leadershipSkills"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请输入领导力技能，按回车确认"
            style="width: 100%"
          />
        </el-form-item>
        
        <!-- 学习路径配置 -->
        <el-divider content-position="left">学习路径配置</el-divider>
        <el-form-item label="推荐课程" prop="skillDevelopment.learningPath.courses">
          <el-select
            v-model="templateForm.skillDevelopment.learningPath.courses"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请输入推荐课程，按回车确认"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="推荐认证" prop="skillDevelopment.learningPath.certifications">
          <el-select
            v-model="templateForm.skillDevelopment.learningPath.certifications"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请输入推荐认证，按回车确认"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="推荐项目" prop="skillDevelopment.learningPath.projects">
          <el-select
            v-model="templateForm.skillDevelopment.learningPath.projects"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请输入推荐项目，按回车确认"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="其他设置">
          <el-checkbox v-model="templateForm.isDefault">设为默认模板</el-checkbox>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="templateDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitTemplateForm">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 导入模板对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="导入职业路径模板"
      width="600px"
      :before-close="handleCloseImportDialog"
    >
      <el-upload
        class="upload-demo"
        drag
        accept=".xlsx,.xls,.json"
        :before-upload="handleFileUpload"
        :show-file-list="false"
      >
        <el-icon class="el-icon--upload"><Upload /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持 xlsx、xls、json 格式文件，且不超过10MB
          </div>
        </template>
      </el-upload>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="importDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmImport">确认导入</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Upload } from '@element-plus/icons-vue'

// 职业路径模板数据结构
interface CareerPathTemplate {
  id: string
  name: string
  code: string
  level: string
  category: string
  description: string
  version: string
  isActive: boolean
  isDefault: boolean
  usageCount: number
  status: 'draft' | 'active' | 'inactive'
  
  careerPath: {
    nextLevel: string
    estimatedTime: string
    lateralMoves: string[]
    specializations: string[]
    growthAreas: string[]
    requirements: {
      minExperience: string
      skillAssessment: string
      projectContribution: string
      performanceLevel: string
    }
  }
  
  skillDevelopment: {
    coreSkills: string[]
    advancedSkills: string[]
    leadershipSkills: string[]
    learningPath: {
      courses: string[]
      certifications: string[]
      projects: string[]
    }
  }
  
  createdAt: string
  updatedAt: string
}

// 响应式数据
const loading = ref(false)
const careerPathTemplates = ref<CareerPathTemplate[]>([])
const selectedTemplate = ref<CareerPathTemplate | null>(null)

// 筛选表单
const filterForm = reactive({
  level: '',
  category: '',
  status: ''
})

// 对话框状态
const templateDialogVisible = ref(false)
const importDialogVisible = ref(false)
const isEditTemplate = ref(false)

// 模板表单
const templateForm = reactive({
  id: '',
  name: '',
  code: '',
  level: '',
  category: '',
  description: '',
  version: '1.0.0',
  status: 'draft' as 'draft' | 'active' | 'inactive',
  isDefault: false,
  
  careerPath: {
    nextLevel: '',
    estimatedTime: '',
    lateralMoves: [] as string[],
    specializations: [] as string[],
    growthAreas: [] as string[],
    requirements: {
      minExperience: '',
      skillAssessment: '',
      projectContribution: '',
      performanceLevel: ''
    }
  },
  
  skillDevelopment: {
    coreSkills: [] as string[],
    advancedSkills: [] as string[],
    leadershipSkills: [] as string[],
    learningPath: {
      courses: [] as string[],
      certifications: [] as string[],
      projects: [] as string[]
    }
  }
})

// 表单验证规则
const templateRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入模板代码', trigger: 'blur' }],
  level: [{ required: true, message: '请选择适用职级', trigger: 'change' }],
  category: [{ required: true, message: '请选择岗位类别', trigger: 'change' }],
  version: [{ required: true, message: '请输入版本号', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

// 计算属性
const filteredTemplates = computed(() => {
  let templates = careerPathTemplates.value
  
  if (filterForm.level) {
    templates = templates.filter(template => template.level === filterForm.level)
  }
  
  if (filterForm.category) {
    templates = templates.filter(template => template.category === filterForm.category)
  }
  
  if (filterForm.status) {
    templates = templates.filter(template => template.status === filterForm.status)
  }
  
  return templates
})

// 方法
const refreshData = async () => {
  loading.value = true
  try {
    // TODO: 调用API获取数据
    // const response = await careerPathTemplateApi.getTemplates()
    // careerPathTemplates.value = response.data
    
    // 模拟数据
    careerPathTemplates.value = [
      {
        id: '1',
        name: 'P3技术工程师发展路径',
        code: 'P3_TECH_ENGINEER',
        level: 'P3',
        category: 'tech',
        description: 'P3技术工程师的职业发展路径模板',
        version: '1.0.0',
        isActive: true,
        isDefault: true,
        usageCount: 15,
        status: 'active',
        
        careerPath: {
          nextLevel: 'P4高级工程师',
          estimatedTime: '2-3年',
          lateralMoves: ['产品经理', '项目经理'],
          specializations: ['前端开发', '后端开发', '移动开发'],
          growthAreas: ['技术深度', '业务理解', '团队协作'],
          requirements: {
            minExperience: '2年以上',
            skillAssessment: '通过技术考核',
            projectContribution: '主导过2个以上项目',
            performanceLevel: 'B级及以上'
          }
        },
        
        skillDevelopment: {
          coreSkills: ['编程语言', '框架使用', '数据库操作'],
          advancedSkills: ['架构设计', '性能优化', '安全防护'],
          leadershipSkills: ['技术指导', '代码审查', '技术分享'],
          learningPath: {
            courses: ['高级编程技术', '软件架构设计', '性能优化实践'],
            certifications: ['相关技术认证', '项目管理认证'],
            projects: ['开源项目贡献', '技术博客写作']
          }
        },
        
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      }
    ]
    
    ElMessage.success('数据刷新成功')
  } catch (error) {
    ElMessage.error('数据刷新失败')
  } finally {
    loading.value = false
  }
}

const handleFilter = () => {
  // 筛选逻辑已在计算属性中实现
}

const handleResetFilter = () => {
  Object.assign(filterForm, {
    level: '',
    category: '',
    status: ''
  })
}

const selectTemplate = (template: CareerPathTemplate) => {
  selectedTemplate.value = template
}

const showAddTemplateDialog = () => {
  isEditTemplate.value = false
  resetTemplateForm()
  templateDialogVisible.value = true
}

const editTemplate = (template: CareerPathTemplate) => {
  isEditTemplate.value = true
  Object.assign(templateForm, template)
  templateDialogVisible.value = true
}

const copyTemplate = async (template: CareerPathTemplate) => {
  try {
    // TODO: 调用API复制模板
    // await careerPathTemplateApi.copyTemplate(template.id)
    
    ElMessage.success('模板复制成功')
    await refreshData()
  } catch (error) {
    ElMessage.error('模板复制失败')
  }
}

const deleteTemplate = async (template: CareerPathTemplate) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除模板"${template.name}"吗？删除后将无法恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // TODO: 调用API删除模板
    // await careerPathTemplateApi.deleteTemplate(template.id)
    
    ElMessage.success('模板删除成功')
    await refreshData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除模板失败')
    }
  }
}

const handleCloseTemplateDialog = () => {
  templateDialogVisible.value = false
  resetTemplateForm()
}

const resetTemplateForm = () => {
  Object.assign(templateForm, {
    id: '',
    name: '',
    code: '',
    level: '',
    category: '',
    description: '',
    version: '1.0.0',
    status: 'draft',
    isDefault: false,
    
    careerPath: {
      nextLevel: '',
      estimatedTime: '',
      lateralMoves: [],
      specializations: [],
      growthAreas: [],
      requirements: {
        minExperience: '',
        skillAssessment: '',
        projectContribution: '',
        performanceLevel: ''
      }
    },
    
    skillDevelopment: {
      coreSkills: [],
      advancedSkills: [],
      leadershipSkills: [],
      learningPath: {
        courses: [],
        certifications: [],
        projects: []
      }
    }
  })
}

const submitTemplateForm = async () => {
  try {
    // TODO: 调用API保存模板
    // if (isEditTemplate.value) {
    //   await careerPathTemplateApi.updateTemplate(templateForm.id, templateForm)
    // } else {
    //   await careerPathTemplateApi.createTemplate(templateForm)
    // }
    
    ElMessage.success(isEditTemplate.value ? '模板更新成功' : '模板创建成功')
    templateDialogVisible.value = false
    await refreshData()
  } catch (error) {
    ElMessage.error(isEditTemplate.value ? '更新模板失败' : '创建模板失败')
  }
}

const showImportDialog = () => {
  importDialogVisible.value = true
}

const handleCloseImportDialog = () => {
  importDialogVisible.value = false
}

const handleFileUpload = (file: File) => {
  const isValidFormat = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/json'
  ].includes(file.type)
  
  const isValidSize = file.size / 1024 / 1024 < 10
  
  if (!isValidFormat) {
    ElMessage.error('上传文件只能是 xlsx、xls 或 json 格式!')
    return false
  }
  
  if (!isValidSize) {
    ElMessage.error('上传文件大小不能超过 10MB!')
    return false
  }
  
  return true
}

const confirmImport = () => {
  ElMessage.info('模板导入功能开发中...')
  importDialogVisible.value = false
}

// 工具方法
const getStatusTagType = (status: string) => {
  const typeMap = {
    'draft': 'info',
    'active': 'success',
    'inactive': 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusLabel = (status: string) => {
  const labelMap = {
    'draft': '草稿',
    'active': '启用',
    'inactive': '禁用'
  }
  return labelMap[status] || status
}

// 生命周期
onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.career-path-template-manager {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 20px;
}

.manager-header h3 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.manager-content {
  flex: 1;
  display: flex;
  gap: 20px;
  padding: 0 20px;
  overflow: hidden;
}

.left-panel {
  flex: 0 0 400px;
}

.right-panel {
  flex: 1;
}

.filter-card,
.templates-card,
.detail-card {
  height: 100%;
}

.templates-card {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.templates-list {
  max-height: 500px;
  overflow-y: auto;
}

.template-item {
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.template-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.template-item.active {
  border-color: #409eff;
  background-color: #f0f9ff;
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
  font-size: 16px;
}

.template-info {
  margin-bottom: 12px;
}

.template-info p {
  margin: 4px 0;
  font-size: 14px;
  color: #606266;
}

.template-actions {
  display: none;
  gap: 8px;
}

.template-item:hover .template-actions {
  display: flex;
}

.template-detail {
  padding: 20px 0;
}

.career-path-visualization {
  margin: 20px 0;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.path-node {
  text-align: center;
  margin-bottom: 20px;
}

.path-node.current {
  background-color: #e6f7ff;
  padding: 20px;
  border-radius: 8px;
  border: 2px solid #409eff;
}

.path-node.next {
  background-color: #f6ffed;
  padding: 20px;
  border-radius: 8px;
  border: 2px solid #52c41a;
}

.node-content h4 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 18px;
}

.node-content p {
  margin: 0;
  color: #606266;
}

.node-arrow {
  font-size: 24px;
  color: #409eff;
  margin: 10px 0;
}

.lateral-moves,
.specializations {
  margin-top: 20px;
}

.lateral-moves h5,
.specializations h5 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 16px;
}

.moves-grid,
.specs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.move-item,
.spec-item {
  padding: 8px 12px;
  background-color: #f0f9ff;
  border: 1px solid #b3d8ff;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
  color: #409eff;
}

.skill-development {
  margin: 20px 0;
}

.skill-section {
  margin-bottom: 20px;
}

.skill-section h5 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 16px;
  border-bottom: 2px solid #409eff;
  padding-bottom: 4px;
}

.skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.promotion-requirements {
  margin: 20px 0;
}

.promotion-requirements h5 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 16px;
  border-bottom: 2px solid #409eff;
  padding-bottom: 4px;
}

.promotion-requirements ul {
  margin: 0;
  padding-left: 20px;
}

.promotion-requirements li {
  margin-bottom: 8px;
  color: #606266;
  line-height: 1.6;
}

.no-selection {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .manager-content {
    flex-direction: column;
  }
  
  .left-panel {
    flex: none;
    height: 400px;
  }
}
</style>
