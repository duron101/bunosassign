const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const OperationLog = sequelize.define('OperationLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id'
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      len: [1, 50]
    }
  },
  targetType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'target_type',
    validate: {
      len: [1, 50]
    }
  },
  targetId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'target_id'
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'ip_address'
  }
}, {
  tableName: 'operation_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  comment: '操作日志表'
})

module.exports = OperationLog