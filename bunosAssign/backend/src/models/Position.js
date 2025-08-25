const { createModel } = require('../adapters/model-adapter')

const Position = createModel('positions')

// 为了向后兼容，添加静态属性
Position.attributes = {
  id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
  name: { type: 'STRING', allowNull: false },
  code: { type: 'STRING', allowNull: false, unique: true },
  level: { type: 'STRING', allowNull: false },
  departmentId: { type: 'INTEGER', allowNull: true },
  benchmarkValue: { type: 'DECIMAL', allowNull: false },
  salaryRange: { type: 'STRING', allowNull: true },
  description: { type: 'TEXT', allowNull: true },
  status: { type: 'INTEGER', allowNull: false, defaultValue: 1 }
}

module.exports = Position