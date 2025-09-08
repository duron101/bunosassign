# 项目协作模块测试指南

本文档描述了项目协作模块的测试策略、测试用例和运行方法。

## 测试架构

### 后端测试 (Backend Tests)
使用 Jest 测试框架进行单元测试和集成测试。

**测试文件位置：**
- `backend/src/tests/projectCollaboration.test.js` - 项目协作API测试
- `backend/src/tests/setup.js` - 测试环境设置

**测试覆盖范围：**
- API端点测试
- 权限验证测试
- 数据验证测试
- 业务逻辑测试

### 前端测试 (Frontend Tests)

#### 端到端测试 (E2E Tests)
使用 Playwright 进行端到端测试。

**测试文件位置：**
- `frontend/tests/project-collaboration.spec.ts` - 项目协作功能E2E测试

**测试覆盖范围：**
- 用户界面交互
- 业务流程测试
- 权限控制测试
- 响应式设计测试

#### 单元测试 (Unit Tests)
使用 Vitest 进行单元测试。

**测试文件位置：**
- `frontend/tests/unit/useProjectPermissions.test.ts` - 权限组合函数测试

## 运行测试

### 后端测试

#### 安装依赖
```bash
cd backend
npm install
```

#### 运行所有测试
```bash
npm test
```

#### 运行特定测试文件
```bash
npm test -- projectCollaboration.test.js
```

#### 运行测试并生成覆盖率报告
```bash
npm run test:coverage
```

#### 监听模式运行测试
```bash
npm run test:watch
```

### 前端测试

#### E2E测试

**安装依赖**
```bash
cd frontend
npm install
npx playwright install
```

**运行E2E测试**
```bash
# 运行所有E2E测试
npx playwright test

# 运行特定测试文件
npx playwright test project-collaboration.spec.ts

# 运行测试并显示UI
npx playwright test --ui

# 生成测试报告
npx playwright show-report
```

#### 单元测试

**运行单元测试**
```bash
cd frontend
npm run test:unit
```

**监听模式运行单元测试**
```bash
npm run test:unit:watch
```

## 测试用例详情

### 后端API测试

#### 1. 项目发布测试
- ✅ 成功发布项目
- ✅ 未认证用户访问失败
- ✅ 无效数据验证失败

#### 2. 团队申请测试
- ✅ 成功申请团队组建
- ✅ 不存在的项目申请失败
- ✅ 权限验证

#### 3. 项目详情查询测试
- ✅ 成功获取项目协作详情
- ✅ 不存在的项目查询失败

#### 4. 审批流程测试
- ✅ 成功批准团队申请
- ✅ 成功拒绝团队申请
- ✅ 无效操作失败

#### 5. 申请列表测试
- ✅ 获取待审批申请列表
- ✅ 按状态筛选

#### 6. 通知系统测试
- ✅ 获取用户通知
- ✅ 筛选未读通知

#### 7. 权限测试
- ✅ 无权限用户访问拒绝
- ✅ 权限验证中间件

### 前端E2E测试

#### 1. 项目发布流程
- ✅ 导航到发布页面
- ✅ 填写并提交项目表单
- ✅ 权限控制验证

#### 2. 团队申请流程
- ✅ 申请团队组建
- ✅ 添加团队成员
- ✅ 提交申请

#### 3. 审批流程
- ✅ 查看待审批申请
- ✅ 批准团队申请
- ✅ 拒绝团队申请

#### 4. 通知系统
- ✅ 查看通知列表
- ✅ 标记通知已读
- ✅ 全部标记已读

#### 5. 权限控制
- ✅ 无权限用户界面隐藏
- ✅ 权限限制页面访问

#### 6. 响应式设计
- ✅ 移动端界面测试

### 单元测试

#### 权限组合函数测试
- ✅ `canPublishProject` 权限检查
- ✅ `canApproveTeam` 权限检查
- ✅ `canViewProject` 权限检查
- ✅ `canApplyTeamBuilding` 权限检查
- ✅ `isAdmin` 管理员检查
- ✅ `canViewNotifications` 通知权限
- ✅ `hasPermission` 特定权限检查
- ✅ `hasAnyPermission` 任一权限检查

## 测试数据管理

### 测试数据创建
测试用例会自动创建所需的测试数据，包括：
- 测试项目
- 测试团队申请
- 测试通知

### 测试数据清理
测试完成后会自动清理所有测试数据，确保不影响其他测试和开发环境。

## 持续集成 (CI)

### GitHub Actions 配置
可以在 `.github/workflows/` 目录下创建CI配置文件：

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd backend && npm install
      - name: Run tests
        run: cd backend && npm test

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd frontend && npm install
      - name: Install Playwright
        run: cd frontend && npx playwright install
      - name: Run E2E tests
        run: cd frontend && npx playwright test
```

## 测试最佳实践

### 1. 测试隔离
- 每个测试用例都是独立的
- 测试数据互不影响
- 使用事务回滚确保数据清洁

### 2. 权限测试
- 测试不同权限级别的用户访问
- 验证权限控制的完整性
- 确保安全性

### 3. 边界条件测试
- 测试空数据、无效数据
- 测试并发访问
- 测试异常情况处理

### 4. 用户体验测试
- 测试响应式设计
- 测试加载状态
- 测试错误提示

## 问题排查

### 测试失败排查步骤

1. **检查测试环境**
   - 确保数据库连接正常
   - 确保测试数据正确设置

2. **检查权限配置**
   - 验证测试用户权限
   - 确认权限中间件正确运行

3. **检查API响应**
   - 查看详细错误信息
   - 检查请求参数格式

4. **检查前端状态**
   - 验证组件状态更新
   - 检查路由配置

### 常见问题

#### 1. 数据库连接失败
```bash
# 解决方案：检查数据库配置
vim backend/src/config/devConfig.js
```

#### 2. 权限测试失败
```bash
# 解决方案：检查用户权限配置
# 确保测试用户具有相应权限
```

#### 3. E2E测试超时
```bash
# 解决方案：增加测试超时时间
# 检查页面加载性能
```

## 测试报告

### 覆盖率报告
测试完成后会生成覆盖率报告：
- 后端：`backend/coverage/lcov-report/index.html`
- 前端：`frontend/coverage/index.html`

### E2E测试报告
Playwright测试完成后会生成HTML报告：
- 报告位置：`frontend/playwright-report/index.html`
- 包含截图和视频记录

## 性能测试

### 负载测试建议
对于项目协作模块的关键API，建议进行负载测试：

```bash
# 使用Apache Bench进行简单负载测试
ab -n 100 -c 10 http://localhost:3000/api/project-collaboration/applications/pending
```

### 性能监控
- 监控API响应时间
- 监控数据库查询性能
- 监控前端页面加载时间

通过完善的测试策略，我们可以确保项目协作模块的质量和稳定性。