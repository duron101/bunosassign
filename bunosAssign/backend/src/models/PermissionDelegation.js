/**
 * 权限委派模型
 * 用于管理用户之间的临时权限委派
 */

class PermissionDelegation {
  constructor(data = {}) {
    this._id = data._id || null
    this.delegatorId = data.delegatorId // 委派者ID
    this.delegateeId = data.delegateeId // 被委派者ID
    this.permissions = data.permissions || [] // 委派的权限列表
    this.resourceType = data.resourceType || null // 资源类型（可选）
    this.resourceId = data.resourceId || null // 资源ID（可选）
    this.startTime = data.startTime || new Date() // 委派开始时间
    this.endTime = data.endTime || null // 委派结束时间
    this.status = data.status || 'pending' // 状态：pending-待审批, active-已激活, expired-已过期, revoked-已撤销
    this.approvalRequired = data.approvalRequired || false // 是否需要审批
    this.approvedBy = data.approvedBy || null // 审批人ID
    this.approvedAt = data.approvedAt || null // 审批时间
    this.approvalComments = data.approvalComments || null // 审批意见
    this.reason = data.reason || '' // 委派原因
    this.conditions = data.conditions || {} // 委派条件（如时间限制、金额限制等）
    this.createdAt = data.createdAt || new Date()
    this.updatedAt = data.updatedAt || new Date()
  }

  /**
   * 验证委派数据
   * @returns {Object} 验证结果
   */
  validate() {
    const errors = []

    if (!this.delegatorId) {
      errors.push('委派者ID不能为空')
    }

    if (!this.delegateeId) {
      errors.push('被委派者ID不能为空')
    }

    if (this.delegatorId === this.delegateeId) {
      errors.push('不能委派权限给自己')
    }

    if (!Array.isArray(this.permissions) || this.permissions.length === 0) {
      errors.push('委派权限不能为空')
    }

    if (!this.startTime) {
      errors.push('委派开始时间不能为空')
    }

    if (this.endTime && this.endTime <= this.startTime) {
      errors.push('委派结束时间必须晚于开始时间')
    }

    if (!['pending', 'active', 'expired', 'revoked'].includes(this.status)) {
      errors.push('无效的委派状态')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 检查委派是否有效
   * @returns {boolean}
   */
  isValid() {
    const now = new Date()
    
    // 检查状态
    if (this.status !== 'active') {
      return false
    }
    
    // 检查时间
    if (this.startTime > now) {
      return false
    }
    
    if (this.endTime && this.endTime < now) {
      return false
    }
    
    return true
  }

  /**
   * 检查委派是否过期
   * @returns {boolean}
   */
  isExpired() {
    if (!this.endTime) {
      return false
    }
    
    return new Date() > this.endTime
  }

  /**
   * 激活委派
   * @param {string} approvedBy - 审批人ID
   * @param {string} comments - 审批意见
   */
  activate(approvedBy, comments = '') {
    this.status = 'active'
    this.approvedBy = approvedBy
    this.approvedAt = new Date()
    this.approvalComments = comments
    this.updatedAt = new Date()
  }

  /**
   * 撤销委派
   * @param {string} reason - 撤销原因
   */
  revoke(reason = '') {
    this.status = 'revoked'
    this.reason = reason
    this.updatedAt = new Date()
  }

  /**
   * 更新委派状态
   */
  updateStatus() {
    if (this.status === 'active' && this.isExpired()) {
      this.status = 'expired'
      this.updatedAt = new Date()
    }
  }

  /**
   * 转换为普通对象
   * @returns {Object}
   */
  toObject() {
    return {
      _id: this._id,
      delegatorId: this.delegatorId,
      delegateeId: this.delegateeId,
      permissions: this.permissions,
      resourceType: this.resourceType,
      resourceId: this.resourceId,
      startTime: this.startTime,
      endTime: this.endTime,
      status: this.status,
      approvalRequired: this.approvalRequired,
      approvedBy: this.approvedBy,
      approvedAt: this.approvedAt,
      approvalComments: this.approvalComments,
      reason: this.reason,
      conditions: this.conditions,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

  /**
   * 从数据库记录创建实例
   * @param {Object} record - 数据库记录
   * @returns {PermissionDelegation}
   */
  static fromRecord(record) {
    return new PermissionDelegation(record)
  }

  /**
   * 创建委派实例
   * @param {Object} data - 委派数据
   * @returns {PermissionDelegation}
   */
  static create(data) {
    return new PermissionDelegation(data)
  }
}

module.exports = PermissionDelegation
