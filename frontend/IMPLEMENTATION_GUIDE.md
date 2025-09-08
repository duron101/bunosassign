# 前端薪酬权限控制实施指南

## 🎯 实施目标

实现公司秘薪制要求，通过前端权限控制确保：
- 普通员工无法看到任何薪酬信息
- 只有特定角色（HR、财务、管理员）才能查看和编辑薪酬
- 保持系统功能完整性，最小化代码修改

## 🏗️ 实施方案

### 1. 权限控制组合式函数

**文件位置：** `src/composables/useSalaryPermission.ts`

**功能：**
- `canViewSalary`: 检查是否有薪酬查看权限
- `canEditSalary`: 检查是否有薪酬编辑权限
- `formatCurrency`: 格式化货币显示
- 角色判断：管理员、HR、财务等

**权限角色配置：**
```typescript
// 薪酬查看权限
const allowedViewRoles = ['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN', 'HR_SPECIALIST', 'FINANCE_ADMIN']

// 薪酬编辑权限  
const allowedEditRoles = ['SUPER_ADMIN', 'ADMIN', 'HR_ADMIN', 'FINANCE_ADMIN']
```

### 2. 员工管理页面改造

**文件位置：** `src/views/employee/EmployeeManagement.vue`

**主要变更：**
- 薪酬列根据权限动态显示
- 无权限时显示"保密"标签
- 有权限时显示格式化后的薪酬

**代码示例：**
```vue
<!-- 薪酬列（根据权限动态显示） -->
<el-table-column 
  v-if="canViewSalary" 
  label="年薪" 
  width="120"
>
  <template #default="{ row }">
    {{ formatCurrency(row.annualSalary) }}
  </template>
</el-table-column>

<!-- 无权限时显示占位符列 -->
<el-table-column 
  v-else 
  label="薪酬" 
  width="120"
>
  <template #default>
    <el-tag type="info" size="small">保密</el-tag>
  </template>
</el-table-column>
```

### 3. 员工详情对话框改造

**文件位置：** `src/views/employee/components/EmployeeDetailDialog.vue`

**主要变更：**
- 薪酬信息根据权限显示
- 无权限时显示"保密信息"标签

**代码示例：**
```vue
<div class="detail-item">
  <label>薪酬：</label>
  <span v-if="canViewSalary">
    {{ formatCurrency(employee.annualSalary) }}
  </span>
  <span v-else>
    <el-tag type="warning" size="small">保密信息</el-tag>
  </span>
</div>
```

### 4. 员工编辑对话框改造

**文件位置：** `src/views/employee/components/EmployeeFormDialog.vue`

**主要变更：**
- 薪酬字段根据权限显示/隐藏
- 编辑时显示"期望薪酬"，新增时显示"年薪"
- 表单验证根据权限动态调整
- 提交数据根据权限处理

**代码示例：**
```vue
<el-form-item 
  :label="isEdit ? '期望薪酬' : '年薪'" 
  prop="annualSalary" 
  :required="canEditSalary"
>
  <el-input-number
    v-if="canEditSalary"
    v-model="form.annualSalary"
    :min="0"
    :step="1000"
    :placeholder="isEdit ? '请输入期望薪酬' : '请输入年薪'"
    style="width: 100%"
  />
  <el-input
    v-else
    :value="'***'"
    disabled
    placeholder="权限不足"
    style="width: 100%"
  />
</el-form-item>
```

## 🔐 权限控制逻辑

### 权限检查流程

1. **用户登录** → 获取用户角色和权限
2. **页面加载** → 调用 `useSalaryPermission()` 组合式函数
3. **权限判断** → 根据用户角色判断是否有薪酬权限
4. **UI渲染** → 根据权限动态显示/隐藏薪酬相关元素

### 权限级别

| 角色 | 薪酬查看 | 薪酬编辑 | 说明 |
|------|----------|----------|------|
| SUPER_ADMIN | ✅ | ✅ | 超级管理员，拥有所有权限 |
| ADMIN | ✅ | ✅ | 系统管理员，拥有所有权限 |
| HR_ADMIN | ✅ | ✅ | HR管理员，可以管理薪酬 |
| HR_SPECIALIST | ✅ | ❌ | HR专员，只能查看薪酬 |
| FINANCE_ADMIN | ✅ | ✅ | 财务管理员，可以管理薪酬 |
| EMPLOYEE | ❌ | ❌ | 普通员工，无法访问薪酬信息 |

## 🚀 使用方法

### 1. 在组件中使用权限控制

```vue
<script setup>
import { useSalaryPermission } from '@/composables/useSalaryPermission'

const { canViewSalary, canEditSalary, formatCurrency } = useSalaryPermission()
</script>

<template>
  <!-- 根据权限显示内容 -->
  <div v-if="canViewSalary">
    薪酬：{{ formatCurrency(employee.annualSalary) }}
  </div>
  <div v-else>
    薪酬：<el-tag type="info">保密</el-tag>
  </div>
</template>
```

### 2. 权限控制最佳实践

- **始终检查权限**：在显示敏感信息前检查权限
- **提供友好提示**：无权限时显示友好的提示信息
- **保持一致性**：在整个应用中保持权限控制的一致性
- **错误处理**：妥善处理权限不足的情况

## 🧪 测试验证

### 测试场景

1. **普通员工登录**
   - ✅ 看不到薪酬列
   - ✅ 看不到薪酬详情
   - ✅ 无法编辑薪酬信息

2. **HR角色登录**
   - ✅ 可以看到薪酬列
   - ✅ 可以看到薪酬详情
   - ✅ 可以编辑薪酬信息

3. **管理员登录**
   - ✅ 可以看到所有信息
   - ✅ 可以执行所有操作

### 测试方法

1. 使用不同角色账号登录系统
2. 访问员工管理页面
3. 查看员工详情
4. 尝试编辑员工信息
5. 验证权限控制是否生效

## 🔧 维护和扩展

### 添加新角色

在 `useSalaryPermission.ts` 中更新权限配置：

```typescript
const allowedViewRoles = [
  'SUPER_ADMIN', 
  'ADMIN', 
  'HR_ADMIN', 
  'HR_SPECIALIST', 
  'FINANCE_ADMIN',
  'NEW_ROLE' // 添加新角色
]
```

### 添加新权限

扩展权限控制函数：

```typescript
// 检查是否有薪酬审批权限
const canApproveSalary = computed(() => {
  const userRole = userStore.user?.roleName?.toUpperCase() || ''
  const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'FINANCE_ADMIN']
  return allowedRoles.includes(userRole) || userStore.hasPermission('*')
})
```

## 📝 注意事项

1. **安全性**：前端权限控制仅用于用户体验，后端仍需实施权限验证
2. **性能**：权限检查使用计算属性，避免重复计算
3. **维护性**：权限配置集中管理，便于维护和修改
4. **兼容性**：保持与现有代码的兼容性，最小化影响

## 🎉 实施完成

通过以上改造，系统已成功实现：
- ✅ 秘薪制要求
- ✅ 权限控制完整
- ✅ 用户体验友好
- ✅ 代码维护性强
- ✅ 扩展性良好

系统现在可以根据用户角色动态控制薪酬信息的显示和编辑权限，完全满足公司秘薪制的要求。
