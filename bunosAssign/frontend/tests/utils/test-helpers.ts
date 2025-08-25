import { Page, expect } from '@playwright/test'

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * 登录到系统
   */
  async login(username = 'admin', password = 'admin123') {
    await this.page.goto('/login')
    await this.page.fill('input[placeholder*="用户名"]', username)
    await this.page.fill('input[placeholder*="密码"]', password)
    await this.page.click('button:has-text("登录")')
    
    // 等待跳转到仪表板
    await this.page.waitForURL('/dashboard')
    await expect(this.page.locator('h1:has-text("奖金模拟系统")')).toBeVisible()
  }

  /**
   * 导航到指定页面
   */
  async navigateTo(menuText: string) {
    await this.page.click(`text=${menuText}`)
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * 等待表格加载完成
   */
  async waitForTableLoad() {
    await this.page.waitForSelector('.el-table', { timeout: 10000 })
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * 打开新增对话框
   */
  async openCreateDialog() {
    await this.page.click('button:has-text("新增")')
    await this.page.waitForSelector('.el-dialog', { timeout: 5000 })
  }

  /**
   * 填写表单字段
   */
  async fillFormField(label: string, value: string) {
    const field = this.page.locator(`.el-form-item:has(.el-form-item__label:text("${label}")) input, .el-form-item:has(.el-form-item__label:text("${label}")) textarea`)
    await field.fill(value)
  }

  /**
   * 选择下拉框选项
   */
  async selectOption(label: string, optionText: string) {
    const selectField = this.page.locator(`.el-form-item:has(.el-form-item__label:text("${label}")) .el-select`)
    await selectField.click()
    await this.page.waitForSelector('.el-select-dropdown', { timeout: 3000 })
    await this.page.click(`.el-select-dropdown .el-option:has-text("${optionText}")`)
  }

  /**
   * 提交表单
   */
  async submitForm() {
    await this.page.click('.el-dialog__footer button:has-text("创建"), .el-dialog__footer button:has-text("确定")')
    
    // 等待成功消息
    await this.page.waitForSelector('.el-message--success', { timeout: 5000 })
    
    // 等待对话框关闭
    await this.page.waitForSelector('.el-dialog', { state: 'hidden', timeout: 5000 })
  }

  /**
   * 验证表格中是否存在数据
   */
  async verifyTableContains(text: string) {
    await this.waitForTableLoad()
    await expect(this.page.locator('.el-table').locator(`text=${text}`)).toBeVisible()
  }

  /**
   * 获取表格行数
   */
  async getTableRowCount(): Promise<number> {
    await this.waitForTableLoad()
    const rows = await this.page.locator('.el-table .el-table__body tr').count()
    return rows
  }

  /**
   * 验证页面标题
   */
  async verifyPageTitle(title: string) {
    await expect(this.page.locator('h2', { hasText: title })).toBeVisible()
  }

  /**
   * 生成唯一的测试数据
   */
  generateTestData(prefix: string) {
    const timestamp = Date.now()
    return {
      code: `${prefix}_${timestamp}`,
      name: `测试${prefix}_${timestamp}`,
      timestamp
    }
  }

  /**
   * 截图用于调试
   */
  async screenshot(name: string) {
    await this.page.screenshot({ path: `test-results/${name}-${Date.now()}.png` })
  }
}