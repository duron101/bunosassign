const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const BonusPool = sequelize.define('BonusPool', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  period: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      len: [4, 20]
    }
  },
  totalProfit: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'total_profit',
    validate: {
      min: 0
    }
  },
  poolRatio: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'pool_ratio',
    validate: {
      min: 0,
      max: 1
    }
  },
  poolAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'pool_amount',
    validate: {
      min: 0
    }
  },
  reserveRatio: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'reserve_ratio',
    validate: {
      min: 0,
      max: 0.2
    }
  },
  specialRatio: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'special_ratio',
    validate: {
      min: 0,
      max: 0.1
    }
  },
  distributableAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'distributable_amount',
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'draft',
    validate: {
      isIn: [['draft', 'active', 'archived']]
    }
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'created_by'
  }
}, {
  tableName: 'bonus_pools',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '奖金池表'
})

module.exports = BonusPool