const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const ProfitAllocationRule = sequelize.define('ProfitAllocationRule', {
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
    comment: '规则名称'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '规则描述'
  },
  businessLineId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'business_line_id',
    comment: '业务线ID，为空表示全局规则'
  },
  
  // 规则类型和计算方式
  ruleType: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'rule_type',
    validate: {
      isIn: [['formula', 'ratio', 'hybrid', 'custom']]
    },
    comment: '规则类型：公式/比例/混合/自定义'
  },
  allocationFormula: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'allocation_formula',
    comment: '分配公式表达式'
  },
  
  // 基础权重配置
  baseRatio: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: true,
    field: 'base_ratio',
    validate: {
      min: 0,
      max: 1
    },
    comment: '基础分配比例'
  },
  
  // 各维度权重 (总和应为1.0)
  directContributionWeight: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    field: 'direct_contribution_weight',
    defaultValue: 0.4,
    validate: {
      min: 0,
      max: 1
    },
    comment: '直接贡献权重'
  },
  workloadWeight: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    field: 'workload_weight',
    defaultValue: 0.3,
    validate: {
      min: 0,
      max: 1
    },
    comment: '工作量权重'
  },
  qualityWeight: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    field: 'quality_weight',
    defaultValue: 0.2,
    validate: {
      min: 0,
      max: 1
    },
    comment: '质量权重'
  },
  positionValueWeight: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    field: 'position_value_weight',
    defaultValue: 0.1,
    validate: {
      min: 0,
      max: 1
    },
    comment: '岗位价值权重'
  },
  
  // 绩效调整参数
  performanceWeight: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    field: 'performance_weight',
    defaultValue: 0.2,
    validate: {
      min: 0,
      max: 1
    },
    comment: '绩效调整权重'
  },
  seniorityWeight: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    field: 'seniority_weight',
    defaultValue: 0.05,
    validate: {
      min: 0,
      max: 1
    },
    comment: '资历权重'
  },
  skillWeight: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    field: 'skill_weight',
    defaultValue: 0.1,
    validate: {
      min: 0,
      max: 1
    },
    comment: '技能权重'
  },
  
  // 质量子维度权重
  codeQualityWeight: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    field: 'code_quality_weight',
    defaultValue: 0.3,
    validate: {
      min: 0,
      max: 1
    },
    comment: '代码质量权重'
  },
  deliveryOnTimeWeight: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    field: 'delivery_on_time_weight',
    defaultValue: 0.25,
    validate: {
      min: 0,
      max: 1
    },
    comment: '按时交付权重'
  },
  clientSatisfactionWeight: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    field: 'client_satisfaction_weight',
    defaultValue: 0.25,
    validate: {
      min: 0,
      max: 1
    },
    comment: '客户满意度权重'
  },
  defectRateWeight: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    field: 'defect_rate_weight',
    defaultValue: 0.2,
    validate: {
      min: 0,
      max: 1
    },
    comment: '缺陷率权重 (负向指标)'
  },
  
  // 调整系数配置
  excellenceBonus: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    field: 'excellence_bonus',
    defaultValue: 0.2,
    validate: {
      min: 0,
      max: 1
    },
    comment: '卓越表现奖励系数'
  },
  qualityBonus: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    field: 'quality_bonus',
    defaultValue: 0.15,
    validate: {
      min: 0,
      max: 1
    },
    comment: '质量奖励系数'
  },
  innovationBonus: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    field: 'innovation_bonus',
    defaultValue: 0.1,
    validate: {
      min: 0,
      max: 1
    },
    comment: '创新奖励系数'
  },
  
  // 应用范围和条件
  applicableRoles: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'applicable_roles',
    comment: '适用角色列表'
  },
  minContributionThreshold: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: true,
    field: 'min_contribution_threshold',
    comment: '最小贡献度阈值'
  },
  maxContributionCap: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: true,
    field: 'max_contribution_cap',
    comment: '最大贡献度上限'
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
  
  // 版本管理
  version: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: '1.0',
    comment: '版本号'
  },
  parentRuleId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'parent_rule_id',
    comment: '父规则ID（用于版本追踪）'
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
  tableName: 'profit_allocation_rules',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '利润分配规则表',
  indexes: [
    {
      fields: ['business_line_id'],
      name: 'idx_allocation_rules_business_line'
    },
    {
      fields: ['status', 'effective_date'],
      name: 'idx_allocation_rules_status_effective'
    },
    {
      fields: ['effective_date', 'expiry_date'],
      name: 'idx_allocation_rules_date_range'
    }
  ],
  hooks: {
    beforeSave: (instance) => {
      // 验证权重总和
      const totalWeight = 
        instance.directContributionWeight +
        instance.workloadWeight +
        instance.qualityWeight +
        instance.positionValueWeight
      
      if (Math.abs(totalWeight - 1.0) > 0.01) {
        throw new Error('主要维度权重总和必须等于1.0')
      }
      
      const qualityWeight = 
        instance.codeQualityWeight +
        instance.deliveryOnTimeWeight +
        instance.clientSatisfactionWeight +
        instance.defectRateWeight
      
      if (Math.abs(qualityWeight - 1.0) > 0.01) {
        throw new Error('质量子维度权重总和必须等于1.0')
      }
    }
  }
})

module.exports = ProfitAllocationRule