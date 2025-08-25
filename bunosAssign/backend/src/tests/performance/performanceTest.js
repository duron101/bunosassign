const optimizedNedbService = require('../../services/optimizedNedbService');
const optimizedBonusAllocationService = require('../../services/optimizedBonusAllocationService');
const queryOptimizer = require('../../utils/queryOptimizer');
const { DatabasePool } = require('../../config/databasePool');

/**
 * 数据库性能测试套件
 * 测试优化后的数据库操作在大数据量场景下的性能表现
 */
class PerformanceTest {
  constructor() {
    this.testResults = [];
    this.testConfig = {
      // 测试数据量配置
      smallDataset: 100,     // 小数据量
      mediumDataset: 500,    // 中数据量  
      largeDataset: 1000,    // 大数据量
      xlDataset: 2000,       // 特大数据量
      
      // 性能目标（毫秒）
      targets: {
        singleQuery: 100,      // 单条查询目标
        batchQuery: 500,       // 批量查询目标
        employeeList: 1000,    // 员工列表目标
        bonusCalculation: 5000 // 奖金计算目标
      },
      
      // 测试重复次数
      iterations: 3
    };
  }

  /**
   * 运行所有性能测试
   */
  async runAllTests() {
    console.log('🚀 开始数据库性能测试...\n');
    
    try {
      // 初始化服务
      await this.initializeServices();
      
      // 准备测试数据
      await this.prepareTestData();
      
      // 运行测试套件
      await this.testBasicQueries();
      await this.testEmployeeOperations();
      await this.testBonusCalculations();
      await this.testConcurrentOperations();
      await this.testMemoryUsage();
      
      // 生成报告
      const report = this.generateReport();
      console.log('\n📊 性能测试完成！');
      console.log(report);
      
      return report;
      
    } catch (error) {
      console.error('❌ 性能测试失败:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * 初始化测试服务
   */
  async initializeServices() {
    console.log('🔧 初始化测试服务...');
    
    // 初始化优化的数据库服务
    if (!optimizedNedbService.isInitialized) {
      await optimizedNedbService.initialize();
    }
    
    console.log('✅ 服务初始化完成');
  }

  /**
   * 准备测试数据
   */
  async prepareTestData() {
    console.log('📋 准备测试数据...');
    
    const startTime = Date.now();
    
    // 创建业务线数据
    const businessLines = await this.createBusinessLines();
    
    // 创建部门数据
    const departments = await this.createDepartments(businessLines);
    
    // 创建岗位数据
    const positions = await this.createPositions(businessLines);
    
    // 创建员工数据（大批量）
    const employees = await this.createEmployees(departments, positions, this.testConfig.largeDataset);
    
    // 创建绩效记录
    await this.createPerformanceRecords(employees);
    
    // 创建三维计算结果
    await this.createCalculationResults(employees);
    
    const setupTime = Date.now() - startTime;
    console.log(`✅ 测试数据准备完成，耗时: ${setupTime}ms`);
    
    this.testData = {
      businessLines,
      departments,
      positions,
      employees
    };
  }

  /**
   * 创建业务线测试数据
   */
  async createBusinessLines() {
    const businessLines = [
      { name: '实施', code: 'IMPL', weight: 0.55, status: 1 },
      { name: '售前', code: 'PRESALE', weight: 0.20, status: 1 },
      { name: '市场', code: 'MARKET', weight: 0.15, status: 1 },
      { name: '运营', code: 'OPERATION', weight: 0.10, status: 1 }
    ];
    
    const created = [];
    for (const bl of businessLines) {
      const result = await optimizedNedbService.insert('businessLines', bl);
      created.push(result);
    }
    
    return created;
  }

  /**
   * 创建部门测试数据
   */
  async createDepartments(businessLines) {
    const departments = [];
    
    businessLines.forEach((bl, blIndex) => {
      // 每个业务线创建3-5个部门
      const deptCount = 3 + (blIndex % 3);
      for (let i = 1; i <= deptCount; i++) {
        departments.push({
          name: `${bl.name}${i}部`,
          code: `${bl.code}${i.toString().padStart(2, '0')}`,
          businessLineId: bl._id,
          status: 1
        });
      }
    });
    
    return await optimizedNedbService.insert('departments', departments);
  }

  /**
   * 创建岗位测试数据
   */
  async createPositions(businessLines) {
    const positions = [];
    const levels = ['P3', 'P4', 'P5', 'P6', 'M1', 'M2'];
    const baseNames = ['顾问', '专家', '经理', '总监'];
    
    businessLines.forEach(bl => {
      baseNames.forEach((name, nameIndex) => {
        levels.forEach((level, levelIndex) => {
          positions.push({
            name: `${level}_${bl.name}${name}`,
            code: `${bl.code}_${level}_${nameIndex}`,
            level: level,
            benchmarkValue: 0.4 + (levelIndex * 0.2),
            businessLineId: bl._id,
            status: 1
          });
        });
      });
    });
    
    return await optimizedNedbService.insert('positions', positions);
  }

  /**
   * 创建员工测试数据
   */
  async createEmployees(departments, positions, count) {
    console.log(`👥 创建 ${count} 个员工记录...`);
    
    const employees = [];
    const startTime = Date.now();
    
    for (let i = 1; i <= count; i++) {
      const dept = departments[i % departments.length];
      const position = positions[i % positions.length];
      
      employees.push({
        employeeNo: `EMP${i.toString().padStart(6, '0')}`,
        name: `测试员工${i}`,
        departmentId: dept._id,
        positionId: position._id,
        annualSalary: 50000 + Math.random() * 200000,
        entryDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        status: 1
      });
    }
    
    // 批量插入（分批处理避免内存问题）
    const batchSize = 100;
    const created = [];
    
    for (let i = 0; i < employees.length; i += batchSize) {
      const batch = employees.slice(i, i + batchSize);
      const batchResult = await optimizedNedbService.insert('employees', batch);
      created.push(...(Array.isArray(batchResult) ? batchResult : [batchResult]));
      
      // 显示进度
      if ((i + batchSize) % 500 === 0) {
        console.log(`  已创建 ${Math.min(i + batchSize, employees.length)}/${employees.length} 个员工`);
      }
    }
    
    const createTime = Date.now() - startTime;
    console.log(`✅ 员工数据创建完成，耗时: ${createTime}ms，平均: ${(createTime/count).toFixed(2)}ms/个`);
    
    return created;
  }

  /**
   * 创建绩效记录
   */
  async createPerformanceRecords(employees) {
    const records = employees.map(emp => ({
      employeeId: emp._id,
      period: '2024Q1',
      rating: 'A',
      coefficient: 0.8 + Math.random() * 0.4,
      excellenceRating: Math.random() > 0.8 ? 'S' : null,
      excellenceCoefficient: Math.random() > 0.8 ? 1.2 : null,
      evaluatorId: 'system'
    }));
    
    return await optimizedNedbService.insert('performanceRecords', records);
  }

  /**
   * 创建三维计算结果
   */
  async createCalculationResults(employees) {
    const results = employees.map(emp => ({
      employeeId: emp._id,
      calculationPeriod: '2024Q1',
      profitScore: Math.random() * 0.4 + 0.3,
      positionScore: Math.random() * 0.3 + 0.2,
      performanceScore: Math.random() * 0.3 + 0.2,
      finalScore: Math.random() * 0.4 + 0.6,
      scoreRank: Math.floor(Math.random() * employees.length) + 1,
      reviewStatus: 'approved'
    }));
    
    return await optimizedNedbService.insert('threeDimensionalResults', results);
  }

  /**
   * 测试基础查询性能
   */
  async testBasicQueries() {
    console.log('\n📊 测试基础查询性能...');
    
    // 测试单条记录查询
    await this.measureOperation('单条员工查询', async () => {
      const employee = this.testData.employees[Math.floor(Math.random() * this.testData.employees.length)];
      return await optimizedNedbService.findOne('employees', { _id: employee._id });
    });
    
    // 测试条件查询
    await this.measureOperation('条件查询', async () => {
      const dept = this.testData.departments[0];
      return await optimizedNedbService.find('employees', { departmentId: dept._id });
    });
    
    // 测试排序查询
    await this.measureOperation('排序查询', async () => {
      return await optimizedNedbService.find('employees', { status: 1 }, { sort: { name: 1 }, limit: 100 });
    });
    
    // 测试聚合查询
    await this.measureOperation('计数查询', async () => {
      return await optimizedNedbService.count('employees', { status: 1 });
    });
  }

  /**
   * 测试员工相关操作性能
   */
  async testEmployeeOperations() {
    console.log('\n👥 测试员工操作性能...');
    
    // 测试员工列表查询（优化版本）
    await this.measureOperation('员工列表查询 (优化)', async () => {
      return await optimizedNedbService.getEmployeesWithDetails(
        { status: 1 },
        { page: 1, pageSize: 50 }
      );
    });
    
    // 测试批量员工查询
    await this.measureOperation('批量员工查询', async () => {
      const randomIds = this.getRandomEmployeeIds(20);
      return await optimizedNedbService.getBatchEmployeesWithDetails(randomIds);
    });
    
    // 测试员工详情查询
    await this.measureOperation('员工详情查询', async () => {
      const employee = this.testData.employees[Math.floor(Math.random() * this.testData.employees.length)];
      return await optimizedNedbService.getEmployeeWithDetails(employee._id);
    });
    
    // 测试员工统计查询
    await this.measureOperation('员工统计查询', async () => {
      const employees = await optimizedNedbService.find('employees', { status: 1 });
      const departments = await optimizedNedbService.find('departments', { status: 1 });
      const positions = await optimizedNedbService.find('positions', { status: 1 });
      
      // 模拟统计计算
      const stats = {
        total: employees.length,
        byDepartment: {},
        byPosition: {},
        avgSalary: employees.reduce((sum, emp) => sum + emp.annualSalary, 0) / employees.length
      };
      
      return stats;
    });
  }

  /**
   * 测试奖金计算性能
   */
  async testBonusCalculations() {
    console.log('\n💰 测试奖金计算性能...');
    
    // 测试符合条件员工查询
    await this.measureOperation('符合条件员工查询', async () => {
      return await optimizedNedbService.getEligibleEmployeesOptimized('2024Q1', 0.6);
    });
    
    // 测试小规模奖金计算
    await this.measureOperation('小规模奖金计算 (100人)', async () => {
      const employees = await this.getEligibleEmployees(100);
      return await this.simulateBonusCalculation(employees);
    });
    
    // 测试中规模奖金计算
    await this.measureOperation('中规模奖金计算 (500人)', async () => {
      const employees = await this.getEligibleEmployees(500);
      return await this.simulateBonusCalculation(employees);
    });
    
    // 测试大规模奖金计算
    await this.measureOperation('大规模奖金计算 (1000人)', async () => {
      const employees = await this.getEligibleEmployees(1000);
      return await this.simulateBonusCalculation(employees);
    });
  }

  /**
   * 测试并发操作性能
   */
  async testConcurrentOperations() {
    console.log('\n🚀 测试并发操作性能...');
    
    // 并发员工查询测试
    await this.measureOperation('并发员工查询 (10个)', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        const randomId = this.getRandomEmployeeIds(1)[0];
        promises.push(optimizedNedbService.getEmployeeWithDetails(randomId));
      }
      return await Promise.all(promises);
    });
    
    // 并发员工列表查询测试
    await this.measureOperation('并发列表查询 (5个)', async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(optimizedNedbService.getEmployeesWithDetails(
          { status: 1 },
          { page: i + 1, pageSize: 20 }
        ));
      }
      return await Promise.all(promises);
    });
    
    // 混合并发操作测试
    await this.measureOperation('混合并发操作', async () => {
      const promises = [
        optimizedNedbService.find('employees', { status: 1 }, { limit: 50 }),
        optimizedNedbService.find('departments', { status: 1 }),
        optimizedNedbService.find('positions', { status: 1 }),
        optimizedNedbService.count('employees', { status: 1 }),
        optimizedNedbService.getEmployeesWithDetails({}, { page: 1, pageSize: 20 })
      ];
      return await Promise.all(promises);
    });
  }

  /**
   * 测试内存使用情况
   */
  async testMemoryUsage() {
    console.log('\n🧠 测试内存使用情况...');
    
    const initialMemory = process.memoryUsage();
    console.log('初始内存使用:', this.formatMemoryUsage(initialMemory));
    
    // 大批量数据加载测试
    await this.measureOperation('大批量数据加载', async () => {
      const employees = await optimizedNedbService.find('employees');
      const departments = await optimizedNedbService.find('departments');
      const positions = await optimizedNedbService.find('positions');
      
      // 模拟数据处理
      const processed = employees.map(emp => ({
        ...emp,
        department: departments.find(d => d._id === emp.departmentId),
        position: positions.find(p => p._id === emp.positionId)
      }));
      
      return processed;
    });
    
    const peakMemory = process.memoryUsage();
    console.log('峰值内存使用:', this.formatMemoryUsage(peakMemory));
    
    // 强制垃圾回收（如果可用）
    if (global.gc) {
      global.gc();
      const afterGcMemory = process.memoryUsage();
      console.log('GC后内存使用:', this.formatMemoryUsage(afterGcMemory));
    }
    
    // 计算内存增长
    const memoryGrowth = {
      rss: peakMemory.rss - initialMemory.rss,
      heapUsed: peakMemory.heapUsed - initialMemory.heapUsed,
      heapTotal: peakMemory.heapTotal - initialMemory.heapTotal
    };
    
    console.log('内存增长:', this.formatMemoryUsage(memoryGrowth));
  }

  /**
   * 获取符合条件的员工（用于测试）
   */
  async getEligibleEmployees(count) {
    const allEmployees = await optimizedNedbService.find('threeDimensionalResults', 
      { reviewStatus: 'approved' }, 
      { limit: count }
    );
    
    // 模拟加载关联数据
    const employeeIds = allEmployees.map(r => r.employeeId);
    const employees = await optimizedNedbService.getBatchEmployeesWithDetails(employeeIds);
    
    return allEmployees.map((result, index) => ({
      ...result,
      Employee: employees[index] || {}
    }));
  }

  /**
   * 模拟奖金计算
   */
  async simulateBonusCalculation(employees) {
    const bonusPool = {
      totalAmount: 1000000,
      period: '2024Q1'
    };
    
    const allocationRule = {
      allocationMethod: 'score_based',
      baseAllocationRatio: 0.6,
      performanceAllocationRatio: 0.4,
      reserveRatio: 0.1
    };
    
    // 模拟分配计算
    const results = employees.map(emp => {
      const score = parseFloat(emp.finalScore) || 0.6;
      const baseAmount = (bonusPool.totalAmount * 0.9 / employees.length) * 0.6;
      const performanceAmount = (bonusPool.totalAmount * 0.9 / employees.length) * 0.4 * score;
      
      return {
        employeeId: emp.employeeId,
        baseAmount,
        performanceAmount,
        totalAmount: baseAmount + performanceAmount,
        finalScore: score
      };
    });
    
    return {
      results,
      summary: {
        totalEmployees: employees.length,
        totalAllocated: results.reduce((sum, r) => sum + r.totalAmount, 0),
        avgBonus: results.reduce((sum, r) => sum + r.totalAmount, 0) / results.length
      }
    };
  }

  /**
   * 获取随机员工ID
   */
  getRandomEmployeeIds(count) {
    const ids = [];
    for (let i = 0; i < count; i++) {
      const randomEmployee = this.testData.employees[Math.floor(Math.random() * this.testData.employees.length)];
      ids.push(randomEmployee._id);
    }
    return ids;
  }

  /**
   * 测量操作执行时间
   */
  async measureOperation(name, operation, iterations = this.testConfig.iterations) {
    const times = [];
    let lastResult = null;
    
    console.log(`  🔍 测试: ${name}`);
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      try {
        lastResult = await operation();
        const endTime = Date.now();
        times.push(endTime - startTime);
      } catch (error) {
        console.error(`    ❌ 第${i+1}次测试失败:`, error.message);
        times.push(0);
      }
    }
    
    const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    const result = {
      name,
      avgTime: Math.round(avgTime),
      minTime,
      maxTime,
      iterations,
      resultCount: Array.isArray(lastResult) ? lastResult.length : 
                   lastResult && typeof lastResult === 'object' && lastResult.employees ? lastResult.employees.length :
                   lastResult ? 1 : 0
    };
    
    this.testResults.push(result);
    
    console.log(`    ✅ 平均: ${result.avgTime}ms, 最小: ${minTime}ms, 最大: ${maxTime}ms, 结果数: ${result.resultCount}`);
    
    return result;
  }

  /**
   * 格式化内存使用信息
   */
  formatMemoryUsage(memUsage) {
    return {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round((memUsage.external || 0) / 1024 / 1024)}MB`
    };
  }

  /**
   * 生成性能测试报告
   */
  generateReport() {
    const report = {
      testConfig: this.testConfig,
      summary: {
        totalTests: this.testResults.length,
        passedTests: this.testResults.filter(r => r.avgTime > 0).length,
        failedTests: this.testResults.filter(r => r.avgTime === 0).length,
        totalTime: this.testResults.reduce((sum, r) => sum + r.avgTime, 0)
      },
      results: this.testResults,
      analysis: this.analyzeResults(),
      recommendations: this.generateRecommendations(),
      databaseStats: optimizedNedbService.getPerformanceStats(),
      queryStats: queryOptimizer.getPerformanceMetrics()
    };
    
    return report;
  }

  /**
   * 分析测试结果
   */
  analyzeResults() {
    const analysis = {
      fastQueries: this.testResults.filter(r => r.avgTime < 100),
      slowQueries: this.testResults.filter(r => r.avgTime > 1000),
      averageResponseTime: Math.round(
        this.testResults.reduce((sum, r) => sum + r.avgTime, 0) / this.testResults.length
      ),
      performanceDistribution: {
        fast: this.testResults.filter(r => r.avgTime < 500).length,
        medium: this.testResults.filter(r => r.avgTime >= 500 && r.avgTime < 2000).length,
        slow: this.testResults.filter(r => r.avgTime >= 2000).length
      }
    };
    
    return analysis;
  }

  /**
   * 生成优化建议
   */
  generateRecommendations() {
    const recommendations = [];
    const analysis = this.analyzeResults();
    
    if (analysis.slowQueries.length > 0) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: `发现 ${analysis.slowQueries.length} 个慢查询操作`,
        details: analysis.slowQueries.map(q => `${q.name}: ${q.avgTime}ms`),
        suggestions: [
          '优化查询条件和索引策略',
          '考虑增加缓存层',
          '优化数据结构和算法',
          '使用分页处理大结果集'
        ]
      });
    }
    
    if (analysis.averageResponseTime > 1000) {
      recommendations.push({
        type: 'overall',
        priority: 'medium',
        message: `平均响应时间较高: ${analysis.averageResponseTime}ms`,
        suggestions: [
          '全面优化数据库查询',
          '增加系统资源配置',
          '实施性能监控和告警'
        ]
      });
    }
    
    const cacheStats = optimizedNedbService.getCacheHitRate();
    const hitRate = parseFloat(cacheStats.replace('%', ''));
    if (hitRate < 70) {
      recommendations.push({
        type: 'caching',
        priority: 'medium',
        message: `缓存命中率较低: ${cacheStats}`,
        suggestions: [
          '调整缓存策略和TTL配置',
          '增加缓存容量',
          '优化缓存键设计'
        ]
      });
    }
    
    return recommendations;
  }

  /**
   * 清理测试数据
   */
  async cleanup() {
    console.log('\n🧹 清理测试数据...');
    
    try {
      // 清理测试数据（可选，用于真实环境测试）
      // await optimizedNedbService.remove('employees', {});
      // await optimizedNedbService.remove('departments', {});
      // await optimizedNedbService.remove('positions', {});
      // await optimizedNedbService.remove('businessLines', {});
      
      console.log('✅ 清理完成');
    } catch (error) {
      console.error('❌ 清理失败:', error);
    }
  }
}

// 如果直接运行此文件，执行性能测试
if (require.main === module) {
  const performanceTest = new PerformanceTest();
  
  performanceTest.runAllTests()
    .then(report => {
      console.log('\n📋 完整测试报告:');
      console.log(JSON.stringify(report, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('性能测试失败:', error);
      process.exit(1);
    });
}

module.exports = PerformanceTest;