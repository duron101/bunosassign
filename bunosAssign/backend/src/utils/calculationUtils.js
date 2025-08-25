/**
 * 计算工具类
 * 提供通用的计算函数和数学工具
 */

class CalculationUtils {
  
  /**
   * 安全的数字转换
   */
  static toNumber(value, defaultValue = 0) {
    if (value === null || value === undefined || value === '') {
      return defaultValue
    }
    
    const num = parseFloat(value)
    return isNaN(num) ? defaultValue : num
  }

  /**
   * 安全的百分比计算
   */
  static toPercentage(value, total, decimals = 2) {
    if (!total || total === 0) return 0
    const percentage = (this.toNumber(value) / this.toNumber(total)) * 100
    return this.roundToDecimals(percentage, decimals)
  }

  /**
   * 四舍五入到指定小数位
   */
  static roundToDecimals(value, decimals = 2) {
    const factor = Math.pow(10, decimals)
    return Math.round(this.toNumber(value) * factor) / factor
  }

  /**
   * 计算数组的统计信息
   */
  static calculateStats(values) {
    if (!Array.isArray(values) || values.length === 0) {
      return {
        count: 0,
        sum: 0,
        mean: 0,
        median: 0,
        min: 0,
        max: 0,
        stdDev: 0,
        variance: 0
      }
    }

    const numbers = values.map(v => this.toNumber(v)).filter(n => !isNaN(n))
    if (numbers.length === 0) {
      return this.calculateStats([])
    }

    const sorted = [...numbers].sort((a, b) => a - b)
    const sum = numbers.reduce((acc, val) => acc + val, 0)
    const mean = sum / numbers.length
    
    const median = numbers.length % 2 === 0
      ? (sorted[numbers.length / 2 - 1] + sorted[numbers.length / 2]) / 2
      : sorted[Math.floor(numbers.length / 2)]

    const variance = numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numbers.length
    const stdDev = Math.sqrt(variance)

    return {
      count: numbers.length,
      sum: this.roundToDecimals(sum),
      mean: this.roundToDecimals(mean),
      median: this.roundToDecimals(median),
      min: Math.min(...numbers),
      max: Math.max(...numbers),
      stdDev: this.roundToDecimals(stdDev),
      variance: this.roundToDecimals(variance)
    }
  }

  /**
   * Z-Score标准化
   */
  static zScoreNormalize(value, mean, stdDev) {
    if (stdDev === 0 || isNaN(stdDev)) return 0
    return (this.toNumber(value) - this.toNumber(mean)) / this.toNumber(stdDev)
  }

  /**
   * Min-Max标准化
   */
  static minMaxNormalize(value, min, max) {
    const range = this.toNumber(max) - this.toNumber(min)
    if (range === 0) return 0.5
    return (this.toNumber(value) - this.toNumber(min)) / range
  }

  /**
   * 计算加权平均
   */
  static calculateWeightedAverage(values, weights) {
    if (!Array.isArray(values) || !Array.isArray(weights) || values.length !== weights.length) {
      throw new Error('Values and weights arrays must be of equal length')
    }

    if (values.length === 0) return 0

    let weightedSum = 0
    let totalWeight = 0

    for (let i = 0; i < values.length; i++) {
      const value = this.toNumber(values[i])
      const weight = this.toNumber(weights[i])
      
      if (weight > 0) {
        weightedSum += value * weight
        totalWeight += weight
      }
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0
  }

  /**
   * 计算分布百分位
   */
  static calculatePercentile(values, percentile) {
    if (!Array.isArray(values) || values.length === 0) return 0
    if (percentile < 0 || percentile > 100) return 0

    const numbers = values.map(v => this.toNumber(v)).sort((a, b) => a - b)
    const index = (percentile / 100) * (numbers.length - 1)
    
    if (Number.isInteger(index)) {
      return numbers[index]
    }
    
    const lower = Math.floor(index)
    const upper = Math.ceil(index)
    const weight = index - lower
    
    return numbers[lower] * (1 - weight) + numbers[upper] * weight
  }

  /**
   * 检查数值是否在合理范围内
   */
  static isInRange(value, min, max, inclusive = true) {
    const num = this.toNumber(value)
    
    if (inclusive) {
      return num >= this.toNumber(min) && num <= this.toNumber(max)
    } else {
      return num > this.toNumber(min) && num < this.toNumber(max)
    }
  }

  /**
   * 限制数值在指定范围内
   */
  static clamp(value, min, max) {
    const num = this.toNumber(value)
    return Math.max(this.toNumber(min), Math.min(this.toNumber(max), num))
  }

  /**
   * 计算两个数值的相对差异百分比
   */
  static calculateDifferencePercentage(value1, value2) {
    const num1 = this.toNumber(value1)
    const num2 = this.toNumber(value2)
    
    if (num2 === 0) {
      return num1 === 0 ? 0 : Infinity
    }
    
    return this.roundToDecimals(Math.abs(num1 - num2) / Math.abs(num2) * 100)
  }

  /**
   * 生成权重分配
   */
  static distributeWeights(count, method = 'equal') {
    if (count <= 0) return []
    
    switch (method) {
      case 'equal':
        return new Array(count).fill(1 / count)
      
      case 'linear_decreasing':
        const total = count * (count + 1) / 2
        return Array.from({ length: count }, (_, i) => (count - i) / total)
      
      case 'exponential':
        const base = 2
        const expTotal = (Math.pow(base, count) - 1) / (base - 1)
        return Array.from({ length: count }, (_, i) => Math.pow(base, count - i - 1) / expTotal)
      
      default:
        return new Array(count).fill(1 / count)
    }
  }

  /**
   * 金额分配算法
   */
  static distributeAmount(totalAmount, weights, minAmount = 0, maxAmount = Infinity) {
    if (!Array.isArray(weights) || weights.length === 0) {
      return []
    }

    const total = this.toNumber(totalAmount)
    const totalWeight = weights.reduce((sum, w) => sum + this.toNumber(w), 0)
    
    if (totalWeight <= 0) {
      return new Array(weights.length).fill(0)
    }

    // 初始分配
    let distribution = weights.map(weight => 
      this.roundToDecimals((this.toNumber(weight) / totalWeight) * total)
    )

    // 应用最小值约束
    const adjustedDistribution = distribution.map(amount => 
      Math.max(this.toNumber(minAmount), Math.min(this.toNumber(maxAmount), amount))
    )

    // 调整总额以确保分配完毕
    const distributedSum = adjustedDistribution.reduce((sum, amount) => sum + amount, 0)
    const difference = total - distributedSum
    
    if (Math.abs(difference) > 0.01) {
      // 将差额按比例分配到各项中
      const adjustmentRatio = difference / distributedSum
      return adjustedDistribution.map(amount => 
        this.roundToDecimals(amount * (1 + adjustmentRatio))
      )
    }

    return adjustedDistribution
  }

  /**
   * 计算奖金分配的公平性指标
   */
  static calculateFairnessMetrics(allocations, scores) {
    if (!Array.isArray(allocations) || !Array.isArray(scores) || 
        allocations.length !== scores.length || allocations.length === 0) {
      return {
        giniCoefficient: 0,
        correlationWithScore: 0,
        variationCoefficient: 0
      }
    }

    // 基尼系数计算
    const sortedAllocations = [...allocations].sort((a, b) => a - b)
    const n = sortedAllocations.length
    const sum = sortedAllocations.reduce((acc, val) => acc + val, 0)
    
    let giniSum = 0
    for (let i = 0; i < n; i++) {
      giniSum += (2 * (i + 1) - n - 1) * sortedAllocations[i]
    }
    const giniCoefficient = giniSum / (n * sum)

    // 与得分的相关性
    const correlationWithScore = this.calculateCorrelation(allocations, scores)

    // 变异系数
    const stats = this.calculateStats(allocations)
    const variationCoefficient = stats.mean > 0 ? stats.stdDev / stats.mean : 0

    return {
      giniCoefficient: this.roundToDecimals(giniCoefficient, 4),
      correlationWithScore: this.roundToDecimals(correlationWithScore, 4),
      variationCoefficient: this.roundToDecimals(variationCoefficient, 4)
    }
  }

  /**
   * 计算两个数组的相关系数
   */
  static calculateCorrelation(x, y) {
    if (!Array.isArray(x) || !Array.isArray(y) || x.length !== y.length || x.length === 0) {
      return 0
    }

    const n = x.length
    const sumX = x.reduce((sum, val) => sum + this.toNumber(val), 0)
    const sumY = y.reduce((sum, val) => sum + this.toNumber(val), 0)
    const sumXY = x.reduce((sum, val, i) => sum + this.toNumber(val) * this.toNumber(y[i]), 0)
    const sumX2 = x.reduce((sum, val) => sum + Math.pow(this.toNumber(val), 2), 0)
    const sumY2 = y.reduce((sum, val) => sum + Math.pow(this.toNumber(val), 2), 0)

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY))

    return denominator === 0 ? 0 : numerator / denominator
  }

  /**
   * 生成计算报告摘要
   */
  static generateCalculationSummary(results, bonusPool) {
    if (!Array.isArray(results) || results.length === 0) {
      return {
        totalEmployees: 0,
        totalAllocated: 0,
        allocationRatio: 0,
        averageBonus: 0,
        medianBonus: 0,
        minBonus: 0,
        maxBonus: 0,
        standardDeviation: 0,
        fairnessMetrics: {
          giniCoefficient: 0,
          variationCoefficient: 0
        }
      }
    }

    const totalAmount = this.toNumber(bonusPool?.totalAmount)
    const amounts = results.map(r => this.toNumber(r.totalAmount) || this.toNumber(r.bonusAmount))
    const stats = this.calculateStats(amounts)

    const totalAllocated = stats.sum
    const allocationRatio = totalAmount > 0 ? totalAllocated / totalAmount : 0

    return {
      totalEmployees: results.length,
      totalAllocated: this.roundToDecimals(totalAllocated),
      allocationRatio: this.roundToDecimals(allocationRatio),
      averageBonus: this.roundToDecimals(stats.mean),
      medianBonus: this.roundToDecimals(stats.median),
      minBonus: this.roundToDecimals(stats.min),
      maxBonus: this.roundToDecimals(stats.max),
      standardDeviation: this.roundToDecimals(stats.stdDev),
      fairnessMetrics: {
        giniCoefficient: this.roundToDecimals(this.calculateGiniCoefficient(amounts), 4),
        variationCoefficient: this.roundToDecimals(stats.stdDev / stats.mean, 4)
      }
    }
  }

  /**
   * 计算基尼系数
   */
  static calculateGiniCoefficient(values) {
    if (!Array.isArray(values) || values.length === 0) return 0
    
    const sorted = values.map(v => this.toNumber(v)).sort((a, b) => a - b)
    const n = sorted.length
    const sum = sorted.reduce((acc, val) => acc + val, 0)
    
    if (sum === 0) return 0
    
    let giniSum = 0
    for (let i = 0; i < n; i++) {
      giniSum += (2 * (i + 1) - n - 1) * sorted[i]
    }
    
    return giniSum / (n * sum)
  }

  /**
   * 检测异常值
   */
  static detectOutliers(values, method = 'iqr') {
    if (!Array.isArray(values) || values.length < 4) return []
    
    const numbers = values.map(v => this.toNumber(v)).sort((a, b) => a - b)
    
    if (method === 'iqr') {
      const q1 = this.calculatePercentile(numbers, 25)
      const q3 = this.calculatePercentile(numbers, 75)
      const iqr = q3 - q1
      const lowerBound = q1 - 1.5 * iqr
      const upperBound = q3 + 1.5 * iqr
      
      return values
        .map((value, index) => ({ value, index }))
        .filter(item => this.toNumber(item.value) < lowerBound || this.toNumber(item.value) > upperBound)
    }
    
    return []
  }
}

module.exports = CalculationUtils