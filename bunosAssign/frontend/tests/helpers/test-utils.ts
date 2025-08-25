import { Page, expect } from '@playwright/test'

// 测试工具类和辅助函数
export class TestUtils {
  
  /**
   * 登录辅助函数
   */
  static async login(page: Page, userType: 'admin' | 'project_manager' | 'regular_user' = 'admin') {
    const users = {
      admin: { username: 'admin', password: 'admin123' },
      project_manager: { username: 'project_manager', password: 'pm123' },
      regular_user: { username: 'regular_user', password: 'user123' }
    }
    
    const user = users[userType]
    
    await page.goto('/login')
    await page.fill('input[placeholder="用户名"]', user.username)
    await page.fill('input[placeholder="密码"]', user.password)
    await page.click('button[type="submit"]')
    
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    return page
  }

  /**
   * 等待加载完成
   */
  static async waitForPageLoad(page: Page, selector?: string) {
    await page.waitForLoadState('networkidle')
    if (selector) {
      await page.waitForSelector(selector, { state: 'visible' })
    }
    // 等待一小段时间确保动画完成
    await page.waitForTimeout(500)
  }

  /**
   * 等待并点击元素
   */
  static async clickAndWait(page: Page, selector: string, waitTime = 1000) {
    await page.waitForSelector(selector, { state: 'visible' })
    await page.click(selector)
    await page.waitForTimeout(waitTime)
  }

  /**
   * 填写表单字段
   */
  static async fillForm(page: Page, fields: Record<string, string>) {
    for (const [selector, value] of Object.entries(fields)) {
      await page.fill(selector, value)
    }
  }

  /**
   * 等待并验证成功消息
   */
  static async expectSuccessMessage(page: Page, timeout = 10000) {
    await expect(page.locator('.el-message--success')).toBeVisible({ timeout })
  }

  /**
   * 等待并验证错误消息
   */
  static async expectErrorMessage(page: Page, timeout = 10000) {
    await expect(page.locator('.el-message--error')).toBeVisible({ timeout })
  }

  /**
   * 模拟API响应
   */
  static async mockApiResponse(page: Page, url: string, responseData: any, status = 200) {
    await page.route(url, route => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(responseData)
      })
    })
  }

  /**
   * 模拟API错误
   */
  static async mockApiError(page: Page, url: string, status = 500, message = 'Internal Server Error') {
    await page.route(url, route => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({
          code: status,
          message,
          data: null
        })
      })
    })
  }

  /**
   * 清除所有路由模拟
   */
  static async clearRoutes(page: Page) {
    await page.unrouteAll()
  }

  /**
   * 获取表格数据
   */
  static async getTableData(page: Page, tableSelector = '.el-table') {
    const rows = page.locator(`${tableSelector} tbody tr`)
    const count = await rows.count()
    const data = []

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i)
      const cells = row.locator('td')
      const cellCount = await cells.count()
      const rowData = []

      for (let j = 0; j < cellCount; j++) {
        const cellText = await cells.nth(j).textContent()
        rowData.push(cellText?.trim() || '')
      }
      data.push(rowData)
    }

    return data
  }

  /**
   * 等待对话框打开
   */
  static async waitForDialog(page: Page, dialogSelector: string) {
    await page.waitForSelector(dialogSelector, { state: 'visible' })
    await page.waitForTimeout(300) // 等待动画完成
  }

  /**
   * 关闭对话框
   */
  static async closeDialog(page: Page, dialogSelector: string) {
    await page.click(`${dialogSelector} .el-dialog__close`)
    await page.waitForSelector(dialogSelector, { state: 'hidden' })
  }

  /**
   * 等待抽屉打开
   */
  static async waitForDrawer(page: Page) {
    await page.waitForSelector('.el-drawer', { state: 'visible' })
    await page.waitForTimeout(300) // 等待动画完成
  }

  /**
   * 关闭抽屉
   */
  static async closeDrawer(page: Page) {
    await page.keyboard.press('Escape')
    await page.waitForSelector('.el-drawer', { state: 'hidden' })
  }

  /**
   * 检查元素是否可见
   */
  static async isVisible(page: Page, selector: string): Promise<boolean> {
    try {
      return await page.locator(selector).isVisible()
    } catch {
      return false
    }
  }

  /**
   * 等待元素消失
   */
  static async waitForHidden(page: Page, selector: string, timeout = 5000) {
    await page.waitForSelector(selector, { state: 'hidden', timeout })
  }

  /**
   * 滚动到元素
   */
  static async scrollToElement(page: Page, selector: string) {
    await page.locator(selector).scrollIntoViewIfNeeded()
  }

  /**
   * 获取元素文本内容
   */
  static async getText(page: Page, selector: string): Promise<string> {
    return (await page.locator(selector).textContent()) || ''
  }

  /**
   * 获取输入框值
   */
  static async getInputValue(page: Page, selector: string): Promise<string> {
    return await page.inputValue(selector)
  }

  /**
   * 验证表单验证错误
   */
  static async expectFormValidationError(page: Page, expectedCount = 1) {
    const errors = page.locator('.el-form-item__error')
    await expect(errors).toHaveCount({ min: expectedCount })
  }

  /**
   * 生成随机字符串
   */
  static generateRandomString(length = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * 生成测试项目数据
   */
  static generateTestProjectData(suffix?: string) {
    const id = suffix || this.generateRandomString(4)
    return {
      name: `测试项目_${id}`,
      code: `TEST_${id}`,
      description: `这是测试项目${id}的描述信息`,
      workContent: `测试项目${id}的工作内容详情`,
      budget: Math.floor(Math.random() * 500000) + 100000,
      bonusScale: Math.floor(Math.random() * 100000) + 50000,
      profitTarget: Math.floor(Math.random() * 1000000) + 200000
    }
  }

  /**
   * 生成测试团队数据
   */
  static generateTestTeamData(suffix?: string) {
    const id = suffix || this.generateRandomString(4)
    return {
      teamName: `测试团队_${id}`,
      teamDescription: `测试团队${id}的描述信息`,
      applicationReason: `测试团队${id}的申请理由`,
      estimatedCost: Math.floor(Math.random() * 200000) + 80000
    }
  }

  /**
   * 截图并保存
   */
  static async takeScreenshot(page: Page, name: string, options?: any) {
    await page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
      ...options
    })
  }

  /**
   * 检查控制台错误
   */
  static async checkConsoleErrors(page: Page): Promise<string[]> {
    const errors: string[] = []
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })
    
    return errors
  }

  /**
   * 等待网络请求完成
   */
  static async waitForNetworkIdle(page: Page, timeout = 10000) {
    await page.waitForLoadState('networkidle', { timeout })
  }

  /**
   * 模拟慢速网络
   */
  static async simulateSlowNetwork(page: Page) {
    const client = await page.context().newCDPSession(page)
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 1024 * 1024, // 1MB/s
      uploadThroughput: 1024 * 1024,   // 1MB/s
      latency: 500 // 500ms延迟
    })
  }

  /**
   * 恢复正常网络
   */
  static async restoreNetwork(page: Page) {
    const client = await page.context().newCDPSession(page)
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0
    })
  }
}

// 测试数据常量
export const TEST_CONSTANTS = {
  TIMEOUTS: {
    SHORT: 2000,
    MEDIUM: 5000,
    LONG: 10000,
    VERY_LONG: 30000
  },
  
  SELECTORS: {
    PROJECT_CARD: '.project-card',
    NOTIFICATION_BADGE: '.notification-badge',
    SUCCESS_MESSAGE: '.el-message--success',
    ERROR_MESSAGE: '.el-message--error',
    LOADING_MASK: '.el-loading-mask',
    FORM_ERROR: '.el-form-item__error',
    DIALOG: '.el-dialog',
    DRAWER: '.el-drawer',
    TABLE: '.el-table',
    PAGINATION: '.el-pagination'
  },
  
  URLS: {
    LOGIN: '/login',
    DASHBOARD: '/dashboard',
    PROJECT_COLLABORATION: '/project/collaboration',
    PROJECT_PUBLISH: '/project/publish'
  }
}