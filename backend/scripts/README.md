# NeDB测试数据和验证脚本

这个目录包含了用于NeDB数据库测试数据创建和验证的完整脚本套件。所有脚本都设计为在 `localhost:3002` 环境下运行，直接操作NeDB文件。

## 📋 脚本列表

### 1. NeDB数据查看脚本
**文件**: `check-nedb-data.js`
**功能**: 
- 读取并显示所有NeDB数据库文件内容
- 分析数据结构和关联关系
- 检查test2用户的详细配置
- 统计项目状态分布

```bash
node scripts/check-nedb-data.js
```

### 2. 测试数据创建脚本
**文件**: `create-test-data.js`
**功能**:
- 创建默认角色(管理员、员工、经理)
- 创建默认部门和职位
- 确保test2用户有正确的员工记录和角色权限
- 创建示例项目供测试申请(2个active, 1个planning, 1个completed)
- 创建业务线数据

```bash
node scripts/create-test-data.js
```

### 3. API测试脚本
**文件**: `test-available-api.js`
**功能**:
- 模拟用户登录获取JWT token
- 测试 `/api/projects/available` 接口调用
- 验证返回数据格式和内容
- 测试API权限验证机制
- 模拟项目申请流程

```bash
# 完整测试
node scripts/test-available-api.js

# 快速测试(仅测试核心接口)
node scripts/test-available-api.js --quick
```

### 4. 数据一致性检查脚本
**文件**: `data-consistency-check.js`
**功能**:
- 验证用户-员工关联关系
- 检查角色-权限配置
- 确保项目数据完整性
- 检查部门-职位层级关系
- 生成修复建议

```bash
node scripts/data-consistency-check.js
```

### 5. 主执行脚本
**文件**: `run-all-tests.js`
**功能**:
- 依次运行所有测试和验证脚本
- 检查服务器状态
- 生成完整的测试执行报告
- 创建快速测试脚本

```bash
# 运行所有测试
node scripts/run-all-tests.js

# 运行指定脚本
node scripts/run-all-tests.js check-nedb-data.js
```

## 🚀 快速开始

### 环境准备
确保后端服务运行在 `localhost:3002`:
```bash
cd backend
npm run dev
```

### 完整测试流程
```bash
# 1. 运行完整测试套件
node scripts/run-all-tests.js

# 2. 或者依次手动运行
node scripts/check-nedb-data.js
node scripts/data-consistency-check.js  
node scripts/create-test-data.js
node scripts/test-available-api.js
```

### 快速测试
```bash
# 运行快速测试脚本(自动生成)
./scripts/quick-test.sh    # Linux/Mac
./scripts/quick-test.bat   # Windows
```

## 📊 测试数据概览

运行 `create-test-data.js` 后会创建:

### 角色数据
- `role_admin`: 系统管理员(所有权限)
- `role_employee`: 普通员工(基本权限)  
- `role_manager`: 项目经理(管理权限)

### 部门数据
- `dept_tech`: 技术部
- `dept_product`: 产品部
- `dept_operation`: 运营部

### 职位数据
- `pos_dev`: 开发工程师(P3, 15K)
- `pos_senior_dev`: 高级开发工程师(P4, 22K)
- `pos_pm`: 产品经理(P4, 20K)

### 项目数据
- `proj_active_1`: 移动端APP开发项目(active)
- `proj_planning_1`: 数据分析平台建设(planning)  
- `proj_active_2`: 微服务架构升级(active)
- `proj_completed_1`: 客户管理系统(completed)

### test2用户配置
- 用户名: `test2`
- 密码: `123456`
- 角色: 员工 + 经理
- 员工记录: 高级开发工程师，技术部
- 权限: 包含项目申请权限

## 🔍 故障排查

### 常见问题

1. **数据库连接失败**
   ```
   ✗ 无法连接到 users.db
   ```
   - 检查 `database/` 目录是否存在
   - 确保有读写权限

2. **服务器连接失败**
   ```
   ❌ 服务器不可访问
   ```
   - 确保backend服务运行: `cd backend && npm run dev`
   - 检查端口3002是否被占用

3. **test2用户登录失败**
   ```
   ❌ 登录失败
   ```
   - 运行 `create-test-data.js` 创建用户
   - 检查密码是否为 `123456`

4. **权限不足**
   ```
   🔒 权限不足
   ```
   - 检查用户角色配置
   - 验证角色权限设置

### 调试方法

1. **逐步检查**
   ```bash
   # 1. 检查数据
   node scripts/check-nedb-data.js
   
   # 2. 检查一致性  
   node scripts/data-consistency-check.js
   
   # 3. 创建测试数据
   node scripts/create-test-data.js
   
   # 4. 测试API
   node scripts/test-available-api.js
   ```

2. **查看详细错误**
   - 脚本会输出详细的错误信息和修复建议
   - 查看console输出中的JSON数据

## 📈 验证结果

### 成功指标
- ✅ 所有脚本执行成功(退出码0)
- ✅ test2用户登录成功
- ✅ 可申请项目数量 > 0  
- ✅ 用户-员工关联关系正确
- ✅ API权限验证通过

### 预期输出示例
```
🎉 API测试完成！

📋 测试结果总结:
  ✓ 服务器连接正常
  ✓ 用户登录功能正常
  ✓ Token认证机制工作正常  
  ✓ /api/projects/available 接口可用
  ✓ 权限验证机制正常

📊 结果: 找到 3 个可申请项目
```

## 🛠️ 自定义配置

### 修改数据库路径
在脚本中修改 `dbPath`:
```javascript
this.dbPath = path.join(__dirname, '../../database');
```

### 修改服务器地址
在 `test-available-api.js` 中修改:
```javascript
this.baseURL = 'http://localhost:3002';
```

### 添加新的测试用户
在 `create-test-data.js` 中添加用户创建逻辑:
```javascript
const testUserData = {
    username: 'new_user',
    password: hashedPassword,
    roleIds: ['role_employee'],
    // ...
};
```

## 📝 脚本开发指南

### 添加新脚本
1. 在 `scripts/` 目录创建新的 `.js` 文件
2. 实现主类和 `run()` 方法
3. 添加到 `run-all-tests.js` 的 `scripts` 数组
4. 更新此README文档

### 脚本模板
```javascript
class NewTestScript {
    constructor() {
        this.dbPath = path.join(__dirname, '../../database');
    }

    async run() {
        console.log('🚀 新测试脚本启动');
        // 实现测试逻辑
        console.log('✅ 测试完成');
    }
}

if (require.main === module) {
    const script = new NewTestScript();
    script.run().catch(console.error);
}

module.exports = NewTestScript;
```

## 🔧 维护说明

- 定期运行完整测试套件确保数据一致性
- 在添加新功能后更新相应的测试脚本
- 保持测试数据的最新状态
- 根据业务需求调整权限配置

## 📞 支持

如有问题请检查:
1. 脚本执行日志
2. 数据一致性检查报告  
3. API接口响应
4. 服务器运行状态