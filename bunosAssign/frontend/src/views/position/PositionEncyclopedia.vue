<template>
  <div class="position-encyclopedia">
    <div class="page-header">
      <h2>岗位大全</h2>
      <p class="page-description">了解公司各岗位要求，规划职业发展路径</p>
    </div>

    <!-- 管理工具栏 -->
    <div class="management-toolbar" v-if="hasManagementPermission">
      <el-card class="toolbar-card">
        <div class="toolbar-content">
          <div class="toolbar-left">
            <el-button 
              type="primary" 
              @click="showBulkEditDialog"
              :disabled="selectedPositions.length === 0"
            >
              <el-icon><Edit /></el-icon>
              批量编辑 ({{ selectedPositions.length }})
            </el-button>
            <el-button 
              type="success" 
              @click="showAddPositionDialog"
            >
              <el-icon><Plus /></el-icon>
              新增岗位
            </el-button>
          </div>
          
          <div class="toolbar-right">
            <el-button @click="exportPositions">
              <el-icon><Download /></el-icon>
              导出数据
            </el-button>
            <el-button @click="openDataImport">
              <el-icon><Upload /></el-icon>
              导入数据
            </el-button>
            <el-button @click="showManagementSettings" type="warning">
              <el-icon><Setting /></el-icon>
              管理设置
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 业务线筛选 -->
    <div class="business-line-filter">
      <el-card class="filter-card">
        <el-form :model="filterForm" inline>
          <el-form-item label="业务线">
            <el-select 
              v-model="filterForm.businessLineId" 
              placeholder="选择业务线" 
              clearable 
              @change="handleBusinessLineChange" 
              style="width: 250px"
              popper-class="business-line-select-dropdown"
              :popper-append-to-body="false"
              :reserve-keyword="false"
              class="business-line-select"
            >
              <el-option label="全部业务线" value="" />
              <el-option
                v-for="line in businessLines"
                :key="line.id"
                :label="line.name"
                :value="line.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="搜索">
            <el-input
              v-model="filterForm.search"
              placeholder="搜索岗位名称、技能要求..."
              prefix-icon="Search"
              clearable
              @input="handleSearch"
              style="width: 300px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 岗位分类导航 -->
    <div class="category-navigation">
      <el-card class="category-card">
        <el-tabs v-model="activeCategory" type="card" @tab-click="handleCategoryChange">
          <el-tab-pane label="技术研发" name="tech">
            <div class="sub-categories">
              <el-tag
                v-for="sub in techSubCategories"
                :key="sub.value"
                :type="sub.type"
                class="sub-category-tag"
                @click="showPositionRequirements(sub.value)"
              >
                {{ sub.label }}
              </el-tag>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="项目管理" name="management">
            <div class="sub-categories">
              <el-tag
                v-for="sub in managementSubCategories"
                :key="sub.value"
                :type="sub.type"
                class="sub-category-tag"
                @click="showPositionRequirements(sub.value)"
              >
                {{ sub.label }}
              </el-tag>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="售前业务" name="presale">
            <div class="sub-categories">
              <el-tag
                v-for="sub in presaleSubCategories"
                :key="sub.value"
                :type="sub.type"
                class="sub-category-tag"
                @click="showPositionRequirements(sub.value)"
              >
                {{ sub.label }}
              </el-tag>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="技术管理" name="tech-management">
            <div class="sub-categories">
              <el-tag
                v-for="sub in techManagementSubCategories"
                :key="sub.value"
                :type="sub.type"
                class="sub-category-tag"
                @click="showPositionRequirements(sub.value)"
              >
                {{ sub.label }}
              </el-tag>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="综合运营" name="comprehensive-ops">
            <div class="sub-categories">
              <el-tag
                v-for="sub in comprehensiveOpsSubCategories"
                :key="sub.value"
                :type="sub.type"
                class="sub-category-tag"
                @click="showPositionRequirements(sub.value)"
              >
                {{ sub.label }}
              </el-tag>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="市场商务" name="market-business">
            <div class="sub-categories">
              <el-tag
                v-for="sub in marketBusinessSubCategories"
                :key="sub.value"
                :type="sub.type"
                class="sub-category-tag"
                @click="showPositionRequirements(sub.value)"
              >
                {{ sub.label }}
              </el-tag>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="业务支持" name="support">
            <div class="sub-categories">
              <el-tag
                v-for="sub in supportSubCategories"
                :key="sub.value"
                :type="sub.type"
                class="sub-category-tag"
                @click="showPositionRequirements(sub.value)"
              >
                {{ sub.label }}
              </el-tag>
            </div>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </div>

    <!-- 岗位展示区域 -->
    <div class="position-display">
      <div class="display-header">
        <div class="result-info">
          共找到 <span class="count">{{ filteredPositions.length }}</span> 个岗位
        </div>
        <div class="display-actions">
          <el-button 
            v-if="selectedPositions.length > 0"
            type="primary" 
            @click="showComparison"
          >
            对比岗位 ({{ selectedPositions.length }})
          </el-button>
          <el-button @click="refreshData">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>

      <!-- 岗位卡片网格 -->
      <div class="position-grid">
        <el-card
          v-for="position in filteredPositions"
          :key="position._id || position.id"
          class="position-card enhanced"
          :class="{ 'selected': isPositionSelected(position._id || position.id || '') }"
          @click="togglePositionSelection(position)"
        >
          <!-- 岗位头部 -->
          <div class="position-header">
            <h3>{{ position.name }}</h3>
            <div class="position-tags">
              <el-tag :type="getLevelTagType(position.level)">
                {{ position.level }}
              </el-tag>
              <el-tag v-if="position.businessLine" type="info" size="small">
                {{ position.businessLine.name }}
              </el-tag>
              <!-- 特殊岗位标识 -->
              <el-tag v-if="position.isComprehensive" type="success" size="small">
                综合岗位
              </el-tag>
              <el-tag v-if="position.isMarket" type="warning" size="small">
                市场岗位
              </el-tag>
            </div>
          </div>
          
          <!-- 核心技能 -->
          <div class="position-skills">
            <div class="skills-title">核心技能：</div>
            <el-tag
              v-for="skill in position.coreSkills?.slice(0, 4)"
              :key="skill"
              size="small"
              class="skill-tag"
            >
              {{ skill }}
            </el-tag>
          </div>
          
          <!-- 发展路径 -->
          <div class="position-path">
            <div class="path-title">发展方向：</div>
            <div class="path-content">
              <span class="next-level">{{ position.careerPath?.nextLevel || '暂无' }}</span>
              <span class="estimated-time">(预计{{ position.careerPath?.estimatedTime || '待定' }})</span>
            </div>
            <!-- 横向发展选项 -->
            <div class="lateral-moves" v-if="position.careerPath?.lateralMoves?.length">
              <div class="moves-title">横向发展：</div>
              <el-tag
                v-for="move in position.careerPath.lateralMoves.slice(0, 2)"
                :key="move"
                size="small"
                type="info"
                class="move-tag"
              >
                {{ move }}
              </el-tag>
            </div>
          </div>
          
          <!-- 工作环境 -->
          <div class="work-environment">
            <!-- 工作类型 -->
            <el-tag v-if="position.workEnvironment?.workType" :type="position.workEnvironment.workType === '全职' ? 'success' : 'info'" size="small">
              {{ position.workEnvironment.workType }}
            </el-tag>
            
            <!-- 出差情况 -->
            <el-tag 
              v-if="position.workEnvironment?.travel" 
              :type="position.workEnvironment.travel === '经常出差' ? 'warning' : position.workEnvironment.travel === '不出差' ? 'success' : 'info'" 
              size="small"
            >
              {{ position.workEnvironment.travel }}
            </el-tag>
            
            <!-- 岗位特性 -->
            <el-tag v-if="position.isComprehensive" type="info" size="small">
              综合岗位
            </el-tag>
            <el-tag v-if="position.isMarket" type="warning" size="small">
              市场岗位
            </el-tag>
            
            <!-- 专业方向 -->
            <el-tag 
              v-if="position.careerPath?.specializations?.length" 
              v-for="spec in position.careerPath.specializations.slice(0, 1)" 
              :key="spec"
              type="primary" 
              size="small"
              class="specialization-tag"
            >
              {{ spec }}
            </el-tag>
          </div>

          <!-- 操作按钮 -->
          <div class="position-actions">
            <el-button 
              type="primary" 
              size="small" 
              @click.stop="viewPositionDetail(position)"
            >
              查看详情
            </el-button>
            
            <!-- 管理按钮（基于权限显示） -->
            <el-button 
              v-if="canEditPosition(position)"
              type="warning" 
              size="small" 
              @click.stop="editPosition(position)"
            >
              编辑
            </el-button>
            
            <el-button 
              v-if="canDeletePosition(position)"
              type="danger" 
              size="small" 
              @click.stop="deletePosition(position)"
            >
              删除
            </el-button>
            
            <el-button 
              :type="isPositionSelected(position._id || position.id || '') ? 'danger' : 'default'"
              size="small" 
              @click.stop="togglePositionSelection(position)"
            >
              {{ isPositionSelected(position._id || position.id || '') ? '取消选择' : '选择对比' }}
            </el-button>
          </div>
        </el-card>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper" v-if="pagination.total > 0">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[12, 24, 48, 96]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

        <!-- 岗位对比对话框 -->
    <el-dialog
      v-model="comparisonDialogVisible"
      title="岗位对比"
      width="90%"
      :before-close="handleCloseComparison"
    >
      <div class="comparison-content">
        <div class="comparison-table">
          <el-table :data="comparisonData" border>
            <el-table-column prop="attribute" label="对比项目" width="150" />
            <el-table-column 
              v-for="position in selectedPositions" 
              :key="position._id || position.id"
              :prop="position._id || position.id || ''"
              :label="position.name"
              min-width="200"
            />
          </el-table>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="comparisonDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="exportComparison">导出对比</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 岗位要求详情对话框 -->
    <el-dialog
      v-model="requirementsDialogVisible"
      title="岗位要求详情"
      width="80%"
      :before-close="handleCloseRequirements"
    >
      <div class="requirements-content" v-if="currentRequirements">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="岗位类型">{{ currentRequirements.label }}</el-descriptions-item>
          <el-descriptions-item label="专业方向">{{ currentRequirements.direction }}</el-descriptions-item>
        </el-descriptions>
        
        <el-divider content-position="left">任职条件</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <h4>基础要求</h4>
            <ul>
              <li v-for="(req, index) in currentRequirements.basicRequirements" :key="index">
                {{ req }}
              </li>
            </ul>
          </el-col>
          <el-col :span="12">
            <h4>技能要求</h4>
            <ul>
              <li v-for="(skill, index) in currentRequirements.skills" :key="index">
                {{ skill }}
              </li>
            </ul>
          </el-col>
        </el-row>
        
        <el-divider content-position="left">发展路径</el-divider>
        <div class="career-path-info">
          <p><strong>晋升方向：</strong>{{ currentRequirements.careerPath.nextLevel }}</p>
          <p><strong>预计时间：</strong>{{ currentRequirements.careerPath.estimatedTime }}</p>
          <p><strong>横向发展：</strong>{{ currentRequirements.careerPath.lateralMoves.join('、') }}</p>
        </div>
        
        <el-divider content-position="left">薪资范围</el-divider>
        <div class="salary-info">
          <p><strong>初级：</strong>{{ currentRequirements.salaryRange.junior }}</p>
          <p><strong>中级：</strong>{{ currentRequirements.salaryRange.middle }}</p>
          <p><strong>高级：</strong>{{ currentRequirements.salaryRange.senior }}</p>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="requirementsDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="viewSimilarPositions">查看相似岗位</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批量编辑对话框 -->
    <el-dialog
      v-model="bulkEditDialogVisible"
      title="批量编辑岗位"
      width="90%"
      :before-close="handleCloseBulkEdit"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      draggable
      resizable
      top="5vh"
    >
      <div class="bulk-edit-content">
        <!-- 已选择岗位区域 -->
        <div class="selected-positions-section">
          <h4>已选择的岗位 ({{ selectedPositions.length }})</h4>
          <div class="selected-positions-list">
            <el-tag
              v-for="position in selectedPositions"
              :key="position._id || position.id"
              closable
              @close="removeFromSelection(position)"
              class="position-tag"
              size="large"
            >
              {{ position.name }}
              <span class="position-code">({{ position.code }})</span>
            </el-tag>
          </div>
          <div class="selection-actions">
            <el-button type="text" size="small" @click="clearAllSelections">
              清空选择
            </el-button>
            <el-button type="text" size="small" @click="selectAllPositions">
              全选
            </el-button>
          </div>
        </div>
        
        <el-divider />
        
        <!-- 编辑表单区域 -->
        <div class="edit-form-section">
          <el-form :model="bulkEditForm" label-width="140px" class="bulk-edit-form">
            <el-form-item label="编辑类型">
              <el-radio-group v-model="bulkEditForm.editType">
                <el-radio label="requirements">岗位要求</el-radio>
                <el-radio label="skills">核心技能</el-radio>
                <el-radio label="careerPath">职业路径</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item label="更新内容" v-if="bulkEditForm.editType === 'requirements'">
              <el-input
                v-model="bulkEditForm.requirements"
                type="textarea"
                :rows="6"
                placeholder="请输入新的岗位要求..."
                show-word-limit
                maxlength="1000"
              />
            </el-form-item>
            
            <el-form-item label="核心技能" v-if="bulkEditForm.editType === 'skills'">
              <el-select
                v-model="bulkEditForm.skills"
                multiple
                filterable
                allow-create
                default-first-option
                placeholder="请选择或输入核心技能"
                style="width: 100%"
                :popper-class="'skills-select-dropdown'"
              >
                <el-option
                  v-for="skill in commonSkills"
                  :key="skill"
                  :label="skill"
                  :value="skill"
                />
              </el-select>
              <div class="skills-help">
                <el-text type="info" size="small">
                  可以输入自定义技能，按回车确认
                </el-text>
              </div>
            </el-form-item>
            
            <el-form-item label="职业路径" v-if="bulkEditForm.editType === 'careerPath'">
              <el-row :gutter="20">
                <el-col :span="12">
                  <el-input
                    v-model="bulkEditForm.careerPath.nextLevel"
                    placeholder="下一级别岗位"
                    clearable
                  />
                </el-col>
                <el-col :span="12">
                  <el-input
                    v-model="bulkEditForm.careerPath.estimatedTime"
                    placeholder="预计晋升时间"
                    clearable
                  />
                </el-col>
              </el-row>
            </el-form-item>
          </el-form>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="bulkEditDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="executeBulkEdit">确认更新</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 新增岗位对话框 -->
    <el-dialog
      v-model="addPositionDialogVisible"
      title="新增岗位"
      width="70%"
      :before-close="handleCloseAddPosition"
    >
      <el-form :model="addPositionForm" :rules="addPositionRules" ref="addPositionFormRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="岗位名称" prop="name">
              <el-input v-model="addPositionForm.name" placeholder="请输入岗位名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="岗位代码" prop="code">
              <el-input v-model="addPositionForm.code" placeholder="请输入岗位代码" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="职级" prop="level">
              <el-select v-model="addPositionForm.level" placeholder="请选择职级" style="width: 100%">
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
            <el-form-item label="业务线" prop="businessLineId">
              <el-select v-model="addPositionForm.businessLineId" placeholder="请选择业务线" style="width: 100%">
                <el-option
                  v-for="line in businessLines"
                  :key="line.id"
                  :label="line.name"
                  :value="line.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="岗位描述" prop="description">
          <el-input
            v-model="addPositionForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入岗位描述"
          />
        </el-form-item>
        
        <el-form-item label="核心技能" prop="coreSkills">
          <el-select
            v-model="addPositionForm.coreSkills"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请选择或输入核心技能"
            style="width: 100%"
          >
            <el-option
              v-for="skill in commonSkills"
              :key="skill"
              :label="skill"
              :value="skill"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="职业路径">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-input
                v-model="addPositionForm.careerPath.nextLevel"
                placeholder="下一级别岗位"
              />
            </el-col>
            <el-col :span="12">
              <el-input
                v-model="addPositionForm.careerPath.estimatedTime"
                placeholder="预计晋升时间"
              />
            </el-col>
          </el-row>
          <el-row :gutter="20" style="margin-top: 10px;">
            <el-col :span="8">
              <el-select
                v-model="addPositionForm.careerPath.lateralMoves"
                multiple
                filterable
                allow-create
                placeholder="横向发展"
                style="width: 100%"
              >
                <el-option label="产品经理" value="产品经理" />
                <el-option label="项目经理" value="项目经理" />
                <el-option label="技术经理" value="技术经理" />
              </el-select>
            </el-col>
            <el-col :span="8">
              <el-select
                v-model="addPositionForm.careerPath.specializations"
                multiple
                filterable
                allow-create
                placeholder="专业方向"
                style="width: 100%"
              >
                <el-option label="技术架构" value="技术架构" />
                <el-option label="业务咨询" value="业务咨询" />
                <el-option label="团队管理" value="团队管理" />
              </el-select>
            </el-col>
            <el-col :span="8">
              <el-select
                v-model="addPositionForm.careerPath.growthAreas"
                multiple
                filterable
                allow-create
                placeholder="成长领域"
                style="width: 100%"
              >
                <el-option label="战略规划" value="战略规划" />
                <el-option label="团队建设" value="团队建设" />
                <el-option label="客户关系" value="客户关系" />
              </el-select>
            </el-col>
          </el-row>
        </el-form-item>
        
        <el-form-item label="工作环境">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-select v-model="addPositionForm.workEnvironment.travel" placeholder="出差频率" style="width: 100%">
                <el-option label="不出差" value="不出差" />
                <el-option label="偶尔出差" value="偶尔出差" />
                <el-option label="经常出差" value="经常出差" />
              </el-select>
            </el-col>
            <el-col :span="12">
              <el-select v-model="addPositionForm.workEnvironment.workType" placeholder="工作类型" style="width: 100%">
                <el-option label="全职" value="全职" />
                <el-option label="兼职" value="兼职" />
                <el-option label="外包" value="外包" />
              </el-select>
            </el-col>
          </el-row>
        </el-form-item>
        
        <el-form-item label="岗位特性">
          <el-checkbox v-model="addPositionForm.isComprehensive">综合岗位</el-checkbox>
          <el-checkbox v-model="addPositionForm.isMarket" style="margin-left: 20px;">市场岗位</el-checkbox>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addPositionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAddPosition">确认新增</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 编辑岗位对话框 -->
    <el-dialog
      v-model="editPositionDialogVisible"
      title="编辑岗位"
      width="70%"
      :before-close="handleCloseEditPosition"
    >
      <el-form :model="editPositionForm" :rules="editPositionRules" ref="editPositionFormRef" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="岗位名称" prop="name">
              <el-input v-model="editPositionForm.name" placeholder="请输入岗位名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="岗位代码" prop="code">
              <el-input v-model="editPositionForm.code" placeholder="请输入岗位代码" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="职级" prop="level">
              <el-select v-model="editPositionForm.level" placeholder="请选择职级" style="width: 100%">
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
            <el-form-item label="业务线" prop="businessLineId">
              <el-select v-model="editPositionForm.businessLineId" placeholder="请选择业务线" style="width: 100%">
                <el-option
                  v-for="line in businessLines"
                  :key="line.id"
                  :label="line.name"
                  :value="line.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="岗位描述" prop="description">
          <el-input
            v-model="editPositionForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入岗位描述"
          />
        </el-form-item>
        
        <el-form-item label="核心技能" prop="coreSkills">
          <el-select
            v-model="editPositionForm.coreSkills"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请选择或输入核心技能"
            style="width: 100%"
          >
            <el-option
              v-for="skill in commonSkills"
              :key="skill"
              :label="skill"
              :value="skill"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="职业路径">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-input
                v-model="editPositionForm.careerPath.nextLevel"
                placeholder="下一级别岗位"
              />
            </el-col>
            <el-col :span="12">
              <el-input
                v-model="editPositionForm.careerPath.estimatedTime"
                placeholder="预计晋升时间"
              />
            </el-col>
          </el-row>
          <el-row :gutter="20" style="margin-top: 10px;">
            <el-col :span="8">
              <el-select
                v-model="editPositionForm.careerPath.lateralMoves"
                multiple
                filterable
                allow-create
                placeholder="横向发展"
                style="width: 100%"
              >
                <el-option label="产品经理" value="产品经理" />
                <el-option label="项目经理" value="项目经理" />
                <el-option label="技术经理" value="技术经理" />
              </el-select>
            </el-col>
            <el-col :span="8">
              <el-select
                v-model="editPositionForm.careerPath.specializations"
                multiple
                filterable
                allow-create
                placeholder="专业方向"
                style="width: 100%"
              >
                <el-option label="技术架构" value="技术架构" />
                <el-option label="业务咨询" value="业务咨询" />
                <el-option label="团队管理" value="团队管理" />
              </el-select>
            </el-col>
            <el-col :span="8">
              <el-select
                v-model="editPositionForm.careerPath.growthAreas"
                multiple
                filterable
                allow-create
                placeholder="成长领域"
                style="width: 100%"
              >
                <el-option label="战略规划" value="战略规划" />
                <el-option label="团队建设" value="团队建设" />
                <el-option label="客户关系" value="客户关系" />
              </el-select>
            </el-col>
          </el-row>
        </el-form-item>
        
        <el-form-item label="工作环境">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-select v-model="editPositionForm.workEnvironment.travel" placeholder="出差频率" style="width: 100%">
                <el-option label="不出差" value="不出差" />
                <el-option label="偶尔出差" value="偶尔出差" />
                <el-option label="经常出差" value="经常出差" />
              </el-select>
            </el-col>
            <el-col :span="12">
              <el-select v-model="editPositionForm.workEnvironment.workType" placeholder="工作类型" style="width: 100%">
                <el-option label="全职" value="全职" />
                <el-option label="兼职" value="兼职" />
                <el-option label="外包" value="外包" />
              </el-select>
            </el-col>
          </el-row>
        </el-form-item>
        
        <el-form-item label="岗位特性">
          <el-checkbox v-model="editPositionForm.isComprehensive">综合岗位</el-checkbox>
          <el-checkbox v-model="editPositionForm.isMarket" style="margin-left: 20px;">市场岗位</el-checkbox>
        </el-form-item>

        <el-form-item label="基准值" prop="benchmarkValue">
          <el-input-number
            v-model="editPositionForm.benchmarkValue"
            :min="0"
            :max="2"
            :step="0.1"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editPositionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEditPosition">确认更新</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 数据导入对话框 -->
    <el-dialog
      v-model="importDialogVisible"
      title="导入岗位数据"
      width="600px"
      :before-close="handleCloseImport"
    >
      <el-upload
        class="upload-demo"
        drag
        accept=".xlsx,.xls,.csv"
        :before-upload="handleFileUpload"
        :show-file-list="false"
      >
        <el-icon class="el-icon--upload"><Upload /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            只能上传xlsx/xls/csv文件，且不超过5MB
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

    <!-- 管理设置对话框 -->
    <el-dialog
      v-model="managementSettingsDialogVisible"
      title="管理设置"
      width="90%"
      :before-close="handleCloseManagementSettings"
      top="3vh"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div class="management-settings-content">
        <el-tabs v-model="settingsActiveTab" class="management-tabs">
          <el-tab-pane label="岗位分类管理" name="categories">
            <CategoryManager />
          </el-tab-pane>
          
          <el-tab-pane label="技能标签管理" name="skills">
            <SkillTagManager />
          </el-tab-pane>
          
          <el-tab-pane label="职业路径模板" name="templates">
            <CareerPathTemplateManager />
          </el-tab-pane>
        </el-tabs>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="managementSettingsDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Edit, Plus, Download, Upload, Setting } from '@element-plus/icons-vue'
import { positionApi } from '@/api/position'
import type { Position } from '@/api/position'
import CategoryManager from '@/components/management/CategoryManager.vue'
import SkillTagManager from '@/components/management/SkillTagManager.vue'
import CareerPathTemplateManager from '@/components/management/CareerPathTemplateManager.vue'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const activeCategory = ref('tech')
const selectedPositions = ref<Position[]>([])
const comparisonDialogVisible = ref(false)
const requirementsDialogVisible = ref(false)
const currentRequirements = ref<any>(null)
const businessLines = ref<any[]>([])

// 管理功能相关的响应式数据
const bulkEditDialogVisible = ref(false)
const addPositionDialogVisible = ref(false)
const editPositionDialogVisible = ref(false)
const importDialogVisible = ref(false)
const managementSettingsDialogVisible = ref(false)
const settingsActiveTab = ref('categories')

// 批量编辑表单
const bulkEditForm = reactive({
  editType: 'requirements',
  requirements: '',
  skills: [] as string[],
  careerPath: {
    nextLevel: '',
    estimatedTime: ''
  }
})

// 新增岗位表单
const addPositionForm = reactive<{
  name: string
  code: string
  level: string
  businessLineId: string | number
  lineId: number | null
  description: string
  coreSkills: string[]
  careerPath: {
    nextLevel: string
    estimatedTime: string
    lateralMoves: string[]
    specializations: string[]
    growthAreas: string[]
  }
  workEnvironment: {
    travel: string
    workType: string
  }
  isComprehensive: boolean
  isMarket: boolean
  benchmarkValue: number
}>({
  name: '',
  code: '',
  level: '',
  businessLineId: '',
  lineId: null,
  description: '',
  coreSkills: [],
  careerPath: {
    nextLevel: '',
    estimatedTime: '',
    lateralMoves: [],
    specializations: [],
    growthAreas: []
  },
  workEnvironment: {
    travel: '',
    workType: '全职'
  },
  isComprehensive: false,
  isMarket: false,
  benchmarkValue: 0.8
})

// 编辑岗位表单
const editPositionForm = reactive<{
  _id: string
  name: string
  code: string
  level: string
  businessLineId: string | number
  lineId: number | null
  description: string
  coreSkills: string[]
  careerPath: {
    nextLevel: string
    estimatedTime: string
    lateralMoves: string[]
    specializations: string[]
    growthAreas: string[]
  }
  workEnvironment: {
    travel: string
    workType: string
  }
  benchmarkValue: number
  isComprehensive: boolean
  isMarket: boolean
}>({
  _id: '',
  name: '',
  code: '',
  level: '',
  businessLineId: '',
  lineId: null,
  description: '',
  coreSkills: [],
  careerPath: {
    nextLevel: '',
    estimatedTime: '',
    lateralMoves: [],
    specializations: [],
    growthAreas: []
  },
  workEnvironment: {
    travel: '',
    workType: '全职'
  },
  benchmarkValue: 0.8,
  isComprehensive: false,
  isMarket: false
})

// 表单验证规则
const addPositionRules = {
  name: [{ required: true, message: '请输入岗位名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入岗位代码', trigger: 'blur' }],
  level: [{ required: true, message: '请选择职级', trigger: 'change' }],
  businessLineId: [{ required: true, message: '请选择业务线', trigger: 'change' }],
  description: [{ required: true, message: '请输入岗位描述', trigger: 'blur' }],
  coreSkills: [{ required: true, message: '请选择核心技能', trigger: 'change' }]
}

// 编辑岗位验证规则
const editPositionRules = {
  name: [{ required: true, message: '请输入岗位名称', trigger: 'blur' }],
  level: [{ required: true, message: '请选择职级', trigger: 'change' }],
  businessLineId: [{ required: true, message: '请选择业务线', trigger: 'change' }],
  description: [{ required: true, message: '请输入岗位描述', trigger: 'blur' }],
  coreSkills: [{ required: true, message: '请选择核心技能', trigger: 'change' }],
  benchmarkValue: [{ required: true, message: '请输入基准值', trigger: 'blur' }]
}

// 通用技能列表
const commonSkills = [
  '项目管理', '团队协调', '风险控制', '沟通协调',
  '技术方案设计', '客户需求分析', '技术交流', '方案演示',
  '产品规划', '需求分析', '用户体验设计', '数据分析',
  '战略规划', '团队管理', '业务拓展', '财务管理',
  '技术问题诊断', '客户服务', '系统维护', '文档编写',
  '部门管理', '业务统筹', '团队建设', '绩效管理',
  '招聘管理', '员工关系', '薪酬福利', '行政事务'
]

// 筛选表单
const filterForm = reactive({
  businessLineId: '',
  lineId: null as number | null, // 添加lineId支持
  search: '',
  category: '',
  subCategory: ''
})

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 24,
  total: 0,
  totalPages: 0
})

// 岗位数据
const positions = ref<Position[]>([])
const filteredPositions = ref<Position[]>([])

// 分类配置
const techSubCategories = [
  { label: '算法工程师', value: 'algorithm', type: 'primary' },
  { label: '软件工程师', value: 'software', type: 'success' },
  { label: '硬件工程师', value: 'hardware', type: 'warning' },
  { label: '测试工程师', value: 'testing', type: 'info' },
  { label: '架构师', value: 'architect', type: 'danger' }
]

const managementSubCategories = [
  { label: '项目经理', value: 'project-manager', type: 'primary' },
  { label: '产品经理', value: 'product-manager', type: 'success' },
  { label: '技术经理', value: 'tech-manager', type: 'warning' }
]

const presaleSubCategories = [
  { label: '售前业务专家', value: 'business-expert', type: 'primary' },
  { label: '售前技术专家', value: 'tech-expert', type: 'success' },
  { label: '行业解决方案专家', value: 'solution-expert', type: 'warning' }
]

const techManagementSubCategories = [
  { label: '技术总师', value: 'tech-chief', type: 'primary' },
  { label: '技术总监', value: 'tech-director', type: 'success' },
  { label: 'CTO', value: 'cto', type: 'danger' }
]

const comprehensiveOpsSubCategories = [
  { label: '综合运营专员', value: 'comprehensive-ops-specialist', type: 'primary' },
  { label: '综合运营主管', value: 'comprehensive-ops-supervisor', type: 'success' },
  { label: '综合运营经理', value: 'comprehensive-ops-manager', type: 'warning' }
]

const marketBusinessSubCategories = [
  { label: '市场专员', value: 'marketing-specialist', type: 'primary' },
  { label: '商务专员', value: 'business-specialist', type: 'success' },
  { label: '市场商务经理', value: 'market-business-manager', type: 'warning' }
]

const supportSubCategories = [
  { label: '销售工程师', value: 'sales-engineer', type: 'primary' },
  { label: '技术支持', value: 'tech-support', type: 'success' },
  { label: '数据分析师', value: 'data-analyst', type: 'warning' }
]

// 计算属性
const comparisonData = computed(() => {
  if (selectedPositions.value.length === 0) return []
  
  return [
    { attribute: '岗位名称', ...selectedPositions.value.reduce((acc, pos) => ({ ...acc, [pos._id || pos.id || '']: pos.name }), {}) },
    { attribute: '职级', ...selectedPositions.value.reduce((acc, pos) => ({ ...acc, [pos._id || pos.id || '']: pos.level }), {}) },
    { attribute: '业务线', ...selectedPositions.value.reduce((acc, pos) => ({ ...acc, [pos._id || pos.id || '']: pos.businessLine?.name || '无' }), {}) },
    { attribute: '核心技能', ...selectedPositions.value.reduce((acc, pos) => ({ ...acc, [pos._id || pos.id || '']: pos.coreSkills?.slice(0, 3).join(', ') || '无' }), {}) },
    { attribute: '发展方向', ...selectedPositions.value.reduce((acc, pos) => ({ ...acc, [pos._id || pos.id || '']: pos.careerPath?.nextLevel || '暂无' }), {}) },
    { attribute: '预计晋升时间', ...selectedPositions.value.reduce((acc, pos) => ({ ...acc, [pos._id || pos.id || '']: pos.careerPath?.estimatedTime || '待定' }), {}) }
  ]
})

// 方法
const loadBusinessLines = async () => {
  try {
    const { businessLineApi } = await import('@/api/businessLine')
    const response = await businessLineApi.getBusinessLines()
    if (response.data?.businessLines) {
      businessLines.value = response.data.businessLines
    }
  } catch (error) {
    console.error('加载业务线失败:', error)
    ElMessage.warning('加载业务线失败')
  }
}

const refreshData = async () => {
  loading.value = true
  try {
    const response = await positionApi.getPositions({
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    positions.value = response.data.positions || []
    applyFilters()
    ElMessage.success('数据刷新成功')
  } catch (error) {
    ElMessage.error('数据刷新失败')
  } finally {
    loading.value = false
  }
}

const handleBusinessLineChange = () => {
  pagination.page = 1
  applyFilters()
}

const handleSearch = () => {
  pagination.page = 1
  applyFilters()
}

const handleReset = () => {
  Object.assign(filterForm, {
    businessLineId: '',
    lineId: null,
    search: '',
    category: '',
    subCategory: ''
  })
  pagination.page = 1
  applyFilters()
}

const handleCategoryChange = () => {
  filterForm.subCategory = ''
  applyFilters()
}

const selectSubCategory = (subCategory: string) => {
  filterForm.subCategory = subCategory
  applyFilters()
}

const applyFilters = () => {
  let filtered = [...positions.value]
  
  // 业务线筛选 - 支持lineId和businessLineId
  if (filterForm.businessLineId) {
    console.log('应用业务线筛选:', filterForm.businessLineId)
    console.log('筛选前岗位数量:', filtered.length)
    filtered = filtered.filter(pos => {
      const businessLineMatch = String(pos.businessLine?.id) === filterForm.businessLineId
      const lineIdMatch = String(pos.lineId) === filterForm.businessLineId
      const match = businessLineMatch || lineIdMatch
      console.log(`岗位 ${pos.name} 业务线ID: ${pos.businessLine?.id || pos.lineId}, 匹配: ${match}`)
      return match
    })
    console.log('筛选后岗位数量:', filtered.length)
  }
  
  // 搜索筛选
  if (filterForm.search) {
    const searchLower = filterForm.search.toLowerCase()
    filtered = filtered.filter(pos => 
      pos.name.toLowerCase().includes(searchLower) ||
      pos.code.toLowerCase().includes(searchLower) ||
      (pos.description && pos.description.toLowerCase().includes(searchLower))
    )
  }
  
  // 分类筛选
  if (filterForm.category) {
    // 这里可以根据岗位类型进行筛选
  }
  
  filteredPositions.value = filtered
  pagination.total = filtered.length
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
  refreshData()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  refreshData()
}

const togglePositionSelection = (position: Position) => {
  const positionId = position._id || position.id
  if (!positionId) return
  
  const index = selectedPositions.value.findIndex(p => (p._id || p.id) === positionId)
  if (index > -1) {
    selectedPositions.value.splice(index, 1)
  } else {
    if (selectedPositions.value.length >= 3) {
      ElMessage.warning('最多只能选择3个岗位进行对比')
      return
    }
    selectedPositions.value.push(position)
  }
}

const isPositionSelected = (positionId: string | number) => {
  return selectedPositions.value.some(p => (p._id || p.id) === positionId)
}

const viewPositionDetail = (position: Position) => {
  router.push(`/position/encyclopedia/${position._id || position.id}`)
}

const showComparison = () => {
  if (selectedPositions.value.length < 2) {
    ElMessage.warning('请至少选择2个岗位进行对比')
    return
  }
  comparisonDialogVisible.value = true
}

const handleCloseComparison = () => {
  comparisonDialogVisible.value = false
}

const exportComparison = () => {
  // 导出对比结果
  ElMessage.success('对比结果导出功能开发中...')
}

const showPositionRequirements = async (category: string) => {
  // 岗位代码映射 - 将前端分类映射到数据库中的实际岗位代码
  const categoryToPositionCode: Record<string, string> = {
    // 技术研发类
    'algorithm': 'SR_PRESALE_CONSULTANT', // 算法工程师 -> 高级售前顾问（技术导向）
    'software': 'PROJECT_MANAGER', // 软件工程师 -> 项目经理（技术管理）
    'hardware': 'TECH_SUPPORT_SPECIALIST', // 硬件工程师 -> 技术支持专员
    'testing': 'TECH_SUPPORT_SPECIALIST', // 测试工程师 -> 技术支持专员
    'architect': 'SR_PRODUCT_MANAGER', // 架构师 -> 高级产品经理（技术战略）
    
    // 项目管理类
    'project-manager': 'PROJECT_MANAGER',
    'product-manager': 'SR_PRODUCT_MANAGER',
    'tech-manager': 'DEPT_MANAGER',
    
    // 售前业务类
    'business-expert': 'SR_PRESALE_CONSULTANT',
    'tech-expert': 'SR_PRESALE_CONSULTANT',
    'solution-expert': 'SR_PRESALE_CONSULTANT',
    
    // 技术管理类
    'tech-chief': 'SR_PRODUCT_MANAGER',
    'tech-director': 'SR_PRODUCT_MANAGER',
    'cto': 'CEO',
    
    // 综合运营类
    'comprehensive-ops-specialist': 'HR_ADMIN_SPECIALIST',
    'comprehensive-ops-supervisor': 'DEPT_MANAGER',
    'comprehensive-ops-manager': 'DEPT_MANAGER',
    
    // 市场商务类
    'marketing-specialist': 'HR_ADMIN_SPECIALIST', // 重用类似岗位要求
    'business-specialist': 'DEPT_MANAGER',
    'market-business-manager': 'DEPT_MANAGER',
    
    // 业务支持类
    'sales-engineer': 'SR_PRESALE_CONSULTANT',
    'tech-support': 'TECH_SUPPORT_SPECIALIST',
    'data-analyst': 'SR_PRODUCT_MANAGER',
    
    // 常见数据库岗位代码直接映射
    'PM': 'PROJECT_MANAGER',
    'SC_SENIOR': 'SR_PRESALE_CONSULTANT',
    'SC': 'TECH_SUPPORT_SPECIALIST',
    'SC_JUNIOR': 'TECH_SUPPORT_SPECIALIST',
    'PRESALE_DIRECTOR': 'CEO',
    'PRESALE_SENIOR': 'SR_PRESALE_CONSULTANT',
    'PRESALE': 'SR_PRESALE_CONSULTANT'
  }
  
  let positionCode = categoryToPositionCode[category]
  
  // 如果找不到映射，尝试直接使用category作为code
  if (!positionCode) {
    positionCode = category.toUpperCase()
    console.log(`未找到直接映射，尝试使用 ${positionCode}`)
  }
  
  // 从API获取岗位需求
  try {
    const { getPositionRequirementsByCode } = await import('@/api/positionRequirements')
    const response = await getPositionRequirementsByCode(positionCode)
    
    if (response.code === 200 && response.data) {
      currentRequirements.value = {
        label: response.data.positionName,
        direction: `${response.data.positionName}职业发展方向`,
        basicRequirements: response.data.basicRequirements || [],
        skills: response.data.skills || [],
        experience: response.data.experience || [],
        careerPath: {
          nextLevel: response.data.careerPath?.nextLevel || '暂无',
          estimatedTime: response.data.careerPath?.estimatedTime || '待定',
          lateralMoves: response.data.careerPath?.lateralMoves || []
        },
        salaryRange: {
          junior: response.data.salaryRange?.junior || '暂无',
          middle: response.data.salaryRange?.middle || '暂无',
          senior: response.data.salaryRange?.senior || '暂无',
          factors: response.data.salaryRange?.factors || []
        }
      }
      requirementsDialogVisible.value = true
    } else {
      console.log(`未找到岗位要求信息: ${positionCode}`)
      ElMessage.info(`岗位 "${category}" 的详细要求信息暂未配置`)
    }
  } catch (error) {
    console.error('获取岗位要求失败:', error)
    ElMessage.error('网络错误，获取岗位要求信息失败')
  }
}

const handleCloseRequirements = () => {
  requirementsDialogVisible.value = false
  currentRequirements.value = null
}

const viewSimilarPositions = () => {
  ElMessage.info('查看相似岗位功能开发中...')
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

// ==================== 管理功能 ====================

// 权限检查计算属性
const hasManagementPermission = computed(() => {
  // 这里需要根据实际的权限系统来判断
  // 暂时返回true，后续集成权限系统
  return true
})

const canEditPosition = (position: Position) => {
  // 检查是否有编辑权限
  // 暂时返回true，后续集成权限系统
  return true
}

const canDeletePosition = (position: Position) => {
  // 检查是否有删除权限
  // 暂时返回true，后续集成权限系统
  return true
}

// 管理功能函数
const showBulkEditDialog = () => {
  if (selectedPositions.value.length === 0) {
    ElMessage.warning('请先选择要编辑的岗位')
    return
  }
  
  // 重置表单到默认状态
  Object.assign(bulkEditForm, {
    editType: 'requirements',
    requirements: '',
    skills: [],
    careerPath: {
      nextLevel: '',
      estimatedTime: ''
    }
  })
  
  bulkEditDialogVisible.value = true
}

const showAddPositionDialog = () => {
  addPositionDialogVisible.value = true
}

const exportPositions = () => {
  ElMessage.info('导出功能开发中...')
}

const openDataImport = () => {
  importDialogVisible.value = true
}

const editPosition = (position: Position) => {
  // 填充编辑表单数据
  Object.assign(editPositionForm, {
    name: position.name,
    code: position.code,
    level: position.level,
    businessLineId: position.businessLineId || position.lineId,
    lineId: position.lineId || null,
    description: position.description || '',
    coreSkills: position.coreSkills || [],
    careerPath: {
      nextLevel: position.careerPath?.nextLevel || '',
      estimatedTime: position.careerPath?.estimatedTime || '',
      lateralMoves: position.careerPath?.lateralMoves || [],
      specializations: position.careerPath?.specializations || [],
      growthAreas: position.careerPath?.growthAreas || []
    },
    workEnvironment: {
      travel: position.workEnvironment?.travel || '',
      workType: position.workEnvironment?.workType || '全职'
    },
    benchmarkValue: position.benchmarkValue || 0.8,
    isComprehensive: position.isComprehensive || false,
    isMarket: position.isMarket || false
  })
  
  // 保存岗位ID用于更新
  editPositionForm._id = String(position._id || position.id || '')
  
  // 打开编辑对话框
  editPositionDialogVisible.value = true
}

const deletePosition = async (position: Position) => {
  try {
    // 确认删除
    const confirmed = await ElMessageBox.confirm(
      `确定要删除岗位"${position.name}"吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    if (confirmed) {
      const response = await positionApi.deletePosition(position._id || position.id || '')
      
      if (response.data?.code === 200) {
        ElMessage.success('岗位删除成功')
        // 刷新数据
        await refreshData()
      } else {
        ElMessage.error(response.data?.message || '岗位删除失败')
      }
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除岗位失败:', error)
      ElMessage.error('删除岗位失败')
    }
  }
}

// 批量编辑相关方法
const handleCloseBulkEdit = () => {
  bulkEditDialogVisible.value = false
  // 重置表单
  Object.assign(bulkEditForm, {
    editType: 'requirements',
    requirements: '',
    skills: [],
    careerPath: { nextLevel: '', estimatedTime: '' }
  })
}

const removeFromSelection = (position: Position) => {
  const index = selectedPositions.value.findIndex(p => (p._id || p.id) === (position._id || position.id))
  if (index > -1) {
    selectedPositions.value.splice(index, 1)
  }
}

// 清空所有选择
const clearAllSelections = () => {
  selectedPositions.value = []
  ElMessage.info('已清空所有选择')
}

// 全选所有岗位
const selectAllPositions = () => {
  selectedPositions.value = [...filteredPositions.value]
  ElMessage.success(`已选择全部 ${filteredPositions.value.length} 个岗位`)
}

const executeBulkEdit = async () => {
  try {
    const positionIds = selectedPositions.value.map(p => p._id || p.id).filter(id => id) as (string | number)[]
    
    if (positionIds.length === 0) {
      ElMessage.warning('没有有效的岗位ID')
      return
    }
    
    // 准备更新数据
    let updateData = {}
    switch (bulkEditForm.editType) {
      case 'requirements':
        updateData = { requirements: bulkEditForm.requirements }
        break
      case 'skills':
        updateData = { skills: bulkEditForm.skills }
        break
      case 'careerPath':
        updateData = { careerPath: bulkEditForm.careerPath }
        break
    }

    // 添加调试日志
    console.log('🔍 批量更新调试信息:')
    console.log('   positionIds:', positionIds)
    console.log('   updateType:', bulkEditForm.editType)
    console.log('   updateData:', updateData)

    // 调用后端API进行批量更新
    const response = await positionApi.batchUpdatePositions({
      positionIds,
      updateType: bulkEditForm.editType as 'requirements' | 'skills' | 'careerPath',
      updateData
    })

    if (response.data?.code === 200) {
      ElMessage.success('批量更新成功')
      bulkEditDialogVisible.value = false
      // 清空选择
      selectedPositions.value = []
      // 刷新数据
      await refreshData()
    } else {
      ElMessage.error(response.data?.message || '批量更新失败')
    }
  } catch (error) {
    console.error('批量更新失败:', error)
    ElMessage.error('批量更新失败')
  }
}

// 新增岗位相关方法
const handleCloseAddPosition = () => {
  addPositionDialogVisible.value = false
  // 重置表单
  Object.assign(addPositionForm, {
    name: '',
    code: '',
    level: '',
    businessLineId: '',
    lineId: null,
    description: '',
    coreSkills: [],
    careerPath: {
      nextLevel: '',
      estimatedTime: '',
      lateralMoves: [],
      specializations: [],
      growthAreas: []
    },
    workEnvironment: {
      travel: '',
      workType: '全职'
    },
    isComprehensive: false,
    isMarket: false,
    benchmarkValue: 0.8
  })
}

const submitAddPosition = async () => {
  try {
    // 调用后端API新增岗位
    const response = await positionApi.createPosition({
      name: addPositionForm.name,
      code: addPositionForm.code,
      level: addPositionForm.level,
      businessLineId: addPositionForm.businessLineId,
      lineId: Number(addPositionForm.lineId || addPositionForm.businessLineId),
      description: addPositionForm.description,
      coreSkills: addPositionForm.coreSkills,
      careerPath: addPositionForm.careerPath,
      benchmarkValue: addPositionForm.benchmarkValue
    })

    if (response.data?.code === 200) {
      ElMessage.success('岗位新增成功')
      addPositionDialogVisible.value = false
      // 刷新数据
      await refreshData()
    } else {
      ElMessage.error(response.data?.message || '岗位新增失败')
    }
  } catch (error) {
    console.error('岗位新增失败:', error)
    ElMessage.error('岗位新增失败')
  }
}

// 编辑岗位相关方法
const handleCloseEditPosition = () => {
  editPositionDialogVisible.value = false
  // 重置表单
  Object.assign(editPositionForm, {
    _id: '',
    name: '',
    code: '',
    level: '',
    businessLineId: '',
    lineId: null,
    description: '',
    coreSkills: [],
    careerPath: {
      nextLevel: '',
      estimatedTime: '',
      lateralMoves: [],
      specializations: [],
      growthAreas: []
    },
    workEnvironment: {
      travel: '',
      workType: '全职'
    },
    benchmarkValue: 0.8,
    isComprehensive: false,
    isMarket: false
  })
}

const submitEditPosition = async () => {
  try {
    // 调用后端API更新岗位
    const response = await positionApi.updatePosition(
      editPositionForm._id, // 使用岗位ID
      {
        name: editPositionForm.name,
        level: editPositionForm.level,
        businessLineId: editPositionForm.businessLineId,
        lineId: Number(editPositionForm.lineId || editPositionForm.businessLineId),
        description: editPositionForm.description,
        coreSkills: editPositionForm.coreSkills,
        careerPath: editPositionForm.careerPath,
        benchmarkValue: editPositionForm.benchmarkValue
      }
    )

    if (response.data?.code === 200) {
      ElMessage.success('岗位更新成功')
      editPositionDialogVisible.value = false
      // 刷新数据
      await refreshData()
    } else {
      ElMessage.error(response.data?.message || '岗位更新失败')
    }
  } catch (error) {
    console.error('岗位更新失败:', error)
    ElMessage.error('岗位更新失败')
  }
}

// 数据导入相关方法
const handleCloseImport = () => {
  importDialogVisible.value = false
}

const handleFileUpload = (file: File) => {
  // 文件上传前的处理
  const isValidFormat = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'].includes(file.type)
  const isValidSize = file.size / 1024 / 1024 < 5
  
  if (!isValidFormat) {
    ElMessage.error('上传文件只能是 xlsx、xls 或 csv 格式!')
    return false
  }
  
  if (!isValidSize) {
    ElMessage.error('上传文件大小不能超过 5MB!')
    return false
  }
  
  return true
}

const confirmImport = () => {
  ElMessage.info('数据导入功能开发中...')
  importDialogVisible.value = false
}

// 管理设置相关方法
const showManagementSettings = () => {
  managementSettingsDialogVisible.value = true
}

const handleCloseManagementSettings = () => {
  managementSettingsDialogVisible.value = false
}

// 生命周期
onMounted(() => {
  refreshData()
  loadBusinessLines()
})
</script>

<style scoped>
.position-encyclopedia {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
  text-align: center;
}

.page-header h2 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 24px;
}

.page-description {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

/* 管理工具栏样式 */
.management-toolbar {
  margin-bottom: 20px;
}

.toolbar-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
}

.toolbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 10px;
}

.toolbar-left .el-button,
.toolbar-right .el-button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  backdrop-filter: blur(10px);
}

.toolbar-left .el-button:hover,
.toolbar-right .el-button:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
}

.toolbar-left .el-button:disabled {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
}

.business-line-filter {
  margin-bottom: 20px;
}

.filter-card {
  background: #f5f7fa;
}

.category-navigation {
  margin-bottom: 20px;
}

.category-card {
  background: #fff;
}

.sub-categories {
  padding: 10px 0;
}

.sub-category-tag {
  margin: 5px;
  cursor: pointer;
  transition: all 0.3s;
}

.sub-category-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 批量编辑对话框样式 */
.bulk-edit-content {
  max-height: 70vh;
  overflow-y: auto;
  padding: 0 10px;
}

.selected-positions-section {
  margin-bottom: 20px;
}

.selected-positions-section h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
}

.selected-positions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
  min-height: 40px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px dashed #dcdfe6;
}

.position-tag {
  margin: 0;
  background: #409eff;
  color: white;
  border: none;
  font-weight: 500;
}

.position-code {
  margin-left: 5px;
  opacity: 0.8;
  font-size: 12px;
}

.selection-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
}

.edit-form-section {
  margin-top: 20px;
}

.bulk-edit-form {
  max-width: 100%;
}

.skills-help {
  margin-top: 8px;
  color: #909399;
}

/* 技能选择下拉框样式 */
.skills-select-dropdown {
  max-height: 300px;
}

/* 对话框调整大小样式 */
.el-dialog {
  border-radius: 8px;
}

.el-dialog__header {
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  border-radius: 8px 8px 0 0;
}

.el-dialog__body {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.el-dialog__footer {
  background: #f5f7fa;
  border-top: 1px solid #e4e7ed;
  border-radius: 0 0 8px 8px;
  padding: 15px 20px;
}

.position-display {
  margin-top: 20px;
}

.display-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.result-info {
  font-size: 14px;
  color: #606266;
}

.result-info .count {
  color: #409eff;
  font-weight: bold;
}

.display-actions {
  display: flex;
  gap: 10px;
}

.position-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.position-card {
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.position-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.position-card.selected {
  border-color: #409eff;
  background: #f0f9ff;
}

.position-header {
  margin-bottom: 15px;
}

.position-header h3 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 18px;
}

.position-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.position-skills {
  margin-bottom: 15px;
}

.skills-title {
  font-weight: bold;
  margin-bottom: 8px;
  color: #606266;
}

.skill-tag {
  margin: 2px;
}

.position-path {
  margin-bottom: 15px;
}

.path-title {
  font-weight: bold;
  margin-bottom: 5px;
  color: #606266;
}

.path-content {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.next-level {
  color: #409eff;
  font-weight: bold;
}

.estimated-time {
  color: #909399;
  font-size: 12px;
}

.lateral-moves {
  margin-top: 8px;
}

.moves-title {
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
}

.move-tag {
  margin: 2px 4px 2px 0;
  font-size: 11px;
}

.specialization-tag {
  margin: 2px;
  font-size: 11px;
}

.work-environment {
  margin-bottom: 15px;
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  align-items: center;
}

.work-environment .el-tag {
  font-size: 11px;
  border-radius: 12px;
  padding: 0 8px;
}

.position-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.comparison-content {
  max-height: 500px;
  overflow-y: auto;
}

.comparison-table {
  width: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.requirements-content {
  padding: 20px 0;
}

.requirements-content h4 {
  margin: 15px 0 10px 0;
  color: #303133;
  border-bottom: 2px solid #409eff;
  padding-bottom: 5px;
}

.requirements-content ul {
  margin: 0;
  padding-left: 20px;
}

.requirements-content li {
  margin-bottom: 8px;
  color: #606266;
  line-height: 1.6;
}

.career-path-info p,
.salary-info p {
  margin: 8px 0;
  color: #606266;
  line-height: 1.6;
}

.career-path-info strong,
.salary-info strong {
  color: #303133;
  margin-right: 10px;
}

/* 业务线选择器下拉框样式 */
:deep(.business-line-select-dropdown) {
  min-width: 250px !important;
  max-width: 300px !important;
}

:deep(.business-line-select-dropdown .el-select-dropdown__item) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 20px;
  line-height: 34px;
  min-height: 34px;
}

:deep(.business-line-select-dropdown .el-select-dropdown__item:hover) {
  background-color: #f5f7fa;
}

:deep(.business-line-select-dropdown .el-select-dropdown__item.selected) {
  color: #409eff;
  font-weight: bold;
}

/* 业务线选择器本身样式 */
.business-line-select {
  min-width: 250px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .business-line-select {
    min-width: 200px;
  }
  
  :deep(.business-line-select-dropdown) {
    min-width: 200px !important;
  }
}

/* 管理功能对话框样式 */
.bulk-edit-content,
.management-settings-content {
  padding: 0;
  height: 80vh;
  overflow: hidden;
}

.management-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.management-tabs :deep(.el-tabs__header) {
  margin: 0 0 20px 0;
  background: #f5f7fa;
  border-radius: 6px;
  padding: 10px;
}

.management-tabs :deep(.el-tabs__nav-wrap) {
  padding: 0;
}

.management-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
  padding: 0;
}

.management-tabs :deep(.el-tab-pane) {
  height: 100%;
  overflow: hidden;
}

.selected-positions {
  margin-bottom: 20px;
}

.selected-positions h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

/* 表单样式优化 */
.el-form-item {
  margin-bottom: 20px;
}

.el-radio-group {
  display: flex;
  gap: 20px;
}

.el-radio {
  margin-right: 0;
}
</style>
