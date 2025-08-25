# 岗位大全权限管理文档

## 📋 概述

本文档描述了岗位大全页面的权限管理系统，包括权限配置、角色分配、数据访问控制等内容。

## 🔐 权限体系

### 岗位大全专用权限

| 权限代码 | 权限名称 | 说明 |
|---------|---------|------|
| `position_encyclopedia:view` | 查看岗位大全 | 查看岗位大全页面的基本信息 |
| `position_encyclopedia:manage` | 管理岗位大全 | 完全管理岗位大全的权限 |
| `position_encyclopedia:update_requirements` | 更新岗位要求 | 更新岗位的基本要求、技能、经验等 |
| `position_encyclopedia:update_career_path` | 更新职业路径 | 更新岗位的职业发展路径 |
| `position_encyclopedia:update_skills` | 更新核心技能 | 更新岗位的核心技能要求 |
| `position_encyclopedia:bulk_update` | 批量更新 | 批量更新多个岗位信息 |
| `position_encyclopedia:export` | 导出数据 | 导出岗位大全数据 |
| `position_encyclopedia:*` | 所有权限 | 岗位大全的所有操作权限 |

## 👥 角色权限分配

### 超级管理员 (SUPER_ADMIN)
- **权限**: `*` (所有权限)
- **说明**: 拥有系统中所有权限，包括岗位大全的完全控制权

### 系统管理员 (ADMIN)
- **权限**: 
  - `position_encyclopedia:view` - 查看岗位大全
  - `position_encyclopedia:manage` - 管理岗位大全
  - `position_encyclopedia:update_requirements` - 更新岗位要求
  - `position_encyclopedia:update_career_path` - 更新职业路径
  - `position_encyclopedia:update_skills` - 更新核心技能
  - `position_encyclopedia:bulk_update` - 批量更新
  - `position_encyclopedia:export` - 导出数据
- **说明**: 拥有岗位大全的完全管理权限

### HR管理员 (HR_ADMIN)
- **权限**: 
  - `position_encyclopedia:view` - 查看岗位大全
  - `position_encyclopedia:manage` - 管理岗位大全
  - `position_encyclopedia:update_requirements` - 更新岗位要求
  - `position_encyclopedia:update_career_path` - 更新职业路径
  - `position_encyclopedia:update_skills` - 更新核心技能
  - `position_encyclopedia:bulk_update` - 批量更新
  - `position_encyclopedia:export` - 导出数据
- **说明**: 人力资源相关岗位的完全管理权限

### 业务线负责人 (BUSINESS_LINE_MANAGER)
- **权限**: 
  - `position_encyclopedia:view` - 查看岗位大全
  - `position_encyclopedia:update_requirements` - 更新岗位要求
  - `position_encyclopedia:update_career_path` - 更新职业路径
  - `position_encyclopedia:update_skills` - 更新核心技能
- **说明**: 只能更新本业务线岗位的相关信息
- **数据访问限制**: 基于业务线的数据访问控制

### HR专员 (HR_SPECIALIST)
- **权限**: 
  - `position_encyclopedia:view` - 查看岗位大全
  - `position_encyclopedia:update_skills` - 更新核心技能
- **说明**: 可以查看所有岗位信息，但只能更新核心技能

### 普通员工 (EMPLOYEE)
- **权限**: 
  - `position_encyclopedia:view` - 查看岗位大全
- **说明**: 只能查看岗位大全信息，不能进行任何修改操作

## 🛡️ 数据访问控制

### 业务线数据隔离
- **业务线负责人**: 只能操作本业务线的岗位数据
- **管理员和HR**: 可以操作所有业务线的岗位数据
- **普通员工**: 只能查看所有岗位数据

### 权限验证流程
1. **身份认证**: 验证用户JWT令牌
2. **权限检查**: 检查用户是否拥有所需权限
3. **数据访问控制**: 验证用户是否有权限操作特定数据
4. **操作执行**: 执行相应的业务操作
5. **审计日志**: 记录所有操作日志

## 🚀 API接口权限

### 岗位大全管理接口

#### 1. 更新岗位要求
- **接口**: `PUT /api/positions/encyclopedia/requirements`
- **权限**: `position_encyclopedia:update_requirements`
- **说明**: 更新岗位的基本要求、技能、经验、职业路径、薪资范围等

#### 2. 更新职业路径
- **接口**: `PUT /api/positions/encyclopedia/career-path`
- **权限**: `position_encyclopedia:update_career_path`
- **说明**: 更新岗位的职业发展路径信息

#### 3. 更新核心技能
- **接口**: `PUT /api/positions/encyclopedia/skills`
- **权限**: `position_encyclopedia:update_skills`
- **说明**: 更新岗位的核心技能要求

#### 4. 导出岗位大全
- **接口**: `GET /api/positions/encyclopedia/export`
- **权限**: `position_encyclopedia:export`
- **说明**: 导出岗位大全数据，支持JSON、CSV格式

## 📝 使用示例

### 前端权限检查
```typescript
import { useProjectPermissions } from '@/composables/useProjectPermissions'

const { hasPermission } = useProjectPermissions()

// 检查是否有更新岗位要求的权限
const canUpdateRequirements = hasPermission('position_encyclopedia:update_requirements')

// 检查是否有管理岗位大全的权限
const canManageEncyclopedia = hasPermission('position_encyclopedia:manage')
```

### 后端权限验证
```javascript
const { canUpdateRequirements, businessLineDataAccess } = require('../middlewares/positionEncyclopediaAuth')

// 在路由中使用权限中间件
router.put('/encyclopedia/requirements',
  canUpdateRequirements,                    // 检查更新权限
  businessLineDataAccess('update_requirements'), // 业务线数据访问控制
  validate(updateRequirementsSchema),      // 数据验证
  logOperation('更新岗位要求', '岗位大全'),   // 操作日志
  positionController.updatePositionRequirements
)
```

## 🔍 权限调试

### 权限检查日志
系统会记录详细的权限检查日志，包括：
- 用户ID和用户名
- 请求的资源类型和操作
- 用户拥有的权限
- 权限检查结果
- 拒绝原因（如果有）

### 常见权限问题
1. **权限不足**: 用户没有执行特定操作的权限
2. **数据访问受限**: 用户没有权限访问特定业务线的数据
3. **权限配置错误**: 角色权限配置不正确
4. **令牌过期**: 用户认证令牌已过期

## 📊 权限矩阵总结

| 功能 | SUPER_ADMIN | ADMIN | HR_ADMIN | BUSINESS_LINE_MANAGER | HR_SPECIALIST | EMPLOYEE |
|------|-------------|-------|----------|---------------------|---------------|----------|
| 查看岗位大全 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 管理岗位大全 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| 更新岗位要求 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| 更新职业路径 | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| 更新核心技能 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| 批量更新 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| 导出数据 | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

## 🚨 安全注意事项

1. **权限最小化**: 每个角色只获得必要的权限
2. **数据隔离**: 业务线负责人只能操作本业务线数据
3. **操作审计**: 所有敏感操作都会记录审计日志
4. **权限验证**: 每个API接口都进行权限验证
5. **数据验证**: 所有输入数据都进行格式和内容验证

## 🔧 配置和维护

### 添加新权限
1. 在 `permissions.js` 中定义新权限
2. 在角色权限矩阵中分配权限
3. 在相关中间件中添加权限检查
4. 更新API文档和权限矩阵

### 修改角色权限
1. 更新 `ROLE_PERMISSIONS` 配置
2. 测试权限验证功能
3. 更新相关文档
4. 通知相关用户权限变更

### 权限监控
1. 定期检查权限使用情况
2. 监控异常权限访问
3. 审计权限分配变更
4. 优化权限配置

---

## 📞 技术支持

如有权限相关问题，请联系系统管理员或查看系统日志获取详细信息。
