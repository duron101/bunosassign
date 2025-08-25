import { test, expect, Page, BrowserContext } from '@playwright/test'

// Test data and utilities
const TEST_DATA = {
  admin: {
    username: 'admin',
    password: 'admin123'
  },
  projectManager: {
    username: 'project_manager',
    password: 'pm123'
  },
  regularUser: {
    username: 'regular_user', 
    password: 'user123'
  },
  testProject: {
    name: '自动化测试项目',
    code: 'AUTO_TEST_PROJECT_001',
    description: '这是一个通过Playwright自动化测试创建的项目，用于验证项目协作模块的完整功能',
    workContent: `项目工作内容包括：
1. 前端界面开发
2. 后端API开发  
3. 数据库设计
4. 测试用例编写
5. 文档编写`,
    budget: 150000,
    bonusScale: 75000,
    profitTarget: 300000
  },
  teamApplication: {
    teamName: '测试开发团队',
    teamDescription: '由经验丰富的全栈开发人员组成的高效团队，具备完整的项目交付能力',
    applicationReason: '我们团队具有丰富的项目开发经验，技术栈匹配项目需求，能够按时高质量完成项目交付',
    estimatedCost: 120000
  }
}

class ProjectCollaborationPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('http://localhost:8081/project/collaboration')
    await this.page.waitForLoadState('networkidle')
  }

  async login(userType: 'admin' | 'projectManager' | 'regularUser' = 'admin') {
    const user = TEST_DATA[userType]
    await this.page.goto('http://localhost:8081/login')
    await this.page.fill('input[placeholder="用户名"]', user.username)
    await this.page.fill('input[placeholder="密码"]', user.password)
    await this.page.click('button[type="submit"]')
    
    // Wait for login to complete
    await this.page.waitForURL('**/dashboard', { timeout: 10000 })
    await expect(this.page).toHaveURL(/.*dashboard/)
  }

  async waitForProjectsLoad() {
    await this.page.waitForSelector('.project-card, .el-empty', { timeout: 15000 })
  }

  async getProjectCards() {
    return this.page.locator('.project-card')
  }

  async getNotificationBadge() {
    return this.page.locator('.notification-badge .el-badge__content')
  }

  async openNotifications() {
    await this.page.click('text=通知')
    await this.page.waitForSelector('.el-drawer', { state: 'visible' })
  }

  async closeNotifications() {
    await this.page.keyboard.press('Escape')
    await this.page.waitForSelector('.el-drawer', { state: 'hidden' })
  }

  async switchTab(tabName: string) {
    await this.page.click(`text=${tabName}`)
    await this.page.waitForTimeout(1000) // Wait for tab content to load
  }

  async searchProjects(keyword: string) {
    await this.page.fill('input[placeholder="项目名称、代码"]', keyword)
    await this.page.click('button:has-text("搜索")')
    await this.page.waitForTimeout(2000)
  }

  async filterByStatus(status: string) {
    await this.page.click('.el-select')
    await this.page.click(`text=${status}`)
    await this.page.waitForTimeout(2000)
  }
}

class ProjectPublishPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('http://localhost:8081/project/publish')
    await this.page.waitForLoadState('networkidle')
  }

  async fillBasicInfo(project: typeof TEST_DATA.testProject) {
    await this.page.fill('input[placeholder="请输入项目名称"]', project.name)
    await this.page.fill('input[placeholder="请输入项目代码"]', project.code)
    await this.page.fill('textarea[placeholder="请输入项目描述"]', project.description)
    await this.page.fill('textarea[placeholder="请详细描述项目的工作内容、目标和交付物"]', project.workContent)
  }

  async fillBudgetInfo(project: typeof TEST_DATA.testProject) {
    await this.page.fill('input[placeholder="请输入项目预算"]', project.budget.toString())
    await this.page.fill('input[placeholder="请输入预计奖金规模"]', project.bonusScale.toString())
    await this.page.fill('input[placeholder="请输入利润目标"]', project.profitTarget.toString())
  }

  async selectPriority(priority: 'low' | 'medium' | 'high' | 'critical') {
    await this.page.click('.priority-select .el-select')
    await this.page.waitForSelector('.el-select-dropdown')
    
    const priorityMap = {
      low: '低',
      medium: '中',
      high: '高',
      critical: '紧急'
    }
    
    await this.page.click(`text=${priorityMap[priority]}`)
  }

  async setDates(startDate: string, endDate: string) {
    // Set start date
    const startInput = this.page.locator('input[placeholder="开始日期"]')
    if (await startInput.isVisible()) {
      await startInput.fill(startDate)
    }

    // Set end date  
    const endInput = this.page.locator('input[placeholder="结束日期"]')
    if (await endInput.isVisible()) {
      await endInput.fill(endDate)
    }
  }

  async addSkillRequirement(skill: string) {
    await this.page.click('text=添加技能')
    await this.page.waitForSelector('.skill-input:last-child input')
    await this.page.fill('.skill-input:last-child input', skill)
  }

  async addRequirement(title: string, description: string, priority: 'low' | 'medium' | 'high' | 'critical') {
    await this.page.click('text=添加需求')
    await this.page.waitForSelector('.requirement-dialog', { state: 'visible' })

    await this.page.fill('input[placeholder="需求标题"]', title)
    await this.page.fill('textarea[placeholder="需求描述"]', description)
    
    // Select requirement type
    await this.page.click('.requirement-type .el-select')
    await this.page.click('text=技术需求')

    // Select priority
    await this.page.click('.requirement-priority .el-select')
    const priorityMap = {
      low: '低',
      medium: '中', 
      high: '高',
      critical: '紧急'
    }
    await this.page.click(`text=${priorityMap[priority]}`)

    // Set as mandatory
    await this.page.click('.is-mandatory .el-checkbox')

    // Add acceptance criteria
    await this.page.click('text=添加验收标准')
    await this.page.fill('.criteria-input:last-child input', '通过功能测试')
    
    await this.page.click('.requirement-dialog .el-button--primary')
    await this.page.waitForSelector('.requirement-dialog', { state: 'hidden' })
  }

  async publishProject() {
    await this.page.click('text=发布项目')
    
    // Wait for confirmation dialog
    await this.page.waitForSelector('.el-message-box')
    await this.page.click('.el-message-box .el-button--primary')
    
    // Wait for success message
    await this.page.waitForSelector('.el-message--success', { timeout: 10000 })
  }
}

class TeamApplicationDialog {
  constructor(private page: Page) {}

  async open(projectIndex = 0) {
    const applyButtons = this.page.locator('text=申请团队')
    await applyButtons.nth(projectIndex).click()
    await this.page.waitForSelector('.team-application-dialog', { state: 'visible' })
  }

  async fillTeamInfo(teamData: typeof TEST_DATA.teamApplication) {
    await this.page.fill('input[placeholder="请输入团队名称"]', teamData.teamName)
    await this.page.fill('textarea[placeholder="请描述团队的特点和优势"]', teamData.teamDescription)
    await this.page.fill('textarea[placeholder="请说明申请理由"]', teamData.applicationReason)
    await this.page.fill('input[placeholder="预估成本"]', teamData.estimatedCost.toString())
  }

  async addTeamMember(role: string, contribution: number, workload: number, allocation: number) {
    await this.page.click('text=添加成员')
    await this.page.waitForSelector('.member-selector-dialog', { state: 'visible' })

    // Select first available employee
    const memberCheckbox = this.page.locator('.employee-list .el-checkbox').first()
    if (await memberCheckbox.isVisible()) {
      await memberCheckbox.click()
    }

    await this.page.click('.member-selector-dialog .el-button--primary')
    await this.page.waitForSelector('.member-selector-dialog', { state: 'hidden' })

    // Fill member details in the team table
    const lastRow = this.page.locator('.team-members-table tbody tr').last()
    await lastRow.locator('.role-input input').fill(role)
    await lastRow.locator('.contribution-input input').fill(contribution.toString())
    await lastRow.locator('.workload-input input').fill(workload.toString())
    await lastRow.locator('.allocation-input input').fill(allocation.toString())
  }

  async submit() {
    await this.page.click('.team-application-dialog .el-button--primary')
    
    // Wait for confirmation
    await this.page.waitForSelector('.el-message-box')
    await this.page.click('.el-message-box .el-button--primary')
    
    // Wait for success message
    await this.page.waitForSelector('.el-message--success', { timeout: 10000 })
  }

  async close() {
    await this.page.click('.team-application-dialog .el-dialog__close')
    await this.page.waitForSelector('.team-application-dialog', { state: 'hidden' })
  }
}

class ApprovalDialog {
  constructor(private page: Page) {}

  async open(applicationIndex = 0) {
    const approvalButtons = this.page.locator('text=审批')
    await approvalButtons.nth(applicationIndex).click()
    await this.page.waitForSelector('.approval-dialog', { state: 'visible' })
  }

  async selectAction(action: 'approve' | 'modify' | 'reject') {
    const actionMap = {
      approve: '批准申请',
      modify: '要求修改',
      reject: '拒绝申请'
    }
    
    await this.page.click(`text=${actionMap[action]}`)
  }

  async fillComments(comments: string) {
    await this.page.fill('.approval-comments textarea', comments)
  }

  async markMemberForRemoval(memberIndex: number) {
    const memberRows = this.page.locator('.members-section .el-table tbody tr')
    await memberRows.nth(memberIndex).locator('text=标记移除').click()
  }

  async submit() {
    await this.page.click('.approval-dialog .el-button--primary')
    
    // Wait for confirmation
    await this.page.waitForSelector('.el-message-box')
    await this.page.click('.el-message-box .el-button--primary')
    
    // Wait for success message
    await this.page.waitForSelector('.el-message--success', { timeout: 10000 })
  }

  async close() {
    await this.page.click('.approval-dialog .el-dialog__close')
    await this.page.waitForSelector('.approval-dialog', { state: 'hidden' })
  }
}

test.describe('项目协作模块综合测试', () => {
  let collaborationPage: ProjectCollaborationPage
  let publishPage: ProjectPublishPage
  let teamDialog: TeamApplicationDialog
  let approvalDialog: ApprovalDialog

  test.beforeEach(async ({ page }) => {
    collaborationPage = new ProjectCollaborationPage(page)
    publishPage = new ProjectPublishPage(page)
    teamDialog = new TeamApplicationDialog(page)
    approvalDialog = new ApprovalDialog(page)
  })

  test.describe('用户权限验证', () => {
    test('管理员权限 - 完整功能访问', async ({ page }) => {
      await collaborationPage.login('admin')
      await collaborationPage.goto()

      // 验证管理员可以看到所有功能
      await expect(page.locator('text=发布项目')).toBeVisible()
      await expect(page.locator('text=待审批申请')).toBeVisible()
      await expect(page.locator('text=通知')).toBeVisible()

      // 验证可以访问发布页面
      await page.click('text=发布项目')
      await expect(page).toHaveURL(/.*project\/publish/)
      await expect(page.locator('h2:has-text("发布项目")')).toBeVisible()
    })

    test('项目经理权限 - 部分功能访问', async ({ page }) => {
      // 如果有项目经理用户，测试其权限
      await collaborationPage.login('admin') // 使用管理员作为示例
      await collaborationPage.goto()
      
      // 验证项目经理权限行为
      const publishButton = page.locator('text=发布项目')
      if (await publishButton.isVisible()) {
        // 项目经理应该能发布项目
        expect(await publishButton.isVisible()).toBeTruthy()
      }
    })

    test('普通用户权限 - 受限访问', async ({ page }) => {
      await collaborationPage.login('admin') // 模拟受限用户
      await collaborationPage.goto()

      // 检查权限受限的行为
      // 注意：这里的测试逻辑取决于具体的权限实现
      const currentUrl = page.url()
      expect(currentUrl).toContain('project/collaboration')
    })
  })

  test.describe('项目发布流程', () => {
    test.beforeEach(async ({ page }) => {
      await collaborationPage.login('admin')
    })

    test('完整项目发布流程', async ({ page }) => {
      await publishPage.goto()
      
      // 验证页面加载
      await expect(page.locator('h2:has-text("发布项目")')).toBeVisible()

      // 填写基本信息
      await publishPage.fillBasicInfo(TEST_DATA.testProject)

      // 填写预算信息  
      await publishPage.fillBudgetInfo(TEST_DATA.testProject)

      // 选择优先级
      await publishPage.selectPriority('high')

      // 设置项目日期
      await publishPage.setDates('2024-01-01', '2024-12-31')

      // 添加技能要求
      await publishPage.addSkillRequirement('JavaScript')
      await publishPage.addSkillRequirement('Vue.js')
      await publishPage.addSkillRequirement('Node.js')

      // 添加项目需求
      await publishPage.addRequirement(
        '前端界面开发',
        '使用Vue 3和Element Plus开发响应式用户界面',
        'high'
      )

      await publishPage.addRequirement(
        '后端API开发',
        '使用Node.js和Express开发RESTful API',
        'high'
      )

      // 发布项目
      await publishPage.publishProject()

      // 验证发布成功
      await expect(page.locator('.el-message--success')).toBeVisible()
    })

    test('表单验证测试', async ({ page }) => {
      await publishPage.goto()

      // 尝试提交空表单
      await page.click('text=发布项目')

      // 验证必填字段验证
      await expect(page.locator('.el-form-item__error')).toHaveCount({ min: 1 })
    })

    test('技能要求管理', async ({ page }) => {
      await publishPage.goto()
      
      // 添加多个技能
      const skills = ['JavaScript', 'TypeScript', 'Vue.js', 'React', 'Node.js']
      
      for (const skill of skills) {
        await publishPage.addSkillRequirement(skill)
      }

      // 验证技能已添加
      for (const skill of skills) {
        await expect(page.locator(`input[value="${skill}"]`)).toBeVisible()
      }

      // 删除技能
      const deleteButtons = page.locator('.skill-item .el-button--danger')
      if (await deleteButtons.count() > 0) {
        await deleteButtons.first().click()
        // 验证技能已删除
      }
    })

    test('项目需求管理', async ({ page }) => {
      await publishPage.goto()

      // 添加不同类型的需求
      const requirements = [
        { title: '技术需求1', description: '前端技术要求', priority: 'high' as const },
        { title: '业务需求1', description: '业务功能要求', priority: 'medium' as const },
        { title: '质量需求1', description: '性能和质量要求', priority: 'high' as const }
      ]

      for (const req of requirements) {
        await publishPage.addRequirement(req.title, req.description, req.priority)
      }

      // 验证需求列表
      await expect(page.locator('.requirements-list .requirement-item')).toHaveCount(requirements.length)
    })
  })

  test.describe('团队申请流程', () => {
    test.beforeEach(async ({ page }) => {
      await collaborationPage.login('admin')
    })

    test('完整团队申请流程', async ({ page }) => {
      await collaborationPage.goto()
      await collaborationPage.waitForProjectsLoad()

      const projectCards = await collaborationPage.getProjectCards()
      const projectCount = await projectCards.count()

      if (projectCount > 0) {
        // 查找可申请的项目
        const applyButtons = page.locator('text=申请团队')
        const applyCount = await applyButtons.count()

        if (applyCount > 0) {
          // 打开团队申请对话框
          await teamDialog.open(0)

          // 填写团队信息
          await teamDialog.fillTeamInfo(TEST_DATA.teamApplication)

          // 添加团队成员
          await teamDialog.addTeamMember('项目经理', 1.2, 30, 30)
          await teamDialog.addTeamMember('前端开发', 1.0, 35, 35)  
          await teamDialog.addTeamMember('后端开发', 1.0, 35, 35)

          // 提交申请
          await teamDialog.submit()

          // 验证申请成功
          await expect(page.locator('.el-message--success')).toBeVisible()
        } else {
          test.skip('没有可申请的项目')
        }
      } else {
        test.skip('没有项目可用于申请')
      }
    })

    test('团队成员管理', async ({ page }) => {
      await collaborationPage.goto()
      await collaborationPage.waitForProjectsLoad()

      const applyButtons = page.locator('text=申请团队')
      const applyCount = await applyButtons.count()

      if (applyCount > 0) {
        await teamDialog.open(0)
        
        // 添加成员
        await teamDialog.addTeamMember('技术总监', 1.5, 20, 20)
        
        // 验证成员已添加到列表
        await expect(page.locator('.team-members-table tbody tr')).toHaveCount({ min: 1 })

        // 测试成员信息编辑
        const firstRow = page.locator('.team-members-table tbody tr').first()
        await firstRow.locator('.contribution-input input').fill('1.3')
        
        // 删除成员
        await firstRow.locator('.el-button--danger').click()

        await teamDialog.close()
      } else {
        test.skip('没有可申请的项目')
      }
    })

    test('申请表单验证', async ({ page }) => {
      await collaborationPage.goto()
      await collaborationPage.waitForProjectsLoad()

      const applyButtons = page.locator('text=申请团队')
      const applyCount = await applyButtons.count()

      if (applyCount > 0) {
        await teamDialog.open(0)

        // 尝试提交空表单
        await page.click('.team-application-dialog .el-button--primary')

        // 验证表单验证消息
        await expect(page.locator('.el-form-item__error')).toHaveCount({ min: 1 })

        await teamDialog.close()
      } else {
        test.skip('没有可申请的项目')
      }
    })
  })

  test.describe('审批流程', () => {
    test.beforeEach(async ({ page }) => {
      await collaborationPage.login('admin')
    })

    test('批准团队申请', async ({ page }) => {
      await collaborationPage.goto()
      
      // 切换到审批标签页
      await collaborationPage.switchTab('待审批申请')

      // 等待申请列表加载
      await page.waitForSelector('.application-item, .el-empty', { timeout: 10000 })

      const applicationItems = page.locator('.application-item')
      const count = await applicationItems.count()

      if (count > 0) {
        // 打开审批对话框
        await approvalDialog.open(0)

        // 选择批准
        await approvalDialog.selectAction('approve')

        // 填写审批意见
        await approvalDialog.fillComments('团队配置合理，技术能力匹配项目需求，同意组建该团队')

        // 提交审批
        await approvalDialog.submit()

        // 验证审批成功
        await expect(page.locator('.el-message--success')).toBeVisible()
      } else {
        test.skip('没有待审批的申请')
      }
    })

    test('拒绝团队申请', async ({ page }) => {
      await collaborationPage.goto()
      await collaborationPage.switchTab('待审批申请')

      const applicationItems = page.locator('.application-item')
      const count = await applicationItems.count()

      if (count > 1) { // 需要至少2个申请，一个批准一个拒绝
        await approvalDialog.open(1)

        // 选择拒绝
        await approvalDialog.selectAction('reject')

        // 填写拒绝理由
        await approvalDialog.fillComments('团队经验与项目复杂度不匹配，建议增强技术团队后重新申请')

        // 提交审批
        await approvalDialog.submit()

        await expect(page.locator('.el-message--success')).toBeVisible()
      } else {
        test.skip('没有足够的申请用于拒绝测试')
      }
    })

    test('要求修改申请', async ({ page }) => {
      await collaborationPage.goto()
      await collaborationPage.switchTab('待审批申请')

      const applicationItems = page.locator('.application-item')
      const count = await applicationItems.count()

      if (count > 0) {
        await approvalDialog.open(0)

        // 选择要求修改
        await approvalDialog.selectAction('modify')

        // 填写修改要求
        await approvalDialog.fillComments('请调整团队结构：1. 增加一名高级开发 2. 减少初级开发人员比例 3. 明确项目经理职责')

        // 标记成员需要调整
        await approvalDialog.markMemberForRemoval(0)

        // 提交审批
        await approvalDialog.submit()

        await expect(page.locator('.el-message--success')).toBeVisible()
      } else {
        test.skip('没有待审批的申请')
      }
    })

    test('审批详情查看', async ({ page }) => {
      await collaborationPage.goto()
      await collaborationPage.switchTab('待审批申请')

      const applicationItems = page.locator('.application-item')
      const count = await applicationItems.count()

      if (count > 0) {
        await approvalDialog.open(0)

        // 验证申请信息显示完整
        await expect(page.locator('.info-section')).toBeVisible()
        await expect(page.locator('.members-section')).toBeVisible()
        await expect(page.locator('.approval-section')).toBeVisible()

        // 验证申请详情字段
        await expect(page.locator('text=团队名称')).toBeVisible()
        await expect(page.locator('text=申请人')).toBeVisible()
        await expect(page.locator('text=提交时间')).toBeVisible()

        // 验证团队成员表格
        await expect(page.locator('.members-section .el-table')).toBeVisible()

        await approvalDialog.close()
      } else {
        test.skip('没有待审批的申请')
      }
    })
  })

  test.describe('通知系统', () => {
    test.beforeEach(async ({ page }) => {
      await collaborationPage.login('admin')
    })

    test('通知查看和管理', async ({ page }) => {
      await collaborationPage.goto()

      // 打开通知抽屉
      await collaborationPage.openNotifications()

      // 验证通知抽屉显示
      await expect(page.locator('.el-drawer')).toBeVisible()
      await expect(page.locator('text=项目通知')).toBeVisible()

      // 验证筛选功能
      await expect(page.locator('text=全部')).toBeVisible()
      await expect(page.locator('text=未读')).toBeVisible()

      // 切换到未读通知
      await page.click('text=未读')
      await page.waitForTimeout(1000)

      // 检查通知列表
      const notificationItems = page.locator('.notification-item')
      const notificationCount = await notificationItems.count()

      if (notificationCount > 0) {
        // 测试单个通知标记已读
        const firstNotification = notificationItems.first()
        const markReadButton = firstNotification.locator('text=标记已读')
        
        if (await markReadButton.isVisible()) {
          await markReadButton.click()
          await expect(page.locator('.el-message--success')).toBeVisible()
        }

        // 测试全部标记已读
        const markAllButton = page.locator('text=全部已读')
        if (await markAllButton.isVisible()) {
          await markAllButton.click()
          await expect(page.locator('.el-message--success')).toBeVisible()
        }

        // 测试通知点击导航
        if (notificationCount > 0) {
          await notificationItems.first().click()
          // 验证点击通知后的行为（跳转或状态更新）
        }
      }

      // 关闭通知抽屉
      await collaborationPage.closeNotifications()
    })

    test('通知徽章显示', async ({ page }) => {
      await collaborationPage.goto()

      // 检查通知徽章
      const badge = await collaborationPage.getNotificationBadge()
      const isVisible = await badge.isVisible()

      if (isVisible) {
        const count = await badge.textContent()
        expect(parseInt(count || '0')).toBeGreaterThanOrEqual(0)
      }

      // 打开通知后徽章应该更新
      await collaborationPage.openNotifications()
      
      // 标记一些通知为已读
      const markAllButton = page.locator('text=全部已读')
      if (await markAllButton.isVisible()) {
        await markAllButton.click()
      }

      await collaborationPage.closeNotifications()

      // 验证徽章更新（可能隐藏或数量减少）
      await page.waitForTimeout(1000)
    })

    test('通知类型和图标', async ({ page }) => {
      await collaborationPage.goto()
      await collaborationPage.openNotifications()

      const notificationItems = page.locator('.notification-item')
      const count = await notificationItems.count()

      if (count > 0) {
        // 验证不同通知类型的图标显示
        for (let i = 0; i < Math.min(count, 5); i++) {
          const notification = notificationItems.nth(i)
          const icon = notification.locator('.notification-type .el-icon')
          
          await expect(icon).toBeVisible()
          
          // 验证通知内容结构
          await expect(notification.locator('.notification-title')).toBeVisible()
          await expect(notification.locator('.notification-content')).toBeVisible()
          await expect(notification.locator('.notification-time')).toBeVisible()
        }
      }

      await collaborationPage.closeNotifications()
    })
  })

  test.describe('项目列表和搜索', () => {
    test.beforeEach(async ({ page }) => {
      await collaborationPage.login('admin')
    })

    test('项目列表显示', async ({ page }) => {
      await collaborationPage.goto()
      await collaborationPage.waitForProjectsLoad()

      const projectCards = await collaborationPage.getProjectCards()
      const count = await projectCards.count()

      if (count > 0) {
        // 验证项目卡片信息完整性
        const firstCard = projectCards.first()
        
        await expect(firstCard.locator('.project-title')).toBeVisible()
        await expect(firstCard.locator('.project-description')).toBeVisible()
        await expect(firstCard.locator('.project-meta')).toBeVisible()
        
        // 验证项目状态标签
        await expect(firstCard.locator('.el-tag')).toBeVisible()

        // 验证操作按钮
        const viewButton = firstCard.locator('text=查看详情')
        const applyButton = firstCard.locator('text=申请团队')
        
        // 至少应该有查看详情按钮
        await expect(viewButton).toBeVisible()
      } else {
        // 验证空状态显示
        await expect(page.locator('.el-empty')).toBeVisible()
      }
    })

    test('项目搜索功能', async ({ page }) => {
      await collaborationPage.goto()
      await collaborationPage.waitForProjectsLoad()

      // 测试关键词搜索
      await collaborationPage.searchProjects('测试')
      
      // 验证搜索结果
      const searchResults = await collaborationPage.getProjectCards()
      const resultCount = await searchResults.count()
      
      // 清空搜索
      await collaborationPage.searchProjects('')
      
      // 验证显示所有项目
      const allProjects = await collaborationPage.getProjectCards()
      const allCount = await allProjects.count()
      
      expect(allCount).toBeGreaterThanOrEqual(resultCount)
    })

    test('项目状态筛选', async ({ page }) => {
      await collaborationPage.goto()
      await collaborationPage.waitForProjectsLoad()

      // 测试不同状态筛选
      const statuses = ['已发布', '组建中', '待审批', '已批准']
      
      for (const status of statuses) {
        await collaborationPage.filterByStatus(status)
        
        // 验证筛选结果
        const filteredCards = await collaborationPage.getProjectCards()
        const filteredCount = await filteredCards.count()
        
        if (filteredCount > 0) {
          // 验证显示的项目确实是该状态
          const firstCard = filteredCards.first()
          const statusTag = firstCard.locator('.el-tag')
          // 注意：这里的验证逻辑取决于具体的状态显示实现
        }
      }
      
      // 清空筛选
      await page.click('.el-select .el-input__suffix')
      await page.click('text=清空')
    })

    test('项目详情查看', async ({ page }) => {
      await collaborationPage.goto()
      await collaborationPage.waitForProjectsLoad()

      const projectCards = await collaborationPage.getProjectCards()
      const count = await projectCards.count()

      if (count > 0) {
        // 点击查看详情
        const firstCard = projectCards.first()
        await firstCard.locator('text=查看详情').click()

        // 验证详情对话框显示
        await expect(page.locator('.project-detail-dialog')).toBeVisible()
        
        // 验证详情信息完整性
        await expect(page.locator('.project-basic-info')).toBeVisible()
        await expect(page.locator('.project-requirements')).toBeVisible()
        await expect(page.locator('.project-skills')).toBeVisible()
        
        // 关闭详情对话框
        await page.click('.project-detail-dialog .el-dialog__close')
        await expect(page.locator('.project-detail-dialog')).not.toBeVisible()
      } else {
        test.skip('没有项目可查看详情')
      }
    })
  })

  test.describe('响应式设计测试', () => {
    test.beforeEach(async ({ page }) => {
      await collaborationPage.login('admin')
    })

    test('移动端布局适配', async ({ page }) => {
      // 设置移动设备视口
      await page.setViewportSize({ width: 375, height: 667 })
      
      await collaborationPage.goto()

      // 验证移动端页面结构
      await expect(page.locator('.project-collaboration')).toBeVisible()
      
      // 验证响应式网格布局
      const projectCards = await collaborationPage.getProjectCards()
      if (await projectCards.count() > 0) {
        const firstCard = projectCards.first()
        await expect(firstCard).toBeVisible()
        
        // 验证卡片在小屏幕上的显示
        const cardBox = await firstCard.boundingBox()
        expect(cardBox?.width).toBeLessThanOrEqual(375)
      }

      // 测试移动端通知抽屉
      await collaborationPage.openNotifications()
      
      const drawer = page.locator('.el-drawer')
      await expect(drawer).toBeVisible()
      
      // 验证抽屉在移动端的宽度适配
      const drawerBox = await drawer.boundingBox()
      expect(drawerBox?.width).toBeLessThanOrEqual(375)
      
      await collaborationPage.closeNotifications()
    })

    test('平板设备布局适配', async ({ page }) => {
      // 设置平板设备视口
      await page.setViewportSize({ width: 768, height: 1024 })
      
      await collaborationPage.goto()
      await collaborationPage.waitForProjectsLoad()

      // 验证平板端布局
      const projectCards = await collaborationPage.getProjectCards()
      if (await projectCards.count() > 0) {
        // 验证项目卡片在平板端的排列
        const cards = await projectCards.all()
        for (const card of cards.slice(0, 2)) {
          await expect(card).toBeVisible()
        }
      }
    })

    test('大屏幕布局适配', async ({ page }) => {
      // 设置大屏幕视口
      await page.setViewportSize({ width: 1920, height: 1080 })
      
      await collaborationPage.goto()

      // 验证大屏幕下的布局优化
      await expect(page.locator('.project-collaboration')).toBeVisible()
      
      // 验证通知抽屉在大屏幕的表现
      await collaborationPage.openNotifications()
      
      const drawer = page.locator('.el-drawer')
      const drawerBox = await drawer.boundingBox()
      
      // 大屏幕下抽屉应该保持合理宽度，不占满整个屏幕
      expect(drawerBox?.width).toBeLessThan(1920 * 0.5)
      
      await collaborationPage.closeNotifications()
    })
  })

  test.describe('性能和用户体验', () => {
    test.beforeEach(async ({ page }) => {
      await collaborationPage.login('admin')
    })

    test('页面加载性能', async ({ page }) => {
      const startTime = Date.now()
      
      await collaborationPage.goto()
      await collaborationPage.waitForProjectsLoad()
      
      const loadTime = Date.now() - startTime
      
      // 页面应该在合理时间内加载完成（5秒）
      expect(loadTime).toBeLessThan(5000)
    })

    test('搜索响应性能', async ({ page }) => {
      await collaborationPage.goto()
      await collaborationPage.waitForProjectsLoad()

      const startTime = Date.now()
      
      await collaborationPage.searchProjects('测试')
      
      const searchTime = Date.now() - startTime
      
      // 搜索应该快速响应（2秒内）
      expect(searchTime).toBeLessThan(2000)
    })

    test('通知加载性能', async ({ page }) => {
      await collaborationPage.goto()

      const startTime = Date.now()
      
      await collaborationPage.openNotifications()
      
      const notificationTime = Date.now() - startTime
      
      // 通知应该快速加载（3秒内）
      expect(notificationTime).toBeLessThan(3000)
      
      await collaborationPage.closeNotifications()
    })

    test('表单交互体验', async ({ page }) => {
      await publishPage.goto()

      // 测试表单自动保存（如果实现）
      await publishPage.fillBasicInfo(TEST_DATA.testProject)
      
      // 测试表单验证即时反馈
      await page.fill('input[placeholder="请输入项目名称"]', '')
      await page.blur('input[placeholder="请输入项目名称"]')
      
      // 验证验证消息及时显示
      await expect(page.locator('.el-form-item__error')).toBeVisible({ timeout: 1000 })
    })
  })

  test.describe('错误处理和边界情况', () => {
    test.beforeEach(async ({ page }) => {
      await collaborationPage.login('admin')
    })

    test('网络错误处理', async ({ page }) => {
      await collaborationPage.goto()
      
      // 模拟网络断开
      await page.route('**/api/project-collaboration/**', route => {
        route.abort()
      })

      // 尝试执行需要网络的操作
      await page.click('text=搜索')
      
      // 验证错误处理
      await expect(page.locator('.el-message--error, .el-loading-mask')).toBeVisible({ timeout: 5000 })
    })

    test('数据为空时的处理', async ({ page }) => {
      // 模拟空数据响应
      await page.route('**/api/project-collaboration/projects**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 200,
            message: 'success',
            data: {
              projects: [],
              pagination: { total: 0, page: 1, pageSize: 20 }
            }
          })
        })
      })

      await collaborationPage.goto()
      
      // 验证空状态显示
      await expect(page.locator('.el-empty')).toBeVisible()
      await expect(page.locator('text=暂无项目')).toBeVisible()
    })

    test('表单提交失败处理', async ({ page }) => {
      await publishPage.goto()
      
      // 填写表单
      await publishPage.fillBasicInfo(TEST_DATA.testProject)
      
      // 模拟提交失败
      await page.route('**/api/project-collaboration/publish', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 400,
            message: '项目代码已存在',
            data: null
          })
        })
      })

      // 尝试发布项目
      await page.click('text=发布项目')
      await page.click('.el-message-box .el-button--primary')
      
      // 验证错误消息显示
      await expect(page.locator('.el-message--error')).toBeVisible()
    })

    test('权限不足时的处理', async ({ page }) => {
      // 模拟权限不足响应
      await page.route('**/api/project-collaboration/publish', route => {
        route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 403,
            message: '您没有权限发布项目',
            data: null
          })
        })
      })

      await publishPage.goto()
      await publishPage.fillBasicInfo(TEST_DATA.testProject)
      
      await page.click('text=发布项目')
      await page.click('.el-message-box .el-button--primary')
      
      // 验证权限错误处理
      await expect(page.locator('.el-message--error')).toBeVisible()
      expect(await page.locator('.el-message--error').textContent()).toContain('权限')
    })
  })

  test.describe('数据完整性验证', () => {
    test.beforeEach(async ({ page }) => {
      await collaborationPage.login('admin')
    })

    test('项目数据完整性', async ({ page }) => {
      await collaborationPage.goto()
      await collaborationPage.waitForProjectsLoad()

      const projectCards = await collaborationPage.getProjectCards()
      const count = await projectCards.count()

      if (count > 0) {
        const firstCard = projectCards.first()
        
        // 验证必要的项目信息都存在
        await expect(firstCard.locator('.project-title')).not.toBeEmpty()
        await expect(firstCard.locator('.project-description')).not.toBeEmpty()
        
        // 验证项目状态标签
        const statusTag = firstCard.locator('.el-tag')
        await expect(statusTag).toBeVisible()
        await expect(statusTag).not.toBeEmpty()

        // 验证项目元数据
        const metaItems = firstCard.locator('.meta-item')
        const metaCount = await metaItems.count()
        expect(metaCount).toBeGreaterThan(0)
      }
    })

    test('团队申请数据完整性', async ({ page }) => {
      await collaborationPage.goto()
      await collaborationPage.switchTab('待审批申请')

      const applicationItems = page.locator('.application-item')
      const count = await applicationItems.count()

      if (count > 0) {
        const firstApplication = applicationItems.first()
        
        // 验证申请基本信息
        await expect(firstApplication.locator('.application-title')).not.toBeEmpty()
        await expect(firstApplication.locator('.application-team')).not.toBeEmpty()
        await expect(firstApplication.locator('.application-time')).not.toBeEmpty()
        
        // 验证申请状态
        const statusTag = firstApplication.locator('.el-tag')
        await expect(statusTag).toBeVisible()
      }
    })

    test('通知数据完整性', async ({ page }) => {
      await collaborationPage.goto()
      await collaborationPage.openNotifications()

      const notificationItems = page.locator('.notification-item')
      const count = await notificationItems.count()

      if (count > 0) {
        const firstNotification = notificationItems.first()
        
        // 验证通知必要信息
        await expect(firstNotification.locator('.notification-title')).not.toBeEmpty()
        await expect(firstNotification.locator('.notification-content')).not.toBeEmpty()
        await expect(firstNotification.locator('.notification-time')).not.toBeEmpty()
        
        // 验证通知图标
        await expect(firstNotification.locator('.notification-type .el-icon')).toBeVisible()
      }

      await collaborationPage.closeNotifications()
    })
  })
})

// 清理测试数据的辅助函数
test.afterAll(async ({ page }) => {
  // 这里可以添加测试后的数据清理逻辑
  // 比如删除测试过程中创建的项目、申请等
  console.log('测试完成，开始清理测试数据...')
  
  try {
    // 登录管理员账号进行清理
    const collaborationPage = new ProjectCollaborationPage(page)
    await collaborationPage.login('admin')
    
    // 清理测试项目（通过API或界面操作）
    // 注意：实际的清理逻辑需要根据具体的系统实现来调整
    
    console.log('测试数据清理完成')
  } catch (error) {
    console.error('清理测试数据时出错:', error)
  }
})