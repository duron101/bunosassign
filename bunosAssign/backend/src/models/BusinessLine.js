const { createModel } = require('../adapters/model-adapter')

const BusinessLine = createModel('businessLines')

// 为了向后兼容，添加静态属性
BusinessLine.attributes = {
  id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
  name: { type: 'STRING', allowNull: false },
  code: { type: 'STRING', allowNull: false, unique: true },
  description: { type: 'STRING', allowNull: true },
  weight: { type: 'DECIMAL', allowNull: false, defaultValue: 0 },
  status: { type: 'INTEGER', allowNull: false, defaultValue: 1 }
}

module.exports = BusinessLine