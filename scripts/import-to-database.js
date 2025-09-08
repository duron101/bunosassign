#!/usr/bin/env node

/**
 * 数据库数据导入脚本
 * 将 bonus_system.json 中的数据导入到真实数据库
 */

const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');
const sqlite3 = require('sqlite');

// 数据库配置
const DB_CONFIG = {
  dialect: 'sqlite',
  storage: process.env.DB_STORAGE || path.join(__dirname, '../database/bonus_system.db'),
  logging: process.env.ENABLE_DB_LOGGING === 'true' ? console.log : false,
  // JavaScript SQLite 特定配置
  dialectOptions: {
    // 使用标准的 SQLite 模式常量
    mode: 0x00000002 | 0x00000004  // OPEN_READWRITE | OPEN_CREATE
  }
};

// 数据库连接
const sequelize = new Sequelize(DB_CONFIG);

// 数据文件路径
const DATA_FILE = path.join(__dirname, '../database/bonus_system.json');

// 读取JSON数据
function loadJsonData() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ 读取数据文件失败:', error.message);
    process.exit(1);
  }
}

// 测试数据库连接
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    process.exit(1);
  }
}

// 定义模型
function defineModels() {
  console.log('🔄 定义数据模型...');
  
  // 业务线模型
  const BusinessLine = sequelize.define('BusinessLine', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT
    },
    weight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    }
  }, {
    tableName: 'business_lines',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // 部门模型
  const Department = sequelize.define('Department', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    businessLineId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    managerId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    sort: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'departments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // 岗位模型
  const Position = sequelize.define('Position', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    level: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    benchmarkValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    businessLineId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    }
  }, {
    tableName: 'positions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // 员工模型
  const Employee = sequelize.define('Employee', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    employeeNo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    positionId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    annualSalary: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    entryDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(20)
    },
    email: {
      type: DataTypes.STRING(100)
    },
    idCard: {
      type: DataTypes.STRING(18)
    },
    emergencyContact: {
      type: DataTypes.STRING(100)
    },
    emergencyPhone: {
      type: DataTypes.STRING(20)
    },
    address: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    resignDate: {
      type: DataTypes.DATEONLY
    },
    resignReason: {
      type: DataTypes.TEXT
    },
    handoverStatus: {
      type: DataTypes.STRING(50)
    },
    userId: {
      type: DataTypes.INTEGER
    }
  }, {
    tableName: 'employees',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // 用户模型
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    realName: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(100)
    },
    phone: {
      type: DataTypes.STRING(20)
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    departmentId: {
      type: DataTypes.INTEGER
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    lastLogin: {
      type: DataTypes.DATE
    }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // 角色模型
  const Role = sequelize.define('Role', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT
    },
    permissions: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    }
  }, {
    tableName: 'roles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return {
    BusinessLine,
    Department,
    Position,
    Employee,
    User,
    Role
  };
}

// 定义关联关系
function defineAssociations(models) {
  console.log('🔄 定义模型关联关系...');
  
  const { BusinessLine, Department, Position, Employee, User, Role } = models;

  // 业务线与部门关联
  BusinessLine.hasMany(Department, { foreignKey: 'businessLineId' });
  Department.belongsTo(BusinessLine, { foreignKey: 'businessLineId' });

  // 部门与员工关联
  Department.hasMany(Employee, { foreignKey: 'departmentId' });
  Employee.belongsTo(Department, { foreignKey: 'departmentId' });

  // 岗位与员工关联
  Position.hasMany(Employee, { foreignKey: 'positionId' });
  Employee.belongsTo(Position, { foreignKey: 'positionId' });

  // 用户与员工关联
  User.hasOne(Employee, { foreignKey: 'userId' });
  Employee.belongsTo(User, { foreignKey: 'userId' });

  // 角色与用户关联
  Role.hasMany(User, { foreignKey: 'roleId' });
  User.belongsTo(Role, { foreignKey: 'roleId' });

  console.log('✅ 模型关联关系定义完成');
}

// 同步数据库表结构
async function syncDatabase(models) {
  console.log('🔄 同步数据库表结构...');
  
  try {
    await sequelize.sync({ force: true }); // 注意：这会删除现有表
    console.log('✅ 数据库表结构同步完成');
  } catch (error) {
    console.error('❌ 数据库表结构同步失败:', error.message);
    throw error;
  }
}

// 导入业务线数据
async function importBusinessLines(models, jsonData) {
  console.log('🔄 导入业务线数据...');
  
  try {
    const businessLines = jsonData.data.businessLines || [];
    const createdLines = await models.BusinessLine.bulkCreate(businessLines);
    
    console.log(`✅ 业务线数据导入完成，共 ${createdLines.length} 条`);
    return createdLines;
  } catch (error) {
    console.error('❌ 业务线数据导入失败:', error.message);
    throw error;
  }
}

// 导入部门数据
async function importDepartments(models, jsonData) {
  console.log('🔄 导入部门数据...');
  
  try {
    const departments = jsonData.data.departments || [];
    const createdDepartments = await models.Department.bulkCreate(departments);
    
    console.log(`✅ 部门数据导入完成，共 ${createdDepartments.length} 条`);
    return createdDepartments;
  } catch (error) {
    console.error('❌ 部门数据导入失败:', error.message);
    throw error;
  }
}

// 导入岗位数据
async function importPositions(models, jsonData) {
  console.log('🔄 导入岗位数据...');
  
  try {
    const positions = jsonData.data.positions || [];
    const createdPositions = await models.Position.bulkCreate(positions);
    
    console.log(`✅ 岗位数据导入完成，共 ${createdPositions.length} 条`);
    return createdPositions;
  } catch (error) {
    console.error('❌ 岗位数据导入失败:', error.message);
    throw error;
  }
}

// 导入角色数据
async function importRoles(models, jsonData) {
  console.log('🔄 导入角色数据...');
  
  try {
    const roles = jsonData.data.roles || [];
    const createdRoles = await models.Role.bulkCreate(roles);
    
    console.log(`✅ 角色数据导入完成，共 ${createdRoles.length} 条`);
    return createdRoles;
  } catch (error) {
    console.error('❌ 角色数据导入失败:', error.message);
    throw error;
  }
}

// 导入用户数据
async function importUsers(models, jsonData) {
  console.log('🔄 导入用户数据...');
  
  try {
    const users = jsonData.data.users || [];
    
    // 为每个用户设置默认密码
    const usersWithPassword = users.map(user => ({
      ...user,
      password: '$2b$10$default.hash.for.development' // 默认密码哈希
    }));
    
    const createdUsers = await models.User.bulkCreate(usersWithPassword);
    
    console.log(`✅ 用户数据导入完成，共 ${createdUsers.length} 条`);
    return createdUsers;
  } catch (error) {
    console.error('❌ 用户数据导入失败:', error.message);
    throw error;
  }
}

// 导入员工数据
async function importEmployees(models, jsonData) {
  console.log('🔄 导入员工数据...');
  
  try {
    const employees = jsonData.data.employees || [];
    const createdEmployees = await models.Employee.bulkCreate(employees);
    
    console.log(`✅ 员工数据导入完成，共 ${createdEmployees.length} 条`);
    return createdEmployees;
  } catch (error) {
    console.error('❌ 员工数据导入失败:', error.message);
    throw error;
  }
}

// 主函数
async function main() {
  try {
    console.log('🚀 开始数据库数据导入...');
    console.log('=====================================');
    
    // 测试数据库连接
    await testConnection();
    
    // 读取JSON数据
    const jsonData = loadJsonData();
    console.log(`✅ 数据文件读取成功，包含 ${Object.keys(jsonData.data).length} 个数据表`);
    
    // 定义模型
    const models = defineModels();
    
    // 定义关联关系
    defineAssociations(models);
    
    // 同步数据库表结构
    await syncDatabase(models);
    
    // 按顺序导入数据（因为有外键依赖）
    console.log('\n📥 开始导入数据...');
    
    const businessLines = await importBusinessLines(models, jsonData);
    const departments = await importDepartments(models, jsonData);
    const positions = await importPositions(models, jsonData);
    const roles = await importRoles(models, jsonData);
    const users = await importUsers(models, jsonData);
    const employees = await importEmployees(models, jsonData);
    
    console.log('\n🎉 数据导入完成！');
    console.log('=====================================');
    console.log(`📊 导入统计:`);
    console.log(`   业务线: ${businessLines.length} 条`);
    console.log(`   部门: ${departments.length} 条`);
    console.log(`   岗位: ${positions.length} 条`);
    console.log(`   角色: ${roles.length} 条`);
    console.log(`   用户: ${users.length} 条`);
    console.log(`   员工: ${employees.length} 条`);
    console.log('\n💡 现在前端应该可以从数据库获取数据了！');
    
  } catch (error) {
    console.error('\n❌ 数据导入失败:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('\n🔌 数据库连接已关闭');
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = { main };
