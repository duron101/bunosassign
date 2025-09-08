<template>
  <div class="position-detail">
    <div class="page-header">
      <el-button @click="goBack" icon="ArrowLeft">返回</el-button>
      <h2>{{ position?.name || '岗位详情' }}</h2>
    </div>

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>

    <div v-else-if="position" class="detail-content">
      <!-- 页面操作栏 -->
      <div class="page-actions" v-if="hasEditPermission">
        <el-button type="primary" @click="showEditDialog">
          <el-icon><Edit /></el-icon>
          编辑岗位信息
        </el-button>
        <el-button type="success" @click="showTemplateDialog">
          <el-icon><CopyDocument /></el-icon>
          保存为模板
        </el-button>
        <el-button type="warning" @click="applyTemplate">
          <el-icon><Document /></el-icon>
          应用模板
        </el-button>
      </div>

      <!-- 基本信息 -->
      <el-card class="basic-info-card">
        <template #header>
          <div class="card-header">
            <span>基本信息</span>
            <div class="header-actions">
              <el-tag v-if="position.status === 1" type="success">启用</el-tag>
              <el-tag v-else type="danger">禁用</el-tag>
              <el-button 
                v-if="hasEditPermission" 
                type="text" 
                size="small" 
                @click="editBasicInfo"
              >
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
            </div>
          </div>
        </template>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="info-item">
              <label>岗位名称：</label>
              <span>{{ position.name }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <label>岗位代码：</label>
              <span>{{ position.code }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <label>职级：</label>
              <el-tag :type="getLevelTagType(position.level)">
                {{ position.level }}
              </el-tag>
            </div>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="info-item">
              <label>业务线：</label>
              <span>{{ position.businessLine?.name || '无' }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <label>基准值：</label>
              <span>{{ position.benchmarkValue }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="info-item">
              <label>创建时间：</label>
              <span>{{ formatDate(position.createdAt) }}</span>
            </div>
          </el-col>
        </el-row>
        
        <div v-if="position.description" class="description-section">
          <label>岗位描述：</label>
          <p>{{ position.description }}</p>
        </div>
      </el-card>

      <!-- 能力要求 -->
      <el-card class="requirements-card" v-if="positionRequirements">
        <template #header>
          <div class="card-header">
            <span>能力要求</span>
            <el-button 
              v-if="hasEditPermission" 
              type="text" 
              size="small" 
              @click="editRequirements"
            >
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
          </div>
        </template>
        
        <el-row :gutter="20">
          <!-- 基础要求 -->
          <el-col :span="12">
            <div class="requirement-section">
              <h4>基础要求</h4>
              <div class="requirement-item">
                <label>学历要求：</label>
                <span>{{ positionRequirements.basicRequirements?.education || '无要求' }}</span>
              </div>
              <div class="requirement-item">
                <label>工作经验：</label>
                <span>{{ positionRequirements.basicRequirements?.experience || '无要求' }}</span>
              </div>
              <div class="requirement-item">
                <label>年龄要求：</label>
                <span>{{ positionRequirements.basicRequirements?.age || '无要求' }}</span>
              </div>
              <div class="requirement-item">
                <label>专业背景：</label>
                <span>{{ positionRequirements.basicRequirements?.major || '无要求' }}</span>
              </div>
              <div class="requirement-item" v-if="positionRequirements.basicRequirements?.certificates?.length">
                <label>相关证书：</label>
                <div class="certificate-tags">
                  <el-tag
                    v-for="cert in positionRequirements.basicRequirements.certificates"
                    :key="cert"
                    size="small"
                    type="info"
                  >
                    {{ cert }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-col>
          
          <!-- 专业技能 -->
          <el-col :span="12">
            <div class="requirement-section">
              <h4>专业技能</h4>
              <div class="requirement-item" v-if="positionRequirements.professionalSkills?.simulationSkills?.length">
                <label>仿真技能：</label>
                <div class="skill-tags">
                  <el-tag
                    v-for="skill in positionRequirements.professionalSkills.simulationSkills"
                    :key="skill"
                    size="small"
                    type="primary"
                  >
                    {{ skill }}
                  </el-tag>
                </div>
              </div>
              <div class="requirement-item" v-if="positionRequirements.professionalSkills?.aiSkills?.length">
                <label>AI技能：</label>
                <div class="skill-tags">
                  <el-tag
                    v-for="skill in positionRequirements.professionalSkills.aiSkills"
                    :key="skill"
                    size="small"
                    type="success"
                  >
                    {{ skill }}
                  </el-tag>
                </div>
              </div>
              <div class="requirement-item" v-if="positionRequirements.professionalSkills?.softwareSkills?.length">
                <label>软件技能：</label>
                <div class="skill-tags">
                  <el-tag
                    v-for="skill in positionRequirements.professionalSkills.softwareSkills"
                    :key="skill"
                    size="small"
                    type="warning"
                  >
                    {{ skill }}
                  </el-tag>
                </div>
              </div>
              <div class="requirement-item" v-if="positionRequirements.professionalSkills?.hardwareSkills?.length">
                <label>硬件技能：</label>
                <div class="skill-tags">
                  <el-tag
                    v-for="skill in positionRequirements.professionalSkills.hardwareSkills"
                    :key="skill"
                    size="small"
                    type="danger"
                  >
                    {{ skill }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-col>
        </el-row>
        
        <!-- 软技能要求 -->
        <div class="soft-skills-section" v-if="positionRequirements.softSkills">
          <h4>软技能要求</h4>
          <el-row :gutter="20">
            <el-col :span="6" v-for="(level, skill) in positionRequirements.softSkills" :key="skill">
              <div class="soft-skill-item">
                <label>{{ getSoftSkillLabel(skill) }}：</label>
                <el-tag :type="getSoftSkillTagType(level)">
                  {{ level }}
                </el-tag>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>

      <!-- 晋升条件 -->
      <el-card class="promotion-card" v-if="positionRequirements?.promotionRequirements">
        <template #header>
          <div class="card-header">
            <span>晋升条件</span>
            <el-button 
              v-if="hasEditPermission" 
              type="text" 
              size="small" 
              @click="editPromotionRequirements"
            >
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
          </div>
        </template>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="promotion-item">
              <label>最低工作经验：</label>
              <span>{{ positionRequirements.promotionRequirements.minExperience }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="promotion-item">
              <label>绩效等级要求：</label>
              <el-tag :type="getPerformanceTagType(positionRequirements.promotionRequirements.performanceLevel)">
                {{ positionRequirements.promotionRequirements.performanceLevel }}
              </el-tag>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="promotion-item">
              <label>技能评估要求：</label>
              <span>{{ positionRequirements.promotionRequirements.skillAssessment }}</span>
            </div>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="promotion-item">
              <label>项目贡献要求：</label>
              <span>{{ positionRequirements.promotionRequirements.projectContribution }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="promotion-item">
              <label>业务影响要求：</label>
              <span>{{ positionRequirements.promotionRequirements.businessImpact || '无要求' }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 发展路径 -->
      <el-card class="career-path-card" v-if="positionRequirements?.careerPath">
        <template #header>
          <div class="card-header">
            <span>发展路径</span>
          </div>
        </template>
        
        <div class="career-path-content">
          <div class="path-item">
            <label>下一职级：</label>
            <span class="next-level">{{ positionRequirements.careerPath.nextLevel }}</span>
          </div>
          
          <div class="path-item" v-if="positionRequirements.careerPath.lateralMoves?.length">
            <label>横向发展：</label>
            <div class="lateral-moves">
              <el-tag
                v-for="move in positionRequirements.careerPath.lateralMoves"
                :key="move"
                type="info"
                class="move-tag"
              >
                {{ move }}
              </el-tag>
            </div>
          </div>
          
          <div class="path-item" v-if="positionRequirements.careerPath.specializations?.length">
            <label>专业方向：</label>
            <div class="specializations">
              <el-tag
                v-for="spec in positionRequirements.careerPath.specializations"
                :key="spec"
                type="warning"
                class="spec-tag"
              >
                {{ spec }}
              </el-tag>
            </div>
          </div>
          
          <div class="path-item">
            <label>预计晋升时间：</label>
            <span class="estimated-time">{{ positionRequirements.careerPath.estimatedTime }}</span>
          </div>
          
          <div class="path-item" v-if="positionRequirements.careerPath.growthAreas?.length">
            <label>重点发展领域：</label>
            <div class="growth-areas">
              <el-tag
                v-for="area in positionRequirements.careerPath.growthAreas"
                :key="area"
                type="success"
                class="area-tag"
              >
                {{ area }}
              </el-tag>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 工作职责 -->
      <el-card class="responsibilities-card" v-if="positionRequirements?.responsibilities?.length">
        <template #header>
          <div class="card-header">
            <span>工作职责</span>
          </div>
        </template>
        
        <div class="responsibilities-list">
          <el-tag
            v-for="(responsibility, index) in positionRequirements.responsibilities"
            :key="index"
            type="primary"
            class="responsibility-tag"
          >
            {{ index + 1 }}. {{ responsibility }}
          </el-tag>
        </div>
      </el-card>

      <!-- 薪资信息（仅业务线内可见） -->
      <el-card class="salary-card" v-if="showSalary && positionRequirements?.salaryRange">
        <template #header>
          <div class="card-header">
            <span>薪资信息</span>
          </div>
        </template>
        
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="salary-item">
              <label>最低薪资：</label>
              <span class="salary-value">{{ positionRequirements.salaryRange.min }}</span>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="salary-item">
              <label>最高薪资：</label>
              <span class="salary-value">{{ positionRequirements.salaryRange.max }}</span>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="salary-item">
              <label>市场水平：</label>
              <span>{{ positionRequirements.salaryRange.marketLevel }}</span>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="salary-item">
              <label>绩效奖金：</label>
              <span>{{ positionRequirements.salaryRange.performanceBonus }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 工作环境 -->
      <el-card class="work-environment-card" v-if="positionRequirements?.workEnvironment">
        <template #header>
          <div class="card-header">
            <span>工作环境</span>
          </div>
        </template>
        
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="env-item">
              <label>工作类型：</label>
              <el-tag :type="getWorkTypeTagType(positionRequirements.workEnvironment.workType)">
                {{ positionRequirements.workEnvironment.workType }}
              </el-tag>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="env-item">
              <label>工作地点：</label>
              <span>{{ positionRequirements.workEnvironment.location }}</span>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="env-item">
              <label>出差频率：</label>
              <el-tag :type="getTravelTagType(positionRequirements.workEnvironment.travel)">
                {{ positionRequirements.workEnvironment.travel }}
              </el-tag>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="env-item">
              <label>工作灵活性：</label>
              <span>{{ positionRequirements.workEnvironment.flexibility }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button type="primary" @click="viewSimilarPositions">
          查看相似岗位
        </el-button>
        <el-button @click="addToFavorites">
          收藏岗位
        </el-button>
        <el-button @click="sharePosition">
          分享岗位
        </el-button>
      </div>
    </div>

    <div v-else class="no-data">
      <el-empty description="岗位信息不存在" />
    </div>

    <!-- 编辑岗位信息对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑岗位信息"
      width="80%"
      :before-close="handleCloseEditDialog"
    >
      <el-tabs v-model="editActiveTab" type="card">
        <!-- 基本信息编辑 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-form :model="editBasicForm" :rules="editBasicRules" ref="editBasicFormRef" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="岗位名称" prop="name">
                  <el-input v-model="editBasicForm.name" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="岗位代码" prop="code">
                  <el-input v-model="editBasicForm.code" disabled />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="职级" prop="level">
                  <el-select v-model="editBasicForm.level" style="width: 100%">
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
                <el-form-item label="基准值" prop="benchmarkValue">
                  <el-input-number v-model="editBasicForm.benchmarkValue" :min="0" :max="2" :step="0.1" :precision="2" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="岗位描述" prop="description">
              <el-input v-model="editBasicForm.description" type="textarea" :rows="3" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 能力要求编辑 -->
        <el-tab-pane label="能力要求" name="requirements">
          <el-form :model="editRequirementsForm" label-width="120px">
            <el-divider content-position="left">基础要求</el-divider>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="学历要求">
                  <el-input v-model="editRequirementsForm.basicRequirements.education" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="工作经验">
                  <el-input v-model="editRequirementsForm.basicRequirements.experience" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="年龄要求">
                  <el-input v-model="editRequirementsForm.basicRequirements.age" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="专业背景">
                  <el-input v-model="editRequirementsForm.basicRequirements.major" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="相关证书">
              <el-select v-model="editRequirementsForm.basicRequirements.certificates" multiple filterable allow-create style="width: 100%">
                <el-option label="PMP" value="PMP" />
                <el-option label="高级工程师" value="高级工程师" />
                <el-option label="项目经理" value="项目经理" />
              </el-select>
            </el-form-item>

            <el-divider content-position="left">专业技能</el-divider>
            <el-form-item label="仿真技能">
              <el-select v-model="editRequirementsForm.professionalSkills.simulationSkills" multiple filterable allow-create style="width: 100%">
                <el-option label="MATLAB" value="MATLAB" />
                <el-option label="Simulink" value="Simulink" />
                <el-option label="ANSYS" value="ANSYS" />
              </el-select>
            </el-form-item>
            <el-form-item label="AI技能">
              <el-select v-model="editRequirementsForm.professionalSkills.aiSkills" multiple filterable allow-create style="width: 100%">
                <el-option label="Python" value="Python" />
                <el-option label="TensorFlow" value="TensorFlow" />
                <el-option label="PyTorch" value="PyTorch" />
              </el-select>
            </el-form-item>
            <el-form-item label="软件技能">
              <el-select v-model="editRequirementsForm.professionalSkills.softwareSkills" multiple filterable allow-create style="width: 100%">
                <el-option label="C++" value="C++" />
                <el-option label="Java" value="Java" />
                <el-option label="C#" value="C#" />
              </el-select>
            </el-form-item>
            <el-form-item label="硬件技能">
              <el-select v-model="editRequirementsForm.professionalSkills.hardwareSkills" multiple filterable allow-create style="width: 100%">
                <el-option label="嵌入式开发" value="嵌入式开发" />
                <el-option label="FPGA" value="FPGA" />
                <el-option label="PLC" value="PLC" />
              </el-select>
            </el-form-item>

            <el-divider content-position="left">软技能要求</el-divider>
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="沟通能力">
                  <el-select v-model="editRequirementsForm.softSkills.communication" style="width: 100%">
                    <el-option label="优秀" value="优秀" />
                    <el-option label="良好" value="良好" />
                    <el-option label="一般" value="一般" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="团队协作">
                  <el-select v-model="editRequirementsForm.softSkills.teamwork" style="width: 100%">
                    <el-option label="优秀" value="优秀" />
                    <el-option label="良好" value="良好" />
                    <el-option label="一般" value="一般" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="问题解决">
                  <el-select v-model="editRequirementsForm.softSkills.problemSolving" style="width: 100%">
                    <el-option label="优秀" value="优秀" />
                    <el-option label="良好" value="良好" />
                    <el-option label="一般" value="一般" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 晋升条件编辑 -->
        <el-tab-pane label="晋升条件" name="promotion">
          <el-form :model="editPromotionForm" label-width="150px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="最低工作经验">
                  <el-input v-model="editPromotionForm.minExperience" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="绩效等级要求">
                  <el-select v-model="editPromotionForm.performanceLevel" style="width: 100%">
                    <el-option label="A级及以上" value="A级及以上" />
                    <el-option label="B级及以上" value="B级及以上" />
                    <el-option label="C级及以上" value="C级及以上" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="项目贡献要求">
              <el-input v-model="editPromotionForm.projectContribution" />
            </el-form-item>
            <el-form-item label="技能评估要求">
              <el-input v-model="editPromotionForm.skillAssessment" />
            </el-form-item>
            <el-form-item label="业务影响要求">
              <el-input v-model="editPromotionForm.businessImpact" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 发展路径编辑 -->
        <el-tab-pane label="发展路径" name="career">
          <el-form :model="editCareerForm" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="下一职级">
                  <el-input v-model="editCareerForm.nextLevel" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="预计晋升时间">
                  <el-input v-model="editCareerForm.estimatedTime" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="横向发展">
              <el-select v-model="editCareerForm.lateralMoves" multiple filterable allow-create style="width: 100%">
                <el-option label="产品经理" value="产品经理" />
                <el-option label="技术架构师" value="技术架构师" />
                <el-option label="项目经理" value="项目经理" />
              </el-select>
            </el-form-item>
            <el-form-item label="专业方向">
              <el-select v-model="editCareerForm.specializations" multiple filterable allow-create style="width: 100%">
                <el-option label="算法专家" value="算法专家" />
                <el-option label="系统架构师" value="系统架构师" />
                <el-option label="技术专家" value="技术专家" />
              </el-select>
            </el-form-item>
            <el-form-item label="重点发展领域">
              <el-select v-model="editCareerForm.growthAreas" multiple filterable allow-create style="width: 100%">
                <el-option label="技术深度" value="技术深度" />
                <el-option label="项目管理" value="项目管理" />
                <el-option label="业务理解" value="业务理解" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 工作职责编辑 -->
        <el-tab-pane label="工作职责" name="responsibilities">
          <el-form :model="editResponsibilitiesForm" label-width="120px">
            <el-form-item label="职责列表">
              <el-input
                v-model="editResponsibilitiesForm.responsibilities"
                type="textarea"
                :rows="8"
                placeholder="请输入工作职责，每行一个职责"
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- 薪资信息编辑 -->
        <el-tab-pane label="薪资信息" name="salary">
          <el-form :model="editSalaryForm" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="最低薪资">
                  <el-input v-model="editSalaryForm.min" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="最高薪资">
                  <el-input v-model="editSalaryForm.max" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="市场水平">
                  <el-select v-model="editSalaryForm.marketLevel" style="width: 100%">
                    <el-option label="中上水平" value="中上水平" />
                    <el-option label="中等水平" value="中等水平" />
                    <el-option label="中下水平" value="中下水平" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="绩效奖金">
                  <el-input v-model="editSalaryForm.performanceBonus" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>

        <!-- 工作环境编辑 -->
        <el-tab-pane label="工作环境" name="environment">
          <el-form :model="editEnvironmentForm" label-width="120px">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="工作类型">
                  <el-select v-model="editEnvironmentForm.workType" style="width: 100%">
                    <el-option label="全职" value="全职" />
                    <el-option label="兼职" value="兼职" />
                    <el-option label="远程" value="远程" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="工作地点">
                  <el-input v-model="editEnvironmentForm.location" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="出差频率">
                  <el-select v-model="editEnvironmentForm.travel" style="width: 100%">
                    <el-option label="经常出差" value="经常出差" />
                    <el-option label="偶尔出差" value="偶尔出差" />
                    <el-option label="不出差" value="不出差" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="工作灵活性">
                  <el-input v-model="editEnvironmentForm.flexibility" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEdit">确认更新</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 岗位模板对话框 -->
    <el-dialog
      v-model="templateDialogVisible"
      title="岗位模板管理"
      width="70%"
      :before-close="handleCloseTemplateDialog"
    >
      <el-tabs v-model="templateActiveTab">
        <el-tab-pane label="保存为模板" name="save">
          <el-form :model="saveTemplateForm" label-width="120px">
            <el-form-item label="模板名称" prop="name">
              <el-input v-model="saveTemplateForm.name" placeholder="请输入模板名称" />
            </el-form-item>
            <el-form-item label="模板描述">
              <el-input v-model="saveTemplateForm.description" type="textarea" :rows="3" placeholder="请输入模板描述" />
            </el-form-item>
            <el-form-item label="适用岗位">
              <el-select v-model="saveTemplateForm.applicablePositions" multiple style="width: 100%">
                <el-option label="技术岗位" value="技术岗位" />
                <el-option label="管理岗位" value="管理岗位" />
                <el-option label="销售岗位" value="销售岗位" />
                <el-option label="支持岗位" value="支持岗位" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="应用模板" name="apply">
          <div class="template-list">
            <el-card v-for="template in availableTemplates" :key="template.id" class="template-card">
              <div class="template-header">
                <h4>{{ template.name }}</h4>
                <el-tag :type="template.type === '技术岗位' ? 'primary' : 'success'">
                  {{ template.type }}
                </el-tag>
              </div>
              <p class="template-description">{{ template.description }}</p>
              <div class="template-actions">
                <el-button type="primary" size="small" @click="applyTemplateToPosition(template)">
                  应用此模板
                </el-button>
                <el-button type="text" size="small" @click="previewTemplate(template)">
                  预览
                </el-button>
              </div>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="templateDialogVisible = false">关闭</el-button>
          <el-button v-if="templateActiveTab === 'save'" type="primary" @click="saveAsTemplate">
            保存模板
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Edit, CopyDocument, Document } from '@element-plus/icons-vue'
import { positionApi } from '@/api/position'
import type { Position } from '@/api/position'

const router = useRouter()
const route = useRoute()

// 响应式数据
const loading = ref(false)
const position = ref<Position | null>(null)
const positionRequirements = ref<any>(null)
const showSalary = ref(false) // 控制薪资信息显示

// 编辑功能相关数据
const hasEditPermission = ref(true) // 这里需要根据实际权限判断
const editDialogVisible = ref(false)
const editActiveTab = ref('basic')
const templateDialogVisible = ref(false)
const templateActiveTab = ref('save')

// 编辑表单数据
const editBasicForm = ref({
  name: '',
  code: '',
  level: '',
  benchmarkValue: 0,
  description: ''
})

const editRequirementsForm = ref({
  basicRequirements: {
    education: '',
    experience: '',
    age: '',
    major: '',
    certificates: [] as string[]
  },
  professionalSkills: {
    simulationSkills: [] as string[],
    aiSkills: [] as string[],
    softwareSkills: [] as string[],
    hardwareSkills: [] as string[]
  },
  softSkills: {
    communication: '',
    teamwork: '',
    problemSolving: '',
    innovation: '',
    learning: ''
  }
})

const editPromotionForm = ref({
  minExperience: '',
  performanceLevel: '',
  projectContribution: '',
  skillAssessment: '',
  businessImpact: ''
})

const editCareerForm = ref({
  nextLevel: '',
  estimatedTime: '',
  lateralMoves: [] as string[],
  specializations: [] as string[],
  growthAreas: [] as string[]
})

const editResponsibilitiesForm = ref({
  responsibilities: ''
})

const editSalaryForm = ref({
  min: '',
  max: '',
  marketLevel: '',
  performanceBonus: ''
})

const editEnvironmentForm = ref({
  workType: '',
  location: '',
  travel: '',
  flexibility: ''
})

// 表单验证规则
const editBasicRules = {
  name: [{ required: true, message: '请输入岗位名称', trigger: 'blur' }],
  level: [{ required: true, message: '请选择职级', trigger: 'change' }],
  benchmarkValue: [{ required: true, message: '请输入基准值', trigger: 'blur' }]
}

// 模板相关数据
const saveTemplateForm = ref({
  name: '',
  description: '',
  applicablePositions: [] as string[]
})

const availableTemplates = ref([
  {
    id: '1',
    name: '技术岗位标准模板',
    type: '技术岗位',
    description: '适用于软件工程师、算法工程师等技术岗位的标准要求模板'
  },
  {
    id: '2',
    name: '管理岗位标准模板',
    type: '管理岗位',
    description: '适用于项目经理、产品经理等管理岗位的标准要求模板'
  },
  {
    id: '3',
    name: '销售岗位标准模板',
    type: '销售岗位',
    description: '适用于销售经理、客户经理等销售岗位的标准要求模板'
  }
])

// 获取岗位ID
const positionId = computed(() => route.params.id as string)

// 方法
const goBack = () => {
  router.back()
}

const loadPositionDetail = async () => {
  if (!positionId.value) return
  
  loading.value = true
  try {
    // 获取岗位基本信息
    const positionResponse = await positionApi.getPosition(positionId.value)
    position.value = positionResponse.data
    
    // 获取岗位要求信息（这里需要调用新的API）
    // const requirementsResponse = await positionRequirementApi.getPositionRequirements(positionId.value)
    // positionRequirements.value = requirementsResponse.data
    
    // 临时模拟数据
    positionRequirements.value = {
      basicRequirements: {
        education: '本科及以上',
        experience: '3-5年',
        age: '25-35岁',
        certificates: ['PMP', '高级工程师'],
        major: '计算机、自动化等相关专业'
      },
      professionalSkills: {
        simulationSkills: ['MATLAB', 'Simulink', 'ANSYS'],
        aiSkills: ['Python', 'TensorFlow', 'PyTorch'],
        softwareSkills: ['C++', 'Java', 'C#'],
        hardwareSkills: ['嵌入式开发', 'FPGA', 'PLC']
      },
      softSkills: {
        communication: '优秀',
        teamwork: '优秀',
        problemSolving: '良好',
        innovation: '良好',
        learning: '优秀'
      },
      promotionRequirements: {
        minExperience: '3年',
        performanceLevel: 'B级及以上',
        skillAssessment: '通过技能考核',
        projectContribution: '主导过2个以上项目',
        businessImpact: '对业务产生积极影响'
      },
      careerPath: {
        nextLevel: '高级工程师',
        lateralMoves: ['产品经理', '技术架构师'],
        specializations: ['算法专家', '系统架构师'],
        estimatedTime: '2-3年',
        growthAreas: ['技术深度', '项目管理', '业务理解']
      },
      responsibilities: [
        '负责项目技术方案设计',
        '指导初级工程师工作',
        '参与技术决策和架构设计',
        '解决项目中的技术难题'
      ],
      salaryRange: {
        min: '15K',
        max: '25K',
        marketLevel: '中上水平',
        performanceBonus: '15-20%'
      },
      workEnvironment: {
        workType: '全职',
        location: '北京/上海',
        travel: '偶尔出差',
        flexibility: '弹性工作制'
      }
    }
    
    // 判断是否显示薪资信息（仅业务线内可见）
    showSalary.value = true // 这里需要根据用户权限判断
    
  } catch (error) {
    ElMessage.error('获取岗位详情失败')
  } finally {
    loading.value = false
  }
}

const getLevelTagType = (level: string) => {
  const levelMap: Record<string, string> = {
    '初级': 'info',
    '中级': 'success',
    '高级': 'warning',
    '专家': 'danger',
    '总监': 'danger',
    '经理': 'warning',
    '主管': 'success',
    '专员': 'info'
  }
  return levelMap[level] || 'info'
}

const getSoftSkillLabel = (skill: string) => {
  const labelMap: Record<string, string> = {
    'communication': '沟通能力',
    'teamwork': '团队协作',
    'problemSolving': '问题解决',
    'innovation': '创新能力',
    'learning': '学习能力'
  }
  return labelMap[skill] || skill
}

const getSoftSkillTagType = (level: string) => {
  const typeMap: Record<string, string> = {
    '优秀': 'success',
    '良好': 'warning',
    '一般': 'info'
  }
  return typeMap[level] || 'info'
}

const getPerformanceTagType = (level: string) => {
  const typeMap: Record<string, string> = {
    'A级': 'success',
    'B级': 'warning',
    'C级': 'danger'
  }
  return typeMap[level] || 'info'
}

const getWorkTypeTagType = (type: string) => {
  const typeMap: Record<string, string> = {
    '全职': 'success',
    '兼职': 'warning',
    '远程': 'info'
  }
  return typeMap[type] || 'info'
}

const getTravelTagType = (travel: string) => {
  const typeMap: Record<string, string> = {
    '经常出差': 'danger',
    '偶尔出差': 'warning',
    '不出差': 'success'
  }
  return typeMap[travel] || 'info'
}

const formatDate = (date: string) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

const viewSimilarPositions = () => {
  ElMessage.info('查看相似岗位功能开发中...')
}

const addToFavorites = () => {
  ElMessage.success('已添加到收藏')
}

const sharePosition = () => {
  ElMessage.info('分享功能开发中...')
}

// ==================== 编辑功能方法 ====================

// 显示编辑对话框
const showEditDialog = () => {
  // 初始化编辑表单数据
  initEditForms()
  editDialogVisible.value = true
}

// 初始化编辑表单数据
const initEditForms = () => {
  if (!position.value || !positionRequirements.value) return
  
  // 基本信息
  editBasicForm.value = {
    name: position.value.name,
    code: position.value.code,
    level: position.value.level,
    benchmarkValue: position.value.benchmarkValue || 0,
    description: position.value.description || ''
  }
  
  // 能力要求
  editRequirementsForm.value = {
    basicRequirements: {
      education: positionRequirements.value.basicRequirements?.education || '',
      experience: positionRequirements.value.basicRequirements?.experience || '',
      age: positionRequirements.value.basicRequirements?.age || '',
      major: positionRequirements.value.basicRequirements?.major || '',
      certificates: positionRequirements.value.basicRequirements?.certificates || []
    },
    professionalSkills: {
      simulationSkills: positionRequirements.value.professionalSkills?.simulationSkills || [],
      aiSkills: positionRequirements.value.professionalSkills?.aiSkills || [],
      softwareSkills: positionRequirements.value.professionalSkills?.softwareSkills || [],
      hardwareSkills: positionRequirements.value.professionalSkills?.hardwareSkills || []
    },
    softSkills: {
      communication: positionRequirements.value.softSkills?.communication || '',
      teamwork: positionRequirements.value.softSkills?.teamwork || '',
      problemSolving: positionRequirements.value.softSkills?.problemSolving || '',
      innovation: positionRequirements.value.softSkills?.innovation || '',
      learning: positionRequirements.value.softSkills?.learning || ''
    }
  }
  
  // 晋升条件
  editPromotionForm.value = {
    minExperience: positionRequirements.value.promotionRequirements?.minExperience || '',
    performanceLevel: positionRequirements.value.promotionRequirements?.performanceLevel || '',
    projectContribution: positionRequirements.value.promotionRequirements?.projectContribution || '',
    skillAssessment: positionRequirements.value.promotionRequirements?.skillAssessment || '',
    businessImpact: positionRequirements.value.promotionRequirements?.businessImpact || ''
  }
  
  // 发展路径
  editCareerForm.value = {
    nextLevel: positionRequirements.value.careerPath?.nextLevel || '',
    estimatedTime: positionRequirements.value.careerPath?.estimatedTime || '',
    lateralMoves: positionRequirements.value.careerPath?.lateralMoves || [],
    specializations: positionRequirements.value.careerPath?.specializations || [],
    growthAreas: positionRequirements.value.careerPath?.growthAreas || []
  }
  
  // 工作职责
  editResponsibilitiesForm.value.responsibilities = positionRequirements.value.responsibilities?.join('\n') || ''
  
  // 薪资信息
  editSalaryForm.value = {
    min: positionRequirements.value.salaryRange?.min || '',
    max: positionRequirements.value.salaryRange?.max || '',
    marketLevel: positionRequirements.value.salaryRange?.marketLevel || '',
    performanceBonus: positionRequirements.value.salaryRange?.performanceBonus || ''
  }
  
  // 工作环境
  editEnvironmentForm.value = {
    workType: positionRequirements.value.workEnvironment?.workType || '',
    location: positionRequirements.value.workEnvironment?.location || '',
    travel: positionRequirements.value.workEnvironment?.travel || '',
    flexibility: positionRequirements.value.workEnvironment?.flexibility || ''
  }
}

// 关闭编辑对话框
const handleCloseEditDialog = () => {
  editDialogVisible.value = false
}

// 提交编辑
const submitEdit = async () => {
  try {
    // 更新岗位基本信息
    if (position.value) {
      const response = await positionApi.updatePosition(position.value._id || position.value.id || '', {
        name: editBasicForm.value.name,
        level: editBasicForm.value.level,
        description: editBasicForm.value.description,
        benchmarkValue: editBasicForm.value.benchmarkValue
      })
      
      if (response.data?.code === 200) {
        // 更新本地数据
        if (position.value) {
          position.value.name = editBasicForm.value.name
          position.value.level = editBasicForm.value.level
          position.value.description = editBasicForm.value.description
          position.value.benchmarkValue = editBasicForm.value.benchmarkValue
        }
        
        // 更新岗位要求信息（这里需要调用相应的API）
        // await updatePositionRequirements()
        
        ElMessage.success('岗位信息更新成功')
        editDialogVisible.value = false
        
        // 通知父组件数据已更新
        // emit('position-updated')
      } else {
        ElMessage.error(response.data?.message || '更新失败')
      }
    }
  } catch (error) {
    console.error('更新岗位信息失败:', error)
    ElMessage.error('更新失败')
  }
}

// 快速编辑方法
const editBasicInfo = () => {
  editActiveTab.value = 'basic'
  showEditDialog()
}

const editRequirements = () => {
  editActiveTab.value = 'requirements'
  showEditDialog()
}

const editPromotionRequirements = () => {
  editActiveTab.value = 'promotion'
  showEditDialog()
}

// ==================== 模板功能方法 ====================

// 显示模板对话框
const showTemplateDialog = () => {
  templateActiveTab.value = 'save'
  templateDialogVisible.value = true
}

// 应用模板
const applyTemplate = () => {
  templateActiveTab.value = 'apply'
  templateDialogVisible.value = true
}

// 关闭模板对话框
const handleCloseTemplateDialog = () => {
  templateDialogVisible.value = false
}

// 保存为模板
const saveAsTemplate = async () => {
  try {
    // 这里需要调用后端API保存模板
    ElMessage.success('模板保存成功')
    templateDialogVisible.value = false
  } catch (error) {
    ElMessage.error('模板保存失败')
  }
}

// 应用模板到岗位
const applyTemplateToPosition = (template: any) => {
  ElMessage.info(`应用模板：${template.name}`)
  // 这里需要实现模板应用逻辑
}

// 预览模板
const previewTemplate = (template: any) => {
  ElMessage.info(`预览模板：${template.name}`)
  // 这里需要实现模板预览逻辑
}

// 生命周期
onMounted(() => {
  loadPositionDetail()
})
</script>

<style scoped>
.position-detail {
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.loading-container {
  padding: 40px;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.basic-info-card,
.requirements-card,
.promotion-card,
.career-path-card,
.responsibilities-card,
.salary-card,
.work-environment-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.info-item label {
  font-weight: bold;
  min-width: 100px;
  margin-right: 10px;
  color: #606266;
}

.description-section {
  margin-top: 15px;
}

.description-section label {
  font-weight: bold;
  display: block;
  margin-bottom: 8px;
  color: #606266;
}

.description-section p {
  margin: 0;
  color: #303133;
  line-height: 1.6;
}

.requirement-section {
  margin-bottom: 20px;
}

.requirement-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  border-bottom: 2px solid #409eff;
  padding-bottom: 5px;
}

.requirement-item {
  margin-bottom: 12px;
  display: flex;
  align-items: flex-start;
}

.requirement-item label {
  font-weight: bold;
  min-width: 100px;
  margin-right: 10px;
  color: #606266;
}

.certificate-tags,
.skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.soft-skills-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.soft-skills-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.soft-skill-item {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.soft-skill-item label {
  font-weight: bold;
  min-width: 100px;
  margin-right: 10px;
  color: #606266;
}

.promotion-item {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.promotion-item label {
  font-weight: bold;
  min-width: 120px;
  margin-right: 10px;
  color: #606266;
}

.career-path-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.path-item {
  display: flex;
  align-items: flex-start;
}

.path-item label {
  font-weight: bold;
  min-width: 120px;
  margin-right: 10px;
  color: #606266;
}

.next-level {
  color: #409eff;
  font-weight: bold;
  font-size: 16px;
}

.estimated-time {
  color: #67c23a;
  font-weight: bold;
}

.lateral-moves,
.specializations,
.growth-areas {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.move-tag,
.spec-tag,
.area-tag {
  margin: 2px;
}

.responsibilities-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.responsibility-tag {
  padding: 8px 12px;
  font-size: 14px;
}

.salary-item,
.env-item {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
}

.salary-item label,
.env-item label {
  font-weight: bold;
  min-width: 100px;
  margin-right: 10px;
  color: #606266;
}

.salary-value {
  color: #f56c6c;
  font-weight: bold;
  font-size: 16px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 30px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.no-data {
  padding: 60px;
  text-align: center;
}

/* 编辑功能样式 */
.page-actions {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
  display: flex;
  gap: 15px;
  justify-content: flex-end;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 模板管理样式 */
.template-list {
  max-height: 400px;
  overflow-y: auto;
}

.template-card {
  margin-bottom: 15px;
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.template-header h4 {
  margin: 0;
  color: #303133;
}

.template-description {
  margin: 10px 0;
  color: #606266;
  line-height: 1.5;
}

.template-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

/* 编辑对话框样式 */
.el-tabs--card > .el-tabs__header .el-tabs__item {
  border-radius: 4px 4px 0 0;
}

.el-form-item {
  margin-bottom: 20px;
}

.el-divider {
  margin: 20px 0;
}

.el-divider__text {
  font-weight: bold;
  color: #409eff;
}
</style>
