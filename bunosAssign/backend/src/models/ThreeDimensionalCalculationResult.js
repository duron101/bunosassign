const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const ThreeDimensionalCalculationResult = sequelize.define('ThreeDimensionalCalculationResult', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'employee_id',
    comment: '员工ID'
  },
  weightConfigId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'weight_config_id',
    comment: '权重配置ID'
  },
  calculationPeriod: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'calculation_period',
    validate: {
      len: [4, 20]
    },
    comment: '计算期间，格式：YYYY-MM 或 YYYY-Q1'
  },
  bonusPoolId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'bonus_pool_id',
    comment: '关联奖金池ID'
  },
  
  // 原始维度得分
  profitContributionScore: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: false,
    field: 'profit_contribution_score',
    defaultValue: 0,
    comment: '利润贡献度得分'
  },
  positionValueScore: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: false,
    field: 'position_value_score',
    defaultValue: 0,
    comment: '岗位价值得分'
  },
  performanceScore: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: false,
    field: 'performance_score',
    defaultValue: 0,
    comment: '绩效表现得分'
  },
  
  // 标准化得分
  normalizedProfitScore: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: false,
    field: 'normalized_profit_score',
    defaultValue: 0,
    comment: '标准化利润贡献度得分'
  },
  normalizedPositionScore: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: false,
    field: 'normalized_position_score',
    defaultValue: 0,
    comment: '标准化岗位价值得分'
  },
  normalizedPerformanceScore: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: false,
    field: 'normalized_performance_score',
    defaultValue: 0,
    comment: '标准化绩效表现得分'
  },
  
  // 加权得分
  weightedProfitScore: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: false,
    field: 'weighted_profit_score',
    defaultValue: 0,
    comment: '加权利润贡献度得分'
  },
  weightedPositionScore: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: false,
    field: 'weighted_position_score',
    defaultValue: 0,
    comment: '加权岗位价值得分'
  },
  weightedPerformanceScore: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: false,
    field: 'weighted_performance_score',
    defaultValue: 0,
    comment: '加权绩效表现得分'
  },
  
  // 综合得分
  totalScore: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: false,
    field: 'total_score',
    defaultValue: 0,
    comment: '三维综合得分'
  },
  adjustedScore: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: true,
    field: 'adjusted_score',
    comment: '调整后得分'
  },
  finalScore: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: false,
    field: 'final_score',
    defaultValue: 0,
    comment: '最终得分'
  },
  
  // 排名和百分位
  scoreRank: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'score_rank',
    comment: '得分排名'
  },
  percentileRank: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'percentile_rank',
    validate: {
      min: 0,
      max: 100
    },
    comment: '百分位排名'
  },
  departmentRank: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'department_rank',
    comment: '部门内排名'
  },
  levelRank: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'level_rank',
    comment: '同等级排名'
  },
  
  // 奖金计算
  bonusCoefficient: {
    type: DataTypes.DECIMAL(6, 4),
    allowNull: true,
    field: 'bonus_coefficient',
    validate: {
      min: 0,
      max: 5.0
    },
    comment: '奖金系数'
  },
  baseBonusAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    field: 'base_bonus_amount',
    comment: '基础奖金金额'
  },
  adjustmentAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    field: 'adjustment_amount',
    comment: '调整金额'
  },
  finalBonusAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    field: 'final_bonus_amount',
    comment: '最终奖金金额'
  },
  
  // 维度贡献分析
  profitContributionRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'profit_contribution_rate',
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    },
    comment: '利润贡献度在总分中的占比'
  },
  positionValueRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'position_value_rate',
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    },
    comment: '岗位价值在总分中的占比'
  },
  performanceRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'performance_rate',
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    },
    comment: '绩效表现在总分中的占比'
  },
  
  // 详细计算数据
  profitCalculationDetails: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'profit_calculation_details',
    comment: '利润贡献度计算详情JSON'
  },
  positionCalculationDetails: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'position_calculation_details',
    comment: '岗位价值计算详情JSON'
  },
  performanceCalculationDetails: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'performance_calculation_details',
    comment: '绩效表现计算详情JSON'
  },
  
  // 计算方法和参数
  calculationMethod: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'calculation_method',
    defaultValue: 'weighted_sum',
    comment: '计算方法'
  },
  calculationParams: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'calculation_params',
    comment: '计算参数JSON'
  },
  
  // 数据来源标识
  profitDataVersion: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'profit_data_version',
    comment: '利润数据版本'
  },
  positionDataVersion: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'position_data_version',
    comment: '岗位数据版本'
  },
  performanceDataVersion: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'performance_data_version',
    comment: '绩效数据版本'
  },
  
  // 质量指标
  dataCompleteness: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'data_completeness',
    defaultValue: 100,
    validate: {
      min: 0,
      max: 100
    },
    comment: '数据完整性百分比'
  },
  calculationConfidence: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'calculation_confidence',
    defaultValue: 80,
    validate: {
      min: 0,
      max: 100
    },
    comment: '计算置信度'
  },
  
  // 异常检测
  outlierFlag: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    field: 'outlier_flag',
    defaultValue: false,
    comment: '异常值标识'
  },
  outlierReason: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'outlier_reason',
    comment: '异常原因'
  },
  
  // 审核状态
  reviewStatus: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'review_status',
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'approved', 'rejected', 'adjusted', 'locked']]
    },
    comment: '审核状态'
  },
  reviewComments: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'review_comments',
    comment: '审核意见'
  },
  reviewedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'reviewed_by',
    comment: '审核人ID'
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'reviewed_at',
    comment: '审核时间'
  },
  
  // 历史对比
  previousPeriodScore: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: true,
    field: 'previous_period_score',
    comment: '上期得分'
  },
  scoreChangeRate: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true,
    field: 'score_change_rate',
    comment: '得分变化率'
  },
  trendDirection: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'trend_direction',
    validate: {
      isIn: [['improving', 'stable', 'declining', 'volatile']]
    },
    comment: '趋势方向'
  },
  
  // 计算时间戳
  calculatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'calculated_at',
    defaultValue: DataTypes.NOW,
    comment: '计算时间'
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
  tableName: 'three_dimensional_calculation_results',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '三维模型计算结果表',
  indexes: [
    {
      fields: ['employee_id', 'calculation_period'],
      name: 'idx_calculation_result_employee_period'
    },
    {
      fields: ['weight_config_id', 'calculation_period'],
      name: 'idx_calculation_result_config_period'
    },
    {
      fields: ['calculation_period', 'final_score'],
      name: 'idx_calculation_result_period_score'
    },
    {
      fields: ['bonus_pool_id', 'final_score'],
      name: 'idx_calculation_result_pool_score'
    },
    {
      fields: ['review_status', 'calculated_at'],
      name: 'idx_calculation_result_review_time'
    },
    {
      fields: ['score_rank', 'percentile_rank'],
      name: 'idx_calculation_result_rankings'
    },
    {
      unique: true,
      fields: ['employee_id', 'weight_config_id', 'calculation_period'],
      name: 'unique_employee_config_period'
    }
  ],
  hooks: {
    beforeSave: (instance) => {
      // 自动计算最终得分
      if (instance.adjustedScore !== null) {
        instance.finalScore = instance.adjustedScore
      } else {
        instance.finalScore = instance.totalScore
      }
      
      // 自动计算维度贡献率
      if (instance.totalScore > 0) {
        instance.profitContributionRate = (instance.weightedProfitScore / instance.totalScore) * 100
        instance.positionValueRate = (instance.weightedPositionScore / instance.totalScore) * 100
        instance.performanceRate = (instance.weightedPerformanceScore / instance.totalScore) * 100
      }
      
      // 计算得分变化率
      if (instance.previousPeriodScore && instance.previousPeriodScore > 0) {
        instance.scoreChangeRate = ((instance.finalScore - instance.previousPeriodScore) / instance.previousPeriodScore) * 100
        
        // 确定趋势方向
        if (instance.scoreChangeRate > 10) {
          instance.trendDirection = 'improving'
        } else if (instance.scoreChangeRate < -10) {
          instance.trendDirection = 'declining'
        } else if (Math.abs(instance.scoreChangeRate) <= 5) {
          instance.trendDirection = 'stable'
        } else {
          instance.trendDirection = 'volatile'
        }
      }
      
      // 异常值检测
      if (instance.finalScore > 0) {
        // 简单的异常值检测逻辑
        if (instance.finalScore < 0.1 || instance.finalScore > 10) {
          instance.outlierFlag = true
          instance.outlierReason = '得分超出正常范围'
        }
        
        // 数据完整性检查
        if (!instance.profitContributionScore || !instance.positionValueScore || !instance.performanceScore) {
          instance.dataCompleteness = 66.67
          instance.calculationConfidence = 60
        }
      }
    }
  }
})

module.exports = ThreeDimensionalCalculationResult