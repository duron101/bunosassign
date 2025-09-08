# 🏭 奖金模拟系统生产环境部署指南

## 📋 **部署概述**

本指南详细说明如何使用**优化版混合服务器方案**部署奖金模拟系统到生产环境。

### 🎯 **适用场景**
- ✅ 生产环境部署
- ✅ 用户量 ≤ 100人
- ✅ 中小型企业使用
- ✅ 需要稳定性和可维护性

### 🏗️ **架构特点**
- **单进程服务**：前端静态文件 + 后端API
- **PM2进程管理**：自动重启、负载均衡、监控
- **端口统一**：所有服务运行在3000端口
- **运维友好**：自动化脚本、健康检查、备份

## 🚀 **快速部署**

### **方式一：一键部署脚本（推荐）**

#### Windows用户
```bash
# 1. 给脚本执行权限
scripts\prod-start.bat

# 2. 或直接双击运行
scripts\prod-start.bat
```

#### Linux/Mac用户
```bash
# 1. 给脚本执行权限
chmod +x scripts/prod-start.sh

# 2. 运行部署脚本
./scripts/prod-start.sh
```

### **方式二：手动部署**

```bash
# 1. 安装PM2
npm install -g pm2

# 2. 安装项目依赖
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# 3. 构建前端
cd frontend && npm run build && cd ..

# 4. 启动生产服务
pm2 start ecosystem.config.js --env production

# 5. 保存配置
pm2 save

# 6. 设置开机自启
pm2 startup
```

## 🔧 **生产环境配置**

### **PM2配置文件 (ecosystem.config.js)**

```javascript
module.exports = {
  apps: [{
    name: 'bonus-system',
    script: 'simple-server.js',
    instances: 2,                    // 多实例负载均衡
    exec_mode: 'cluster',            // 集群模式
    max_memory_restart: '500M',      // 内存超限自动重启
    restart_delay: 4000,             // 重启延迟
    max_restarts: 10,                // 最大重启次数
    min_uptime: '10s',              // 最小运行时间
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

### **环境变量配置 (.env)**

```bash
# 生产环境配置
NODE_ENV=production
PORT=3000

# 数据库配置（如使用MySQL）
DB_HOST=localhost
DB_PORT=3306
DB_NAME=bonus_system
DB_USER=root
DB_PASSWORD=your_secure_password

# JWT密钥（生产环境必须修改）
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-here

# 文件上传限制
MAX_FILE_SIZE=10MB

# 系统配置
SYSTEM_NAME=奖金模拟系统
SYSTEM_VERSION=1.0.0
```

## 📊 **运维管理**

### **日常管理命令**

#### **使用管理脚本（推荐）**

```bash
# Linux/Mac
./scripts/prod-manage.sh [命令]

# Windows
scripts\prod-manage.bat [命令]
```

#### **直接使用PM2命令**

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs bonus-system

# 重启服务
pm2 restart bonus-system

# 停止服务
pm2 stop bonus-system

# 启动服务
pm2 start bonus-system

# 删除服务
pm2 delete bonus-system
```

### **管理脚本功能**

| 命令 | 功能 | 说明 |
|------|------|------|
| `start` | 启动服务 | 启动或重启生产服务 |
| `stop` | 停止服务 | 停止生产服务 |
| `restart` | 重启服务 | 重启生产服务 |
| `status` | 查看状态 | 显示服务状态和资源使用 |
| `logs` | 查看日志 | 显示服务运行日志 |
| `monitor` | 监控面板 | 启动PM2 Web监控界面 |
| `update` | 更新应用 | 拉取代码、重新构建、重启服务 |
| `backup` | 备份数据 | 备份数据库、日志、构建文件 |
| `health` | 健康检查 | 检查服务状态、端口、API响应 |

## 🔍 **监控和日志**

### **PM2监控面板**

```bash
# 启动监控面板
pm2 web

# 访问地址
http://localhost:9615
```

### **日志管理**

```bash
# 查看实时日志
pm2 logs bonus-system

# 查看历史日志
pm2 logs bonus-system --lines 1000

# 清空日志
pm2 flush

# 日志轮转配置
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### **健康检查**

```bash
# 手动健康检查
./scripts/prod-manage.sh health

# 健康检查内容
✅ 服务状态检查
✅ 端口监听检查
✅ API响应检查
✅ 磁盘空间检查
✅ 内存使用检查
```

## 🛡️ **安全配置**

### **生产环境安全措施**

1. **修改默认密码**
   - 登录系统后立即修改admin密码
   - 使用强密码策略

2. **JWT密钥安全**
   - 修改默认JWT密钥
   - 使用足够长度的随机密钥

3. **网络访问控制**
   - 配置防火墙规则
   - 限制访问IP范围

4. **HTTPS配置**
   - 配置SSL证书
   - 强制HTTPS访问

### **防火墙配置示例**

```bash
# Ubuntu/Debian
sudo ufw allow 3000/tcp
sudo ufw allow 22/tcp
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --reload
```

## 📈 **性能优化**

### **PM2性能配置**

```javascript
// 优化后的ecosystem.config.js
module.exports = {
  apps: [{
    name: 'bonus-system',
    script: 'simple-server.js',
    instances: 'max',                 // 使用所有CPU核心
    exec_mode: 'cluster',             // 集群模式
    max_memory_restart: '1G',         // 内存限制
    node_args: '--max-old-space-size=1024', // Node.js内存限制
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

### **系统优化建议**

1. **增加系统限制**
   ```bash
   # 增加文件描述符限制
   ulimit -n 65536
   
   # 增加进程限制
   ulimit -u 4096
   ```

2. **数据库优化**
   - 配置适当的连接池大小
   - 优化查询语句
   - 添加必要的索引

3. **缓存策略**
   - 启用Redis缓存（可选）
   - 配置静态资源缓存
   - 实现API响应缓存

## 🔄 **更新和部署**

### **应用更新流程**

```bash
# 1. 备份当前版本
./scripts/prod-manage.sh backup

# 2. 更新应用代码
./scripts/prod-manage.sh update

# 3. 验证更新结果
./scripts/prod-manage.sh health
```

### **回滚策略**

```bash
# 1. 停止当前服务
pm2 stop bonus-system

# 2. 恢复备份版本
cp -r frontend/dist.backup.[时间戳] frontend/dist

# 3. 重启服务
pm2 start bonus-system
```

## 📋 **部署检查清单**

### **部署前检查**

- [ ] Node.js版本 ≥ 16.0.0
- [ ] PM2已安装
- [ ] 端口3000未被占用
- [ ] 环境变量配置正确
- [ ] 数据库配置正确
- [ ] 前端构建成功

### **部署后验证**

- [ ] 服务正常启动
- [ ] 端口3000正常监听
- [ ] 前端页面正常访问
- [ ] API接口正常响应
- [ ] 登录功能正常
- [ ] 健康检查通过

### **生产环境验证**

- [ ] 系统功能完整测试
- [ ] 性能压力测试
- [ ] 安全漏洞扫描
- [ ] 备份功能验证
- [ ] 监控告警配置
- [ ] 运维文档完善

## 🚨 **故障排除**

### **常见问题及解决方案**

#### **1. 服务启动失败**

```bash
# 检查错误日志
pm2 logs bonus-system --err

# 检查端口占用
netstat -tulpn | grep :3000

# 检查文件权限
ls -la simple-server.js
```

#### **2. 内存不足**

```bash
# 检查内存使用
pm2 monit

# 调整内存限制
pm2 restart bonus-system --max-memory-restart 2G
```

#### **3. 端口冲突**

```bash
# 查找占用进程
lsof -i :3000

# 停止冲突进程
kill -9 <PID>

# 或使用Windows
netstat -ano | findstr :3000
taskkill /F /PID <PID>
```

#### **4. 前端页面无法访问**

```bash
# 检查前端构建
ls -la frontend/dist

# 重新构建前端
cd frontend && npm run build && cd ..

# 重启服务
pm2 restart bonus-system
```

## 📞 **技术支持**

### **获取帮助**

1. **查看日志**：`pm2 logs bonus-system`
2. **健康检查**：`./scripts/prod-manage.sh health`
3. **系统状态**：`./scripts/prod-manage.sh status`
4. **监控面板**：`./scripts/prod-manage.sh monitor`

### **联系信息**

- **项目维护**: 开发团队
- **技术支持**: support@company.com
- **问题反馈**: https://github.com/company/bonus-system/issues

---

## 🎯 **部署成功标志**

✅ **服务状态**: PM2显示服务为 `online` 状态  
✅ **端口监听**: 3000端口正常监听  
✅ **页面访问**: http://localhost:3000 正常显示  
✅ **API响应**: `/api/health` 接口正常响应  
✅ **功能测试**: 登录、员工管理等功能正常  
✅ **性能指标**: 响应时间 < 2秒，内存使用 < 1GB  

**恭喜！你的奖金模拟系统已成功部署到生产环境！** 🎉
