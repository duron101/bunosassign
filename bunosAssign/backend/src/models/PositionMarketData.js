const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const PositionMarketData = sequelize.define('PositionMarketData', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  positionCategory: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'position_category',
    comment: '岗位类别'
  },
  positionTitle: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'position_title',
    comment: '岗位名称'
  },
  level: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '岗位等级'
  },
  
  // 地理位置信息
  region: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '全国']]
    },
    comment: '地区'
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '城市'
  },
  
  // 行业信息
  industry: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [['互联网', '金融', '制造业', '教育', '医疗', '零售', '房地产', '能源', '其他']]
    },
    comment: '行业'
  },
  companySize: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'company_size',
    validate: {
      isIn: [['startup', 'small', 'medium', 'large', 'enterprise']]
    },
    comment: '公司规模：创业/小型/中型/大型/企业级'
  },
  
  // 薪酬数据
  baseSalaryMin: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'base_salary_min',
    comment: '基本薪资最低值'
  },
  baseSalaryMax: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'base_salary_max',
    comment: '基本薪资最高值'
  },
  baseSalaryMedian: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'base_salary_median',
    comment: '基本薪资中位数'
  },
  totalCompensationMin: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'total_compensation_min',
    comment: '总薪酬最低值'
  },
  totalCompensationMax: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'total_compensation_max',
    comment: '总薪酬最高值'
  },
  totalCompensationMedian: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'total_compensation_median',
    comment: '总薪酬中位数'
  },
  
  // 福利和奖金
  bonusPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'bonus_percentage',
    comment: '奖金占比'
  },
  stockOptionsValue: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'stock_options_value',
    comment: '股票期权价值'
  },
  benefitsValue: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    field: 'benefits_value',
    comment: '福利价值'
  },
  
  // 技能要求和价值指标
  skillRequirements: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'skill_requirements',
    comment: '技能要求JSON'
  },
  experienceYearsMin: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'experience_years_min',
    comment: '最少工作年限'
  },
  experienceYearsMax: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'experience_years_max',
    comment: '最多工作年限'
  },
  educationRequirement: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'education_requirement',
    validate: {
      isIn: [['高中', '大专', '本科', '硕士', '博士', '不限']]
    },
    comment: '学历要求'
  },
  
  // 市场稀缺性指标
  demandIndex: {
    type: DataTypes.DECIMAL(3, 1),
    allowNull: true,
    field: 'demand_index',
    validate: {
      min: 0,
      max: 10
    },
    comment: '需求指数 (0-10)'
  },
  supplyIndex: {
    type: DataTypes.DECIMAL(3, 1),
    allowNull: true,
    field: 'supply_index',
    validate: {
      min: 0,
      max: 10
    },
    comment: '供给指数 (0-10)'
  },
  competitionIndex: {
    type: DataTypes.DECIMAL(3, 1),
    allowNull: true,
    field: 'competition_index',
    validate: {
      min: 0,
      max: 10
    },
    comment: '竞争激烈程度指数 (0-10)'
  },
  growthTrend: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'growth_trend',
    comment: '增长趋势百分比'
  },
  
  // 数据源和质量
  dataSource: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'data_source',
    comment: '数据来源'
  },
  dataQuality: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'data_quality',
    defaultValue: 'medium',
    validate: {
      isIn: [['high', 'medium', 'low']]
    },
    comment: '数据质量'
  },
  sampleSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'sample_size',
    comment: '样本数量'
  },
  confidenceLevel: {
    type: DataTypes.DECIMAL(3, 1),
    allowNull: true,
    field: 'confidence_level',
    comment: '置信度'
  },
  
  // 数据有效期
  dataCollectionDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'data_collection_date',
    comment: '数据收集日期'
  },
  validityPeriod: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'validity_period',
    defaultValue: '12months',
    comment: '有效期'
  },
  expiryDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'expiry_date',
    comment: '数据过期日期'
  },
  
  // 备注和标签
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '标签JSON数组'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '备注'
  },
  
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'outdated', 'deprecated', 'verified']]
    },
    comment: '状态：有效/过时/废弃/已验证'
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
  tableName: 'position_market_data',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '岗位市场数据表',
  indexes: [
    {
      fields: ['position_category', 'level'],
      name: 'idx_market_data_category_level'
    },
    {
      fields: ['region', 'industry'],
      name: 'idx_market_data_region_industry'
    },
    {
      fields: ['data_collection_date', 'status'],
      name: 'idx_market_data_date_status'
    },
    {
      fields: ['position_title', 'level', 'region'],
      name: 'idx_market_data_search'
    }
  ],
  hooks: {
    beforeSave: (instance) => {
      // 自动设置过期日期
      if (instance.dataCollectionDate && !instance.expiryDate) {
        const expiryDate = new Date(instance.dataCollectionDate)
        switch (instance.validityPeriod) {
          case '6months':
            expiryDate.setMonth(expiryDate.getMonth() + 6)
            break
          case '12months':
            expiryDate.setFullYear(expiryDate.getFullYear() + 1)
            break
          case '24months':
            expiryDate.setFullYear(expiryDate.getFullYear() + 2)
            break
          default:
            expiryDate.setFullYear(expiryDate.getFullYear() + 1)
        }
        instance.expiryDate = expiryDate
      }
      
      // 检查数据是否过期
      if (instance.expiryDate && new Date() > instance.expiryDate && instance.status === 'active') {
        instance.status = 'outdated'
      }
    }
  }
})

module.exports = PositionMarketData