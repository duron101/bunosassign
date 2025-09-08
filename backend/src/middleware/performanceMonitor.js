const queryOptimizer = require('../utils/queryOptimizer');
const logger = require('../utils/logger');

/**
 * 性能监控中间件
 * 监控API请求性能，记录慢请求，提供性能分析
 */
class PerformanceMonitor {
  constructor() {
    this.requestStats = new Map();
    this.slowRequests = [];
    this.activeRequests = new Map();
    
    // 性能阈值配置
    this.thresholds = {
      slowRequestMs: 2000,      // 慢请求阈值
      verySlowRequestMs: 10000, // 超慢请求阈值
      maxSlowRequests: 500,     // 最大慢请求记录数
      memoryWarningMB: 500,     // 内存警告阈值
      cpuWarningPercent: 80     // CPU警告阈值
    };
    
    // 启动系统监控
    this.startSystemMonitoring();
  }

  /**
   * 创建性能监控中间件
   */
  middleware() {
    return (req, res, next) => {
      const requestId = this._generateRequestId();
      const startTime = Date.now();
      const startMemory = process.memoryUsage();
      
      // 记录请求开始
      this.activeRequests.set(requestId, {
        method: req.method,
        url: req.originalUrl || req.url,
        startTime,
        startMemory,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress
      });

      // 添加请求ID到响应头
      res.setHeader('X-Request-ID', requestId);
      
      // 拦截响应结束事件
      const originalSend = res.send;
      res.send = (body) => {
        const endTime = Date.now();
        const endMemory = process.memoryUsage();
        const duration = endTime - startTime;
        
        // 记录请求完成
        this._recordRequest(requestId, req, res, duration, startMemory, endMemory, body);
        
        // 移除活跃请求记录
        this.activeRequests.delete(requestId);
        
        // 调用原始send方法
        return originalSend.call(res, body);
      };
      
      // 处理请求错误
      const originalNextError = next;
      const wrappedNext = (error) => {
        if (error) {
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          this._recordError(requestId, req, error, duration);
          this.activeRequests.delete(requestId);
        }
        return originalNextError(error);
      };
      
      next = wrappedNext;
      next();
    };
  }

  /**
   * 生成请求ID
   */
  _generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 记录请求信息
   */
  _recordRequest(requestId, req, res, duration, startMemory, endMemory, body) {
    const requestInfo = this.activeRequests.get(requestId);
    if (!requestInfo) return;

    const method = req.method;
    const url = req.originalUrl || req.url;
    const statusCode = res.statusCode;
    const contentLength = Buffer.isBuffer(body) ? body.length : 
                         typeof body === 'string' ? Buffer.byteLength(body, 'utf8') : 0;
    
    // 计算内存使用变化
    const memoryDelta = {
      rss: endMemory.rss - startMemory.rss,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
      external: endMemory.external - startMemory.external
    };

    const requestData = {
      requestId,
      method,
      url,
      statusCode,
      duration,
      contentLength,
      timestamp: new Date(requestInfo.startTime),
      userAgent: requestInfo.userAgent,
      ip: requestInfo.ip,
      memoryUsage: memoryDelta,
      performance: {
        responseTime: duration,
        throughput: contentLength / duration * 1000, // bytes per second
        memoryEfficiency: Math.abs(memoryDelta.heapUsed) / duration
      }
    };

    // 更新统计信息
    this._updateRequestStats(method, url, duration, statusCode);

    // 检查是否为慢请求
    if (duration > this.thresholds.slowRequestMs) {
      this._recordSlowRequest(requestData);
    }

    // 记录详细日志
    this._logRequest(requestData);
  }

  /**
   * 记录请求错误
   */
  _recordError(requestId, req, error, duration) {
    const errorData = {
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      duration,
      timestamp: new Date()
    };

    logger.error('❌ 请求处理错误:', errorData);
    
    // 更新错误统计
    this._updateErrorStats(req.method, req.originalUrl || req.url, error);
  }

  /**
   * 更新请求统计
   */
  _updateRequestStats(method, url, duration, statusCode) {
    const key = `${method}:${this._normalizeUrl(url)}`;
    
    if (!this.requestStats.has(key)) {
      this.requestStats.set(key, {
        method,
        url: this._normalizeUrl(url),
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        minDuration: Number.MAX_VALUE,
        maxDuration: 0,
        statusCodes: new Map(),
        errors: 0,
        lastRequestTime: null
      });
    }

    const stats = this.requestStats.get(key);
    stats.count++;
    stats.totalDuration += duration;
    stats.avgDuration = stats.totalDuration / stats.count;
    stats.minDuration = Math.min(stats.minDuration, duration);
    stats.maxDuration = Math.max(stats.maxDuration, duration);
    stats.lastRequestTime = new Date();

    // 状态码统计
    const statusKey = Math.floor(statusCode / 100) * 100; // 200, 300, 400, 500
    const currentCount = stats.statusCodes.get(statusKey) || 0;
    stats.statusCodes.set(statusKey, currentCount + 1);
  }

  /**
   * 更新错误统计
   */
  _updateErrorStats(method, url, error) {
    const key = `${method}:${this._normalizeUrl(url)}`;
    const stats = this.requestStats.get(key);
    
    if (stats) {
      stats.errors++;
    }
  }

  /**
   * 标准化URL（移除参数和动态部分）
   */
  _normalizeUrl(url) {
    return url
      .split('?')[0]  // 移除查询参数
      .replace(/\/\d+/g, '/:id')  // 替换数字ID
      .replace(/\/[a-f0-9-]{36}/g, '/:uuid')  // 替换UUID
      .replace(/\/[a-f0-9]{24}/g, '/:objectid'); // 替换ObjectId
  }

  /**
   * 记录慢请求
   */
  _recordSlowRequest(requestData) {
    requestData.severity = requestData.duration > this.thresholds.verySlowRequestMs ? 'critical' : 'warning';
    
    this.slowRequests.push(requestData);

    // 保持慢请求记录在合理范围内
    if (this.slowRequests.length > this.thresholds.maxSlowRequests) {
      this.slowRequests = this.slowRequests.slice(-this.thresholds.maxSlowRequests);
    }

    logger.warn(`🐌 慢请求检测:`, {
      method: requestData.method,
      url: requestData.url,
      duration: `${requestData.duration}ms`,
      statusCode: requestData.statusCode,
      contentLength: requestData.contentLength,
      severity: requestData.severity
    });
  }

  /**
   * 记录请求日志
   */
  _logRequest(requestData) {
    const logLevel = this._getLogLevel(requestData);
    const logMessage = `${requestData.method} ${requestData.url} ${requestData.statusCode} ${requestData.duration}ms`;
    
    const logData = {
      requestId: requestData.requestId,
      method: requestData.method,
      url: requestData.url,
      statusCode: requestData.statusCode,
      duration: `${requestData.duration}ms`,
      contentLength: requestData.contentLength,
      ip: requestData.ip
    };

    if (logLevel === 'error') {
      logger.error(logMessage, logData);
    } else if (logLevel === 'warn') {
      logger.warn(logMessage, logData);
    } else if (logLevel === 'info') {
      logger.info(logMessage, logData);
    } else {
      logger.debug(logMessage, logData);
    }
  }

  /**
   * 获取日志级别
   */
  _getLogLevel(requestData) {
    if (requestData.statusCode >= 500) return 'error';
    if (requestData.statusCode >= 400) return 'warn';
    if (requestData.duration > this.thresholds.slowRequestMs) return 'warn';
    if (requestData.statusCode >= 300) return 'info';
    return 'debug';
  }

  /**
   * 启动系统监控
   */
  startSystemMonitoring() {
    // 每30秒检查一次系统性能
    this.systemMonitorInterval = setInterval(() => {
      this._checkSystemPerformance();
    }, 30000);

    // 每5分钟清理旧数据
    this.cleanupInterval = setInterval(() => {
      this._cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * 检查系统性能
   */
  _checkSystemPerformance() {
    const memoryUsage = process.memoryUsage();
    const memoryUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    
    // 检查内存使用
    if (memoryUsedMB > this.thresholds.memoryWarningMB) {
      logger.warn(`⚠️ 高内存使用警告: ${memoryUsedMB.toFixed(2)}MB`, {
        rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)}MB`,
        heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
        external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)}MB`
      });
    }

    // 检查活跃请求数
    const activeRequestCount = this.activeRequests.size;
    if (activeRequestCount > 100) {
      logger.warn(`⚠️ 高并发请求警告: ${activeRequestCount} 个活跃请求`);
    }

    // 记录系统状态
    logger.debug('📊 系统性能状态:', {
      memory: `${memoryUsedMB.toFixed(2)}MB`,
      activeRequests: activeRequestCount,
      totalRequests: Array.from(this.requestStats.values()).reduce((sum, stat) => sum + stat.count, 0),
      slowRequests: this.slowRequests.length
    });
  }

  /**
   * 清理旧数据
   */
  _cleanup() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24小时前
    
    // 清理慢请求记录
    this.slowRequests = this.slowRequests.filter(req => 
      req.timestamp > cutoff
    );

    // 清理不活跃的请求统计
    for (const [key, stats] of this.requestStats.entries()) {
      if (stats.lastRequestTime && stats.lastRequestTime < cutoff && stats.count < 10) {
        this.requestStats.delete(key);
      }
    }

    logger.debug('🧹 性能监控数据清理完成');
  }

  /**
   * 获取性能报告
   */
  getPerformanceReport() {
    const systemMemory = process.memoryUsage();
    const totalRequests = Array.from(this.requestStats.values()).reduce((sum, stat) => sum + stat.count, 0);
    
    return {
      summary: {
        totalRequests,
        slowRequests: this.slowRequests.length,
        activeRequests: this.activeRequests.size,
        uniqueEndpoints: this.requestStats.size,
        systemMemory: {
          rss: Math.round(systemMemory.rss / 1024 / 1024),
          heapUsed: Math.round(systemMemory.heapUsed / 1024 / 1024),
          heapTotal: Math.round(systemMemory.heapTotal / 1024 / 1024)
        },
        reportGeneratedAt: new Date()
      },
      slowRequests: this.getSlowRequests(),
      topEndpoints: this.getTopEndpoints(),
      errorAnalysis: this.getErrorAnalysis(),
      performanceMetrics: this.getPerformanceMetrics(),
      recommendations: this.getPerformanceRecommendations()
    };
  }

  /**
   * 获取慢请求列表
   */
  getSlowRequests(limit = 10) {
    return this.slowRequests
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
      .map(req => ({
        method: req.method,
        url: req.url,
        duration: req.duration,
        statusCode: req.statusCode,
        timestamp: req.timestamp,
        severity: req.severity,
        memoryImpact: req.memoryUsage?.heapUsed || 0
      }));
  }

  /**
   * 获取热门端点
   */
  getTopEndpoints(limit = 10) {
    return Array.from(this.requestStats.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(stat => ({
        method: stat.method,
        url: stat.url,
        count: stat.count,
        avgDuration: Math.round(stat.avgDuration),
        minDuration: stat.minDuration === Number.MAX_VALUE ? 0 : stat.minDuration,
        maxDuration: stat.maxDuration,
        errorRate: stat.errors / stat.count,
        lastRequestTime: stat.lastRequestTime
      }));
  }

  /**
   * 获取错误分析
   */
  getErrorAnalysis() {
    const errorStats = new Map();
    let totalErrors = 0;

    this.requestStats.forEach(stat => {
      if (stat.errors > 0) {
        totalErrors += stat.errors;
        const key = `${stat.method} ${stat.url}`;
        errorStats.set(key, {
          endpoint: key,
          errors: stat.errors,
          totalRequests: stat.count,
          errorRate: (stat.errors / stat.count * 100).toFixed(2) + '%'
        });
      }
    });

    return {
      totalErrors,
      errorsByEndpoint: Array.from(errorStats.values())
        .sort((a, b) => b.errors - a.errors)
        .slice(0, 10)
    };
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics() {
    const stats = Array.from(this.requestStats.values());
    const totalRequests = stats.reduce((sum, stat) => sum + stat.count, 0);
    const totalDuration = stats.reduce((sum, stat) => sum + stat.totalDuration, 0);
    
    return {
      avgResponseTime: totalRequests > 0 ? Math.round(totalDuration / totalRequests) : 0,
      requestThroughput: this._calculateThroughput(),
      slowRequestRate: (this.slowRequests.length / totalRequests * 100).toFixed(2) + '%',
      p95ResponseTime: this._calculatePercentile(95),
      p99ResponseTime: this._calculatePercentile(99),
      memoryTrend: this._getMemoryTrend()
    };
  }

  /**
   * 计算请求吞吐量
   */
  _calculateThroughput() {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    
    const recentRequests = this.slowRequests.filter(req => 
      req.timestamp.getTime() > oneHourAgo
    );
    
    return Math.round(recentRequests.length / 60); // 每分钟请求数
  }

  /**
   * 计算响应时间百分位数
   */
  _calculatePercentile(percentile) {
    const durations = this.slowRequests
      .map(req => req.duration)
      .sort((a, b) => a - b);
    
    if (durations.length === 0) return 0;
    
    const index = Math.floor((percentile / 100) * durations.length);
    return durations[index] || 0;
  }

  /**
   * 获取内存使用趋势
   */
  _getMemoryTrend() {
    const memoryUsage = process.memoryUsage();
    return {
      current: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
      utilizationRate: (memoryUsage.heapUsed / memoryUsage.heapTotal * 100).toFixed(1) + '%'
    };
  }

  /**
   * 获取性能优化建议
   */
  getPerformanceRecommendations() {
    const recommendations = [];
    
    // 检查慢请求
    if (this.slowRequests.length > 0) {
      recommendations.push({
        type: 'slow_requests',
        severity: 'high',
        message: `发现 ${this.slowRequests.length} 个慢请求，建议优化数据库查询和业务逻辑`,
        action: '分析慢请求的SQL查询，添加索引，优化算法复杂度'
      });
    }

    // 检查内存使用
    const memoryUsage = process.memoryUsage();
    const memoryUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    if (memoryUsedMB > this.thresholds.memoryWarningMB) {
      recommendations.push({
        type: 'memory_usage',
        severity: 'medium',
        message: `内存使用过高 (${memoryUsedMB.toFixed(2)}MB)，建议优化内存使用`,
        action: '检查内存泄漏，优化数据结构，增加垃圾回收'
      });
    }

    // 检查错误率
    const errorStats = this.getErrorAnalysis();
    if (errorStats.totalErrors > 0) {
      recommendations.push({
        type: 'error_rate',
        severity: 'high',
        message: `发现 ${errorStats.totalErrors} 个错误，建议改善错误处理`,
        action: '分析错误日志，完善异常处理，添加监控告警'
      });
    }

    // 检查高频端点
    const topEndpoints = this.getTopEndpoints(5);
    const highTrafficEndpoint = topEndpoints.find(ep => ep.count > 1000 && ep.avgDuration > 1000);
    if (highTrafficEndpoint) {
      recommendations.push({
        type: 'high_traffic',
        severity: 'medium',
        message: `高流量端点 ${highTrafficEndpoint.url} 响应时间较长`,
        action: '添加缓存层，优化数据库查询，考虑负载均衡'
      });
    }

    return recommendations;
  }

  /**
   * 停止监控
   */
  stop() {
    if (this.systemMonitorInterval) {
      clearInterval(this.systemMonitorInterval);
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    logger.info('🔒 性能监控已停止');
  }
}

// 创建全局性能监控实例
const performanceMonitor = new PerformanceMonitor();

module.exports = {
  PerformanceMonitor,
  performanceMonitor,
  middleware: () => performanceMonitor.middleware()
};