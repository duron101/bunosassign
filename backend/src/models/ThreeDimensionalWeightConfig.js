const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const ThreeDimensionalWeightConfig = sequelize.define('ThreeDimensionalWeightConfig', {
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
    comment: '权重配置名称'
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [2, 50]
    },
    comment: '权重配置代码'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '配置描述'
  },
  
  // 三维权重配置
  profitContributionWeight: {
    type: DataTypes.DECIMAL(4, 3),
    allowNull: false,
    field: 'profit_contribution_weight',
    defaultValue: 0.5,
    validate: {
      min: 0,
      max: 1
    },
    comment: '利润贡献度权重'
  },
  positionValueWeight: {
    type: DataTypes.DECIMAL(4, 3),
    allowNull: false,
    field: 'position_value_weight',
    defaultValue: 0.3,
    validate: {
      min: 0,
      max: 1
    },
    comment: '岗位价值权重'
  },
  performanceWeight: {
    type: DataTypes.DECIMAL(4, 3),
    allowNull: false,
    field: 'performance_weight',
    defaultValue: 0.2,
    validate: {
      min: 0,
      max: 1
    },
    comment: '绩效表现权重'
  },
  
  // 利润贡献度子权重
  profitDirectContributionWeight: {
    type: DataTypes.DECIMAL(4, 3),
    allowNull: false,
    field: 'profit_direct_contribution_weight',
    defaultValue: 0.4,
    validate: {
      min: 0,
      max: 1
    },
    comment: '利润-直接贡献权重'
  },
  profitWorkloadWeight: {
    type: DataTypes.DECIMAL(4, 3),
    allowNull: false,
    field: 'profit_workload_weight',
    defaultValue: 0.3,
    validate: {
      min: 0,
      max: 1
    },
    comment: '利润-工作量权重'
  },
  profitQualityWeight: {
    type: DataTypes.DECIMAL(4, 3),
    allowNull: false,
    field: 'profit_quality_weight',
    defaultValue: 0.2,
    validate: {
      min: 0,
      max: 1
    },
    comment: '利润-质量权重'
  },
  profitPositionValueWeight: {
    type: DataTypes.DECIMAL(4, 3),
    allowNull: false,
    field: 'profit_position_value_weight',
    defaultValue: 0.1,
    validate: {
      min: 0,
      max: 1
    },
    comment: '利润-岗位价值权重'
  },
  
  // 岗位价值子权重
  positionSkillComplexityWeight: {
    type: DataTypes.DECIMAL(4, 3),
    allowNull: false,
    field: 'position_skill_complexity_weight',
    defaultValue: 0.25,
    validate: {
      min: 0,
      max: 1
    },
    comment: '岗位-技能复杂度权重'
  },
  positionResponsibilityWeight: {
    type: DataTypes.DECIMAL(4, 3),
    allowNull: false,
    field: 'position_responsibility_weight',
    defaultValue: 0.3,
    validate: {
      min: 0,
      max: 1
    },
    comment: '岗位-责任范围权重'
  },
  positionDecisionImpactWeight: {
    type: DataTypes.DECIMAL(4, 3),
    allowNull: false,
    field: 'position_decision_impact_weight',
    defaultValue: 0.2,
    validate: {
      min: 0,
      max: 1
    },
    comment: '岗位-决策影响权重'
  },
  positionExperienceWeight: {
    type: DataTypes.DECIMAL(4, 3),
    allowNull: false,
    field: 'position_experience_weight',
    defaultValue: 0.15,
    validate: {
      min: 0,
      max: 1
    },
    comment: '岗位-经验要求权重'
  },
  positionMarketValueWeight: {
    type: DataTypes.DECIMAL(4, 3),
    allowNull: false,
    field: 'position_market_value_weight',
    defaultValue: 0.1,
    validate: {
      min: 0,
      max: 1
    },
    comment: '岗位-市场价值权重'
  },
  
  // 绩效表现子权重
  performanceWorkOutputWeight: {
    type: DataTypes.DECIMAL(4, 3),
    allowNull: false,
    field: 'performance_work_output_weight',
    defaultValue: 0.25,
    validate: {
      min: 0,
      max: 1
    },
    comment: '绩效-工作产出权重'
  },
  performanceWorkQualityWeight: {
    type: DataTypes.DECIMAL(4, 3),
    allowNull: false,
    field: 'performance_work_quality_weight',
    defaultValue: 0.2,
    validate: {
      min: 0,
      max: 1
    },
    comment: '绩效-工作质量权重'
  },
  performanceWorkEfficiencyWeight: {
    type: DataTypes.DECIMAL(4, 3),
    allowNull: false,
    field: 'performance_work_efficiency_weight',
    defaultValue: 0.15,
    validate: {
      min: 0,
      max: 1
    },
    comment: '绩效-工作效率权重'
  },
  performanceCollaborationWeight: {
    type: DataTypes.DECIMAL(4, 3),
    allowNull: false,
    field: 'performance_collaboration_weight',
    defaultValue: 0.15,
    validate: {
      min: 0,
      max: 1
    },
    comment: '绩效-协作能力权重'
  },
  performanceInnovationWeight: {
    type: DataTypes.DECIMAL(4, 3),
    allowNull: false,
    field: 'performance_innovation_weight',
    defaultValue: 0.1,
    validate: {
      min: 0,
      max: 1
    },
    comment: '绩效-创新能力权重'
  },
  performanceLeadershipWeight: {
    type: DataTypes.DECIMAL(4, 3),
    allowNull: false,
    field: 'performance_leadership_weight',
    defaultValue: 0.1,
    validate: {
      min: 0,
      max: 1
    },
    comment: '绩效-领导力权重'
  },
  performanceLearningWeight: {
    type: DataTypes.DECIMAL(4, 3),
    allowNull: false,
    field: 'performance_learning_weight',
    defaultValue: 0.05,
    validate: {
      min: 0,
      max: 1
    },
    comment: '绩效-学习能力权重'
  },
  
  // 调整系数配置
  excellenceBonus: {
    type: DataTypes.DECIMAL(4, 3),
    allowNull: false,
    field: 'excellence_bonus',
    defaultValue: 0.2,
    validate: {
      min: 0,
      max: 1
    },
    comment: '卓越表现奖励系数'
  },
  performanceMultiplier: {
    type: DataTypes.DECIMAL(4, 3),
    allowNull: false,
    field: 'performance_multiplier',
    defaultValue: 1.5,
    validate: {
      min: 0.5,
      max: 3.0
    },
    comment: '绩效乘数'
  },
  positionLevelMultiplier: {
    type: DataTypes.DECIMAL(4, 3),
    allowNull: false,
    field: 'position_level_multiplier',
    defaultValue: 1.2,
    validate: {
      min: 0.5,
      max: 3.0
    },
    comment: '岗位等级乘数'
  },
  
  // 适用范围配置
  applicableBusinessLines: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'applicable_business_lines',
    comment: '适用业务线ID列表'
  },
  applicableDepartments: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'applicable_departments',
    comment: '适用部门ID列表'
  },
  applicablePositionLevels: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'applicable_position_levels',
    comment: '适用岗位等级列表'
  },
  applicableEmployeeTypes: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'applicable_employee_types',
    comment: '适用员工类型列表'
  },
  
  // 计算方法配置
  calculationMethod: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'calculation_method',
    defaultValue: 'weighted_sum',
    validate: {
      isIn: [['weighted_sum', 'weighted_product', 'hybrid', 'custom']]
    },
    comment: '计算方法：加权和/加权积/混合/自定义'
  },
  normalizationMethod: {
    type: DataTypes.STRING(30),
    allowNull: false,
    field: 'normalization_method',
    defaultValue: 'z_score',
    validate: {
      isIn: [['z_score', 'min_max', 'rank_based', 'percentile']]
    },
    comment: '标准化方法'
  },
  
  // 高级配置
  weightAdjustmentRules: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'weight_adjustment_rules',
    comment: '权重调整规则JSON'
  },
  conditionalWeights: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'conditional_weights',
    comment: '条件权重配置JSON'
  },
  customFormula: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'custom_formula',
    comment: '自定义计算公式'
  },
  
  // 生效时间和版本
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
  version: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '1.0',
    comment: '版本号'
  },
  parentConfigId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'parent_config_id',
    comment: '父配置ID（版本追踪）'
  },
  
  // 使用统计
  usageCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'usage_count',
    defaultValue: 0,
    comment: '使用次数'
  },
  lastUsedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_used_at',
    comment: '最后使用时间'
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
  tableName: 'three_dimensional_weight_configs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '三维模型权重配置表',
  indexes: [
    {
      fields: ['status', 'effective_date'],
      name: 'idx_weight_config_status_effective'
    },
    {
      fields: ['effective_date', 'expiry_date'],
      name: 'idx_weight_config_date_range'
    },
    {
      fields: ['usage_count', 'last_used_at'],
      name: 'idx_weight_config_usage'
    },
    {
      unique: true,
      fields: ['code'],
      name: 'unique_weight_config_code'
    }
  ],
  hooks: {
    beforeSave: (instance) => {
      // 验证三维主权重总和
      const mainWeightSum = 
        instance.profitContributionWeight +
        instance.positionValueWeight +
        instance.performanceWeight
      
      if (Math.abs(mainWeightSum - 1.0) > 0.001) {
        throw new Error('三维主权重总和必须等于1.0')
      }
      
      // 验证利润贡献度子权重总和
      const profitSubWeightSum = 
        instance.profitDirectContributionWeight +
        instance.profitWorkloadWeight +
        instance.profitQualityWeight +
        instance.profitPositionValueWeight
      
      if (Math.abs(profitSubWeightSum - 1.0) > 0.001) {
        throw new Error('利润贡献度子权重总和必须等于1.0')
      }
      
      // 验证岗位价值子权重总和
      const positionSubWeightSum = 
        instance.positionSkillComplexityWeight +
        instance.positionResponsibilityWeight +
        instance.positionDecisionImpactWeight +
        instance.positionExperienceWeight +
        instance.positionMarketValueWeight
      
      if (Math.abs(positionSubWeightSum - 1.0) > 0.001) {
        throw new Error('岗位价值子权重总和必须等于1.0')
      }
      
      // 验证绩效表现子权重总和
      const performanceSubWeightSum = 
        instance.performanceWorkOutputWeight +
        instance.performanceWorkQualityWeight +
        instance.performanceWorkEfficiencyWeight +
        instance.performanceCollaborationWeight +
        instance.performanceInnovationWeight +
        instance.performanceLeadershipWeight +
        instance.performanceLearningWeight
      
      if (Math.abs(performanceSubWeightSum - 1.0) > 0.001) {
        throw new Error('绩效表现子权重总和必须等于1.0')
      }
    },
    
    afterCreate: (instance) => {
      // 创建后自动增加使用计数
      instance.increment('usageCount')
      instance.update({ lastUsedAt: new Date() })
    },
    
    afterUpdate: (instance) => {
      // 更新后记录最后使用时间
      if (instance.status === 'active') {
        instance.update({ lastUsedAt: new Date() })
      }
    }
  }
})

module.exports = ThreeDimensionalWeightConfig