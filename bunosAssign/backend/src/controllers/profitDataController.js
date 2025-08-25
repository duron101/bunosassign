const { ProfitData, BusinessLine, Project, sequelize } = require('../models')
const { Op } = require('sequelize')
const logger = require('../utils/logger')

class ProfitDataController {
  // 获取利润数据列表
  async getProfitData(req, res, next) {
    try {
      const { 
        page = 1, 
        pageSize = 20, 
        period,
        businessLineId,
        projectId,
        dataSource,
        startPeriod,
        endPeriod
      } = req.query

      const where = { status: 1 }
      
      // 期间筛选
      if (period) {
        where.period = period
      } else if (startPeriod && endPeriod) {
        where.period = {
          [Op.between]: [startPeriod, endPeriod]
        }
      } else if (startPeriod) {
        where.period = {
          [Op.gte]: startPeriod
        }
      } else if (endPeriod) {
        where.period = {
          [Op.lte]: endPeriod
        }
      }

      // 业务线筛选
      if (businessLineId) {
        where.businessLineId = businessLineId
      }

      // 项目筛选
      if (projectId) {
        where.projectId = projectId
      }

      // 数据来源筛选
      if (dataSource) {
        where.dataSource = dataSource
      }

      const offset = (page - 1) * pageSize

      const { count, rows } = await ProfitData.findAndCountAll({
        where,
        include: [
          {
            model: BusinessLine,
            attributes: ['id', 'name', 'code'],
            required: false
          },
          {
            model: Project,
            attributes: ['id', 'name', 'code'],
            required: false
          }
        ],
        offset,
        limit: parseInt(pageSize),
        order: [['period', 'DESC'], ['createdAt', 'DESC']]
      })

      res.json({
        code: 200,
        data: {
          profitData: rows,
          pagination: {
            total: count,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            totalPages: Math.ceil(count / pageSize)
          }
        },
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get profit data error:', error)
      next(error)
    }
  }

  // 获取利润数据详情
  async getProfitDataDetail(req, res, next) {
    try {
      const { id } = req.params

      const profitData = await ProfitData.findByPk(id, {
        include: [
          {
            model: BusinessLine,
            attributes: ['id', 'name', 'code', 'weight']
          },
          {
            model: Project,
            attributes: ['id', 'name', 'code', 'status']
          }
        ]
      })

      if (!profitData) {
        return res.status(404).json({
          code: 404,
          message: '利润数据不存在',
          data: null
        })
      }

      res.json({
        code: 200,
        data: profitData,
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get profit data detail error:', error)
      next(error)
    }
  }

  // 创建利润数据
  async createProfitData(req, res, next) {
    try {
      const { 
        period, 
        businessLineId, 
        projectId,
        revenue,
        cost,
        dataSource = 'manual',
        remarks
      } = req.body

      // 检查重复记录
      const existingData = await ProfitData.findOne({
        where: {
          period,
          businessLineId: businessLineId || null,
          projectId: projectId || null
        }
      })

      if (existingData) {
        return res.status(400).json({
          code: 400,
          message: '该期间的利润数据已存在',
          data: null
        })
      }

      // 验证业务线是否存在
      if (businessLineId) {
        const businessLine = await BusinessLine.findByPk(businessLineId)
        if (!businessLine) {
          return res.status(400).json({
            code: 400,
            message: '指定业务线不存在',
            data: null
          })
        }
      }

      // 验证项目是否存在
      if (projectId) {
        const project = await Project.findByPk(projectId)
        if (!project) {
          return res.status(400).json({
            code: 400,
            message: '指定项目不存在',
            data: null
          })
        }
      }

      const profitData = await ProfitData.create({
        period,
        businessLineId,
        projectId,
        revenue,
        cost,
        dataSource,
        remarks,
        status: 1,
        createdBy: req.user.id
      })

      logger.info(`管理员${req.user.username}创建利润数据: ${period}`)

      res.status(201).json({
        code: 201,
        data: profitData,
        message: '利润数据创建成功'
      })

    } catch (error) {
      logger.error('Create profit data error:', error)
      next(error)
    }
  }

  // 更新利润数据
  async updateProfitData(req, res, next) {
    try {
      const { id } = req.params
      const { 
        revenue,
        cost,
        dataSource,
        remarks
      } = req.body

      const profitData = await ProfitData.findByPk(id)
      if (!profitData) {
        return res.status(404).json({
          code: 404,
          message: '利润数据不存在',
          data: null
        })
      }

      await profitData.update({
        revenue: revenue !== undefined ? revenue : profitData.revenue,
        cost: cost !== undefined ? cost : profitData.cost,
        dataSource: dataSource || profitData.dataSource,
        remarks: remarks !== undefined ? remarks : profitData.remarks,
        updatedBy: req.user.id
      })

      logger.info(`管理员${req.user.username}更新利润数据: ${profitData.period}`)

      res.json({
        code: 200,
        data: profitData,
        message: '利润数据更新成功'
      })

    } catch (error) {
      logger.error('Update profit data error:', error)
      next(error)
    }
  }

  // 删除利润数据
  async deleteProfitData(req, res, next) {
    try {
      const { id } = req.params

      const profitData = await ProfitData.findByPk(id)
      if (!profitData) {
        return res.status(404).json({
          code: 404,
          message: '利润数据不存在',
          data: null
        })
      }

      await profitData.update({
        status: 0,
        updatedBy: req.user.id
      })

      logger.info(`管理员${req.user.username}删除利润数据: ${profitData.period}`)

      res.json({
        code: 200,
        data: null,
        message: '利润数据删除成功'
      })

    } catch (error) {
      logger.error('Delete profit data error:', error)
      next(error)
    }
  }

  // 批量导入利润数据
  async batchImportProfitData(req, res, next) {
    try {
      const { profitDataList } = req.body

      if (!Array.isArray(profitDataList) || profitDataList.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '请提供有效的利润数据列表',
          data: null
        })
      }

      const results = []
      const errors = []

      for (let i = 0; i < profitDataList.length; i++) {
        try {
          const item = profitDataList[i]
          
          // 检查重复记录
          const existingData = await ProfitData.findOne({
            where: {
              period: item.period,
              businessLineId: item.businessLineId || null,
              projectId: item.projectId || null
            }
          })

          if (existingData) {
            // 更新现有记录
            await existingData.update({
              revenue: item.revenue,
              cost: item.cost,
              dataSource: 'import',
              remarks: item.remarks,
              updatedBy: req.user.id
            })
            results.push({ index: i, id: existingData.id, action: 'updated' })
          } else {
            // 创建新记录
            const newData = await ProfitData.create({
              ...item,
              dataSource: 'import',
              status: 1,
              createdBy: req.user.id
            })
            results.push({ index: i, id: newData.id, action: 'created' })
          }
        } catch (error) {
          errors.push({ index: i, error: error.message })
        }
      }

      logger.info(`管理员${req.user.username}批量导入利润数据: 成功${results.length}条，失败${errors.length}条`)

      res.json({
        code: 200,
        data: {
          successCount: results.length,
          errorCount: errors.length,
          results,
          errors
        },
        message: `批量导入完成：成功${results.length}条，失败${errors.length}条`
      })

    } catch (error) {
      logger.error('Batch import profit data error:', error)
      next(error)
    }
  }

  // 获取利润数据统计
  async getProfitDataStatistics(req, res, next) {
    try {
      const { period, businessLineId } = req.query

      const where = { status: 1 }
      
      if (period) {
        where.period = period
      }
      
      if (businessLineId) {
        where.businessLineId = businessLineId
      }

      // 获取基础统计
      const totalData = await ProfitData.findAll({
        where,
        attributes: [
          [sequelize.fn('SUM', sequelize.col('revenue')), 'totalRevenue'],
          [sequelize.fn('SUM', sequelize.col('cost')), 'totalCost'],
          [sequelize.fn('SUM', sequelize.col('profit')), 'totalProfit'],
          [sequelize.fn('AVG', sequelize.col('profit_margin')), 'avgProfitMargin'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'recordCount']
        ],
        raw: true
      })

      // 按业务线统计
      const lineStats = await ProfitData.findAll({
        where,
        include: [
          {
            model: BusinessLine,
            attributes: ['id', 'name', 'code']
          }
        ],
        attributes: [
          'businessLineId',
          [sequelize.fn('SUM', sequelize.col('revenue')), 'revenue'],
          [sequelize.fn('SUM', sequelize.col('cost')), 'cost'],
          [sequelize.fn('SUM', sequelize.col('profit')), 'profit'],
          [sequelize.fn('AVG', sequelize.col('profit_margin')), 'profitMargin'],
          [sequelize.fn('COUNT', sequelize.col('ProfitData.id')), 'recordCount']
        ],
        group: ['businessLineId', 'BusinessLine.id'],
        raw: true
      })

      // 按期间统计
      const periodStats = await ProfitData.findAll({
        where,
        attributes: [
          'period',
          [sequelize.fn('SUM', sequelize.col('revenue')), 'revenue'],
          [sequelize.fn('SUM', sequelize.col('cost')), 'cost'],
          [sequelize.fn('SUM', sequelize.col('profit')), 'profit'],
          [sequelize.fn('AVG', sequelize.col('profit_margin')), 'profitMargin']
        ],
        group: ['period'],
        order: [['period', 'ASC']],
        raw: true
      })

      res.json({
        code: 200,
        data: {
          summary: totalData[0],
          lineStats,
          periodStats
        },
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get profit data statistics error:', error)
      next(error)
    }
  }

  // 获取期间选项
  async getPeriodOptions(req, res, next) {
    try {
      const periods = await ProfitData.findAll({
        attributes: [
          [sequelize.fn('DISTINCT', sequelize.col('period')), 'period']
        ],
        where: { status: 1 },
        order: [['period', 'DESC']],
        raw: true
      })

      res.json({
        code: 200,
        data: periods.map(p => p.period),
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get period options error:', error)
      next(error)
    }
  }
}

module.exports = new ProfitDataController()