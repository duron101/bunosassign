/**
 * NeDB 数据管理器
 * 轻量级嵌入式 NoSQL 数据库，完全用 JavaScript 编写
 * 数据自动持久化到文件，无需额外配置
 */

import DataStore from 'nedb';

class NeDBManager {
  constructor() {
    this.databases = {};
    this.isInitialized = false;
  }

  // 初始化 NeDB 管理器
  async initialize() {
    try {
      console.log('🚀 初始化 NeDB 数据管理器...');
      
      // 创建数据库实例
      this.databases.businessLines = new DataStore({
        filename: './database/business_lines.db',
        autoload: true
      });
      
      this.databases.departments = new DataStore({
        filename: './database/departments.db',
        autoload: true
      });
      
      this.databases.positions = new DataStore({
        filename: './database/positions.db',
        autoload: true
      });
      
      this.databases.roles = new DataStore({
        filename: './database/roles.db',
        autoload: true
      });
      
      this.databases.users = new DataStore({
        filename: './database/users.db',
        autoload: true
      });
      
      this.databases.employees = new DataStore({
        filename: './database/employees.db',
        autoload: true
      });

      // 创建索引
      await this.createIndexes();
      
      this.isInitialized = true;
      console.log('✅ NeDB 数据管理器初始化完成');
      
    } catch (error) {
      console.error('❌ 初始化失败:', error.message);
      throw error;
    }
  }

  // 创建索引
  async createIndexes() {
    try {
      // 业务线索引
      this.databases.businessLines.ensureIndex({ fieldName: 'code', unique: true });
      this.databases.businessLines.ensureIndex({ fieldName: 'name' });
      
      // 部门索引
      this.databases.departments.ensureIndex({ fieldName: 'code', unique: true });
      this.databases.departments.ensureIndex({ fieldName: 'name' });
      this.databases.departments.ensureIndex({ fieldName: 'businessLineId' });
      
      // 岗位索引
      this.databases.positions.ensureIndex({ fieldName: 'code', unique: true });
      this.databases.positions.ensureIndex({ fieldName: 'name' });
      this.databases.positions.ensureIndex({ fieldName: 'businessLineId' });
      
      // 角色索引
      this.databases.roles.ensureIndex({ fieldName: 'code', unique: true });
      this.databases.roles.ensureIndex({ fieldName: 'name' });
      
      // 用户索引
      this.databases.users.ensureIndex({ fieldName: 'username', unique: true });
      this.databases.users.ensureIndex({ fieldName: 'email' });
      
      // 员工索引
      this.databases.employees.ensureIndex({ fieldName: 'employeeNo', unique: true });
      this.databases.employees.ensureIndex({ fieldName: 'name' });
      this.databases.employees.ensureIndex({ fieldName: 'departmentId' });
      this.databases.employees.ensureIndex({ fieldName: 'positionId' });
      
      console.log('✅ 数据库索引创建完成');
      
    } catch (error) {
      console.error('❌ 创建索引失败:', error.message);
      throw error;
    }
  }

  // 插入数据
  async insert(collection, data) {
    if (!this.isInitialized) {
      throw new Error('管理器未初始化');
    }

    return new Promise((resolve, reject) => {
      this.databases[collection].insert(data, (err, newDoc) => {
        if (err) {
          reject(err);
        } else {
          resolve(newDoc);
        }
      });
    });
  }

  // 批量插入数据
  async insertMany(collection, dataArray) {
    if (!this.isInitialized) {
      throw new Error('管理器未初始化');
    }

    return new Promise((resolve, reject) => {
      this.databases[collection].insert(dataArray, (err, newDocs) => {
        if (err) {
          reject(err);
        } else {
          resolve(newDocs);
        }
      });
    });
  }

  // 查询数据
  async find(collection, query = {}, options = {}) {
    if (!this.isInitialized) {
      throw new Error('管理器未初始化');
    }

    return new Promise((resolve, reject) => {
      this.databases[collection].find(query, options, (err, docs) => {
        if (err) {
          reject(err);
        } else {
          resolve(docs);
        }
      });
    });
  }

  // 查询单条数据
  async findOne(collection, query = {}) {
    if (!this.isInitialized) {
      throw new Error('管理器未初始化');
    }

    return new Promise((resolve, reject) => {
      this.databases[collection].findOne(query, (err, doc) => {
        if (err) {
          reject(err);
        } else {
          resolve(doc);
        }
      });
    });
  }

  // 更新数据
  async update(collection, query, update, options = {}) {
    if (!this.isInitialized) {
      throw new Error('管理器未初始化');
    }

    return new Promise((resolve, reject) => {
      this.databases[collection].update(query, update, options, (err, numReplaced) => {
        if (err) {
          reject(err);
        } else {
          resolve(numReplaced);
        }
      });
    });
  }

  // 删除数据
  async remove(collection, query, options = {}) {
    if (!this.isInitialized) {
      throw new Error('管理器未初始化');
    }

    return new Promise((resolve, reject) => {
      this.databases[collection].remove(query, options, (err, numRemoved) => {
        if (err) {
          reject(err);
        } else {
          resolve(numRemoved);
        }
      });
    });
  }

  // 统计数量
  async count(collection, query = {}) {
    if (!this.isInitialized) {
      throw new Error('管理器未初始化');
    }

    return new Promise((resolve, reject) => {
      this.databases[collection].count(query, (err, count) => {
        if (err) {
          reject(err);
        } else {
          resolve(count);
        }
      });
    });
  }

  // 从 JSON 文件导入数据
  async importFromJson(jsonData) {
    if (!this.isInitialized) {
      throw new Error('管理器未初始化');
    }

    try {
      console.log('🔄 开始从 JSON 导入数据...');
      
      // 导入业务线数据
      if (jsonData.data.businessLines && jsonData.data.businessLines.length > 0) {
        const businessLines = jsonData.data.businessLines.map(line => ({
          name: line.name || '',
          code: line.code || '',
          description: line.description || '',
          weight: line.weight || 0,
          status: line.status || 1,
          createdAt: new Date(),
          updatedAt: new Date()
        }));
        
        await this.insertMany('businessLines', businessLines);
        console.log(`✅ 导入 ${businessLines.length} 条业务线数据`);
      }

      // 导入部门数据
      if (jsonData.data.departments && jsonData.data.departments.length > 0) {
        const departments = jsonData.data.departments.map(dept => ({
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
        
        await this.insertMany('departments', departments);
        console.log(`✅ 导入 ${departments.length} 条部门数据`);
      }

      // 导入岗位数据
      if (jsonData.data.positions && jsonData.data.positions.length > 0) {
        const positions = jsonData.data.positions.map(pos => ({
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
        
        await this.insertMany('positions', positions);
        console.log(`✅ 导入 ${positions.length} 条岗位数据`);
      }

      // 导入角色数据
      if (jsonData.data.roles && jsonData.data.roles.length > 0) {
        const roles = jsonData.data.roles.map(role => ({
          name: role.name || '',
          code: role.code || '',
          description: role.description || '',
          permissions: Array.isArray(role.permissions) ? role.permissions : (role.permissions || []),
          status: role.status || 1,
          createdAt: new Date(),
          updatedAt: new Date()
        }));
        
        await this.insertMany('roles', roles);
        console.log(`✅ 导入 ${roles.length} 条角色数据`);
      }

      // 导入用户数据
      if (jsonData.data.users && jsonData.data.users.length > 0) {
        const users = jsonData.data.users.map(user => ({
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
        
        await this.insertMany('users', users);
        console.log(`✅ 导入 ${users.length} 条用户数据`);
      }

      // 导入员工数据
      if (jsonData.data.employees && jsonData.data.employees.length > 0) {
        const employees = jsonData.data.employees.map(emp => ({
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
        
        await this.insertMany('employees', employees);
        console.log(`✅ 导入 ${employees.length} 条员工数据`);
      }

      console.log('✅ 数据导入完成');
      
    } catch (error) {
      console.error('❌ 数据导入失败:', error.message);
      throw error;
    }
  }

  // 获取业务线列表
  async getBusinessLines() {
    return await this.find('businessLines', { status: 1 }, { sort: { name: 1 } });
  }

  // 获取部门列表
  async getDepartments() {
    return await this.find('departments', { status: 1 }, { sort: { sort: 1, name: 1 } });
  }

  // 获取岗位列表
  async getPositions() {
    return await this.find('positions', { status: 1 }, { sort: { name: 1 } });
  }

  // 获取角色列表
  async getRoles() {
    return await this.find('roles', { status: 1 }, { sort: { name: 1 } });
  }

  // 获取用户列表
  async getUsers() {
    return await this.find('users', { status: 1 }, { sort: { username: 1 } });
  }

  // 获取员工列表
  async getEmployees() {
    return await this.find('employees', { status: 1 }, { sort: { name: 1 } });
  }

  // 根据业务线获取部门
  async getDepartmentsByBusinessLine(businessLineId) {
    return await this.find('departments', { 
      businessLineId: businessLineId, 
      status: 1 
    }, { sort: { sort: 1, name: 1 } });
  }

  // 根据业务线获取岗位
  async getPositionsByBusinessLine(businessLineId) {
    return await this.find('positions', { 
      businessLineId: businessLineId, 
      status: 1 
    }, { sort: { name: 1 } });
  }

  // 清空所有数据
  async clearAllData() {
    if (!this.isInitialized) {
      throw new Error('管理器未初始化');
    }

    try {
      console.log('🗑️  清空所有数据...');
      
      await this.remove('businessLines', {});
      await this.remove('departments', {});
      await this.remove('positions', {});
      await this.remove('roles', {});
      await this.remove('users', {});
      await this.remove('employees', {});
      
      console.log('✅ 所有数据已清空');
      
    } catch (error) {
      console.error('❌ 清空数据失败:', error.message);
      throw error;
    }
  }

  // 获取数据库统计信息
  async getDatabaseStats() {
    if (!this.isInitialized) {
      throw new Error('管理器未初始化');
    }

    try {
      const stats = {
        businessLines: await this.count('businessLines'),
        departments: await this.count('departments'),
        positions: await this.count('positions'),
        roles: await this.count('roles'),
        users: await this.count('users'),
        employees: await this.count('employees')
      };
      
      return stats;
    } catch (error) {
      console.error('❌ 获取统计信息失败:', error.message);
      throw error;
    }
  }

  // 关闭所有数据库连接
  close() {
    console.log('🔌 关闭数据库连接');
    // NeDB 会自动管理连接，无需手动关闭
  }
}

// 创建单例实例
const nedbManager = new NeDBManager();

export default nedbManager;
