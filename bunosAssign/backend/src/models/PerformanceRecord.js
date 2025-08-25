const { createModel } = require('../adapters/model-adapter')

const PerformanceRecord = createModel('performanceRecords')

// 为了向后兼容，添加静态属性
PerformanceRecord.attributes = {
  id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
  employeeId: { type: 'INTEGER', allowNull: false },
  period: { type: 'STRING', allowNull: false },
  rating: { type: 'STRING', allowNull: false },
  coefficient: { type: 'DECIMAL', allowNull: false },
  comments: { type: 'TEXT', allowNull: true },
  evaluatorId: { type: 'INTEGER', allowNull: false }
}

module.exports = PerformanceRecord