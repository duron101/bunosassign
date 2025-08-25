const express = require('express')
const router = express.Router()
const projectMemberController = require('../controllers/projectMemberController')
const { authenticateToken, authorize } = require('../middlewares/auth')

// 员工相关接口
router.post('/apply', authenticateToken, projectMemberController.applyToJoinProject) // 申请加入项目
router.get('/my-projects', authenticateToken, projectMemberController.getEmployeeProjects) // 获取我参与的项目

// 项目经理相关接口
router.get('/pending-applications', authenticateToken, projectMemberController.getPendingApplications) // 获取待审批申请
router.get('/applications', authenticateToken, projectMemberController.getPendingApplications) // 获取项目申请列表（兼容前端）
router.put('/approve/:memberId', authenticateToken, projectMemberController.approveMemberApplication) // 审批申请
router.post('/batch-approve', authenticateToken, projectMemberController.batchApproveApplications) // 批量审批

// 项目成员管理
router.get('/project/:projectId', authenticateToken, projectMemberController.getProjectMembers) // 获取项目成员
router.put('/role/:memberId', authenticateToken, projectMemberController.updateMemberRole) // 更新成员角色
router.delete('/:memberId', authenticateToken, projectMemberController.removeProjectMember) // 移除成员

// 项目角色管理
router.get('/roles', authenticateToken, projectMemberController.getProjectRoles) // 获取项目角色列表

module.exports = router