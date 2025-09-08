const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const SimulationScenario = sequelize.define('SimulationScenario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  basePoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'base_pool_id'
  },
  parameters: {
    type: DataTypes.JSON,
    allowNull: false
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'created_by'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_public'
  }
}, {
  tableName: 'simulation_scenarios',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '模拟场景表'
})

module.exports = SimulationScenario