<template>
  <div class="improvement-suggestions">
    <!-- Header -->
    <div class="suggestions-header">
      <div class="header-content">
        <h4>个性化改进建议</h4>
        <div class="suggestions-stats">
          <el-badge :value="highPrioritySuggestions.length" type="danger" :hidden="highPrioritySuggestions.length === 0">
            <span class="stats-item">高优先级</span>
          </el-badge>
          <el-badge :value="completedSuggestions.length" type="success" :hidden="completedSuggestions.length === 0">
            <span class="stats-item">已完成</span>
          </el-badge>
        </div>
      </div>
      
      <div class="header-actions">
        <el-button size="small" @click="refreshSuggestions" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新建议
        </el-button>
        <el-dropdown @command="handleFilterChange">
          <el-button size="small">
            <el-icon><Filter /></el-icon>
            筛选 <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="all">全部建议</el-dropdown-item>
              <el-dropdown-item command="high">高优先级</el-dropdown-item>
              <el-dropdown-item command="pending">未完成</el-dropdown-item>
              <el-dropdown-item command="completed">已完成</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="4" animated />
    </div>

    <!-- No Suggestions -->
    <div v-else-if="filteredSuggestions.length === 0" class="no-suggestions">
      <el-empty description="暂无改进建议">
        <template #description>
          <p v-if="suggestions.length === 0">暂时没有个性化建议</p>
          <p v-else>没有符合筛选条件的建议</p>
        </template>
        <el-button v-if="suggestions.length === 0" type="primary" @click="refreshSuggestions">
          获取建议
        </el-button>
      </el-empty>
    </div>

    <!-- Suggestions Content -->
    <div v-else class="suggestions-content">
      <!-- Priority Suggestions -->
      <div v-if="highPrioritySuggestions.length > 0 && currentFilter === 'all'" class="priority-section">
        <div class="section-header">
          <h5>
            <el-icon><Star /></el-icon>
            优先建议
          </h5>
          <div class="priority-badge">{{ highPrioritySuggestions.length }} 项</div>
        </div>
        
        <div class="priority-suggestions">
          <div 
            v-for="suggestion in highPrioritySuggestions.slice(0, 2)" 
            :key="suggestion.id"
            class="priority-suggestion-card"
          >
            <div class="card-header">
              <div class="suggestion-category" :class="getCategoryClass(suggestion.category)">
                <el-icon>
                  <component :is="getCategoryIcon(suggestion.category)" />
                </el-icon>
                {{ getCategoryLabel(suggestion.category) }}
              </div>
              <el-tag type="danger" size="small">高优先级</el-tag>
            </div>
            
            <div class="card-content">
              <h6>{{ suggestion.title }}</h6>
              <p>{{ suggestion.description }}</p>
              <div class="suggestion-meta">
                <span class="potential-impact">
                  <el-icon><TrendCharts /></el-icon>
                  预期提升: +{{ suggestion.potentialImpact }}%
                </span>
                <span class="time-frame">
                  <el-icon><Clock /></el-icon>
                  {{ suggestion.timeFrame }}
                </span>
              </div>
            </div>
            
            <div class="card-actions">
              <el-button size="small" type="primary" @click="showSuggestionDetail(suggestion)">
                查看详情
              </el-button>
              <el-button size="small" @click="markCompleted(suggestion.id)" v-if="!suggestion.completed">
                标记完成
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Category Tabs -->
      <div class="category-tabs">
        <el-tabs v-model="activeCategory" @tab-click="handleCategoryClick">
          <el-tab-pane label="全部" name="all">
            <div class="suggestions-list">
              <SuggestionItem
                v-for="suggestion in paginatedSuggestions"
                :key="suggestion.id"
                :suggestion="suggestion"
                @complete="markCompleted"
                @detail="showSuggestionDetail"
              />
            </div>
          </el-tab-pane>
          
          <el-tab-pane :label="getCategoryLabel('performance')" name="performance">
            <div class="suggestions-list">
              <SuggestionItem
                v-for="suggestion in getSuggestionsByCategory('performance')"
                :key="suggestion.id"
                :suggestion="suggestion"
                @complete="markCompleted"
                @detail="showSuggestionDetail"
              />
            </div>
          </el-tab-pane>
          
          <el-tab-pane :label="getCategoryLabel('skills')" name="skills">
            <div class="suggestions-list">
              <SuggestionItem
                v-for="suggestion in getSuggestionsByCategory('skills')"
                :key="suggestion.id"
                :suggestion="suggestion"
                @complete="markCompleted"
                @detail="showSuggestionDetail"
              />
            </div>
          </el-tab-pane>
          
          <el-tab-pane :label="getCategoryLabel('projects')" name="projects">
            <div class="suggestions-list">
              <SuggestionItem
                v-for="suggestion in getSuggestionsByCategory('projects')"
                :key="suggestion.id"
                :suggestion="suggestion"
                @complete="markCompleted"
                @detail="showSuggestionDetail"
              />
            </div>
          </el-tab-pane>
          
          <el-tab-pane :label="getCategoryLabel('collaboration')" name="collaboration">
            <div class="suggestions-list">
              <SuggestionItem
                v-for="suggestion in getSuggestionsByCategory('collaboration')"
                :key="suggestion.id"
                :suggestion="suggestion"
                @complete="markCompleted"
                @detail="showSuggestionDetail"
              />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="filteredSuggestions.length"
          layout="prev, pager, next, jumper"
          small
          @current-change="handlePageChange"
        />
      </div>

      <!-- Progress Summary -->
      <div class="progress-summary">
        <div class="summary-header">
          <h5>改进进度</h5>
          <div class="progress-stats">
            {{ completedSuggestions.length }} / {{ suggestions.length }} 已完成
          </div>
        </div>
        
        <el-progress
          :percentage="completionPercentage"
          :color="getProgressColor(completionPercentage)"
          :stroke-width="10"
        />
        
        <div class="progress-details">
          <div class="detail-item">
            <span class="detail-label">高优先级完成:</span>
            <span class="detail-value">{{ completedHighPriority }} / {{ highPrioritySuggestions.length }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">预期总提升:</span>
            <span class="detail-value">+{{ totalPotentialImpact }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Suggestion Detail Dialog -->
    <el-dialog 
      v-model="showDetailDialog" 
      :title="selectedSuggestion?.title"
      width="600px"
      class="suggestion-detail-dialog"
    >
      <div v-if="selectedSuggestion" class="suggestion-detail">
        <div class="detail-header">
          <div class="category-info">
            <el-tag :type="getCategoryTagType(selectedSuggestion.category)">
              {{ getCategoryLabel(selectedSuggestion.category) }}
            </el-tag>
            <el-tag :type="getPriorityTagType(selectedSuggestion.priority)" size="small">
              {{ getPriorityLabel(selectedSuggestion.priority) }}优先级
            </el-tag>
          </div>
          <div class="impact-info">
            <div class="impact-value">+{{ selectedSuggestion.potentialImpact }}%</div>
            <div class="impact-label">预期提升</div>
          </div>
        </div>

        <div class="detail-description">
          <h6>详细说明</h6>
          <p>{{ selectedSuggestion.description }}</p>
        </div>

        <div class="action-steps">
          <h6>执行步骤</h6>
          <el-steps :active="activeStep" direction="vertical" size="small">
            <el-step
              v-for="(step, index) in selectedSuggestion.actionSteps"
              :key="index"
              :title="`步骤 ${index + 1}`"
              :description="step"
              :status="getStepStatus(index)"
            />
          </el-steps>
        </div>

        <div class="detail-meta">
          <div class="meta-item">
            <el-icon><Clock /></el-icon>
            <span>预计时间: {{ selectedSuggestion.timeFrame }}</span>
          </div>
          <div class="meta-item">
            <el-icon><TrendCharts /></el-icon>
            <span>影响程度: {{ selectedSuggestion.potentialImpact }}%</span>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showDetailDialog = false">关闭</el-button>
          <el-button 
            v-if="selectedSuggestion && !selectedSuggestion.completed" 
            type="primary" 
            @click="markCompleted(selectedSuggestion.id)"
          >
            标记为完成
          </el-button>
          <el-button 
            v-if="selectedSuggestion?.completed" 
            type="success" 
            disabled
          >
            已完成
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Refresh, Filter, ArrowDown, Star, TrendCharts, Clock,
  User, Tools, FolderOpened, UserFilled
} from '@element-plus/icons-vue'
import type { ImprovementSuggestion } from '@/api/personalBonus'

// Define SuggestionItem component inline
const SuggestionItem = {
  props: {
    suggestion: {
      type: Object as PropType<ImprovementSuggestion>,
      required: true
    }
  },
  emits: ['complete', 'detail'],
  template: `
    <div class="suggestion-item" :class="{ completed: suggestion.completed }">
      <div class="item-header">
        <div class="category-icon" :class="getCategoryClass(suggestion.category)">
          <el-icon>
            <component :is="getCategoryIcon(suggestion.category)" />
          </el-icon>
        </div>
        <div class="item-info">
          <h6>{{ suggestion.title }}</h6>
          <p>{{ suggestion.description }}</p>
        </div>
        <div class="item-meta">
          <el-tag :type="getPriorityTagType(suggestion.priority)" size="small">
            {{ getPriorityLabel(suggestion.priority) }}
          </el-tag>
          <div class="potential-impact">+{{ suggestion.potentialImpact }}%</div>
        </div>
      </div>
      
      <div class="item-footer">
        <div class="footer-info">
          <span class="time-frame">
            <el-icon><Clock /></el-icon>
            {{ suggestion.timeFrame }}
          </span>
          <span class="steps-count">{{ suggestion.actionSteps.length }} 个步骤</span>
        </div>
        <div class="footer-actions">
          <el-button size="small" @click="$emit('detail', suggestion)">
            详情
          </el-button>
          <el-button 
            v-if="!suggestion.completed"
            size="small" 
            type="primary" 
            @click="$emit('complete', suggestion.id)"
          >
            完成
          </el-button>
          <el-tag v-else type="success" size="small">已完成</el-tag>
        </div>
      </div>
    </div>
  `
}

interface Props {
  suggestions: ImprovementSuggestion[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  suggestionComplete: [suggestionId: string]
}>()

// Reactive data
const currentFilter = ref('all')
const activeCategory = ref('all')
const currentPage = ref(1)
const pageSize = ref(5)
const showDetailDialog = ref(false)
const selectedSuggestion = ref<ImprovementSuggestion | null>(null)
const activeStep = ref(0)

// Computed properties
const filteredSuggestions = computed(() => {
  let filtered = props.suggestions

  // Apply filter
  switch (currentFilter.value) {
    case 'high':
      filtered = filtered.filter(s => s.priority === 'high')
      break
    case 'pending':
      filtered = filtered.filter(s => !s.completed)
      break
    case 'completed':
      filtered = filtered.filter(s => s.completed)
      break
  }

  // Apply category filter
  if (activeCategory.value !== 'all') {
    filtered = filtered.filter(s => s.category === activeCategory.value)
  }

  return filtered
})

const paginatedSuggestions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredSuggestions.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredSuggestions.value.length / pageSize.value)
})

const highPrioritySuggestions = computed(() => {
  return props.suggestions.filter(s => s.priority === 'high')
})

const completedSuggestions = computed(() => {
  return props.suggestions.filter(s => s.completed)
})

const completionPercentage = computed(() => {
  if (props.suggestions.length === 0) return 0
  return Math.round((completedSuggestions.value.length / props.suggestions.length) * 100)
})

const completedHighPriority = computed(() => {
  return highPrioritySuggestions.value.filter(s => s.completed).length
})

const totalPotentialImpact = computed(() => {
  return props.suggestions.reduce((sum, s) => sum + s.potentialImpact, 0)
})

// Utility functions
const getCategoryClass = (category: string) => {
  const classes = {
    performance: 'category-performance',
    skills: 'category-skills',
    projects: 'category-projects',
    collaboration: 'category-collaboration'
  }
  return classes[category] || 'category-default'
}

const getCategoryIcon = (category: string) => {
  const icons = {
    performance: 'TrendCharts',
    skills: 'Tools',
    projects: 'FolderOpened',
    collaboration: 'UserFilled'
  }
  return icons[category] || 'Star'
}

const getCategoryLabel = (category: string) => {
  const labels = {
    performance: '绩效提升',
    skills: '技能发展',
    projects: '项目参与',
    collaboration: '团队协作'
  }
  return labels[category] || category
}

const getCategoryTagType = (category: string) => {
  const types = {
    performance: 'success',
    skills: 'primary',
    projects: 'warning',
    collaboration: 'info'
  }
  return types[category] || 'info'
}

const getPriorityTagType = (priority: string) => {
  const types = {
    high: 'danger',
    medium: 'warning',
    low: 'info'
  }
  return types[priority] || 'info'
}

const getPriorityLabel = (priority: string) => {
  const labels = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return labels[priority] || priority
}

const getProgressColor = (percentage: number) => {
  if (percentage >= 80) return '#67c23a'
  if (percentage >= 50) return '#e6a23c'
  return '#f56c6c'
}

const getSuggestionsByCategory = (category: string) => {
  return props.suggestions.filter(s => s.category === category)
}

const getStepStatus = (index: number) => {
  if (selectedSuggestion.value?.completed) return 'success'
  if (index <= activeStep.value) return 'process'
  return 'wait'
}

// Event handlers
const refreshSuggestions = () => {
  ElMessage.info('刷新建议功能开发中...')
}

const handleFilterChange = (command: string) => {
  currentFilter.value = command
  currentPage.value = 1
}

const handleCategoryClick = () => {
  currentPage.value = 1
}

const handlePageChange = (page: number) => {
  currentPage.value = page
}

const markCompleted = (suggestionId: string) => {
  const suggestion = props.suggestions.find(s => s.id === suggestionId)
  if (suggestion) {
    suggestion.completed = true
    emit('suggestionComplete', suggestionId)
    
    if (showDetailDialog.value && selectedSuggestion.value?.id === suggestionId) {
      showDetailDialog.value = false
    }
  }
}

const showSuggestionDetail = (suggestion: ImprovementSuggestion) => {
  selectedSuggestion.value = suggestion
  activeStep.value = suggestion.completed ? suggestion.actionSteps.length - 1 : 0
  showDetailDialog.value = true
}

// Register global component functions (for template usage)
const globalFunctions = {
  getCategoryClass,
  getCategoryIcon,
  getCategoryLabel,
  getPriorityTagType,
  getPriorityLabel
}

// Make functions available globally for SuggestionItem component
Object.assign(window, globalFunctions)
</script>

<style scoped>
.improvement-suggestions {
  padding: 20px 0;
}

.suggestions-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-content h4 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.suggestions-stats {
  display: flex;
  gap: 16px;
}

.stats-item {
  font-size: 12px;
  color: #909399;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.loading-container {
  padding: 40px 20px;
}

.no-suggestions {
  padding: 60px 20px;
  text-align: center;
}

.priority-section {
  margin-bottom: 24px;
  padding: 16px;
  background: linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%);
  border-radius: 8px;
  border: 1px solid #fed7aa;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h5 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #ea580c;
  font-size: 14px;
  font-weight: 600;
}

.priority-badge {
  background: #ea580c;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.priority-suggestions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.priority-suggestion-card {
  background: white;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  overflow: hidden;
  transition: all 0.3s ease;
}

.priority-suggestion-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.suggestion-category {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
}

.suggestion-category.category-performance {
  color: #67c23a;
}

.suggestion-category.category-skills {
  color: #409eff;
}

.suggestion-category.category-projects {
  color: #e6a23c;
}

.suggestion-category.category-collaboration {
  color: #909399;
}

.card-content {
  padding: 16px;
}

.card-content h6 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.card-content p {
  margin: 0 0 12px 0;
  color: #606266;
  font-size: 13px;
  line-height: 1.4;
}

.suggestion-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
}

.potential-impact,
.time-frame {
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-actions {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8f9fa;
  border-top: 1px solid #f0f0f0;
}

.category-tabs {
  margin-bottom: 24px;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s ease;
}

.suggestion-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.suggestion-item.completed {
  background: #f0f9ff;
  border-color: #67c23a;
  opacity: 0.8;
}

.item-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.category-icon {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.category-icon.category-performance {
  background: #f0f9ff;
  color: #67c23a;
}

.category-icon.category-skills {
  background: #e3f2fd;
  color: #409eff;
}

.category-icon.category-projects {
  background: #fff8e1;
  color: #e6a23c;
}

.category-icon.category-collaboration {
  background: #f5f5f5;
  color: #909399;
}

.item-info {
  flex: 1;
}

.item-info h6 {
  margin: 0 0 4px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.item-info p {
  margin: 0;
  color: #606266;
  font-size: 13px;
  line-height: 1.4;
}

.item-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.potential-impact {
  font-size: 12px;
  font-weight: 600;
  color: #67c23a;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-info {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.time-frame {
  display: flex;
  align-items: center;
  gap: 4px;
}

.footer-actions {
  display: flex;
  gap: 8px;
}

.pagination-container {
  margin: 24px 0;
  text-align: center;
}

.progress-summary {
  margin-top: 24px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.summary-header h5 {
  margin: 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.progress-stats {
  font-size: 12px;
  color: #909399;
}

.progress-details {
  margin-top: 12px;
  display: flex;
  justify-content: space-between;
}

.detail-item {
  font-size: 12px;
}

.detail-label {
  color: #909399;
  margin-right: 4px;
}

.detail-value {
  color: #303133;
  font-weight: 500;
}

.suggestion-detail-dialog .suggestion-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.category-info {
  display: flex;
  gap: 8px;
}

.impact-info {
  text-align: right;
}

.impact-value {
  font-size: 24px;
  font-weight: bold;
  color: #67c23a;
  line-height: 1;
}

.impact-label {
  font-size: 12px;
  color: #909399;
}

.detail-description {
  margin-bottom: 24px;
}

.detail-description h6 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.detail-description p {
  margin: 0;
  color: #606266;
  line-height: 1.5;
}

.action-steps {
  margin-bottom: 24px;
}

.action-steps h6 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.detail-meta {
  display: flex;
  gap: 24px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
}

.dialog-footer {
  text-align: right;
}

@media (max-width: 768px) {
  .improvement-suggestions {
    padding: 12px 0;
  }
  
  .suggestions-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: space-between;
  }
  
  .priority-suggestions {
    grid-template-columns: 1fr;
  }
  
  .item-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .item-meta {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  
  .item-footer {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .footer-actions {
    justify-content: space-between;
  }
  
  .progress-details {
    flex-direction: column;
    gap: 8px;
  }
  
  .detail-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .detail-meta {
    flex-direction: column;
    gap: 12px;
  }
}
</style>