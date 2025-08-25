#!/usr/bin/env node

/**
 * 使用 WebAssembly SQLite 的数据导入脚本
 * 将 bonus_system.json 中的数据导入到 SQLite 数据库
 */

const fs = require('fs');
const path = require('path');

// 数据库文件路径
const DB_PATH = path.join(__dirname, '../database/bonus_system.db');
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

// 创建数据库连接
async function createDatabase() {
  try {
    console.log('🔄 创建数据库连接...');
    
    // 确保数据库目录存在
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    console.log('📥 开始导入 WebAssembly SQLite 模块...');
    // 使用动态导入来加载 WebAssembly SQLite 模块
    const sqlite3InitModule = (await import('../database/sqlite-wasm-3500400/jswasm/sqlite3-node.mjs')).default;
    console.log('✅ 模块导入成功');
    
    // 初始化 SQLite 模块
    console.log('🔄 初始化 WebAssembly SQLite 模块...');
    console.log('⏳ 这可能需要几秒钟...');
    const sqlite3 = await sqlite3InitModule();
    console.log('✅ 模块初始化完成');
    
    console.log('🔍 检查 sqlite3.oo1 对象...');
    if (!sqlite3.oo1 || !sqlite3.oo1.DB) {
      throw new Error('sqlite3.oo1.DB 构造函数不可用');
    }
    console.log('✅ oo1.DB 构造函数可用');
    
    // 使用 oo1.DB 构造函数创建数据库连接
    console.log('🔧 创建数据库实例...');
    const db = new sqlite3.oo1.DB(DB_PATH);
    console.log('✅ 数据库连接创建成功');
    return db;
  } catch (error) {
    console.error('❌ 创建数据库连接失败:', error.message);
    console.error('错误详情:', error);
    throw error;
  }
}

// 创建表结构
async function createTables(db) {
  console.log('🔄 创建数据库表结构...');
  console.log('🔍 数据库对象类型:', typeof db);
  console.log('🔍 数据库对象方法:', Object.getOwnPropertyNames(db));
  
  try {
    // 业务线表
    console.log('创建业务线表...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS business_lines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        weight DECIMAL(5,2) NOT NULL,
        status INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ 业务线表创建成功');

    // 部门表
    console.log('创建部门表...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        parent_id INTEGER,
        business_line_id INTEGER,
        manager_id INTEGER,
        status INTEGER DEFAULT 1,
        sort INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ 部门表创建成功');

    // 岗位表
    console.log('创建岗位表...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS positions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        level VARCHAR(20) NOT NULL,
        description TEXT,
        benchmark_value DECIMAL(10,2) NOT NULL,
        business_line_id INTEGER,
        status INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ 岗位表创建成功');

    // 角色表
    console.log('创建角色表...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        permissions TEXT,
        status INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ 角色表创建成功');

    // 用户表
    console.log('创建用户表...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        real_name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        role_id INTEGER NOT NULL,
        department_id INTEGER,
        status INTEGER DEFAULT 1,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ 用户表创建成功');

    // 员工表
    console.log('创建员工表...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_no VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        department_id INTEGER,
        position_id INTEGER,
        annual_salary DECIMAL(12,2) NOT NULL,
        entry_date DATE NOT NULL,
        phone VARCHAR(20),
        email VARCHAR(100),
        id_card VARCHAR(18),
        emergency_contact VARCHAR(100),
        emergency_phone VARCHAR(20),
        address TEXT,
        status INTEGER DEFAULT 1,
        resign_date DATE,
        resign_reason TEXT,
        handover_status VARCHAR(50),
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ 员工表创建成功');

    console.log('✅ 数据库表结构创建完成');
  } catch (error) {
    console.error('❌ 创建表结构失败:', error.message);
    throw error;
  }
}

// 导入业务线数据
async function importBusinessLines(db, jsonData) {
  console.log('🔄 导入业务线数据...');
  
  try {
    const businessLines = jsonData.data.businessLines || [];
    let count = 0;
    
    for (const line of businessLines) {
      // 数据验证和默认值处理
      const name = line.name || '';
      const code = line.code || '';
      const description = line.description || '';
      const weight = line.weight || 0;
      const status = line.status || 1;
      
      console.log(`🔍 处理业务线: name="${name}", code="${code}"`);
      
      if (!name || !code) {
        console.warn(`⚠️  跳过无效的业务线数据: ${JSON.stringify(line)}`);
        continue;
      }
      
      try {
        // 使用 prepare 和 step 方法替代 exec
        const stmt = db.prepare(`
          INSERT INTO business_lines (name, code, description, weight, status)
          VALUES (?, ?, ?, ?, ?)
        `);
        
        stmt.bind([name, code, description, weight, status]);
        stmt.step();
        stmt.finalize();
        
        count++;
        console.log(`✅ 插入业务线: ${name}`);
      } catch (insertError) {
        console.error(`❌ 插入业务线失败 ${name}:`, insertError.message);
        throw insertError;
      }
    }
    
    console.log(`✅ 业务线数据导入完成，共 ${count} 条`);
    return count;
  } catch (error) {
    console.error('❌ 业务线数据导入失败:', error.message);
    throw error;
  }
}

// 导入部门数据
async function importDepartments(db, jsonData) {
  console.log('🔄 导入部门数据...');
  
  try {
    const departments = jsonData.data.departments || [];
    let count = 0;
    
    for (const dept of departments) {
      // 数据验证和默认值处理
      const name = dept.name || '';
      const code = dept.code || '';
      const description = dept.description || '';
      const parentId = dept.parentId || null;
      const businessLineId = dept.businessLineId || null;
      const managerId = dept.managerId || null;
      const status = dept.status || 1;
      const sort = dept.sort || 0;
      
      if (!name || !code) {
        console.warn(`⚠️  跳过无效的部门数据: ${JSON.stringify(dept)}`);
        continue;
      }
      
      try {
        const stmt = db.prepare(`
          INSERT INTO departments (name, code, description, parent_id, business_line_id, manager_id, status, sort)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.bind([name, code, description, parentId, businessLineId, managerId, status, sort]);
        stmt.step();
        stmt.finalize();
        
        count++;
      } catch (insertError) {
        console.error(`❌ 插入部门失败 ${name}:`, insertError.message);
        throw insertError;
      }
    }
    
    console.log(`✅ 部门数据导入完成，共 ${count} 条`);
    return count;
  } catch (error) {
    console.error('❌ 部门数据导入失败:', error.message);
    throw error;
  }
}

// 导入岗位数据
async function importPositions(db, jsonData) {
  console.log('🔄 导入岗位数据...');
  
  try {
    const positions = jsonData.data.positions || [];
    let count = 0;
    
    console.log(`📊 准备导入 ${positions.length} 个岗位`);
    
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      
      // 数据验证和默认值处理
      const name = pos.name || '';
      const code = pos.code || '';
      const level = pos.level || '';
      const description = pos.description || '';
      const benchmarkValue = pos.benchmarkValue || 0;
      const businessLineId = pos.businessLineId || null;
      const status = pos.status || 1;
      
      console.log(`🔍 处理岗位 ${i + 1}: name="${name}", code="${code}", level="${level}"`);
      
      if (!name || !code || !level) {
        console.warn(`⚠️  跳过无效的岗位数据: ${JSON.stringify(pos)}`);
        continue;
      }
      
      try {
        const stmt = db.prepare(`
          INSERT INTO positions (name, code, level, description, benchmark_value, business_line_id, status)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.bind([name, code, level, description, benchmarkValue, businessLineId, status]);
        stmt.step();
        stmt.finalize();
        
        count++;
        console.log(`✅ 插入岗位: ${name}`);
      } catch (insertError) {
        console.error(`❌ 插入岗位失败 ${name}:`, insertError.message);
        console.error('岗位数据:', JSON.stringify(pos));
        throw insertError;
      }
    }
    
    console.log(`✅ 岗位数据导入完成，共 ${count} 条`);
    return count;
  } catch (error) {
    console.error('❌ 岗位数据导入失败:', error.message);
    throw error;
  }
}

// 导入角色数据
async function importRoles(db, jsonData) {
  console.log('🔄 导入角色数据...');
  
  try {
    const roles = jsonData.data.roles || [];
    let count = 0;
    
    console.log(`📊 准备导入 ${roles.length} 个角色`);
    
    for (let i = 0; i < roles.length; i++) {
      const role = roles[i];
      
      // 数据验证和默认值处理
      const name = role.name || '';
      const code = role.code || '';
      const description = role.description || '';
      const permissions = Array.isArray(role.permissions) ? JSON.stringify(role.permissions) : (role.permissions || '[]');
      const status = role.status || 1;
      
      console.log(`🔍 处理角色 ${i + 1}: name="${name}", code="${code}", permissions="${permissions}"`);
      
      if (!name || !code) {
        console.warn(`⚠️  跳过无效的角色数据: ${JSON.stringify(role)}`);
        continue;
      }
      
      try {
        const stmt = db.prepare(`
          INSERT INTO roles (name, code, description, permissions, status)
          VALUES (?, ?, ?, ?, ?)
        `);
        
        stmt.bind([name, code, description, permissions, status]);
        stmt.step();
        stmt.finalize();
        
        count++;
        console.log(`✅ 插入角色: ${name}`);
      } catch (insertError) {
        console.error(`❌ 插入角色失败 ${name}:`, insertError.message);
        console.error('角色数据:', JSON.stringify(role));
        throw insertError;
      }
    }
    
    console.log(`✅ 角色数据导入完成，共 ${count} 条`);
    return count;
  } catch (error) {
    console.error('❌ 角色数据导入失败:', error.message);
    throw error;
  }
}

// 导入用户数据
async function importUsers(db, jsonData) {
  console.log('🔄 导入用户数据...');
  
  try {
    const users = jsonData.data.users || [];
    let count = 0;
    
    console.log(`📊 准备导入 ${users.length} 个用户`);
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      
      // 数据验证和默认值处理
      const username = user.username || '';
      const realName = user.realName || user.name || '';
      const email = user.email || '';
      const phone = user.phone || '';
      const roleId = user.roleId || 1;
      const departmentId = user.departmentId || null;
      const status = user.status || 1;
      
      console.log(`🔍 处理用户 ${i + 1}: username="${username}", realName="${realName}"`);
      
      if (!username || !realName) {
        console.warn(`⚠️  跳过无效的用户数据: ${JSON.stringify(user)}`);
        continue;
      }
      
      // 为每个用户设置默认密码
      const defaultPassword = '$2b$10$default.hash.for.development';
      
      try {
        const stmt = db.prepare(`
          INSERT INTO users (username, password, real_name, email, phone, role_id, department_id, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.bind([username, defaultPassword, realName, email, phone, roleId, departmentId, status]);
        stmt.step();
        stmt.finalize();
        
        count++;
        console.log(`✅ 插入用户: ${username}`);
      } catch (insertError) {
        console.error(`❌ 插入用户失败 ${username}:`, insertError.message);
        console.error('用户数据:', JSON.stringify(user));
        throw insertError;
      }
    }
    
    console.log(`✅ 用户数据导入完成，共 ${count} 条`);
    return count;
  } catch (error) {
    console.error('❌ 用户数据导入失败:', error.message);
    throw error;
  }
}

// 导入员工数据
async function importEmployees(db, jsonData) {
  console.log('🔄 导入员工数据...');
  
  try {
    const employees = jsonData.data.employees || [];
    let count = 0;
    
    console.log(`📊 准备导入 ${employees.length} 个员工`);
    
    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      
      // 数据验证和默认值处理
      const employeeNo = emp.employeeNo || '';
      const name = emp.name || '';
      const departmentId = emp.departmentId || null;
      const positionId = emp.positionId || null;
      const annualSalary = emp.annualSalary || 0;
      const entryDate = emp.entryDate || '2020-01-01';
      const phone = emp.phone || '';
      const email = emp.email || '';
      const idCard = emp.idCard || '';
      const emergencyContact = emp.emergencyContact || '';
      const emergencyPhone = emp.emergencyPhone || '';
      const address = emp.address || '';
      const status = emp.status || 1;
      const resignDate = emp.resignDate || null;
      const resignReason = emp.resignReason || null;
      const handoverStatus = emp.handoverStatus || null;
      const userId = emp.userId || null;
      
      console.log(`🔍 处理员工 ${i + 1}: employeeNo="${employeeNo}", name="${name}"`);
      
      if (!employeeNo || !name) {
        console.warn(`⚠️  跳过无效的员工数据: ${JSON.stringify(emp)}`);
        continue;
      }
      
      try {
        const stmt = db.prepare(`
          INSERT INTO employees (employee_no, name, department_id, position_id, annual_salary, entry_date, phone, email, id_card, emergency_contact, emergency_phone, address, status, resign_date, resign_reason, handover_status, user_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.bind([employeeNo, name, departmentId, positionId, annualSalary, entryDate, phone, email, idCard, emergencyContact, emergencyPhone, address, status, resignDate, resignReason, handoverStatus, userId]);
        stmt.step();
        stmt.finalize();
        
        count++;
        console.log(`✅ 插入员工: ${name}`);
      } catch (insertError) {
        console.error(`❌ 插入员工失败 ${name}:`, insertError.message);
        console.error('员工数据:', JSON.stringify(emp));
        throw insertError;
      }
    }
    
    console.log(`✅ 员工数据导入完成，共 ${count} 条`);
    return count;
  } catch (error) {
    console.error('❌ 员工数据导入失败:', error.message);
    throw error;
  }
}

// 主函数
async function main() {
  let db = null;
  
  try {
    console.log('🚀 开始使用 WebAssembly SQLite 导入数据...');
    console.log('=====================================');
    
    // 读取JSON数据
    const jsonData = loadJsonData();
    console.log(`✅ 数据文件读取成功，包含 ${Object.keys(jsonData.data).length} 个数据表`);
    
    // 创建数据库连接
    db = await createDatabase();
    
    // 创建表结构
    await createTables(db);
    
    // 按顺序导入数据（因为有外键依赖）
    console.log('\n📥 开始导入数据...');
    
    const businessLinesCount = await importBusinessLines(db, jsonData);
    const departmentsCount = await importDepartments(db, jsonData);
    const positionsCount = await importPositions(db, jsonData);
    const rolesCount = await importRoles(db, jsonData);
    const usersCount = await importUsers(db, jsonData);
    const employeesCount = await importEmployees(db, jsonData);
    
    console.log('\n🎉 数据导入完成！');
    console.log('=====================================');
    console.log(`📊 导入统计:`);
    console.log(`   业务线: ${businessLinesCount} 条`);
    console.log(`   部门: ${departmentsCount} 条`);
    console.log(`   岗位: ${positionsCount} 条`);
    console.log(`   角色: ${rolesCount} 条`);
    console.log(`   用户: ${usersCount} 条`);
    console.log(`   员工: ${employeesCount} 条`);
    console.log('\n💡 现在前端应该可以从数据库获取数据了！');
    console.log(`📁 数据库文件位置: ${DB_PATH}`);
    
  } catch (error) {
    console.error('\n❌ 数据导入失败:', error.message);
    process.exit(1);
  } finally {
    if (db) {
      db.close();
      console.log('\n🔌 数据库连接已关闭');
    }
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = { main };
