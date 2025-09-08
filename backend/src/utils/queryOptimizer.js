const logger = require('./logger');

/**
 * 查询优化器
 * 提供查询性能分析、优化建议和监控功能
 */
class QueryOptimizer {
  constructor() {
    this.queryStats = new Map();
    this.slowQueries = [];
    this.queryPatterns = new Map();
    this.optimizationRules = new Map();
    
    this._initializeOptimizationRules();
    
    // 性能阈值配置
    this.thresholds = {
      slowQueryMs: 1000,        // 慢查询阈值
      verySlowQueryMs: 5000,    // 超慢查询阈值
      highFrequency: 100,       // 高频查询阈值
      cacheHitRateWarning: 0.7, // 缓存命中率警告阈值
      maxSlowQueries: 1000      // 最大慢查询记录数
    };
  }

  /**
   * 初始化优化规则
   */
  _initializeOptimizationRules() {
    // N+1 查询检测规则
    this.optimizationRules.set('n+1_detection', {
      name: 'N+1查询检测',
      pattern: /find.*forEach|map.*find|for.*find/i,
      severity: 'high',
      suggestion: '考虑使用批量查询或JOIN操作替代循环查询',
      example: '使用 findByIds([...ids]) 替代 ids.map(id => findById(id))'
    });

    // 缺少索引检测
    this.optimizationRules.set('missing_index', {
      name: '缺少索引',
      pattern: /where.*=.*and|filter.*===.*filter/i,
      severity: 'medium',
      suggestion: '考虑为查询条件添加复合索引',
      example: 'ensureIndex({ fieldName: [\"field1\", \"field2\"] })'
    });

    // 全表扫描检测
    this.optimizationRules.set('full_table_scan', {
      name: '全表扫描',
      pattern: /find\(\{\}\)|find\(\s*\)/i,
      severity: 'medium',
      suggestion: '避免无条件查询，添加适当的过滤条件',
      example: '使用 find({ status: 1 }) 替代 find({})'
    });

    // 大结果集检测
    this.optimizationRules.set('large_result_set', {
      name: '大结果集',
      pattern: /limit.*>.*1000|pageSize.*>.*100/i,
      severity: 'low',
      suggestion: '考虑分页处理大结果集',
      example: '使用分页参数：{ limit: 50, skip: offset }'
    });

    // 不必要的排序
    this.optimizationRules.set('unnecessary_sort', {
      name: '不必要的排序',
      pattern: /sort.*sort|orderBy.*orderBy/i,
      severity: 'low',
      suggestion: '避免重复排序操作',
      example: '在一个查询中只使用一次排序'
    });
  }

  /**
   * 分析查询性能
   */
  analyzeQuery(collection, query, options = {}, executionTime, resultCount = 0) {
    const queryKey = this._generateQueryKey(collection, query, options);
    const analysis = {
      collection,
      query,
      options,
      executionTime,
      resultCount,
      timestamp: new Date(),
      optimizations: []
    };

    // 更新查询统计
    this._updateQueryStats(queryKey, executionTime, resultCount);

    // 检查是否为慢查询
    if (executionTime > this.thresholds.slowQueryMs) {
      this._recordSlowQuery(analysis);
    }

    // 分析查询模式
    this._analyzeQueryPattern(analysis);

    // 生成优化建议
    this._generateOptimizations(analysis);

    return analysis;
  }

  /**
   * 生成查询键
   */
  _generateQueryKey(collection, query, options) {
    const queryStr = JSON.stringify(query);
    const optionsStr = JSON.stringify(options);
    return `${collection}:${Buffer.from(queryStr + optionsStr).toString('base64')}`;
  }

  /**
   * 更新查询统计
   */
  _updateQueryStats(queryKey, executionTime, resultCount) {
    if (!this.queryStats.has(queryKey)) {
      this.queryStats.set(queryKey, {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: Number.MAX_VALUE,
        maxTime: 0,
        totalResults: 0,
        avgResults: 0,
        lastExecuted: null
      });
    }

    const stats = this.queryStats.get(queryKey);
    stats.count++;
    stats.totalTime += executionTime;
    stats.avgTime = stats.totalTime / stats.count;
    stats.minTime = Math.min(stats.minTime, executionTime);
    stats.maxTime = Math.max(stats.maxTime, executionTime);
    stats.totalResults += resultCount;
    stats.avgResults = stats.totalResults / stats.count;
    stats.lastExecuted = new Date();
  }

  /**
   * 记录慢查询
   */
  _recordSlowQuery(analysis) {
    this.slowQueries.push({
      ...analysis,
      severity: analysis.executionTime > this.thresholds.verySlowQueryMs ? 'critical' : 'warning'
    });

    // 保持慢查询记录在合理范围内
    if (this.slowQueries.length > this.thresholds.maxSlowQueries) {
      this.slowQueries = this.slowQueries.slice(-this.thresholds.maxSlowQueries);
    }

    logger.warn(`🐌 慢查询检测:`, {
      collection: analysis.collection,
      executionTime: `${analysis.executionTime}ms`,
      resultCount: analysis.resultCount,
      query: JSON.stringify(analysis.query).substring(0, 200)
    });
  }

  /**
   * 分析查询模式
   */
  _analyzeQueryPattern(analysis) {
    const pattern = this._extractQueryPattern(analysis);
    
    if (!this.queryPatterns.has(pattern)) {
      this.queryPatterns.set(pattern, {
        pattern,
        count: 0,
        collections: new Set(),
        avgExecutionTime: 0,
        totalExecutionTime: 0,
        examples: []
      });
    }

    const patternStats = this.queryPatterns.get(pattern);
    patternStats.count++;
    patternStats.collections.add(analysis.collection);
    patternStats.totalExecutionTime += analysis.executionTime;
    patternStats.avgExecutionTime = patternStats.totalExecutionTime / patternStats.count;
    
    // 保存示例（最多5个）
    if (patternStats.examples.length < 5) {
      patternStats.examples.push({
        collection: analysis.collection,
        query: analysis.query,
        executionTime: analysis.executionTime
      });
    }
  }

  /**
   * 提取查询模式
   */
  _extractQueryPattern(analysis) {
    const queryKeys = Object.keys(analysis.query || {});
    const hasOptions = Object.keys(analysis.options || {}).length > 0;
    const hasComplexQuery = queryKeys.some(key => 
      typeof analysis.query[key] === 'object' && analysis.query[key] !== null
    );

    let pattern = analysis.collection;
    
    if (queryKeys.length === 0) {
      pattern += ':find_all';
    } else if (queryKeys.length === 1) {
      pattern += ':find_by_single_field';
    } else {
      pattern += ':find_by_multiple_fields';
    }

    if (hasComplexQuery) {
      pattern += ':complex';
    }

    if (hasOptions) {
      if (analysis.options.sort) pattern += ':sorted';
      if (analysis.options.limit) pattern += ':limited';
      if (analysis.options.skip) pattern += ':paginated';
    }

    return pattern;
  }

  /**
   * 生成优化建议
   */
  _generateOptimizations(analysis) {
    const queryStr = JSON.stringify(analysis.query) + JSON.stringify(analysis.options);

    // 检查每个优化规则
    for (const [ruleKey, rule] of this.optimizationRules) {
      if (rule.pattern.test(queryStr)) {
        analysis.optimizations.push({
          rule: ruleKey,
          name: rule.name,
          severity: rule.severity,
          suggestion: rule.suggestion,
          example: rule.example
        });
      }
    }

    // 基于执行时间和结果集的优化建议
    if (analysis.executionTime > this.thresholds.slowQueryMs) {
      analysis.optimizations.push({
        rule: 'slow_query',
        name: '慢查询优化',
        severity: 'high',
        suggestion: '查询执行时间过长，考虑优化查询条件或添加索引',
        example: `当前执行时间: ${analysis.executionTime}ms，建议目标: <${this.thresholds.slowQueryMs}ms`
      });
    }

    if (analysis.resultCount > 1000) {
      analysis.optimizations.push({
        rule: 'large_result',
        name: '大结果集优化',
        severity: 'medium',
        suggestion: '结果集过大，考虑使用分页或添加更精确的过滤条件',
        example: `当前结果数: ${analysis.resultCount}，建议使用分页处理`
      });
    }

    // 检查索引使用情况
    if (this._shouldSuggestIndex(analysis)) {
      analysis.optimizations.push({
        rule: 'index_suggestion',
        name: '索引建议',
        severity: 'medium',
        suggestion: '考虑为查询字段添加索引以提高性能',
        example: `建议为 ${Object.keys(analysis.query || {}).join(', ')} 字段添加索引`
      });
    }
  }

  /**
   * 判断是否应该建议添加索引
   */
  _shouldSuggestIndex(analysis) {
    // 如果查询时间较长且有具体查询条件
    if (analysis.executionTime > 500 && analysis.query && Object.keys(analysis.query).length > 0) {
      return true;
    }

    // 如果结果集较大且有排序
    if (analysis.resultCount > 100 && analysis.options?.sort) {
      return true;
    }

    return false;
  }

  /**
   * 获取查询统计报告
   */
  getQueryReport() {
    const now = Date.now();
    const report = {
      summary: {
        totalQueries: this.queryStats.size,
        slowQueries: this.slowQueries.length,
        queryPatterns: this.queryPatterns.size,
        reportGeneratedAt: new Date()
      },
      slowQueries: this.getSlowQueries(),
      topQueries: this.getTopQueries(),
      queryPatterns: this.getQueryPatterns(),
      optimizationSummary: this.getOptimizationSummary()
    };

    return report;
  }

  /**
   * 获取慢查询列表
   */
  getSlowQueries(limit = 10) {
    return this.slowQueries
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, limit)
      .map(query => ({
        collection: query.collection,
        executionTime: query.executionTime,
        resultCount: query.resultCount,
        timestamp: query.timestamp,
        severity: query.severity,
        optimizations: query.optimizations,
        queryPreview: JSON.stringify(query.query).substring(0, 100) + '...'
      }));
  }

  /**
   * 获取高频查询
   */
  getTopQueries(limit = 10) {
    return Array.from(this.queryStats.entries())
      .map(([key, stats]) => ({
        queryKey: key.split(':')[0], // 只显示集合名
        ...stats
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * 获取查询模式分析
   */
  getQueryPatterns(limit = 10) {
    return Array.from(this.queryPatterns.entries())
      .map(([pattern, stats]) => ({
        pattern,
        count: stats.count,
        collections: Array.from(stats.collections),
        avgExecutionTime: Math.round(stats.avgExecutionTime),
        examples: stats.examples.length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * 获取优化建议汇总
   */
  getOptimizationSummary() {
    const ruleStats = new Map();
    
    this.slowQueries.forEach(query => {
      query.optimizations?.forEach(opt => {
        if (!ruleStats.has(opt.rule)) {
          ruleStats.set(opt.rule, {
            rule: opt.rule,
            name: opt.name,
            severity: opt.severity,
            count: 0,
            suggestion: opt.suggestion,
            example: opt.example
          });
        }
        ruleStats.get(opt.rule).count++;
      });
    });

    return Array.from(ruleStats.values())
      .sort((a, b) => b.count - a.count);
  }

  /**
   * 清理旧数据
   */
  cleanup(olderThanHours = 24) {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    
    // 清理慢查询记录
    this.slowQueries = this.slowQueries.filter(query => 
      query.timestamp > cutoff
    );

    // 清理查询统计（保留活跃的查询）
    for (const [key, stats] of this.queryStats.entries()) {
      if (stats.lastExecuted && stats.lastExecuted < cutoff && stats.count < 10) {
        this.queryStats.delete(key);
      }
    }

    logger.info(`🧹 查询优化器清理完成，清理 ${olderThanHours} 小时前的数据`);
  }

  /**
   * 生成索引建议
   */
  generateIndexRecommendations() {
    const recommendations = [];
    
    // 分析慢查询的索引需求
    this.slowQueries.forEach(query => {
      if (query.query && Object.keys(query.query).length > 0) {
        const fields = Object.keys(query.query);
        
        // 单字段索引建议
        fields.forEach(field => {
          if (query.executionTime > 1000) {
            recommendations.push({
              collection: query.collection,
              type: 'single',
              fields: [field],
              reason: `慢查询优化 (${query.executionTime}ms)`,
              priority: 'high',
              estimatedImprovement: this._estimateImprovement(query.executionTime)
            });
          }
        });

        // 复合索引建议
        if (fields.length > 1 && query.executionTime > 500) {
          recommendations.push({
            collection: query.collection,
            type: 'compound',
            fields: fields,
            reason: `多字段查询优化 (${query.executionTime}ms)`,
            priority: 'medium',
            estimatedImprovement: this._estimateImprovement(query.executionTime)
          });
        }
      }
    });

    // 去重并按优先级排序
    const uniqueRecommendations = this._deduplicateRecommendations(recommendations);
    return uniqueRecommendations.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * 估算性能改善
   */
  _estimateImprovement(currentTime) {
    if (currentTime > 5000) return '70-90%';
    if (currentTime > 2000) return '50-70%';
    if (currentTime > 1000) return '30-50%';
    return '10-30%';
  }

  /**
   * 去重索引建议
   */
  _deduplicateRecommendations(recommendations) {
    const seen = new Set();
    return recommendations.filter(rec => {
      const key = `${rec.collection}:${rec.type}:${rec.fields.join(',')}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * 获取性能监控数据
   */
  getPerformanceMetrics() {
    const stats = Array.from(this.queryStats.values());
    
    return {
      totalQueries: stats.reduce((sum, stat) => sum + stat.count, 0),
      avgQueryTime: stats.reduce((sum, stat) => sum + stat.avgTime, 0) / stats.length || 0,
      slowQueryCount: this.slowQueries.length,
      slowQueryRate: this.slowQueries.length / stats.length || 0,
      mostActiveCollections: this._getMostActiveCollections(),
      performanceTrends: this._getPerformanceTrends()
    };
  }

  /**
   * 获取最活跃的集合
   */
  _getMostActiveCollections() {
    const collectionStats = new Map();
    
    for (const [queryKey, stats] of this.queryStats.entries()) {
      const collection = queryKey.split(':')[0];
      if (!collectionStats.has(collection)) {
        collectionStats.set(collection, { count: 0, totalTime: 0 });
      }
      const collStat = collectionStats.get(collection);
      collStat.count += stats.count;
      collStat.totalTime += stats.totalTime;
    }

    return Array.from(collectionStats.entries())
      .map(([collection, stats]) => ({
        collection,
        queryCount: stats.count,
        avgTime: stats.totalTime / stats.count
      }))
      .sort((a, b) => b.queryCount - a.queryCount)
      .slice(0, 10);
  }

  /**
   * 获取性能趋势
   */
  _getPerformanceTrends() {
    // 简化版本：基于慢查询的时间分布
    const hourlyStats = new Map();
    
    this.slowQueries.forEach(query => {
      const hour = new Date(query.timestamp).getHours();
      if (!hourlyStats.has(hour)) {
        hourlyStats.set(hour, { count: 0, totalTime: 0 });
      }
      const stats = hourlyStats.get(hour);
      stats.count++;
      stats.totalTime += query.executionTime;
    });

    return Array.from(hourlyStats.entries())
      .map(([hour, stats]) => ({
        hour,
        slowQueryCount: stats.count,
        avgSlowQueryTime: stats.totalTime / stats.count
      }))
      .sort((a, b) => a.hour - b.hour);
  }
}

// 创建全局查询优化器实例
const queryOptimizer = new QueryOptimizer();

module.exports = queryOptimizer;