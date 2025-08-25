const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const PositionValueAssessment = sequelize.define('PositionValueAssessment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  positionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'position_id',
    comment: '岗位ID'
  },
  criteriaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'criteria_id',
    comment: '评估标准ID'
  },
  assessmentPeriod: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'assessment_period',
    validate: {
      len: [4, 20]
    },
    comment: '评估期间，格式：YYYY 或 YYYY-H1/H2'
  },
  
  // 各维度评分
  skillComplexityScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'skill_complexity_score',
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    },
    comment: '技能复杂度得分'
  },
  responsibilityScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'responsibility_score',
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    },
    comment: '责任范围得分'
  },
  decisionImpactScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'decision_impact_score',
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    },
    comment: '决策影响得分'
  },
  experienceRequiredScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'experience_required_score',
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    },
    comment: '经验要求得分'
  },
  marketValueScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'market_value_score',
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    },
    comment: '市场价值得分'
  },
  
  // 计算结果
  totalScore: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false,
    field: 'total_score',
    defaultValue: 0,
    comment: '总分'
  },
  weightedScore: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: false,
    field: 'weighted_score',
    defaultValue: 0,
    comment: '加权得分'
  },
  normalizedValue: {
    type: DataTypes.DECIMAL(5, 4),
    allowNull: false,
    field: 'normalized_value',
    defaultValue: 0,
    validate: {
      min: 0,
      max: 10
    },
    comment: '标准化价值 (0-10)'
  },
  
  // 评估等级
  valueGrade: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'value_grade',
    validate: {
      isIn: [['S', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D']]
    },
    comment: '价值等级'
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
  
  // 市场对标数据
  marketBenchmarkData: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'market_benchmark_data',
    comment: '市场对标数据JSON'
  },
  industryComparison: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'industry_comparison',
    comment: '行业对比数据JSON'
  },
  
  // 评估方法和参数
  assessmentMethod: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'assessment_method',
    defaultValue: 'manual',
    validate: {
      isIn: [['manual', 'algorithm', 'hybrid', 'market_based']]
    },
    comment: '评估方法：手工/算法/混合/市场基准'
  },
  calculationParams: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'calculation_params',
    comment: '计算参数JSON'
  },
  
  // 详细评估信息
  assessmentDetails: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'assessment_details',
    comment: '评估详情JSON'
  },
  strengthsWeaknesses: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'strengths_weaknesses',
    comment: '优势劣势分析JSON'
  },
  improvementSuggestions: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'improvement_suggestions',
    comment: '改进建议'
  },
  
  // 审核状态
  reviewStatus: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'review_status',
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'approved', 'rejected', 'revision_required']]
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
  
  // 历史版本管理
  version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '版本号'
  },
  parentAssessmentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'parent_assessment_id',
    comment: '父评估记录ID（版本追踪）'
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
  tableName: 'position_value_assessments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '岗位价值评估记录表',
  indexes: [
    {
      fields: ['position_id', 'assessment_period'],
      name: 'idx_assessment_position_period'
    },
    {
      fields: ['criteria_id', 'assessment_period'],
      name: 'idx_assessment_criteria_period'
    },
    {
      fields: ['review_status', 'assessment_period'],
      name: 'idx_assessment_status_period'
    },
    {
      fields: ['value_grade', 'normalized_value'],
      name: 'idx_assessment_grade_value'
    },
    {
      unique: true,
      fields: ['position_id', 'criteria_id', 'assessment_period', 'version'],
      name: 'unique_position_assessment'
    }
  ],
  hooks: {
    beforeSave: async (instance) => {
      // 自动计算总分和加权得分
      const scores = [
        instance.skillComplexityScore,
        instance.responsibilityScore,
        instance.decisionImpactScore,
        instance.experienceRequiredScore,
        instance.marketValueScore
      ]
      
      instance.totalScore = scores.reduce((sum, score) => sum + score, 0)
      
      // 如果有关联的标准，计算加权得分
      if (instance.criteriaId) {
        const PositionValueCriteria = require('./PositionValueCriteria')
        const criteria = await PositionValueCriteria.findByPk(instance.criteriaId)
        
        if (criteria) {
          instance.weightedScore = 
            instance.skillComplexityScore * criteria.skillComplexityWeight +
            instance.responsibilityScore * criteria.responsibilityWeight +
            instance.decisionImpactScore * criteria.decisionImpactWeight +
            instance.experienceRequiredScore * criteria.experienceRequiredWeight +
            instance.marketValueScore * criteria.marketValueWeight
          
          // 标准化到0-10范围
          instance.normalizedValue = (instance.weightedScore / criteria.maxScore) * 10
          
          // 计算等级
          instance.valueGrade = calculateGrade(instance.normalizedValue)
        }
      }
    }
  }
})

// 计算价值等级的辅助函数
function calculateGrade(normalizedValue) {
  if (normalizedValue >= 9.5) return 'S'
  if (normalizedValue >= 9.0) return 'A+'
  if (normalizedValue >= 8.0) return 'A'
  if (normalizedValue >= 7.5) return 'B+'
  if (normalizedValue >= 7.0) return 'B'
  if (normalizedValue >= 6.5) return 'C+'
  if (normalizedValue >= 6.0) return 'C'
  return 'D'
}

module.exports = PositionValueAssessment