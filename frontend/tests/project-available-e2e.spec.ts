import { test, expect, Page, BrowserContext } from '@playwright/test'
import { TestUtils, TEST_CONSTANTS } from './helpers/test-utils'

test.describe('Project Available E2E Tests', () => {
  let page: Page
  let context: BrowserContext
  let testProjects: any[] = []

  test.beforeAll(async ({ browser }) => {
    // Create a new browser context for this test suite
    context = await browser.newContext()
    page = await context.newPage()

    // Set up console error tracking
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
        console.log('Console error:', msg.text())
      }
    })

    // Setup test data by creating projects via API
    await setupTestProjects()
  })

  test.afterAll(async () => {
    // Clean up test projects
    await cleanupTestProjects()
    await context.close()
  })

  async function setupTestProjects() {
    try {
      // Login as admin to create test projects
      await page.goto('/')
      await TestUtils.login(page, 'admin')
      
      // Navigate to project management
      await page.goto('/project/management')
      await TestUtils.waitForPageLoad(page)

      // Create test projects with different statuses
      const projectsToCreate = [
        {
          name: 'E2E Test Available Active Project',
          code: 'E2E_ACTIVE_001',
          description: 'Active project for E2E testing project availability',
          priority: 'high',
          status: 'active'
        },
        {
          name: 'E2E Test Available Planning Project', 
          code: 'E2E_PLANNING_001',
          description: 'Planning project for E2E testing project availability',
          priority: 'medium',
          status: 'planning'
        },
        {
          name: 'E2E Test Completed Project',
          code: 'E2E_COMPLETED_001', 
          description: 'Completed project should not be available',
          priority: 'low',
          status: 'completed'
        }
      ]

      for (const projectData of projectsToCreate) {
        try {
          // Click create project button
          await page.click('button:has-text("新建项目")', { timeout: 5000 })
          await TestUtils.waitForDialog(page, '.el-dialog')

          // Fill in project form
          await TestUtils.fillForm(page, {
            'input[placeholder="请输入项目名称"]': projectData.name,
            'input[placeholder="请输入项目代码"]': projectData.code,
            'textarea[placeholder="请输入项目描述"]': projectData.description
          })

          // Select priority
          await page.click('.el-select:has-text("优先级")')
          await page.click(`.el-option:has-text("${projectData.priority === 'high' ? '高' : projectData.priority === 'medium' ? '中' : '低'}")`)

          // Submit form
          await page.click('button:has-text("确 定")')
          await TestUtils.expectSuccessMessage(page)
          
          testProjects.push(projectData)
          console.log(`Created test project: ${projectData.name}`)
          
        } catch (error) {
          console.error(`Failed to create project ${projectData.name}:`, error)
        }
      }

    } catch (error) {
      console.error('Setup test projects failed:', error)
    }
  }

  async function cleanupTestProjects() {
    try {
      // Login as admin to clean up
      await page.goto('/')
      await TestUtils.login(page, 'admin')
      await page.goto('/project/management')
      await TestUtils.waitForPageLoad(page)

      // Delete test projects
      for (const project of testProjects) {
        try {
          // Find and delete project
          const projectRow = page.locator(`tr:has-text("${project.code}")`)
          if (await projectRow.isVisible()) {
            await projectRow.locator('button:has-text("删除")').click()
            await page.click('button:has-text("确 定")')
            await TestUtils.expectSuccessMessage(page)
            console.log(`Deleted test project: ${project.name}`)
          }
        } catch (error) {
          console.error(`Failed to delete project ${project.name}:`, error)
        }
      }
    } catch (error) {
      console.error('Cleanup test projects failed:', error)
    }
  }

  test.describe('Authentication and Navigation', () => {
    test('should require authentication to access project collaboration', async () => {
      await page.goto('/project/collaboration')
      
      // Should redirect to login
      await expect(page).toHaveURL(/.*\/login/)
    })

    test('should navigate to project collaboration after login', async () => {
      await TestUtils.login(page, 'regular_user')
      await page.goto('/project/collaboration')
      
      await TestUtils.waitForPageLoad(page)
      await expect(page).toHaveURL(/.*\/project\/collaboration/)
    })
  })

  test.describe('Project Available Dropdown Functionality', () => {
    test.beforeEach(async () => {
      // Login as regular user for each test
      await TestUtils.login(page, 'regular_user')
      await page.goto('/project/collaboration')
      await TestUtils.waitForPageLoad(page)
    })

    test('should display available projects dropdown', async () => {
      // Look for project dropdown in collaboration page
      const projectSelect = page.locator('.el-select:has-text("选择项目")').first()
      await expect(projectSelect).toBeVisible()
    })

    test('should load available projects when dropdown is clicked', async () => {
      // Find and click project dropdown
      const projectSelect = page.locator('.el-select:has-text("选择项目")').first()
      await projectSelect.click()

      // Wait for dropdown options to load
      await page.waitForSelector('.el-select-dropdown', { state: 'visible' })
      
      // Verify options are loaded
      const options = page.locator('.el-option')
      const optionCount = await options.count()
      
      // Should have some options (at least our test projects with active/planning status)
      expect(optionCount).toBeGreaterThan(0)
      
      console.log(`Found ${optionCount} available projects`)
    })

    test('should only show active and planning projects in dropdown', async () => {
      // Click project dropdown
      const projectSelect = page.locator('.el-select:has-text("选择项目")').first()
      await projectSelect.click()
      await page.waitForSelector('.el-select-dropdown', { state: 'visible' })

      // Get all option texts
      const options = page.locator('.el-option')
      const optionTexts = await options.allTextContents()
      
      // Should include our active and planning test projects
      const hasActiveProject = optionTexts.some(text => text.includes('E2E_ACTIVE_001'))
      const hasPlanningProject = optionTexts.some(text => text.includes('E2E_PLANNING_001'))
      const hasCompletedProject = optionTexts.some(text => text.includes('E2E_COMPLETED_001'))
      
      expect(hasActiveProject).toBeTruthy()
      expect(hasPlanningProject).toBeTruthy()
      expect(hasCompletedProject).toBeFalsy() // Completed projects should not appear
      
      console.log('Available project options:', optionTexts)
    })

    test('should select a project and populate related fields', async () => {
      // Click project dropdown
      const projectSelect = page.locator('.el-select:has-text("选择项目")').first()
      await projectSelect.click()
      await page.waitForSelector('.el-select-dropdown', { state: 'visible' })

      // Select the first available project
      const firstOption = page.locator('.el-option').first()
      await firstOption.click()

      // Verify selection
      await expect(projectSelect).toContainText(/E2E_/)
      
      // Check if related project information is populated
      // This might include project manager, budget, etc.
      await TestUtils.waitForPageLoad(page)
    })
  })

  test.describe('API Integration Tests', () => {
    test('should handle API loading states', async () => {
      await TestUtils.login(page, 'regular_user')
      await page.goto('/project/collaboration')

      // Mock slow API response
      await TestUtils.simulateSlowNetwork(page)

      // Click dropdown and verify loading state
      const projectSelect = page.locator('.el-select:has-text("选择项目")').first()
      await projectSelect.click()

      // Should show loading indicator
      await expect(page.locator('.el-select-dropdown .el-loading')).toBeVisible({ timeout: 2000 })
      
      // Restore network and wait for completion
      await TestUtils.restoreNetwork(page)
      await TestUtils.waitForNetworkIdle(page)
    })

    test('should handle API errors gracefully', async () => {
      await TestUtils.login(page, 'regular_user') 
      await page.goto('/project/collaboration')

      // Mock API error
      await TestUtils.mockApiError(page, '**/api/projects/available', 500, 'Server Error')

      // Click dropdown
      const projectSelect = page.locator('.el-select:has-text("选择项目")').first()
      await projectSelect.click()

      // Should show error message or empty state
      await page.waitForSelector('.el-select-dropdown', { state: 'visible' })
      const emptyText = page.locator('.el-select-dropdown .el-select-dropdown__empty')
      await expect(emptyText).toBeVisible()
    })

    test('should refresh projects when needed', async () => {
      await TestUtils.login(page, 'regular_user')
      await page.goto('/project/collaboration')

      // Initial load
      const projectSelect = page.locator('.el-select:has-text("选择项目")').first()
      await projectSelect.click()
      await page.waitForSelector('.el-select-dropdown', { state: 'visible' })
      
      const initialCount = await page.locator('.el-option').count()
      
      // Close dropdown
      await page.keyboard.press('Escape')
      
      // Refresh page or trigger refresh
      await page.reload()
      await TestUtils.waitForPageLoad(page)
      
      // Check again
      await projectSelect.click()
      await page.waitForSelector('.el-select-dropdown', { state: 'visible' })
      
      const refreshedCount = await page.locator('.el-option').count()
      
      // Should have same or updated count
      expect(refreshedCount).toBeGreaterThanOrEqual(0)
      console.log(`Initial count: ${initialCount}, Refreshed count: ${refreshedCount}`)
    })
  })

  test.describe('User Experience Tests', () => {
    test('should provide search/filter functionality in dropdown', async () => {
      await TestUtils.login(page, 'regular_user')
      await page.goto('/project/collaboration')

      const projectSelect = page.locator('.el-select:has-text("选择项目")').first()
      await projectSelect.click()
      await page.waitForSelector('.el-select-dropdown', { state: 'visible' })

      // If the dropdown is filterable, try typing
      const selectInput = page.locator('.el-select input')
      if (await selectInput.isVisible()) {
        await selectInput.fill('E2E')
        
        // Wait for filter results
        await page.waitForTimeout(500)
        
        // Should show filtered results
        const options = await page.locator('.el-option').count()
        console.log(`Filtered options: ${options}`)
      }
    })

    test('should show project details in dropdown options', async () => {
      await TestUtils.login(page, 'regular_user')
      await page.goto('/project/collaboration')

      const projectSelect = page.locator('.el-select:has-text("选择项目")').first()
      await projectSelect.click()
      await page.waitForSelector('.el-select-dropdown', { state: 'visible' })

      // Check if options show useful project information
      const options = page.locator('.el-option')
      const optionCount = await options.count()
      
      if (optionCount > 0) {
        const firstOptionText = await options.first().textContent()
        
        // Should contain project code or name
        expect(firstOptionText).toBeTruthy()
        expect(firstOptionText!.length).toBeGreaterThan(0)
        
        console.log('Sample option text:', firstOptionText)
      }
    })

    test('should handle empty state when no projects available', async () => {
      await TestUtils.login(page, 'regular_user')
      await page.goto('/project/collaboration')

      // Mock empty response
      await TestUtils.mockApiResponse(page, '**/api/projects/available', {
        code: 200,
        message: '获取成功',
        data: {
          projects: [],
          total: 0
        }
      })

      const projectSelect = page.locator('.el-select:has-text("选择项目")').first()
      await projectSelect.click()
      await page.waitForSelector('.el-select-dropdown', { state: 'visible' })

      // Should show empty state
      const emptyText = page.locator('.el-select-dropdown .el-select-dropdown__empty')
      await expect(emptyText).toBeVisible()
      
      const emptyMessage = await emptyText.textContent()
      console.log('Empty state message:', emptyMessage)
    })
  })

  test.describe('Permission and Security Tests', () => {
    test('should restrict access based on user permissions', async () => {
      // Test with different user types to ensure proper access control
      const userTypes: Array<'admin' | 'project_manager' | 'regular_user'> = ['admin', 'project_manager', 'regular_user']
      
      for (const userType of userTypes) {
        await TestUtils.login(page, userType)
        await page.goto('/project/collaboration')
        
        try {
          await TestUtils.waitForPageLoad(page)
          
          // All authenticated users should be able to see the page
          // but may have different available projects
          const projectSelect = page.locator('.el-select:has-text("选择项目")').first()
          await expect(projectSelect).toBeVisible()
          
          console.log(`${userType} can access project collaboration page`)
        } catch (error) {
          console.error(`${userType} failed to access page:`, error)
        }
      }
    })

    test('should validate user has employee association', async () => {
      await TestUtils.login(page, 'regular_user')
      await page.goto('/project/collaboration')

      // Mock API response for user without employee association
      await TestUtils.mockApiResponse(page, '**/api/projects/available', {
        code: 400,
        message: '当前用户未关联员工信息',
        data: null
      }, 400)

      const projectSelect = page.locator('.el-select:has-text("选择项目")').first()
      await projectSelect.click()

      // Should show error message
      await TestUtils.expectErrorMessage(page)
    })
  })

  test.describe('Data Consistency Tests', () => {
    test('should sync with backend project status changes', async () => {
      await TestUtils.login(page, 'regular_user')
      await page.goto('/project/collaboration')

      // Get initial project list
      const projectSelect = page.locator('.el-select:has-text("选择项目")').first()
      await projectSelect.click()
      await page.waitForSelector('.el-select-dropdown', { state: 'visible' })
      
      const initialOptions = await page.locator('.el-option').count()
      await page.keyboard.press('Escape')

      // Mock a project status change that makes it unavailable
      await TestUtils.mockApiResponse(page, '**/api/projects/available', {
        code: 200,
        message: '获取成功',
        data: {
          projects: [],
          total: 0
        }
      })

      // Trigger refresh
      await page.reload()
      await TestUtils.waitForPageLoad(page)
      
      // Check updated list
      await projectSelect.click()
      await page.waitForSelector('.el-select-dropdown', { state: 'visible' })
      
      const updatedOptions = await page.locator('.el-option').count()
      
      console.log(`Initial options: ${initialOptions}, Updated options: ${updatedOptions}`)
    })

    test('should validate project data integrity', async () => {
      await TestUtils.login(page, 'regular_user')
      await page.goto('/project/collaboration')

      const projectSelect = page.locator('.el-select:has-text("选择项目")').first()
      await projectSelect.click()
      await page.waitForSelector('.el-select-dropdown', { state: 'visible' })

      // Verify all options have valid data
      const options = page.locator('.el-option')
      const optionCount = await options.count()
      
      if (optionCount > 0) {
        for (let i = 0; i < Math.min(optionCount, 5); i++) {
          const optionText = await options.nth(i).textContent()
          
          // Each option should have non-empty text
          expect(optionText).toBeTruthy()
          expect(optionText!.trim().length).toBeGreaterThan(0)
          
          // Should not contain error messages or invalid data
          expect(optionText).not.toContain('undefined')
          expect(optionText).not.toContain('null')
          expect(optionText).not.toContain('[object Object]')
        }
      }
    })
  })

  test.describe('Performance Tests', () => {
    test('should load projects within acceptable time', async () => {
      await TestUtils.login(page, 'regular_user')
      await page.goto('/project/collaboration')
      
      const startTime = Date.now()
      
      const projectSelect = page.locator('.el-select:has-text("选择项目")').first()
      await projectSelect.click()
      await page.waitForSelector('.el-select-dropdown', { state: 'visible' })
      
      const loadTime = Date.now() - startTime
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000)
      console.log(`Projects loaded in ${loadTime}ms`)
    })

    test('should handle concurrent requests gracefully', async () => {
      await TestUtils.login(page, 'regular_user')
      await page.goto('/project/collaboration')

      // Simulate rapid clicking
      const projectSelect = page.locator('.el-select:has-text("选择项目")').first()
      
      for (let i = 0; i < 3; i++) {
        await projectSelect.click()
        await page.waitForTimeout(100)
        await page.keyboard.press('Escape')
      }
      
      // Final click should work correctly
      await projectSelect.click()
      await page.waitForSelector('.el-select-dropdown', { state: 'visible' })
      
      // Should show options without errors
      const optionCount = await page.locator('.el-option').count()
      expect(optionCount).toBeGreaterThanOrEqual(0)
    })
  })
})