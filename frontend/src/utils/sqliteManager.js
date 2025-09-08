/**
 * 前端持久化 SQLite 管理器
 * 结合 IndexedDB 实现数据持久化，解决 WebAssembly SQLite 内存存储问题
 */

class SQLiteManager {
  constructor() {
    this.sqlite3 = null;
    this.db = null;
    this.isInitialized = false;
    this.indexedDB = null;
  }

  // 初始化 SQLite 管理器
  async initialize() {
    try {
      console.log('🚀 初始化前端 SQLite 管理器...');
      
      // 检查是否支持 IndexedDB
      if (!window.indexedDB) {
        throw new Error('浏览器不支持 IndexedDB');
      }
      
      // 初始化 IndexedDB
      await this.initIndexedDB();
      
      // 动态导入 WebAssembly SQLite 模块
      const module = await import('/database/sqlite-wasm-3500400/jswasm/sqlite3-node.mjs');
      this.sqlite3 = await module.default();
      console.log('✅ WebAssembly SQLite 模块初始化成功');
      
      this.isInitialized = true;
      console.log('✅ 前端 SQLite 管理器初始化完成');
      
    } catch (error) {
      console.error('❌ 初始化失败:', error.message);
      throw error;
    }
  }

  // 初始化 IndexedDB
  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('bonus_system_db', 1);
      
      request.onerror = () => {
        reject(new Error('无法打开 IndexedDB'));
      };
      
      request.onsuccess = (event) => {
        this.indexedDB = event.target.result;
        console.log('✅ IndexedDB 连接成功');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // 创建对象存储
        if (!db.objectStoreNames.contains('business_lines')) {
          db.createObjectStore('business_lines', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('departments')) {
          db.createObjectStore('departments', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('positions')) {
          db.createObjectStore('positions', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('roles')) {
          db.createObjectStore('roles', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('employees')) {
          db.createObjectStore('employees', { keyPath: 'id', autoIncrement: true });
        }
        
        console.log('✅ IndexedDB 对象存储创建完成');
      };
    });
  }

  // 创建内存数据库
  createMemoryDatabase() {
    if (!this.isInitialized) {
      throw new Error('管理器未初始化');
    }
    
    this.db = new this.sqlite3.oo1.DB(':memory:');
    console.log('✅ 内存数据库创建成功');
    return this.db;
  }

  // 创建表结构
  createTables() {
    if (!this.db) {
      throw new Error('数据库未创建');
    }

    console.log('🔧 创建数据库表结构...');
    
    // 业务线表
    this.db.exec(`
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

    // 部门表
    this.db.exec(`
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

    // 岗位表
    this.db.exec(`
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

    // 角色表
    this.db.exec(`
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

    // 用户表
    this.db.exec(`
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

    // 员工表
    this.db.exec(`
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

    console.log('✅ 表结构创建完成');
  }

  // 从 IndexedDB 恢复数据
  async restoreFromIndexedDB() {
    if (!this.db || !this.indexedDB) {
      throw new Error('数据库或 IndexedDB 未初始化');
    }

    console.log('🔄 从 IndexedDB 恢复数据...');
    
    try {
      // 恢复业务线数据
      const businessLines = await this.getDataFromIndexedDB('business_lines');
      if (businessLines.length > 0) {
        console.log(`📥 恢复 ${businessLines.length} 条业务线数据`);
        for (const line of businessLines) {
          this.db.exec(`
            INSERT INTO business_lines (name, code, description, weight, status)
            VALUES ('${line.name}', '${line.code}', '${line.description || ''}', ${line.weight || 0}, ${line.status || 1})
          `);
        }
      }

      // 恢复部门数据
      const departments = await this.getDataFromIndexedDB('departments');
      if (departments.length > 0) {
        console.log(`📥 恢复 ${departments.length} 条部门数据`);
        for (const dept of departments) {
          this.db.exec(`
            INSERT INTO departments (name, code, description, parent_id, business_line_id, manager_id, status, sort)
            VALUES ('${dept.name}', '${dept.code}', '${dept.description || ''}', ${dept.parentId || 'NULL'}, ${dept.businessLineId || 'NULL'}, ${dept.managerId || 'NULL'}, ${dept.status || 1}, ${dept.sort || 0})
          `);
        }
      }

      // 恢复岗位数据
      const positions = await this.getDataFromIndexedDB('positions');
      if (positions.length > 0) {
        console.log(`📥 恢复 ${positions.length} 条岗位数据`);
        for (const pos of positions) {
          this.db.exec(`
            INSERT INTO positions (name, code, level, description, benchmark_value, business_line_id, status)
            VALUES ('${pos.name}', '${pos.code}', '${pos.level}', '${pos.description || ''}', ${pos.benchmarkValue || 0}, ${pos.businessLineId || 'NULL'}, ${pos.status || 1})
          `);
        }
      }

      // 恢复角色数据
      const roles = await this.getDataFromIndexedDB('roles');
      if (roles.length > 0) {
        console.log(`📥 恢复 ${roles.length} 条角色数据`);
        for (const role of roles) {
          this.db.exec(`
            INSERT INTO roles (name, code, description, permissions, status)
            VALUES ('${role.name}', '${role.code}', '${role.description || ''}', '${role.permissions || '[]'}', ${role.status || 1})
          `);
        }
      }

      // 恢复用户数据
      const users = await this.getDataFromIndexedDB('users');
      if (users.length > 0) {
        console.log(`📥 恢复 ${users.length} 条用户数据`);
        for (const user of users) {
          this.db.exec(`
            INSERT INTO users (username, password, real_name, email, phone, role_id, department_id, status)
            VALUES ('${user.username}', '${user.password || '$2b$10$default.hash.for.development'}', '${user.realName}', '${user.email || ''}', '${user.phone || ''}', ${user.roleId || 1}, ${user.departmentId || 'NULL'}, ${user.status || 1})
          `);
        }
      }

      // 恢复员工数据
      const employees = await this.getDataFromIndexedDB('employees');
      if (employees.length > 0) {
        console.log(`📥 恢复 ${employees.length} 条员工数据`);
        for (const emp of employees) {
          this.db.exec(`
            INSERT INTO employees (employee_no, name, department_id, position_id, annual_salary, entry_date, phone, email, id_card, emergency_contact, emergency_phone, address, status, resign_date, resign_reason, handover_status, user_id)
            VALUES ('${emp.employeeNo}', '${emp.name}', ${emp.departmentId || 'NULL'}, ${emp.positionId || 'NULL'}, ${emp.annualSalary || 0}, '${emp.entryDate || '2020-01-01'}', '${emp.phone || ''}', '${emp.email || ''}', '${emp.idCard || ''}', '${emp.emergencyContact || ''}', '${emp.emergencyPhone || ''}', '${emp.address || ''}', ${emp.status || 1}, ${emp.resignDate ? `'${emp.resignDate}'` : 'NULL'}, ${emp.resignReason ? `'${emp.resignReason}'` : 'NULL'}, ${emp.handoverStatus ? `'${emp.handoverStatus}'` : 'NULL'}, ${emp.userId || 'NULL'})
          `);
        }
      }

      console.log('✅ 数据恢复完成');
      
    } catch (error) {
      console.error('❌ 数据恢复失败:', error.message);
      throw error;
    }
  }

  // 从 IndexedDB 获取数据
  async getDataFromIndexedDB(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.indexedDB.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result || []);
      };
      
      request.onerror = () => {
        reject(new Error(`无法从 ${storeName} 获取数据`));
      };
    });
  }

  // 备份数据到 IndexedDB
  async backupToIndexedDB() {
    if (!this.db || !this.indexedDB) {
      throw new Error('数据库或 IndexedDB 未初始化');
    }

    console.log('💾 备份数据到 IndexedDB...');
    
    try {
      // 清空现有存储
      await this.clearIndexedDBStore('business_lines');
      await this.clearIndexedDBStore('departments');
      await this.clearIndexedDBStore('positions');
      await this.clearIndexedDBStore('roles');
      await this.clearIndexedDBStore('users');
      await this.clearIndexedDBStore('employees');

      // 备份业务线数据
      const businessLinesStmt = this.db.prepare('SELECT * FROM business_lines');
      while (businessLinesStmt.step()) {
        const row = businessLinesStmt.get(['id', 'name', 'code', 'description', 'weight', 'status']);
        if (row) {
          await this.saveDataToIndexedDB('business_lines', {
            name: row[1],
            code: row[2],
            description: row[3],
            weight: row[4],
            status: row[5]
          });
        }
      }
      businessLinesStmt.finalize();

      // 备份部门数据
      const departmentsStmt = this.db.prepare('SELECT * FROM departments');
      while (departmentsStmt.step()) {
        const row = departmentsStmt.get(['id', 'name', 'code', 'description', 'parent_id', 'business_line_id', 'manager_id', 'status', 'sort']);
        if (row) {
          await this.saveDataToIndexedDB('departments', {
            name: row[1],
            code: row[2],
            description: row[3],
            parentId: row[4],
            businessLineId: row[5],
            managerId: row[6],
            status: row[7],
            sort: row[8]
          });
        }
      }
      departmentsStmt.finalize();

      // 备份岗位数据
      const positionsStmt = this.db.prepare('SELECT * FROM positions');
      while (positionsStmt.step()) {
        const row = positionsStmt.get(['id', 'name', 'code', 'level', 'description', 'benchmark_value', 'business_line_id', 'status']);
        if (row) {
          await this.saveDataToIndexedDB('positions', {
            name: row[1],
            code: row[2],
            level: row[3],
            description: row[4],
            benchmarkValue: row[5],
            businessLineId: row[6],
            status: row[7]
          });
        }
      }
      positionsStmt.finalize();

      // 备份角色数据
      const rolesStmt = this.db.prepare('SELECT * FROM roles');
      while (rolesStmt.step()) {
        const row = rolesStmt.get(['id', 'name', 'code', 'description', 'permissions', 'status']);
        if (row) {
          await this.saveDataToIndexedDB('roles', {
            name: row[1],
            code: row[2],
            description: row[3],
            permissions: row[4],
            status: row[5]
          });
        }
      }
      rolesStmt.finalize();

      // 备份用户数据
      const usersStmt = this.db.prepare('SELECT * FROM users');
      while (usersStmt.step()) {
        const row = usersStmt.get(['id', 'username', 'password', 'real_name', 'email', 'phone', 'role_id', 'department_id', 'status']);
        if (row) {
          await this.saveDataToIndexedDB('users', {
            username: row[1],
            password: row[2],
            realName: row[3],
            email: row[4],
            phone: row[5],
            roleId: row[6],
            departmentId: row[7],
            status: row[8]
          });
        }
      }
      usersStmt.finalize();

      // 备份员工数据
      const employeesStmt = this.db.prepare('SELECT * FROM employees');
      while (employeesStmt.step()) {
        const row = employeesStmt.get(['id', 'employee_no', 'name', 'department_id', 'position_id', 'annual_salary', 'entry_date', 'phone', 'email', 'id_card', 'emergency_contact', 'emergency_phone', 'address', 'status', 'resign_date', 'resign_reason', 'handover_status', 'user_id']);
        if (row) {
          await this.saveDataToIndexedDB('employees', {
            employeeNo: row[1],
            name: row[2],
            departmentId: row[3],
            positionId: row[4],
            annualSalary: row[5],
            entryDate: row[6],
            phone: row[7],
            email: row[8],
            idCard: row[9],
            emergencyContact: row[10],
            emergencyPhone: row[11],
            address: row[12],
            status: row[13],
            resignDate: row[14],
            resignReason: row[15],
            handoverStatus: row[16],
            userId: row[17]
          });
        }
      }
      employeesStmt.finalize();

      console.log('✅ 数据备份完成');
      
    } catch (error) {
      console.error('❌ 数据备份失败:', error.message);
      throw error;
    }
  }

  // 保存数据到 IndexedDB
  async saveDataToIndexedDB(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.indexedDB.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(new Error(`无法保存数据到 ${storeName}`));
      };
    });
  }

  // 清空 IndexedDB 存储
  async clearIndexedDBStore(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.indexedDB.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error(`无法清空 ${storeName}`));
      };
    });
  }

  // 查询数据
  query(sql, params = []) {
    if (!this.db) {
      throw new Error('数据库未创建');
    }

    try {
      if (params.length > 0) {
        const stmt = this.db.prepare(sql);
        stmt.bind(params);
        
        const results = [];
        while (stmt.step()) {
          const row = stmt.get();
          if (row) results.push(row);
        }
        stmt.finalize();
        return results;
      } else {
        return this.db.exec(sql);
      }
    } catch (error) {
      console.error('❌ 查询失败:', error.message);
      throw error;
    }
  }

  // 执行 SQL
  exec(sql) {
    if (!this.db) {
      throw new Error('数据库未创建');
    }

    try {
      this.db.exec(sql);
      return true;
    } catch (error) {
      console.error('❌ 执行失败:', error.message);
      throw error;
    }
  }

  // 关闭数据库
  close() {
    if (this.db) {
      this.db.close();
      console.log('🔌 数据库连接已关闭');
    }
  }

  // 自动保存（建议在数据变更后调用）
  async autoSave() {
    try {
      await this.backupToIndexedDB();
      console.log('✅ 自动保存完成');
    } catch (error) {
      console.error('❌ 自动保存失败:', error.message);
    }
  }
}

// 创建单例实例
const sqliteManager = new SQLiteManager();

export default sqliteManager;
