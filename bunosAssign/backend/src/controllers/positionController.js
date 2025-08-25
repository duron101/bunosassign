const nedbService = require('../services/nedbService')
const logger = require('../utils/logger')

class PositionController {
  // 获取岗位列表
  async getPositions(req, res, next) {
    try {
      const { 
        page = 1, 
        pageSize = 20, 
        search, 
        businessLineId, 
        status 
      } = req.query

      // 获取所有岗位
      let positions = await nedbService.getPositions()
      
      // 搜索过滤
      if (search) {
        positions = positions.filter(pos => 
          pos.name.toLowerCase().includes(search.toLowerCase()) ||
          pos.code.toLowerCase().includes(search.toLowerCase()) ||
          (pos.description && pos.description.toLowerCase().includes(search.toLowerCase()))
        )
      }

      // 业务线过滤
      if (businessLineId) {
        positions = positions.filter(pos => pos.businessLineId === businessLineId)
      }

      // 状态过滤
      if (status !== undefined) {
        positions = positions.filter(pos => pos.status === parseInt(status))
      }

      // 分页处理
      const total = positions.length
      const offset = (page - 1) * pageSize
      const paginatedPositions = positions.slice(offset, offset + parseInt(pageSize))

      // 获取每个岗位的业务线信息和员工数量
      const positionsWithDetails = await Promise.all(
        paginatedPositions.map(async (position) => {
          let businessLine = null
          if (position.businessLineId) {
            businessLine = await nedbService.getBusinessLineById(position.businessLineId)
          }

          const employeeCount = await nedbService.count('employees', { 
            positionId: position._id,
            status: 1 
          })
          
          return {
            ...position,
            id: position._id, // 兼容前端期望的 id 字段
            businessLine: businessLine ? {
              id: businessLine._id,
              name: businessLine.name,
              code: businessLine.code
            } : null,
            employeeCount
          }
        })
      )

      res.json({
        code: 200,
        data: {
          positions: positionsWithDetails,
          pagination: {
            total: total,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            totalPages: Math.ceil(total / pageSize)
          }
        },
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get positions error:', error)
      next(error)
    }
  }

  // 获取岗位详情
  async getPosition(req, res, next) {
    try {
      const { id } = req.params

      const position = await nedbService.getPositionById(id)

      if (!position) {
        return res.status(404).json({
          code: 404,
          message: '岗位不存在',
          data: null
        })
      }

      // 获取业务线信息
      let businessLine = null
      if (position.businessLineId) {
        businessLine = await nedbService.getBusinessLineById(position.businessLineId)
      }

      // 获取员工数量
      const employeeCount = await nedbService.count('employees', { 
        positionId: position._id,
        status: 1 
      })

      res.json({
        code: 200,
        data: {
          ...position,
          id: position._id,
          businessLine: businessLine ? {
            id: businessLine._id,
            name: businessLine.name,
            code: businessLine.code
          } : null,
          employeeCount
        },
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get position error:', error)
      next(error)
    }
  }

  // 创建岗位
  async createPosition(req, res, next) {
    try {
      const positionData = req.body

      // 检查代码是否已存在
      const existingPosition = await nedbService.findOne('positions', { 
        code: positionData.code 
      })

      if (existingPosition) {
        return res.status(400).json({
          code: 400,
          message: '岗位代码已存在',
          data: null
        })
      }

      // 验证业务线是否存在
      if (positionData.businessLineId) {
        const businessLine = await nedbService.getBusinessLineById(positionData.businessLineId)
        if (!businessLine) {
          return res.status(400).json({
            code: 400,
            message: '指定的业务线不存在',
            data: null
          })
        }
      }

      const newPosition = await nedbService.createPosition(positionData)

      res.status(201).json({
        code: 201,
        data: {
          ...newPosition,
          id: newPosition._id
        },
        message: '创建成功'
      })

    } catch (error) {
      logger.error('Create position error:', error)
      next(error)
    }
  }

  // 更新岗位
  async updatePosition(req, res, next) {
    try {
      const { id } = req.params
      const updateData = req.body

      // 检查岗位是否存在
      const existingPosition = await nedbService.getPositionById(id)
      if (!existingPosition) {
        return res.status(404).json({
          code: 404,
          message: '岗位不存在',
          data: null
        })
      }

      // 如果更新代码，检查是否与其他岗位冲突
      if (updateData.code && updateData.code !== existingPosition.code) {
        const codeExists = await nedbService.findOne('positions', { 
          code: updateData.code,
          _id: { $ne: id }
        })

        if (codeExists) {
          return res.status(400).json({
            code: 400,
            message: '岗位代码已存在',
            data: null
          })
        }
      }

      // 验证业务线是否存在
      if (updateData.businessLineId && updateData.businessLineId !== existingPosition.businessLineId) {
        const businessLine = await nedbService.getBusinessLineById(updateData.businessLineId)
        if (!businessLine) {
          return res.status(400).json({
            code: 400,
            message: '指定的业务线不存在',
            data: null
          })
        }
      }

      const result = await nedbService.updatePosition(id, updateData)

      if (result > 0) {
        const updatedPosition = await nedbService.getPositionById(id)
        res.json({
          code: 200,
          data: {
            ...updatedPosition,
            id: updatedPosition._id
          },
          message: '更新成功'
        })
      } else {
        res.status(400).json({
          code: 400,
          message: '更新失败',
          data: null
        })
      }

    } catch (error) {
      logger.error('Update position error:', error)
      next(error)
    }
  }

  // 删除岗位
  async deletePosition(req, res, next) {
    try {
      const { id } = req.params

      // 检查岗位是否存在
      const existingPosition = await nedbService.getPositionById(id)
      if (!existingPosition) {
        return res.status(404).json({
          code: 404,
          message: '岗位不存在',
          data: null
        })
      }

      // 检查是否有关联的员工
      const employeeCount = await nedbService.count('employees', { 
        positionId: id,
        status: 1 
      })

      if (employeeCount > 0) {
        return res.status(400).json({
          code: 400,
          message: '该岗位下还有员工，无法删除',
          data: null
        })
      }

      const result = await nedbService.deletePosition(id)

      if (result > 0) {
        res.json({
          code: 200,
          message: '删除成功',
          data: null
        })
      } else {
        res.status(400).json({
          code: 400,
          message: '删除失败',
          data: null
        })
      }

    } catch (error) {
      logger.error('Delete position error:', error)
      next(error)
    }
  }

  // 获取岗位统计信息
  async getPositionStats(req, res, next) {
    try {
      const { businessLineId } = req.query

      let query = { status: 1 }
      if (businessLineId) {
        query.businessLineId = businessLineId
      }

      const positions = await nedbService.find('positions', query)
      const employees = await nedbService.find('employees', { status: 1 })

      // 按级别分组统计
      const levelStats = {}
      
      // 初始化所有可能的级别
      const allLevels = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'M1', 'M2', 'M3', 'M4']
      allLevels.forEach(level => {
        levelStats[level] = {
          level,
          positionCount: 0,
          employeeCount: 0,
          avgBenchmarkValue: 0,
          positions: []
        }
      })

      // 统计岗位数量
      positions.forEach(position => {
        const level = position.level
        if (levelStats[level]) {
          levelStats[level].positionCount++
          levelStats[level].positions.push({
            id: position._id,
            name: position.name,
            code: position.code,
            benchmarkValue: position.benchmarkValue || 0
          })
        }
      })

      // 统计员工数量和计算基准值均值
      employees.forEach(employee => {
        if (employee.positionId) {
          const position = positions.find(p => p._id === employee.positionId)
          if (position && levelStats[position.level]) {
            levelStats[position.level].employeeCount++
          }
        }
      })

      // 计算每个级别的基准值均值
      Object.values(levelStats).forEach(levelStat => {
        if (levelStat.positions.length > 0) {
          const totalBenchmark = levelStat.positions.reduce((sum, pos) => sum + (pos.benchmarkValue || 0), 0)
          levelStat.avgBenchmarkValue = totalBenchmark / levelStat.positions.length
        }
      })

      // 转换为数组并排序
      const result = Object.values(levelStats)
        .sort((a, b) => {
          // 数字级别优先，然后按字母排序
          const aNum = parseInt(a.level)
          const bNum = parseInt(b.level)
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum
          }
          if (!isNaN(aNum)) return -1
          if (!isNaN(bNum)) return 1
          return a.level.localeCompare(b.level)
        })

      res.json({
        code: 200,
        data: result,
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get position stats error:', error)
      next(error)
    }
  }

  // 获取岗位级别统计
  async getLevelStatistics(req, res, next) {
    try {
      const { businessLineId } = req.query

      let query = { status: 1 }
      if (businessLineId) {
        query.businessLineId = businessLineId
      }

      const positions = await nedbService.find('positions', query)

      // 按级别分组统计
      const levelStats = {}
      positions.forEach(position => {
        const level = position.level || '未知'
        if (!levelStats[level]) {
          levelStats[level] = {
            level,
            count: 0,
            positions: []
          }
        }
        levelStats[level].count++
        levelStats[level].positions.push({
          id: position._id,
          name: position.name,
          code: position.code,
          benchmarkValue: position.benchmarkValue || 0
        })
      })

      // 转换为数组并排序
      const result = Object.values(levelStats)
        .sort((a, b) => {
          // 数字级别优先，然后按字母排序
          const aNum = parseInt(a.level)
          const bNum = parseInt(b.level)
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum
          }
          if (!isNaN(aNum)) return -1
          if (!isNaN(bNum)) return 1
          return a.level.localeCompare(b.level)
        })

      res.json({
        code: 200,
        data: result,
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get level statistics error:', error)
      next(error)
    }
  }

  // 批量操作岗位
  async batchPositions(req, res, next) {
    try {
      const { action, positionIds } = req.body

      if (!action || !Array.isArray(positionIds) || positionIds.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '请提供有效的操作类型和岗位ID列表',
          data: null
        })
      }

      const status = action === 'enable' ? 1 : 0
      const results = []
      const errors = []

      for (const positionId of positionIds) {
        try {
          const result = await nedbService.updatePosition(positionId, { status })
          
          if (result > 0) {
            results.push({ id: positionId, success: true })
          } else {
            errors.push({ id: positionId, error: '操作失败' })
          }
        } catch (error) {
          errors.push({ id: positionId, error: error.message })
        }
      }

      res.json({
        code: 200,
        data: {
          action,
          success: results.length,
          failed: errors.length,
          results,
          errors
        },
        message: `批量${action === 'enable' ? '启用' : '禁用'}完成，成功${results.length}个，失败${errors.length}个`
      })

    } catch (error) {
      logger.error('Batch positions operation error:', error)
      next(error)
    }
  }

  // 获取岗位级别选项
  async getLevelOptions(req, res, next) {
    try {
      const { businessLineId } = req.query

      let query = { status: 1 }
      if (businessLineId) {
        query.businessLineId = businessLineId
      }

      const positions = await nedbService.find('positions', query)

      // 提取唯一的级别选项
      const levelOptions = [...new Set(positions.map(p => p.level).filter(Boolean))]
        .sort((a, b) => {
          // 数字级别优先，然后按字母排序
          const aNum = parseInt(a)
          const bNum = parseInt(b)
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum
          }
          if (!isNaN(aNum)) return -1
          if (!isNaN(bNum)) return 1
          return a.localeCompare(b)
        })
        .map(level => ({
          value: level,
          label: `级别 ${level}`
        }))

      res.json({
        code: 200,
        data: levelOptions,
        message: '获取成功'
      })

    } catch (error) {
      logger.error('Get level options error:', error)
      next(error)
    }
  }

  // 批量更新岗位基准值
  async batchUpdateBenchmarkValues(req, res, next) {
    try {
      const { positions } = req.body
      
      console.log('🔍 接收到的基准值更新请求:', req.body)

      if (!Array.isArray(positions) || positions.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '请提供有效的岗位数据',
          data: null
        })
      }

      // 验证数据完整性
      for (const pos of positions) {
        if (!pos.id || pos.benchmarkValue === undefined || pos.benchmarkValue === null) {
          return res.status(400).json({
            code: 400,
            message: `岗位数据不完整: ${JSON.stringify(pos)}`,
            data: null
          })
        }
        
        if (typeof pos.benchmarkValue !== 'number' || pos.benchmarkValue < 0.1 || pos.benchmarkValue > 3.0) {
          return res.status(400).json({
            code: 400,
            message: `基准值无效: ${pos.benchmarkValue}，应在0.1-3.0之间`,
            data: null
          })
        }
      }

      const results = []
      const errors = []

      for (const pos of positions) {
        try {
          const result = await nedbService.updatePosition(pos.id, {
            benchmarkValue: pos.benchmarkValue
          })
          
          if (result > 0) {
            results.push({ id: pos.id, success: true })
          } else {
            errors.push({ id: pos.id, error: '更新失败' })
          }
        } catch (error) {
          errors.push({ id: pos.id, error: error.message })
        }
      }

      res.json({
        code: 200,
        data: {
          success: results.length,
          failed: errors.length,
          results,
          errors
        },
        message: `批量更新完成，成功${results.length}个，失败${errors.length}个`
      })

    } catch (error) {
      logger.error('Batch update benchmark values error:', error)
      next(error)
    }
  }

  // ========== 岗位大全管理方法 ==========

  // 更新岗位要求信息
  async updatePositionRequirements(req, res, next) {
    try {
      const { positionId, requirements } = req.body

      // 检查岗位是否存在
      const position = await nedbService.getPositionById(positionId)
      if (!position) {
        return res.status(404).json({
          code: 404,
          message: '岗位不存在',
          data: null
        })
      }

      // 更新岗位要求
      const updateData = {
        ...requirements,
        updatedAt: new Date()
      }

      const result = await nedbService.updatePosition(positionId, updateData)

      if (result > 0) {
        // 同时更新岗位要求数据库
        await this.updatePositionRequirementsDB(position.code, requirements)

        res.json({
          code: 200,
          data: {
            positionId,
            requirements: updateData
          },
          message: '岗位要求更新成功'
        })
      } else {
        res.status(400).json({
          code: 400,
          message: '岗位要求更新失败',
          data: null
        })
      }

    } catch (error) {
      logger.error('Update position requirements error:', error)
      next(error)
    }
  }

  // 更新岗位职业路径
  async updatePositionCareerPath(req, res, next) {
    try {
      const { positionId, careerPath } = req.body

      // 检查岗位是否存在
      const position = await nedbService.getPositionById(positionId)
      if (!position) {
        return res.status(404).json({
          code: 404,
          message: '岗位不存在',
          data: null
        })
      }

      // 更新职业路径
      const updateData = {
        careerPath,
        updatedAt: new Date()
      }

      const result = await nedbService.updatePosition(positionId, updateData)

      if (result > 0) {
        res.json({
          code: 200,
          data: {
            positionId,
            careerPath: updateData.careerPath
          },
          message: '职业路径更新成功'
        })
      } else {
        res.status(400).json({
          code: 400,
          message: '职业路径更新失败',
          data: null
        })
      }

    } catch (error) {
      logger.error('Update position career path error:', error)
      next(error)
    }
  }

  // 更新岗位核心技能
  async updatePositionSkills(req, res, next) {
    try {
      const { positionId, coreSkills } = req.body

      // 检查岗位是否存在
      const position = await nedbService.getPositionById(positionId)
      if (!position) {
        return res.status(404).json({
          code: 404,
          message: '岗位不存在',
          data: null
        })
      }

      // 更新核心技能
      const updateData = {
        coreSkills,
        updatedAt: new Date()
      }

      const result = await nedbService.updatePosition(positionId, updateData)

      if (result > 0) {
        res.json({
          code: 200,
          data: {
            positionId,
            coreSkills: updateData.coreSkills
          },
          message: '核心技能更新成功'
        })
      } else {
        res.status(400).json({
          code: 400,
          message: '核心技能更新失败',
          data: null
        })
      }

    } catch (error) {
      logger.error('Update position skills error:', error)
      next(error)
    }
  }

  // 导出岗位大全数据
  async exportPositionEncyclopedia(req, res, next) {
    try {
      const { businessLineId, format = 'json' } = req.query

      // 获取岗位数据
      let positions = await nedbService.getPositions()

      // 业务线筛选
      if (businessLineId) {
        positions = positions.filter(pos => pos.businessLineId === businessLineId)
      }

      // 获取业务线信息
      const positionsWithBusinessLine = await Promise.all(
        positions.map(async (position) => {
          let businessLine = null
          if (position.businessLineId) {
            businessLine = await nedbService.getBusinessLineById(position.businessLineId)
          }

          return {
            ...position,
            id: position._id,
            businessLine: businessLine ? {
              id: businessLine._id,
              name: businessLine.name,
              code: businessLine.code
            } : null
          }
        })
      )

      // 根据格式返回数据
      if (format === 'csv') {
        // 返回CSV格式
        res.setHeader('Content-Type', 'text/csv')
        res.setHeader('Content-Disposition', 'attachment; filename="position_encyclopedia.csv"')
        
        const csvData = this.convertToCSV(positionsWithBusinessLine)
        res.send(csvData)
      } else if (format === 'excel') {
        // 返回Excel格式（这里简化为JSON，实际可以集成Excel库）
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.setHeader('Content-Disposition', 'attachment; filename="position_encyclopedia.xlsx"')
        
        res.json({
          code: 200,
          data: positionsWithBusinessLine,
          message: '导出成功（Excel格式暂不支持，返回JSON数据）'
        })
      } else {
        // 默认JSON格式
        res.json({
          code: 200,
          data: positionsWithBusinessLine,
          message: '导出成功'
        })
      }

    } catch (error) {
      logger.error('Export position encyclopedia error:', error)
      next(error)
    }
  }

  // 辅助方法：更新岗位要求数据库
  async updatePositionRequirementsDB(positionCode, requirements) {
    try {
      // 查找岗位要求记录
      const existingRequirement = await nedbService.findOne('position_requirements', { 
        positionCode 
      })

      if (existingRequirement) {
        // 更新现有记录
        await nedbService.update('position_requirements', 
          { _id: existingRequirement._id }, 
          { 
            $set: {
              ...requirements,
              updatedAt: new Date()
            }
          }
        )
      } else {
        // 创建新记录
        await nedbService.insert('position_requirements', {
          positionCode,
          positionName: '', // 这里可以补充岗位名称
          ...requirements,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
    } catch (error) {
      logger.error('Update position requirements DB error:', error)
    }
  }

  // 辅助方法：转换为CSV格式
  convertToCSV(data) {
    if (!data || data.length === 0) return ''

    const headers = ['岗位名称', '岗位代码', '级别', '基准值', '业务线', '核心技能', '发展方向', '描述']
    const rows = data.map(item => [
      item.name || '',
      item.code || '',
      item.level || '',
      item.benchmarkValue || '',
      item.businessLine?.name || '',
      (item.coreSkills || []).join(';'),
      item.careerPath?.nextLevel || '',
      item.description || ''
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    return csvContent
  }

  // ==================== 新增管理功能 ====================

  // 新增岗位
  async createPosition(req, res, next) {
    try {
      const positionData = req.body
      
      // 验证必填字段
      if (!positionData.name || !positionData.code || !positionData.level || !positionData.businessLineId) {
        return res.status(400).json({
          code: 400,
          message: '缺少必填字段',
          data: null
        })
      }

      // 检查岗位代码是否已存在
      const existingPosition = await nedbService.findOne('positions', { code: positionData.code })
      if (existingPosition) {
        return res.status(400).json({
          code: 400,
          message: '岗位代码已存在',
          data: null
        })
      }

      // 创建岗位
      const newPosition = {
        ...positionData,
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = await nedbService.insert('positions', newPosition)
      
      // 记录操作日志
      logger.info(`岗位创建成功 - 用户: ${req.user?.id}, 岗位: ${positionData.name}`)

      res.json({
        code: 200,
        data: {
          position: {
            ...newPosition,
            _id: result._id,
            id: result._id
          }
        },
        message: '岗位创建成功'
      })

    } catch (error) {
      logger.error('Create position error:', error)
      next(error)
    }
  }

  // 删除岗位
  async deletePosition(req, res, next) {
    try {
      const { id } = req.params

      // 检查岗位是否存在
      const position = await nedbService.getPositionById(id)
      if (!position) {
        return res.status(404).json({
          code: 404,
          message: '岗位不存在',
          data: null
        })
      }

      // 检查是否有员工占用该岗位
      const employeeCount = await nedbService.count('employees', { 
        positionId: id,
        status: 1 
      })

      if (employeeCount > 0) {
        return res.status(400).json({
          code: 400,
          message: `该岗位下还有 ${employeeCount} 名员工，无法删除`,
          data: null
        })
      }

      // 软删除岗位
      await nedbService.update('positions', 
        { _id: id }, 
        { 
          $set: { 
            status: 0,
            updatedAt: new Date()
          }
        }
      )

      // 记录操作日志
      logger.info(`岗位删除成功 - 用户: ${req.user?.id}, 岗位: ${position.name}`)

      res.json({
        code: 200,
        data: null,
        message: '岗位删除成功'
      })

    } catch (error) {
      logger.error('Delete position error:', error)
      next(error)
    }
  }

  // 批量更新岗位
  async batchUpdatePositions(req, res, next) {
    try {
      const { positionIds, updateType, updateData } = req.body

      if (!positionIds || !Array.isArray(positionIds) || positionIds.length === 0) {
        return res.status(400).json({
          code: 400,
          message: '请选择要更新的岗位',
          data: null
        })
      }

      if (!updateType || !updateData) {
        return res.status(400).json({
          code: 400,
          message: '缺少更新类型或更新数据',
          data: null
        })
      }

      const results = []
      let successCount = 0
      let failCount = 0

      for (const positionId of positionIds) {
        try {
          let updateFields = {}
          
          switch (updateType) {
            case 'requirements':
              updateFields = {
                description: updateData.requirements,
                updatedAt: new Date()
              }
              break
            case 'skills':
              updateFields = {
                coreSkills: updateData.skills,
                updatedAt: new Date()
              }
              break
            case 'careerPath':
              updateFields = {
                'careerPath.nextLevel': updateData.careerPath.nextLevel,
                'careerPath.estimatedTime': updateData.careerPath.estimatedTime,
                updatedAt: new Date()
              }
              break
            default:
              throw new Error('不支持的更新类型')
          }

          await nedbService.update('positions', 
            { _id: positionId }, 
            { $set: updateFields }
          )

          // 同步更新岗位要求数据库
          const position = await nedbService.getPositionById(positionId)
          if (position && position.code) {
            await this.updatePositionRequirementsDB(position.code, updateFields)
          }

          results.push({
            positionId,
            success: true,
            message: '更新成功'
          })
          successCount++

        } catch (error) {
          logger.error(`批量更新岗位失败 - ID: ${positionId}`, error)
          results.push({
            positionId,
            success: false,
            message: error.message || '更新失败'
          })
          failCount++
        }
      }

      // 记录操作日志
      logger.info(`批量更新岗位完成 - 用户: ${req.user?.id}, 成功: ${successCount}, 失败: ${failCount}`)

      res.json({
        code: 200,
        data: {
          results,
          summary: {
            total: positionIds.length,
            success: successCount,
            fail: failCount
          }
        },
        message: `批量更新完成，成功 ${successCount} 个，失败 ${failCount} 个`
      })

    } catch (error) {
      logger.error('Batch update positions error:', error)
      next(error)
    }
  }
}

module.exports = new PositionController()