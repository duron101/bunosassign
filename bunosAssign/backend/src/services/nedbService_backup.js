const DataStore = require('nedb');
const path = require('path');

/**
 * 后端 NeDB 数据服务
 * 提供所有基础数据的 CRUD 操作
 */
class NeDBService {
  constructor() {
    this.databases = {};
    this.isInitialized = false;
  }

  // 初始化 NeDB 服务
  async initialize() {
    try {
      console.log('🚀 初始化后端 NeDB 服务...');
      
      // 修改为指向根目录的 database 文件夹
      const dbPath = path.join(__dirname, '../../../database');
      this.dataDir = dbPath; // 保存数据库路径用于动态集合创建
      
      console.log(`📁 数据库路径: ${dbPath}`);
      
      // 创建数据库实例
      this.databases.businessLines = new DataStore({
        filename: path.join(dbPath, 'business_lines.db'),
        autoload: true
      });
      
      this.databases.departments = new DataStore({
        filename: path.join(dbPath, 'departments.db'),
        autoload: true
      });
      
      this.databases.positions = new DataStore({
        filename: path.join(dbPath, 'positions.db'),
        autoload: true
      });
      
      this.databases.roles = new DataStore({
        filename: path.join(dbPath, 'roles.db'),
        autoload: true
      });
      
      this.databases.users = new DataStore({
        filename: path.join(dbPath, 'users.db'),
        autoload: true
      });
      
      this.databases.employees = new DataStore({
        filename: path.join(dbPath, 'employees.db'),
        autoload: true
      });

      this.databases.projects = new DataStore({
        filename: path.join(dbPath, 'projects.db'),
        autoload: true
      });

      this.databases.projectLineWeights = new DataStore({
        filename: path.join(dbPath, 'project_line_weights.db'),
        autoload: true
      });

      // 创建索引
      await this.createIndexes();
      
      this.isInitialized = true;
      console.log('✅ 后端 NeDB 服务初始化完成');
      
    } catch (error) {
      console.error('❌ 后端 NeDB 服务初始化失败:', error.message);
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
      
      // 项目索引
      this.databases.projects.ensureIndex({ fieldName: 'code', unique: true });
      this.databases.projects.ensureIndex({ fieldName: 'name' });
      this.databases.projects.ensureIndex({ fieldName: 'managerId' });
      this.databases.projects.ensureIndex({ fieldName: 'status' });
      
      // 项目权重索引
      this.databases.projectLineWeights.ensureIndex({ fieldName: 'projectId' });
      this.databases.projectLineWeights.ensureIndex({ fieldName: 'businessLineId' });
      
      console.log('✅ 数据库索引创建完成');
      
    } catch (error) {
      console.error('❌ 创建索引失败:', error.message);
      throw error;
    }
  }

  // 通用查询方法
  async find(collection, query = {}, options = {}) {
    if (!this.isInitialized) {
      throw new Error('服务未初始化');
    }

    // 确保集合存在
    this.ensureCollection(collection);

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
      throw new Error('服务未初始化');
    }

    console.log(`🔍 findOne 查询: ${collection}, 条件: ${JSON.stringify(query)}`)

    // 确保集合存在
    this.ensureCollection(collection);

    return new Promise((resolve, reject) => {
      this.databases[collection].findOne(query, (err, doc) => {
        if (err) {
          console.error(`❌ findOne 查询错误: ${err.message}`)
          reject(err);
        } else {
          console.log(`🔍 findOne 查询结果: ${JSON.stringify(doc)}`)
          resolve(doc);
        }
      });
    });
  }

  // 确保集合存在
  ensureCollection(collection) {
    if (!this.databases[collection]) {
      const Datastore = require('nedb');
      const dbPath = path.join(this.dataDir, `${collection}.db`);
      this.databases[collection] = new Datastore({
        filename: dbPath,
        autoload: true,
        timestampData: true
      });
      console.log(`✅ 动态创建数据库集合: ${collection}`)
    }
  }

  // 插入数据
  async insert(collection, data) {
    if (!this.isInitialized) {
      throw new Error('服务未初始化');
    }

    // 确保集合存在
    this.ensureCollection(collection);

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

  // 更新数据
  async update(collection, query, update, options = {}) {
    if (!this.isInitialized) {
      throw new Error('服务未初始化');
    }

    // 确保集合存在
    this.ensureCollection(collection);

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
      throw new Error('服务未初始化');
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

  // 批量删除数据
  async deleteMany(collection, query) {
    return await this.remove(collection, query, { multi: true });
  }

  // 批量插入数据
  async createMany(collection, dataArray) {
    if (!this.isInitialized) {
      throw new Error('服务未初始化');
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

  // 聚合查询（简化版）
  async aggregate(collection, pipeline) {
    if (!this.isInitialized) {
      throw new Error('服务未初始化');
    }

    // 简化版聚合，只支持基本的 $group 操作
    const data = await this.find(collection, {});
    
    if (pipeline.length === 0) return data;
    
    // 处理 $group 操作
    const groupStage = pipeline.find(stage => stage.$group);
    if (groupStage) {
      const grouped = {};
      data.forEach(doc => {
        const groupKey = groupStage.$group._id;
        let key;
        
        if (typeof groupKey === 'string') {
          key = doc[groupKey];
        } else if (groupKey && typeof groupKey === 'object') {
          // 处理复合键
          key = Object.keys(groupKey).map(k => doc[k]).join('|');
        }
        
        if (!grouped[key]) {
          grouped[key] = { _id: key };
          Object.keys(groupStage.$group).forEach(field => {
            if (field !== '_id') {
              const fieldConfig = groupStage.$group[field];
              if (fieldConfig.$sum) {
                grouped[key][field] = 0;
              } else if (fieldConfig.$avg) {
                grouped[key][field] = { sum: 0, count: 0 };
              }
            }
          });
        }
        
        Object.keys(groupStage.$group).forEach(field => {
          if (field !== '_id') {
            const fieldConfig = groupStage.$group[field];
            if (fieldConfig.$sum) {
              grouped[key][field] += doc[fieldConfig.$sum] || 0;
            } else if (fieldConfig.$avg) {
              grouped[key][field].sum += doc[fieldConfig.$avg] || 0;
              grouped[key][field].count += 1;
            }
          }
        });
      });
      
      // 计算平均值
      Object.keys(grouped).forEach(key => {
        Object.keys(grouped[key]).forEach(field => {
          if (grouped[key][field] && typeof grouped[key][field] === 'object' && grouped[key][field].sum !== undefined) {
            grouped[key][field] = grouped[key][field].sum / grouped[key][field].count;
          }
        });
      });
      
      return Object.values(grouped);
    }
    
    return data;
  }

  // 统计数量
  async count(collection, query = {}) {
    if (!this.isInitialized) {
      throw new Error('服务未初始化');
    }

    // 确保集合存在
    this.ensureCollection(collection);

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

  // 业务线相关方法
  async getBusinessLines() {
    return await this.find('businessLines', { status: 1 }, { sort: { name: 1 } });
  }

  async getBusinessLineById(id) {
    return await this.findOne('businessLines', { _id: id });
  }

  async createBusinessLine(data) {
    const businessLine = {
      ...data,
      status: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return await this.insert('businessLines', businessLine);
  }

  async updateBusinessLine(id, data) {
    const update = {
      ...data,
      updatedAt: new Date()
    };
    return await this.update('businessLines', { _id: id }, { $set: update });
  }

  async deleteBusinessLine(id) {
    return await this.update('businessLines', { _id: id }, { $set: { status: 0 } });
  }

  // 部门相关方法
  async getDepartments() {
    return await this.find('departments', { status: 1 }, { sort: { sort: 1, name: 1 } });
  }

  async getDepartmentById(id) {
    return await this.findOne('departments', { _id: id });
  }

  async getDepartmentsByBusinessLine(businessLineId) {
    return await this.find('departments', { 
      businessLineId: businessLineId, 
      status: 1 
    }, { sort: { sort: 1, name: 1 } });
  }

  async createDepartment(data) {
    const department = {
      ...data,
      status: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return await this.insert('departments', department);
  }

  async updateDepartment(id, data) {
    const update = {
      ...data,
      updatedAt: new Date()
    };
    return await this.update('departments', { _id: id }, { $set: update });
  }

  async deleteDepartment(id) {
    return await this.update('departments', { _id: id }, { $set: { status: 0 } });
  }

  // 岗位相关方法
  async getPositions() {
    return await this.find('positions', { status: 1 }, { sort: { name: 1 } });
  }

  async getPositionById(id) {
    return await this.findOne('positions', { _id: id });
  }

  async getPositionsByBusinessLine(businessLineId) {
    return await this.find('positions', { 
      businessLineId: businessLineId, 
      status: 1 
    }, { sort: { name: 1 } });
  }

  async createPosition(data) {
    const position = {
      ...data,
      status: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return await this.insert('positions', position);
  }

  async updatePosition(id, data) {
    const update = {
      ...data,
      updatedAt: new Date()
    };
    return await this.update('positions', { _id: id }, { $set: update });
  }

  async deletePosition(id) {
    return await this.update('positions', { _id: id }, { $set: { status: 0 } });
  }

  // 员工相关方法
  async getEmployees() {
    console.log(`🔍 获取所有员工`)
    const result = await this.find('employees', { status: 1 }, { sort: { name: 1 } });
    console.log(`🔍 员工总数: ${result.length}`)
    return result;
  }

  async getEmployeeById(id) {
    console.log(`🔍 查询员工ID: ${id}`)
    
    // 方法1: 直接查询
    let result = await this.findOne('employees', { _id: id })
    console.log(`🔍 直接查询结果: ${JSON.stringify(result)}`)
    
    // 方法2: 如果直接查询失败，尝试查询所有员工再过滤
    if (!result) {
      console.log(`🔍 直接查询失败，尝试查询所有员工再过滤`)
      const allEmployees = await this.find('employees', {})
      console.log(`🔍 所有员工数量: ${allEmployees.length}`)
      
      // 查找匹配的员工
      result = allEmployees.find(emp => emp._id === id)
      console.log(`🔍 过滤查询结果: ${JSON.stringify(result)}`)
      
      // 如果没有找到，打印所有员工的ID用于调试
      if (!result) {
        console.log(`🔍 所有员工ID: ${allEmployees.map(emp => emp._id).join(', ')}`)
      }
    }
    
    return result
  }

  async createEmployee(data) {
    const employee = {
      ...data,
      status: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return await this.insert('employees', employee);
  }

  async updateEmployee(id, data) {
    const update = {
      ...data,
      updatedAt: new Date()
    };
    return await this.update('employees', { _id: id }, { $set: update });
  }

  async deleteEmployee(id) {
    return await this.update('employees', { _id: id }, { $set: { status: 0 } });
  }

  // 角色相关方法
  async getRoles() {
    return await this.find('roles', { status: 1 }, { sort: { name: 1 } });
  }

  async getRoleById(id) {
    return await this.findOne('roles', { _id: id });
  }

  async getRoleByName(name) {
    return await this.findOne('roles', { name: name });
  }

  async createRole(data) {
    const role = {
      ...data,
      status: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return await this.insert('roles', role);
  }

  async updateRole(id, data) {
    const update = {
      ...data,
      updatedAt: new Date()
    };
    return await this.update('roles', { _id: id }, { $set: update });
  }

  async deleteRole(id) {
    return await this.update('roles', { _id: id }, { $set: { status: 0 } });
  }

  async countUsersByRoleId(roleId) {
    const users = await this.find('users', { roleId: roleId })
    return users.length
  }

  async updateRoles(updateData, where) {
    // 批量更新角色
    const roles = await this.find('roles', {})
    let updatedCount = 0
    
    for (const role of roles) {
      // 检查是否匹配条件
      if (where._id && where._id.$in && where._id.$in.includes(role._id)) {
        await this.updateRole(role._id, updateData)
        updatedCount++
      }
    }
    
    return updatedCount
  }

  // 用户相关方法
  async getUsers() {
    return await this.find('users', { status: 1 }, { sort: { createdAt: -1 } });
  }

  async getUserById(id) {
    return await this.findOne('users', { _id: id, status: 1 });
  }

  async getUserByUsername(username) {
    return await this.findOne('users', { username: username, status: 1 });
  }

  async createUser(data) {
    const user = {
      ...data,
      status: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return await this.insert('users', user);
  }

  async updateUser(id, data) {
    const update = {
      ...data,
      updatedAt: new Date()
    };
    return await this.update('users', { _id: id }, { $set: update });
  }

  async updateLastLogin(id) {
    return await this.update('users', { _id: id }, { $set: { lastLogin: new Date() } });
  }

  async updatePassword(id, hashedPassword) {
    return await this.update('users', { _id: id }, { $set: { password: hashedPassword } });
  }

  async findUserByUsernameOrEmail(username, email) {
    if (email) {
      // 先尝试按用户名查找
      let user = await this.findOne('users', { username: username });
      if (!user) {
        // 再尝试按邮箱查找
        user = await this.findOne('users', { email: email });
      }
      return user;
    } else {
      return await this.findOne('users', { username: username });
    }
  }

  // 项目相关方法
  async getProjects() {
    return await this.find('projects', { status: { $ne: 'deleted' } }, { sort: { createdAt: -1 } });
  }

  async getProjectById(id) {
    return await this.findOne('projects', { _id: id, status: { $ne: 'deleted' } });
  }

  async createProject(data) {
    const project = {
      ...data,
      status: 'planning',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return await this.insert('projects', project);
  }

  async updateProject(id, data) {
    const update = {
      ...data,
      updatedAt: new Date()
    };
    return await this.update('projects', { _id: id }, { $set: update });
  }

  async deleteProject(id) {
    return await this.update('projects', { _id: id }, { $set: { status: 'deleted' } });
  }

  // 项目权重相关方法
  async getProjectWeights(projectId) {
    return await this.find('projectLineWeights', { projectId: projectId });
  }

  async updateProjectWeights(projectId, weights) {
    // 先删除旧的权重配置
    await this.remove('projectLineWeights', { projectId: projectId });
    
    // 插入新的权重配置
    const weightData = weights.map(weight => ({
      projectId: projectId,
      businessLineId: weight.businessLineId,
      weight: weight.weight,
      reason: weight.reason,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    return await this.insert('projectLineWeights', weightData);
  }

  // 项目成员相关方法
  async getProjectMembers(projectId) {
    return await this.find('projectMembers', { projectId: projectId });
  }

  async getProjectMemberById(id) {
    return await this.findOne('projectMembers', { _id: id });
  }

  async getEmployeeProjectMembers(employeeId) {
    return await this.find('projectMembers', { employeeId: employeeId });
  }

  async createProjectMember(data) {
    const member = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return await this.insert('projectMembers', member);
  }

  async updateProjectMember(id, data) {
    const update = {
      ...data,
      updatedAt: new Date()
    };
    return await this.update('projectMembers', { _id: id }, { $set: update });
  }

  async getProjectsByManager(managerId) {
    return await this.find('projects', { managerId: managerId, status: { $in: ['planning', 'active'] } });
  }

  // 项目角色相关方法
  async getProjectRoles() {
    return await this.find('projectRoles', { status: 1 }, { sort: { name: 1 } });
  }

  async getProjectRoleById(id) {
    return await this.findOne('projectRoles', { _id: id });
  }

  async createProjectRole(data) {
    const role = {
      ...data,
      status: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return await this.insert('projectRoles', role);
  }

  async updateProjectRole(id, data) {
    const update = {
      ...data,
      updatedAt: new Date()
    };
    return await this.update('projectRoles', { _id: id }, { $set: update });
  }

  // 项目奖金池相关方法
  async getProjectBonusPool(projectId, period) {
    return await this.findOne('projectBonusPools', { projectId: projectId, period: period });
  }

  async createProjectBonusPool(data) {
    const pool = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return await this.insert('projectBonusPools', pool);
  }

  async updateProjectBonusPool(id, data) {
    const update = {
      ...data,
      updatedAt: new Date()
    };
    return await this.update('projectBonusPools', { _id: id }, { $set: update });
  }

  // 项目奖金分配相关方法
  async getProjectBonusAllocations(poolId) {
    return await this.find('projectBonusAllocations', { poolId: poolId });
  }

  async createProjectBonusAllocation(data) {
    const allocation = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return await this.insert('projectBonusAllocations', allocation);
  }

  async updateProjectBonusAllocation(id, data) {
    const update = {
      ...data,
      updatedAt: new Date()
    };
    return await this.update('projectBonusAllocations', { _id: id }, { $set: update });
  }

  // 项目角色权重相关方法
  async getProjectRoleWeights(projectId) {
    return await this.findOne('projectRoleWeights', { projectId: projectId });
  }

  async createProjectRoleWeights(data) {
    const weights = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return await this.insert('projectRoleWeights', weights);
  }

  async updateProjectRoleWeights(projectId, data) {
    const update = {
      ...data,
      updatedAt: new Date()
    };
    return await this.update('projectRoleWeights', { projectId: projectId }, { $set: update });
  }

  // 获取数据库统计信息
  async getDatabaseStats() {
    if (!this.isInitialized) {
      throw new Error('服务未初始化');
    }

    try {
      const stats = {
        businessLines: await this.count('businessLines', { status: 1 }),
        departments: await this.count('departments', { status: 1 }),
        positions: await this.count('positions', { status: 1 }),
        roles: await this.count('roles', { status: 1 }),
        users: await this.count('users', { status: 1 }),
        employees: await this.count('employees', { status: 1 })
      };
      
      return stats;
    } catch (error) {
      console.error('❌ 获取统计信息失败:', error.message);
      throw error;
    }
  }
}

// 创建单例实例
const nedbService = new NeDBService();

module.exports = nedbService;
