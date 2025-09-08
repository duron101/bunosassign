const { createModel } = require('../adapters/model-adapter')

const Employee = createModel('employees')

// 为了向后兼容，添加静态属性
Employee.attributes = {
  id: { type: 'INTEGER', primaryKey: true, autoIncrement: true },
  employeeNo: { type: 'STRING', allowNull: false, unique: true },
  name: { type: 'STRING', allowNull: false },
  departmentId: { type: 'STRING', allowNull: false },
  positionId: { type: 'STRING', allowNull: false },
  annualSalary: { type: 'DECIMAL', allowNull: false },
  entryDate: { type: 'DATEONLY', allowNull: false },
  status: { type: 'INTEGER', allowNull: false, defaultValue: 1 },
  userId: { type: 'INTEGER', allowNull: true },
  phone: { type: 'STRING', allowNull: true },
  email: { type: 'STRING', allowNull: true },
  idCard: { type: 'STRING', allowNull: true },
  emergencyContact: { type: 'STRING', allowNull: true },
  emergencyPhone: { type: 'STRING', allowNull: true },
  address: { type: 'TEXT', allowNull: true }
}

module.exports = Employee