const { sequelize } = require('../config/database')

// 导入核心模型
const User = require('./User')
const Role = require('./Role')
const Department = require('./Department')
const BusinessLine = require('./BusinessLine')
const Position = require('./Position')
const Employee = require('./Employee')

// 简化模型适配器为其他未转换的模型
const { createModel } = require('../adapters/model-adapter')

const PerformanceRecord = createModel('performanceRecords')
const BonusPool = createModel('bonusPools')
const LineBonusAllocation = createModel('lineBonusAllocations')
const EmployeeBonusRecord = createModel('employeeBonusRecords')
const SimulationScenario = createModel('simulationScenarios')
const OperationLog = createModel('operationLogs')
const Project = createModel('projects')
const ProjectLineWeight = createModel('projectLineWeights')
const ProfitData = createModel('profitData')
const EmployeeProfitContribution = createModel('employeeProfitContributions')
const ProfitAllocationRule = createModel('profitAllocationRules')
const PositionValueCriteria = createModel('positionValueCriterias')
const PositionValueAssessment = createModel('positionValueAssessments')
const PositionMarketData = createModel('positionMarketData')
const PerformanceIndicator = createModel('performanceIndicators')
const PerformanceAssessment = createModel('performanceAssessments')
const PerformanceIndicatorData = createModel('performanceIndicatorData')
const ThreeDimensionalWeightConfig = createModel('threeDimensionalWeightConfigs')
const ThreeDimensionalCalculationResult = createModel('threeDimensionalCalculationResults')
const BonusAllocationRule = createModel('bonusAllocationRules')
const BonusAllocationResult = createModel('bonusAllocationResults')

// 项目奖金相关模型
const ProjectMember = require('./ProjectMember')
const ProjectRole = require('./ProjectRole')
const ProjectBonusPool = require('./ProjectBonusPool')
const ProjectBonusAllocation = require('./ProjectBonusAllocation')

// 定义关联关系（简化版，只定义为兼容性）
User.belongsTo = (model, options) => User
Role.hasMany = (model, options) => Role
User.belongsTo = (model, options) => User
Department.hasMany = (model, options) => Department
Department.belongsTo = (model, options) => Department
BusinessLine.hasMany = (model, options) => BusinessLine
Position.belongsTo = (model, options) => Position
Position.hasMany = (model, options) => Position
Employee.belongsTo = (model, options) => Employee
Employee.hasMany = (model, options) => Employee

// 为其他模型添加关联方法
const models = [
  PerformanceRecord, BonusPool, LineBonusAllocation, EmployeeBonusRecord,
  SimulationScenario, OperationLog, Project, ProjectLineWeight, ProfitData,
  EmployeeProfitContribution, ProfitAllocationRule, PositionValueCriteria,
  PositionValueAssessment, PositionMarketData, PerformanceIndicator,
  PerformanceAssessment, PerformanceIndicatorData, ThreeDimensionalWeightConfig,
  ThreeDimensionalCalculationResult, BonusAllocationRule, BonusAllocationResult,
  ProjectMember, ProjectRole, ProjectBonusPool, ProjectBonusAllocation
]

models.forEach(model => {
  model.belongsTo = (targetModel, options) => model
  model.hasMany = (targetModel, options) => model
  model.hasOne = (targetModel, options) => model
})

module.exports = {
  sequelize,
  User,
  Role,
  Department,
  BusinessLine,
  Position,
  Employee,
  PerformanceRecord,
  BonusPool,
  LineBonusAllocation,
  EmployeeBonusRecord,
  SimulationScenario,
  OperationLog,
  Project,
  ProjectLineWeight,
  ProfitData,
  EmployeeProfitContribution,
  ProfitAllocationRule,
  PositionValueCriteria,
  PositionValueAssessment,
  PositionMarketData,
  PerformanceIndicator,
  PerformanceAssessment,
  PerformanceIndicatorData,
  ThreeDimensionalWeightConfig,
  ThreeDimensionalCalculationResult,
  BonusAllocationRule,
  BonusAllocationResult,
  ProjectMember,
  ProjectRole,
  ProjectBonusPool,
  ProjectBonusAllocation
}