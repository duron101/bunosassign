const express = require('express')
const router = express.Router()
const { authenticateToken, authorize } = require('../middlewares/auth')
const positionRequirementsService = require('../services/positionRequirementsService')

// 获取岗位要求信息
router.get('/:positionCode', authenticateToken, async (req, res) => {
  try {
    const { positionCode } = req.params
    
    const requirements = await positionRequirementsService.getRequirementsByPositionCode(positionCode)
    
    if (!requirements) {
      return res.status(404).json({
        code: 404,
        message: '岗位要求信息不存在',
        data: null
      })
    }
    
    res.json({
      code: 200,
      message: '获取成功',
      data: requirements
    })
  } catch (error) {
    console.error('获取岗位要求失败:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
})

// 根据岗位名称获取岗位要求
router.get('/name/:positionName', authenticateToken, async (req, res) => {
  try {
    const { positionName } = req.params
    
    const requirements = await positionRequirementsService.getRequirementsByPositionName(positionName)
    
    if (!requirements) {
      return res.status(404).json({
        code: 404,
        message: '岗位要求信息不存在',
        data: null
      })
    }
    
    res.json({
      code: 200,
      message: '获取成功',
      data: requirements
    })
  } catch (error) {
    console.error('获取岗位要求失败:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
})

// 获取所有岗位要求
router.get('/', authenticateToken, async (req, res) => {
  try {
    const requirements = await positionRequirementsService.getAllRequirements()
    
    res.json({
      code: 200,
      message: '获取成功',
      data: requirements
    })
  } catch (error) {
    console.error('获取所有岗位要求失败:', error)
    res.status(500).json({
      code: 500,
      message: '服务器内部错误',
      data: null
    })
  }
})

module.exports = router
