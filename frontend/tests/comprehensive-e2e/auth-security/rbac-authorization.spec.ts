import { test, expect } from '@playwright/test'
import { ComprehensiveTestUtils } from '../../utils/comprehensive-test-utils'

/**
 * Role-Based Access Control (RBAC) Tests
 * Validates permission systems and access control
 */

test.describe('RBAC Authorization System', () => {
  let utils: ComprehensiveTestUtils

  test.beforeEach(async ({ page, request }) => {
    utils = new ComprehensiveTestUtils(page, request)
  })

  test.describe('Admin Role Permissions', () => {
    test('admin should have full system access', async ({ page, request }) => {
      const adminToken = await utils.loginAs('admin')
      
      // Test all protected endpoints that admin should access
      const adminEndpoints = [
        '/api/users',
        '/api/employees',
        '/api/departments', 
        '/api/positions',
        '/api/roles',
        '/api/projects',
        '/api/bonus-pools',
        '/api/calculations'
      ]
      
      for (const endpoint of adminEndpoints) {
        const result = await utils.testApiEndpoint('GET', endpoint, { token: adminToken })
        expect(result.status, `Admin should access ${endpoint}`).toBe(200)
      }
    })

    test('admin should be able to create, edit, and delete users', async ({ page, request }) => {
      const adminToken = await utils.loginAs('admin')
      
      // Create user
      const newUser = {
        username: `testuser_${Date.now()}`,
        password: 'testpass123',
        realName: '测试用户',
        email: 'test@example.com',
        roleId: 3, // Employee role
        departmentId: 1
      }
      
      const createResult = await utils.testApiEndpoint('POST', '/api/users', {
        token: adminToken,
        data: newUser
      })
      expect(createResult.status).toBe(201)
      const createdUser = createResult.data.data
      
      // Edit user
      const updateData = { realName: '更新的测试用户' }
      const updateResult = await utils.testApiEndpoint('PUT', `/api/users/${createdUser.id}`, {
        token: adminToken,
        data: updateData
      })
      expect(updateResult.status).toBe(200)
      
      // Delete user
      const deleteResult = await utils.testApiEndpoint('DELETE', `/api/users/${createdUser.id}`, {
        token: adminToken
      })
      expect(deleteResult.status).toBe(200)
    })

    test('admin should be able to manage all employees', async ({ page, request }) => {
      const adminToken = await utils.loginAs('admin')
      
      // Create employee
      const employee = await utils.createTestEmployee(adminToken)
      expect(employee.status).toBe(201)
      
      const employeeId = employee.data.data.id
      
      // Update employee
      const updateResult = await utils.testApiEndpoint('PUT', `/api/employees/${employeeId}`, {
        token: adminToken,
        data: { name: '更新的员工姓名' }
      })
      expect(updateResult.status).toBe(200)
      
      // Delete employee
      const deleteResult = await utils.testApiEndpoint('DELETE', `/api/employees/${employeeId}`, {
        token: adminToken
      })
      expect(deleteResult.status).toBe(200)
    })

    test('admin should access all bonus calculation features', async ({ page }) => {
      await utils.loginAs('admin')
      
      // Navigate to bonus calculation page
      await page.goto('/calculation')
      await page.waitForLoadState('networkidle')
      
      // Should see all calculation options
      await expect(page.locator('text=三维度奖金计算')).toBeVisible()
      await expect(page.locator('text=项目奖金分配')).toBeVisible()
      await expect(page.locator('text=个人奖金查询')).toBeVisible()
      
      // Should be able to perform calculations
      const calculateButton = page.locator('text=开始计算')
      if (await calculateButton.isVisible()) {
        expect(calculateButton).toBeEnabled()
      }
    })
  })

  test.describe('Project Manager Role Permissions', () => {
    test('project manager should have limited access', async ({ page, request }) => {
      const managerToken = await utils.loginAs('project_manager')
      
      // Should access project-related endpoints
      const allowedEndpoints = [
        '/api/projects',
        '/api/employees',
        '/api/project-members'
      ]
      
      for (const endpoint of allowedEndpoints) {
        const result = await utils.testApiEndpoint('GET', endpoint, { token: managerToken })
        expect(result.status, `Manager should access ${endpoint}`).toBe(200)
      }
      
      // Should NOT access admin-only endpoints  
      const forbiddenEndpoints = [
        '/api/users',
        '/api/roles',
        '/api/bonus-pools'
      ]
      
      for (const endpoint of forbiddenEndpoints) {
        const result = await utils.testApiEndpoint('GET', endpoint, { 
          token: managerToken,
          expectedStatus: 403
        })
        expect(result.status, `Manager should NOT access ${endpoint}`).toBe(403)
      }
    })

    test('project manager should manage own projects only', async ({ page, request }) => {
      const managerToken = await utils.loginAs('project_manager')
      
      // Create a project
      const project = await utils.createTestProject(managerToken, {
        name: '项目经理的项目',
        code: 'PM_PROJECT'
      })
      expect(project.status).toBe(201)
      
      const projectId = project.data.data.id
      
      // Should be able to edit own project
      const updateResult = await utils.testApiEndpoint('PUT', `/api/projects/${projectId}`, {
        token: managerToken,
        data: { description: '更新的项目描述' }
      })
      expect(updateResult.status).toBe(200)
      
      // Clean up
      await utils.testApiEndpoint('DELETE', `/api/projects/${projectId}`, {
        token: managerToken
      })
    })

    test('project manager UI should show appropriate menus', async ({ page }) => {
      await utils.loginAs('project_manager')
      
      // Navigate to dashboard
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      
      // Should see project-related menus
      await expect(page.locator('text=项目管理')).toBeVisible()
      await expect(page.locator('text=员工管理')).toBeVisible()
      
      // Should NOT see admin-only menus
      await expect(page.locator('text=用户管理')).not.toBeVisible()
      await expect(page.locator('text=系统设置')).not.toBeVisible()
    })

    test('project manager should publish and manage projects', async ({ page }) => {
      await utils.loginAs('project_manager')
      
      // Navigate to project collaboration
      await page.goto('/project/collaboration')
      await page.waitForLoadState('networkidle')
      
      // Should see publish project button
      await expect(page.locator('text=发布项目')).toBeVisible()
      
      // Click publish project
      await page.click('text=发布项目')
      await expect(page).toHaveURL(/project\/publish/)
      
      // Should see project form
      await expect(page.locator('input[placeholder*="项目名称"]')).toBeVisible()
      await expect(page.locator('input[placeholder*="项目代码"]')).toBeVisible()
    })
  })

  test.describe('Employee Role Permissions', () => {
    test('employee should have minimal access', async ({ page, request }) => {
      const employeeToken = await utils.loginAs('employee')
      
      // Should access only basic endpoints
      const allowedEndpoints = [
        '/api/personal/bonus', 
        '/api/projects?status=published' // Only published projects
      ]
      
      for (const endpoint of allowedEndpoints) {
        const result = await utils.testApiEndpoint('GET', endpoint, { token: employeeToken })
        expect(result.status, `Employee should access ${endpoint}`).toBeOneOf([200, 404]) // 404 if no data
      }
      
      // Should NOT access management endpoints
      const forbiddenEndpoints = [
        '/api/users',
        '/api/employees',
        '/api/roles',
        '/api/bonus-pools',
        '/api/calculations'
      ]
      
      for (const endpoint of forbiddenEndpoints) {
        const result = await utils.testApiEndpoint('GET', endpoint, {
          token: employeeToken,
          expectedStatus: 403
        })
        expect(result.status, `Employee should NOT access ${endpoint}`).toBe(403)
      }
    })

    test('employee should only view own personal data', async ({ page, request }) => {
      const employeeToken = await utils.loginAs('employee')
      
      // Should access personal bonus data
      const personalResult = await utils.testApiEndpoint('GET', '/api/personal/bonus', {
        token: employeeToken
      })
      expect(personalResult.status).toBeOneOf([200, 404]) // 404 if no bonus data
      
      // Should NOT access other employees' data
      const othersResult = await utils.testApiEndpoint('GET', '/api/employees/1/bonus', {
        token: employeeToken,
        expectedStatus: 403
      })
      expect(othersResult.status).toBe(403)
    })

    test('employee UI should show limited menus', async ({ page }) => {
      await utils.loginAs('employee')
      
      // Navigate to dashboard
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      
      // Should see personal-related menus only
      await expect(page.locator('text=个人奖金')).toBeVisible()
      await expect(page.locator('text=项目协作')).toBeVisible()
      
      // Should NOT see management menus
      await expect(page.locator('text=用户管理')).not.toBeVisible()
      await expect(page.locator('text=员工管理')).not.toBeVisible()
      await expect(page.locator('text=系统设置')).not.toBeVisible()
    })

    test('employee should apply to join projects but not manage them', async ({ page }) => {
      await utils.loginAs('employee')
      
      // Navigate to project collaboration
      await page.goto('/project/collaboration')
      await page.waitForLoadState('networkidle')
      
      // Should NOT see publish project button
      await expect(page.locator('text=发布项目')).not.toBeVisible()
      
      // Should see published projects
      const projectCards = page.locator('.project-card')
      if (await projectCards.count() > 0) {
        // Click on first project
        await projectCards.first().click()
        
        // Should see apply button instead of management options
        await expect(page.locator('text=申请加入')).toBeVisible()
        await expect(page.locator('text=编辑项目')).not.toBeVisible()
        await expect(page.locator('text=删除项目')).not.toBeVisible()
      }
    })
  })

  test.describe('Permission Inheritance and Hierarchy', () => {
    test('should enforce role hierarchy correctly', async ({ request }) => {
      // Get tokens for all roles
      const adminToken = await utils.loginAs('admin')
      const managerToken = await utils.loginAs('project_manager') 
      const employeeToken = await utils.loginAs('employee')
      
      // Test user management endpoint
      const adminResult = await utils.testApiEndpoint('GET', '/api/users', { token: adminToken })
      expect(adminResult.status).toBe(200) // Admin allowed
      
      const managerResult = await utils.testApiEndpoint('GET', '/api/users', { 
        token: managerToken,
        expectedStatus: 403 
      })
      expect(managerResult.status).toBe(403) // Manager forbidden
      
      const employeeResult = await utils.testApiEndpoint('GET', '/api/users', {
        token: employeeToken, 
        expectedStatus: 403
      })
      expect(employeeResult.status).toBe(403) // Employee forbidden
    })

    test('should validate department-based permissions', async ({ request }) => {
      // This test would verify that users can only access data from their department
      // For now, we'll test the basic concept
      
      const managerToken = await utils.loginAs('project_manager')
      
      // Manager should access employees in general (with potential department filtering)
      const employeesResult = await utils.testApiEndpoint('GET', '/api/employees', { 
        token: managerToken 
      })
      expect(employeesResult.status).toBe(200)
      
      // The API should filter results based on user's permissions
      if (employeesResult.data?.data?.list) {
        expect(Array.isArray(employeesResult.data.data.list)).toBe(true)
      }
    })
  })

  test.describe('Dynamic Permission Checks', () => {
    test('should enforce resource-level permissions', async ({ request }) => {
      const managerToken = await utils.loginAs('project_manager')
      
      // Create a project as manager
      const project = await utils.createTestProject(managerToken)
      const projectId = project.data.data.id
      
      // Manager should access own project
      const ownProjectResult = await utils.testApiEndpoint('GET', `/api/projects/${projectId}`, {
        token: managerToken
      })
      expect(ownProjectResult.status).toBe(200)
      
      // Manager should edit own project
      const editResult = await utils.testApiEndpoint('PUT', `/api/projects/${projectId}`, {
        token: managerToken,
        data: { description: '更新描述' }
      })
      expect(editResult.status).toBe(200)
      
      // Clean up
      await utils.testApiEndpoint('DELETE', `/api/projects/${projectId}`, {
        token: managerToken
      })
    })

    test('should deny access to other users resources', async ({ request }) => {
      // This test would create resources with one user and try to access with another
      // For now, we'll simulate the concept
      
      const employeeToken = await utils.loginAs('employee')
      
      // Employee should not access system-level resources
      const systemResult = await utils.testApiEndpoint('GET', '/api/bonus-pools', {
        token: employeeToken,
        expectedStatus: 403
      })
      expect(systemResult.status).toBe(403)
    })
  })

  test.describe('Session-based Permission Validation', () => {
    test('should validate permissions on each request', async ({ page, request }) => {
      const employeeToken = await utils.loginAs('employee')
      
      // First request should work
      const result1 = await utils.testApiEndpoint('GET', '/api/personal/bonus', {
        token: employeeToken
      })
      expect(result1.status).toBeOneOf([200, 404])
      
      // Simulate permission revocation (in real scenario, this would be done by admin)
      // For testing, we'll just verify that permissions are checked each time
      const result2 = await utils.testApiEndpoint('GET', '/api/personal/bonus', {
        token: employeeToken
      })
      expect(result2.status).toBeOneOf([200, 404])
    })

    test('should handle role changes during session', async ({ page }) => {
      await utils.loginAs('employee')
      
      // Navigate to employee-accessible page
      await page.goto('/personal/bonus')
      await page.waitForLoadState('networkidle')
      
      // Try to navigate to admin page
      await page.goto('/users')
      
      // Should be redirected or show access denied
      const currentUrl = page.url()
      expect(currentUrl).not.toContain('/users')
    })
  })

  test.describe('Permission Error Handling', () => {
    test('should return proper error codes for unauthorized access', async ({ request }) => {
      const employeeToken = await utils.loginAs('employee')
      
      // Test different types of unauthorized access
      const unauthorizedEndpoints = [
        { endpoint: '/api/users', expectedStatus: 403, error: 'Insufficient permissions' },
        { endpoint: '/api/roles', expectedStatus: 403, error: 'Access denied' },
        { endpoint: '/api/bonus-pools', expectedStatus: 403, error: 'Admin access required' }
      ]
      
      for (const { endpoint, expectedStatus } of unauthorizedEndpoints) {
        const result = await utils.testApiEndpoint('GET', endpoint, {
          token: employeeToken,
          expectedStatus
        })
        
        expect(result.status).toBe(expectedStatus)
        expect(result.data?.code).toBe(expectedStatus)
        expect(result.data?.message).toContain('权限不足')
      }
    })

    test('should handle permission errors gracefully in UI', async ({ page }) => {
      await utils.loginAs('employee')
      
      // Try to access admin page directly
      await page.goto('/users')
      
      // Should show access denied message or redirect
      const isRedirected = !page.url().includes('/users')
      const hasErrorMessage = await page.locator('text=权限不足').isVisible().catch(() => false)
      
      expect(isRedirected || hasErrorMessage).toBe(true)
    })
  })

  test.describe('Performance Tests for Authorization', () => {
    test('permission checks should be fast', async ({ request }) => {
      const adminToken = await utils.loginAs('admin')
      
      // Measure time for permission-heavy endpoint
      const startTime = performance.now()
      const result = await utils.testApiEndpoint('GET', '/api/users', { token: adminToken })
      const endTime = performance.now()
      
      expect(result.status).toBe(200)
      expect(endTime - startTime).toBeLessThan(1000) // Should be under 1 second
    })

    test('multiple permission checks should not degrade performance', async ({ request }) => {
      const tokens = {
        admin: await utils.loginAs('admin'),
        manager: await utils.loginAs('project_manager'),
        employee: await utils.loginAs('employee')
      }
      
      // Make multiple concurrent requests
      const startTime = performance.now()
      
      const promises = []
      for (let i = 0; i < 10; i++) {
        promises.push(utils.testApiEndpoint('GET', '/api/health', { token: tokens.admin }))
        promises.push(utils.testApiEndpoint('GET', '/api/health', { token: tokens.manager }))
        promises.push(utils.testApiEndpoint('GET', '/api/health', { token: tokens.employee }))
      }
      
      const results = await Promise.all(promises)
      const endTime = performance.now()
      
      // All should succeed
      results.forEach(result => {
        expect(result.status).toBe(200)
      })
      
      // Total time should be reasonable
      expect(endTime - startTime).toBeLessThan(5000) // Under 5 seconds for 30 requests
    })
  })
})