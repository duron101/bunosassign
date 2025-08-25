const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./backend/src/utils/logger');
const { sequelize } = require('./backend/src/config/database');
const errorHandler = require('./backend/src/middlewares/error');

// 导入路由
const authRoutes = require('./backend/src/routes/auth');
const userRoutes = require('./backend/src/routes/user');
const roleRoutes = require('./backend/src/routes/roles');
const employeeRoutes = require('./backend/src/routes/employee');
const departmentRoutes = require('./backend/src/routes/departments');
const positionRoutes = require('./backend/src/routes/positions');
const businessLineRoutes = require('./backend/src/routes/businessLines');
const projectRoutes = require('./backend/src/routes/projects');
const projectCostRoutes = require('./backend/src/routes/projectCosts');
const calculationRoutes = require('./backend/src/routes/calculation');
const simulationRoutes = require('./backend/src/routes/simulation');
const profitRoutes = require('./backend/src/routes/profitRoutes');
const positionValueRoutes = require('./backend/src/routes/positionValueRoutes');
const performanceRoutes = require('./backend/src/routes/performanceRoutes');
const threeDimensionalRoutes = require('./backend/src/routes/threeDimensionalRoutes');
const bonusAllocationRoutes = require('./backend/src/routes/bonusAllocationRoutes');
const dataImportExportRoutes = require('./backend/src/routes/dataImportExportRoutes');

const app = express();
const PORT = process.env.PORT || 8080;

// 中间件配置
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: '*',
  credentials: true
}));

// 限流配置
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// API路由配置
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/business-lines', businessLineRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/project-costs', projectCostRoutes);
app.use('/api/calculations', calculationRoutes);
app.use('/api/simulations', simulationRoutes);
app.use('/api/profit', profitRoutes);
app.use('/api/position-value', positionValueRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/three-dimensional', threeDimensionalRoutes);
app.use('/api/bonus-allocation', bonusAllocationRoutes);
app.use('/api/data', dataImportExportRoutes);

// 静态文件服务 (Vue frontend)
app.use(express.static(path.join(__dirname, 'dist')));

// Swagger API文档
if (process.env.NODE_ENV !== 'production') {
  const swaggerUi = require('swagger-ui-express');
  const swaggerSpec = require('./backend/src/docs/swagger');
  
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log('Swagger文档已启用: http://localhost:' + PORT + '/api/docs');
}

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Vue SPA fallback - 所有非API路由都返回index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// 数据库连接和服务启动
async function startServer() {
  try {
    // 测试数据库连接 (使用环境变量或默认SQLite)
    if (process.env.DB_HOST) {
      await sequelize.authenticate();
      console.log('数据库连接成功');
      
      // 同步数据库模型
      await sequelize.sync({ alter: true });
      console.log('数据库模型同步完成');
    } else {
      console.log('使用默认数据库配置');
    }
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
      console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
    });
    
  } catch (error) {
    console.error('服务启动失败:', error);
    // 不退出进程，允许服务器在没有数据库的情况下运行
  }
}

startServer();

module.exports = app;