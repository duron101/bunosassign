const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const EmployeeBonusRecord = sequelize.define('EmployeeBonusRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  poolId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'pool_id'
  },
  employeeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'employee_id'
  },
  departmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'department_id'
  },
  lineId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'line_id'
  },
  positionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'position_id'
  },
  benchmarkValue: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    field: 'benchmark_value',
    validate: {
      min: 0
    }
  },
  performanceCoefficient: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    field: 'performance_coefficient',
    validate: {
      min: 0,
      max: 1.2
    }
  },
  basicPoints: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    field: 'basic_points',
    validate: {
      min: 0
    }
  },
  basicBonus: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'basic_bonus',
    validate: {
      min: 0
    }
  },
  excellenceRating: {
    type: DataTypes.STRING(5),
    allowNull: true,
    field: 'excellence_rating',
    validate: {
      isIn: [['A+', 'A', 'B', 'C', '-']]
    }
  },
  excellenceBonus: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'excellence_bonus',
    validate: {
      min: 0
    }
  },
  totalBonus: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'total_bonus',
    validate: {
      min: 0
    }
  },
  historyAverage: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    field: 'history_average',
    validate: {
      min: 0
    }
  },
  minimumBonus: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    field: 'minimum_bonus',
    validate: {
      min: 0
    }
  },
  finalBonus: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'final_bonus',
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'calculated',
    validate: {
      isIn: [['calculated', 'confirmed', 'paid']]
    }
  }
}, {
  tableName: 'employee_bonus_records',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '员工奖金记录表'
})

module.exports = EmployeeBonusRecord