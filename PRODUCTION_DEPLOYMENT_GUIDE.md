# 生产级奖金模拟系统部署指南

## 📋 部署概述

本指南详细说明了如何将奖金模拟系统安全、稳定地部署到生产环境中，支持三大核心业务流程：
- **奖金查看**：员工查看个人奖金详情和历史趋势
- **项目申请**：项目协作申请和审批流程
- **岗位晋升查看**：岗位要求和晋升路径查询

## 🏗️ 系统架构

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    │    (Nginx)      │
                    └─────────┬───────┘
                              │
                    ┌─────────▼───────┐
                    │    Frontend     │
                    │ (Vue 3 + Nginx) │
                    └─────────┬───────┘
                              │
                    ┌─────────▼───────┐
                    │    Backend      │
                    │ (Node.js + API) │
                    └─────────┬───────┘
                              │
                    ┌─────────▼───────┐
                    │   Database      │
                    │    (NeDB)       │
                    └─────────────────┘
```

## 🚀 快速部署

### 步骤 1: 环境准备

```bash
# 1. 克隆代码库
git clone <your-repo-url>
cd bunosAssign

# 2. 配置环境变量
cp .env.production.template .env.production
vim .env.production  # 填入实际的生产环境配置

# 3. 创建SSL证书目录（如需HTTPS）
mkdir -p nginx/ssl
# 将SSL证书文件复制到 nginx/ssl/ 目录
```

### 步骤 2: 生产部署

```bash
# 使用部署脚本（推荐）
./scripts/deploy-production.sh

# 或手动部署
docker-compose -f docker-compose.production.yml up -d
```

### 步骤 3: 验证部署

```bash
# 运行健康检查
./scripts/health-check.sh --verbose

# 检查服务状态
docker-compose -f docker-compose.production.yml ps

# 查看日志
docker-compose -f docker-compose.production.yml logs -f
```

## 📁 文件结构说明

### 核心部署文件

```
bunosAssign/
├── 🐳 Docker配置
│   ├── backend/Dockerfile.production          # 后端生产Dockerfile
│   ├── frontend/Dockerfile.production         # 前端生产Dockerfile
│   ├── docker-compose.production.yml          # 生产环境编排
│   └── .env.production.template               # 环境变量模板
│
├── 🌐 反向代理配置
│   ├── nginx/nginx.prod.conf                  # Nginx生产配置
│   └── frontend/docker-entrypoint-prod.sh     # 前端启动脚本
│
├── 📊 监控与日志
│   ├── monitoring/prometheus.yml              # Prometheus配置
│   ├── monitoring/alert_rules.yml             # 告警规则
│   └── scripts/backup-data.sh                 # 数据备份脚本
│
├── 🔧 部署脚本
│   ├── scripts/deploy-production.sh           # 生产部署脚本
│   ├── scripts/health-check.sh                # 健康检查脚本
│   └── .github/workflows/deploy-production.yml # CI/CD流水线
│
└── 📚 文档
    └── PRODUCTION_DEPLOYMENT_GUIDE.md         # 本部署指南
```

### 环境配置

| 组件 | 端口 | 用途 |
|------|------|------|
| Frontend (Nginx) | 80, 443 | Web服务器，静态资源 |
| Backend (Node.js) | 3002 | API服务，业务逻辑 |
| Redis (可选) | 6379 | 缓存，会话存储 |
| Prometheus (可选) | 9090 | 监控数据收集 |
| Grafana (可选) | 3000 | 监控仪表板 |

## 🔒 安全配置

### 1. JWT密钥管理

```bash
# 生成强密钥（至少32字符）
openssl rand -base64 32  # JWT_SECRET
openssl rand -base64 32  # JWT_REFRESH_SECRET
```

### 2. SSL/TLS配置

```bash
# 生成自签名证书（测试用）
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem

# 或使用Let's Encrypt（生产环境推荐）
certbot certonly --webroot -w /var/www/html \
  -d your-domain.com
```

### 3. 防火墙配置

```bash
# Ubuntu/Debian
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# CentOS/RHEL
firewall-cmd --permanent --add-service=ssh
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

## 📊 监控与日志

### 1. 系统监控

```bash
# 启用监控栈
docker-compose -f docker-compose.production.yml --profile monitoring up -d

# 访问监控面板
# Prometheus: http://your-domain:9090
# Grafana: http://your-domain:3000 (admin/设置的密码)
```

### 2. 日志管理

```bash
# 查看实时日志
docker-compose -f docker-compose.production.yml logs -f backend
docker-compose -f docker-compose.production.yml logs -f frontend

# 日志位置
# Backend: /var/lib/docker/volumes/bunosassign_backend_logs/_data/
# Frontend: /var/lib/docker/volumes/bunosassign_frontend_logs/_data/
```

### 3. 性能指标

关键性能指标监控：
- **响应时间**: API接口95%响应时间 < 2秒
- **错误率**: HTTP 5xx错误率 < 5%
- **CPU使用率**: < 80%
- **内存使用率**: < 85%
- **磁盘空间**: > 10% 可用空间

## 💾 数据备份

### 1. 自动备份

```bash
# 设置定时备份（crontab）
0 2 * * * /path/to/bunosAssign/scripts/backup-data.sh

# 备份包含：
# - NeDB数据库文件
# - 应用日志
# - 配置文件
```

### 2. 手动备份

```bash
# 立即创建备份
./scripts/backup-data.sh

# 备份位置：/opt/backups/bonus-system/
# 格式：bonus-system-backup-YYYYMMDD_HHMMSS.tar.gz
```

### 3. S3备份（可选）

```bash
# 在 .env.production 中配置
BACKUP_S3_BUCKET=your-backup-bucket
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-west-2
```

## 🔄 CI/CD流水线

### GitHub Actions 工作流

1. **代码质量检查**
   - 单元测试
   - 代码风格检查
   - 安全漏洞扫描

2. **构建与推送**
   - Docker镜像构建
   - 推送到容器注册中心

3. **部署到生产**
   - 零停机部署
   - 健康检查
   - 自动回滚（失败时）

4. **部署后验证**
   - 性能测试
   - 功能验证
   - 通知发送

### 手动触发部署

```bash
# 通过GitHub Actions手动部署
gh workflow run "Production Deployment" \
  --field environment=production

# 或本地部署
./scripts/deploy-production.sh --verbose
```

## 🏥 健康检查

### 1. 系统健康检查

```bash
# 完整健康检查
./scripts/health-check.sh --verbose

# 检查项目：
# ✓ 系统资源（CPU、内存、磁盘）
# ✓ Docker容器状态
# ✓ 数据库文件完整性
# ✓ API端点响应
# ✓ SSL证书有效期
```

### 2. 业务功能验证

```bash
# 验证核心业务流程
curl -X GET "$BACKEND_URL/api/health"                    # 系统健康
curl -X POST "$BACKEND_URL/api/auth/login"               # 用户认证
curl -X GET "$BACKEND_URL/api/employees"                 # 员工管理
curl -X GET "$BACKEND_URL/api/personal-bonus"            # 奖金查询
curl -X GET "$BACKEND_URL/api/projects/available"        # 项目协作
```

## 🔧 故障排除

### 1. 常见问题

#### 容器启动失败
```bash
# 检查容器状态
docker-compose -f docker-compose.production.yml ps

# 查看容器日志
docker-compose -f docker-compose.production.yml logs backend

# 检查镜像是否存在
docker images | grep bonus
```

#### 数据库连接问题
```bash
# 检查数据库文件
ls -la database/
docker exec bonus-backend-prod ls -la /app/database/

# 检查文件权限
docker exec bonus-backend-prod ls -la /app/database/users.db
```

#### 网络连接问题
```bash
# 检查端口占用
netstat -tulpn | grep :80
netstat -tulpn | grep :3002

# 检查防火墙
sudo ufw status
iptables -L
```

### 2. 性能问题

#### 响应时间慢
```bash
# 检查系统负载
top
htop

# 检查内存使用
free -h
docker stats

# 分析应用日志
tail -f backend/logs/combined.log
```

#### 高错误率
```bash
# 查看错误日志
tail -f backend/logs/error.log

# 检查API响应
curl -v "$BACKEND_URL/api/health"

# 监控系统指标
docker exec prometheus promtool query instant 'up'
```

### 3. 数据恢复

```bash
# 从备份恢复
BACKUP_FILE="/opt/backups/bonus-system/bonus-system-backup-20240328_120000.tar.gz"

# 停止服务
docker-compose -f docker-compose.production.yml down

# 恢复数据
cd /tmp
tar -xzf "$BACKUP_FILE"
docker run --rm -v bunosassign_backend_data:/data -v /tmp:/backup alpine sh -c "cd /data && rm -rf ./* && tar -xzf /backup/backend_data.tar.gz"

# 重启服务
docker-compose -f docker-compose.production.yml up -d
```

## 📈 性能优化

### 1. 前端优化

- **静态资源缓存**: 1年缓存期
- **Gzip压缩**: 减少传输大小
- **CDN分发**: 全球内容分发
- **图片优化**: WebP格式支持

### 2. 后端优化

- **数据库查询优化**: 索引优化
- **缓存策略**: Redis缓存热点数据
- **连接池**: 数据库连接复用
- **异步处理**: 长时间任务异步化

### 3. 系统优化

```bash
# 内核参数优化
echo 'net.core.somaxconn = 65535' >> /etc/sysctl.conf
echo 'fs.file-max = 100000' >> /etc/sysctl.conf
sysctl -p

# Docker优化
echo '{"log-driver":"json-file","log-opts":{"max-size":"10m","max-file":"3"}}' > /etc/docker/daemon.json
systemctl restart docker
```

## 🛡️ 灾难恢复

### 1. 备份策略

- **日备份**: 每日凌晨2点自动备份
- **异地存储**: S3存储备份副本
- **保留策略**: 本地保留30天，云端保留90天
- **测试恢复**: 每月测试备份恢复

### 2. 故障切换

```bash
# 主服务器故障时的快速切换
# 1. 在备用服务器上
git pull origin main
cp .env.production.backup .env.production

# 2. 从S3恢复最新备份
aws s3 cp s3://backup-bucket/bonus-system/latest.tar.gz ./
tar -xzf latest.tar.gz

# 3. 启动服务
./scripts/deploy-production.sh --no-backup

# 4. 更新DNS指向新服务器
```

### 3. 数据一致性验证

```bash
# 备份后验证数据完整性
./scripts/verify-backup-integrity.sh

# 恢复后验证业务功能
./scripts/business-function-test.sh
```

## 📞 联系与支持

### 技术支持

- **监控告警**: 集成Slack/邮件通知
- **日志分析**: ELK Stack或云日志服务
- **性能监控**: Prometheus + Grafana
- **错误追踪**: 应用性能监控(APM)

### 维护计划

- **安全更新**: 每月第一周
- **功能更新**: 按需发布
- **性能优化**: 季度评估
- **备份测试**: 每月验证

---

## 🎯 核心业务流程验证

部署完成后，请验证以下核心业务功能：

### 1. 奖金查看流程
```bash
# 登录系统
curl -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 查看个人奖金
curl -X GET "$BACKEND_URL/api/personal-bonus" \
  -H "Authorization: Bearer $TOKEN"

# 查看历史趋势
curl -X GET "$BACKEND_URL/api/reports/personal-bonus-trend" \
  -H "Authorization: Bearer $TOKEN"
```

### 2. 项目申请流程
```bash
# 查看可申请项目
curl -X GET "$BACKEND_URL/api/projects/available" \
  -H "Authorization: Bearer $TOKEN"

# 提交项目申请
curl -X POST "$BACKEND_URL/api/project-collaboration/apply" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"projectId":1,"roleId":1,"reason":"申请理由"}'

# 查看申请状态
curl -X GET "$BACKEND_URL/api/project-collaboration/my-applications" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. 岗位晋升查看流程
```bash
# 查看岗位要求
curl -X GET "$BACKEND_URL/api/position-requirements" \
  -H "Authorization: Bearer $TOKEN"

# 查看个人能力评估
curl -X GET "$BACKEND_URL/api/position-requirements/assessment" \
  -H "Authorization: Bearer $TOKEN"

# 查看晋升建议
curl -X GET "$BACKEND_URL/api/position-requirements/promotion-suggestions" \
  -H "Authorization: Bearer $TOKEN"
```

**系统部署成功后，用户可以通过以下URL访问：**

- **前端界面**: `https://your-domain.com`
- **API文档**: `https://your-domain.com/api/docs`
- **监控面板**: `https://your-domain.com:3000` (Grafana)

**祝您部署成功！** 🎉