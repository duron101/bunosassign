#!/usr/bin/env node

/**
 * 使用 NeDB 的数据导入脚本
 * 将 bonus_system.json 中的数据导入到 NeDB 数据库
 */

const fs = require('fs');
const path = require('path');
const DataStore = require('nedb');

// 数据库文件路径
const DB_DIR = path.join(__dirname, '../database');
const DATA_FILE = path.join(__dirname, '../database/bonus_system.json');

// 创建数据库实例
function createDatabases() {
  console.log('🔧 创建 NeDB 数据库实例...');
  
  const databases = {
    businessLines: new DataStore({
      filename: path.join(DB_DIR, 'business_lines.db'),
      autoload: true
    }),
    departments: new DataStore({
      filename: path.join(DB_DIR, 'departments.db'),
      autoload: true
    }),
    positions: new DataStore({
      filename: path.join(DB_DIR, 'positions.db'),
      autoload: true
    }),
    roles: new DataStore({
      filename: path.join(DB_DIR, 'roles.db'),
      autoload: true
    }),
    users: new DataStore({
      filename: path.join(DB_DIR, 'users.db'),
      autoload: true
    }),
    employees: new DataStore({
      filename: path.join(DB_DIR, 'employees.db'),
      autoload: true
    })
  };

  console.log('✅ 数据库实例创建成功');
  return databases;
}

// 创建索引
function createIndexes(databases) {
  console.log('🔧 创建数据库索引...');
  
  return new Promise((resolve, reject) => {
    let completed = 0;
    const total = 6;
    
    const checkComplete = () => {
      completed++;
      if (completed === total) {
        console.log('✅ 所有索引创建完成');
        resolve();
      }
    };

    // 业务线索引
    databases.businessLines.ensureIndex({ fieldName: 'code', unique: true }, (err) => {
      if (err) console.error('❌ 业务线索引创建失败:', err.message);
      else console.log('✅ 业务线索引创建成功');
      checkComplete();
    });
    
    databases.businessLines.ensureIndex({ fieldName: 'name' }, (err) => {
      if (err) console.error('❌ 业务线名称索引创建失败:', err.message);
      checkComplete();
    });

    // 部门索引
    databases.departments.ensureIndex({ fieldName: 'code', unique: true }, (err) => {
      if (err) console.error('❌ 部门索引创建失败:', err.message);
      else console.log('✅ 部门索引创建成功');
      checkComplete();
    });
    
    databases.departments.ensureIndex({ fieldName: 'businessLineId' }, (err) => {
      if (err) console.error('❌ 部门业务线索引创建失败:', err.message);
      checkComplete();
    });

    // 岗位索引
    databases.positions.ensureIndex({ fieldName: 'code', unique: true }, (err) => {
      if (err) console.error('❌ 岗位索引创建失败:', err.message);
      else console.log('✅ 岗位索引创建成功');
      checkComplete();
    });
    
    databases.positions.ensureIndex({ fieldName: 'businessLineId' }, (err) => {
      if (err) console.error('❌ 岗位业务线索引创建失败:', err.message);
      checkComplete();
    });

    // 角色索引
    databases.roles.ensureIndex({ fieldName: 'code', unique: true }, (err) => {
      if (err) console.error('❌ 角色索引创建失败:', err.message);
      else console.log('✅ 角色索引创建成功');
      checkComplete();
    });

    // 用户索引
    databases.users.ensureIndex({ fieldName: 'username', unique: true }, (err) => {
      if (err) console.error('❌ 用户索引创建失败:', err.message);
      else console.log('✅ 用户索引创建成功');
      checkComplete();
    });

    // 员工索引
    databases.employees.ensureIndex({ fieldName: 'employeeNo', unique: true }, (err) => {
      if (err) console.error('❌ 员工索引创建失败:', err.message);
      else console.log('✅ 员工索引创建成功');
      checkComplete();
    });
  });
}

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

// 清空所有数据
function clearAllData(databases) {
  console.log('🗑️  清空现有数据...');
  
  return new Promise((resolve, reject) => {
    let completed = 0;
    const total = 6;
    
    const checkComplete = () => {
      completed++;
      if (completed === total) {
        console.log('✅ 所有现有数据已清空');
        resolve();
      }
    };

    // 清空业务线数据
    databases.businessLines.remove({}, { multi: true }, (err) => {
      if (err) console.error('❌ 清空业务线数据失败:', err.message);
      else console.log('✅ 业务线数据已清空');
      checkComplete();
    });

    // 清空部门数据
    databases.departments.remove({}, { multi: true }, (err) => {
      if (err) console.error('❌ 清空部门数据失败:', err.message);
      else console.log('✅ 部门数据已清空');
      checkComplete();
    });

    // 清空岗位数据
    databases.positions.remove({}, { multi: true }, (err) => {
      if (err) console.error('❌ 清空岗位数据失败:', err.message);
      else console.log('✅ 岗位数据已清空');
      checkComplete();
    });

    // 清空角色数据
    databases.roles.remove({}, { multi: true }, (err) => {
      if (err) console.error('❌ 清空角色数据失败:', err.message);
      else console.log('✅ 角色数据已清空');
      checkComplete();
    });

    // 清空用户数据
    databases.users.remove({}, { multi: true }, (err) => {
      if (err) console.error('❌ 清空用户数据失败:', err.message);
      else console.log('✅ 用户数据已清空');
      checkComplete();
    });

    // 清空员工数据
    databases.employees.remove({}, { multi: true }, (err) => {
      if (err) console.error('❌ 清空员工数据失败:', err.message);
      else console.log('✅ 员工数据已清空');
      checkComplete();
    });
  });
}

// 导入业务线数据
function importBusinessLines(databases, jsonData) {
  return new Promise((resolve, reject) => {
    console.log('🔄 导入业务线数据...');
    
    const businessLines = jsonData.data.businessLines || [];
    if (businessLines.length === 0) {
      console.log('⚠️  没有业务线数据需要导入');
      resolve(0);
      return;
    }

    const data = businessLines.map(line => ({
      name: line.name || '',
      code: line.code || '',
      description: line.description || '',
      weight: line.weight || 0,
      status: line.status || 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    databases.businessLines.insert(data, (err, newDocs) => {
      if (err) {
        console.error('❌ 业务线数据导入失败:', err.message);
        reject(err);
      } else {
        console.log(`✅ 业务线数据导入完成，共 ${newDocs.length} 条`);
        resolve(newDocs.length);
      }
    });
  });
}

// 导入部门数据
function importDepartments(databases, jsonData) {
  return new Promise((resolve, reject) => {
    console.log('🔄 导入部门数据...');
    
    const departments = jsonData.data.departments || [];
    if (departments.length === 0) {
      console.log('⚠️  没有部门数据需要导入');
      resolve(0);
      return;
    }

    const data = departments.map(dept => ({
      name: dept.name || '',
      code: dept.code || '',
      description: dept.description || '',
      parentId: dept.parentId || null,
      businessLineId: dept.businessLineId || null,
      managerId: dept.managerId || null,
      status: dept.status || 1,
      sort: dept.sort || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    databases.departments.insert(data, (err, newDocs) => {
      if (err) {
        console.error('❌ 部门数据导入失败:', err.message);
        reject(err);
      } else {
        console.log(`✅ 部门数据导入完成，共 ${newDocs.length} 条`);
        resolve(newDocs.length);
      }
    });
  });
}

// 导入岗位数据
function importPositions(databases, jsonData) {
  return new Promise((resolve, reject) => {
    console.log('🔄 导入岗位数据...');
    
    const positions = jsonData.data.positions || [];
    if (positions.length === 0) {
      console.log('⚠️  没有岗位数据需要导入');
      resolve(0);
      return;
    }

    const data = positions.map(pos => ({
      name: pos.name || '',
      code: pos.code || '',
      level: pos.level || '',
      description: pos.description || '',
      benchmarkValue: pos.benchmarkValue || 0,
      businessLineId: pos.businessLineId || null,
      status: pos.status || 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    databases.positions.insert(data, (err, newDocs) => {
      if (err) {
        console.error('❌ 岗位数据导入失败:', err.message);
        reject(err);
      } else {
        console.log(`✅ 岗位数据导入完成，共 ${newDocs.length} 条`);
        resolve(newDocs.length);
      }
    });
  });
}

// 导入角色数据
function importRoles(databases, jsonData) {
  return new Promise((resolve, reject) => {
    console.log('🔄 导入角色数据...');
    
    const roles = jsonData.data.roles || [];
    if (roles.length === 0) {
      console.log('⚠️  没有角色数据需要导入');
      resolve(0);
      return;
    }

    const data = roles.map(role => ({
      name: role.name || '',
      code: role.code || '',
      description: role.description || '',
      permissions: Array.isArray(role.permissions) ? role.permissions : (role.permissions || []),
      status: role.status || 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    databases.roles.insert(data, (err, newDocs) => {
      if (err) {
        console.error('❌ 角色数据导入失败:', err.message);
        reject(err);
      } else {
        console.log(`✅ 角色数据导入完成，共 ${newDocs.length} 条`);
        resolve(newDocs.length);
      }
    });
  });
}

// 导入用户数据
function importUsers(databases, jsonData) {
  return new Promise((resolve, reject) => {
    console.log('🔄 导入用户数据...');
    
    const users = jsonData.data.users || [];
    if (users.length === 0) {
      console.log('⚠️  没有用户数据需要导入');
      resolve(0);
      return;
    }

    const data = users.map(user => ({
      username: user.username || '',
      password: '$2b$10$default.hash.for.development',
      realName: user.realName || user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      roleId: user.roleId || 1,
      departmentId: user.departmentId || null,
      status: user.status || 1,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    databases.users.insert(data, (err, newDocs) => {
      if (err) {
        console.error('❌ 用户数据导入失败:', err.message);
        reject(err);
      } else {
        console.log(`✅ 用户数据导入完成，共 ${newDocs.length} 条`);
        resolve(newDocs.length);
      }
    });
  });
}

// 导入员工数据
function importEmployees(databases, jsonData) {
  return new Promise((resolve, reject) => {
    console.log('🔄 导入员工数据...');
    
    const employees = jsonData.data.employees || [];
    if (employees.length === 0) {
      console.log('⚠️  没有员工数据需要导入');
      resolve(0);
      return;
    }

    const data = employees.map(emp => ({
      employeeNo: emp.employeeNo || '',
      name: emp.name || '',
      departmentId: emp.departmentId || null,
      positionId: emp.positionId || null,
      annualSalary: emp.annualSalary || 0,
      entryDate: emp.entryDate || '2020-01-01',
      phone: emp.phone || '',
      email: emp.email || '',
      idCard: emp.idCard || '',
      emergencyContact: emp.emergencyContact || '',
      emergencyPhone: emp.emergencyPhone || '',
      address: emp.address || '',
      status: emp.status || 1,
      resignDate: emp.resignDate || null,
      resignReason: emp.resignReason || null,
      handoverStatus: emp.handoverStatus || null,
      userId: emp.userId || null,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    databases.employees.insert(data, (err, newDocs) => {
      if (err) {
        console.error('❌ 员工数据导入失败:', err.message);
        reject(err);
      } else {
        console.log(`✅ 员工数据导入完成，共 ${newDocs.length} 条`);
        resolve(newDocs.length);
      }
    });
  });
}

// 验证导入的数据
function verifyData(databases) {
  return new Promise((resolve, reject) => {
    console.log('🔍 验证导入的数据...');
    
    let completed = 0;
    const total = 6;
    const stats = {};
    
    const checkComplete = () => {
      completed++;
      if (completed === total) {
        console.log('✅ 数据验证完成');
        resolve(stats);
      }
    };

    // 统计业务线数量
    databases.businessLines.count({}, (err, count) => {
      if (err) console.error('❌ 统计业务线失败:', err.message);
      else {
        stats.businessLines = count;
        console.log(`📊 业务线: ${count} 条`);
      }
      checkComplete();
    });

    // 统计部门数量
    databases.departments.count({}, (err, count) => {
      if (err) console.error('❌ 统计部门失败:', err.message);
      else {
        stats.departments = count;
        console.log(`📊 部门: ${count} 条`);
      }
      checkComplete();
    });

    // 统计岗位数量
    databases.positions.count({}, (err, count) => {
      if (err) console.error('❌ 统计岗位失败:', err.message);
      else {
        stats.positions = count;
        console.log(`📊 岗位: ${count} 条`);
      }
      checkComplete();
    });

    // 统计角色数量
    databases.roles.count({}, (err, count) => {
      if (err) console.error('❌ 统计角色失败:', err.message);
      else {
        stats.roles = count;
        console.log(`📊 角色: ${count} 条`);
      }
      checkComplete();
    });

    // 统计用户数量
    databases.users.count({}, (err, count) => {
      if (err) console.error('❌ 统计用户失败:', err.message);
      else {
        stats.users = count;
        console.log(`📊 用户: ${count} 条`);
      }
      checkComplete();
    });

    // 统计员工数量
    databases.employees.count({}, (err, count) => {
      if (err) console.error('❌ 统计员工失败:', err.message);
      else {
        stats.employees = count;
        console.log(`📊 员工: ${count} 条`);
      }
      checkComplete();
    });
  });
}

// 主函数
async function main() {
  try {
    console.log('🚀 开始使用 NeDB 导入数据...');
    console.log('=====================================');
    
    // 确保数据库目录存在
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
      console.log('📁 创建数据库目录');
    }
    
    // 读取JSON数据
    const jsonData = loadJsonData();
    console.log(`✅ 数据文件读取成功，包含 ${Object.keys(jsonData.data).length} 个数据表`);
    
    // 创建数据库实例
    const databases = createDatabases();
    
    // 创建索引
    await createIndexes(databases);
    
    // 清空所有数据
    await clearAllData(databases);

    // 按顺序导入数据（因为有外键依赖）
    console.log('\n📥 开始导入数据...');
    
    const businessLinesCount = await importBusinessLines(databases, jsonData);
    const departmentsCount = await importDepartments(databases, jsonData);
    const positionsCount = await importPositions(databases, jsonData);
    const rolesCount = await importRoles(databases, jsonData);
    const usersCount = await importUsers(databases, jsonData);
    const employeesCount = await importEmployees(databases, jsonData);
    
    // 验证数据
    const stats = await verifyData(databases);
    
    console.log('\n🎉 数据导入完成！');
    console.log('=====================================');
    console.log(`📊 导入统计:`);
    console.log(`   业务线: ${businessLinesCount} 条`);
    console.log(`   部门: ${departmentsCount} 条`);
    console.log(`   岗位: ${positionsCount} 条`);
    console.log(`   角色: ${rolesCount} 条`);
    console.log(`   用户: ${usersCount} 条`);
    console.log(`   员工: ${employeesCount} 条`);
    console.log('\n💡 现在前端应该可以从 NeDB 获取数据了！');
    console.log(`📁 数据库文件位置: ${DB_DIR}`);
    console.log('💾 NeDB 数据会自动持久化到文件，无需额外配置');
    
  } catch (error) {
    console.error('\n❌ 数据导入失败:', error.message);
    process.exit(1);
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = { main };
