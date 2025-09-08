<template>
  <el-dialog
    v-model="visible"
    title="部门详情"
    width="700px"
    :before-close="handleClose"
  >
    <div v-if="department" class="department-detail">
      <!-- 基本信息 -->
      <el-card class="info-card">
        <template #header>
          <span>基本信息</span>
        </template>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>部门名称：</label>
              <span>{{ department.name }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>部门代码：</label>
              <span>{{ department.code }}</span>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>所属业务线：</label>
              <span>{{ department.businessLine?.name || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>状态：</label>
              <el-tag :type="department.status === 1 ? 'success' : 'danger'">
                {{ department.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>员工数量：</label>
              <span>{{ department.employeeCount || 0 }}人</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>部门负责人：</label>
              <span>{{ department.Manager?.name || '暂无' }}</span>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20" v-if="department.description">
          <el-col :span="24">
            <div class="detail-item">
              <label>部门描述：</label>
              <div class="description">{{ department.description }}</div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 组织结构信息 -->
      <el-card class="info-card">
        <template #header>
          <span>组织结构</span>
        </template>

        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>父部门：</label>
              <span>{{ department.Parent?.name || '无（顶级部门）' }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>子部门数量：</label>
              <span>{{ childDepartments.length }}个</span>
            </div>
          </el-col>
        </el-row>

        <div v-if="childDepartments.length > 0" class="child-departments">
          <label>子部门列表：</label>
          <div class="child-list">
            <el-tag
              v-for="child in childDepartments"
              :key="child.id"
              type="info"
              style="margin: 4px 8px 4px 0"
            >
              {{ child.name }}
            </el-tag>
          </div>
        </div>
      </el-card>

      <!-- 员工统计 -->
      <el-card class="info-card" v-if="employeeStats">
        <template #header>
          <span>员工统计</span>
        </template>

        <el-row :gutter="20">
          <el-col :span="8">
            <div class="stat-item">
              <div class="stat-number">{{ employeeStats.total }}</div>
              <div class="stat-label">总员工数</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-item">
              <div class="stat-number">{{ employeeStats.active }}</div>
              <div class="stat-label">在职员工</div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="stat-item">
              <div class="stat-number">{{ employeeStats.resigned }}</div>
              <div class="stat-label">离职员工</div>
            </div>
          </el-col>
        </el-row>

        <div v-if="employeeStats.byPosition?.length > 0" class="position-stats">
          <label>岗位分布：</label>
          <div class="position-list">
            <div
              v-for="pos in employeeStats.byPosition"
              :key="pos.positionId"
              class="position-item"
            >
              <span class="position-name">{{ pos.Position?.name }}</span>
              <span class="position-count">{{ pos.count }}人</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 系统信息 -->
      <el-card class="info-card">
        <template #header>
          <span>系统信息</span>
        </template>

        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>创建时间：</label>
              <span>{{ formatDateTime(department.createdAt) }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>更新时间：</label>
              <span>{{ formatDateTime(department.updatedAt) }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
      <el-button type="primary" @click="handleEdit">编辑</el-button>
      <el-button type="success" @click="viewEmployees">查看员工</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { Department } from '@/api/department'

interface Props {
  visible: boolean
  department: Department | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'edit', department: Department): void
  (e: 'view-employees', department: Department): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const childDepartments = ref([])
const employeeStats = ref(null)

const visible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 监听对话框显示状态
watch(() => props.visible, (val) => {
  if (val && props.department) {
    loadDepartmentDetails()
  }
})

// 加载部门详细信息
const loadDepartmentDetails = async () => {
  if (!props.department) return

  try {
    // 这里可以调用API获取更详细的信息
    // 比如子部门列表、员工统计等
    // const { data } = await getDepartmentDetails(props.department.id)
    // childDepartments.value = data.childDepartments
    // employeeStats.value = data.employeeStats
    
    // 暂时模拟数据
    childDepartments.value = []
    employeeStats.value = {
      total: props.department.employeeCount || 0,
      active: props.department.employeeCount || 0,
      resigned: 0,
      byPosition: []
    }
  } catch (error) {
    console.error('获取部门详细信息失败:', error)
  }
}

// 关闭对话框
const handleClose = () => {
  visible.value = false
}

// 编辑部门
const handleEdit = () => {
  if (props.department) {
    emit('edit', props.department)
    handleClose()
  }
}

// 查看员工
const viewEmployees = () => {
  if (props.department) {
    emit('view-employees', props.department)
    handleClose()
  }
}

// 格式化日期时间
const formatDateTime = (dateTime: string) => {
  if (!dateTime) return '-'
  const date = new Date(dateTime)
  return date.toLocaleString('zh-CN')
}
</script>

<style scoped>
.department-detail {
  max-height: 600px;
  overflow-y: auto;
}

.info-card {
  margin-bottom: 20px;
}

.info-card:last-child {
  margin-bottom: 0;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
  line-height: 1.5;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-item label {
  flex-shrink: 0;
  width: 100px;
  font-weight: 500;
  color: #606266;
}

.detail-item span,
.detail-item .el-tag {
  color: #303133;
}

.description {
  color: #303133;
  white-space: pre-wrap;
  line-height: 1.6;
}

.child-departments {
  margin-top: 16px;
}

.child-departments label {
  display: block;
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
}

.child-list {
  margin-top: 8px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.position-stats {
  margin-top: 20px;
}

.position-stats label {
  display: block;
  font-weight: 500;
  color: #606266;
  margin-bottom: 12px;
}

.position-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.position-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.position-name {
  color: #303133;
  font-weight: 500;
}

.position-count {
  color: #409eff;
  font-weight: 600;
}

:deep(.el-card__header) {
  padding: 12px 20px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

:deep(.el-card__body) {
  padding: 20px;
}
</style>