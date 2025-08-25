const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const BonusAllocationResult = sequelize.define('BonusAllocationResult', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  bonusPoolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'bonus_pool_id',
    comment: '奖金池ID'
  },
  allocationRuleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'allocation_rule_id',
    comment: '分配规则ID'
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'employee_id',
    comment: '员工ID'
  },
  calculationResultId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'calculation_result_id',
    comment: '三维计算结果ID'
  },
  
  // 基础信息
  allocationPeriod: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'allocation_period',
    validate: {
      len: [4, 20]
    },
    comment: '分配期间，格式：YYYY-MM 或 YYYY-Q1'
  },
  allocationDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'allocation_date',
    defaultValue: DataTypes.NOW,
    comment: '分配执行日期'
  },
  
  // 得分信息
  originalScore: {
    type: DataTypes.DECIMAL(8, 4),
    allowNull: false,
    field: 'original_score',
    defaultValue: 0,
    comment: '原始三维得分'
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
    comment: '最终用于分配的得分'
  },
  
  // 排名信息
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
  tierLevel: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'tier_level',
    comment: '分层等级（A/B/C/D等）'
  },
  
  // 分配系数
  baseAllocationCoeff: {
    type: DataTypes.DECIMAL(8, 6),
    allowNull: false,
    field: 'base_allocation_coeff',
    defaultValue: 1.0,
    comment: '基础分配系数'
  },
  performanceCoeff: {
    type: DataTypes.DECIMAL(8, 6),
    allowNull: false,
    field: 'performance_coeff',
    defaultValue: 1.0,
    comment: '绩效系数'
  },
  positionCoeff: {
    type: DataTypes.DECIMAL(8, 6),
    allowNull: false,
    field: 'position_coeff',
    defaultValue: 1.0,
    comment: '岗位系数'
  },
  departmentCoeff: {
    type: DataTypes.DECIMAL(8, 6),
    allowNull: false,
    field: 'department_coeff',
    defaultValue: 1.0,
    comment: '部门系数'
  },
  specialCoeff: {
    type: DataTypes.DECIMAL(8, 6),
    allowNull: false,
    field: 'special_coeff',
    defaultValue: 1.0,
    comment: '特殊调整系数'
  },
  finalCoeff: {
    type: DataTypes.DECIMAL(8, 6),
    allowNull: false,
    field: 'final_coeff',
    defaultValue: 1.0,
    comment: '最终综合系数'
  },
  
  // 奖金金额计算
  baseAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'base_amount',
    defaultValue: 0,
    comment: '基础奖金金额'
  },
  performanceAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'performance_amount',
    defaultValue: 0,
    comment: '绩效奖金金额'
  },
  adjustmentAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'adjustment_amount',
    defaultValue: 0,
    comment: '调整金额'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'total_amount',
    defaultValue: 0,
    comment: '总奖金金额'
  },
  
  // 保障与限制
  minAmountApplied: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    field: 'min_amount_applied',
    defaultValue: false,
    comment: '是否应用了最小金额保障'
  },
  maxAmountApplied: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    field: 'max_amount_applied',
    defaultValue: false,
    comment: '是否应用了最大金额限制'
  },
  originalCalculatedAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    field: 'original_calculated_amount',
    comment: '原始计算金额（保障/限制前）'
  },
  
  // 分配占比
  poolAllocationRatio: {
    type: DataTypes.DECIMAL(8, 6),
    allowNull: false,
    field: 'pool_allocation_ratio',
    defaultValue: 0,
    comment: '占总奖金池比例'
  },
  departmentAllocationRatio: {
    type: DataTypes.DECIMAL(8, 6),
    allowNull: false,
    field: 'department_allocation_ratio',
    defaultValue: 0,
    comment: '占部门奖金比例'
  },
  
  // 计算细节
  calculationDetails: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'calculation_details',
    comment: '详细计算过程JSON'
  },
  appliedRules: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'applied_rules',
    comment: '应用的规则列表JSON'
  },
  
  // 员工信息快照
  employeeName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'employee_name',
    comment: '员工姓名（快照）'
  },
  departmentName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'department_name',
    comment: '部门名称（快照）'
  },
  positionName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'position_name',
    comment: '岗位名称（快照）'
  },
  positionLevel: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'position_level',
    comment: '岗位等级（快照）'
  },
  businessLineName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'business_line_name',
    comment: '业务线名称（快照）'
  },
  
  // 时间信息
  employmentStartDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'employment_start_date',
    comment: '入职日期（快照）'
  },
  workMonths: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'work_months',
    comment: '工作月数'
  },
  eligibleForBonus: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    field: 'eligible_for_bonus',
    defaultValue: true,
    comment: '是否符合奖金发放条件'
  },
  
  // 审核状态
  reviewStatus: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'review_status',
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'approved', 'rejected', 'adjusted', 'locked', 'paid']]
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
  
  // 发放状态
  paymentStatus: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'payment_status',
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'processing', 'paid', 'failed', 'cancelled']]
    },
    comment: '发放状态'
  },
  paymentDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'payment_date',
    comment: '实际发放日期'
  },
  paymentReference: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'payment_reference',
    comment: '发放凭证号'
  },
  
  // 异常标识
  hasAnomalies: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    field: 'has_anomalies',
    defaultValue: false,
    comment: '是否存在异常'
  },
  anomalyReasons: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'anomaly_reasons',
    comment: '异常原因列表JSON'
  },
  
  // 版本控制
  dataVersion: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'data_version',
    comment: '数据版本标识'
  },
  calculationVersion: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'calculation_version',
    comment: '计算版本标识'
  },
  
  // 备注信息
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '备注信息'
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
  tableName: 'bonus_allocation_results',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '奖金分配结果表',
  indexes: [
    {
      fields: ['bonus_pool_id', 'employee_id'],
      name: 'idx_allocation_result_pool_employee'
    },
    {
      fields: ['allocation_period', 'final_score'],
      name: 'idx_allocation_result_period_score'
    },
    {
      fields: ['review_status', 'payment_status'],
      name: 'idx_allocation_result_status'
    },
    {
      fields: ['total_amount', 'allocation_date'],
      name: 'idx_allocation_result_amount_date'
    },
    {
      fields: ['employee_id', 'allocation_period'],
      name: 'idx_allocation_result_employee_period'
    },
    {
      fields: ['department_name', 'allocation_period'],
      name: 'idx_allocation_result_dept_period'
    },
    {
      fields: ['score_rank', 'percentile_rank'],
      name: 'idx_allocation_result_rankings'
    },
    {
      unique: true,
      fields: ['bonus_pool_id', 'employee_id', 'allocation_rule_id'],
      name: 'unique_allocation_result'
    }
  ],
  hooks: {
    beforeSave: (instance) => {
      // 自动计算最终得分
      if (instance.adjustedScore !== null && instance.adjustedScore !== undefined) {
        instance.finalScore = instance.adjustedScore
      } else {
        instance.finalScore = instance.originalScore
      }
      
      // 自动计算最终系数
      instance.finalCoeff = 
        instance.baseAllocationCoeff *
        instance.performanceCoeff *
        instance.positionCoeff *
        instance.departmentCoeff *
        instance.specialCoeff
      
      // 自动计算总金额
      instance.totalAmount = 
        instance.baseAmount + 
        instance.performanceAmount + 
        instance.adjustmentAmount
      
      // 异常检测
      const anomalies = []
      
      // 检测金额异常
      if (instance.totalAmount < 0) {
        anomalies.push('奖金金额为负数')
      }
      if (instance.totalAmount > 1000000) { // 假设100万为异常阈值
        anomalies.push('奖金金额过高')
      }
      
      // 检测系数异常
      if (instance.finalCoeff < 0.1 || instance.finalCoeff > 5.0) {
        anomalies.push('综合系数异常')
      }
      
      // 检测得分异常
      if (instance.finalScore < 0 || instance.finalScore > 10) {
        anomalies.push('最终得分异常')
      }
      
      // 更新异常标识
      instance.hasAnomalies = anomalies.length > 0
      if (anomalies.length > 0) {
        instance.anomalyReasons = anomalies
      }
      
      // 工作月数计算
      if (instance.employmentStartDate && instance.allocationDate) {
        const startDate = new Date(instance.employmentStartDate)
        const endDate = new Date(instance.allocationDate)
        const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                          (endDate.getMonth() - startDate.getMonth())
        instance.workMonths = Math.max(0, monthsDiff)
        
        // 新员工判断（工作不足6个月）
        if (instance.workMonths < 6) {
          instance.eligibleForBonus = false
        }
      }
    }
  }
})

module.exports = BonusAllocationResult