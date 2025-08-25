const EventEmitter = require('events');
const logger = require('../utils/logger');

/**
 * 数据库连接池管理器
 * 用于模拟和管理数据库连接，提供连接池功能
 */
class DatabasePool extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      // 连接池配置
      min: options.min || 5,           // 最小连接数
      max: options.max || 20,          // 最大连接数
      acquireTimeoutMs: options.acquireTimeoutMs || 30000, // 获取连接超时时间
      idleTimeoutMs: options.idleTimeoutMs || 300000,       // 空闲连接超时时间
      reapIntervalMs: options.reapIntervalMs || 60000,      // 清理间隔
      
      // 性能优化配置
      validateOnBorrow: options.validateOnBorrow !== false, // 借用时验证连接
      validateOnReturn: options.validateOnReturn !== false, // 归还时验证连接
      maxRetries: options.maxRetries || 3,                  // 最大重试次数
      retryDelayMs: options.retryDelayMs || 1000,          // 重试延迟
      
      // 监控配置
      enableMetrics: options.enableMetrics !== false,      // 启用性能监控
      metricsInterval: options.metricsInterval || 30000,   // 监控间隔
    };
    
    // 连接池状态
    this.connections = new Map(); // 所有连接
    this.available = [];          // 可用连接
    this.borrowed = new Set();    // 已借出连接
    this.pending = [];           // 等待连接的请求
    this.destroyed = false;      // 池是否已销毁
    
    // 性能指标
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      availableConnections: 0,
      pendingRequests: 0,
      totalAcquired: 0,
      totalReleased: 0,
      totalCreated: 0,
      totalDestroyed: 0,
      totalErrors: 0,
      totalTimeouts: 0,
      avgAcquireTime: 0,
      maxAcquireTime: 0,
      acquireTimes: []
    };
    
    // 启动初始化
    this._initialize();
    
    // 启动定期清理
    this._startReaper();
    
    // 启动性能监控
    if (this.config.enableMetrics) {
      this._startMetrics();
    }
  }

  /**
   * 初始化连接池
   */
  async _initialize() {
    try {
      logger.info('🔧 初始化数据库连接池...', this.config);
      
      // 创建最小数量的连接
      for (let i = 0; i < this.config.min; i++) {
        const connection = await this._createConnection();
        this.available.push(connection);
      }
      
      logger.info(`✅ 连接池初始化完成，创建 ${this.config.min} 个初始连接`);
      this.emit('initialized');
      
    } catch (error) {
      logger.error('❌ 连接池初始化失败:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * 创建新连接
   */
  async _createConnection() {
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const connection = {
      id: connectionId,
      createdAt: new Date(),
      lastUsedAt: new Date(),
      usageCount: 0,
      isValid: true,
      isIdle: true,
      // 模拟连接对象
      database: null,
      query: this._createQueryFunction(),
      ping: this._createPingFunction(),
      close: this._createCloseFunction(connectionId)
    };
    
    this.connections.set(connectionId, connection);
    this.metrics.totalCreated++;
    this.metrics.totalConnections++;
    
    logger.debug(`创建新连接: ${connectionId}`);
    return connection;
  }

  /**
   * 创建查询函数
   */
  _createQueryFunction() {
    return async (sql, params = []) => {
      // 模拟查询执行时间
      const queryTime = Math.random() * 50 + 10; // 10-60ms
      await new Promise(resolve => setTimeout(resolve, queryTime));
      
      // 模拟查询结果
      return {
        sql,
        params,
        executionTime: queryTime,
        timestamp: new Date()
      };
    };
  }

  /**
   * 创建ping函数
   */
  _createPingFunction() {
    return async () => {
      // 模拟ping操作
      await new Promise(resolve => setTimeout(resolve, 5));
      return true;
    };
  }

  /**
   * 创建关闭函数
   */
  _createCloseFunction(connectionId) {
    return async () => {
      const connection = this.connections.get(connectionId);
      if (connection) {
        connection.isValid = false;
        logger.debug(`连接已关闭: ${connectionId}`);
      }
    };
  }

  /**
   * 获取连接
   */
  async acquire() {
    if (this.destroyed) {
      throw new Error('连接池已销毁');
    }

    const startTime = Date.now();
    let connection = null;

    try {
      // 尝试从可用连接中获取
      connection = await this._getAvailableConnection();
      
      if (!connection) {
        // 如果没有可用连接，尝试创建新连接
        if (this.metrics.totalConnections < this.config.max) {
          connection = await this._createConnection();
        } else {
          // 等待连接释放
          connection = await this._waitForConnection();
        }
      }

      // 验证连接
      if (this.config.validateOnBorrow) {
        const isValid = await this._validateConnection(connection);
        if (!isValid) {
          await this._destroyConnection(connection);
          return this.acquire(); // 递归重试
        }
      }

      // 标记连接为已借出
      this.borrowed.add(connection.id);
      this.available = this.available.filter(c => c.id !== connection.id);
      
      connection.lastUsedAt = new Date();
      connection.usageCount++;
      connection.isIdle = false;

      // 更新统计
      const acquireTime = Date.now() - startTime;
      this._updateAcquireStats(acquireTime);
      this.metrics.totalAcquired++;
      
      logger.debug(`获取连接: ${connection.id}, 耗时: ${acquireTime}ms`);
      
      return connection;

    } catch (error) {
      this.metrics.totalErrors++;
      logger.error('获取连接失败:', error);
      throw error;
    }
  }

  /**
   * 释放连接
   */
  async release(connection) {
    if (!connection || !this.connections.has(connection.id)) {
      logger.warn('尝试释放无效连接');
      return;
    }

    try {
      // 验证连接（如果启用）
      if (this.config.validateOnReturn) {
        const isValid = await this._validateConnection(connection);
        if (!isValid) {
          await this._destroyConnection(connection);
          return;
        }
      }

      // 从已借出列表中移除
      this.borrowed.delete(connection.id);
      
      // 重置连接状态
      connection.isIdle = true;
      connection.lastUsedAt = new Date();
      
      // 添加到可用连接列表
      this.available.push(connection);
      
      // 更新统计
      this.metrics.totalReleased++;
      
      // 处理等待的请求
      this._processPendingRequests();
      
      logger.debug(`释放连接: ${connection.id}`);
      this.emit('connectionReleased', connection);

    } catch (error) {
      this.metrics.totalErrors++;
      logger.error('释放连接失败:', error);
      await this._destroyConnection(connection);
    }
  }

  /**
   * 获取可用连接
   */
  async _getAvailableConnection() {
    if (this.available.length > 0) {
      return this.available.shift();
    }
    return null;
  }

  /**
   * 等待连接释放
   */
  async _waitForConnection() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        // 从等待队列中移除
        const index = this.pending.findIndex(req => req.resolve === resolve);
        if (index !== -1) {
          this.pending.splice(index, 1);
        }
        
        this.metrics.totalTimeouts++;
        reject(new Error(`获取连接超时 (${this.config.acquireTimeoutMs}ms)`));
      }, this.config.acquireTimeoutMs);

      this.pending.push({ resolve, reject, timeout });
    });
  }

  /**
   * 处理等待的连接请求
   */
  _processPendingRequests() {
    while (this.pending.length > 0 && this.available.length > 0) {
      const { resolve, reject, timeout } = this.pending.shift();
      clearTimeout(timeout);
      
      const connection = this.available.shift();
      if (connection) {
        resolve(connection);
      } else {
        reject(new Error('无可用连接'));
      }
    }
  }

  /**
   * 验证连接
   */
  async _validateConnection(connection) {
    try {
      if (!connection.isValid) {
        return false;
      }
      
      // 执行ping测试
      await connection.ping();
      return true;
      
    } catch (error) {
      logger.warn(`连接验证失败: ${connection.id}`, error.message);
      return false;
    }
  }

  /**
   * 销毁连接
   */
  async _destroyConnection(connection) {
    try {
      if (this.connections.has(connection.id)) {
        await connection.close();
        this.connections.delete(connection.id);
        this.borrowed.delete(connection.id);
        this.available = this.available.filter(c => c.id !== connection.id);
        
        this.metrics.totalDestroyed++;
        this.metrics.totalConnections--;
        
        logger.debug(`销毁连接: ${connection.id}`);
      }
    } catch (error) {
      logger.error('销毁连接失败:', error);
    }
  }

  /**
   * 启动连接清理器
   */
  _startReaper() {
    this.reapInterval = setInterval(async () => {
      await this._reapConnections();
    }, this.config.reapIntervalMs);
  }

  /**
   * 清理空闲连接
   */
  async _reapConnections() {
    const now = Date.now();
    const idleTimeout = this.config.idleTimeoutMs;
    
    // 清理超时的空闲连接（保持最小连接数）
    const connectionsToReap = this.available.filter(conn => {
      const idleTime = now - conn.lastUsedAt.getTime();
      return idleTime > idleTimeout && this.metrics.totalConnections > this.config.min;
    });

    for (const connection of connectionsToReap) {
      await this._destroyConnection(connection);
    }

    if (connectionsToReap.length > 0) {
      logger.debug(`清理 ${connectionsToReap.length} 个空闲连接`);
    }
  }

  /**
   * 更新获取连接统计
   */
  _updateAcquireStats(acquireTime) {
    this.metrics.acquireTimes.push(acquireTime);
    
    // 保持最近1000次记录
    if (this.metrics.acquireTimes.length > 1000) {
      this.metrics.acquireTimes = this.metrics.acquireTimes.slice(-1000);
    }
    
    // 计算平均时间
    this.metrics.avgAcquireTime = 
      this.metrics.acquireTimes.reduce((sum, time) => sum + time, 0) / 
      this.metrics.acquireTimes.length;
    
    // 更新最大时间
    this.metrics.maxAcquireTime = Math.max(this.metrics.maxAcquireTime, acquireTime);
  }

  /**
   * 启动性能监控
   */
  _startMetrics() {
    this.metricsInterval = setInterval(() => {
      this._updateMetrics();
      this._logMetrics();
    }, this.config.metricsInterval);
  }

  /**
   * 更新性能指标
   */
  _updateMetrics() {
    this.metrics.activeConnections = this.borrowed.size;
    this.metrics.availableConnections = this.available.length;
    this.metrics.pendingRequests = this.pending.length;
  }

  /**
   * 记录性能指标
   */
  _logMetrics() {
    const metrics = this.getMetrics();
    logger.info('📊 连接池性能指标:', {
      total: metrics.totalConnections,
      active: metrics.activeConnections,
      available: metrics.availableConnections,
      pending: metrics.pendingRequests,
      avgAcquireTime: `${metrics.avgAcquireTime.toFixed(2)}ms`,
      maxAcquireTime: `${metrics.maxAcquireTime}ms`,
      utilization: `${(metrics.activeConnections / metrics.totalConnections * 100).toFixed(1)}%`
    });
  }

  /**
   * 获取连接池指标
   */
  getMetrics() {
    this._updateMetrics();
    return {
      ...this.metrics,
      config: this.config,
      utilizationRate: this.metrics.totalConnections > 0 
        ? this.metrics.activeConnections / this.metrics.totalConnections 
        : 0
    };
  }

  /**
   * 获取连接池状态
   */
  getStatus() {
    return {
      destroyed: this.destroyed,
      totalConnections: this.connections.size,
      activeConnections: this.borrowed.size,
      availableConnections: this.available.length,
      pendingRequests: this.pending.length,
      minConnections: this.config.min,
      maxConnections: this.config.max
    };
  }

  /**
   * 执行查询（便捷方法）
   */
  async query(sql, params = []) {
    const connection = await this.acquire();
    
    try {
      const result = await connection.query(sql, params);
      return result;
    } finally {
      await this.release(connection);
    }
  }

  /**
   * 执行事务（便捷方法）
   */
  async transaction(callback) {
    const connection = await this.acquire();
    
    try {
      // 开始事务
      await connection.query('BEGIN');
      
      // 执行回调
      const result = await callback(connection);
      
      // 提交事务
      await connection.query('COMMIT');
      
      return result;
      
    } catch (error) {
      // 回滚事务
      try {
        await connection.query('ROLLBACK');
      } catch (rollbackError) {
        logger.error('事务回滚失败:', rollbackError);
      }
      throw error;
    } finally {
      await this.release(connection);
    }
  }

  /**
   * 销毁连接池
   */
  async destroy() {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;

    // 清理定时器
    if (this.reapInterval) {
      clearInterval(this.reapInterval);
    }
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }

    // 拒绝等待中的请求
    this.pending.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(new Error('连接池已销毁'));
    });
    this.pending = [];

    // 关闭所有连接
    const closePromises = Array.from(this.connections.values()).map(conn => 
      this._destroyConnection(conn)
    );
    
    await Promise.all(closePromises);

    logger.info('🔒 连接池已销毁');
    this.emit('destroyed');
  }
}

/**
 * 创建默认连接池实例
 */
const createPool = (options = {}) => {
  return new DatabasePool(options);
};

/**
 * 默认连接池配置
 */
const defaultPoolConfig = {
  min: 5,
  max: 20,
  acquireTimeoutMs: 30000,
  idleTimeoutMs: 300000,
  reapIntervalMs: 60000,
  validateOnBorrow: true,
  validateOnReturn: true,
  maxRetries: 3,
  retryDelayMs: 1000,
  enableMetrics: true,
  metricsInterval: 30000
};

module.exports = {
  DatabasePool,
  createPool,
  defaultPoolConfig
};