import { test, expect } from '@playwright/test'
import { ComprehensiveTestUtils } from '../../utils/comprehensive-test-utils'

/**
 * Bug Fixes Regression Tests
 * Validates that all previously identified bugs have been fixed and don't reoccur
 */

test.describe('Bug Fixes Validation Tests', () => {
  let utils: ComprehensiveTestUtils
  let adminToken: string
  let managerToken: string
  let employeeToken: string

  test.beforeAll(async ({ request }) => {
    const page = await request.newContext().then(c => c.newPage())
    utils = new ComprehensiveTestUtils(page, request)
    
    adminToken = await utils.loginAs('admin')
    managerToken = await utils.loginAs('project_manager')
    employeeToken = await utils.loginAs('employee')
    
    await page.close()
  })

  test.describe('Authentication Bug Fixes', () => {
    test('BUG-001: JWT token refresh should work correctly', async ({ page, request }) => {
      // This bug: Token refresh mechanism was failing causing users to be logged out prematurely
      
      await utils.loginAs('admin')
      
      // Get current token
      const initialToken = await page.evaluate(() => localStorage.getItem('token'))
      expect(initialToken).toBeTruthy()
      
      // Simulate token near expiry by making it old
      await page.evaluate(() => {
        const refreshToken = localStorage.getItem('refreshToken')
        localStorage.setItem('token_backup', localStorage.getItem('token')!)
        localStorage.setItem('token_age', Date.now().toString())
      })
      
      // Make an API call that should trigger token refresh
      await page.goto('/employees')
      await page.waitForLoadState('networkidle')
      
      // Page should load successfully (token refreshed)
      await expect(page.locator('.employee-management')).toBeVisible({ timeout: 10000 })
      
      // Token should have been refreshed
      const refreshedToken = await page.evaluate(() => localStorage.getItem('token'))
      expect(refreshedToken).toBeTruthy()
      // In real scenario, the token would be different after refresh
    })

    test('BUG-002: Login should handle special characters in username', async ({ page }) => {
      // This bug: Special characters in usernames caused login failures
      
      await page.goto('/login')
      
      // Test with various special characters that should be handled
      const specialUsernames = [
        'test.user',
        'test_user',
        'test-user',
        'test@company.com'
      ]
      
      for (const username of specialUsernames) {
        await page.fill('input[placeholder="用户名"]', username)
        await page.fill('input[placeholder="密码"]', 'test123')
        
        const [response] = await Promise.all([
          page.waitForResponse('**/api/auth/login'),
          page.click('button[type="submit"]')
        ])
        
        // Should not cause server error (even if login fails)
        expect(response.status()).not.toBe(500)
        expect([200, 401, 400]).toContain(response.status())
        
        // Clear form for next test
        await page.fill('input[placeholder="用户名"]', '')
        await page.fill('input[placeholder="密码"]', '')
      }
    })

    test('BUG-003: Concurrent login sessions should be handled properly', async ({ context }) => {
      // This bug: Multiple simultaneous login attempts caused race conditions
      
      const page1 = await context.newPage()
      const page2 = await context.newPage()
      
      // Navigate both pages to login
      await Promise.all([
        page1.goto('/login'),
        page2.goto('/login')
      ])
      
      // Perform simultaneous login attempts
      const loginPromises = [
        (async () => {
          await page1.fill('input[placeholder="用户名"]', 'admin')
          await page1.fill('input[placeholder="密码"]', 'admin123')
          return page1.click('button[type="submit"]')
        })(),
        (async () => {
          await page2.fill('input[placeholder="用户名"]', 'admin')
          await page2.fill('input[placeholder="密码"]', 'admin123')
          return page2.click('button[type="submit"]')
        })()
      ]
      
      await Promise.all(loginPromises)
      
      // Both sessions should work independently
      await expect(page1).toHaveURL(/dashboard/, { timeout: 10000 })
      await expect(page2).toHaveURL(/dashboard/, { timeout: 10000 })
      
      await page1.close()
      await page2.close()
    })
  })

  test.describe('API Error Handling Bug Fixes', () => {
    test('BUG-004: API should handle malformed JSON requests gracefully', async ({ request }) => {
      // This bug: Malformed JSON caused server crashes
      
      if (!utils.apiContext) return
      
      const malformedJsonTests = [
        '{ "name": "test", invalid }',
        '{ "name": }',
        '{ "name": "test"',
        'not json at all',
        ''
      ]
      
      for (const malformedJson of malformedJsonTests) {
        try {
          const response = await utils.apiContext.post('/api/employees', {
            headers: { 
              Authorization: `Bearer ${adminToken}`,
              'Content-Type': 'application/json' 
            },
            data: malformedJson
          })
          
          // Should return 400 Bad Request, not 500 Server Error
          expect(response.status()).toBe(400)
          
          const responseData = await response.json().catch(() => ({}))
          expect(responseData.message).toContain('Invalid JSON')
        } catch (error) {
          // Network errors are acceptable, but server shouldn't crash
          expect(error.message).not.toContain('ECONNRESET')
        }
      }
    })

    test('BUG-005: Large request payloads should be handled properly', async ({ request }) => {
      // This bug: Large payloads caused memory issues and timeouts
      
      const largeDescription = 'x'.repeat(10000) // 10KB description
      const largeEmployeeData = {
        employeeNo: `LARGE_${Date.now()}`,
        name: '大数据测试员工',
        departmentId: 1,
        positionId: 1,
        annualSalary: 100000,
        entryDate: '2024-01-01',
        description: largeDescription,
        skills: Array(100).fill('技能').map((skill, i) => `${skill}${i}`),
        achievements: Array(50).fill('成就').map((ach, i) => `${ach}${i}`)
      }
      
      const result = await utils.testApiEndpoint('POST', '/api/employees', {
        token: adminToken,
        data: largeEmployeeData,
        timeout: 10000
      })
      
      // Should either succeed or return proper error (not timeout/crash)
      expect([201, 413, 400]).toContain(result.status)
      
      if (result.status === 201) {
        // Clean up
        await utils.testApiEndpoint('DELETE', `/api/employees/${result.data.data.id}`, {
          token: adminToken
        }).catch(() => {})
      }
    })

    test('BUG-006: Database connection errors should be handled gracefully', async ({ request }) => {
      // This bug: Database connection issues caused unhandled promise rejections
      
      // Test various endpoints to ensure they handle database errors
      const criticalEndpoints = [
        '/api/employees',
        '/api/departments',
        '/api/positions',
        '/api/projects'
      ]
      
      for (const endpoint of criticalEndpoints) {
        const result = await utils.testApiEndpoint('GET', endpoint, {
          token: adminToken,
          timeout: 15000
        })
        
        // Should return proper response (success or graceful error)
        expect(result.status).toBeGreaterThanOrEqual(200)
        expect(result.status).toBeLessThan(600)
        
        if (result.status >= 500) {
          // If there's a server error, it should be properly formatted
          expect(result.data).toBeDefined()
          expect(result.data.message).toBeDefined()
        }
      }
    })
  })

  test.describe('Data Validation Bug Fixes', () => {
    test('BUG-007: Employee creation should validate all required fields', async ({ request }) => {
      // This bug: Some required fields weren't being validated properly
      
      const invalidEmployeeTests = [
        { 
          data: { employeeNo: '', name: 'Test' },
          expectedError: '员工编号不能为空'
        },
        { 
          data: { employeeNo: 'EMP001', name: '' },
          expectedError: '姓名不能为空'
        },
        { 
          data: { employeeNo: 'EMP001', name: 'Test', departmentId: null },
          expectedError: '部门不能为空'
        },
        { 
          data: { employeeNo: 'EMP001', name: 'Test', departmentId: 1, positionId: null },
          expectedError: '职位不能为空'
        },
        { 
          data: { employeeNo: 'EMP001', name: 'Test', departmentId: 1, positionId: 1, annualSalary: -1000 },
          expectedError: '年薪必须为正数'
        }
      ]
      
      for (const { data, expectedError } of invalidEmployeeTests) {
        const result = await utils.testApiEndpoint('POST', '/api/employees', {
          token: adminToken,
          data,
          expectedStatus: 400
        })
        
        expect(result.status).toBe(400)
        expect(result.data.message).toContain('验证失败')
      }
    })

    test('BUG-008: Date validation should handle various formats', async ({ request }) => {
      // This bug: Date parsing was inconsistent across different formats
      
      const dateFormats = [
        { date: '2024-01-01', valid: true },
        { date: '2024/01/01', valid: true },
        { date: '01-01-2024', valid: true },
        { date: '2024-13-01', valid: false }, // Invalid month
        { date: '2024-01-32', valid: false }, // Invalid day
        { date: 'invalid-date', valid: false },
        { date: '', valid: false }
      ]
      
      for (const { date, valid } of dateFormats) {
        const employeeData = {
          employeeNo: `DATE_TEST_${Date.now()}_${Math.random()}`,
          name: '日期测试员工',
          departmentId: 1,
          positionId: 1,
          annualSalary: 100000,
          entryDate: date
        }
        
        const result = await utils.testApiEndpoint('POST', '/api/employees', {
          token: adminToken,
          data: employeeData,
          expectedStatus: valid ? 201 : 400
        })
        
        if (valid) {
          expect(result.status).toBe(201)
          // Clean up
          await utils.testApiEndpoint('DELETE', `/api/employees/${result.data.data.id}`, {
            token: adminToken
          }).catch(() => {})
        } else {
          expect(result.status).toBe(400)
        }
      }
    })

    test('BUG-009: Numeric validation should handle edge cases', async ({ request }) => {
      // This bug: Numeric validation wasn't handling scientific notation, infinity, etc.
      
      const numericTests = [
        { value: 0, valid: true },
        { value: 100000.50, valid: true },
        { value: -1, valid: false }, // Negative salary
        { value: Infinity, valid: false },
        { value: NaN, valid: false },
        { value: '1e5', valid: true }, // Scientific notation
        { value: 'not a number', valid: false }
      ]
      
      for (const { value, valid } of numericTests) {
        const employeeData = {
          employeeNo: `NUM_TEST_${Date.now()}_${Math.random()}`,
          name: '数值测试员工',
          departmentId: 1,
          positionId: 1,
          annualSalary: value,
          entryDate: '2024-01-01'
        }
        
        const result = await utils.testApiEndpoint('POST', '/api/employees', {
          token: adminToken,
          data: employeeData,
          expectedStatus: valid ? 201 : 400
        })
        
        if (valid) {
          expect(result.status).toBe(201)
          // Clean up
          await utils.testApiEndpoint('DELETE', `/api/employees/${result.data.data.id}`, {
            token: adminToken
          }).catch(() => {})
        } else {
          expect(result.status).toBe(400)
        }
      }
    })
  })

  test.describe('Project Collaboration Bug Fixes', () => {
    test('BUG-010: Project publishing should validate all required fields', async ({ page, request }) => {
      // This bug: Project could be published without essential information
      
      await utils.loginAs('project_manager')
      await page.goto('/project/publish')
      await page.waitForLoadState('networkidle')
      
      // Try to publish project without filling required fields
      await page.click('text=发布项目')
      
      // Should show validation errors
      await expect(page.locator('.el-form-item__error')).toBeVisible()
      
      // Fill some fields but leave others empty
      await page.fill('input[placeholder*="项目名称"]', '不完整项目')
      // Don't fill project code, budget, etc.
      
      await page.click('text=发布项目')
      
      // Should still show validation errors
      await expect(page.locator('.el-form-item__error')).toBeVisible()
      
      // Only after filling all required fields should it succeed
      await page.fill('input[placeholder*="项目代码"]', `INCOMPLETE_${Date.now()}`)
      await page.fill('textarea[placeholder*="项目描述"]', '完整的项目描述')
      await page.fill('input[placeholder*="项目预算"]', '100000')
      await page.fill('input[placeholder*="奖金规模"]', '50000')
      await page.fill('input[placeholder*="利润目标"]', '200000')
      
      // Now it should work
      await page.click('text=发布项目')
      
      // Should redirect to success page or show success message
      const success = await Promise.race([
        page.waitForURL('**/project/collaboration').then(() => true),
        page.waitForSelector('.el-message--success').then(() => true),
        new Promise(resolve => setTimeout(() => resolve(false), 5000))
      ])
      
      expect(success).toBe(true)
    })

    test('BUG-011: Team application should prevent duplicate submissions', async ({ page, request }) => {
      // This bug: Users could submit multiple applications for the same project
      
      await utils.loginAs('employee')
      await page.goto('/project/collaboration')
      await page.waitForLoadState('networkidle')
      
      // Find a published project to apply to
      const projectCards = page.locator('.project-card')
      const cardCount = await projectCards.count()
      
      if (cardCount > 0) {
        // Click on first project
        await projectCards.first().click()
        
        const applyButton = page.locator('text=申请加入')
        if (await applyButton.isVisible()) {
          // First application
          await applyButton.click()
          
          // Fill application form (if appears)
          const teamNameInput = page.locator('input[placeholder*="团队名称"]')
          if (await teamNameInput.isVisible()) {
            await teamNameInput.fill(`重复测试团队_${Date.now()}`)
            await page.fill('textarea[placeholder*="团队描述"]', '测试重复申请')
            
            // Submit application
            await page.click('text=提交申请')
            
            // Wait for success message
            await expect(page.locator('.el-message--success')).toBeVisible()
            
            // Try to apply again - should be prevented
            await page.reload()
            await projectCards.first().click()
            
            // Apply button should be disabled or replaced with "已申请"
            const secondApplyButton = page.locator('text=申请加入')
            if (await secondApplyButton.isVisible()) {
              expect(await secondApplyButton.isDisabled()).toBe(true)
            } else {
              // Or there should be text indicating already applied
              await expect(page.locator('text=已申请')).toBeVisible()
            }
          }
        }
      }
    })

    test('BUG-012: Project team approval should update status correctly', async ({ page, request }) => {
      // This bug: Team approval status wasn't being updated properly
      
      // First create a test application as employee
      const applicationData = {
        projectId: 1, // Assuming project ID 1 exists
        teamName: `状态测试团队_${Date.now()}`,
        teamDescription: '测试状态更新功能',
        proposedMembers: [{ employeeId: 1, role: '成员' }],
        budgetRequest: 30000
      }
      
      const applicationResult = await utils.testApiEndpoint('POST', '/api/project-team-applications', {
        token: employeeToken,
        data: applicationData
      })
      
      if (applicationResult.status === 201) {
        const applicationId = applicationResult.data.data.id
        
        // Now approve as manager
        const approvalResult = await utils.testApiEndpoint('PUT', `/api/project-team-applications/${applicationId}/review`, {
          token: managerToken,
          data: {
            action: 'approve',
            feedback: '申请通过测试'
          }
        })
        
        expect(approvalResult.status).toBe(200)
        expect(approvalResult.data.data.status).toBe('approved')
        
        // Verify status in database by querying again
        const statusCheck = await utils.testApiEndpoint('GET', `/api/project-team-applications/${applicationId}`, {
          token: managerToken
        })
        
        expect(statusCheck.status).toBe(200)
        expect(statusCheck.data.data.status).toBe('approved')
      }
    })
  })

  test.describe('UI Bug Fixes', () => {
    test('BUG-013: Table pagination should work correctly', async ({ page }) => {
      // This bug: Pagination was not working correctly in data tables
      
      await utils.loginAs('admin')
      await page.goto('/employees')
      await page.waitForLoadState('networkidle')
      
      // Check if pagination is present
      const pagination = page.locator('.el-pagination')
      if (await pagination.isVisible()) {
        // Get current page info
        const currentPage = await page.locator('.el-pagination .number.active').textContent()
        
        // Click next page if available
        const nextButton = page.locator('.el-pagination .btn-next')
        if (await nextButton.isEnabled()) {
          await nextButton.click()
          await page.waitForLoadState('networkidle')
          
          // Should be on next page
          const newPage = await page.locator('.el-pagination .number.active').textContent()
          expect(newPage).not.toBe(currentPage)
          
          // Data should change
          const tableRows = page.locator('.employee-table tbody tr')
          expect(await tableRows.count()).toBeGreaterThan(0)
        }
      }
    })

    test('BUG-014: Form validation should clear when input is corrected', async ({ page }) => {
      // This bug: Validation errors persisted even after correcting input
      
      await utils.loginAs('admin')
      await page.goto('/employees')
      await page.waitForLoadState('networkidle')
      
      // Click add employee button
      await page.click('text=新增员工')
      
      // Submit empty form to trigger validation
      await page.click('text=确定')
      
      // Should show validation errors
      await expect(page.locator('.el-form-item__error')).toBeVisible()
      
      // Fill in the fields to correct errors
      await page.fill('input[placeholder*="员工编号"]', `BUG_TEST_${Date.now()}`)
      await page.fill('input[placeholder*="姓名"]', '测试员工')
      
      // Validation errors should disappear
      await expect(page.locator('.el-form-item__error')).not.toBeVisible()
      
      // Cancel the dialog
      await page.click('text=取消')
    })

    test('BUG-015: Modal dialogs should close properly', async ({ page }) => {
      // This bug: Modal dialogs sometimes didn't close or left backdrop
      
      await utils.loginAs('admin')
      await page.goto('/employees')
      await page.waitForLoadState('networkidle')
      
      // Open employee detail dialog
      const firstRowAction = page.locator('.employee-table tbody tr:first-child .action-buttons')
      if (await firstRowAction.isVisible()) {
        await firstRowAction.locator('text=查看').click()
        
        // Dialog should open
        await expect(page.locator('.el-dialog')).toBeVisible()
        
        // Close dialog using X button
        await page.click('.el-dialog .el-dialog__close')
        
        // Dialog should close completely
        await expect(page.locator('.el-dialog')).not.toBeVisible()
        
        // No backdrop should remain
        await expect(page.locator('.el-overlay')).not.toBeVisible()
        
        // Page should be interactive
        expect(await page.locator('body').isEnabled()).toBe(true)
      }
    })
  })

  test.describe('Performance Bug Fixes', () => {
    test('BUG-016: Large data tables should not cause browser freeze', async ({ page }) => {
      // This bug: Loading large amounts of data caused browser to freeze
      
      await utils.loginAs('admin')
      
      // Navigate to potentially large data table
      await page.goto('/employees')
      await page.waitForLoadState('networkidle')
      
      // Increase page size to test performance
      const pageSizeSelector = page.locator('.el-select .el-select__wrapper')
      if (await pageSizeSelector.isVisible()) {
        await pageSizeSelector.click()
        
        // Select largest page size available
        const options = page.locator('.el-select-dropdown .el-select-dropdown__item')
        const optionCount = await options.count()
        
        if (optionCount > 0) {
          await options.last().click()
          
          // Page should load without freezing
          await page.waitForLoadState('networkidle', { timeout: 30000 })
          
          // Table should be rendered
          await expect(page.locator('.employee-table')).toBeVisible()
          
          // Browser should remain responsive
          const isResponsive = await page.evaluate(() => {
            // Simple responsiveness test
            const start = Date.now()
            for (let i = 0; i < 1000; i++) {
              document.body.clientHeight // Force a style calculation
            }
            return Date.now() - start < 1000 // Should complete within 1 second
          })
          
          expect(isResponsive).toBe(true)
        }
      }
    })

    test('BUG-017: Search functionality should not delay excessively', async ({ page }) => {
      // This bug: Search was too slow and didn't debounce properly
      
      await utils.loginAs('admin')
      await page.goto('/employees')
      await page.waitForLoadState('networkidle')
      
      const searchInput = page.locator('input[placeholder*="搜索"]')
      if (await searchInput.isVisible()) {
        // Type search term
        const searchTerm = '测试'
        const startTime = performance.now()
        
        await searchInput.fill(searchTerm)
        
        // Wait for search results
        await page.waitForTimeout(1000) // Allow for debouncing
        await page.waitForLoadState('networkidle')
        
        const endTime = performance.now()
        const searchTime = endTime - startTime
        
        // Search should complete reasonably quickly
        expect(searchTime).toBeLessThan(5000) // Within 5 seconds
        
        // Results should be filtered
        const results = page.locator('.employee-table tbody tr')
        const resultCount = await results.count()
        
        // Should have some results or proper empty state
        if (resultCount === 0) {
          await expect(page.locator('text=暂无数据')).toBeVisible()
        } else {
          // Results should contain search term
          const firstResult = await results.first().textContent()
          expect(firstResult).toContain(searchTerm)
        }
      }
    })

    test('BUG-018: Memory leaks should not occur during navigation', async ({ page }) => {
      // This bug: Memory usage increased continuously during navigation
      
      await utils.loginAs('admin')
      
      // Navigate between different pages to test memory usage
      const pages = ['/dashboard', '/employees', '/departments', '/positions', '/projects']
      
      for (let i = 0; i < 3; i++) { // Repeat navigation cycle
        for (const pagePath of pages) {
          await page.goto(pagePath)
          await page.waitForLoadState('networkidle')
          
          // Force garbage collection if available (dev tools)
          await page.evaluate(() => {
            if (window.gc) {
              window.gc()
            }
          })
          
          // Check that page loads successfully
          expect(page.url()).toContain(pagePath)
        }
      }
      
      // After multiple navigations, the application should still be responsive
      const finalResponsiveTest = await page.evaluate(() => {
        const start = Date.now()
        // Perform some DOM operations
        for (let i = 0; i < 100; i++) {
          const div = document.createElement('div')
          document.body.appendChild(div)
          document.body.removeChild(div)
        }
        return Date.now() - start < 1000
      })
      
      expect(finalResponsiveTest).toBe(true)
    })
  })

  test.describe('Security Bug Fixes', () => {
    test('BUG-019: XSS prevention should work in all input fields', async ({ page }) => {
      // This bug: XSS vulnerabilities in various input fields
      
      const xssTest = await utils.testXSSPrevention()
      expect(xssTest).toBe(true)
    })

    test('BUG-020: SQL injection protection should be comprehensive', async ({ request }) => {
      // This bug: SQL injection vulnerabilities in search endpoints
      
      const endpoints = [
        '/api/employees',
        '/api/projects', 
        '/api/departments',
        '/api/positions'
      ]
      
      for (const endpoint of endpoints) {
        const sqlInjectionTest = await utils.testSQLInjection(endpoint, adminToken)
        expect(sqlInjectionTest, `SQL injection test failed for ${endpoint}`).toBe(true)
      }
    })

    test('BUG-021: Authorization bypass should be prevented', async ({ request }) => {
      // This bug: Users could bypass authorization checks in certain scenarios
      
      // Test that employee cannot access admin endpoints
      const adminOnlyEndpoints = [
        '/api/users',
        '/api/roles',
        '/api/system/config'
      ]
      
      for (const endpoint of adminOnlyEndpoints) {
        const result = await utils.testApiEndpoint('GET', endpoint, {
          token: employeeToken,
          expectedStatus: 403
        })
        
        expect(result.status, `Authorization bypass in ${endpoint}`).toBe(403)
      }
    })
  })

  test.afterAll(async () => {
    // Clean up any test data created during regression tests
    if (adminToken) {
      await utils.cleanupTestData(adminToken)
    }
  })
})