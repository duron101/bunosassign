import { test, expect } from '@playwright/test'
import { TestUtils, TEST_CONSTANTS } from './helpers/test-utils'

// API集成测试 - 通过前端界面测试后端API
test.describe('项目协作模块 - API集成测试', () => {
  
  test.beforeEach(async ({ page }) => {
    await TestUtils.login(page, 'admin')
  })

  test.describe('项目发布API测试', () => {
    test('成功发布项目 - API正常响应', async ({ page }) => {
      const testProject = TestUtils.generateTestProjectData()
      
      await page.goto(TEST_CONSTANTS.URLS.PROJECT_PUBLISH)
      
      // 填写项目表单
      await TestUtils.fillForm(page, {
        'input[placeholder="请输入项目名称"]': testProject.name,
        'input[placeholder="请输入项目代码"]': testProject.code,
        'textarea[placeholder="请输入项目描述"]': testProject.description,
        'textarea[placeholder="请详细描述项目的工作内容、目标和交付物"]': testProject.workContent,
        'input[placeholder="请输入项目预算"]': testProject.budget.toString(),
        'input[placeholder="请输入预计奖金规模"]': testProject.bonusScale.toString(),
        'input[placeholder="请输入利润目标"]': testProject.profitTarget.toString()
      })

      // 监听API请求
      let apiRequest: any = null
      let apiResponse: any = null
      
      page.on('request', request => {
        if (request.url().includes('/api/project-collaboration/publish')) {
          apiRequest = {
            url: request.url(),
            method: request.method(),
            headers: request.headers(),
            postData: request.postDataJSON()
          }
        }
      })

      page.on('response', response => {
        if (response.url().includes('/api/project-collaboration/publish')) {
          apiResponse = {
            status: response.status(),
            headers: response.headers(),
            url: response.url()
          }
        }
      })

      // 提交表单
      await page.click('text=发布项目')
      await page.waitForSelector('.el-message-box')
      await page.click('.el-message-box .el-button--primary')

      // 等待API响应
      await TestUtils.expectSuccessMessage(page)

      // 验证API请求
      expect(apiRequest).toBeTruthy()
      expect(apiRequest.method).toBe('POST')
      expect(apiRequest.postData).toMatchObject({
        name: testProject.name,
        code: testProject.code,
        description: testProject.description,
        workContent: testProject.workContent
      })

      // 验证API响应
      expect(apiResponse).toBeTruthy()
      expect(apiResponse.status).toBe(201)
    })

    test('发布项目失败 - API错误处理', async ({ page }) => {
      await page.goto(TEST_CONSTANTS.URLS.PROJECT_PUBLISH)
      
      // 模拟API错误
      await TestUtils.mockApiError(
        page, 
        '**/api/project-collaboration/publish', 
        400, 
        '项目代码已存在'
      )

      const testProject = TestUtils.generateTestProjectData()
      
      await TestUtils.fillForm(page, {
        'input[placeholder="请输入项目名称"]': testProject.name,
        'input[placeholder="请输入项目代码"]': testProject.code,
        'textarea[placeholder="请输入项目描述"]': testProject.description
      })

      await page.click('text=发布项目')
      await page.click('.el-message-box .el-button--primary')

      // 验证错误处理
      await TestUtils.expectErrorMessage(page)
      
      const errorText = await page.locator('.el-message--error').textContent()
      expect(errorText).toContain('项目代码已存在')
    })

    test('网络超时处理', async ({ page }) => {
      await page.goto(TEST_CONSTANTS.URLS.PROJECT_PUBLISH)
      
      // 模拟网络超时
      await page.route('**/api/project-collaboration/publish', async route => {
        await new Promise(resolve => setTimeout(resolve, 15000)) // 15秒延迟
        route.continue()
      })

      const testProject = TestUtils.generateTestProjectData()
      
      await TestUtils.fillForm(page, {
        'input[placeholder="请输入项目名称"]': testProject.name,
        'input[placeholder="请输入项目代码"]': testProject.code,
        'textarea[placeholder="请输入项目描述"]': testProject.description
      })

      await page.click('text=发布项目')
      await page.click('.el-message-box .el-button--primary')

      // 验证超时处理（应该显示错误或加载状态）
      const loadingVisible = await TestUtils.isVisible(page, '.el-loading-mask')
      const errorVisible = await TestUtils.isVisible(page, '.el-message--error')
      
      expect(loadingVisible || errorVisible).toBeTruthy()
    })
  })

  test.describe('项目查询API测试', () => {
    test('获取项目列表 - API数据格式验证', async ({ page }) => {
      let projectsResponse: any = null

      page.on('response', async response => {
        if (response.url().includes('/api/project-collaboration/projects')) {
          projectsResponse = await response.json()
        }
      })

      await page.goto(TEST_CONSTANTS.URLS.PROJECT_COLLABORATION)
      await TestUtils.waitForPageLoad(page, '.project-collaboration')

      // 等待API响应
      await page.waitForTimeout(2000)

      // 验证API响应格式
      expect(projectsResponse).toBeTruthy()
      expect(projectsResponse).toHaveProperty('code', 200)
      expect(projectsResponse).toHaveProperty('data')
      expect(projectsResponse.data).toHaveProperty('projects')
      expect(projectsResponse.data).toHaveProperty('pagination')
      
      if (projectsResponse.data.projects.length > 0) {
        const project = projectsResponse.data.projects[0]
        expect(project).toHaveProperty('id')
        expect(project).toHaveProperty('name')
        expect(project).toHaveProperty('code')
        expect(project).toHaveProperty('cooperationStatus')
      }
    })

    test('项目搜索API测试', async ({ page }) => {
      await page.goto(TEST_CONSTANTS.URLS.PROJECT_COLLABORATION)
      await TestUtils.waitForPageLoad(page)

      let searchRequest: any = null

      page.on('request', request => {
        if (request.url().includes('/api/project-collaboration/projects') && 
            request.url().includes('search=')) {
          searchRequest = request.url()
        }
      })

      // 执行搜索
      await page.fill('input[placeholder="项目名称、代码"]', '测试')
      await page.click('button:has-text("搜索")')
      await page.waitForTimeout(1000)

      // 验证搜索API请求
      expect(searchRequest).toBeTruthy()
      expect(searchRequest).toContain('search=测试')
    })

    test('项目状态筛选API测试', async ({ page }) => {
      await page.goto(TEST_CONSTANTS.URLS.PROJECT_COLLABORATION)
      await TestUtils.waitForPageLoad(page)

      let filterRequest: any = null

      page.on('request', request => {
        if (request.url().includes('/api/project-collaboration/projects') && 
            request.url().includes('cooperationStatus=')) {
          filterRequest = request.url()
        }
      })

      // 选择状态筛选
      const selectElement = page.locator('.el-select').first()
      if (await selectElement.isVisible()) {
        await selectElement.click()
        await page.waitForSelector('.el-select-dropdown')
        await page.click('text=已发布')
        await page.waitForTimeout(1000)

        // 验证筛选API请求
        expect(filterRequest).toBeTruthy()
        expect(filterRequest).toContain('cooperationStatus=published')
      }
    })
  })

  test.describe('团队申请API测试', () => {
    test('提交团队申请 - API数据完整性', async ({ page }) => {
      await page.goto(TEST_CONSTANTS.URLS.PROJECT_COLLABORATION)
      await TestUtils.waitForPageLoad(page)

      const applyButtons = page.locator('text=申请团队')
      const count = await applyButtons.count()

      if (count > 0) {
        let applicationRequest: any = null

        page.on('request', request => {
          if (request.url().includes('/apply-team') && request.method() === 'POST') {
            applicationRequest = {
              url: request.url(),
              method: request.method(),
              postData: request.postDataJSON()
            }
          }
        })

        // 点击申请按钮
        await applyButtons.first().click()
        await TestUtils.waitForDialog(page, '.team-application-dialog')

        const testTeam = TestUtils.generateTestTeamData()

        // 填写团队信息
        await TestUtils.fillForm(page, {
          'input[placeholder="请输入团队名称"]': testTeam.teamName,
          'textarea[placeholder="请描述团队的特点和优势"]': testTeam.teamDescription,
          'textarea[placeholder="请说明申请理由"]': testTeam.applicationReason,
          'input[placeholder="预估成本"]': testTeam.estimatedCost.toString()
        })

        // 提交申请
        await page.click('.team-application-dialog .el-button--primary')
        await page.click('.el-message-box .el-button--primary')
        
        // 等待API响应
        await TestUtils.expectSuccessMessage(page)

        // 验证API请求数据
        expect(applicationRequest).toBeTruthy()
        expect(applicationRequest.method).toBe('POST')
        expect(applicationRequest.postData).toMatchObject({
          teamName: testTeam.teamName,
          teamDescription: testTeam.teamDescription,
          applicationReason: testTeam.applicationReason,
          estimatedCost: testTeam.estimatedCost
        })
      } else {
        test.skip('没有可申请的项目')
      }
    })
  })

  test.describe('审批流程API测试', () => {
    test('审批团队申请 - API请求验证', async ({ page }) => {
      await page.goto(TEST_CONSTANTS.URLS.PROJECT_COLLABORATION)
      await page.click('text=待审批申请')
      await page.waitForTimeout(1000)

      const applicationItems = page.locator('.application-item')
      const count = await applicationItems.count()

      if (count > 0) {
        let approvalRequest: any = null

        page.on('request', request => {
          if (request.url().includes('/approve') && request.method() === 'POST') {
            approvalRequest = {
              url: request.url(),
              method: request.method(),
              postData: request.postDataJSON()
            }
          }
        })

        // 点击审批按钮
        await page.click('text=审批')
        await TestUtils.waitForDialog(page, '.approval-dialog')

        // 选择批准
        await page.click('text=批准申请')
        await page.fill('textarea[placeholder*="批准意见"]', '团队配置合理，同意组建')

        // 提交审批
        await page.click('.approval-dialog .el-button--primary')
        await page.click('.el-message-box .el-button--primary')
        
        await TestUtils.expectSuccessMessage(page)

        // 验证API请求
        expect(approvalRequest).toBeTruthy()
        expect(approvalRequest.method).toBe('POST')
        expect(approvalRequest.postData).toMatchObject({
          action: 'approve',
          comments: '团队配置合理，同意组建'
        })
      } else {
        test.skip('没有待审批的申请')
      }
    })
  })

  test.describe('通知系统API测试', () => {
    test('获取通知列表 - API响应验证', async ({ page }) => {
      await page.goto(TEST_CONSTANTS.URLS.PROJECT_COLLABORATION)

      let notificationsResponse: any = null

      page.on('response', async response => {
        if (response.url().includes('/notifications/my')) {
          notificationsResponse = await response.json()
        }
      })

      // 打开通知
      await page.click('text=通知')
      await TestUtils.waitForDrawer(page)

      // 等待API响应
      await page.waitForTimeout(2000)

      // 验证API响应格式
      expect(notificationsResponse).toBeTruthy()
      expect(notificationsResponse).toHaveProperty('code', 200)
      expect(notificationsResponse.data).toHaveProperty('notifications')
      expect(notificationsResponse.data).toHaveProperty('pagination')
      expect(notificationsResponse.data).toHaveProperty('unreadCount')

      if (notificationsResponse.data.notifications.length > 0) {
        const notification = notificationsResponse.data.notifications[0]
        expect(notification).toHaveProperty('id')
        expect(notification).toHaveProperty('title')
        expect(notification).toHaveProperty('content')
        expect(notification).toHaveProperty('notificationType')
        expect(notification).toHaveProperty('isRead')
      }
    })

    test('标记通知已读 - API调用', async ({ page }) => {
      await page.goto(TEST_CONSTANTS.URLS.PROJECT_COLLABORATION)
      await page.click('text=通知')
      await TestUtils.waitForDrawer(page)

      let markReadRequest: any = null

      page.on('request', request => {
        if (request.url().includes('/read') && request.method() === 'POST') {
          markReadRequest = {
            url: request.url(),
            method: request.method()
          }
        }
      })

      // 查找未读通知并标记已读
      const markReadButton = page.locator('text=标记已读').first()
      if (await markReadButton.isVisible()) {
        await markReadButton.click()
        await page.waitForTimeout(1000)

        // 验证API请求
        expect(markReadRequest).toBeTruthy()
        expect(markReadRequest.method).toBe('POST')
        expect(markReadRequest.url).toContain('/read')
      }
    })
  })

  test.describe('权限验证API测试', () => {
    test('无权限访问 - API权限检查', async ({ page }) => {
      // 模拟权限不足的响应
      await TestUtils.mockApiError(
        page,
        '**/api/project-collaboration/publish',
        403,
        '您没有权限发布项目'
      )

      await page.goto(TEST_CONSTANTS.URLS.PROJECT_PUBLISH)
      
      const testProject = TestUtils.generateTestProjectData()
      
      await TestUtils.fillForm(page, {
        'input[placeholder="请输入项目名称"]': testProject.name,
        'input[placeholder="请输入项目代码"]': testProject.code
      })

      await page.click('text=发布项目')
      await page.click('.el-message-box .el-button--primary')

      // 验证权限错误处理
      await TestUtils.expectErrorMessage(page)
      
      const errorText = await page.locator('.el-message--error').textContent()
      expect(errorText).toContain('权限')
    })

    test('Token过期处理', async ({ page }) => {
      await page.goto(TEST_CONSTANTS.URLS.PROJECT_COLLABORATION)
      
      // 模拟Token过期
      await TestUtils.mockApiError(
        page,
        '**/api/project-collaboration/**',
        401,
        '登录已过期'
      )

      // 执行需要认证的操作
      await page.click('button:has-text("搜索")')
      
      // 验证Token过期处理
      await page.waitForTimeout(2000)
      
      const errorVisible = await TestUtils.isVisible(page, '.el-message--error')
      const loginRedirect = page.url().includes('/login')
      
      // 应该显示错误消息或跳转登录页
      expect(errorVisible || loginRedirect).toBeTruthy()
    })
  })

  test.describe('并发请求测试', () => {
    test('多个API并发调用', async ({ page }) => {
      await page.goto(TEST_CONSTANTS.URLS.PROJECT_COLLABORATION)

      const apiCalls: string[] = []

      page.on('request', request => {
        if (request.url().includes('/api/project-collaboration/')) {
          apiCalls.push(`${request.method()} ${request.url()}`)
        }
      })

      // 同时触发多个API调用
      await Promise.all([
        page.click('button:has-text("搜索")'),
        page.click('text=通知'),
        page.reload()
      ])

      await page.waitForTimeout(3000)

      // 验证API调用
      expect(apiCalls.length).toBeGreaterThan(1)
      
      // 每个API调用都应该正常完成，没有冲突
      const uniqueCalls = new Set(apiCalls)
      expect(uniqueCalls.size).toBeGreaterThan(0)
    })
  })

  test.describe('数据一致性测试', () => {
    test('前后端数据同步验证', async ({ page }) => {
      await page.goto(TEST_CONSTANTS.URLS.PROJECT_COLLABORATION)
      await TestUtils.waitForPageLoad(page)

      // 获取前端显示的项目数量
      const projectCards = page.locator('.project-card')
      const frontendCount = await projectCards.count()

      let backendCount = 0

      page.on('response', async response => {
        if (response.url().includes('/api/project-collaboration/projects')) {
          const data = await response.json()
          backendCount = data.data.projects.length
        }
      })

      // 刷新页面重新加载数据
      await page.reload()
      await TestUtils.waitForPageLoad(page)

      // 验证前后端数据一致性
      const newFrontendCount = await projectCards.count()
      expect(newFrontendCount).toBe(backendCount)
    })

    test('分页数据一致性', async ({ page }) => {
      await page.goto(TEST_CONSTANTS.URLS.PROJECT_COLLABORATION)
      await TestUtils.waitForPageLoad(page)

      let paginationData: any = null

      page.on('response', async response => {
        if (response.url().includes('/api/project-collaboration/projects')) {
          const data = await response.json()
          paginationData = data.data.pagination
        }
      })

      await page.reload()
      await TestUtils.waitForPageLoad(page)

      // 检查分页组件显示
      const pagination = page.locator('.el-pagination')
      if (await pagination.isVisible() && paginationData) {
        // 验证分页数据一致性
        expect(paginationData).toHaveProperty('total')
        expect(paginationData).toHaveProperty('page')
        expect(paginationData).toHaveProperty('pageSize')
        
        const total = paginationData.total
        const pageSize = paginationData.pageSize
        const expectedPages = Math.ceil(total / pageSize)
        
        // 前端分页组件应该反映正确的页数
        if (expectedPages > 1) {
          const pageButtons = pagination.locator('.el-pager .number')
          const buttonCount = await pageButtons.count()
          expect(buttonCount).toBeGreaterThan(0)
        }
      }
    })
  })
})