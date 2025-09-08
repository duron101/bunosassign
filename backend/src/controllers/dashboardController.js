const logger = require('../utils/logger');

/**
 * 管理驾驶舱控制器
 */
class DashboardController {
  /**
   * 获取管理驾驶舱概览数据
   */
  async getOverview(req, res) {
    try {
      const { startDate, endDate } = req.query;
      
      // 获取核心指标
      const metrics = await this.getCoreMetrics(startDate, endDate);
      
      // 获取部门排行
      const departmentRanking = await this.getDepartmentRanking(startDate, endDate);
      
      // 获取奖金分布统计
      const bonusDistribution = await this.getBonusDistribution(startDate, endDate);
      
      // 获取系统动态
      const recentActivities = await this.getRecentActivities();
      
      res.json({
        code: 200,
        message: '获取驾驶舱数据成功',
        data: {
          metrics,
          departmentRanking,
          bonusDistribution,
          recentActivities
        }
      });
      
    } catch (error) {
      logger.error('获取驾驶舱概览数据失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取驾驶舱数据失败',
        error: error.message
      });
    }
  }

  /**
   * 获取核心指标
   */
  async getCoreMetrics(startDate, endDate) {
    try {
      // 获取所有员工
      const employees = await global.nedbService.find('employees');
      const totalEmployees = employees.length;
      
      // 获取所有部门
      const departments = await global.nedbService.find('departments');
      
      // 模拟奖金计算数据 - 在实际应用中应该从奖金计算结果表获取
      let totalBonus = 0;
      let bonusCount = 0;
      
      // 为每个员工计算模拟奖金
      for (const employee of employees) {
        if (employee.status === 'active') {
          // 基于员工岗位和部门计算模拟奖金
          const baseSalary = employee.baseSalary || 8000;
          const positionMultiplier = this.getPositionMultiplier(employee.positionName);
          const departmentMultiplier = this.getDepartmentMultiplier(employee.departmentName);
          
          const bonus = Math.round(baseSalary * positionMultiplier * departmentMultiplier * (0.8 + Math.random() * 0.4));
          totalBonus += bonus;
          bonusCount++;
        }
      }
      
      const avgBonus = bonusCount > 0 ? Math.round(totalBonus / bonusCount) : 0;
      
      // 计算奖金池利用率 - 假设预算为总奖金的1.1倍
      const budgetPool = totalBonus * 1.1;
      const utilizationRate = totalBonus / budgetPool;
      
      // 模拟增长率数据
      const bonusGrowth = 5 + Math.random() * 15; // 5-20% 增长
      const avgGrowth = 3 + Math.random() * 12; // 3-15% 增长
      const utilizationChange = -5 + Math.random() * 10; // -5% 到 5% 变化
      const employeeGrowth = Math.random() * 8; // 0-8% 增长
      
      return {
        totalBonus: Math.round(totalBonus),
        avgBonus,
        utilizationRate: Math.round(utilizationRate * 1000) / 1000,
        totalEmployees: bonusCount,
        bonusGrowth: Math.round(bonusGrowth * 10) / 10,
        avgGrowth: Math.round(avgGrowth * 10) / 10,
        utilizationChange: Math.round(utilizationChange * 10) / 10,
        employeeGrowth: Math.round(employeeGrowth * 10) / 10
      };
      
    } catch (error) {
      logger.error('获取核心指标失败:', error);
      throw error;
    }
  }

  /**
   * 获取部门奖金排行
   */
  async getDepartmentRanking(startDate, endDate) {
    try {
      const employees = await global.nedbService.find('employees');
      const departments = await global.nedbService.find('departments');
      
      // 按部门统计奖金
      const deptStats = {};
      
      for (const employee of employees) {
        if (employee.status === 'active' && employee.departmentId) {
          const dept = departments.find(d => d.id === employee.departmentId);
          if (!dept) continue;
          
          if (!deptStats[dept.id]) {
            deptStats[dept.id] = {
              id: dept.id,
              name: dept.name,
              totalBonus: 0,
              employeeCount: 0
            };
          }
          
          // 计算员工奖金
          const baseSalary = employee.baseSalary || 8000;
          const positionMultiplier = this.getPositionMultiplier(employee.positionName);
          const departmentMultiplier = this.getDepartmentMultiplier(dept.name);
          
          const bonus = Math.round(baseSalary * positionMultiplier * departmentMultiplier * (0.8 + Math.random() * 0.4));
          
          deptStats[dept.id].totalBonus += bonus;
          deptStats[dept.id].employeeCount++;
        }
      }
      
      // 转换为数组并排序
      return Object.values(deptStats)
        .sort((a, b) => b.totalBonus - a.totalBonus)
        .slice(0, 10); // 返回前10名
        
    } catch (error) {
      logger.error('获取部门排行失败:', error);
      throw error;
    }
  }

  /**
   * 获取奖金分布统计
   */
  async getBonusDistribution(startDate, endDate) {
    try {
      const employees = await global.nedbService.find('employees');
      const bonusAmounts = [];
      
      // 计算所有员工的奖金
      for (const employee of employees) {
        if (employee.status === 'active') {
          const baseSalary = employee.baseSalary || 8000;
          const positionMultiplier = this.getPositionMultiplier(employee.positionName);
          const departmentMultiplier = this.getDepartmentMultiplier(employee.departmentName);
          
          const bonus = Math.round(baseSalary * positionMultiplier * departmentMultiplier * (0.8 + Math.random() * 0.4));
          bonusAmounts.push(bonus);
        }
      }
      
      bonusAmounts.sort((a, b) => a - b);
      
      // 计算分布区间
      const ranges = [
        { min: 0, max: 10000, count: 0 },
        { min: 10000, max: 20000, count: 0 },
        { min: 20000, max: 30000, count: 0 },
        { min: 30000, max: 40000, count: 0 },
        { min: 40000, max: 50000, count: 0 },
        { min: 50000, max: 100000, count: 0 },
        { min: 100000, max: 200000, count: 0 }
      ];
      
      bonusAmounts.forEach(bonus => {
        const range = ranges.find(r => bonus >= r.min && bonus < r.max);
        if (range) range.count++;
      });
      
      // 计算中位数
      const median = bonusAmounts.length > 0 ? 
        bonusAmounts[Math.floor(bonusAmounts.length / 2)] : 0;
      
      // 计算标准差
      const mean = bonusAmounts.reduce((sum, bonus) => sum + bonus, 0) / bonusAmounts.length || 0;
      const variance = bonusAmounts.reduce((sum, bonus) => sum + Math.pow(bonus - mean, 2), 0) / bonusAmounts.length || 0;
      const standardDeviation = Math.sqrt(variance);
      
      // 简单的基尼系数估算
      const giniCoefficient = this.calculateGini(bonusAmounts);
      
      return {
        ranges: ranges.filter(r => r.count > 0),
        median: Math.round(median),
        giniCoefficient: Math.round(giniCoefficient * 1000) / 1000,
        standardDeviation: Math.round(standardDeviation)
      };
      
    } catch (error) {
      logger.error('获取奖金分布统计失败:', error);
      throw error;
    }
  }

  /**
   * 获取趋势数据
   */
  async getTrendData(req, res) {
    try {
      const { type = 'total', months = 6 } = req.query;
      
      const employees = await global.nedbService.find('employees');
      const activeEmployees = employees.filter(e => e.status === 'active');
      
      // 生成最近几个月的数据
      const trendData = [];
      const now = new Date();
      
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const period = date.toISOString().slice(0, 7);
        
        // 为该月份生成数据
        let totalBonus = 0;
        let employeeCount = activeEmployees.length;
        
        activeEmployees.forEach(employee => {
          const baseSalary = employee.baseSalary || 8000;
          const positionMultiplier = this.getPositionMultiplier(employee.positionName);
          const departmentMultiplier = this.getDepartmentMultiplier(employee.departmentName);
          
          // 添加月份波动
          const monthlyVariation = 0.9 + (Math.random() * 0.2);
          const bonus = Math.round(baseSalary * positionMultiplier * departmentMultiplier * monthlyVariation);
          totalBonus += bonus;
        });
        
        trendData.push({
          period,
          totalBonus: Math.round(totalBonus),
          avgBonus: employeeCount > 0 ? Math.round(totalBonus / employeeCount) : 0,
          employeeCount
        });
      }
      
      res.json({
        code: 200,
        message: '获取趋势数据成功',
        data: trendData
      });
      
    } catch (error) {
      logger.error('获取趋势数据失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取趋势数据失败',
        error: error.message
      });
    }
  }

  /**
   * 获取业务线分布数据
   */
  async getDistributionData(req, res) {
    try {
      const { type = 'amount' } = req.query;
      
      const employees = await global.nedbService.find('employees');
      const businessLines = await global.nedbService.find('businessLines');
      const departments = await global.nedbService.find('departments');
      
      // 按业务线统计
      const lineStats = {};
      
      for (const employee of employees) {
        if (employee.status === 'active' && employee.departmentId) {
          const dept = departments.find(d => d.id === employee.departmentId);
          if (!dept) continue;
          
          // 根据部门查找业务线 - 这里简化处理，实际应该有部门与业务线的关联表
          const businessLine = this.getBusinessLineByDepartment(dept.name);
          
          if (!lineStats[businessLine]) {
            lineStats[businessLine] = {
              name: businessLine,
              totalBonus: 0,
              employeeCount: 0
            };
          }
          
          // 计算员工奖金
          const baseSalary = employee.baseSalary || 8000;
          const positionMultiplier = this.getPositionMultiplier(employee.positionName);
          const departmentMultiplier = this.getDepartmentMultiplier(dept.name);
          
          const bonus = Math.round(baseSalary * positionMultiplier * departmentMultiplier * (0.8 + Math.random() * 0.4));
          
          lineStats[businessLine].totalBonus += bonus;
          lineStats[businessLine].employeeCount++;
        }
      }
      
      // 根据类型返回相应数据
      const result = Object.values(lineStats).map(stat => ({
        name: stat.name,
        value: type === 'amount' ? stat.totalBonus : stat.employeeCount
      }));
      
      res.json({
        code: 200,
        message: '获取分布数据成功',
        data: result
      });
      
    } catch (error) {
      logger.error('获取分布数据失败:', error);
      res.status(500).json({
        code: 500,
        message: '获取分布数据失败',
        error: error.message
      });
    }
  }

  /**
   * 获取系统动态
   */
  async getRecentActivities() {
    try {
      // 从审计日志获取最近的系统动态
      const auditLogs = await global.nedbService.find('auditLogs', {}, { createdAt: -1 }, 10);
      
      return auditLogs.map(log => ({
        id: log.id,
        title: this.getActivityTitle(log.operation),
        description: log.details || log.description,
        user: log.userName || log.userId,
        timestamp: this.formatTimestamp(log.createdAt),
        type: this.getActivityType(log.operation)
      }));
      
    } catch (error) {
      logger.error('获取系统动态失败:', error);
      // 返回默认数据
      return [
        {
          id: 1,
          title: '系统启动',
          description: '奖金模拟系统已成功启动',
          user: '系统',
          timestamp: new Date().toLocaleString('zh-CN'),
          type: 'info'
        }
      ];
    }
  }

  // 工具方法
  getPositionMultiplier(positionName) {
    const multipliers = {
      '总监': 3.0,
      '高级经理': 2.5,
      '经理': 2.0,
      '主管': 1.5,
      '高级专员': 1.3,
      '专员': 1.0,
      '助理': 0.8
    };
    
    for (const [key, value] of Object.entries(multipliers)) {
      if (positionName && positionName.includes(key)) {
        return value;
      }
    }
    return 1.0;
  }

  getDepartmentMultiplier(departmentName) {
    const multipliers = {
      '实施部': 1.2,
      '售前部': 1.1,
      '研发部': 1.0,
      '市场部': 0.9,
      '运营部': 0.85,
      '人事部': 0.8,
      '财务部': 0.8
    };
    
    return multipliers[departmentName] || 1.0;
  }

  getBusinessLineByDepartment(departmentName) {
    const mapping = {
      '实施部': '项目实施',
      '售前部': '销售支持',
      '研发部': '产品研发',
      '市场部': '市场营销',
      '运营部': '运营支持',
      '人事部': '人力资源',
      '财务部': '财务管理'
    };
    
    return mapping[departmentName] || '其他';
  }

  calculateGini(values) {
    if (values.length === 0) return 0;
    
    const sortedValues = [...values].sort((a, b) => a - b);
    const n = sortedValues.length;
    const sum = sortedValues.reduce((a, b) => a + b, 0);
    
    if (sum === 0) return 0;
    
    let gini = 0;
    for (let i = 0; i < n; i++) {
      gini += (2 * (i + 1) - n - 1) * sortedValues[i];
    }
    
    return gini / (n * sum);
  }

  getActivityTitle(operation) {
    const titles = {
      'CREATE': '数据创建',
      'UPDATE': '数据更新', 
      'DELETE': '数据删除',
      'LOGIN': '用户登录',
      'LOGOUT': '用户退出',
      'CALCULATE': '奖金计算',
      'EXPORT': '数据导出',
      'IMPORT': '数据导入'
    };
    
    return titles[operation] || '系统操作';
  }

  getActivityType(operation) {
    const types = {
      'CREATE': 'success',
      'UPDATE': 'primary',
      'DELETE': 'danger',
      'LOGIN': 'info',
      'LOGOUT': 'info',
      'CALCULATE': 'success',
      'EXPORT': 'warning',
      'IMPORT': 'warning'
    };
    
    return types[operation] || 'info';
  }

  formatTimestamp(timestamp) {
    if (!timestamp) return new Date().toLocaleString('zh-CN');
    return new Date(timestamp).toLocaleString('zh-CN');
  }
}

module.exports = new DashboardController();