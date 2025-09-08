const { Sequelize } = require('sequelize')
const path = require('path')
const logger = require('../utils/logger')
const SQLiteManager = require('../database/sqlite-manager')

// 创建SQLite管理器实例
const dbPath = path.join(__dirname, '../../../database/bonus_system.json')
const sqliteManager = new SQLiteManager(dbPath)

// 创建Sequelize兼容的模拟对象
const sequelize = {
  async authenticate() {
    logger.info('使用自定义SQLite管理器')
    return Promise.resolve()
  },
  
  async sync(options = {}) {
    logger.info('SQLite管理器已初始化')
    return Promise.resolve()
  },
  
  async close() {
    logger.info('SQLite管理器连接关闭')
    return Promise.resolve()
  },
  
  // 提供数据库管理器访问
  manager: sqliteManager
}

module.exports = {
  sequelize,
  Sequelize
}