const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const ProfitData = sequelize.define('ProfitData', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  period: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      len: [4, 20]
    },
    comment: '期间，格式：YYYY-MM 或 YYYY-Q1'
  },
  businessLineId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'business_line_id',
    comment: '业务线ID，为空表示公司总体数据'
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'project_id',
    comment: '项目ID，用于项目级别的利润统计'
  },
  revenue: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: '收入金额'
  },
  cost: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: '成本金额'
  },
  profit: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '利润金额 (收入-成本)'
  },
  profitMargin: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: true,
    field: 'profit_margin',
    validate: {
      min: -1,
      max: 1
    },
    comment: '利润率 (利润/收入)'
  },
  dataSource: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'data_source',
    validate: {
      isIn: [['manual', 'import', 'integration', 'calculation']]
    },
    defaultValue: 'manual',
    comment: '数据来源：手工录入/导入/集成/计算'
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '备注说明'
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    validate: {
      isIn: [[0, 1]]
    },
    comment: '状态：0-无效，1-有效'
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
  tableName: 'profit_data',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '利润数据表',
  indexes: [
    {
      fields: ['period'],
      name: 'idx_profit_data_period'
    },
    {
      fields: ['business_line_id', 'period'],
      name: 'idx_profit_data_line_period'
    },
    {
      fields: ['project_id', 'period'],
      name: 'idx_profit_data_project_period'
    },
    {
      unique: true,
      fields: ['period', 'business_line_id', 'project_id'],
      name: 'unique_profit_data_period_line_project'
    }
  ],
  hooks: {
    beforeSave: (instance) => {
      // 自动计算利润和利润率
      instance.profit = instance.revenue - instance.cost
      if (instance.revenue > 0) {
        instance.profitMargin = instance.profit / instance.revenue
      } else {
        instance.profitMargin = null
      }
    }
  }
})

module.exports = ProfitData