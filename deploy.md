# 奖金模拟系统部署文档

## 项目概述

本项目是一个基于Vue 3 + Node.js的奖金模拟系统，采用前后端分离架构，支持"利润贡献+岗位价值+绩效"三维奖金分配模型。

## 技术栈

### 前端
- Vue 3 + TypeScript
- Element Plus UI组件库
- Pinia 状态管理
- VXE-Table 表格组件
- ECharts 图表库
- Vite 构建工具

### 后端
- Node.js + Express
- MySQL 数据库
- JWT 身份认证
- Multer 文件上传
- XLSX Excel处理
- Swagger API文档

## 系统功能

### 核心模块
- **用户认证**: JWT令牌认证，RBAC权限控制
- **员工管理**: 员工信息CRUD，Excel批量导入/导出
- **组织架构**: 部门管理、岗位管理、业务线管理
- **角色权限**: 角色管理、权限配置、用户角色分配
- **奖金计算**: 三维奖金计算引擎，模拟分析
- **报表统计**: 多维度报表，图表展示

### 特色功能
- Excel文件拖拽上传
- 权限按组管理
- 批量操作支持
- 实时数据验证
- 响应式布局

## 🚨 **重要：端口配置说明**

### 📍 **端口分配（避免冲突）**

| 服务类型 | 端口 | 说明 | 访问地址 |
|---------|------|------|----------|
| **统一服务器** | 3000 | 前端+后端混合服务 | http://localhost:3000 |
| **前端开发服务器** | 8080 | Vite开发服务器 | http://localhost:8080 |
| **后端API服务器** | 3001 | Express API服务 | http://localhost:3001 |

### ⚠️ **端口冲突警告**

**重要提醒**：不同启动方式使用不同端口，避免同时运行多个服务在同一端口！

## 本地开发部署

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0
- MySQL >= 8.0 (可选，当前使用内存存储)

### 🎯 **推荐启动方式**

#### 方式一：统一服务器（推荐用于演示和测试）

```bash
# 1. 克隆项目
git clone <repository-url>
cd bunosAssign

# 2. 使用根目录一键启动脚本
# Windows: start.bat
# Linux/Mac: ./start.sh

# 3. 或手动执行以下步骤：
cd frontend && npm install
cd ../backend && npm install
cd ..
cd frontend && npm run build && cd ..
node simple-server.js
```

**访问地址**: http://localhost:3000
**特点**: 前端静态文件 + 后端API，单端口访问

#### 方式二：分离式开发（推荐用于开发调试）

```bash
# 1. 启动后端服务（终端1）
cd backend
npm install
npm run dev    # 开发模式，端口3001

# 2. 启动前端服务（终端2）
cd frontend
npm install
npm run dev    # 开发模式，端口8080
```

**访问地址**: 
- 前端页面：http://localhost:8080
- 后端API：http://localhost:3001
- API文档：http://localhost:3001/api/docs

**特点**: 前后端分离，支持热重载，适合开发调试

### 一键启动脚本（推荐）

#### Windows用户
```bash
# 一键启动开发环境
start.bat

# 或者先设置环境再启动
scripts\dev-setup.bat  # 首次运行，安装依赖
scripts\dev-start.bat  # 启动开发服务
```

#### Linux/Mac用户
```bash
# 一键启动开发环境
chmod +x start.sh
./start.sh

# 或者分步骤执行
chmod +x scripts/dev-setup.sh  # 首次运行，安装依赖
./scripts/dev-setup.sh
chmod +x scripts/dev-start.sh  # 启动开发服务
./scripts/dev-start.sh
```

### 方式三：使用根目录统一脚本

```bash
# 安装所有依赖
npm run install-deps

# 构建前端并启动统一服务器
npm run build && npm start

# 开发模式
npm run dev
```

### 🔧 **端口配置详解**

#### 统一服务器配置 (simple-server.js)
```javascript
const PORT = process.env.PORT || 3000;
// 前端静态文件 + 后端API，单端口访问
```

#### 分离式开发配置
```javascript
// 前端 (vite.config.ts)
server: {
  port: 8080,
  proxy: {
    '/api': {
      target: 'http://localhost:3001',  // 代理到后端3001端口
      changeOrigin: true
    }
  }
}

// 后端 (backend/src/app.js)
const PORT = process.env.PORT || 3001;  // 使用3001端口避免冲突
```

### 默认访问信息

#### 统一服务器模式
- **访问地址**: http://localhost:3000
- **默认账号**: admin
- **默认密码**: admin123

#### 分离式开发模式
- **前端页面**: http://localhost:8080
- **后端API**: http://localhost:3001
- **API文档**: http://localhost:3001/api/docs
- **默认账号**: admin
- **默认密码**: admin123

## 生产环境部署

### 1. Docker部署（推荐）

```bash
# 创建Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN cd frontend && npm install && npm run build
RUN cd backend && npm install --production
EXPOSE 3000
CMD ["node", "simple-server.js"]

# 构建镜像
docker build -t bonus-system .

# 运行容器
docker run -p 3000:3000 bonus-system
```

### 2. PM2部署

```bash
# 安装PM2
npm install -g pm2

# 构建前端
cd frontend && npm run build && cd ..

# 使用PM2启动
pm2 start simple-server.js --name "bonus-system"

# 查看状态
pm2 status
pm2 logs bonus-system
```

### 3. Nginx反向代理

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 静态资源缓存
    location /assets/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 云平台部署

### Endgame平台部署

项目支持使用Endgame云平台进行一键部署：

```bash
# 使用Claude Code的Endgame MCP
# 1. 审查部署配置
mcp__Endgame__review --appSourcePath=/path/to/project

# 2. 执行部署
mcp__Endgame__deploy \
  --appSourcePath=/path/to/project \
  --buildCommand="cd frontend && npm install && npm run build" \
  --entrypointFile="simple-server.js"
```

### 其他云平台

支持部署到以下平台：
- **Vercel**: 适合静态前端部署
- **Heroku**: 全栈应用部署
- **AWS EC2**: 自定义服务器部署
- **阿里云ECS**: 国内云服务器
- **腾讯云CVM**: 国内云服务器

## 环境变量配置

创建`.env`文件：

```bash
# 服务端口配置
PORT=3000                    # 统一服务器端口
BACKEND_PORT=3001           # 后端API端口
FRONTEND_PORT=8080          # 前端开发端口

# 数据库配置（如使用MySQL）
DB_HOST=localhost
DB_PORT=3306
DB_NAME=bonus_system
DB_USER=root
DB_PASSWORD=your_password

# JWT密钥
JWT_SECRET=your-jwt-secret-key

# 文件上传限制
MAX_FILE_SIZE=10MB

# 系统配置
SYSTEM_NAME=奖金模拟系统
SYSTEM_VERSION=1.0.0
```

## API文档

### 认证接口
- `POST /api/auth/login` - 用户登录

### 用户管理
- `GET /api/users` - 获取用户列表
- `POST /api/users` - 创建用户
- `PUT /api/users/:id` - 更新用户
- `DELETE /api/users/:id` - 删除用户
- `POST /api/users/batch` - 批量操作

### 角色管理
- `GET /api/roles` - 获取角色列表
- `POST /api/roles` - 创建角色
- `PUT /api/roles/:id` - 更新角色
- `DELETE /api/roles/:id` - 删除角色
- `GET /api/permissions` - 获取权限列表

### 员工管理
- `GET /api/employees` - 获取员工列表
- `POST /api/employees` - 创建员工
- `PUT /api/employees/:id` - 更新员工
- `DELETE /api/employees/:id` - 删除员工
- `GET /api/employees/template` - 下载导入模板
- `POST /api/employees/import` - Excel导入

### 组织架构
- `GET /api/departments` - 部门管理
- `GET /api/positions` - 岗位管理
- `GET /api/business-lines` - 业务线管理

### 奖金计算
- `GET /api/calculations` - 获取计算结果
- `POST /api/calculations/execute` - 执行计算

### 系统配置
- `GET /api/system/config` - 获取系统配置
- `POST /api/system/config` - 更新系统配置

## 数据库设计

### 核心表结构

```sql
-- 用户表
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role_id INT,
    status TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 角色表
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    permissions JSON,
    status TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 员工表
CREATE TABLE employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_no VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    department_id INT,
    position_id INT,
    annual_salary DECIMAL(12,2),
    entry_date DATE,
    phone VARCHAR(20),
    email VARCHAR(100),
    status TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 性能优化

### 前端优化
- 路由懒加载
- 组件按需引入
- 图片压缩和CDN
- 静态资源缓存
- Gzip压缩

### 后端优化
- API响应缓存
- 数据库索引优化
- 分页查询
- 连接池配置
- 内存使用监控

## 安全措施

### 认证授权
- JWT令牌认证
- 权限中间件验证
- 密码加密存储
- 会话超时管理

### 数据安全
- SQL注入防护
- XSS攻击防护
- CSRF保护
- 文件上传安全验证
- 敏感数据脱敏

### 网络安全
- HTTPS加密传输
- CORS跨域配置
- 请求频率限制
- IP白名单

## 监控和日志

### 应用监控
- 性能指标监控
- 错误日志收集
- 用户行为分析
- 系统资源监控

### 日志配置
```javascript
// winston日志配置示例
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

## 故障排除

### 常见问题

#### 1. 端口冲突问题
```bash
# 检查端口占用
netstat -an | findstr :3000
netstat -an | findstr :3001
netstat -an | findstr :8080

# 停止冲突进程
taskkill /F /PID <进程ID>

# 或使用PowerShell
Get-Process -Name "node" | Stop-Process -Force
```

#### 2. 页面不一致问题
**问题描述**: 访问3000端口和8080端口显示不同页面

**原因分析**:
- 3000端口：运行 `simple-server.js`，提供前端静态文件+后端API
- 8080端口：运行Vite开发服务器，纯前端页面
- 3001端口：运行后端API服务

**解决方案**:
1. **统一服务器模式**: 只使用3000端口，停止其他服务
2. **分离式开发模式**: 前端8080 + 后端3001，确保API代理配置正确

#### 3. 服务启动失败
```bash
# 检查Node.js版本
node --version

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

#### 4. 前端构建失败
```bash
# 清理缓存
npm run clean
rm -rf dist

# 重新构建
npm run build
```

#### 5. 数据库连接问题
```bash
# 检查数据库服务
systemctl status mysql

# 测试连接
mysql -u root -p -h localhost -P 3306
```

#### 6. 文件上传问题
- 检查文件大小限制
- 验证文件类型
- 确认存储路径权限

## 维护指南

### 定期维护
- [ ] 日志文件清理
- [ ] 数据库备份
- [ ] 系统安全更新
- [ ] 性能监控检查
- [ ] 用户反馈处理

### 版本升级
1. 备份当前系统
2. 测试新版本功能
3. 执行数据迁移脚本
4. 更新生产环境
5. 验证系统功能

## 联系信息

- **项目维护**: 开发团队
- **技术支持**: support@company.com
- **问题反馈**: https://github.com/company/bonus-system/issues

## 快速启动脚本说明

### 一键启动脚本功能

#### Windows (start.bat)
- 自动检测Node.js环境
- 智能安装依赖包（仅在缺失时）
- 自动构建前端项目
- 启动统一服务器（simple-server.js）
- 自动打开浏览器
- 提供清晰的状态提示和错误处理

#### Linux/Mac (start.sh)
- 彩色输出界面，用户体验友好
- 自动检测并安装依赖
- 端口占用检测和警告
- 后台服务启动，支持日志输出
- 跨平台浏览器启动支持
- 提供服务管理命令

### 脚本文件结构

```
├── start.bat              # Windows一键启动脚本
├── start.sh               # Linux/Mac一键启动脚本  
└── scripts/
    ├── dev-setup.bat      # Windows开发环境设置
    ├── dev-start.bat      # Windows开发服务启动
    ├── dev-setup.sh       # Linux/Mac开发环境设置
    └── dev-start.sh       # Linux/Mac开发服务启动
```

### 脚本使用场景

1. **首次部署**: 使用一键启动脚本（start.bat/start.sh）
2. **开发环境**: 使用dev-setup + dev-start脚本
3. **生产环境**: 参考Docker或PM2部署方式

## 更新日志

### v1.0.2 (2024-08-15)
- ✅ 修复端口配置不一致问题
- ✅ 明确端口分配：统一服务器3000，前端8080，后端3001
- ✅ 添加端口冲突警告和解决方案
- ✅ 更新分离式开发配置说明
- ✅ 完善故障排除指南，增加页面不一致问题解决方案

### v1.0.1 (2024-08-15)
- ✅ 新增Windows一键启动脚本 (start.bat)
- ✅ 新增Linux/Mac一键启动脚本 (start.sh)
- ✅ 完善开发环境脚本 (dev-setup.sh, dev-start.sh)
- ✅ 更新部署文档，增加脚本使用说明
- ✅ 优化用户体验，支持自动依赖检测和安装
- ✅ 添加彩色输出和友好的错误提示

### v1.0.0 (2024-08-11)
- ✅ 基础框架搭建
- ✅ 用户认证系统
- ✅ 员工管理模块
- ✅ 角色权限系统
- ✅ Excel导入导出
- ✅ 奖金计算引擎
- ✅ 系统配置管理
- ✅ 简化服务器部署方案

---

## 🎯 **部署成功标志**

### 统一服务器模式
- ✅ 访问 http://localhost:3000 显示登录页面
- ✅ 使用 admin/admin123 可以正常登录
- ✅ 系统各个功能模块正常访问
- ✅ Excel导入功能正常工作
- ✅ 角色权限配置正常

### 分离式开发模式
- ✅ 前端 http://localhost:8080 正常显示
- ✅ 后端 http://localhost:3001 正常响应
- ✅ API代理配置正确，前端能正常调用后端
- ✅ 热重载功能正常

### 一键启动成功标志
- ✅ 脚本自动完成所有环境检查
- ✅ 依赖安装无错误
- ✅ 前端构建成功
- ✅ 服务器正常启动在指定端口
- ✅ 浏览器自动打开系统页面

## 🔧 **端口配置检查清单**

部署前请确认以下配置：

- [ ] 3000端口未被其他服务占用
- [ ] 3001端口未被其他服务占用  
- [ ] 8080端口未被其他服务占用
- [ ] 环境变量配置正确
- [ ] API代理配置正确
- [ ] 防火墙允许相应端口访问