const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const BonusAllocationRule = sequelize.define('BonusAllocationRule', {
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
    comment: '分配规则名称'
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [2, 50]
    },
    comment: '分配规则代码'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '规则描述'
  },
  
  // 分配方法配置
  allocationMethod: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'allocation_method',
    defaultValue: 'score_based',
    validate: {
      isIn: [['score_based', 'tier_based', 'pool_percentage', 'fixed_amount', 'hybrid']]
    },
    comment: '分配方法：得分分配/分层分配/比例分配/固定金额/混合分配'
  },
  
  // 基础分配参数
  baseAllocationRatio: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: false,
    field: 'base_allocation_ratio',
    defaultValue: 0.8,
    validate: {
      min: 0,
      max: 1
    },
    comment: '基础分配比例'
  },
  performanceAllocationRatio: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: false,
    field: 'performance_allocation_ratio',
    defaultValue: 0.2,
    validate: {
      min: 0,
      max: 1
    },
    comment: '绩效分配比例'
  },
  
  // 得分分配配置
  scoreDistributionMethod: {
    type: DataTypes.STRING(30),
    allowNull: false,
    field: 'score_distribution_method',
    defaultValue: 'linear',
    validate: {
      isIn: [['linear', 'exponential', 'logarithmic', 'power', 'step']]
    },
    comment: '得分分配方法：线性/指数/对数/幂函数/阶梯'
  },
  minScoreThreshold: {
    type: DataTypes.DECIMAL(6, 4),
    allowNull: false,
    field: 'min_score_threshold',
    defaultValue: 0.0,
    comment: '最低得分阈值'
  },
  maxScoreMultiplier: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false,
    field: 'max_score_multiplier',
    defaultValue: 3.0,
    validate: {
      min: 1.0,
      max: 10.0
    },
    comment: '最高得分倍数'
  },
  
  // 分层分配配置
  tierConfig: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'tier_config',
    comment: '分层配置JSON: [{tier: "A", ratio: 0.4, minScore: 0.8}, ...]'
  },
  
  // 保障机制配置
  minBonusAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    field: 'min_bonus_amount',
    comment: '最小奖金金额保障'
  },
  maxBonusAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    field: 'max_bonus_amount',
    comment: '最大奖金金额限制'
  },
  minBonusRatio: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: true,
    field: 'min_bonus_ratio',
    validate: {
      min: 0,
      max: 1
    },
    comment: '最小奖金比例（相对于平均值）'
  },
  maxBonusRatio: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: true,
    field: 'max_bonus_ratio',
    validate: {
      min: 1,
      max: 10
    },
    comment: '最大奖金比例（相对于平均值）'
  },
  
  // 调整系数配置
  adjustmentFactors: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'adjustment_factors',
    comment: '调整系数配置JSON'
  },
  
  // 部门级配置
  departmentWeights: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'department_weights',
    comment: '部门权重配置JSON: {deptId: weight}'
  },
  positionLevelWeights: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'position_level_weights',
    comment: '岗位等级权重配置JSON: {level: weight}'
  },
  
  // 业务规则配置
  businessRules: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'business_rules',
    comment: '业务规则配置JSON'
  },
  
  // 特殊处理规则
  specialRules: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'special_rules',
    comment: '特殊处理规则JSON: 新员工、离职员工等'
  },
  
  // 适用范围
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
  
  // 计算精度配置
  calculationPrecision: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'calculation_precision',
    defaultValue: 2,
    validate: {
      min: 0,
      max: 4
    },
    comment: '计算精度（小数位数）'
  },
  roundingMethod: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'rounding_method',
    defaultValue: 'round',
    validate: {
      isIn: [['round', 'floor', 'ceil', 'banker']]
    },
    comment: '取整方法：四舍五入/向下取整/向上取整/银行家取整'
  },
  
  // 分配约束
  totalAllocationLimit: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: false,
    field: 'total_allocation_limit',
    defaultValue: 1.0,
    validate: {
      min: 0.5,
      max: 1.2
    },
    comment: '总分配限制比例'
  },
  reserveRatio: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: false,
    field: 'reserve_ratio',
    defaultValue: 0.05,
    validate: {
      min: 0,
      max: 0.2
    },
    comment: '预留比例'
  },
  
  // 质量控制
  qualityControlRules: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'quality_control_rules',
    comment: '质量控制规则JSON'
  },
  
  // 审批流程配置
  approvalWorkflow: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'approval_workflow',
    comment: '审批流程配置JSON'
  },
  requiresApproval: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    field: 'requires_approval',
    defaultValue: true,
    comment: '是否需要审批'
  },
  
  // 生效配置
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
  parentRuleId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'parent_rule_id',
    comment: '父规则ID（版本追踪）'
  },
  
  // 使用统计
  usageCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'usage_count',
    defaultValue: 0,
    comment: '使用次数'
  },
  successCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'success_count',
    defaultValue: 0,
    comment: '成功执行次数'
  },
  lastUsedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_used_at',
    comment: '最后使用时间'
  },
  
  // 性能指标
  avgExecutionTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'avg_execution_time',
    comment: '平均执行时间（毫秒）'
  },
  
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'draft',
    validate: {
      isIn: [['draft', 'active', 'inactive', 'archived', 'deprecated']]
    },
    comment: '状态：草稿/生效/失效/归档/废弃'
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
  tableName: 'bonus_allocation_rules',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '奖金分配规则表',
  indexes: [
    {
      fields: ['status', 'effective_date'],
      name: 'idx_allocation_rule_status_effective'
    },
    {
      fields: ['allocation_method', 'status'],
      name: 'idx_allocation_rule_method_status'
    },
    {
      fields: ['effective_date', 'expiry_date'],
      name: 'idx_allocation_rule_date_range'
    },
    {
      fields: ['usage_count', 'success_count'],
      name: 'idx_allocation_rule_usage_stats'
    },
    {
      unique: true,
      fields: ['code'],
      name: 'unique_allocation_rule_code'
    }
  ],
  hooks: {
    beforeSave: (instance) => {
      // 验证基础分配比例和绩效分配比例总和
      const totalRatio = parseFloat(instance.baseAllocationRatio) + parseFloat(instance.performanceAllocationRatio)
      if (Math.abs(totalRatio - 1.0) > 0.001) {
        throw new Error('基础分配比例和绩效分配比例总和必须等于1.0')
      }
      
      // 验证分层配置
      if (instance.allocationMethod === 'tier_based' && instance.tierConfig) {
        const tiers = instance.tierConfig
        if (Array.isArray(tiers)) {
          const totalTierRatio = tiers.reduce((sum, tier) => sum + (tier.ratio || 0), 0)
          if (Math.abs(totalTierRatio - 1.0) > 0.001) {
            throw new Error('分层配置总比例必须等于1.0')
          }
          
          // 验证分层得分阈值
          for (let i = 0; i < tiers.length - 1; i++) {
            if (tiers[i].minScore <= tiers[i + 1].minScore) {
              throw new Error('分层得分阈值必须递减')
            }
          }
        }
      }
      
      // 验证保障机制配置
      if (instance.minBonusRatio && instance.maxBonusRatio) {
        if (instance.minBonusRatio >= instance.maxBonusRatio) {
          throw new Error('最小奖金比例必须小于最大奖金比例')
        }
      }
      
      // 验证预留比例和总分配限制
      if (instance.reserveRatio >= instance.totalAllocationLimit) {
        throw new Error('预留比例必须小于总分配限制')
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

module.exports = BonusAllocationRule