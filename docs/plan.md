# 奖金模拟系统开发计划

## 项目概述
基于Vue3开发的奖金模拟系统，实现"利润贡献度+岗位价值+绩效表现"三维模型的奖金分配方案，提供直观、透明的奖金计算和模拟功能。

## 开发阶段规划

### 第一阶段：项目基础搭建（第1-2周）

#### 1.1 项目初始化与环境搭建
- [ ] 创建前端Vue3项目脚手架
  - 集成TypeScript、Element Plus、Pinia、Vue Router
  - 配置ECharts图表库、VXE-Table表格组件
  - 设置代码规范（ESLint、Prettier）
- [ ] 创建后端Node.js项目
  - Express/Koa框架选型
  - 集成Sequelize ORM、JWT认证、Winston日志
  - 配置Swagger API文档
- [ ] 数据库设计与初始化
  - MySQL数据库创建
  - 执行表结构创建脚本
  - 初始化基础数据（角色、权限、部门等）

#### 1.2 开发环境配置
- [ ] Docker容器化配置
- [ ] 本地开发环境搭建
- [ ] CI/CD流水线初步配置
- [ ] 代码仓库与分支策略设置

### 第二阶段：用户认证与权限管理（第3周）

#### 2.1 用户认证模块
- [ ] 登录页面开发
  - 账号密码登录
  - 企业SSO登录接口预留
  - 登录状态保持
- [ ] JWT认证机制实现
- [ ] 用户会话管理
- [ ] 密码安全策略

#### 2.2 权限管理系统
- [ ] RBAC权限模型实现
- [ ] 用户管理功能
  - 用户创建、编辑、停用
  - 角色分配
  - 部门关联
- [ ] 权限控制中间件
- [ ] 操作日志记录

### 第三阶段：基础数据管理（第4-5周）

#### 3.1 组织架构管理
- [ ] 部门管理功能
  - 部门树形结构展示
  - 部门增删改查
  - 组织关系可视化
- [ ] 条线管理
  - 条线设置与权重配置
  - 条线与部门关联

#### 3.2 员工信息管理
- [ ] 员工基本信息管理
  - 员工列表页面（分页、搜索、筛选）
  - 员工信息增删改查
  - 批量导入导出功能
- [ ] 岗位信息管理
  - 岗位等级设置
  - 基准值比例管理
  - 岗位与条线关联

#### 3.3 绩效数据管理
- [ ] 绩效评级系统
- [ ] 绩效数据录入界面
- [ ] 绩效历史记录查询
- [ ] 卓越贡献评定功能

### 第四阶段：奖金计算引擎（第6-7周）

#### 4.1 计算规则配置
- [ ] 奖金池配置功能
  - 公司利润数据录入
  - 奖金池比例设置
  - 预留金比例配置
- [ ] 条线权重设置
- [ ] 基础奖金与卓越贡献奖比例设置
- [ ] 保底机制与上限控制配置

#### 4.2 核心计算逻辑
- [ ] 条线奖金分配计算
  ```
  条线奖金 = 奖金池总额 × 条线权重 × 权重调整系数
  ```
- [ ] 个人基础积分计算
  ```
  个人基础积分 = 岗位基准值 × 绩效系数
  ```
- [ ] 基础奖金计算
  ```
  基础奖金 = 条线基础奖金池 × (个人基础积分 ÷ 条线总积分)
  ```

### 第五阶段：项目管理系统开发（第8-10周）

#### 5.1 项目管理系统需求描述

##### 5.1.1 业务背景
在业务线中区分项目是有意义的，可以：
- 区分不同项目的利润情况
- 区分不同员工在不同项目的角色权重
- 更加精细地考虑奖金分配问题

##### 5.1.2 核心功能需求
- **项目管理**：项目基础信息、状态跟踪、利润管理
- **权重配置**：基于岗位的权重 + 手动调整权重
- **权限控制**：管理员、项目经理、人力资源、普通员工分层权限
- **奖金计算**：项目权重影响下的精细化奖金分配

##### 5.1.3 用户角色定义
- **管理员**：完全权限（创建、编辑、删除、权重调整）
- **项目经理**：项目权重调整、团队管理
- **人力资源**：员工权重调整、权限审核
- **普通员工**：只读权限（不可见利润数据）

#### 5.2 系统设计

##### 5.2.1 数据模型设计
```typescript
// 项目实体
interface Project {
  id: string
  name: string
  code: string
  description?: string
  status: 'active' | 'completed' | 'paused'
  startDate: string
  endDate?: string
  budget: number
  actualCost: number
  profitTarget: number
  actualProfit: number
  businessLineId: string      // 所属业务线
  managerId: string          // 项目经理
  createdBy: string          // 创建人
  createdAt: string
  updatedAt: string
}

// 项目权重配置
interface ProjectWeightConfig {
  id: string
  projectId: string
  businessLineId: string
  positionId: string         // 岗位ID
  baseWeight: number         // 岗位基准权重
  manualWeight: number       // 手动调整权重
  effectiveWeight: number    // 最终生效权重
  adjustmentReason: string   // 调整原因
  approvedBy: string         // 审批人
  approvedAt: string         // 审批时间
  status: 'pending' | 'approved' | 'rejected'
}

// 员工项目参与
interface EmployeeProjectParticipation {
  id: string
  projectId: string
  employeeId: string
  positionId: string         // 员工岗位
  baseWeight: number         // 基于岗位的权重
  manualAdjustment: number   // 手动调整值
  effectiveWeight: number    // 最终权重
  role: string               // 项目角色
  startDate: string
  endDate?: string
  createdBy: string
  createdAt: string
}
```

##### 5.2.2 权重计算算法
```
最终权重 = 岗位权重 × 0.7 + 手动调整权重 × 0.3

员工奖金 = 基础奖金 × 项目权重系数 × 角色权重系数 × 贡献度系数

项目权重系数 = Σ(项目利润 × 业务线权重 × 部门权重)
角色权重系数 = 员工在项目中的角色权重
贡献度系数 = 员工在项目中的贡献度评分
```

##### 5.2.3 权限控制设计
```javascript
// 权限中间件
const checkProjectPermission = (requiredRole) => {
  return (req, res, next) => {
    const userRole = req.user.role
    const projectId = req.params.projectId
    
    if (userRole === 'admin') return next()
    
    if (userRole === 'project_manager') {
      // 检查是否为项目经理
      const project = await getProject(projectId)
      if (project.managerId === req.user.id) return next()
    }
    
    if (userRole === 'hr') {
      // 人力资源可以查看和调整权重
      return next()
    }
    
    res.status(403).json({ message: '权限不足' })
  }
}
```

#### 5.3 开发计划

##### 5.3.1 第一阶段：基础框架（3天）
- [ ] **数据模型创建**
  - 创建Project、ProjectWeightConfig、EmployeeProjectParticipation模型
  - 设计数据库表结构
  - 实现基础CRUD操作

- [ ] **基础API实现**
  - 项目管理API（创建、查询、更新、删除）
  - 权重配置API（查询、更新）
  - 员工参与API（查询、更新）

- [ ] **前端页面框架**
  - 项目列表页面
  - 项目创建/编辑页面
  - 基础路由配置

##### 5.3.2 第二阶段：权重系统（4天）
- [ ] **权重计算逻辑**
  - 实现岗位权重 + 手动调整的算法
  - 权重影响分析计算
  - 数据一致性保证

- [ ] **权限控制系统**
  - 角色权限管理
  - 数据访问控制
  - 操作权限验证

- [ ] **权重配置界面**
  - 可视化权重配置
  - 权重调整历史
  - 审批流程界面

##### 5.3.3 第三阶段：集成优化（3天）
- [ ] **现有系统集成**
  - 业务线关联项目统计
  - 部门关联项目统计
  - 员工关联项目信息

- [ ] **数据统计优化**
  - 项目利润汇总
  - 权重影响分析
  - 奖金分配预览

- [ ] **用户体验优化**
  - 界面美化
  - 操作流程优化
  - 数据可视化图表

#### 5.4 技术实现要点

##### 5.4.1 新增文件清单
```
backend/
├── src/
│   ├── models/
│   │   ├── Project.js              # 项目模型
│   │   ├── ProjectWeightConfig.js  # 项目权重配置
│   │   └── EmployeeProjectParticipation.js # 员工项目参与
│   ├── controllers/
│   │   ├── projectController.js    # 项目控制器
│   │   └── projectWeightController.js # 权重控制器
│   ├── routes/
│   │   ├── projects.js             # 项目路由
│   │   └── projectWeights.js       # 权重路由
│   └── middleware/
│       └── projectAuth.js          # 项目权限中间件

frontend/
├── src/
│   ├── api/
│   │   ├── project.ts              # 项目API
│   │   └── projectWeight.ts        # 权重API
│   ├── views/
│   │   ├── project/                # 项目管理页面
│   │   └── projectWeight/          # 权重配置页面
│   └── types/
│       └── project.ts              # 项目类型定义
```

##### 5.4.2 需要修改的现有文件
```
backend/
├── src/
│   ├── controllers/
│   │   ├── businessLineController.js    # 添加项目关联统计
│   │   ├── departmentController.js      # 添加项目关联统计
│   │   └── employeeController.js        # 添加项目参与信息
│   └── services/
│       └── nedbService.js               # 添加项目相关查询方法

frontend/
├── src/
│   ├── views/
│   │   ├── businessLine/               # 添加项目管理入口
│   │   ├── department/                 # 添加项目关联显示
│   │   └── employee/                   # 添加项目参与信息
│   └── api/
│       ├── businessLine.ts             # 添加项目统计接口
│       └── employee.ts                 # 添加项目参与接口
```

#### 5.5 风险评估与缓解

##### 5.5.1 主要风险
- **数据一致性**：项目权重与员工权重的同步
- **性能影响**：复杂的关联查询可能影响系统性能
- **权限复杂性**：多角色权限管理增加复杂度

##### 5.5.2 缓解措施
- **数据缓存**：缓存常用查询结果
- **批量操作**：减少数据库查询次数
- **权限简化**：基于角色的简单权限模型

#### 5.6 验收标准

##### 5.6.1 功能验收
- [ ] 项目基础信息管理完整
- [ ] 权重配置功能正常
- [ ] 权限控制有效
- [ ] 数据统计准确

##### 5.6.2 性能验收
- [ ] 页面加载时间 < 2秒
- [ ] 权重计算响应时间 < 1秒
- [ ] 支持100+项目同时管理

##### 5.6.3 用户体验验收
- [ ] 界面美观、操作流畅
- [ ] 错误提示清晰
- [ ] 数据展示直观

### 第六阶段：系统集成与测试（第11-12周）

#### 6.1 系统集成
- [ ] 各模块间数据一致性验证
- [ ] 接口性能优化
- [ ] 错误处理完善
- [ ] 日志记录完善

#### 6.2 系统测试
- [ ] 单元测试
- [ ] 集成测试
- [ ] 性能测试
- [ ] 用户验收测试

### 第七阶段：部署与上线（第13周）

#### 7.1 生产环境部署
- [ ] 生产环境配置
- [ ] 数据库迁移
- [ ] 应用部署
- [ ] 监控配置

#### 7.2 上线支持
- [ ] 用户培训
- [ ] 上线支持
- [ ] 问题收集与修复
- [ ] 系统优化

## 技术栈

### 前端
- Vue 3 + TypeScript
- Element Plus UI组件库
- Pinia状态管理
- Vue Router路由管理
- ECharts图表库
- VXE-Table表格组件

### 后端
- Node.js + Express
- NeDB数据库
- JWT认证
- Winston日志
- Swagger API文档

### 开发工具
- Docker容器化
- ESLint代码规范
- Prettier代码格式化
- Git版本控制

## 项目里程碑

| 阶段 | 时间 | 主要交付物 |
|------|------|------------|
| 第一阶段 | 第1-2周 | 项目基础框架 |
| 第二阶段 | 第3周 | 用户认证系统 |
| 第三阶段 | 第4-5周 | 基础数据管理 |
| 第四阶段 | 第6-7周 | 奖金计算引擎 |
| 第五阶段 | 第8-10周 | 项目管理系统 |
| 第六阶段 | 第11-12周 | 系统集成测试 |
| 第七阶段 | 第13周 | 系统上线 |

## 团队配置

### 开发团队
- 前端开发工程师：1人
- 后端开发工程师：1人
- 项目经理：1人

### 技能要求
- 前端：Vue3、TypeScript、Element Plus
- 后端：Node.js、Express、数据库设计
- 通用：Git、Docker、API设计

## 风险控制

### 技术风险
- 新技术学习成本
- 系统性能瓶颈
- 数据一致性保证

### 项目风险
- 需求变更频繁
- 开发进度延期
- 测试覆盖不足

### 风险应对
- 技术预研和培训
- 敏捷开发迭代
- 自动化测试覆盖
