const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const ProjectLineWeight = sequelize.define('ProjectLineWeight', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'project_id'
  },
  businessLineId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'business_line_id'
  },
  weight: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: 0,
      max: 1
    }
  },
  isCustom: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_custom',
    comment: '是否为自定义权重（true=项目特定权重，false=使用默认权重）'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '权重调整原因'
  },
  effectiveDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'effective_date',
    comment: '权重生效日期'
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'created_by'
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'updated_by'
  }
}, {
  tableName: 'project_line_weights',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '项目业务线权重配置表',
  indexes: [
    {
      unique: true,
      fields: ['project_id', 'business_line_id'],
      name: 'unique_project_line'
    },
    {
      fields: ['project_id'],
      name: 'idx_project_id'
    },
    {
      fields: ['business_line_id'],
      name: 'idx_business_line_id'
    }
  ]
})

module.exports = ProjectLineWeight