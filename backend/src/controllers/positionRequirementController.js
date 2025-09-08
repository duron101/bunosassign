const positionRequirementService = require('../services/positionRequirementService')
const logger = require('../utils/logger')

class PositionRequirementController {
  /**
   * 获取岗位要求列表
   */
  async getPositionRequirements(req, res, next) {
    try {
      const result = await positionRequirementService.getPositionRequirements(req.query)
      
      res.json({
        code: 200,
        data: result,
        message: '获取成功'
      })
    } catch (error) {
      logger.error('Get position requirements error:', error)
      next(error)
    }
  }

  /**
   * 获取岗位要求详情
   */
  async getPositionRequirement(req, res, next) {
    try {
      const { id } = req.params
      
      const requirement = await positionRequirementService.getPositionRequirement(id)
      
      if (!requirement) {
        return res.status(404).json({
          code: 404,
          message: '岗位要求不存在',
          data: null
        })
      }

      res.json({
        code: 200,
        data: requirement,
        message: '获取成功'
      })
    } catch (error) {
      logger.error('Get position requirement error:', error)
      next(error)
    }
  }

  /**
   * 根据岗位ID获取岗位要求
   */
  async getPositionRequirementByPositionId(req, res, next) {
    try {
      const { positionId } = req.params
      
      const requirement = await positionRequirementService.getPositionRequirementByPositionId(positionId)
      
      if (!requirement) {
        return res.status(404).json({
          code: 404,
          message: '岗位要求不存在',
          data: null
        })
      }

      res.json({
        code: 200,
        data: requirement,
        message: '获取成功'
      })
    } catch (error) {
      logger.error('Get position requirement by position ID error:', error)
      next(error)
    }
  }

  /**
   * 创建岗位要求
   */
  async createPositionRequirement(req, res, next) {
    try {
      const requirementData = req.body
      
      // 设置维护人
      requirementData.maintainer = req.user.username
      
      const result = await positionRequirementService.createPositionRequirement(requirementData)
      
      res.json({
        code: 200,
        data: result,
        message: '创建成功'
      })
    } catch (error) {
      logger.error('Create position requirement error:', error)
      next(error)
    }
  }

  /**
   * 更新岗位要求
   */
  async updatePositionRequirement(req, res, next) {
    try {
      const { id } = req.params
      const updateData = req.body
      
      // 设置维护人
      updateData.maintainer = req.user.username
      
      const result = await positionRequirementService.updatePositionRequirement(id, updateData)
      
      res.json({
        code: 200,
        data: result,
        message: '更新成功'
      })
    } catch (error) {
      logger.error('Update position requirement error:', error)
      next(error)
    }
  }

  /**
   * 删除岗位要求
   */
  async deletePositionRequirement(req, res, next) {
    try {
      const { id } = req.params
      
      const result = await positionRequirementService.deletePositionRequirement(id)
      
      if (result) {
        res.json({
          code: 200,
          data: null,
          message: '删除成功'
        })
      } else {
        res.status(404).json({
          code: 404,
          message: '岗位要求不存在',
          data: null
        })
      }
    } catch (error) {
      logger.error('Delete position requirement error:', error)
      next(error)
    }
  }

  /**
   * 提交审核
   */
  async submitForApproval(req, res, next) {
    try {
      const { id } = req.params
      
      const result = await positionRequirementService.submitForApproval(id)
      
      res.json({
        code: 200,
        data: result,
        message: '提交审核成功'
      })
    } catch (error) {
      logger.error('Submit for approval error:', error)
      next(error)
    }
  }

  /**
   * 业务线审核通过
   */
  async approveByBusinessLine(req, res, next) {
    try {
      const { id } = req.params
      const { comments } = req.body
      
      const result = await positionRequirementService.approveByBusinessLine(
        id, 
        req.user.username, 
        comments
      )
      
      res.json({
        code: 200,
        data: result,
        message: '业务线审核通过'
      })
    } catch (error) {
      logger.error('Business line approval error:', error)
      next(error)
    }
  }

  /**
   * 管理员最终审批
   */
  async finalApproval(req, res, next) {
    try {
      const { id } = req.params
      const { approved, comments } = req.body
      
      const result = await positionRequirementService.finalApproval(
        id, 
        req.user.username, 
        approved, 
        comments
      )
      
      res.json({
        code: 200,
        data: result,
        message: approved ? '审批通过' : '审批拒绝'
      })
    } catch (error) {
      logger.error('Final approval error:', error)
      next(error)
    }
  }

  /**
   * 批量操作
   */
  async batchOperation(req, res, next) {
    try {
      const { action, ids, updateData } = req.body
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '请选择要操作的岗位要求',
          data: null
        })
      }
      
      const result = await positionRequirementService.batchOperation(ids, action, updateData)
      
      res.json({
        code: 200,
        data: { updatedCount: result },
        message: '批量操作成功'
      })
    } catch (error) {
      logger.error('Batch operation error:', error)
      next(error)
    }
  }

  /**
   * 获取审核状态统计
   */
  async getApprovalStats(req, res, next) {
    try {
      const stats = await positionRequirementService.getApprovalStats()
      
      res.json({
        code: 200,
        data: stats,
        message: '获取成功'
      })
    } catch (error) {
      logger.error('Get approval stats error:', error)
      next(error)
    }
  }

  /**
   * 导出岗位要求
   */
  async exportPositionRequirements(req, res, next) {
    try {
      // 这里实现导出逻辑
      res.json({
        code: 200,
        data: { message: '导出功能开发中' },
        message: '导出功能开发中'
      })
    } catch (error) {
      logger.error('Export position requirements error:', error)
      next(error)
    }
  }

  /**
   * 导入岗位要求
   */
  async importPositionRequirements(req, res, next) {
    try {
      // 这里实现导入逻辑
      res.json({
        code: 200,
        data: { message: '导入功能开发中' },
        message: '导入功能开发中'
      })
    } catch (error) {
      logger.error('Import position requirements error:', error)
      next(error)
    }
  }

  /**
   * 获取岗位要求模板
   */
  async getPositionRequirementTemplate(req, res, next) {
    try {
      const { type } = req.params
      
      const template = positionRequirementService.getPositionRequirementTemplate(type)
      
      res.json({
        code: 200,
        data: template,
        message: '获取成功'
      })
    } catch (error) {
      logger.error('Get position requirement template error:', error)
      next(error)
    }
  }
}

module.exports = new PositionRequirementController()
