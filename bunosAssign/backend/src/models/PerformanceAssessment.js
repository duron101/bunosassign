const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const PerformanceAssessment = sequelize.define('PerformanceAssessment', {
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
  assessmentPeriod: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'assessment_period',
    validate: {
      len: [4, 20]
    },
    comment: '评估期间，格式：YYYY-MM 或 YYYY-Q1'
  },
  assessmentType: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'assessment_type',
    validate: {
      isIn: [['monthly', 'quarterly', 'annual', 'project', 'probation', 'special']]
    },
    comment: '评估类型：月度/季度/年度/项目/试用期/专项'
  },
  
  // 评估状态
  assessmentStatus: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'assessment_status',
    defaultValue: 'draft',
    validate: {
      isIn: [['draft', 'in_progress', 'self_completed', 'manager_reviewing', 'hr_reviewing', 'completed', 'archived']]
    },
    comment: '评估状态'
  },
  
  // 评估人员
  selfAssessmentBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'self_assessment_by',
    comment: '自评人ID'
  },
  managerAssessmentBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'manager_assessment_by',
    comment: '主管评估人ID'
  },
  hrReviewBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'hr_review_by',
    comment: 'HR审核人ID'
  },
  finalApprovalBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'final_approval_by',
    comment: '最终审批人ID'
  },
  
  // 评估时间节点
  selfAssessmentDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'self_assessment_date',
    comment: '自评完成时间'
  },
  managerAssessmentDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'manager_assessment_date',
    comment: '主管评估完成时间'
  },
  hrReviewDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'hr_review_date',
    comment: 'HR审核完成时间'
  },
  finalApprovalDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'final_approval_date',
    comment: '最终审批时间'
  },
  
  // 总体评分
  overallSelfScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'overall_self_score',
    validate: {
      min: 0,
      max: 100
    },
    comment: '总体自评分'
  },
  overallManagerScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'overall_manager_score',
    validate: {
      min: 0,
      max: 100
    },
    comment: '总体主管评分'
  },
  overallFinalScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'overall_final_score',
    validate: {
      min: 0,
      max: 100
    },
    comment: '总体最终得分'
  },
  
  // 等级评定
  performanceGrade: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'performance_grade',
    validate: {
      isIn: [['S', 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D']]
    },
    comment: '绩效等级'
  },
  performanceRanking: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'performance_ranking',
    comment: '绩效排名'
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
  
  // 系数计算
  baseCoefficient: {
    type: DataTypes.DECIMAL(4, 3),
    allowNull: true,
    field: 'base_coefficient',
    validate: {
      min: 0,
      max: 2.0
    },
    comment: '基础系数'
  },
  adjustmentCoefficient: {
    type: DataTypes.DECIMAL(4, 3),
    allowNull: true,
    field: 'adjustment_coefficient',
    validate: {
      min: -0.5,
      max: 0.5
    },
    comment: '调整系数'
  },
  finalCoefficient: {
    type: DataTypes.DECIMAL(4, 3),
    allowNull: true,
    field: 'final_coefficient',
    validate: {
      min: 0,
      max: 2.5
    },
    comment: '最终系数'
  },
  
  // 各维度得分汇总
  workOutputScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'work_output_score',
    comment: '工作产出得分'
  },
  workQualityScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'work_quality_score',
    comment: '工作质量得分'
  },
  workEfficiencyScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'work_efficiency_score',
    comment: '工作效率得分'
  },
  collaborationScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'collaboration_score',
    comment: '协作能力得分'
  },
  innovationScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'innovation_score',
    comment: '创新能力得分'
  },
  leadershipScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'leadership_score',
    comment: '领导力得分'
  },
  learningScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'learning_score',
    comment: '学习能力得分'
  },
  behaviorScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'behavior_score',
    comment: '行为表现得分'
  },
  
  // 关键成就和改进点
  keyAchievements: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'key_achievements',
    comment: '关键成就JSON数组'
  },
  improvementAreas: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'improvement_areas',
    comment: '改进领域JSON数组'
  },
  developmentPlan: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'development_plan',
    comment: '发展计划JSON'
  },
  
  // 评语和反馈
  selfComments: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'self_comments',
    comment: '自评意见'
  },
  managerComments: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'manager_comments',
    comment: '主管评语'
  },
  hrComments: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'hr_comments',
    comment: 'HR意见'
  },
  finalComments: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'final_comments',
    comment: '最终评语'
  },
  
  // 目标设定
  nextPeriodGoals: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'next_period_goals',
    comment: '下期目标JSON数组'
  },
  careerDevelopmentSuggestions: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'career_development_suggestions',
    comment: '职业发展建议'
  },
  
  // 计算参数和元数据
  calculationMethod: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'calculation_method',
    defaultValue: 'weighted_average',
    comment: '计算方法'
  },
  calculationParams: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'calculation_params',
    comment: '计算参数JSON'
  },
  dataSource: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'data_source',
    comment: '数据来源统计JSON'
  },
  
  // 校准信息
  calibrationSession: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'calibration_session',
    comment: '校准会议标识'
  },
  calibrationAdjustment: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'calibration_adjustment',
    comment: '校准调整分数'
  },
  calibrationComments: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'calibration_comments',
    comment: '校准意见'
  },
  
  // 版本管理
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
    comment: '父评估记录ID'
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
  tableName: 'performance_assessments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '绩效评估记录表',
  indexes: [
    {
      fields: ['employee_id', 'assessment_period'],
      name: 'idx_assessment_employee_period'
    },
    {
      fields: ['assessment_type', 'assessment_status'],
      name: 'idx_assessment_type_status'
    },
    {
      fields: ['assessment_period', 'performance_grade'],
      name: 'idx_assessment_period_grade'
    },
    {
      fields: ['final_coefficient', 'percentile_rank'],
      name: 'idx_assessment_performance_metrics'
    },
    {
      unique: true,
      fields: ['employee_id', 'assessment_period', 'assessment_type', 'version'],
      name: 'unique_employee_assessment'
    }
  ],
  hooks: {
    beforeSave: async (instance) => {
      // 自动计算最终系数
      if (instance.baseCoefficient !== null && instance.adjustmentCoefficient !== null) {
        instance.finalCoefficient = Math.max(0, Math.min(2.5, 
          instance.baseCoefficient + instance.adjustmentCoefficient
        ))
      }
      
      // 根据最终得分计算等级
      if (instance.overallFinalScore !== null && !instance.performanceGrade) {
        instance.performanceGrade = calculatePerformanceGrade(instance.overallFinalScore)
      }
      
      // 根据等级计算基础系数
      if (instance.performanceGrade && !instance.baseCoefficient) {
        instance.baseCoefficient = calculateBaseCoefficient(instance.performanceGrade)
      }
    }
  }
})

// 计算绩效等级的辅助函数
function calculatePerformanceGrade(score) {
  if (score >= 95) return 'S'
  if (score >= 90) return 'A+'
  if (score >= 85) return 'A'
  if (score >= 80) return 'B+'
  if (score >= 75) return 'B'
  if (score >= 70) return 'C+'
  if (score >= 65) return 'C'
  return 'D'
}

// 计算基础系数的辅助函数
function calculateBaseCoefficient(grade) {
  const coefficients = {
    'S': 1.5,
    'A+': 1.3,
    'A': 1.2,
    'B+': 1.1,
    'B': 1.0,
    'C+': 0.9,
    'C': 0.8,
    'D': 0.6
  }
  return coefficients[grade] || 1.0
}

module.exports = PerformanceAssessment