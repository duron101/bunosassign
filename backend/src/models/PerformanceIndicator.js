const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const PerformanceIndicator = sequelize.define('PerformanceIndicator', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [2, 100]
    },
    comment: '指标名称'
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [2, 50]
    },
    comment: '指标代码'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['work_output', 'work_quality', 'work_efficiency', 'collaboration', 'innovation', 'leadership', 'learning', 'behavior']]
    },
    comment: '指标类别：工作产出/工作质量/工作效率/协作能力/创新能力/领导力/学习能力/行为表现'
  },
  
  // 指标属性
  measurementType: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'measurement_type',
    validate: {
      isIn: [['quantitative', 'qualitative', 'binary', 'percentage']]
    },
    comment: '测量类型：定量/定性/二元/百分比'
  },
  dataType: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'data_type',
    validate: {
      isIn: [['integer', 'decimal', 'boolean', 'text', 'enum']]
    },
    comment: '数据类型'
  },
  unit: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '计量单位'
  },
  
  // 评分标准
  scoringMethod: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'scoring_method',
    defaultValue: 'linear',
    validate: {
      isIn: [['linear', 'tiered', 'curve', 'binary', 'custom']]
    },
    comment: '评分方法：线性/分层/曲线/二元/自定义'
  },
  minValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'min_value',
    comment: '最小值'
  },
  maxValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'max_value',
    comment: '最大值'
  },
  targetValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'target_value',
    comment: '目标值'
  },
  excellentThreshold: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'excellent_threshold',
    comment: '优秀阈值'
  },
  
  // 权重和重要性
  weight: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    defaultValue: 0.1,
    validate: {
      min: 0,
      max: 1
    },
    comment: '权重'
  },
  priority: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'medium',
    validate: {
      isIn: [['critical', 'high', 'medium', 'low']]
    },
    comment: '优先级'
  },
  
  // 计算逻辑
  calculationFormula: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'calculation_formula',
    comment: '计算公式'
  },
  scoringRules: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'scoring_rules',
    comment: '评分规则JSON'
  },
  
  // 适用范围
  applicablePositions: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'applicable_positions',
    comment: '适用岗位ID列表'
  },
  applicableLevels: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'applicable_levels',
    comment: '适用岗位等级列表'
  },
  applicableBusinessLines: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'applicable_business_lines',
    comment: '适用业务线ID列表'
  },
  
  // 数据源配置
  dataSource: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'data_source',
    defaultValue: 'manual',
    validate: {
      isIn: [['manual', 'system', 'third_party', 'calculation']]
    },
    comment: '数据来源：手动/系统/第三方/计算'
  },
  dataSourceConfig: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'data_source_config',
    comment: '数据源配置JSON'
  },
  updateFrequency: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'update_frequency',
    defaultValue: 'monthly',
    validate: {
      isIn: [['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'on_demand']]
    },
    comment: '更新频率'
  },
  
  // 显示配置
  displayOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'display_order',
    defaultValue: 100,
    comment: '显示顺序'
  },
  isVisible: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    field: 'is_visible',
    defaultValue: true,
    comment: '是否可见'
  },
  isEditable: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    field: 'is_editable',
    defaultValue: true,
    comment: '是否可编辑'
  },
  
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '指标描述'
  },
  measurementGuideline: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'measurement_guideline',
    comment: '测量指南'
  },
  
  // 生效时间
  effectiveDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'effective_date',
    comment: '生效日期'
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'expiry_date',
    comment: '失效日期'
  },
  
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'draft',
    validate: {
      isIn: [['draft', 'active', 'inactive', 'archived']]
    },
    comment: '状态：草稿/生效/失效/归档'
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
  tableName: 'performance_indicators',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '绩效指标定义表',
  indexes: [
    {
      fields: ['category', 'status'],
      name: 'idx_indicators_category_status'
    },
    {
      fields: ['effective_date', 'expiry_date'],
      name: 'idx_indicators_date_range'
    },
    {
      fields: ['display_order', 'is_visible'],
      name: 'idx_indicators_display'
    },
    {
      unique: true,
      fields: ['code'],
      name: 'unique_indicator_code'
    }
  ],
  hooks: {
    beforeSave: (instance) => {
      // 验证数值范围
      if (instance.minValue !== null && instance.maxValue !== null && instance.minValue >= instance.maxValue) {
        throw new Error('最小值必须小于最大值')
      }
      
      if (instance.targetValue !== null) {
        if (instance.minValue !== null && instance.targetValue < instance.minValue) {
          throw new Error('目标值不能小于最小值')
        }
        if (instance.maxValue !== null && instance.targetValue > instance.maxValue) {
          throw new Error('目标值不能大于最大值')
        }
      }
    }
  }
})

module.exports = PerformanceIndicator