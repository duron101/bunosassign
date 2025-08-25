const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const PerformanceIndicatorData = sequelize.define('PerformanceIndicatorData', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  assessmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'assessment_id',
    comment: '绩效评估ID'
  },
  indicatorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'indicator_id',
    comment: '绩效指标ID'
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'employee_id',
    comment: '员工ID'
  },
  period: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      len: [4, 20]
    },
    comment: '期间'
  },
  
  // 实际值记录
  actualValue: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: true,
    field: 'actual_value',
    comment: '实际值'
  },
  targetValue: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: true,
    field: 'target_value',
    comment: '目标值'
  },
  textValue: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'text_value',
    comment: '文本值'
  },
  booleanValue: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    field: 'boolean_value',
    comment: '布尔值'
  },
  enumValue: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'enum_value',
    comment: '枚举值'
  },
  
  // 评分记录
  selfScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'self_score',
    validate: {
      min: 0,
      max: 100
    },
    comment: '自评分'
  },
  managerScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'manager_score',
    validate: {
      min: 0,
      max: 100
    },
    comment: '主管评分'
  },
  finalScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'final_score',
    validate: {
      min: 0,
      max: 100
    },
    comment: '最终得分'
  },
  normalizedScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'normalized_score',
    validate: {
      min: 0,
      max: 100
    },
    comment: '标准化得分'
  },
  
  // 权重和贡献
  weight: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: false,
    defaultValue: 0.1,
    validate: {
      min: 0,
      max: 1
    },
    comment: '权重'
  },
  weightedScore: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: true,
    field: 'weighted_score',
    comment: '加权得分'
  },
  contributionScore: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: true,
    field: 'contribution_score',
    comment: '贡献得分'
  },
  
  // 达成情况分析
  achievementRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'achievement_rate',
    comment: '达成率'
  },
  improvementRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'improvement_rate',
    comment: '改进率（相比上期）'
  },
  trendDirection: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'trend_direction',
    validate: {
      isIn: [['improving', 'stable', 'declining', 'volatile', 'unknown']]
    },
    comment: '趋势方向'
  },
  
  // 等级和排名
  performanceLevel: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'performance_level',
    validate: {
      isIn: [['excellent', 'good', 'meets_expectation', 'below_expectation', 'poor']]
    },
    comment: '表现水平'
  },
  rankInTeam: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'rank_in_team',
    comment: '团队内排名'
  },
  percentileInTeam: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'percentile_in_team',
    comment: '团队内百分位'
  },
  
  // 数据来源和质量
  dataSource: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'data_source',
    defaultValue: 'manual',
    validate: {
      isIn: [['manual', 'system', 'calculated', 'imported', 'third_party']]
    },
    comment: '数据来源'
  },
  dataQuality: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'data_quality',
    defaultValue: 'medium',
    validate: {
      isIn: [['high', 'medium', 'low', 'questionable']]
    },
    comment: '数据质量'
  },
  collectionDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'collection_date',
    comment: '数据收集日期'
  },
  
  // 计算方法和参数
  calculationMethod: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'calculation_method',
    comment: '计算方法'
  },
  calculationParams: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'calculation_params',
    comment: '计算参数JSON'
  },
  
  // 补充信息
  evidenceLinks: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'evidence_links',
    comment: '证据链接JSON数组'
  },
  additionalData: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'additional_data',
    comment: '附加数据JSON'
  },
  
  // 评语和说明
  selfComments: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'self_comments',
    comment: '自评说明'
  },
  managerComments: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'manager_comments',
    comment: '主管评语'
  },
  improvementSuggestions: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'improvement_suggestions',
    comment: '改进建议'
  },
  
  // 历史对比
  previousPeriodValue: {
    type: DataTypes.DECIMAL(15, 4),
    allowNull: true,
    field: 'previous_period_value',
    comment: '上期数值'
  },
  previousPeriodScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'previous_period_score',
    comment: '上期得分'
  },
  yearOverYearChange: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: true,
    field: 'year_over_year_change',
    comment: '同比变化'
  },
  
  // 审核状态
  reviewStatus: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'review_status',
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'reviewed', 'approved', 'rejected', 'adjusted']]
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
  tableName: 'performance_indicator_data',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '绩效指标数据表',
  indexes: [
    {
      fields: ['assessment_id', 'indicator_id'],
      name: 'idx_indicator_data_assessment_indicator'
    },
    {
      fields: ['employee_id', 'period'],
      name: 'idx_indicator_data_employee_period'
    },
    {
      fields: ['indicator_id', 'period'],
      name: 'idx_indicator_data_indicator_period'
    },
    {
      fields: ['final_score', 'normalized_score'],
      name: 'idx_indicator_data_scores'
    },
    {
      fields: ['review_status', 'data_quality'],
      name: 'idx_indicator_data_review_quality'
    }
  ],
  hooks: {
    beforeSave: async (instance) => {
      // 自动计算达成率
      if (instance.actualValue !== null && instance.targetValue !== null && instance.targetValue !== 0) {
        instance.achievementRate = (instance.actualValue / instance.targetValue) * 100
      }
      
      // 自动计算加权得分
      if (instance.finalScore !== null && instance.weight !== null) {
        instance.weightedScore = instance.finalScore * instance.weight
      }
      
      // 自动计算标准化得分
      if (instance.finalScore !== null) {
        instance.normalizedScore = Math.max(0, Math.min(100, instance.finalScore))
      }
      
      // 根据达成率确定表现水平
      if (instance.achievementRate !== null && !instance.performanceLevel) {
        if (instance.achievementRate >= 120) {
          instance.performanceLevel = 'excellent'
        } else if (instance.achievementRate >= 100) {
          instance.performanceLevel = 'good'
        } else if (instance.achievementRate >= 80) {
          instance.performanceLevel = 'meets_expectation'
        } else if (instance.achievementRate >= 60) {
          instance.performanceLevel = 'below_expectation'
        } else {
          instance.performanceLevel = 'poor'
        }
      }
      
      // 计算改进率（相比上期）
      if (instance.actualValue !== null && instance.previousPeriodValue !== null && instance.previousPeriodValue !== 0) {
        instance.improvementRate = ((instance.actualValue - instance.previousPeriodValue) / Math.abs(instance.previousPeriodValue)) * 100
        
        // 确定趋势方向
        if (instance.improvementRate > 5) {
          instance.trendDirection = 'improving'
        } else if (instance.improvementRate < -5) {
          instance.trendDirection = 'declining'
        } else {
          instance.trendDirection = 'stable'
        }
      }
    }
  }
})

module.exports = PerformanceIndicatorData