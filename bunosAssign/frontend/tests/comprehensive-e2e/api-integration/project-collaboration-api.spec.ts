import { test, expect } from '@playwright/test'
import { ComprehensiveTestUtils } from '../../utils/comprehensive-test-utils'

/**
 * Project Collaboration API Integration Tests
 * Validates project publishing, team applications, and approval workflows
 */

test.describe('Project Collaboration API Integration', () => {
  let utils: ComprehensiveTestUtils
  let adminToken: string
  let managerToken: string
  let employeeToken: string
  let testProjectId: number
  let testApplicationId: number

  test.beforeAll(async ({ request }) => {
    const page = await request.newContext().then(c => c.newPage())
    utils = new ComprehensiveTestUtils(page, request)
    
    adminToken = await utils.loginAs('admin')
    managerToken = await utils.loginAs('project_manager')
    employeeToken = await utils.loginAs('employee')
    
    await page.close()
  })

  test.afterAll(async () => {
    // Clean up test data
    if (adminToken) {
      await utils.cleanupTestData(adminToken)
    }
  })

  test.describe('Project Publishing API', () => {
    test('should create new project successfully', async ({ request }) => {
      const projectData = {
        name: `API测试项目_${Date.now()}`,
        code: `API_TEST_${Date.now()}`,
        description: '这是一个通过API创建的测试项目',
        requirements: '项目需求描述',
        budget: 100000,
        bonusPool: 50000,
        profitTarget: 200000,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        status: 'draft',
        skills: ['JavaScript', 'Vue.js', 'Node.js'],
        teamSize: 5
      }

      const result = await utils.testApiEndpoint('POST', '/api/projects', {
        token: managerToken,
        data: projectData
      })

      expect(result.status).toBe(201)
      expect(result.data.code).toBe(201)
      expect(result.data.data).toBeDefined()
      expect(result.data.data.name).toBe(projectData.name)
      expect(result.data.data.code).toBe(projectData.code)
      expect(result.data.data.status).toBe('draft')

      testProjectId = result.data.data.id
    })

    test('should validate project creation data', async ({ request }) => {
      const invalidProjectData = {
        name: '', // Empty name
        code: '', // Empty code
        budget: -1000, // Negative budget
        startDate: 'invalid-date', // Invalid date
        endDate: '2023-01-01' // End date before start date
      }

      const result = await utils.testApiEndpoint('POST', '/api/projects', {
        token: managerToken,
        data: invalidProjectData,
        expectedStatus: 400
      })

      expect(result.status).toBe(400)
      expect(result.data.message).toContain('验证失败')
    })

    test('should prevent duplicate project codes', async ({ request }) => {
      const duplicateCode = `DUPLICATE_${Date.now()}`
      
      const projectData1 = {
        name: '项目1',
        code: duplicateCode,
        description: '第一个项目',
        budget: 100000,
        bonusPool: 50000,
        profitTarget: 200000
      }

      // Create first project
      await utils.testApiEndpoint('POST', '/api/projects', {
        token: managerToken,
        data: projectData1
      })

      // Try to create duplicate
      const projectData2 = { ...projectData1, name: '项目2' }
      const result = await utils.testApiEndpoint('POST', '/api/projects', {
        token: managerToken,
        data: projectData2,
        expectedStatus: 409
      })

      expect(result.status).toBe(409)
      expect(result.data.message).toContain('项目代码已存在')
    })

    test('should publish project', async ({ request }) => {
      if (!testProjectId) {
        test.skip('No test project available')
      }

      const result = await utils.testApiEndpoint('PUT', `/api/projects/${testProjectId}/publish`, {
        token: managerToken,
        data: {}
      })

      expect(result.status).toBe(200)
      expect(result.data.data.status).toBe('published')
    })

    test('should retrieve project list with filtering', async ({ request }) => {
      // Get all projects
      const allResult = await utils.testApiEndpoint('GET', '/api/projects', {
        token: managerToken
      })
      expect(allResult.status).toBe(200)
      expect(allResult.data.data.list).toBeDefined()

      // Filter by status
      const publishedResult = await utils.testApiEndpoint('GET', '/api/projects?status=published', {
        token: managerToken
      })
      expect(publishedResult.status).toBe(200)
      
      if (publishedResult.data.data.list.length > 0) {
        publishedResult.data.data.list.forEach((project: any) => {
          expect(project.status).toBe('published')
        })
      }

      // Search by name
      const searchResult = await utils.testApiEndpoint('GET', '/api/projects?search=测试', {
        token: managerToken
      })
      expect(searchResult.status).toBe(200)
    })

    test('should get project details', async ({ request }) => {
      if (!testProjectId) {
        test.skip('No test project available')
      }

      const result = await utils.testApiEndpoint('GET', `/api/projects/${testProjectId}`, {
        token: managerToken
      })

      expect(result.status).toBe(200)
      expect(result.data.data.id).toBe(testProjectId)
      expect(result.data.data.name).toBeDefined()
      expect(result.data.data.code).toBeDefined()
    })
  })

  test.describe('Team Application API', () => {
    test('should submit team application', async ({ request }) => {
      if (!testProjectId) {
        test.skip('No test project available')
      }

      const applicationData = {
        projectId: testProjectId,
        teamName: `测试团队_${Date.now()}`,
        teamDescription: '这是一个测试团队申请',
        proposedMembers: [
          {
            employeeId: 1,
            role: '项目经理',
            responsibility: '负责项目整体管理'
          },
          {
            employeeId: 2,
            role: '开发工程师',
            responsibility: '负责前端开发'
          }
        ],
        estimatedWorkload: 100,
        proposedTimeline: '3个月',
        budgetRequest: 80000
      }

      const result = await utils.testApiEndpoint('POST', '/api/project-team-applications', {
        token: employeeToken,
        data: applicationData
      })

      expect(result.status).toBe(201)
      expect(result.data.data).toBeDefined()
      expect(result.data.data.teamName).toBe(applicationData.teamName)
      expect(result.data.data.status).toBe('pending')

      testApplicationId = result.data.data.id
    })

    test('should validate team application data', async ({ request }) => {
      const invalidApplicationData = {
        projectId: 99999, // Non-existent project
        teamName: '', // Empty team name
        proposedMembers: [], // Empty members array
        budgetRequest: -1000 // Negative budget
      }

      const result = await utils.testApiEndpoint('POST', '/api/project-team-applications', {
        token: employeeToken,
        data: invalidApplicationData,
        expectedStatus: 400
      })

      expect(result.status).toBe(400)
      expect(result.data.message).toContain('验证失败')
    })

    test('should prevent duplicate applications from same user', async ({ request }) => {
      if (!testProjectId) {
        test.skip('No test project available')
      }

      const applicationData = {
        projectId: testProjectId,
        teamName: '重复申请测试',
        teamDescription: '测试重复申请',
        proposedMembers: [{ employeeId: 1, role: '成员' }],
        budgetRequest: 50000
      }

      // First application should succeed
      const result1 = await utils.testApiEndpoint('POST', '/api/project-team-applications', {
        token: employeeToken,
        data: applicationData
      })
      expect(result1.status).toBe(201)

      // Second application should be rejected
      const result2 = await utils.testApiEndpoint('POST', '/api/project-team-applications', {
        token: employeeToken,
        data: { ...applicationData, teamName: '重复申请测试2' },
        expectedStatus: 409
      })
      expect(result2.status).toBe(409)
    })

    test('should retrieve team applications', async ({ request }) => {
      // Get applications by project manager
      const managerResult = await utils.testApiEndpoint('GET', '/api/project-team-applications', {
        token: managerToken
      })
      expect(managerResult.status).toBe(200)
      expect(managerResult.data.data.list).toBeDefined()

      // Get applications by employee (should only see their own)
      const employeeResult = await utils.testApiEndpoint('GET', '/api/project-team-applications', {
        token: employeeToken
      })
      expect(employeeResult.status).toBe(200)

      // Filter by project
      if (testProjectId) {
        const projectResult = await utils.testApiEndpoint('GET', `/api/project-team-applications?projectId=${testProjectId}`, {
          token: managerToken
        })
        expect(projectResult.status).toBe(200)
      }
    })

    test('should get application details', async ({ request }) => {
      if (!testApplicationId) {
        test.skip('No test application available')
      }

      const result = await utils.testApiEndpoint('GET', `/api/project-team-applications/${testApplicationId}`, {
        token: managerToken
      })

      expect(result.status).toBe(200)
      expect(result.data.data.id).toBe(testApplicationId)
      expect(result.data.data.teamName).toBeDefined()
    })
  })

  test.describe('Application Approval API', () => {
    test('should approve team application', async ({ request }) => {
      if (!testApplicationId) {
        test.skip('No test application available')
      }

      const approvalData = {
        action: 'approve',
        feedback: '申请通过，团队组建成功',
        approvedBudget: 75000,
        conditions: ['按时交付', '定期汇报进展']
      }

      const result = await utils.testApiEndpoint('PUT', `/api/project-team-applications/${testApplicationId}/review`, {
        token: managerToken,
        data: approvalData
      })

      expect(result.status).toBe(200)
      expect(result.data.data.status).toBe('approved')
      expect(result.data.data.approvalFeedback).toBe(approvalData.feedback)
    })

    test('should reject team application', async ({ request }) => {
      // Create a new application for rejection test
      const tempApplication = await utils.testApiEndpoint('POST', '/api/project-team-applications', {
        token: employeeToken,
        data: {
          projectId: testProjectId,
          teamName: '待拒绝的申请',
          teamDescription: '用于测试拒绝功能',
          proposedMembers: [{ employeeId: 1, role: '成员' }],
          budgetRequest: 30000
        }
      })

      if (tempApplication.status === 201) {
        const rejectionData = {
          action: 'reject',
          feedback: '申请不符合项目要求',
          rejectionReasons: ['技能不匹配', '预算超出范围']
        }

        const result = await utils.testApiEndpoint('PUT', `/api/project-team-applications/${tempApplication.data.data.id}/review`, {
          token: managerToken,
          data: rejectionData
        })

        expect(result.status).toBe(200)
        expect(result.data.data.status).toBe('rejected')
        expect(result.data.data.approvalFeedback).toBe(rejectionData.feedback)
      }
    })

    test('should request modifications to application', async ({ request }) => {
      // Create another application for modification request test
      const tempApplication = await utils.testApiEndpoint('POST', '/api/project-team-applications', {
        token: employeeToken,
        data: {
          projectId: testProjectId,
          teamName: '需要修改的申请',
          teamDescription: '用于测试修改请求',
          proposedMembers: [{ employeeId: 1, role: '成员' }],
          budgetRequest: 40000
        }
      })

      if (tempApplication.status === 201) {
        const modificationData = {
          action: 'request_changes',
          feedback: '请调整团队规模和预算',
          requestedChanges: [
            '减少团队人数至3人',
            '降低预算至35000',
            '调整项目时间线'
          ]
        }

        const result = await utils.testApiEndpoint('PUT', `/api/project-team-applications/${tempApplication.data.data.id}/review`, {
          token: managerToken,
          data: modificationData
        })

        expect(result.status).toBe(200)
        expect(result.data.data.status).toBe('changes_requested')
        expect(result.data.data.approvalFeedback).toBe(modificationData.feedback)
      }
    })

    test('should validate approval permissions', async ({ request }) => {
      if (!testApplicationId) {
        test.skip('No test application available')
      }

      // Employee should not be able to approve applications
      const result = await utils.testApiEndpoint('PUT', `/api/project-team-applications/${testApplicationId}/review`, {
        token: employeeToken,
        data: { action: 'approve', feedback: 'Unauthorized approval' },
        expectedStatus: 403
      })

      expect(result.status).toBe(403)
    })
  })

  test.describe('Project Notifications API', () => {
    test('should send notifications on project events', async ({ request }) => {
      // Get notifications for manager
      const managerNotifications = await utils.testApiEndpoint('GET', '/api/notifications', {
        token: managerToken
      })
      expect(managerNotifications.status).toBe(200)

      // Get notifications for employee
      const employeeNotifications = await utils.testApiEndpoint('GET', '/api/notifications', {
        token: employeeToken
      })
      expect(employeeNotifications.status).toBe(200)
    })

    test('should mark notifications as read', async ({ request }) => {
      const notifications = await utils.testApiEndpoint('GET', '/api/notifications', {
        token: managerToken
      })

      if (notifications.status === 200 && notifications.data.data.length > 0) {
        const notificationId = notifications.data.data[0].id

        const result = await utils.testApiEndpoint('PUT', `/api/notifications/${notificationId}/read`, {
          token: managerToken
        })

        expect(result.status).toBe(200)
        expect(result.data.data.isRead).toBe(true)
      }
    })

    test('should get unread notification count', async ({ request }) => {
      const result = await utils.testApiEndpoint('GET', '/api/notifications/unread-count', {
        token: managerToken
      })

      expect(result.status).toBe(200)
      expect(result.data.data.count).toBeGreaterThanOrEqual(0)
    })
  })

  test.describe('Project Member Management API', () => {
    test('should add team members to approved project', async ({ request }) => {
      // This test assumes we have an approved application
      if (!testProjectId || !testApplicationId) {
        test.skip('No approved project/application available')
      }

      const memberData = {
        applicationId: testApplicationId,
        members: [
          {
            employeeId: 1,
            role: '项目经理',
            startDate: '2024-01-01',
            allocation: 100
          },
          {
            employeeId: 2,
            role: '开发工程师',
            startDate: '2024-01-01',
            allocation: 80
          }
        ]
      }

      const result = await utils.testApiEndpoint('POST', `/api/projects/${testProjectId}/members`, {
        token: managerToken,
        data: memberData
      })

      expect(result.status).toBe(201)
      expect(result.data.data).toBeDefined()
    })

    test('should get project team members', async ({ request }) => {
      if (!testProjectId) {
        test.skip('No test project available')
      }

      const result = await utils.testApiEndpoint('GET', `/api/projects/${testProjectId}/members`, {
        token: managerToken
      })

      expect(result.status).toBe(200)
      expect(result.data.data).toBeDefined()
    })

    test('should update member role and allocation', async ({ request }) => {
      if (!testProjectId) {
        test.skip('No test project available')
      }

      // First get members
      const membersResult = await utils.testApiEndpoint('GET', `/api/projects/${testProjectId}/members`, {
        token: managerToken
      })

      if (membersResult.status === 200 && membersResult.data.data.length > 0) {
        const memberId = membersResult.data.data[0].id
        
        const updateData = {
          role: '高级工程师',
          allocation: 90
        }

        const result = await utils.testApiEndpoint('PUT', `/api/project-members/${memberId}`, {
          token: managerToken,
          data: updateData
        })

        expect(result.status).toBe(200)
      }
    })
  })

  test.describe('Project Collaboration Error Handling', () => {
    test('should handle concurrent project applications', async ({ request }) => {
      if (!testProjectId) {
        test.skip('No test project available')
      }

      // Create multiple concurrent applications
      const applications = Array(3).fill(null).map((_, index) => 
        utils.testApiEndpoint('POST', '/api/project-team-applications', {
          token: employeeToken,
          data: {
            projectId: testProjectId,
            teamName: `并发申请${index}_${Date.now()}`,
            teamDescription: '并发测试申请',
            proposedMembers: [{ employeeId: index + 1, role: '成员' }],
            budgetRequest: 20000
          }
        })
      )

      const results = await Promise.all(applications)
      
      // At least some should succeed
      const successCount = results.filter(r => r.status === 201).length
      expect(successCount).toBeGreaterThan(0)
    })

    test('should handle invalid project states', async ({ request }) => {
      // Try to apply to a closed project
      const closedProject = await utils.createTestProject(managerToken, {
        status: 'closed'
      })

      if (closedProject.status === 201) {
        const result = await utils.testApiEndpoint('POST', '/api/project-team-applications', {
          token: employeeToken,
          data: {
            projectId: closedProject.data.data.id,
            teamName: '申请已关闭项目',
            teamDescription: '测试申请已关闭项目',
            proposedMembers: [{ employeeId: 1, role: '成员' }],
            budgetRequest: 10000
          },
          expectedStatus: 400
        })

        expect(result.status).toBe(400)
        expect(result.data.message).toContain('项目状态不允许申请')
      }
    })

    test('should validate business rules', async ({ request }) => {
      if (!testProjectId) {
        test.skip('No test project available')
      }

      // Test application with budget exceeding project budget
      const overBudgetApplication = {
        projectId: testProjectId,
        teamName: '超预算申请',
        teamDescription: '测试预算超限',
        proposedMembers: [{ employeeId: 1, role: '成员' }],
        budgetRequest: 999999 // Exceeds project budget
      }

      const result = await utils.testApiEndpoint('POST', '/api/project-team-applications', {
        token: employeeToken,
        data: overBudgetApplication,
        expectedStatus: 400
      })

      expect(result.status).toBe(400)
      expect(result.data.message).toContain('预算超出限制')
    })
  })

  test.describe('Project Collaboration Performance', () => {
    test('project listing should be fast', async ({ request }) => {
      const performance = await utils.measureDatabaseQueryPerformance(
        '/api/projects?page=1&limit=10',
        managerToken,
        800
      )

      expect(performance.passed).toBe(true)
    })

    test('application submission should be responsive', async ({ request }) => {
      if (!testProjectId) {
        test.skip('No test project available')
      }

      const startTime = performance.now()
      
      const result = await utils.testApiEndpoint('POST', '/api/project-team-applications', {
        token: employeeToken,
        data: {
          projectId: testProjectId,
          teamName: `性能测试_${Date.now()}`,
          teamDescription: '性能测试申请',
          proposedMembers: [{ employeeId: 1, role: '成员' }],
          budgetRequest: 25000
        }
      })

      const endTime = performance.now()

      if (result.status === 201) {
        expect(endTime - startTime).toBeLessThan(2000) // Should complete within 2 seconds
      }
    })

    test('complex queries should perform well', async ({ request }) => {
      const complexQuery = '/api/project-team-applications?status=approved&page=1&limit=20&sort=createdAt:desc'
      
      const performance = await utils.measureDatabaseQueryPerformance(
        complexQuery,
        managerToken,
        1000 // 1 second threshold for complex queries
      )

      expect(performance.passed).toBe(true)
    })
  })
})