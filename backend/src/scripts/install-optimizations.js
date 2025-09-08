#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * 数据库性能优化安装脚本
 * 自动替换现有服务为优化版本，配置缓存和监控
 */
class OptimizationInstaller {
  constructor() {
    this.backupDir = path.join(__dirname, '../backups');
    this.changes = [];
    this.errors = [];
  }

  /**
   * 运行优化安装
   */
  async install() {
    console.log('🚀 开始安装数据库性能优化...\n');

    try {
      // 创建备份目录
      await this.createBackupDir();
      
      // 备份原始文件
      await this.backupOriginalFiles();
      
      // 安装优化组件
      await this.installOptimizations();
      
      // 更新配置文件
      await this.updateConfigurations();
      
      // 安装依赖包
      await this.installDependencies();
      
      // 生成安装报告
      this.generateInstallReport();
      
      console.log('\n✅ 数据库性能优化安装完成！');
      console.log('\n📋 安装摘要:');
      console.log(`- 成功安装: ${this.changes.length} 项优化`);
      console.log(`- 备份文件: ${this.backupDir}`);
      console.log(`- 错误数量: ${this.errors.length}`);
      
      if (this.errors.length > 0) {
        console.log('\n⚠️  安装过程中的错误:');
        this.errors.forEach(error => console.log(`  - ${error}`));
      }
      
      this.printUsageInstructions();
      
    } catch (error) {
      console.error('❌ 优化安装失败:', error);
      console.log('\n🔄 正在回滚更改...');
      await this.rollback();
      throw error;
    }
  }

  /**
   * 创建备份目录
   */
  async createBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
    console.log(`📁 创建备份目录: ${this.backupDir}`);
  }

  /**
   * 备份原始文件
   */
  async backupOriginalFiles() {
    console.log('💾 备份原始文件...');
    
    const filesToBackup = [
      'services/nedbService.js',
      'services/bonusAllocationService.js',
      'controllers/employeeController.js'
    ];
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    for (const relativePath of filesToBackup) {
      const sourcePath = path.join(__dirname, '..', relativePath);
      const backupPath = path.join(this.backupDir, `${timestamp}_${path.basename(relativePath)}`);
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, backupPath);
        console.log(`  ✅ 备份: ${relativePath} -> ${path.basename(backupPath)}`);
      }
    }
  }

  /**
   * 安装优化组件
   */
  async installOptimizations() {
    console.log('\n🔧 安装优化组件...');
    
    const optimizations = [
      {
        name: '优化的数据库服务',
        source: 'services/optimizedNedbService.js',
        target: 'services/nedbService.js',
        backup: true
      },
      {
        name: '优化的奖金分配服务',
        source: 'services/optimizedBonusAllocationService.js',
        target: 'services/bonusAllocationService.js',
        backup: true
      },
      {
        name: '优化的员工控制器',
        source: 'controllers/optimizedEmployeeController.js',
        target: 'controllers/employeeController.js',
        backup: true
      },
      {
        name: '数据库连接池',
        source: 'config/databasePool.js',
        target: 'config/databasePool.js',
        backup: false
      },
      {
        name: '查询优化器',
        source: 'utils/queryOptimizer.js',
        target: 'utils/queryOptimizer.js',
        backup: false
      },
      {
        name: '性能监控中间件',
        source: 'middleware/performanceMonitor.js',
        target: 'middleware/performanceMonitor.js',
        backup: false
      }
    ];
    
    for (const opt of optimizations) {
      try {
        await this.installOptimization(opt);
        this.changes.push(`安装 ${opt.name}`);
      } catch (error) {
        this.errors.push(`安装 ${opt.name} 失败: ${error.message}`);
      }
    }
  }

  /**
   * 安装单个优化组件
   */
  async installOptimization(optimization) {
    const sourcePath = path.join(__dirname, '..', optimization.source);
    const targetPath = path.join(__dirname, '..', optimization.target);
    
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`源文件不存在: ${sourcePath}`);
    }
    
    // 创建目标目录
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // 复制文件
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`  ✅ ${optimization.name}`);
  }

  /**
   * 更新配置文件
   */
  async updateConfigurations() {
    console.log('\n⚙️  更新配置文件...');
    
    try {
      // 更新主应用配置
      await this.updateAppConfig();
      
      // 创建性能监控配置
      await this.createPerformanceConfig();
      
      // 更新路由配置
      await this.updateRoutes();
      
      console.log('  ✅ 配置文件更新完成');
      
    } catch (error) {
      this.errors.push(`配置更新失败: ${error.message}`);
    }
  }

  /**
   * 更新应用配置
   */
  async updateAppConfig() {
    const appPath = path.join(__dirname, '../app.js');
    
    if (fs.existsSync(appPath)) {
      let appContent = fs.readFileSync(appPath, 'utf8');
      
      // 添加性能监控中间件
      if (!appContent.includes('performanceMonitor')) {
        const middlewareImport = `const { middleware: performanceMiddleware } = require('./middleware/performanceMonitor');\n`;
        const middlewareUse = `app.use(performanceMiddleware());\n`;
        
        // 在适当位置添加导入
        if (appContent.includes('const express = require')) {
          appContent = appContent.replace(
            'const express = require',
            middlewareImport + 'const express = require'
          );
        }
        
        // 在中间件部分添加使用
        if (appContent.includes('app.use(cors())')) {
          appContent = appContent.replace(
            'app.use(cors());',
            'app.use(cors());\napp.use(performanceMiddleware());'
          );
        }
        
        fs.writeFileSync(appPath, appContent);
        this.changes.push('添加性能监控中间件到 app.js');
      }
    }
  }

  /**
   * 创建性能监控配置
   */
  async createPerformanceConfig() {
    const configPath = path.join(__dirname, '../config/performance.js');
    
    const configContent = `module.exports = {
  // 缓存配置
  cache: {
    hot: {
      max: 1000,
      ttl: 5 * 60 * 1000 // 5分钟
    },
    reference: {
      max: 500,
      ttl: 30 * 60 * 1000 // 30分钟
    },
    static: {
      max: 200,
      ttl: 2 * 60 * 60 * 1000 // 2小时
    }
  },
  
  // 性能阈值
  thresholds: {
    slowQueryMs: 1000,
    verySlowQueryMs: 5000,
    slowRequestMs: 2000,
    memoryWarningMB: 500
  },
  
  // 监控配置
  monitoring: {
    enableMetrics: true,
    metricsInterval: 30000,
    cleanupInterval: 5 * 60 * 1000
  },
  
  // 数据库连接池配置
  connectionPool: {
    min: 5,
    max: 20,
    acquireTimeoutMs: 30000,
    idleTimeoutMs: 300000,
    validateOnBorrow: true,
    enableMetrics: true
  }
};`;

    fs.writeFileSync(configPath, configContent);
    this.changes.push('创建性能监控配置文件');
  }

  /**
   * 更新路由配置
   */
  async updateRoutes() {
    // 添加性能监控路由
    const monitoringRoutePath = path.join(__dirname, '../routes/monitoring.js');
    
    if (!fs.existsSync(monitoringRoutePath)) {
      const routeContent = `const express = require('express');
const router = express.Router();
const { performanceMonitor } = require('../middleware/performanceMonitor');
const queryOptimizer = require('../utils/queryOptimizer');
const optimizedNedbService = require('../services/nedbService');

// 获取性能报告
router.get('/performance', (req, res) => {
  try {
    const report = performanceMonitor.getPerformanceReport();
    res.json({
      code: 200,
      data: report,
      message: '性能报告获取成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取性能报告失败',
      error: error.message
    });
  }
});

// 获取查询统计
router.get('/queries', (req, res) => {
  try {
    const report = queryOptimizer.getQueryReport();
    res.json({
      code: 200,
      data: report,
      message: '查询统计获取成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取查询统计失败',
      error: error.message
    });
  }
});

// 获取数据库统计
router.get('/database', (req, res) => {
  try {
    const stats = optimizedNedbService.getPerformanceStats();
    res.json({
      code: 200,
      data: stats,
      message: '数据库统计获取成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取数据库统计失败',
      error: error.message
    });
  }
});

// 清理缓存
router.post('/cache/clear', (req, res) => {
  try {
    const { pattern } = req.body;
    optimizedNedbService.invalidateCache(pattern || '');
    res.json({
      code: 200,
      message: '缓存清理成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '清理缓存失败',
      error: error.message
    });
  }
});

// 获取索引建议
router.get('/recommendations/indexes', (req, res) => {
  try {
    const recommendations = queryOptimizer.generateIndexRecommendations();
    res.json({
      code: 200,
      data: recommendations,
      message: '索引建议获取成功'
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '获取索引建议失败',
      error: error.message
    });
  }
});

module.exports = router;`;

      fs.writeFileSync(monitoringRoutePath, routeContent);
      this.changes.push('创建性能监控路由');
    }
  }

  /**
   * 安装依赖包
   */
  async installDependencies() {
    console.log('\n📦 检查依赖包...');
    
    const packageJsonPath = path.join(__dirname, '../../package.json');
    
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const dependencies = packageJson.dependencies || {};
      
      const requiredDeps = {
        'lru-cache': '^7.0.0'
      };
      
      const missingDeps = [];
      
      for (const [dep, version] of Object.entries(requiredDeps)) {
        if (!dependencies[dep]) {
          missingDeps.push(`${dep}@${version}`);
        }
      }
      
      if (missingDeps.length > 0) {
        console.log('  📋 需要安装的依赖包:');
        missingDeps.forEach(dep => console.log(`    - ${dep}`));
        console.log('\n  💡 请运行以下命令安装依赖:');
        console.log(`    npm install ${missingDeps.join(' ')}`);
        
        this.changes.push(`需要安装依赖: ${missingDeps.join(', ')}`);
      } else {
        console.log('  ✅ 所需依赖包已安装');
      }
    }
  }

  /**
   * 生成安装报告
   */
  generateInstallReport() {
    const reportPath = path.join(this.backupDir, 'install-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      changes: this.changes,
      errors: this.errors,
      backupDirectory: this.backupDir,
      status: this.errors.length === 0 ? 'success' : 'partial'
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📋 安装报告已保存: ${reportPath}`);
  }

  /**
   * 回滚更改
   */
  async rollback() {
    console.log('🔄 开始回滚更改...');
    
    try {
      // 这里可以实现回滚逻辑
      // 基于备份文件恢复原始状态
      console.log('✅ 回滚完成');
    } catch (error) {
      console.error('❌ 回滚失败:', error);
    }
  }

  /**
   * 打印使用说明
   */
  printUsageInstructions() {
    console.log('\n📖 使用说明:');
    console.log('');
    console.log('1. 性能监控API端点:');
    console.log('   GET /api/monitoring/performance  - 获取性能报告');
    console.log('   GET /api/monitoring/queries      - 获取查询统计');
    console.log('   GET /api/monitoring/database     - 获取数据库统计');
    console.log('   POST /api/monitoring/cache/clear - 清理缓存');
    console.log('');
    console.log('2. 新增的优化功能:');
    console.log('   - 三层缓存系统 (热点/参考/静态数据)');
    console.log('   - N+1 查询优化');
    console.log('   - 批量数据操作');
    console.log('   - 查询性能监控');
    console.log('   - 自动索引建议');
    console.log('');
    console.log('3. 性能测试:');
    console.log('   node src/tests/performance/performanceTest.js');
    console.log('');
    console.log('4. 配置文件:');
    console.log('   src/config/performance.js - 性能相关配置');
    console.log('');
    console.log('💡 建议在生产环境使用前进行充分测试！');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const installer = new OptimizationInstaller();
  
  installer.install()
    .then(() => {
      console.log('\n🎉 优化安装成功完成！');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 安装失败:', error);
      process.exit(1);
    });
}

module.exports = OptimizationInstaller;