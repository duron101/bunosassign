const { createModel } = require('../adapters/model-adapter')

const Department = createModel('departments')

// 为了向后兼容，添加静态属性
Department.attributes = {
  id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
  name: { type: 'STRING', allowNull: false },
  code: { type: 'STRING', allowNull: false, unique: true },
  parentId: { type: 'INTEGER', allowNull: true },
  managerId: { type: 'INTEGER', allowNull: true },
  status: { type: 'INTEGER', allowNull: false, defaultValue: 1 },
  description: { type: 'TEXT', allowNull: true },
  sort: { type: 'INTEGER', allowNull: true }
}

module.exports = Department