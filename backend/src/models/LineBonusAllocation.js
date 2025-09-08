const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const LineBonusAllocation = sequelize.define('LineBonusAllocation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  poolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'pool_id'
  },
  lineId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'line_id'
  },
  weight: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: 0,
      max: 1
    }
  },
  bonusAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'bonus_amount',
    validate: {
      min: 0
    }
  },
  basicAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'basic_amount',
    validate: {
      min: 0
    }
  },
  excellenceAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: 'excellence_amount',
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'line_bonus_allocations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '条线奖金分配表'
})

module.exports = LineBonusAllocation