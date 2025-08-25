const DataStore = require('nedb');
const path = require('path');
const LRU = require('lru-cache');

/**
 * 优化后的 NeDB 数据服务
 * 解决 N+1 查询问题，添加缓存层，优化查询性能
 */
class OptimizedNeDBService {
  constructor() {
    this.databases = {};
    this.isInitialized = false;
    
    // 创建分层缓存系统
    this.caches = {
      // 短期缓存 - 用于热点数据 (5分钟TTL)
      hot: new LRU({ 
        max: 1000, 
        ttl: 1000 * 60 * 5,
        allowStale: true 
      }),
      // 中期缓存 - 用于参考数据 (30分钟TTL) 
      reference: new LRU({ 
        max: 500, 
        ttl: 1000 * 60 * 30,
        allowStale: true 
      }),
      // 长期缓存 - 用于静态数据 (2小时TTL)
      static: new LRU({ 
        max: 200, 
        ttl: 1000 * 60 * 120,
        allowStale: true 
      })
    };
    
    // 查询性能监控
    this.queryStats = {
      totalQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      slowQueries: 0,
      averageQueryTime: 0,
      queryTimes: []
    };
    
    // 连接池配置（模拟）
    this.connectionPool = {
      maxConnections: 10,
      activeConnections: 0,
      waitingQueue: []
    };
  }

  /**
   * 初始化优化的 NeDB 服务
   */
  async initialize() {
    try {
      console.log('🚀 初始化优化后的 NeDB 服务...');
      
      const dbPath = path.join(__dirname, '../../../database');
      this.dataDir = dbPath;
      
      console.log(`📁 数据库路径: ${dbPath}`);
      
      // 创建数据库实例
      const collections = [
        'businessLines', 'departments', 'positions', 'roles', 'users', 
        'employees', 'projects', 'projectLineWeights', 'projectMembers',
        'projectRoles', 'projectBonusPools', 'projectBonusAllocations',
        'projectRoleWeights', 'performanceRecords', 'threeDimensionalResults'
      ];
      
      for (const collection of collections) {
        this.databases[collection] = new DataStore({
          filename: path.join(dbPath, `${collection}.db`),
          autoload: true,
          timestampData: true
        });
      }
      
      // 创建优化索引
      await this.createOptimizedIndexes();
      
      // 预热缓存
      await this.warmupCache();
      
      this.isInitialized = true;
      console.log('✅ 优化后的 NeDB 服务初始化完成');
      
    } catch (error) {
      console.error('❌ 优化 NeDB 服务初始化失败:', error.message);
      throw error;
    }
  }

  /**
   * 创建优化的索引策略
   */
  async createOptimizedIndexes() {
    try {
      console.log('🔧 创建优化索引...');
      
      // 员工表复合索引
      this.databases.employees.ensureIndex({ fieldName: 'employeeNo', unique: true });
      this.databases.employees.ensureIndex({ fieldName: 'name' });
      this.databases.employees.ensureIndex({ fieldName: 'status' });
      this.databases.employees.ensureIndex({ fieldName: ['departmentId', 'status'] }); // 复合索引
      this.databases.employees.ensureIndex({ fieldName: ['positionId', 'status'] });
      this.databases.employees.ensureIndex({ fieldName: ['departmentId', 'positionId'] });
      
      // 部门表索引
      this.databases.departments.ensureIndex({ fieldName: 'code', unique: true });
      this.databases.departments.ensureIndex({ fieldName: 'businessLineId' });
      this.databases.departments.ensureIndex({ fieldName: ['businessLineId', 'status'] });
      
      // 岗位表索引
      this.databases.positions.ensureIndex({ fieldName: 'code', unique: true });
      this.databases.positions.ensureIndex({ fieldName: 'businessLineId' });
      this.databases.positions.ensureIndex({ fieldName: ['businessLineId', 'status'] });
      this.databases.positions.ensureIndex({ fieldName: 'level' });
      
      // 用户表索引
      this.databases.users.ensureIndex({ fieldName: 'username', unique: true });
      this.databases.users.ensureIndex({ fieldName: 'email' });
      this.databases.users.ensureIndex({ fieldName: 'roleId' });
      this.databases.users.ensureIndex({ fieldName: ['status', 'roleId'] });
      
      // 业务线表索引
      this.databases.businessLines.ensureIndex({ fieldName: 'code', unique: true });
      this.databases.businessLines.ensureIndex({ fieldName: 'status' });
      
      // 角色表索引
      this.databases.roles.ensureIndex({ fieldName: 'code', unique: true });
      this.databases.roles.ensureIndex({ fieldName: 'status' });
      
      // 项目相关索引
      this.databases.projects.ensureIndex({ fieldName: 'code', unique: true });
      this.databases.projects.ensureIndex({ fieldName: 'managerId' });
      this.databases.projects.ensureIndex({ fieldName: ['status', 'managerId'] });
      
      this.databases.projectMembers.ensureIndex({ fieldName: 'projectId' });
      this.databases.projectMembers.ensureIndex({ fieldName: 'employeeId' });
      this.databases.projectMembers.ensureIndex({ fieldName: ['projectId', 'employeeId'] });
      
      // 绩效记录索引
      if (this.databases.performanceRecords) {
        this.databases.performanceRecords.ensureIndex({ fieldName: 'employeeId' });
        this.databases.performanceRecords.ensureIndex({ fieldName: 'period' });
        this.databases.performanceRecords.ensureIndex({ fieldName: ['employeeId', 'period'] });
      }
      
      // 三维计算结果索引
      if (this.databases.threeDimensionalResults) {
        this.databases.threeDimensionalResults.ensureIndex({ fieldName: 'employeeId' });
        this.databases.threeDimensionalResults.ensureIndex({ fieldName: 'calculationPeriod' });
        this.databases.threeDimensionalResults.ensureIndex({ fieldName: ['employeeId', 'calculationPeriod'] });
        this.databases.threeDimensionalResults.ensureIndex({ fieldName: ['calculationPeriod', 'reviewStatus'] });
        this.databases.threeDimensionalResults.ensureIndex({ fieldName: 'finalScore' });
      }
      
      console.log('✅ 优化索引创建完成');
      
    } catch (error) {
      console.error('❌ 创建优化索引失败:', error.message);
      throw error;
    }
  }

  /**
   * 预热缓存 - 加载常用的参考数据
   */
  async warmupCache() {
    try {
      console.log('🔥 预热缓存...');
      
      // 加载业务线数据到静态缓存
      const businessLines = await this._findWithoutCache('businessLines', { status: 1 });
      this.caches.static.set('businessLines:active', businessLines);
      
      // 加载部门数据到参考缓存
      const departments = await this._findWithoutCache('departments', { status: 1 });
      this.caches.reference.set('departments:active', departments);
      
      // 加载岗位数据到参考缓存
      const positions = await this._findWithoutCache('positions', { status: 1 });
      this.caches.reference.set('positions:active', positions);
      
      // 加载角色数据到静态缓存
      const roles = await this._findWithoutCache('roles', { status: 1 });
      this.caches.static.set('roles:active', roles);
      
      console.log('✅ 缓存预热完成');
      
    } catch (error) {
      console.error('❌ 缓存预热失败:', error.message);
    }
  }

  /**
   * 生成缓存键
   */
  _generateCacheKey(collection, query, options = {}) {
    const queryStr = JSON.stringify(query);
    const optionsStr = JSON.stringify(options);
    return `${collection}:${Buffer.from(queryStr + optionsStr).toString('base64')}`;
  }

  /**
   * 获取适当的缓存层
   */
  _getCacheLayer(collection, query) {
    // 静态数据使用长期缓存
    if (['businessLines', 'roles'].includes(collection)) {
      return this.caches.static;
    }
    
    // 参考数据使用中期缓存
    if (['departments', 'positions'].includes(collection)) {
      return this.caches.reference;
    }
    
    // 动态数据使用短期缓存
    return this.caches.hot;
  }

  /**
   * 带缓存的查询方法
   */
  async find(collection, query = {}, options = {}) {
    const startTime = Date.now();
    this.queryStats.totalQueries++;
    
    try {
      if (!this.isInitialized) {
        throw new Error('NeDB 服务未初始化，请等待初始化完成');
      }

      const cacheKey = this._generateCacheKey(collection, query, options);
      const cache = this._getCacheLayer(collection, query);
      
      // 尝试从缓存获取
      const cached = cache.get(cacheKey);
      if (cached) {
        this.queryStats.cacheHits++;
        console.log(`🎯 缓存命中: ${collection}`);
        return cached.map(doc => this.enhanceDocument(doc));
      }
      
      this.queryStats.cacheMisses++;
      
      // 从数据库查询
      const result = await this._findWithoutCache(collection, query, options);
      
      // 缓存结果
      cache.set(cacheKey, result);
      
      const queryTime = Date.now() - startTime;
      this._updateQueryStats(queryTime);
      
      console.log(`🔍 数据库查询: ${collection}, 耗时: ${queryTime}ms, 结果: ${result.length} 条`);
      
      return result.map(doc => this.enhanceDocument(doc));
      
    } catch (error) {
      console.error(`❌ 查询失败: ${collection}`, error);
      throw error;
    }
  }

  /**
   * 不使用缓存的原始查询
   */
  async _findWithoutCache(collection, query = {}, options = {}) {
    this.ensureCollection(collection);
    
    return new Promise((resolve, reject) => {
      this.databases[collection].find(query, options, (err, docs) => {
        if (err) {
          reject(new Error(`查询 ${collection} 失败: ${err.message}`));
        } else {
          resolve(docs);
        }
      });
    });
  }

  /**
   * 优化的员工列表查询 - 解决 N+1 问题
   */
  async getEmployeesWithDetails(filters = {}, pagination = {}) {
    try {
      const startTime = Date.now();
      console.log('🔍 执行优化的员工查询...');
      
      const { 
        search, 
        departmentId, 
        positionId, 
        status = 1,
        page = 1, 
        pageSize = 20 
      } = { ...filters, ...pagination };

      // 1. 并行加载所有需要的参考数据
      const [employees, departments, positions, businessLines] = await Promise.all([
        this.find('employees', { status }),
        this.find('departments', { status: 1 }),
        this.find('positions', { status: 1 }),
        this.find('businessLines', { status: 1 })
      ]);

      // 2. 创建查找映射以提高性能
      const departmentMap = new Map(departments.map(d => [d._id, d]));
      const positionMap = new Map(positions.map(p => [p._id, p]));
      const businessLineMap = new Map(businessLines.map(bl => [bl._id, bl]));

      // 3. 应用过滤器
      let filteredEmployees = employees;

      if (search) {
        const searchLower = search.toLowerCase();
        filteredEmployees = filteredEmployees.filter(emp => 
          emp.name.toLowerCase().includes(searchLower) ||
          emp.employeeNo.toLowerCase().includes(searchLower) ||
          (emp.email && emp.email.toLowerCase().includes(searchLower)) ||
          (emp.phone && emp.phone.toLowerCase().includes(searchLower))
        );
      }

      if (departmentId) {
        filteredEmployees = filteredEmployees.filter(emp => emp.departmentId === departmentId);
      }

      if (positionId) {
        filteredEmployees = filteredEmployees.filter(emp => emp.positionId === positionId);
      }

      // 4. 分页处理
      const total = filteredEmployees.length;
      const offset = (page - 1) * pageSize;
      const paginatedEmployees = filteredEmployees.slice(offset, offset + parseInt(pageSize));

      // 5. 一次性组装完整数据（无 N+1 查询）
      const employeesWithDetails = paginatedEmployees.map(employee => {
        const department = departmentMap.get(employee.departmentId);
        const position = positionMap.get(employee.positionId);
        const businessLine = department ? businessLineMap.get(department.businessLineId) : null;

        return {
          ...employee,
          id: employee._id,
          department: department ? {
            id: department._id,
            name: department.name,
            code: department.code
          } : null,
          position: position ? {
            id: position._id,
            name: position.name,
            code: position.code,
            level: position.level
          } : null,
          businessLine: businessLine ? {
            id: businessLine._id,
            name: businessLine.name,
            code: businessLine.code
          } : null
        };
      });

      const queryTime = Date.now() - startTime;
      console.log(`✅ 优化员工查询完成，耗时: ${queryTime}ms，返回: ${employeesWithDetails.length}/${total} 条记录`);

      return {
        employees: employeesWithDetails,
        pagination: {
          total,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(total / pageSize)
        },
        performance: {
          queryTime,
          cacheHitRate: this.getCacheHitRate()
        }
      };

    } catch (error) {
      console.error('❌ 优化员工查询失败:', error);
      throw error;
    }
  }

  /**
   * 优化的单员工详情查询
   */
  async getEmployeeWithDetails(employeeId) {
    try {
      const startTime = Date.now();
      
      // 并行查询员工和参考数据
      const [employee, departments, positions, businessLines] = await Promise.all([
        this.findOne('employees', { _id: employeeId }),
        this.find('departments', { status: 1 }),
        this.find('positions', { status: 1 }),
        this.find('businessLines', { status: 1 })
      ]);

      if (!employee) {
        return null;
      }

      // 创建查找映射
      const departmentMap = new Map(departments.map(d => [d._id, d]));
      const positionMap = new Map(positions.map(p => [p._id, p]));
      const businessLineMap = new Map(businessLines.map(bl => [bl._id, bl]));

      // 组装完整数据
      const department = departmentMap.get(employee.departmentId);
      const position = positionMap.get(employee.positionId);
      const businessLine = department ? businessLineMap.get(department.businessLineId) : null;

      const result = {
        ...employee,
        id: employee._id,
        department: department ? {
          id: department._id,
          name: department.name,
          code: department.code
        } : null,
        position: position ? {
          id: position._id,
          name: position.name,
          code: position.code,
          level: position.level
        } : null,
        businessLine: businessLine ? {
          id: businessLine._id,
          name: businessLine.name,
          code: businessLine.code
        } : null
      };

      const queryTime = Date.now() - startTime;
      console.log(`✅ 员工详情查询完成，耗时: ${queryTime}ms`);

      return result;

    } catch (error) {
      console.error('❌ 员工详情查询失败:', error);
      throw error;
    }
  }

  /**
   * 批量获取员工详情 - 用于奖金计算
   */
  async getBatchEmployeesWithDetails(employeeIds) {
    try {
      const startTime = Date.now();
      console.log(`🔍 批量查询 ${employeeIds.length} 个员工详情...`);

      if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
        return [];
      }

      // 并行加载数据
      const [employees, departments, positions, businessLines] = await Promise.all([
        this.find('employees', { _id: { $in: employeeIds } }),
        this.find('departments', { status: 1 }),
        this.find('positions', { status: 1 }),
        this.find('businessLines', { status: 1 })
      ]);

      // 创建映射
      const departmentMap = new Map(departments.map(d => [d._id, d]));
      const positionMap = new Map(positions.map(p => [p._id, p]));
      const businessLineMap = new Map(businessLines.map(bl => [bl._id, bl]));

      // 批量组装数据
      const result = employees.map(employee => {
        const department = departmentMap.get(employee.departmentId);
        const position = positionMap.get(employee.positionId);
        const businessLine = department ? businessLineMap.get(department.businessLineId) : null;

        return {
          ...employee,
          id: employee._id,
          Department: department ? {
            id: department._id,
            name: department.name,
            code: department.code
          } : null,
          Position: position ? {
            id: position._id,
            name: position.name,
            code: position.code,
            level: position.level
          } : null,
          BusinessLine: businessLine ? [{
            id: businessLine._id,
            name: businessLine.name,
            code: businessLine.code
          }] : []
        };
      });

      const queryTime = Date.now() - startTime;
      console.log(`✅ 批量员工查询完成，耗时: ${queryTime}ms，返回: ${result.length} 条记录`);

      return result;

    } catch (error) {
      console.error('❌ 批量员工查询失败:', error);
      throw error;
    }
  }

  /**
   * 优化的奖金计算相关查询
   */
  async getEligibleEmployeesOptimized(period, minScore = 0, filters = {}) {
    try {
      const startTime = Date.now();
      console.log(`🔍 查询符合条件的员工: 期间=${period}, 最低分=${minScore}`);

      // 构建查询条件
      const query = {
        calculationPeriod: period,
        reviewStatus: 'approved',
        finalScore: { $gte: minScore, $gt: 0 }
      };

      // 应用过滤器
      if (filters.weightConfigId) {
        query.weightConfigId = filters.weightConfigId;
      }

      // 并行查询三维结果和参考数据
      const [calculationResults, employees, departments, positions, businessLines] = await Promise.all([
        this.find('threeDimensionalResults', query, { sort: { finalScore: -1 } }),
        this.find('employees', { status: 1 }),
        this.find('departments', { status: 1 }),
        this.find('positions', { status: 1 }),
        this.find('businessLines', { status: 1 })
      ]);

      // 创建映射
      const employeeMap = new Map(employees.map(e => [e._id, e]));
      const departmentMap = new Map(departments.map(d => [d._id, d]));
      const positionMap = new Map(positions.map(p => [p._id, p]));
      const businessLineMap = new Map(businessLines.map(bl => [bl._id, bl]));

      // 过滤有效员工并组装数据
      const eligibleEmployees = calculationResults
        .filter(result => employeeMap.has(result.employeeId))
        .map(result => {
          const employee = employeeMap.get(result.employeeId);
          const department = departmentMap.get(employee.departmentId);
          const position = positionMap.get(employee.positionId);
          const businessLine = department ? businessLineMap.get(department.businessLineId) : null;

          return {
            ...result,
            Employee: {
              ...employee,
              Department: department,
              Position: position,
              BusinessLine: businessLine ? [businessLine] : []
            }
          };
        });

      const queryTime = Date.now() - startTime;
      console.log(`✅ 符合条件的员工查询完成，耗时: ${queryTime}ms，找到: ${eligibleEmployees.length} 名员工`);

      return eligibleEmployees;

    } catch (error) {
      console.error('❌ 查询符合条件的员工失败:', error);
      throw error;
    }
  }

  /**
   * 缓存失效方法
   */
  invalidateCache(pattern) {
    console.log(`🗑️ 清理缓存: ${pattern}`);
    
    Object.values(this.caches).forEach(cache => {
      const keys = Array.from(cache.keys());
      keys.forEach(key => {
        if (key.includes(pattern)) {
          cache.delete(key);
        }
      });
    });
  }

  /**
   * 更新查询统计
   */
  _updateQueryStats(queryTime) {
    this.queryStats.queryTimes.push(queryTime);
    
    // 保持最近1000次查询记录
    if (this.queryStats.queryTimes.length > 1000) {
      this.queryStats.queryTimes = this.queryStats.queryTimes.slice(-1000);
    }
    
    // 计算平均查询时间
    this.queryStats.averageQueryTime = 
      this.queryStats.queryTimes.reduce((sum, time) => sum + time, 0) / 
      this.queryStats.queryTimes.length;
    
    // 记录慢查询
    if (queryTime > 1000) {
      this.queryStats.slowQueries++;
      console.warn(`🐌 慢查询警告: ${queryTime}ms`);
    }
  }

  /**
   * 获取缓存命中率
   */
  getCacheHitRate() {
    const total = this.queryStats.cacheHits + this.queryStats.cacheMisses;
    return total > 0 ? (this.queryStats.cacheHits / total * 100).toFixed(2) + '%' : '0%';
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats() {
    return {
      ...this.queryStats,
      cacheHitRate: this.getCacheHitRate(),
      cacheStats: {
        hot: { size: this.caches.hot.size, max: this.caches.hot.max },
        reference: { size: this.caches.reference.size, max: this.caches.reference.max },
        static: { size: this.caches.static.size, max: this.caches.static.max }
      }
    };
  }

  // 继承原有方法
  async findOne(collection, query = {}) {
    const results = await this.find(collection, query);
    return results.length > 0 ? results[0] : null;
  }

  async insert(collection, data) {
    const result = await this._insertWithoutCache(collection, data);
    
    // 清理相关缓存
    this.invalidateCache(collection);
    
    return Array.isArray(result) 
      ? result.map(doc => this.enhanceDocument(doc))
      : this.enhanceDocument(result);
  }

  async update(collection, query, update, options = {}) {
    const result = await this._updateWithoutCache(collection, query, update, options);
    
    // 清理相关缓存
    this.invalidateCache(collection);
    
    return result;
  }

  async remove(collection, query, options = {}) {
    const result = await this._removeWithoutCache(collection, query, options);
    
    // 清理相关缓存
    this.invalidateCache(collection);
    
    return result;
  }

  // 私有方法实现
  async _insertWithoutCache(collection, data) {
    this.ensureCollection(collection);
    
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
          reject(new Error(`插入 ${collection} 失败: ${err.message}`));
        } else {
          resolve(newDoc);
        }
      });
    });
  }

  async _updateWithoutCache(collection, query, update, options = {}) {
    this.ensureCollection(collection);
    
    if (update.$set) {
      update.$set.updatedAt = new Date();
    } else if (typeof update === 'object' && !update.$set && !update.$unset && !update.$inc) {
      update.updatedAt = new Date();
    }

    return new Promise((resolve, reject) => {
      this.databases[collection].update(query, update, options, (err, numReplaced) => {
        if (err) {
          reject(new Error(`更新 ${collection} 失败: ${err.message}`));
        } else {
          resolve(numReplaced);
        }
      });
    });
  }

  async _removeWithoutCache(collection, query, options = {}) {
    this.ensureCollection(collection);
    
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

  ensureCollection(collection) {
    if (!this.databases[collection]) {
      const Datastore = require('nedb');
      const dbPath = path.join(this.dataDir, `${collection}.db`);
      this.databases[collection] = new Datastore({
        filename: dbPath,
        autoload: true,
        timestampData: true
      });
    }
  }

  enhanceDocument(doc) {
    if (!doc || typeof doc !== 'object') return doc;
    
    const enhanced = { ...doc };
    
    if (enhanced._id && !enhanced.id) {
      enhanced.id = enhanced._id;
    }
    
    enhanced.toJSON = function() {
      const result = { ...this };
      delete result.toJSON;
      delete result.update;
      delete result.destroy;
      delete result.save;
      delete result.reload;
      return result;
    };

    return enhanced;
  }

  // 批量操作方法
  async batchInsert(collection, dataArray) {
    return await this.insert(collection, dataArray);
  }

  async batchUpdate(collection, updates) {
    const results = [];
    for (const { query, update, options } of updates) {
      const result = await this.update(collection, query, update, options);
      results.push(result);
    }
    return results;
  }

  async count(collection, query = {}) {
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

  // 向后兼容方法
  async getEmployees() {
    const result = await this.getEmployeesWithDetails();
    return result.employees;
  }

  async getEmployeeById(id) {
    return await this.getEmployeeWithDetails(id);
  }

  async getDepartments() {
    return await this.find('departments', { status: 1 }, { sort: { sort: 1, name: 1 } });
  }

  async getPositions() {
    return await this.find('positions', { status: 1 }, { sort: { name: 1 } });
  }

  async getBusinessLines() {
    return await this.find('businessLines', { status: 1 }, { sort: { name: 1 } });
  }

  async getRoles() {
    return await this.find('roles', { status: 1 }, { sort: { name: 1 } });
  }

  async getUsers() {
    return await this.find('users', { status: 1 }, { sort: { createdAt: -1 } });
  }
}

// 创建优化的单例实例
const optimizedNedbService = new OptimizedNeDBService();

module.exports = optimizedNedbService;