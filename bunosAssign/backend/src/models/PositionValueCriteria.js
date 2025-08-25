const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const PositionValueCriteria = sequelize.define('PositionValueCriteria', {
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
    comment: '评估标准名称'
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [2, 50]
    },
    comment: '评估标准代码'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['technical', 'management', 'business', 'support', 'leadership']]
    },
    comment: '标准类别：技术/管理/业务/支持/领导力'
  },
  
  // 评估维度权重
  skillComplexityWeight: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    field: 'skill_complexity_weight',
    defaultValue: 0.25,
    validate: {
      min: 0,
      max: 1
    },
    comment: '技能复杂度权重'
  },
  responsibilityWeight: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    field: 'responsibility_weight',
    defaultValue: 0.3,
    validate: {
      min: 0,
      max: 1
    },
    comment: '责任范围权重'
  },
  decisionImpactWeight: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    field: 'decision_impact_weight',
    defaultValue: 0.2,
    validate: {
      min: 0,
      max: 1
    },
    comment: '决策影响权重'
  },
  experienceRequiredWeight: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    field: 'experience_required_weight',
    defaultValue: 0.15,
    validate: {
      min: 0,
      max: 1
    },
    comment: '经验要求权重'
  },
  marketValueWeight: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    field: 'market_value_weight',
    defaultValue: 0.1,
    validate: {
      min: 0,
      max: 1
    },
    comment: '市场价值权重'
  },
  
  // 评分标准配置
  scoringMethod: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'scoring_method',
    defaultValue: 'weighted',
    validate: {
      isIn: [['weighted', 'percentage', 'points', 'ranking']]
    },
    comment: '评分方法：加权/百分比/积分/排名'
  },
  maxScore: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'max_score',
    defaultValue: 100,
    validate: {
      min: 50,
      max: 1000
    },
    comment: '最高分值'
  },
  minScore: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'min_score',
    defaultValue: 0,
    validate: {
      min: 0,
      max: 50
    },
    comment: '最低分值'
  },
  
  // 适用范围
  applicableBusinessLines: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'applicable_business_lines',
    comment: '适用业务线ID列表'
  },
  applicablePositionLevels: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'applicable_position_levels',
    comment: '适用岗位等级列表'
  },
  
  // 评估指标详细定义
  criteriaDetails: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'criteria_details',
    comment: '评估标准详细定义JSON'
  },
  
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '标准描述'
  },
  
  // 状态和版本管理
  version: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '1.0',
    comment: '版本号'
  },
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
  tableName: 'position_value_criteria',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '岗位价值评估标准表',
  indexes: [
    {
      fields: ['category', 'status'],
      name: 'idx_criteria_category_status'
    },
    {
      fields: ['effective_date', 'expiry_date'],
      name: 'idx_criteria_date_range'
    },
    {
      unique: true,
      fields: ['code'],
      name: 'unique_criteria_code'
    }
  ],
  hooks: {
    beforeSave: (instance) => {
      // 验证权重总和
      const totalWeight = 
        instance.skillComplexityWeight +
        instance.responsibilityWeight +
        instance.decisionImpactWeight +
        instance.experienceRequiredWeight +
        instance.marketValueWeight
      
      if (Math.abs(totalWeight - 1.0) > 0.01) {
        throw new Error('评估维度权重总和必须等于1.0')
      }
      
      // 验证分值范围
      if (instance.minScore >= instance.maxScore) {
        throw new Error('最低分值必须小于最高分值')
      }
    }
  }
})

module.exports = PositionValueCriteria