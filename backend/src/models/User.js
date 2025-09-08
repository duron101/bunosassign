const { createModel } = require('../adapters/model-adapter')

const User = createModel('users')

// 为了向后兼容，添加静态属性
User.attributes = {
  id: { type: 'STRING', primaryKey: true }, // 改为STRING类型，与NeDB的_id字段一致
  username: { type: 'STRING', allowNull: false, unique: true },
  password: { type: 'STRING', allowNull: false },
  name: { type: 'STRING', allowNull: true },
  email: { type: 'STRING', allowNull: true },
  phone: { type: 'STRING', allowNull: true },
  roleId: { type: 'STRING', allowNull: false }, // 改为STRING类型
  departmentId: { type: 'STRING', allowNull: true }, // 改为STRING类型
  status: { type: 'INTEGER', allowNull: false, defaultValue: 1 },
  lastLogin: { type: 'DATE', allowNull: true }
}

module.exports = User