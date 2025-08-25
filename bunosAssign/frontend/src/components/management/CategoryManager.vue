<template>
  <div class="category-manager">
    <div class="manager-header">
      <h3>岗位分类管理</h3>
      <div class="header-actions">
        <el-button type="primary" @click="showAddCategoryDialog">
          <el-icon><Plus /></el-icon>
          新增分类
        </el-button>
        <el-button @click="refreshCategories">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <div class="manager-content">
      <!-- 左侧分类树 -->
      <div class="category-tree-section">
        <el-card class="tree-card">
          <template #header>
            <div class="card-header">
              <span>分类结构</span>
              <el-button type="text" @click="expandAll">
                {{ isExpanded ? '收起' : '展开' }}
              </el-button>
            </div>
          </template>
          
          <el-tree
            ref="categoryTreeRef"
            :data="categoryTree"
            :props="treeProps"
            :expand-on-click-node="false"
            :default-expand-all="isExpanded"
            node-key="id"
            draggable
            @node-click="handleNodeClick"
            @node-drop="handleNodeDrop"
          >
            <template #default="{ node, data }">
              <div class="tree-node">
                <span class="node-label">{{ data.name }}</span>
                <div class="node-actions">
                  <el-button 
                    type="text" 
                    size="small" 
                    @click.stop="showEditCategoryDialog(data)"
                  >
                    编辑
                  </el-button>
                  <el-button 
                    type="text" 
                    size="small" 
                    @click.stop="showAddSubCategoryDialog(data)"
                  >
                    添加子分类
                  </el-button>
                  <el-button 
                    type="text" 
                    size="small" 
                    @click.stop="handleDeleteCategory(data)"
                    :disabled="data.positionCount > 0"
                  >
                    删除
                  </el-button>
                </div>
              </div>
            </template>
          </el-tree>
        </el-card>
      </div>

      <!-- 右侧详情和编辑 -->
      <div class="category-detail-section">
        <el-card class="detail-card">
          <template #header>
            <span>{{ selectedCategory ? '分类详情' : '请选择分类' }}</span>
          </template>
          
          <div v-if="selectedCategory" class="category-detail">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="分类名称">
                {{ selectedCategory.name }}
              </el-descriptions-item>
              <el-descriptions-item label="分类代码">
                {{ selectedCategory.code }}
              </el-descriptions-item>
              <el-descriptions-item label="分类类型">
                {{ selectedCategory.type === 'main' ? '主分类' : '子分类' }}
              </el-descriptions-item>
              <el-descriptions-item label="排序">
                {{ selectedCategory.sortOrder }}
              </el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="selectedCategory.isActive ? 'success' : 'danger'">
                  {{ selectedCategory.isActive ? '启用' : '禁用' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="关联岗位">
                {{ selectedCategory.positionCount }} 个
              </el-descriptions-item>
            </el-descriptions>
            
            <el-divider content-position="left">分类描述</el-divider>
            <p>{{ selectedCategory.description || '暂无描述' }}</p>
            
            <el-divider content-position="left">关联岗位</el-divider>
            <div v-if="selectedCategory.positions && selectedCategory.positions.length > 0">
              <el-tag
                v-for="position in selectedCategory.positions"
                :key="position.id"
                class="position-tag"
              >
                {{ position.name }}
              </el-tag>
            </div>
            <p v-else class="no-data">暂无关联岗位</p>
          </div>
          
          <div v-else class="no-selection">
            <el-empty description="请从左侧选择分类查看详情" />
          </div>
        </el-card>
      </div>
    </div>

    <!-- 新增/编辑分类对话框 -->
    <el-dialog
      v-model="categoryDialogVisible"
      :title="isEditCategory ? '编辑分类' : '新增分类'"
      width="600px"
      :before-close="handleCloseCategoryDialog"
    >
      <el-form :model="categoryForm" :rules="categoryRules" ref="categoryFormRef" label-width="100px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
        </el-form-item>
        
        <el-form-item label="分类代码" prop="code">
          <el-input v-model="categoryForm.code" placeholder="请输入分类代码" />
        </el-form-item>
        
        <el-form-item label="分类类型" prop="type">
          <el-radio-group v-model="categoryForm.type">
            <el-radio label="main">主分类</el-radio>
            <el-radio label="sub">子分类</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="父分类" v-if="categoryForm.type === 'sub'" prop="parentId">
          <el-select v-model="categoryForm.parentId" placeholder="请选择父分类" style="width: 100%">
            <el-option
              v-for="category in mainCategories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="categoryForm.sortOrder" :min="0" :max="999" />
        </el-form-item>
        
        <el-form-item label="分类描述" prop="description">
          <el-input
            v-model="categoryForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分类描述"
          />
        </el-form-item>
        
        <el-form-item label="分类图标" prop="icon">
          <el-input v-model="categoryForm.icon" placeholder="请输入图标类名或图标路径" />
        </el-form-item>
        
        <el-form-item label="分类颜色" prop="color">
          <el-color-picker v-model="categoryForm.color" />
        </el-form-item>
        
        <el-form-item label="状态" prop="isActive">
          <el-switch v-model="categoryForm.isActive" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="categoryDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCategoryForm">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'

// 分类数据结构
interface PositionCategory {
  id: string
  name: string
  code: string
  type: 'main' | 'sub'
  parentId?: string
  level: number
  sortOrder: number
  description: string
  icon: string
  color: string
  isActive: boolean
  positionCount: number
  positions?: any[]
  children?: PositionCategory[]
  createdAt: string
  updatedAt: string
}

// 响应式数据
const categoryTree = ref<PositionCategory[]>([])
const selectedCategory = ref<PositionCategory | null>(null)
const categoryDialogVisible = ref(false)
const isEditCategory = ref(false)
const isExpanded = ref(false)
const categoryTreeRef = ref()

// 分类表单
const categoryForm = reactive({
  id: '',
  name: '',
  code: '',
  type: 'main' as 'main' | 'sub',
  parentId: '',
  level: 1,
  sortOrder: 0,
  description: '',
  icon: '',
  color: '#409eff',
  isActive: true
})

// 表单验证规则
const categoryRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入分类代码', trigger: 'blur' }],
  type: [{ required: true, message: '请选择分类类型', trigger: 'change' }],
  parentId: [{ required: true, message: '请选择父分类', trigger: 'change' }]
}

// 树形配置
const treeProps = {
  children: 'children',
  label: 'name'
}

// 计算属性
const mainCategories = computed(() => {
  return categoryTree.value.filter(cat => cat.type === 'main')
})

// 方法
const refreshCategories = async () => {
  try {
    // TODO: 调用API获取分类数据
    // const response = await categoryApi.getCategories()
    // categoryTree.value = response.data
    
    // 模拟数据
    categoryTree.value = [
      {
        id: '1',
        name: '技术研发',
        code: 'TECH',
        type: 'main',
        level: 1,
        sortOrder: 1,
        description: '技术研发相关岗位',
        icon: 'icon-tech',
        color: '#409eff',
        isActive: true,
        positionCount: 15,
        children: [
          {
            id: '1-1',
            name: '算法工程师',
            code: 'ALGORITHM',
            type: 'sub',
            parentId: '1',
            level: 2,
            sortOrder: 1,
            description: '算法相关岗位',
            icon: 'icon-algorithm',
            color: '#67c23a',
            isActive: true,
            positionCount: 5
          }
        ]
      },
      {
        id: '2',
        name: '项目管理',
        code: 'MANAGEMENT',
        type: 'main',
        level: 1,
        sortOrder: 2,
        description: '项目管理相关岗位',
        icon: 'icon-management',
        color: '#e6a23c',
        isActive: true,
        positionCount: 8
      }
    ]
    
    ElMessage.success('分类数据刷新成功')
  } catch (error) {
    ElMessage.error('刷新分类数据失败')
  }
}

const handleNodeClick = (data: PositionCategory) => {
  selectedCategory.value = data
}

const handleNodeDrop = (draggingNode: any, dropNode: any, dropType: string) => {
  // TODO: 处理拖拽排序
  console.log('拖拽排序:', { draggingNode, dropNode, dropType })
}

const expandAll = () => {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) {
    categoryTreeRef.value?.expandAll()
  } else {
    categoryTreeRef.value?.collapseAll()
  }
}

const showAddCategoryDialog = () => {
  isEditCategory.value = false
  resetCategoryForm()
  categoryForm.type = 'main'
  categoryForm.level = 1
  categoryDialogVisible.value = true
}

const showAddSubCategoryDialog = (parentCategory: PositionCategory) => {
  isEditCategory.value = false
  resetCategoryForm()
  categoryForm.type = 'sub'
  categoryForm.parentId = parentCategory.id
  categoryForm.level = parentCategory.level + 1
  categoryDialogVisible.value = true
}

const showEditCategoryDialog = (category: PositionCategory) => {
  isEditCategory.value = true
  Object.assign(categoryForm, category)
  categoryDialogVisible.value = true
}

const handleDeleteCategory = async (category: PositionCategory) => {
  if (category.positionCount > 0) {
    ElMessage.warning('该分类下有关联岗位，无法删除')
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
    // await categoryApi.deleteCategory(category.id)
    
    ElMessage.success('分类删除成功')
    await refreshCategories()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除分类失败')
    }
  }
}

const handleCloseCategoryDialog = () => {
  categoryDialogVisible.value = false
  resetCategoryForm()
}

const resetCategoryForm = () => {
  Object.assign(categoryForm, {
    id: '',
    name: '',
    code: '',
    type: 'main',
    parentId: '',
    level: 1,
    sortOrder: 0,
    description: '',
    icon: '',
    color: '#409eff',
    isActive: true
  })
}

const submitCategoryForm = async () => {
  try {
    // TODO: 调用API保存分类
    // if (isEditCategory.value) {
    //   await categoryApi.updateCategory(categoryForm.id, categoryForm)
    // } else {
    //   await categoryApi.createCategory(categoryForm)
    // }
    
    ElMessage.success(isEditCategory.value ? '分类更新成功' : '分类创建成功')
    categoryDialogVisible.value = false
    await refreshCategories()
  } catch (error) {
    ElMessage.error(isEditCategory.value ? '更新分类失败' : '创建分类失败')
  }
}

// 生命周期
onMounted(() => {
  refreshCategories()
})
</script>

<style scoped>
.category-manager {
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

.category-tree-section {
  flex: 0 0 400px;
}

.tree-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-detail-section {
  flex: 1;
}

.detail-card {
  height: 100%;
}

.tree-node {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.node-label {
  flex: 1;
}

.node-actions {
  display: none;
  gap: 4px;
}

.tree-node:hover .node-actions {
  display: flex;
}

.position-tag {
  margin: 4px;
}

.no-data,
.no-selection {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

.category-detail {
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
  
  .category-tree-section {
    flex: none;
    height: 300px;
  }
}
</style>
