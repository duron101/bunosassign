const { sequelize } = require('../config/database')

class ModelAdapter {
  constructor(tableName) {
    this.tableName = tableName
    this.manager = sequelize.manager
  }

  // Sequelize兼容方法
  async findAll(options = {}) {
    const result = this.manager.findAll(this.tableName, options)
    return result.rows
  }

  async findOne(options = {}) {
    return this.manager.findOne(this.tableName, options)
  }

  async findByPk(id, options = {}) {
    return this.manager.findByPk(this.tableName, id, options)
  }

  async findAndCountAll(options = {}) {
    return this.manager.findAll(this.tableName, options)
  }

  async create(data) {
    return this.manager.create(this.tableName, data)
  }

  async update(data, options = {}) {
    if (options.where && options.where.id) {
      return this.manager.update(this.tableName, options.where.id, data)
    }
    return [0]
  }

  async destroy(options = {}) {
    if (options.where && options.where.id) {
      return this.manager.destroy(this.tableName, options.where.id)
    }
    return 0
  }

  async bulkCreate(dataArray) {
    return this.manager.bulkCreate(this.tableName, dataArray)
  }

  async count(options = {}) {
    return this.manager.count(this.tableName, options)
  }

  // 添加toJSON方法支持
  toJSON() {
    return this
  }

  // 添加关联方法（简化版）
  belongsTo(model, options = {}) {
    // 这里只是为了兼容性，实际关联在查询时处理
    return this
  }

  hasMany(model, options = {}) {
    // 这里只是为了兼容性，实际关联在查询时处理
    return this
  }

  hasOne(model, options = {}) {
    // 这里只是为了兼容性，实际关联在查询时处理
    return this
  }
}

// 创建模型适配器工厂
function createModel(tableName) {
  return new ModelAdapter(tableName)
}

module.exports = {
  ModelAdapter,
  createModel
}