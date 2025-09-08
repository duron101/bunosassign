const { createModel } = require('../adapters/model-adapter')

const Role = createModel('roles')

// 为了向后兼容，添加静态属性
Role.attributes = {
  id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
  name: { type: 'STRING', allowNull: false, unique: true },
  code: { type: 'STRING', allowNull: false, unique: true },
  description: { type: 'STRING', allowNull: true },
  permissions: { type: 'JSON', allowNull: true, defaultValue: [] },
  status: { type: 'INTEGER', allowNull: false, defaultValue: 1 }
}

module.exports = Role