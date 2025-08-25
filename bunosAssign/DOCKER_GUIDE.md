# Docker 部署指南

奖金模拟系统的Docker化部署指南，支持开发和生产环境。

## 📋 目录结构

```
.
├── docker-compose.yml          # 基础Docker Compose配置
├── docker-compose.dev.yml      # 开发环境配置
├── docker-compose.prod.yml     # 生产环境配置
├── .env                        # 环境变量配置
├── .env.production             # 生产环境变量
├── docker-deploy.sh            # Linux/Mac部署脚本
├── docker-deploy.bat           # Windows部署脚本
├── backend/
│   ├── Dockerfile              # 后端默认Dockerfile
│   ├── Dockerfile.dev          # 后端开发环境
│   └── Dockerfile.prod         # 后端生产环境
├── frontend/
│   ├── Dockerfile              # 前端默认Dockerfile
│   ├── Dockerfile.dev          # 前端开发环境
│   ├── Dockerfile.prod         # 前端生产环境
│   ├── nginx.conf              # 开发Nginx配置
│   ├── nginx.prod.conf         # 生产Nginx配置
│   └── docker-entrypoint.sh    # 前端启动脚本
└── docker/
    ├── secrets/                # 密钥文件 (生产环境)
    ├── redis.conf              # Redis配置
    └── mysql/
        └── my.cnf              # MySQL配置
```

## 🚀 快速开始

### 开发环境

**Windows:**
```batch
# 启动开发环境
docker-deploy.bat dev up

# 查看日志
docker-deploy.bat dev logs

# 停止服务
docker-deploy.bat dev down
```

**Linux/Mac:**
```bash
# 给脚本执行权限
chmod +x docker-deploy.sh

# 启动开发环境
./docker-deploy.sh dev up

# 查看日志  
./docker-deploy.sh dev logs

# 停止服务
./docker-deploy.sh dev down
```

### 生产环境

```bash
# 启动生产环境
./docker-deploy.sh prod up

# 备份数据
./docker-deploy.sh prod backup

# 查看状态
./docker-deploy.sh prod status
```

## 🔧 配置说明

### 环境变量

主要环境变量配置在 `.env` 文件中：

```env
# 环境设置
NODE_ENV=development
COMPOSE_PROFILES=default

# 端口配置
BACKEND_PORT=3000
FRONTEND_PORT=8080
MYSQL_PORT=3306
REDIS_PORT=6379

# 数据库配置
DB_TYPE=nedb              # nedb(开发) 或 mysql(生产)
MYSQL_ROOT_PASSWORD=root123
MYSQL_DATABASE=bonus_system
MYSQL_USER=bonus_user
MYSQL_PASSWORD=bonus_pass

# JWT配置 (生产环境必须修改)
JWT_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
```

### Docker Profiles

系统使用Docker Compose profiles来管理不同环境：

- `default`: 基础服务 (后端 + 前端 + NeDB)
- `mysql`: MySQL数据库服务
- `redis`: Redis缓存服务  
- `production`: 生产环境完整配置
- `tools`: 管理工具 (Adminer等)

## 📊 服务架构

### 开发环境 (NeDB模式)
```
┌─────────────┐    ┌─────────────┐
│   Frontend  │    │   Backend   │
│   (Vue 3)   │◄──►│  (Node.js)  │
│   :8080     │    │   :3000     │
└─────────────┘    └─────────────┘
                            │
                   ┌─────────────┐
                   │    NeDB     │
                   │ (本地文件)   │
                   └─────────────┘
```

### 生产环境 (MySQL模式)
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Nginx     │    │   Backend   │    │    MySQL    │
│ (Frontend)  │◄──►│  (Node.js)  │◄──►│ (Database)  │
│   :80/443   │    │   :3000     │    │   :3306     │
└─────────────┘    └─────────────┘    └─────────────┘
                            │
                   ┌─────────────┐
                   │    Redis    │
                   │   (Cache)   │
                   │   :6379     │
                   └─────────────┘
```

## 🔒 安全配置

### 开发环境
- 使用默认密码和密钥
- 启用调试模式
- 数据存储在本地NeDB文件中
- 实时代码同步

### 生产环境
- 使用Docker secrets管理敏感信息
- 自动生成强密码
- SSL/TLS加密 (可选)
- 安全的HTTP headers
- 限流和访问控制

### 密钥管理

生产环境密钥存储在 `docker/secrets/` 目录：

```
docker/secrets/
├── mysql_root_password.txt     # MySQL root密码
├── mysql_password.txt          # MySQL用户密码
├── jwt_secret.txt              # JWT密钥
└── jwt_refresh_secret.txt      # JWT刷新密钥
```

## 📈 监控和日志

### 健康检查

所有服务都配置了健康检查：

- **Backend**: `GET /api/health`
- **MySQL**: `mysqladmin ping`
- **Redis**: `redis-cli ping`
- **Frontend**: HTTP状态检查

### 日志管理

日志文件存储位置：

- **Backend**: `logs/backend/`
- **Frontend**: `logs/frontend/`  
- **MySQL**: 容器内 `/var/log/mysql/`
- **Redis**: 容器内日志

查看实时日志：
```bash
# 所有服务日志
docker-compose logs -f

# 特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🛠 常用命令

### 服务管理
```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 重建镜像
docker-compose build --no-cache

# 查看服务状态
docker-compose ps
```

### 数据管理
```bash
# 进入后端容器
docker-compose exec backend sh

# 查看NeDB数据
docker-compose exec backend ls -la database/

# 数据库备份 (MySQL)
docker-compose exec mysql mysqldump -u root -p bonus_system > backup.sql

# 清理未使用的Docker资源
docker system prune -f
```

### 开发调试
```bash
# 查看容器日志
docker-compose logs -f backend

# 进入容器调试
docker-compose exec backend sh

# 重建并重启服务
docker-compose up -d --build
```

## 🔄 数据迁移

### 从开发到生产

1. **导出NeDB数据**:
```bash
docker-compose exec backend node scripts/export-nedb-data.js
```

2. **导入到MySQL**:
```bash
docker-compose exec backend node scripts/import-to-mysql.js
```

### 数据备份恢复

```bash
# 创建备份
./docker-deploy.sh prod backup

# 恢复备份 (需要手动执行)
docker-compose exec mysql mysql -u root -p < backup/mysql_backup.sql
```

## 🐛 故障排除

### 常见问题

1. **端口占用**
   ```bash
   # 检查端口使用情况
   netstat -tulpn | grep :3000
   
   # 修改 .env 中的端口配置
   BACKEND_PORT=3001
   ```

2. **内存不足**
   ```bash
   # 检查Docker内存使用
   docker stats
   
   # 增加Docker Desktop内存限制
   ```

3. **权限问题 (Linux)**
   ```bash
   # 修复文件权限
   sudo chown -R $USER:$USER .
   
   # 修复脚本权限
   chmod +x docker-deploy.sh
   ```

4. **数据库连接失败**
   ```bash
   # 检查MySQL服务状态
   docker-compose logs mysql
   
   # 重启数据库服务
   docker-compose restart mysql
   ```

### 日志分析

```bash
# 检查容器状态
docker-compose ps

# 查看失败的容器日志
docker-compose logs [service_name]

# 检查健康状态
docker inspect [container_name] --format='{{.State.Health.Status}}'
```

## 📝 最佳实践

### 开发环境
- 使用 `docker-compose.dev.yml` 配置
- 启用代码热重载
- 使用NeDB减少依赖
- 保持数据卷同步

### 生产环境
- 使用多阶段构建优化镜像大小
- 启用Docker secrets管理敏感信息
- 配置健康检查和重启策略
- 定期备份数据
- 监控资源使用情况

### 性能优化
- 使用nginx缓存静态资源
- 启用gzip压缩
- 配置连接池
- 优化Docker镜像层

## 🔗 访问地址

### 开发环境
- **前端应用**: http://localhost:8080
- **后端API**: http://localhost:3000/api
- **API文档**: http://localhost:3000/api/docs

### 生产环境  
- **前端应用**: http://localhost (或配置的域名)
- **后端API**: http://localhost:3000/api
- **数据库管理**: http://localhost:8081 (Adminer)

## 📞 支持

如有问题，请检查：

1. Docker和Docker Compose版本
2. 端口占用情况
3. 环境变量配置
4. 容器日志输出
5. 系统资源使用情况

更多详细信息请参考项目文档或提交issue。