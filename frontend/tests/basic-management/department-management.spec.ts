import { test, expect } from '@playwright/test'
import { TestHelpers } from '../utils/test-helpers'

test.describe('部门管理页面测试', () => {
  let helpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page)
    await helpers.login()
  })

  test('应该能够导航到部门管理页面', async ({ page }) => {
    await helpers.navigateTo('部门管理')
    await helpers.verifyPageTitle('部门管理')
    
    // 验证页面元素存在
    await expect(page.locator('button:has-text("新增部门")')).toBeVisible()
    await expect(page.locator('button:has-text("列表视图"), button:has-text("树形视图")')).toBeVisible()
    await expect(page.locator('button:has-text("导出数据")')).toBeVisible()
  })

  test('应该显示部门列表', async ({ page }) => {
    await helpers.navigateTo('部门管理')
    await helpers.waitForTableLoad()
    
    // 验证表格头部
    await expect(page.locator('.el-table thead th:has-text("部门名称")')).toBeVisible()
    await expect(page.locator('.el-table thead th:has-text("部门代码")')).toBeVisible()
    await expect(page.locator('.el-table thead th:has-text("业务线")')).toBeVisible()
    await expect(page.locator('.el-table thead th:has-text("员工数量")')).toBeVisible()
    await expect(page.locator('.el-table thead th:has-text("操作")')).toBeVisible()
  })

  test('应该能够新增部门', async ({ page }) => {
    await helpers.navigateTo('部门管理')
    
    const testData = helpers.generateTestData('DEPT')
    const initialRowCount = await helpers.getTableRowCount()
    
    // 打开新增对话框
    await helpers.openCreateDialog()
    
    // 验证对话框标题
    await expect(page.locator('.el-dialog__title:has-text("新增部门")')).toBeVisible()
    
    // 填写部门信息
    await helpers.fillFormField('部门名称', testData.name)
    await helpers.fillFormField('部门代码', testData.code)
    await helpers.fillFormField('部门描述', `这是${testData.name}的描述`)
    
    // 提交表单
    await helpers.submitForm()
    
    // 验证数据已添加到表格
    await helpers.verifyTableContains(testData.name)
    await helpers.verifyTableContains(testData.code)
    
    // 验证表格行数增加
    const newRowCount = await helpers.getTableRowCount()
    expect(newRowCount).toBe(initialRowCount + 1)
  })

  test('应该能够搜索部门', async ({ page }) => {
    await helpers.navigateTo('部门管理')
    await helpers.waitForTableLoad()
    
    // 在搜索框中输入部门名称
    await page.fill('input[placeholder*="部门名称/代码"]', '技术部')
    await page.click('button:has-text("搜索")')
    
    // 等待搜索结果
    await helpers.waitForTableLoad()
    
    // 验证搜索结果
    await expect(page.locator('.el-table').locator('text=技术部')).toBeVisible()
  })

  test('应该能够按业务线筛选部门', async ({ page }) => {
    await helpers.navigateTo('部门管理')
    await helpers.waitForTableLoad()
    
    // 选择业务线筛选
    await page.click('.el-form-item:has(.el-form-item__label:text("业务线")) .el-select')
    await page.waitForSelector('.el-select-dropdown', { timeout: 3000 })
    
    const options = page.locator('.el-select-dropdown .el-option')
    const optionCount = await options.count()
    
    if (optionCount > 0) {
      await options.first().click()
      await page.click('button:has-text("搜索")')
      await helpers.waitForTableLoad()
    }
  })

  test('应该能够切换到树形视图', async ({ page }) => {
    await helpers.navigateTo('部门管理')
    
    // 切换到树形视图
    await page.click('button:has-text("树形视图")')
    await page.waitForSelector('.el-tree', { timeout: 5000 })
    
    // 验证树形视图元素
    await expect(page.locator('.department-tree')).toBeVisible()
  })

  test('应该能够查看部门详情', async ({ page }) => {
    await helpers.navigateTo('部门管理')
    await helpers.waitForTableLoad()
    
    // 点击第一行的详情按钮
    const detailButtons = page.locator('button:has-text("详情")')
    const buttonCount = await detailButtons.count()
    
    if (buttonCount > 0) {
      await detailButtons.first().click()
      
      // 等待详情对话框出现
      await page.waitForSelector('.el-dialog', { timeout: 5000 })
      
      // 验证详情对话框标题
      await expect(page.locator('.el-dialog__title:has-text("部门详情")')).toBeVisible()
      
      // 关闭对话框
      await page.click('.el-dialog__header .el-dialog__headerbtn')
    }
  })

  test('应该能够编辑部门', async ({ page }) => {
    await helpers.navigateTo('部门管理')
    await helpers.waitForTableLoad()
    
    // 点击第一行的编辑按钮
    const editButtons = page.locator('button:has-text("编辑")')
    const buttonCount = await editButtons.count()
    
    if (buttonCount > 0) {
      await editButtons.first().click()
      
      // 等待编辑对话框出现
      await page.waitForSelector('.el-dialog', { timeout: 5000 })
      
      // 验证编辑对话框标题
      await expect(page.locator('.el-dialog__title:has-text("编辑部门")')).toBeVisible()
      
      // 关闭对话框
      await page.click('.el-dialog__header .el-dialog__headerbtn')
    }
  })

  test('应该能够重置搜索', async ({ page }) => {
    await helpers.navigateTo('部门管理')
    await helpers.waitForTableLoad()
    
    const initialRowCount = await helpers.getTableRowCount()
    
    // 进行搜索
    await page.fill('input[placeholder*="部门名称/代码"]', 'NONEXISTENT')
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
    await helpers.navigateTo('部门管理')
    await helpers.openCreateDialog()
    
    // 尝试提交空表单
    await page.click('.el-dialog__footer button:has-text("创建")')
    
    // 验证错误消息
    await expect(page.locator('.el-form-item__error:has-text("请输入部门名称")')).toBeVisible()
    await expect(page.locator('.el-form-item__error:has-text("请输入部门代码")')).toBeVisible()
    
    // 关闭对话框
    await page.click('.el-dialog__header .el-dialog__headerbtn')
  })

  test('部门代码格式验证应该正常工作', async ({ page }) => {
    await helpers.navigateTo('部门管理')
    await helpers.openCreateDialog()
    
    // 填写无效的部门代码
    await helpers.fillFormField('部门名称', '测试部门')
    await helpers.fillFormField('部门代码', 'invalid-code!')
    
    // 尝试提交表单
    await page.click('.el-dialog__footer button:has-text("创建")')
    
    // 验证代码格式错误消息
    await expect(page.locator('.el-form-item__error:has-text("部门代码只能包含大写字母、数字、下划线和连字符")')).toBeVisible()
    
    // 关闭对话框
    await page.click('.el-dialog__header .el-dialog__headerbtn')
  })

  test('在树形视图中应该能够添加子部门', async ({ page }) => {
    await helpers.navigateTo('部门管理')
    
    // 切换到树形视图
    await page.click('button:has-text("树形视图")')
    await page.waitForSelector('.el-tree', { timeout: 5000 })
    
    // 查找添加子部门按钮
    const addChildButtons = page.locator('button:has-text("添加子部门")')
    const buttonCount = await addChildButtons.count()
    
    if (buttonCount > 0) {
      await addChildButtons.first().click()
      
      // 等待新增对话框出现
      await page.waitForSelector('.el-dialog', { timeout: 5000 })
      
      // 验证对话框标题包含父部门信息
      await expect(page.locator('.el-dialog__title').filter({ hasText: '添加子部门' })).toBeVisible()
      
      // 关闭对话框
      await page.click('.el-dialog__header .el-dialog__headerbtn')
    }
  })
})