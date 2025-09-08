import { test, expect } from '@playwright/test'
import { TestHelpers } from '../utils/test-helpers'

test.describe('员工管理页面测试', () => {
  let helpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page)
    await helpers.login()
  })

  test('应该能够导航到员工管理页面', async ({ page }) => {
    await helpers.navigateTo('员工管理')
    await helpers.verifyPageTitle('员工管理')
    
    // 验证页面元素存在
    await expect(page.locator('button:has-text("新增员工")')).toBeVisible()
    await expect(page.locator('button:has-text("导入员工")')).toBeVisible()
    await expect(page.locator('button:has-text("导出数据")')).toBeVisible()
  })

  test('应该显示员工列表', async ({ page }) => {
    await helpers.navigateTo('员工管理')
    await helpers.waitForTableLoad()
    
    // 验证表格头部
    await expect(page.locator('.el-table thead th:has-text("工号")')).toBeVisible()
    await expect(page.locator('.el-table thead th:has-text("姓名")')).toBeVisible()
    await expect(page.locator('.el-table thead th:has-text("部门")')).toBeVisible()
    await expect(page.locator('.el-table thead th:has-text("岗位")')).toBeVisible()
    await expect(page.locator('.el-table thead th:has-text("操作")')).toBeVisible()
  })

  test('应该能够新增员工', async ({ page }) => {
    await helpers.navigateTo('员工管理')
    
    const testData = helpers.generateTestData('EMP')
    const initialRowCount = await helpers.getTableRowCount()
    
    // 打开新增对话框
    await helpers.openCreateDialog()
    
    // 验证对话框标题
    await expect(page.locator('.el-dialog__title:has-text("新增员工")')).toBeVisible()
    
    // 填写基本信息
    await helpers.fillFormField('工号', testData.code)
    await helpers.fillFormField('姓名', testData.name)
    
    // 选择部门
    await helpers.selectOption('部门', '技术部')
    
    // 选择岗位
    await helpers.selectOption('岗位', '高级工程师')
    
    // 填写年薪
    await helpers.fillFormField('年薪', '120000')
    
    // 填写入职日期
    await page.fill('.el-form-item:has(.el-form-item__label:text("入职日期")) input', '2025-01-01')
    
    // 填写联系信息
    await helpers.fillFormField('手机号码', '13800138000')
    await helpers.fillFormField('邮箱', `${testData.code}@company.com`)
    
    // 提交表单
    await helpers.submitForm()
    
    // 验证数据已添加到表格
    await helpers.verifyTableContains(testData.name)
    await helpers.verifyTableContains(testData.code)
    
    // 验证表格行数增加
    const newRowCount = await helpers.getTableRowCount()
    expect(newRowCount).toBe(initialRowCount + 1)
  })

  test('应该能够搜索员工', async ({ page }) => {
    await helpers.navigateTo('员工管理')
    await helpers.waitForTableLoad()
    
    // 在搜索框中输入工号
    await page.fill('input[placeholder*="工号/姓名"]', 'TEST001')
    await page.click('button:has-text("搜索")')
    
    // 等待搜索结果
    await helpers.waitForTableLoad()
    
    // 验证搜索结果
    await expect(page.locator('.el-table').locator('text=TEST001')).toBeVisible()
  })

  test('应该能够按部门筛选员工', async ({ page }) => {
    await helpers.navigateTo('员工管理')
    await helpers.waitForTableLoad()
    
    // 选择部门筛选
    await page.click('.el-form-item:has(.el-form-item__label:text("部门")) .el-select')
    await page.waitForSelector('.el-select-dropdown', { timeout: 3000 })
    await page.click('.el-select-dropdown .el-option:has-text("技术部")')
    
    await page.click('button:has-text("搜索")')
    await helpers.waitForTableLoad()
    
    // 验证筛选结果
    const departmentCells = page.locator('.el-table tbody td:nth-child(4)')
    const count = await departmentCells.count()
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const cellText = await departmentCells.nth(i).textContent()
        expect(cellText?.includes('技术部') || cellText?.includes('-')).toBeTruthy()
      }
    }
  })

  test('应该能够查看员工详情', async ({ page }) => {
    await helpers.navigateTo('员工管理')
    await helpers.waitForTableLoad()
    
    // 点击第一行的详情按钮
    const detailButtons = page.locator('button:has-text("详情")')
    const buttonCount = await detailButtons.count()
    
    if (buttonCount > 0) {
      await detailButtons.first().click()
      
      // 等待详情对话框出现
      await page.waitForSelector('.el-dialog', { timeout: 5000 })
      
      // 验证详情对话框标题
      await expect(page.locator('.el-dialog__title:has-text("员工详情")')).toBeVisible()
      
      // 关闭对话框
      await page.click('.el-dialog__header .el-dialog__headerbtn')
    }
  })

  test('应该能够重置搜索', async ({ page }) => {
    await helpers.navigateTo('员工管理')
    await helpers.waitForTableLoad()
    
    const initialRowCount = await helpers.getTableRowCount()
    
    // 进行搜索
    await page.fill('input[placeholder*="工号/姓名"]', 'NONEXISTENT')
    await page.click('button:has-text("搜索")')
    await helpers.waitForTableLoad()
    
    // 重置搜索
    await page.click('button:has-text("重置")')
    await helpers.waitForTableLoad()
    
    // 验证恢复到初始状态
    const resetRowCount = await helpers.getTableRowCount()
    expect(resetRowCount).toBe(initialRowCount)
  })

  test('表单验证应该正常工作', async ({ page }) => {
    await helpers.navigateTo('员工管理')
    await helpers.openCreateDialog()
    
    // 尝试提交空表单
    await page.click('.el-dialog__footer button:has-text("创建")')
    
    // 验证错误消息
    await expect(page.locator('.el-form-item__error:has-text("请输入工号")')).toBeVisible()
    await expect(page.locator('.el-form-item__error:has-text("请输入姓名")')).toBeVisible()
    
    // 关闭对话框
    await page.click('.el-dialog__header .el-dialog__headerbtn')
  })
})