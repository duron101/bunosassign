<template>
  <div class="skill-tag-manager">
    <div class="manager-header">
      <h3>技能标签管理</h3>
      <div class="header-actions">
        <el-button type="primary" @click="showAddTagDialog">
          <el-icon><Plus /></el-icon>
          新增标签
        </el-button>
        <el-button @click="showAddCategoryDialog">
          <el-icon><FolderAdd /></el-icon>
          新增分类
        </el-button>
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <div class="manager-content">
      <!-- 左侧分类和标签树 -->
      <div class="left-panel">
        <el-card class="category-card">
          <template #header>
            <span>技能分类</span>
          </template>
          
          <div class="category-list">
            <div
              v-for="category in skillCategories"
              :key="category.id"
              class="category-item"
              :class="{ 'active': selectedCategory?.id === category.id }"
              @click="selectCategory(category)"
            >
              <div class="category-info">
                <span class="category-name">{{ category.name }}</span>
                <span class="category-count">({{ category.skillCount }})</span>
              </div>
              <div class="category-actions">
                <el-button type="text" size="small" @click.stop="editCategory(category)">
                  编辑
                </el-button>
                <el-button type="text" size="small" @click.stop="deleteCategory(category)">
                  删除
                </el-button>
              </div>
            </div>
            
            <div class="add-category-btn">
              <el-button type="dashed" @click="showAddCategoryDialog" block>
                <el-icon><Plus /></el-icon>
                添加分类
              </el-button>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 右侧标签列表 -->
      <div class="right-panel">
        <el-card class="tags-card">
          <template #header>
            <div class="card-header">
              <span>{{ selectedCategory ? `${selectedCategory.name} - 技能标签` : '全部技能标签' }}</span>
              <div class="header-actions">
                <el-input
                  v-model="searchKeyword"
                  placeholder="搜索标签..."
                  prefix-icon="Search"
                  clearable
                  style="width: 200px"
                  @input="handleSearch"
                />
                <el-button type="primary" @click="showAddTagDialog">
                  新增标签
                </el-button>
              </div>
            </div>
          </template>
          
          <div class="tags-content">
            <div class="tags-toolbar">
              <div class="toolbar-left">
                <el-button 
                  type="primary" 
                  :disabled="selectedTags.length === 0"
                  @click="handleBatchEnable"
                >
                  批量启用
                </el-button>
                <el-button 
                  type="warning" 
                  :disabled="selectedTags.length === 0"
                  @click="handleBatchDisable"
                >
                  批量禁用
                </el-button>
                <el-button 
                  type="danger" 
                  :disabled="selectedTags.length === 0"
                  @click="handleBatchDelete"
                >
                  批量删除
                </el-button>
              </div>
              <div class="toolbar-right">
                <el-button @click="showMergeDialog" :disabled="selectedTags.length !== 2">
                  合并标签
                </el-button>
              </div>
            </div>
            
            <el-table
              :data="filteredTags"
              v-loading="loading"
              @selection-change="handleSelectionChange"
              stripe
            >
              <el-table-column type="selection" width="50" />
              <el-table-column prop="name" label="标签名称" width="150" />
              <el-table-column prop="code" label="标签代码" width="120" />
              <el-table-column prop="category" label="分类" width="120">
                <template #default="{ row }">
                  <el-tag :type="getCategoryTagType(row.category)" size="small">
                    {{ getCategoryName(row.category) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="level" label="等级" width="100">
                <template #default="{ row }">
                  <el-tag :type="getLevelTagType(row.level)" size="small">
                    {{ getLevelLabel(row.level) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="usageCount" label="使用次数" width="100" sortable />
              <el-table-column prop="isActive" label="状态" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.isActive ? 'success' : 'danger'" size="small">
                    {{ row.isActive ? '启用' : '禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200" fixed="right">
                <template #default="{ row }">
                  <el-button type="primary" size="small" @click="editTag(row)">
                    编辑
                  </el-button>
                  <el-button 
                    :type="row.isActive ? 'warning' : 'success'" 
                    size="small" 
                    @click="toggleTagStatus(row)"
                  >
                    {{ row.isActive ? '禁用' : '启用' }}
                  </el-button>
                  <el-button type="danger" size="small" @click="deleteTag(row)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            
            <!-- 分页 -->
            <div class="pagination">
              <el-pagination
                v-model:current-page="pagination.page"
                v-model:page-size="pagination.pageSize"
                :total="pagination.total"
                :page-sizes="[20, 50, 100, 200]"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
              />
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 新增/编辑标签对话框 -->
    <el-dialog
      v-model="tagDialogVisible"
      :title="isEditTag ? '编辑技能标签' : '新增技能标签'"
      width="600px"
      :before-close="handleCloseTagDialog"
    >
      <el-form :model="tagForm" :rules="tagRules" ref="tagFormRef" label-width="100px">
        <el-form-item label="标签名称" prop="name">
          <el-input v-model="tagForm.name" placeholder="请输入标签名称" />
        </el-form-item>
        
        <el-form-item label="标签代码" prop="code">
          <el-input v-model="tagForm.code" placeholder="请输入标签代码" />
        </el-form-item>
        
        <el-form-item label="所属分类" prop="category">
          <el-select v-model="tagForm.category" placeholder="请选择分类" style="width: 100%">
            <el-option
              v-for="category in skillCategories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="技能等级" prop="level">
          <el-select v-model="tagForm.level" placeholder="请选择技能等级" style="width: 100%">
            <el-option label="基础" value="basic" />
            <el-option label="中级" value="intermediate" />
            <el-option label="高级" value="advanced" />
            <el-option label="专家" value="expert" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="标签描述" prop="description">
          <el-input
            v-model="tagForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入标签描述"
          />
        </el-form-item>
        
        <el-form-item label="同义词" prop="synonyms">
          <el-select
            v-model="tagForm.synonyms"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请输入同义词，按回车确认"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="相关技能" prop="relatedSkills">
          <el-select
            v-model="tagForm.relatedSkills"
            multiple
            filterable
            placeholder="请选择相关技能"
            style="width: 100%"
          >
            <el-option
              v-for="tag in availableTags"
              :key="tag.id"
              :label="tag.name"
              :value="tag.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="状态" prop="isActive">
          <el-switch v-model="tagForm.isActive" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="tagDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitTagForm">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 新增/编辑分类对话框 -->
    <el-dialog
      v-model="categoryDialogVisible"
      :title="isEditCategory ? '编辑分类' : '新增分类'"
      width="500px"
      :before-close="handleCloseCategoryDialog"
    >
      <el-form :model="categoryForm" :rules="categoryRules" ref="categoryFormRef" label-width="100px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        
        <el-form-item label="分类描述" prop="description">
          <el-input
            v-model="categoryForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分类描述"
          />
        </el-form-item>
        
        <el-form-item label="分类颜色" prop="color">
          <el-color-picker v-model="categoryForm.color" />
        </el-form-item>
        
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="categoryForm.sortOrder" :min="0" :max="999" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="categoryDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCategoryForm">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 合并标签对话框 -->
    <el-dialog
      v-model="mergeDialogVisible"
      title="合并技能标签"
      width="600px"
      :before-close="handleCloseMergeDialog"
    >
      <div class="merge-content">
        <el-alert
          title="合并说明：选择要保留的主标签，另一个标签将被合并并删除"
          type="warning"
          :closable="false"
          style="margin-bottom: 20px"
        />
        
        <el-form label-width="120px">
          <el-form-item label="主标签（保留）">
            <el-radio-group v-model="mergeForm.primaryTagId">
              <el-radio 
                v-for="tag in selectedTags" 
                :key="tag.id" 
                :label="tag.id"
              >
                {{ tag.name }} ({{ tag.code }})
              </el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="合并说明">
            <el-input
              v-model="mergeForm.description"
              type="textarea"
              :rows="3"
              placeholder="请输入合并原因和说明"
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="mergeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmMerge">确认合并</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, FolderAdd } from '@element-plus/icons-vue'

// 技能标签数据结构
interface SkillTag {
  id: string
  name: string
  code: string
  category: string
  level: 'basic' | 'intermediate' | 'advanced' | 'expert'
  description: string
  synonyms: string[]
  relatedSkills: string[]
  usageCount: number
  isActive: boolean
  isSystem: boolean
  createdAt: string
  updatedAt: string
}

// 技能分类数据结构
interface SkillCategory {
  id: string
  name: string
  description: string
  color: string
  sortOrder: number
  skillCount: number
}

// 响应式数据
const loading = ref(false)
const skillTags = ref<SkillTag[]>([])
const skillCategories = ref<SkillCategory[]>([])
const selectedCategory = ref<SkillCategory | null>(null)
const selectedTags = ref<SkillTag[]>([])
const searchKeyword = ref('')

// 对话框状态
const tagDialogVisible = ref(false)
const categoryDialogVisible = ref(false)
const mergeDialogVisible = ref(false)
const isEditTag = ref(false)
const isEditCategory = ref(false)

// 分页信息
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 标签表单
const tagForm = reactive({
  id: '',
  name: '',
  code: '',
  category: '',
  level: 'basic' as 'basic' | 'intermediate' | 'advanced' | 'expert',
  description: '',
  synonyms: [] as string[],
  relatedSkills: [] as string[]
})

// 分类表单
const categoryForm = reactive({
  id: '',
  name: '',
  description: '',
  color: '#409eff',
  sortOrder: 0
})

// 合并表单
const mergeForm = reactive({
  primaryTagId: '',
  description: ''
})

// 表单验证规则
const tagRules = {
  name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入标签代码', trigger: 'blur' }],
  category: [{ required: true, message: '请选择所属分类', trigger: 'change' }],
  level: [{ required: true, message: '请选择技能等级', trigger: 'change' }]
}

const categoryRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
}

// 计算属性
const filteredTags = computed(() => {
  let tags = skillTags.value
  
  // 按分类筛选
  if (selectedCategory.value) {
    tags = tags.filter(tag => tag.category === selectedCategory.value!.id)
  }
  
  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    tags = tags.filter(tag => 
      tag.name.toLowerCase().includes(keyword) ||
      tag.code.toLowerCase().includes(keyword) ||
      tag.description.toLowerCase().includes(keyword)
    )
  }
  
  return tags
})

const availableTags = computed(() => {
  return skillTags.value.filter(tag => tag.id !== tagForm.id)
})

// 方法
const refreshData = async () => {
  loading.value = true
  try {
    // TODO: 调用API获取数据
    // const [tagsResponse, categoriesResponse] = await Promise.all([
    //   skillTagApi.getSkillTags(),
    //   skillCategoryApi.getSkillCategories()
    // ])
    
    // 模拟数据
    skillTags.value = [
      {
        id: '1',
        name: '项目管理',
        code: 'PROJECT_MANAGEMENT',
        category: '1',
        level: 'intermediate',
        description: '项目规划、执行、监控和收尾的能力',
        synonyms: ['项目协调', '项目统筹'],
        relatedSkills: ['2', '3'],
        usageCount: 25,
        isActive: true,
        isSystem: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      },
      {
        id: '2',
        name: '团队协调',
        code: 'TEAM_COORDINATION',
        category: '1',
        level: 'basic',
        description: '团队内部协调和沟通能力',
        synonyms: ['团队协作', '团队管理'],
        relatedSkills: ['1', '4'],
        usageCount: 18,
        isActive: true,
        isSystem: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01'
      }
    ]
    
    skillCategories.value = [
      {
        id: '1',
        name: '管理技能',
        description: '管理相关的技能标签',
        color: '#409eff',
        sortOrder: 1,
        skillCount: 8
      },
      {
        id: '2',
        name: '技术技能',
        description: '技术相关的技能标签',
        color: '#67c23a',
        sortOrder: 2,
        skillCount: 12
      }
    ]
    
    pagination.total = skillTags.value.length
    ElMessage.success('数据刷新成功')
  } catch (error) {
    ElMessage.error('数据刷新失败')
  } finally {
    loading.value = false
  }
}

const selectCategory = (category: SkillCategory) => {
  selectedCategory.value = category
  pagination.page = 1
}

const handleSearch = () => {
  pagination.page = 1
}

const handleSelectionChange = (selection: SkillTag[]) => {
  selectedTags.value = selection
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.page = 1
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
}

// 标签相关方法
const showAddTagDialog = () => {
  isEditTag.value = false
  resetTagForm()
  tagDialogVisible.value = true
}

const editTag = (tag: SkillTag) => {
  isEditTag.value = true
  Object.assign(tagForm, tag)
  tagDialogVisible.value = true
}

const handleCloseTagDialog = () => {
  tagDialogVisible.value = false
  resetTagForm()
}

const resetTagForm = () => {
  Object.assign(tagForm, {
    id: '',
    name: '',
    code: '',
    category: '',
    level: 'basic',
    description: '',
    synonyms: [],
    relatedSkills: []
  })
}

const submitTagForm = async () => {
  try {
    // TODO: 调用API保存标签
    // if (isEditTag.value) {
    //   await skillTagApi.updateSkillTag(tagForm.id, tagForm)
    // } else {
    //   await skillTagApi.createSkillTag(tagForm)
    // }
    
    ElMessage.success(isEditTag.value ? '标签更新成功' : '标签创建成功')
    tagDialogVisible.value = false
    await refreshData()
  } catch (error) {
    ElMessage.error(isEditTag.value ? '更新标签失败' : '创建标签失败')
  }
}

const toggleTagStatus = async (tag: SkillTag) => {
  try {
    // TODO: 调用API切换状态
    // await skillTagApi.toggleTagStatus(tag.id)
    
    ElMessage.success(`标签${tag.isActive ? '禁用' : '启用'}成功`)
    await refreshData()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const deleteTag = async (tag: SkillTag) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除标签"${tag.name}"吗？删除后将无法恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // TODO: 调用API删除标签
    // await skillTagApi.deleteSkillTag(tag.id)
    
    ElMessage.success('标签删除成功')
    await refreshData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除标签失败')
    }
  }
}

// 分类相关方法
const showAddCategoryDialog = () => {
  isEditCategory.value = false
  resetCategoryForm()
  categoryDialogVisible.value = true
}

const editCategory = (category: SkillCategory) => {
  isEditCategory.value = true
  Object.assign(categoryForm, category)
  categoryDialogVisible.value = true
}

const handleCloseCategoryDialog = () => {
  categoryDialogVisible.value = false
  resetCategoryForm()
}

const resetCategoryForm = () => {
  Object.assign(categoryForm, {
    id: '',
    name: '',
    description: '',
    color: '#409eff',
    sortOrder: 0
  })
}

const submitCategoryForm = async () => {
  try {
    // TODO: 调用API保存分类
    // if (isEditCategory.value) {
    //   await skillCategoryApi.updateSkillCategory(categoryForm.id, categoryForm)
    // } else {
    //   await skillCategoryApi.createSkillCategory(categoryForm)
    // }
    
    ElMessage.success(isEditCategory.value ? '分类更新成功' : '分类创建成功')
    categoryDialogVisible.value = false
    await refreshData()
  } catch (error) {
    ElMessage.error(isEditCategory.value ? '更新分类失败' : '创建分类失败')
  }
}

const deleteCategory = async (category: SkillCategory) => {
  if (category.skillCount > 0) {
    ElMessage.warning('该分类下有关联标签，无法删除')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除分类"${category.name}"吗？删除后将无法恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // TODO: 调用API删除分类
    // await skillCategoryApi.deleteSkillCategory(category.id)
    
    ElMessage.success('分类删除成功')
    await refreshData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除分类失败')
    }
  }
}

// 批量操作
const handleBatchEnable = async () => {
  try {
    const ids = selectedTags.value.map(tag => tag.id)
    // TODO: 调用API批量启用
    // await skillTagApi.batchEnable(ids)
    
    ElMessage.success('批量启用成功')
    selectedTags.value = []
    await refreshData()
  } catch (error) {
    ElMessage.error('批量启用失败')
  }
}

const handleBatchDisable = async () => {
  try {
    const ids = selectedTags.value.map(tag => tag.id)
    // TODO: 调用API批量禁用
    // await skillTagApi.batchDisable(ids)
    
    ElMessage.success('批量禁用成功')
    selectedTags.value = []
    await refreshData()
  } catch (error) {
    ElMessage.error('批量禁用失败')
  }
}

const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedTags.value.length} 个标签吗？删除后将无法恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const ids = selectedTags.value.map(tag => tag.id)
    // TODO: 调用API批量删除
    // await skillTagApi.batchDelete(ids)
    
    ElMessage.success('批量删除成功')
    selectedTags.value = []
    await refreshData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  }
}

// 合并标签
const showMergeDialog = () => {
  if (selectedTags.value.length !== 2) {
    ElMessage.warning('请选择两个标签进行合并')
    return
  }
  
  mergeForm.primaryTagId = selectedTags.value[0].id
  mergeForm.description = ''
  mergeDialogVisible.value = true
}

const handleCloseMergeDialog = () => {
  mergeDialogVisible.value = false
  mergeForm.primaryTagId = ''
  mergeForm.description = ''
}

const confirmMerge = async () => {
  if (!mergeForm.primaryTagId) {
    ElMessage.warning('请选择要保留的主标签')
    return
  }
  
  try {
    const secondaryTag = selectedTags.value.find(tag => tag.id !== mergeForm.primaryTagId)
    if (!secondaryTag) {
      ElMessage.error('未找到要合并的标签')
      return
    }
    
    // TODO: 调用API合并标签
    // await skillTagApi.mergeTags({
    //   primaryTagId: mergeForm.primaryTagId,
    //   secondaryTagId: secondaryTag.id,
    //   description: mergeForm.description
    // })
    
    ElMessage.success('标签合并成功')
    mergeDialogVisible.value = false
    selectedTags.value = []
    await refreshData()
  } catch (error) {
    ElMessage.error('标签合并失败')
  }
}

// 工具方法
const getCategoryTagType = (categoryId: string) => {
  const category = skillCategories.value.find(cat => cat.id === categoryId)
  if (!category) return 'info'
  
  const colors = ['primary', 'success', 'warning', 'danger', 'info']
  const index = parseInt(categoryId) % colors.length
  return colors[index]
}

const getCategoryName = (categoryId: string) => {
  const category = skillCategories.value.find(cat => cat.id === categoryId)
  return category ? category.name : '未知分类'
}

const getLevelTagType = (level: string) => {
  const typeMap = {
    'basic': 'info',
    'intermediate': 'success',
    'advanced': 'warning',
    'expert': 'danger'
  }
  return typeMap[level] || 'info'
}

const getLevelLabel = (level: string) => {
  const labelMap = {
    'basic': '基础',
    'intermediate': '中级',
    'advanced': '高级',
    'expert': '专家'
  }
  return labelMap[level] || level
}

// 生命周期
onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.skill-tag-manager {
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
  flex: 0 0 300px;
}

.right-panel {
  flex: 1;
}

.category-card,
.tags-card {
  height: 100%;
}

.category-list {
  max-height: 400px;
  overflow-y: auto;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 8px;
}

.category-item:hover {
  background-color: #f5f7fa;
}

.category-item.active {
  background-color: #e6f7ff;
  border-left: 3px solid #409eff;
}

.category-info {
  display: flex;
  flex-direction: column;
}

.category-name {
  font-weight: 500;
  color: #303133;
}

.category-count {
  font-size: 12px;
  color: #909399;
}

.category-actions {
  display: none;
  gap: 4px;
}

.category-item:hover .category-actions {
  display: flex;
}

.add-category-btn {
  margin-top: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tags-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tags-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 6px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 12px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.merge-content {
  padding: 20px 0;
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
    height: 300px;
  }
}
</style>
