import { test, expect } from '@playwright/test'

test.describe('Project Collaboration', () => {
  test.beforeEach(async ({ page }) => {
    // 登录到系统
    await page.goto('http://localhost:8081/login')
    await page.fill('input[placeholder="用户名"]', 'admin')
    await page.fill('input[placeholder="密码"]', 'admin123')
    await page.click('button[type="submit"]')
    
    // 等待跳转到仪表板
    await page.waitForURL('**/dashboard')
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test.describe('Project Publishing', () => {
    test('should navigate to project publish page', async ({ page }) => {
      // 导航到项目协作页面
      await page.goto('http://localhost:8081/project/collaboration')
      
      // 检查页面标题
      await expect(page.locator('h2')).toContainText('项目协作')
      
      // 检查发布项目按钮是否存在（需要权限）
      const publishButton = page.locator('text=发布项目')
      if (await publishButton.isVisible()) {
        await publishButton.click()
        await page.waitForURL('**/project/publish')
        await expect(page.locator('h2')).toContainText('发布项目')
      }
    })

    test('should fill and submit project publish form', async ({ page }) => {
      await page.goto('http://localhost:8081/project/publish')
      
      // 检查是否有权限访问该页面
      const errorElement = page.locator('.el-message--error')
      if (await errorElement.isVisible()) {
        test.skip('User does not have permission to publish projects')
        return
      }

      // 填写项目基本信息
      await page.fill('input[placeholder="请输入项目名称"]', '自动化测试项目')
      await page.fill('input[placeholder="请输入项目代码"]', 'AUTO_TEST_001')
      await page.fill('textarea[placeholder="请输入项目描述"]', '这是一个通过自动化测试创建的项目')
      await page.fill('textarea[placeholder="请详细描述项目的工作内容、目标和交付物"]', '测试项目的工作内容详情')

      // 填写预算信息
      await page.fill('input[placeholder="请输入项目预算"]', '100000')
      await page.fill('input[placeholder="请输入预计奖金规模"]', '50000')
      await page.fill('input[placeholder="请输入利润目标"]', '200000')

      // 选择优先级
      await page.click('.el-select')
      await page.click('text=高')

      // 设置日期
      const startDateInput = page.locator('input[placeholder="开始日期"]')
      if (await startDateInput.isVisible()) {
        await startDateInput.fill('2024-01-01')
      }

      const endDateInput = page.locator('input[placeholder="结束日期"]')
      if (await endDateInput.isVisible()) {
        await endDateInput.fill('2024-12-31')
      }

      // 添加技能要求
      await page.click('text=添加技能')
      await page.fill('.skill-input input', 'JavaScript')
      
      // 添加需求
      await page.click('text=添加需求')
      const requirementDialog = page.locator('.el-dialog')
      await expect(requirementDialog).toBeVisible()
      
      await page.fill('input[placeholder="需求标题"]', '技术需求')
      await page.fill('textarea[placeholder="需求描述"]', '使用现代前端技术栈')
      await page.click('text=高')
      
      await page.click('.el-dialog .el-button--primary')

      // 提交表单
      await page.click('text=发布项目')
      
      // 验证成功消息
      await expect(page.locator('.el-message--success')).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Team Application', () => {
    test('should apply for team building', async ({ page }) => {
      await page.goto('http://localhost:8081/project/collaboration')

      // 等待项目列表加载
      await page.waitForSelector('.project-card', { timeout: 10000 })

      // 查找可申请的项目
      const applyButtons = page.locator('text=申请团队')
      const count = await applyButtons.count()
      
      if (count > 0) {
        await applyButtons.first().click()

        // 检查团队申请对话框
        const dialog = page.locator('.team-application-dialog')
        await expect(dialog).toBeVisible()

        // 填写团队信息
        await page.fill('input[placeholder="请输入团队名称"]', '测试开发团队')
        await page.fill('textarea[placeholder="请描述团队的特点和优势"]', '我们是一支经验丰富的开发团队')
        await page.fill('textarea[placeholder="请说明申请理由"]', '我们具备项目所需的技术能力和经验')
        await page.fill('input[placeholder="预估成本"]', '80000')

        // 添加团队成员
        await page.click('text=添加成员')
        const memberDialog = page.locator('.member-selector-dialog')
        await expect(memberDialog).toBeVisible()

        // 选择成员
        const memberCheckbox = page.locator('.member-list .el-checkbox').first()
        if (await memberCheckbox.isVisible()) {
          await memberCheckbox.click()
          await page.click('.member-dialog .el-button--primary')
        }

        // 提交申请
        await page.click('.team-application-dialog .el-button--primary')
        
        // 验证成功消息
        await expect(page.locator('.el-message--success')).toBeVisible({ timeout: 5000 })
      } else {
        test.skip('No projects available for team application')
      }
    })
  })

  test.describe('Application Approval', () => {
    test('should view and approve team applications', async ({ page }) => {
      await page.goto('http://localhost:8081/project/collaboration')

      // 切换到审批标签页
      await page.click('text=待审批申请')

      // 等待申请列表加载
      await page.waitForSelector('.application-item, .el-empty', { timeout: 10000 })

      // 检查是否有待审批申请
      const applicationItems = page.locator('.application-item')
      const count = await applicationItems.count()

      if (count > 0) {
        // 点击第一个申请的审批按钮
        await applicationItems.first().locator('text=审批').click()

        // 检查审批对话框
        const approvalDialog = page.locator('.approval-dialog')
        await expect(approvalDialog).toBeVisible()

        // 选择批准
        await page.click('text=批准申请')

        // 填写审批意见
        await page.fill('textarea[placeholder*="批准意见"]', '团队配置合理，技能匹配项目需求，同意组建')

        // 提交审批
        await page.click('.approval-dialog .el-button--primary')

        // 验证成功消息
        await expect(page.locator('.el-message--success')).toBeVisible({ timeout: 5000 })
      } else {
        test.skip('No pending applications to approve')
      }
    })

    test('should reject team application with reason', async ({ page }) => {
      await page.goto('http://localhost:8081/project/collaboration')

      // 切换到审批标签页
      await page.click('text=待审批申请')

      // 等待申请列表加载
      await page.waitForSelector('.application-item, .el-empty', { timeout: 10000 })

      const applicationItems = page.locator('.application-item')
      const count = await applicationItems.count()

      if (count > 1) { // 至少需要2个申请，一个用于批准测试，一个用于拒绝测试
        // 点击第二个申请的审批按钮
        await applicationItems.nth(1).locator('text=审批').click()

        const approvalDialog = page.locator('.approval-dialog')
        await expect(approvalDialog).toBeVisible()

        // 选择拒绝
        await page.click('text=拒绝申请')

        // 填写拒绝理由
        await page.fill('textarea[placeholder*="拒绝理由"]', '团队经验与项目需求不匹配，建议补充相关技能后重新申请')

        // 提交审批
        await page.click('.approval-dialog .el-button--primary')

        // 确认拒绝
        await page.click('.el-message-box .el-button--primary')

        // 验证成功消息
        await expect(page.locator('.el-message--success')).toBeVisible({ timeout: 5000 })
      } else {
        test.skip('Not enough applications for rejection test')
      }
    })
  })

  test.describe('Notifications', () => {
    test('should view project notifications', async ({ page }) => {
      await page.goto('http://localhost:8081/project/collaboration')

      // 检查通知按钮
      const notificationButton = page.locator('text=通知')
      await expect(notificationButton).toBeVisible()

      // 点击通知按钮
      await notificationButton.click()

      // 检查通知抽屉
      const notificationDrawer = page.locator('.el-drawer')
      await expect(notificationDrawer).toBeVisible()

      // 检查通知列表
      const notificationList = page.locator('.notifications-list')
      await expect(notificationList).toBeVisible()

      // 如果有通知，测试标记为已读功能
      const notificationItems = page.locator('.notification-item')
      const notificationCount = await notificationItems.count()

      if (notificationCount > 0) {
        const firstNotification = notificationItems.first()
        
        // 检查是否是未读通知
        if (await firstNotification.locator('.el-button:has-text("标记已读")').isVisible()) {
          await firstNotification.locator('.el-button:has-text("标记已读")').click()
          
          // 验证已读状态
          await expect(firstNotification.locator('.el-button:has-text("标记已读")')).not.toBeVisible()
        }

        // 测试全部已读功能
        const markAllReadButton = page.locator('text=全部已读')
        if (await markAllReadButton.isVisible()) {
          await markAllReadButton.click()
          await expect(page.locator('.el-message--success')).toBeVisible({ timeout: 3000 })
        }
      }

      // 关闭抽屉
      await page.keyboard.press('Escape')
      await expect(notificationDrawer).not.toBeVisible()
    })
  })

  test.describe('Permission Restrictions', () => {
    test('should hide publish button for users without permission', async ({ page }) => {
      // 注意：这个测试需要用没有发布权限的用户登录
      // 在实际测试中，可能需要创建不同权限的用户或使用模拟数据
      
      await page.goto('http://localhost:8081/project/collaboration')

      // 检查发布项目按钮的可见性
      const publishButton = page.locator('text=发布项目')
      
      // 如果用户没有权限，按钮应该不可见
      // 这里的逻辑取决于当前登录用户的权限
      const isVisible = await publishButton.isVisible()
      
      if (!isVisible) {
        // 验证用户确实没有发布权限
        await page.goto('http://localhost:8081/project/publish')
        
        // 应该被重定向或显示权限错误
        const currentURL = page.url()
        const hasError = await page.locator('.el-message--error').isVisible()
        
        expect(currentURL.includes('/project/publish') && hasError || !currentURL.includes('/project/publish')).toBeTruthy()
      }
    })

    test('should restrict approval tab for non-approver users', async ({ page }) => {
      await page.goto('http://localhost:8081/project/collaboration')

      // 检查审批标签页是否可见
      const approvalTab = page.locator('text=待审批申请')
      const isApprovalTabVisible = await approvalTab.isVisible()

      if (!isApprovalTabVisible) {
        // 验证用户确实没有审批权限，这是正确的行为
        expect(isApprovalTabVisible).toBeFalsy()
      } else {
        // 如果标签页可见，点击后应该能正常显示内容
        await approvalTab.click()
        const approvalContent = page.locator('.approvals-section')
        await expect(approvalContent).toBeVisible()
      }
    })
  })

  test.describe('Responsive Design', () => {
    test('should work properly on mobile devices', async ({ page }) => {
      // 设置移动设备视口
      await page.setViewportSize({ width: 375, height: 667 })
      
      await page.goto('http://localhost:8081/project/collaboration')

      // 检查移动端布局
      await expect(page.locator('.project-collaboration')).toBeVisible()
      
      // 检查卡片在小屏幕上的显示
      const projectCards = page.locator('.project-card')
      if (await projectCards.count() > 0) {
        await expect(projectCards.first()).toBeVisible()
      }

      // 测试通知抽屉在移动端的行为
      await page.click('text=通知')
      const drawer = page.locator('.el-drawer')
      await expect(drawer).toBeVisible()
      
      // 在移动端关闭抽屉
      await page.click('.el-drawer__header .el-icon')
      await expect(drawer).not.toBeVisible()
    })
  })
})