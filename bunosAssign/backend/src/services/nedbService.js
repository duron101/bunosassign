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

      this.databases.projectMembers = new DataStore({
        filename: path.join(dbPath, 'project_members.db'),
        autoload: true
      });

      this.databases.permissionDelegations = new DataStore({
        filename: path.join(dbPath, 'permission_delegations.db'),
        autoload: true
      });

      this.databases.auditLogs = new DataStore({
        filename: path.join(dbPath, 'audit_logs.db'),
        autoload: true
      });

      this.databases.teamApplications = new DataStore({
        filename: path.join(dbPath, 'team_applications.db'),
        autoload: true
      });

      this.databases.projectCosts = new DataStore({
        filename: path.join(dbPath, 'project_costs.db'),
        autoload: true
      });

      this.databases.projectCostSummary = new DataStore({
        filename: path.join(dbPath, 'project_cost_summary.db'),
        autoload: true
      });

      this.databases.bonusAdjustments = new DataStore({
        filename: path.join(dbPath, 'bonus_adjustments.db'),
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
      console.log('🔄 开始创建数据库索引...');
      
      // 清理旧索引，避免冲突
      for (const collectionName in this.databases) {
        try {
          const collection = this.databases[collectionName];
          // 获取现有索引
          const indexes = collection.getIndexes();
          console.log(`📊 ${collectionName} 现有索引:`, indexes);
        } catch (error) {
          console.log(`⚠️ 获取 ${collectionName} 索引信息失败:`, error.message);
        }
      }
      
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
      this.databases.users.ensureIndex({ fieldName: 'email', unique: false, sparse: true });
      
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
      
      // 项目成员索引
      this.databases.projectMembers.ensureIndex({ fieldName: 'projectId' });
      this.databases.projectMembers.ensureIndex({ fieldName: 'employeeId' });
      this.databases.projectMembers.ensureIndex({ fieldName: 'status' });
      
      // 权限委派索引
      this.databases.permissionDelegations.ensureIndex({ fieldName: 'userId' });
      this.databases.permissionDelegations.ensureIndex({ fieldName: 'delegateTo' });
      this.databases.permissionDelegations.ensureIndex({ fieldName: 'resourceType' });
      this.databases.permissionDelegations.ensureIndex({ fieldName: 'resourceId' });
      this.databases.permissionDelegations.ensureIndex({ fieldName: 'action' });
      this.databases.permissionDelegations.ensureIndex({ fieldName: 'status' });

      // 审计日志索引
      this.databases.auditLogs.ensureIndex({ fieldName: 'userId' });
      this.databases.auditLogs.ensureIndex({ fieldName: 'action' });
      this.databases.auditLogs.ensureIndex({ fieldName: 'resourceType' });
      this.databases.auditLogs.ensureIndex({ fieldName: 'resourceId' });
      this.databases.auditLogs.ensureIndex({ fieldName: 'createdAt' });

      // 团队申请索引
      this.databases.teamApplications.ensureIndex({ fieldName: 'projectId', unique: false });
      this.databases.teamApplications.ensureIndex({ fieldName: 'applicantId', unique: false });
      this.databases.teamApplications.ensureIndex({ fieldName: 'status', unique: false });
      this.databases.teamApplications.ensureIndex({ fieldName: 'createdAt', unique: false });

      // 项目成本索引
      this.databases.projectCosts.ensureIndex({ fieldName: 'projectId', unique: false });
      this.databases.projectCosts.ensureIndex({ fieldName: 'costType', unique: false });
      this.databases.projectCosts.ensureIndex({ fieldName: 'date', unique: false });
      this.databases.projectCosts.ensureIndex({ fieldName: 'status', unique: false });

      // 项目成本汇总索引
      this.databases.projectCostSummary.ensureIndex({ fieldName: 'projectId', unique: true });
      this.databases.projectCostSummary.ensureIndex({ fieldName: 'lastUpdated', unique: false });

      // 奖金调整索引
      this.databases.bonusAdjustments.ensureIndex({ fieldName: 'allocationId', unique: false });
      this.databases.auditLogs.ensureIndex({ fieldName: 'employeeId', unique: false });
      this.databases.auditLogs.ensureIndex({ fieldName: 'status', unique: false });
      this.databases.auditLogs.ensureIndex({ fieldName: 'createdAt', unique: false });
      
      console.log('✅ 数据库索引创建完成');
      
    } catch (error) {
      console.error('❌ 创建索引失败:', error.message);
      throw error;
    }
  }

  // 通用查询方法
  async find(collection, query = {}, options = {}) {
    if (!this.isInitialized) {
      console.error('❌ NeDB 服务未初始化 - find 方法被调用');
      throw new Error('NeDB 服务未初始化，请等待初始化完成');
    }

    console.log(`🔍 find 查询: ${collection}, 条件: ${JSON.stringify(query)}, 选项: ${JSON.stringify(options)}`);

    try {
      // 确保集合存在
      this.ensureCollection(collection);

      return new Promise((resolve, reject) => {
        this.databases[collection].find(query, options, (err, docs) => {
          if (err) {
            console.error(`❌ find 查询错误: ${err.message}`);
            reject(new Error(`查询 ${collection} 失败: ${err.message}`));
          } else {
            console.log(`🔍 find 查询结果: 找到 ${docs.length} 条记录`);
            // 为每个文档添加Sequelize兼容方法
            const enhancedDocs = docs.map(doc => this.enhanceDocument(doc));
            resolve(enhancedDocs);
          }
        });
      });
    } catch (error) {
      console.error(`❌ find 方法执行失败: ${error.message}`);
      throw new Error(`查询 ${collection} 失败: ${error.message}`);
    }
  }

  // 增强文档，添加Sequelize兼容方法
  enhanceDocument(doc) {
    if (!doc || typeof doc !== 'object') return doc;
    
    // 创建一个新对象，避免修改原始文档
    const enhanced = { ...doc };
    
    // 添加id字段映射到_id（Sequelize兼容性）
    if (enhanced._id && !enhanced.id) {
      enhanced.id = enhanced._id;
    }
    
    // 添加toJSON方法
    enhanced.toJSON = function() {
      const result = { ...this };
      delete result.toJSON;
      delete result.update;
      delete result.destroy;
      delete result.save;
      delete result.reload;
      return result;
    };

    // 添加update方法
    const self = this;
    enhanced.update = async (updateData) => {
      const collection = self._getCollectionFromDoc(enhanced);
      return await self.update(collection, { _id: enhanced._id }, { $set: updateData });
    };

    // 添加destroy方法
    enhanced.destroy = async () => {
      const collection = self._getCollectionFromDoc(enhanced);
      return await self.remove(collection, { _id: enhanced._id });
    };

    // 添加save方法（Sequelize兼容）
    enhanced.save = async () => {
      const collection = self._getCollectionFromDoc(enhanced);
      const { _id, ...updateData } = enhanced;
      return await self.update(collection, { _id }, { $set: updateData });
    };

    // 添加reload方法（Sequelize兼容）
    enhanced.reload = async () => {
      const collection = self._getCollectionFromDoc(enhanced);
      return await self.findOne(collection, { _id: enhanced._id });
    };

    return enhanced;
  }

  // 从文档中推断集合名称（简化版）
  _getCollectionFromDoc(doc) {
    // 基于文档结构推断集合类型
    if (doc.username) return 'users';
    if (doc.employeeNo) return 'employees';
    if (doc.code && doc.weight !== undefined) return 'businessLines';
    if (doc.name && doc.departmentId !== undefined) return 'positions';
    if (doc.name && doc.businessLineId !== undefined) return 'departments';
    if (doc.permissions) return 'roles';
    if (doc.managerId) return 'projects';
    if (doc.userId) return 'permissionDelegations';
    if (doc.action) return 'auditLogs';
    return 'unknown';
  }

  // 查询单条数据
  async findOne(collection, query = {}) {
    if (!this.isInitialized) {
      console.error('❌ NeDB 服务未初始化 - findOne 方法被调用');
      throw new Error('NeDB 服务未初始化，请等待初始化完成');
    }

    console.log(`🔍 findOne 查询: ${collection}, 条件: ${JSON.stringify(query)}`);

    try {
      // 确保集合存在
      this.ensureCollection(collection);

      return new Promise((resolve, reject) => {
        this.databases[collection].findOne(query, (err, doc) => {
          if (err) {
            console.error(`❌ findOne 查询错误: ${err.message}`);
            reject(new Error(`查询 ${collection} 单条记录失败: ${err.message}`));
          } else {
            console.log(`🔍 findOne 查询结果: ${doc ? '找到记录' : '记录不存在'}`);
            // 增强单个文档
            const enhancedDoc = doc ? this.enhanceDocument(doc) : null;
            resolve(enhancedDoc);
          }
        });
      });
    } catch (error) {
      console.error(`❌ findOne 方法执行失败: ${error.message}`);
      throw new Error(`查询 ${collection} 单条记录失败: ${error.message}`);
    }
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
      throw new Error('NeDB 服务未初始化，请等待初始化完成');
    }

    console.log(`📝 insert 插入: ${collection}, 数据数量: ${Array.isArray(data) ? data.length : 1}`);

    try {
      // 确保集合存在
      this.ensureCollection(collection);

      // 为插入的数据添加时间戳
      const timestamp = new Date();
      if (Array.isArray(data)) {
        data.forEach(item => {
          if (!item.createdAt) item.createdAt = timestamp;
          if (!item.updatedAt) item.updatedAt = timestamp;
        });
      } else {
        if (!data.createdAt) data.createdAt = timestamp;
        if (!data.updatedAt) data.updatedAt = timestamp;
      }

      return new Promise((resolve, reject) => {
        this.databases[collection].insert(data, (err, newDoc) => {
          if (err) {
            console.error(`❌ insert 插入错误: ${err.message}`);
            reject(new Error(`插入 ${collection} 失败: ${err.message}`));
          } else {
            console.log(`📝 insert 插入成功: ${Array.isArray(newDoc) ? newDoc.length : 1} 条记录`);
            // 增强新插入的文档
            const enhancedDoc = Array.isArray(newDoc) 
              ? newDoc.map(doc => this.enhanceDocument(doc))
              : this.enhanceDocument(newDoc);
            resolve(enhancedDoc);
          }
        });
      });
    } catch (error) {
      console.error(`❌ insert 方法执行失败: ${error.message}`);
      throw new Error(`插入 ${collection} 失败: ${error.message}`);
    }
  }

  // 更新数据
  async update(collection, query, update, options = {}) {
    if (!this.isInitialized) {
      throw new Error('NeDB 服务未初始化，请等待初始化完成');
    }

    console.log(`📝 update 更新: ${collection}, 查询: ${JSON.stringify(query)}, 更新: ${JSON.stringify(update)}`);

    try {
      // 确保集合存在
      this.ensureCollection(collection);

      // 自动添加更新时间戳
      if (update.$set) {
        update.$set.updatedAt = new Date();
      } else if (typeof update === 'object' && !update.$set && !update.$unset && !update.$inc) {
        update.updatedAt = new Date();
      }

      return new Promise((resolve, reject) => {
        this.databases[collection].update(query, update, options, (err, numReplaced) => {
          if (err) {
            console.error(`❌ update 更新错误: ${err.message}`);
            reject(new Error(`更新 ${collection} 失败: ${err.message}`));
          } else {
            console.log(`📝 update 更新成功: ${numReplaced} 条记录`);
            resolve(numReplaced);
          }
        });
      });
    } catch (error) {
      console.error(`❌ update 方法执行失败: ${error.message}`);
      throw new Error(`更新 ${collection} 失败: ${error.message}`);
    }
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

  async getEmployeeByUserId(userId) {
    console.log(`🔍 通过用户ID查询员工: ${userId}`)
    
    // 方法1: 直接查询
    let result = await this.findOne('employees', { userId: userId })
    console.log(`🔍 直接查询结果: ${JSON.stringify(result)}`)
    
    // 方法2: 如果直接查询失败，尝试查询所有员工再过滤
    if (!result) {
      console.log(`🔍 直接查询失败，尝试查询所有员工再过滤`)
      const allEmployees = await this.find('employees', {})
      console.log(`🔍 所有员工数量: ${allEmployees.length}`)
      
      // 查找匹配的员工
      result = allEmployees.find(emp => emp.userId === userId || emp.userId == userId)
      console.log(`🔍 过滤查询结果: ${JSON.stringify(result)}`)
      
      // 如果没有找到，打印所有员工的userId用于调试
      if (!result) {
        console.log(`🔍 所有员工userId: ${allEmployees.map(emp => emp.userId).join(', ')}`)
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
      // 检查邮箱是否被其他用户使用（排除当前用户名）
      const userWithEmail = await this.findOne('users', { 
        email: email,
        username: { $ne: username } // 排除当前用户名
      });
      return userWithEmail;
    } else {
      return await this.findOne('users', { username: username });
    }
  }

  // 检查邮箱是否被其他用户使用
  async checkEmailExists(email, excludeUsername = null) {
    if (!email) return false;
    
    const query = { email: email };
    if (excludeUsername) {
      query.username = { $ne: excludeUsername };
    }
    
    const existingUser = await this.findOne('users', query);
    return !!existingUser;
  }

  // 修复authController中缺失的方法
  async findUserById(id) {
    console.log(`🔍 findUserById 查询用户: ${id}`);
    try {
      const user = await this.getUserById(id);
      console.log(`🔍 findUserById 结果: ${user ? '找到用户' : '用户不存在'}`);
      return user;
    } catch (error) {
      console.error(`❌ findUserById 查询失败: ${error.message}`);
      throw error;
    }
  }

  // 通用的findById方法，支持所有集合
  async findById(collection, id) {
    console.log(`🔍 findById 查询: ${collection}[${id}]`);
    try {
      const result = await this.findOne(collection, { _id: id });
      console.log(`🔍 findById 结果: ${result ? '找到记录' : '记录不存在'}`);
      return result;
    } catch (error) {
      console.error(`❌ findById 查询失败: ${error.message}`);
      throw error;
    }
  }

  // 批量查找方法
  async findByIds(collection, ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return [];
    }
    
    console.log(`🔍 findByIds 查询: ${collection}[${ids.join(', ')}]`);
    try {
      const results = await this.find(collection, { _id: { $in: ids } });
      console.log(`🔍 findByIds 结果: 找到 ${results.length}/${ids.length} 条记录`);
      return results;
    } catch (error) {
      console.error(`❌ findByIds 查询失败: ${error.message}`);
      throw error;
    }
  }

  // 检查记录是否存在
  async exists(collection, query) {
    try {
      const count = await this.count(collection, query);
      return count > 0;
    } catch (error) {
      console.error(`❌ exists 检查失败: ${error.message}`);
      return false;
    }
  }

  // 获取或创建记录
  async findOrCreate(collection, query, defaults = {}) {
    try {
      let record = await this.findOne(collection, query);
      let created = false;
      
      if (!record) {
        record = await this.insert(collection, { ...query, ...defaults });
        created = true;
      }
      
      return { record, created };
    } catch (error) {
      console.error(`❌ findOrCreate 失败: ${error.message}`);
      throw error;
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

  async resetProjectWeights(projectId) {
    // 删除项目的自定义权重配置，恢复默认权重
    return await this.remove('projectLineWeights', { projectId: projectId });
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

  // 权限委派相关方法
  async getPermissionDelegations(query = {}) {
    return await this.find('permissionDelegations', query);
  }

  async getPermissionDelegationById(id) {
    return await this.findOne('permissionDelegations', { _id: id });
  }

  async createPermissionDelegation(data) {
    const delegation = {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return await this.insert('permissionDelegations', delegation);
  }

  async updatePermissionDelegation(id, data) {
    const update = {
      ...data,
      updatedAt: new Date()
    };
    return await this.update('permissionDelegations', { _id: id }, { $set: update });
  }

  async deletePermissionDelegation(id) {
    return await this.remove('permissionDelegations', { _id: id });
  }

  // 审计日志相关方法
  async getAuditLogs(query = {}) {
    return await this.find('auditLogs', query);
  }

  async createAuditLog(data) {
    const log = {
      ...data,
      createdAt: new Date()
    };
    return await this.insert('auditLogs', log);
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

  /**
   * 创建奖金调整申请
   * @param {Object} adjustmentData - 调整申请数据
   * @returns {Promise<Object>} 创建的调整申请
   */
  async createBonusAdjustment(adjustmentData) {
    try {
      this.ensureCollection('bonusAdjustments')
      const result = await this.insert('bonusAdjustments', adjustmentData)
      logger.info('奖金调整申请创建成功', { adjustmentId: result._id })
      return result
    } catch (error) {
      logger.error('创建奖金调整申请失败:', error)
      throw error
    }
  }

  /**
   * 获取奖金调整申请
   * @param {Object} query - 查询条件
   * @returns {Promise<Array>} 调整申请列表
   */
  async getBonusAdjustments(query = {}) {
    try {
      this.ensureCollection('bonusAdjustments')
      return await this.find('bonusAdjustments', query)
    } catch (error) {
      logger.error('获取奖金调整申请失败:', error)
      throw error
    }
  }

  /**
   * 根据ID获取奖金调整申请
   * @param {string} adjustmentId - 调整申请ID
   * @returns {Promise<Object>} 调整申请
   */
  async getBonusAdjustmentById(adjustmentId) {
    try {
      this.ensureCollection('bonusAdjustments')
      return await this.findOne('bonusAdjustments', { _id: adjustmentId })
    } catch (error) {
      logger.error('根据ID获取奖金调整申请失败:', error)
      throw error
    }
  }

  /**
   * 更新奖金调整申请
   * @param {string} adjustmentId - 调整申请ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的调整申请
   */
  async updateBonusAdjustment(adjustmentId, updateData) {
    try {
      this.ensureCollection('bonusAdjustments')
      await this.update('bonusAdjustments', { _id: adjustmentId }, { $set: updateData })
      return await this.getBonusAdjustmentById(adjustmentId)
    } catch (error) {
      logger.error('更新奖金调整申请失败:', error)
      throw error
    }
  }

  /**
   * 删除奖金调整申请
   * @param {string} adjustmentId - 调整申请ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteBonusAdjustment(adjustmentId) {
    try {
      this.ensureCollection('bonusAdjustments')
      const result = await this.remove('bonusAdjustments', { _id: adjustmentId })
      if (result === 0) {
        throw new Error('奖金调整申请不存在')
      }
      logger.info('奖金调整申请删除成功', { adjustmentId })
      return true
    } catch (error) {
      logger.error('删除奖金调整申请失败:', error)
      throw error
    }
  }

  // ==================== 团队申请相关方法 ====================

  /**
   * 创建团队申请
   * @param {Object} applicationData - 申请数据
   * @returns {Promise<Object>} 创建的申请
   */
  async createTeamApplication(applicationData) {
    try {
      this.ensureCollection('teamApplications')
      const result = await this.insert('teamApplications', applicationData)
      console.log('✅ 团队申请创建成功:', result._id)
      return result
    } catch (error) {
      console.error('❌ 创建团队申请失败:', error)
      throw error
    }
  }

  /**
   * 获取团队申请列表
   * @param {Object} query - 查询条件
   * @returns {Promise<Array>} 申请列表
   */
  async getTeamApplications(query = {}) {
    try {
      this.ensureCollection('teamApplications')
      return await this.find('teamApplications', query)
    } catch (error) {
      console.error('❌ 获取团队申请列表失败:', error)
      throw error
    }
  }

  /**
   * 根据ID获取团队申请
   * @param {string} applicationId - 申请ID
   * @returns {Promise<Object>} 申请详情
   */
  async getTeamApplicationById(applicationId) {
    try {
      this.ensureCollection('teamApplications')
      return await this.findOne('teamApplications', { _id: applicationId })
    } catch (error) {
      console.error('❌ 根据ID获取团队申请失败:', error)
      throw error
    }
  }

  /**
   * 更新团队申请
   * @param {string} applicationId - 申请ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的申请
   */
  async updateTeamApplication(applicationId, updateData) {
    try {
      this.ensureCollection('teamApplications')
      await this.update('teamApplications', { _id: applicationId }, { $set: updateData })
      return await this.getTeamApplicationById(applicationId)
    } catch (error) {
      console.error('❌ 更新团队申请失败:', error)
      throw error
    }
  }

  /**
   * 删除团队申请
   * @param {string} applicationId - 申请ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteTeamApplication(applicationId) {
    try {
      this.ensureCollection('teamApplications')
      const result = await this.remove('teamApplications', { _id: applicationId })
      console.log('✅ 团队申请删除成功:', applicationId)
      return result > 0
    } catch (error) {
      console.error('❌ 删除团队申请失败:', error)
      throw error
    }
  }

  // ==================== 项目成本相关方法 ====================

  /**
   * 创建项目成本记录
   * @param {Object} costData - 成本数据
   * @returns {Promise<Object>} 创建的成本记录
   */
  async createProjectCost(costData) {
    try {
      this.ensureCollection('projectCosts')
      const result = await this.insert('projectCosts', costData)
      console.log('✅ 项目成本记录创建成功:', result._id)
      
      // 更新项目成本汇总
      await this.updateProjectCostSummary(costData.projectId)
      
      return result
    } catch (error) {
      console.error('❌ 创建项目成本记录失败:', error)
      throw error
    }
  }

  /**
   * 获取项目成本列表
   * @param {Object} query - 查询条件
   * @returns {Promise<Array>} 成本记录列表
   */
  async getProjectCosts(query = {}) {
    try {
      this.ensureCollection('projectCosts')
      return await this.find('projectCosts', query)
    } catch (error) {
      console.error('❌ 获取项目成本列表失败:', error)
      throw error
    }
  }

  /**
   * 根据项目ID获取成本列表
   * @param {string} projectId - 项目ID
   * @returns {Promise<Array>} 项目成本列表
   */
  async getProjectCostsByProjectId(projectId) {
    try {
      this.ensureCollection('projectCosts')
      return await this.find('projectCosts', { projectId })
    } catch (error) {
      console.error('❌ 根据项目ID获取成本列表失败:', error)
      throw error
    }
  }

  /**
   * 更新项目成本记录
   * @param {string} costId - 成本记录ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新后的成本记录
   */
  async updateProjectCost(costId, updateData) {
    try {
      this.ensureCollection('projectCosts')
      await this.update('projectCosts', { _id: costId }, { $set: updateData })
      
      // 获取成本记录以获取项目ID
      const cost = await this.findOne('projectCosts', { _id: costId })
      if (cost && cost.projectId) {
        // 更新项目成本汇总
        await this.updateProjectCostSummary(cost.projectId)
      }
      
      return await this.findOne('projectCosts', { _id: costId })
    } catch (error) {
      console.error('❌ 更新项目成本记录失败:', error)
      throw error
    }
  }

  /**
   * 删除项目成本记录
   * @param {string} costId - 成本记录ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async deleteProjectCost(costId) {
    try {
      this.ensureCollection('projectCosts')
      
      // 获取成本记录以获取项目ID
      const cost = await this.findOne('projectCosts', { _id: costId })
      if (!cost) {
        throw new Error('成本记录不存在')
      }
      
      const result = await this.remove('projectCosts', { _id: costId })
      
      // 更新项目成本汇总
      if (cost.projectId) {
        await this.updateProjectCostSummary(cost.projectId)
      }
      
      console.log('✅ 项目成本记录删除成功:', costId)
      return result > 0
    } catch (error) {
      console.error('❌ 删除项目成本记录失败:', error)
      throw error
    }
  }

  /**
   * 获取项目成本汇总
   * @param {string} projectId - 项目ID
   * @returns {Promise<Object>} 成本汇总信息
   */
  async getProjectCostSummary(projectId) {
    try {
      this.ensureCollection('projectCostSummary')
      let summary = await this.findOne('projectCostSummary', { projectId })
      
      if (!summary) {
        // 如果汇总不存在，创建一个初始汇总
        summary = await this.createProjectCostSummary(projectId)
      }
      
      return summary
    } catch (error) {
      console.error('❌ 获取项目成本汇总失败:', error)
      throw error
    }
  }

  /**
   * 创建项目成本汇总
   * @param {string} projectId - 项目ID
   * @returns {Promise<Object>} 创建的成本汇总
   */
  async createProjectCostSummary(projectId) {
    try {
      this.ensureCollection('projectCostSummary')
      
      // 获取项目信息
      const project = await this.findOne('projects', { _id: projectId })
      if (!project) {
        throw new Error('项目不存在')
      }
      
      // 计算当前成本
      const costs = await this.getProjectCostsByProjectId(projectId)
      const totalCost = costs.reduce((sum, cost) => sum + (cost.amount || 0), 0)
      
      const summary = {
        projectId,
        totalBudget: project.budget || 0,
        totalCost,
        currentProfit: (project.budget || 0) - totalCost,
        expectedProfit: (project.budget || 0) - totalCost,
        bonusRatio: 0.3, // 默认奖金比例30%
        estimatedBonus: ((project.budget || 0) - totalCost) * 0.3,
        lastUpdated: new Date()
      }
      
      const result = await this.insert('projectCostSummary', summary)
      console.log('✅ 项目成本汇总创建成功:', result._id)
      return result
    } catch (error) {
      console.error('❌ 创建项目成本汇总失败:', error)
      throw error
    }
  }

  /**
   * 更新项目成本汇总
   * @param {string} projectId - 项目ID
   * @returns {Promise<Object>} 更新后的成本汇总
   */
  async updateProjectCostSummary(projectId) {
    try {
      this.ensureCollection('projectCostSummary')
      
      // 获取项目信息
      const project = await this.findOne('projects', { _id: projectId })
      if (!project) {
        throw new Error('项目不存在')
      }
      
      // 计算当前成本
      const costs = await this.getProjectCostsByProjectId(projectId)
      const totalCost = costs.reduce((sum, cost) => sum + (cost.amount || 0), 0)
      
      const updateData = {
        totalCost,
        currentProfit: (project.budget || 0) - totalCost,
        expectedProfit: (project.budget || 0) - totalCost,
        estimatedBonus: ((project.budget || 0) - totalCost) * 0.3,
        lastUpdated: new Date()
      }
      
      await this.update('projectCostSummary', { projectId }, { $set: updateData })
      
      return await this.findOne('projectCostSummary', { projectId })
    } catch (error) {
      console.error('❌ 更新项目成本汇总失败:', error)
      throw error
    }
  }

  /**
   * 获取所有项目的成本汇总
   * @returns {Promise<Array>} 所有项目的成本汇总列表
   */
  async getAllProjectCostSummaries() {
    try {
      this.ensureCollection('projectCostSummary')
      return await this.find('projectCostSummary', {})
    } catch (error) {
      console.error('❌ 获取所有项目成本汇总失败:', error)
      throw error
    }
  }

  /**
   * 获取员工的项目成员记录
   * @param {string} employeeId - 员工ID
   * @returns {Promise<Array>} 项目成员记录列表
   */
  async getEmployeeProjectMembers(employeeId) {
    try {
      this.ensureCollection('projectMembers')
      return await this.find('projectMembers', { employeeId })
    } catch (error) {
      console.error('❌ 获取员工项目成员记录失败:', error)
      return [] // 返回空数组以避免错误
    }
  }

  /**
   * 创建项目成员记录
   * @param {Object} memberData - 项目成员数据
   * @returns {Promise<Object>} 创建的项目成员记录
   */
  async createProjectMember(memberData) {
    try {
      this.ensureCollection('projectMembers')
      const member = {
        ...memberData,
        _id: require('crypto').randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      return await this.insert('projectMembers', member)
    } catch (error) {
      console.error('❌ 创建项目成员记录失败:', error)
      throw error
    }
  }

  /**
   * 获取奖金分配记录
   * @param {Object} query - 查询条件
   * @returns {Promise<Array>} 奖金分配记录列表
   */
  async getBonusAllocations(query = {}) {
    try {
      this.ensureCollection('bonusAllocations')
      return await this.find('bonusAllocations', query)
    } catch (error) {
      console.error('❌ 获取奖金分配记录失败:', error)
      return [] // 返回空数组以避免错误
    }
  }

  /**
   * 获取员工通过用户ID
   * @param {string} userId - 用户ID
   * @returns {Promise<Object|null>} 员工记录
   */
  async getEmployeeByUserId(userId) {
    try {
      this.ensureCollection('employees')
      return await this.findOne('employees', { userId })
    } catch (error) {
      console.error('❌ 通过用户ID获取员工记录失败:', error)
      return null
    }
  }

  /**
   * 获取部门下的员工列表
   * @param {string} departmentId - 部门ID
   * @returns {Promise<Array>} 员工列表
   */
  async getEmployeesByDepartment(departmentId) {
    try {
      this.ensureCollection('employees')
      return await this.find('employees', { departmentId })
    } catch (error) {
      console.error('❌ 获取部门员工列表失败:', error)
      return [] // 返回空数组以避免错误
    }
  }
}

// 创建单例实例
const nedbService = new NeDBService();

module.exports = nedbService;
