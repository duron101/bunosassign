const crypto = require('crypto')
const logger = require('../utils/logger')

class DataMaskingService {

  /**
   * 手机号脱敏
   * @param {string} phone - 手机号
   * @returns {string} 脱敏后的手机号
   */
  maskPhone(phone) {
    if (!phone || phone.length < 11) return phone
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  }

  /**
   * 邮箱脱敏
   * @param {string} email - 邮箱地址
   * @returns {string} 脱敏后的邮箱
   */
  maskEmail(email) {
    if (!email || !email.includes('@')) return email
    const [username, domain] = email.split('@')
    if (username.length <= 2) return email
    const maskedUsername = username.charAt(0) + '***' + username.charAt(username.length - 1)
    return `${maskedUsername}@${domain}`
  }

  /**
   * 身份证号脱敏
   * @param {string} idNumber - 身份证号
   * @returns {string} 脱敏后的身份证号
   */
  maskIdNumber(idNumber) {
    if (!idNumber || idNumber.length < 15) return idNumber
    return idNumber.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
  }

  /**
   * 银行卡号脱敏
   * @param {string} bankCard - 银行卡号
   * @returns {string} 脱敏后的银行卡号
   */
  maskBankCard(bankCard) {
    if (!bankCard || bankCard.length < 12) return bankCard
    return bankCard.replace(/(\d{4})\d+(\d{4})/, '$1****$2')
  }

  /**
   * 姓名脱敏
   * @param {string} name - 姓名
   * @returns {string} 脱敏后的姓名
   */
  maskName(name) {
    if (!name || name.length < 2) return name
    if (name.length === 2) {
      return name.charAt(0) + '*'
    }
    return name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1)
  }

  /**
   * 金额脱敏（保留千位数）
   * @param {number} amount - 金额
   * @returns {string} 脱敏后的金额
   */
  maskAmount(amount) {
    if (typeof amount !== 'number') return amount
    if (amount < 1000) return '***'
    const amountStr = amount.toString()
    const thousands = Math.floor(amount / 1000)
    return `${thousands}k+`
  }

  /**
   * 工号脱敏
   * @param {string} employeeNumber - 工号
   * @returns {string} 脱敏后的工号
   */
  maskEmployeeNumber(employeeNumber) {
    if (!employeeNumber || employeeNumber.length < 4) return employeeNumber
    const prefix = employeeNumber.substring(0, 2)
    const suffix = employeeNumber.substring(employeeNumber.length - 2)
    return `${prefix}***${suffix}`
  }

  /**
   * 通用数据脱敏处理
   * @param {Object} data - 原始数据对象
   * @param {Array} maskFields - 需要脱敏的字段配置
   * @param {string} userRole - 用户角色
   * @returns {Object} 脱敏后的数据
   */
  maskData(data, maskFields = [], userRole = 'user') {
    if (!data) return data

    // 根据用户角色确定脱敏级别
    const maskLevel = this.getMaskLevel(userRole)
    
    const maskedData = JSON.parse(JSON.stringify(data))

    maskFields.forEach(fieldConfig => {
      const { field, type, roles } = fieldConfig
      
      // 检查是否需要对当前角色脱敏
      if (roles && !roles.includes(userRole) && maskLevel < 3) {
        return
      }

      if (Array.isArray(maskedData)) {
        maskedData.forEach(item => {
          if (item[field]) {
            item[field] = this.applyMask(item[field], type)
          }
        })
      } else if (maskedData[field]) {
        maskedData[field] = this.applyMask(maskedData[field], type)
      }
    })

    return maskedData
  }

  /**
   * 应用具体的脱敏方法
   * @param {*} value - 原始值
   * @param {string} type - 脱敏类型
   * @returns {*} 脱敏后的值
   */
  applyMask(value, type) {
    switch (type) {
      case 'phone':
        return this.maskPhone(value)
      case 'email':
        return this.maskEmail(value)
      case 'idNumber':
        return this.maskIdNumber(value)
      case 'bankCard':
        return this.maskBankCard(value)
      case 'name':
        return this.maskName(value)
      case 'amount':
        return this.maskAmount(value)
      case 'employeeNumber':
        return this.maskEmployeeNumber(value)
      case 'partial':
        return this.maskPartial(value)
      default:
        return value
    }
  }

  /**
   * 部分脱敏（通用）
   * @param {string} value - 原始值
   * @returns {string} 脱敏后的值
   */
  maskPartial(value) {
    if (!value || typeof value !== 'string') return value
    if (value.length <= 4) return '***'
    const start = Math.ceil(value.length * 0.3)
    const end = Math.floor(value.length * 0.7)
    return value.substring(0, start) + '*'.repeat(end - start) + value.substring(end)
  }

  /**
   * 获取用户角色对应的脱敏级别
   * @param {string} userRole - 用户角色
   * @returns {number} 脱敏级别 1-低 2-中 3-高
   */
  getMaskLevel(userRole) {
    const roleLevels = {
      'admin': 1,           // 管理员 - 低脱敏
      'hr': 1,              // HR - 低脱敏
      'manager': 2,         // 经理 - 中脱敏
      'supervisor': 2,      // 主管 - 中脱敏
      'employee': 3,        // 普通员工 - 高脱敏
      'user': 3             // 普通用户 - 高脱敏
    }
    return roleLevels[userRole] || 3
  }

  /**
   * 员工数据脱敏配置
   */
  getEmployeeMaskConfig() {
    return [
      { field: 'phone', type: 'phone', roles: ['employee', 'user'] },
      { field: 'email', type: 'email', roles: ['employee', 'user'] },
      { field: 'idNumber', type: 'idNumber', roles: ['manager', 'supervisor', 'employee', 'user'] },
      { field: 'bankCard', type: 'bankCard', roles: ['manager', 'supervisor', 'employee', 'user'] },
      { field: 'employeeNumber', type: 'employeeNumber', roles: ['employee', 'user'] }
    ]
  }

  /**
   * 奖金数据脱敏配置
   */
  getBonusMaskConfig() {
    return [
      { field: 'baseAmount', type: 'amount', roles: ['employee', 'user'] },
      { field: 'performanceAmount', type: 'amount', roles: ['employee', 'user'] },
      { field: 'totalAmount', type: 'amount', roles: ['employee', 'user'] },
      { field: 'adjustmentAmount', type: 'amount', roles: ['supervisor', 'employee', 'user'] }
    ]
  }

  /**
   * 利润数据脱敏配置
   */
  getProfitMaskConfig() {
    return [
      { field: 'revenue', type: 'amount', roles: ['supervisor', 'employee', 'user'] },
      { field: 'cost', type: 'amount', roles: ['supervisor', 'employee', 'user'] },
      { field: 'profit', type: 'amount', roles: ['supervisor', 'employee', 'user'] }
    ]
  }

  /**
   * 数据加密
   * @param {string} data - 待加密数据
   * @param {string} key - 加密密钥
   * @returns {string} 加密后的数据
   */
  encrypt(data, key = process.env.ENCRYPTION_KEY) {
    if (!data || !key) return data

    try {
      const algorithm = 'aes-256-gcm'
      const iv = crypto.randomBytes(16)
      const cipher = crypto.createCipher(algorithm, key)
      
      let encrypted = cipher.update(data, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      const authTag = cipher.getAuthTag()
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      }
    } catch (error) {
      logger.error('数据加密失败:', error)
      return data
    }
  }

  /**
   * 数据解密
   * @param {Object} encryptedData - 加密数据对象
   * @param {string} key - 解密密钥
   * @returns {string} 解密后的数据
   */
  decrypt(encryptedData, key = process.env.ENCRYPTION_KEY) {
    if (!encryptedData || !key) return encryptedData

    try {
      const algorithm = 'aes-256-gcm'
      const decipher = crypto.createDecipher(algorithm, key)
      
      decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'))
      
      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      logger.error('数据解密失败:', error)
      return encryptedData
    }
  }

  /**
   * 日志脱敏处理
   * @param {Object} logData - 日志数据
   * @returns {Object} 脱敏后的日志数据
   */
  maskLogData(logData) {
    const sensitiveFields = ['password', 'token', 'phone', 'email', 'idNumber', 'bankCard']
    const maskedData = JSON.parse(JSON.stringify(logData))

    const maskRecursive = (obj) => {
      if (typeof obj !== 'object' || obj === null) return obj

      Object.keys(obj).forEach(key => {
        if (sensitiveFields.includes(key.toLowerCase())) {
          obj[key] = '***'
        } else if (typeof obj[key] === 'object') {
          maskRecursive(obj[key])
        }
      })
      return obj
    }

    return maskRecursive(maskedData)
  }

  /**
   * 检查数据是否包含敏感信息
   * @param {*} data - 待检查数据
   * @returns {boolean} 是否包含敏感信息
   */
  containsSensitiveData(data) {
    const sensitivePatterns = [
      /\d{15}|\d{18}/,           // 身份证
      /1[3-9]\d{9}/,            // 手机号
      /\d{16,19}/,              // 银行卡号
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/ // 邮箱
    ]

    const dataStr = JSON.stringify(data)
    return sensitivePatterns.some(pattern => pattern.test(dataStr))
  }
}

module.exports = new DataMaskingService()