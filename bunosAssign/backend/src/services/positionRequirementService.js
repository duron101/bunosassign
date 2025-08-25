/**
 * 岗位要求服务
 * 提供岗位要求的创建、管理、审核等核心功能
 */

const nedbService = require('./nedbService')
const logger = require('../utils/logger')

class PositionRequirementService {
  /**
   * 创建岗位要求
   * @param {Object} requirementData - 岗位要求数据
   * @returns {Object} 创建的岗位要求记录
   */
  async createPositionRequirement(requirementData) {
    try {
      const requirement = {
        ...requirementData,
        approvalStatus: 'draft',
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastUpdated: new Date()
      }

      const result = await nedbService.insert('positionRequirements', requirement)
      
      logger.info('岗位要求创建成功', {
        requirementId: result._id || result.id,
        positionId: requirementData.positionId,
        positionName: requirementData.positionName
      })

      return result
    } catch (error) {
      logger.error('创建岗位要求失败:', error)
      throw error
    }
  }

  /**
   * 获取岗位要求列表
   * @param {Object} query - 查询条件
   * @param {Object} options - 查询选项
   * @returns {Object} 岗位要求列表和分页信息
   */
  async getPositionRequirements(query = {}, options = {}) {
    try {
      const {
        page = 1,
        pageSize = 20,
        positionId,
        businessLineId,
        approvalStatus,
        search
      } = query

      // 构建查询条件
      const filterQuery = {}
      
      if (positionId) {
        filterQuery.positionId = positionId
      }
      
      if (businessLineId) {
        filterQuery.businessLineId = businessLineId
      }
      
      if (approvalStatus) {
        filterQuery.approvalStatus = approvalStatus
      }
      
      if (search) {
        filterQuery.$or = [
          { positionName: { $regex: search, $options: 'i' } },
          { positionCode: { $regex: search, $options: 'i' } }
        ]
      }

      // 获取岗位要求列表
      const requirements = await nedbService.find('positionRequirements', filterQuery, {
        sort: { updatedAt: -1 }
      })

      // 分页处理
      const total = requirements.length
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      const paginatedRequirements = requirements.slice(startIndex, endIndex)

      return {
        requirements: paginatedRequirements,
        pagination: {
          total,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(total / parseInt(pageSize))
        }
      }
    } catch (error) {
      logger.error('获取岗位要求列表失败:', error)
      throw error
    }
  }

  /**
   * 根据岗位ID获取岗位要求
   * @param {string} positionId - 岗位ID
   * @returns {Object} 岗位要求记录
   */
  async getPositionRequirementByPositionId(positionId) {
    try {
      const requirement = await nedbService.findOne('positionRequirements', { 
        positionId: positionId,
        status: 1
      })
      
      if (!requirement) {
        return null
      }

      return requirement
    } catch (error) {
      logger.error('根据岗位ID获取岗位要求失败:', error)
      throw error
    }
  }

  /**
   * 更新岗位要求
   * @param {string} id - 岗位要求ID
   * @param {Object} updateData - 更新数据
   * @returns {Object} 更新后的岗位要求记录
   */
  async updatePositionRequirement(id, updateData) {
    try {
      const updateFields = {
        ...updateData,
        updatedAt: new Date(),
        lastUpdated: new Date()
      }

      await nedbService.update('positionRequirements', 
        { _id: id }, 
        updateFields
      )

      // 获取更新后的记录
      const updatedRequirement = await nedbService.findOne('positionRequirements', { 
        _id: id 
      })

      logger.info('岗位要求更新成功', {
        requirementId: id,
        updateFields: Object.keys(updateData)
      })

      return updatedRequirement
    } catch (error) {
      logger.error('更新岗位要求失败:', error)
      throw error
    }
  }

  /**
   * 提交审核
   * @param {string} id - 岗位要求ID
   * @returns {Object} 更新后的岗位要求记录
   */
  async submitForApproval(id) {
    try {
      const updateFields = {
        approvalStatus: 'pending',
        updatedAt: new Date(),
        lastUpdated: new Date()
      }

      await nedbService.update('positionRequirements', 
        { _id: id }, 
        updateFields
      )

      const updatedRequirement = await nedbService.findOne('positionRequirements', { 
        _id: id 
      })

      logger.info('岗位要求提交审核成功', {
        requirementId: id,
        status: 'pending'
      })

      return updatedRequirement
    } catch (error) {
      logger.error('提交审核失败:', error)
      throw error
    }
  }

  /**
   * 业务线审核通过
   * @param {string} id - 岗位要求ID
   * @param {string} approver - 审核人
   * @param {string} comments - 审核意见
   * @returns {Object} 更新后的岗位要求记录
   */
  async approveByBusinessLine(id, approver, comments = '') {
    try {
      const updateFields = {
        approvalStatus: 'pending_admin',
        businessLineApprover: approver,
        approvalComments: comments,
        updatedAt: new Date(),
        lastUpdated: new Date()
      }

      await nedbService.update('positionRequirements', 
        { _id: id }, 
        updateFields
      )

      const updatedRequirement = await nedbService.findOne('positionRequirements', { 
        _id: id 
      })

      logger.info('业务线审核通过', {
        requirementId: id,
        approver,
        comments
      })

      return updatedRequirement
    } catch (error) {
      logger.error('业务线审核失败:', error)
      throw error
    }
  }

  /**
   * 管理员/总经理最终审批
   * @param {string} id - 岗位要求ID
   * @param {string} approver - 审核人
   * @param {boolean} approved - 是否通过
   * @param {string} comments - 审核意见
   * @returns {Object} 更新后的岗位要求记录
   */
  async finalApproval(id, approver, approved, comments = '') {
    try {
      const updateFields = {
        approvalStatus: approved ? 'approved' : 'rejected',
        adminApprover: approver,
        approvalComments: comments,
        updatedAt: new Date(),
        lastUpdated: new Date()
      }

      await nedbService.update('positionRequirements', 
        { _id: id }, 
        updateFields
      )

      const updatedRequirement = await nedbService.findOne('positionRequirements', { 
        _id: id 
      })

      logger.info('最终审批完成', {
        requirementId: id,
        approver,
        approved,
        comments
      })

      return updatedRequirement
    } catch (error) {
      logger.error('最终审批失败:', error)
      throw error
    }
  }

  /**
   * 删除岗位要求
   * @param {string} id - 岗位要求ID
   * @returns {boolean} 删除结果
   */
  async deletePositionRequirement(id) {
    try {
      const result = await nedbService.remove('positionRequirements', { 
        _id: id 
      })

      logger.info('岗位要求删除成功', {
        requirementId: id,
        result
      })

      return result > 0
    } catch (error) {
      logger.error('删除岗位要求失败:', error)
      throw error
    }
  }

  /**
   * 获取审核状态统计
   * @returns {Object} 统计信息
   */
  async getApprovalStats() {
    try {
      const allRequirements = await nedbService.find('positionRequirements', {})
      
      const stats = {
        total: allRequirements.length,
        draft: allRequirements.filter(r => r.approvalStatus === 'draft').length,
        pending: allRequirements.filter(r => r.approvalStatus === 'pending').length,
        pending_admin: allRequirements.filter(r => r.approvalStatus === 'pending_admin').length,
        approved: allRequirements.filter(r => r.approvalStatus === 'approved').length,
        rejected: allRequirements.filter(r => r.approvalStatus === 'rejected').length
      }

      return stats
    } catch (error) {
      logger.error('获取审核状态统计失败:', error)
      throw error
    }
  }

  /**
   * 批量操作
   * @param {Array} ids - 岗位要求ID数组
   * @param {string} action - 操作类型
   * @param {Object} updateData - 更新数据
   * @returns {number} 更新的记录数量
   */
  async batchOperation(ids, action, updateData = {}) {
    try {
      let updateFields = {}
      
      switch (action) {
        case 'approve':
          updateFields = {
            approvalStatus: 'approved',
            updatedAt: new Date(),
            lastUpdated: new Date()
          }
          break
        case 'reject':
          updateFields = {
            approvalStatus: 'rejected',
            updatedAt: new Date(),
            lastUpdated: new Date()
          }
          break
        case 'enable':
          updateFields = {
            status: 1,
            updatedAt: new Date()
          }
          break
        case 'disable':
          updateFields = {
            status: 0,
            updatedAt: new Date()
          }
          break
        default:
          updateFields = {
            ...updateData,
            updatedAt: new Date()
          }
      }

      const result = await nedbService.update('positionRequirements', 
        { _id: { $in: ids } }, 
        updateFields
      )

      logger.info('批量操作成功', {
        action,
        ids: ids.length,
        updatedCount: result
      })

      return result
    } catch (error) {
      logger.error('批量操作失败:', error)
      throw error
    }
  }

  /**
   * 获取岗位要求模板
   * @param {string} positionType - 岗位类型
   * @returns {Object} 岗位要求模板
   */
  getPositionRequirementTemplate(positionType) {
    const templates = {
      'algorithm-engineer': {
        basicRequirements: {
          education: '硕士及以上',
          experience: '3-5年',
          age: '25-35岁',
          certificates: ['相关专业认证'],
          major: '计算机、数学、自动化等相关专业'
        },
        professionalSkills: {
          simulationSkills: ['MATLAB', 'Simulink', 'ANSYS'],
          aiSkills: ['Python', 'TensorFlow', 'PyTorch', '机器学习算法'],
          softwareSkills: ['C++', 'Python', '算法设计'],
          hardwareSkills: [],
          tools: ['Git', 'Docker', 'Linux'],
          languages: ['中文', '英语']
        },
        softSkills: {
          communication: '良好',
          teamwork: '良好',
          problemSolving: '优秀',
          innovation: '优秀',
          learning: '优秀'
        },
        promotionRequirements: {
          minExperience: '3年',
          performanceLevel: 'B级及以上',
          skillAssessment: '通过算法技能考核',
          projectContribution: '主导过2个以上算法项目'
        },
        careerPath: {
          nextLevel: '高级算法工程师',
          lateralMoves: ['技术架构师', 'AI专家'],
          specializations: ['机器学习专家', '算法优化专家'],
          estimatedTime: '2-3年',
          growthAreas: ['算法深度', '业务理解', '技术创新']
        },
        responsibilities: [
          '负责核心算法设计和优化',
          '参与技术方案设计',
          '指导初级算法工程师',
          '推动算法技术创新'
        ]
      },
      'comprehensive-ops': {
        basicRequirements: {
          education: '本科及以上',
          experience: '3-5年',
          age: '25-35岁',
          certificates: ['人力资源管理师', '会计从业资格'],
          major: '工商管理、人力资源管理等相关专业'
        },
        professionalSkills: {
          simulationSkills: [],
          aiSkills: [],
          softwareSkills: ['Office办公软件', '财务软件'],
          hardwareSkills: [],
          tools: ['OA系统', 'CRM系统', '财务系统'],
          languages: ['中文', '英语']
        },
        softSkills: {
          communication: '优秀',
          teamwork: '优秀',
          problemSolving: '良好',
          innovation: '良好',
          learning: '良好'
        },
        promotionRequirements: {
          minExperience: '3年',
          performanceLevel: 'B级及以上',
          skillAssessment: '通过综合运营技能考核',
          projectContribution: '独立完成3个以上运营项目'
        },
        careerPath: {
          nextLevel: '综合运营主管',
          lateralMoves: ['人事主管', '行政主管'],
          specializations: ['运营专家', '流程优化专家'],
          estimatedTime: '2-3年',
          growthAreas: ['流程优化', '团队管理', '战略规划']
        },
        responsibilities: [
          '负责公司日常运营管理',
          '协调各部门工作',
          '优化运营流程',
          '维护供应商关系'
        ]
      }
    }

    return templates[positionType] || templates['algorithm-engineer']
  }
}

module.exports = new PositionRequirementService()
