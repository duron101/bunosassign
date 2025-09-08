import { test, expect } from '@playwright/test'
import { TestHelpers } from '../utils/test-helpers'

test.describe('业务线管理页面测试', () => {
  let helpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page)
    await helpers.login()
  })

  test('应该能够导航到业务线管理页面', async ({ page }) => {
    await helpers.navigateTo('业务线管理')
    await helpers.verifyPageTitle('业务线管理')
    
    // 验证页面元素存在
    await expect(page.locator('button:has-text("新增业务线")')).toBeVisible()
    await expect(page.locator('button:has-text("导出数据")')).toBeVisible()
  })

  test('应该显示业务线列表', async ({ page }) => {
    await helpers.navigateTo('业务线管理')
    await helpers.waitForTableLoad()
    
    // 验证表格头部
    await expect(page.locator('.el-table thead th:has-text("业务线名称")')).toBeVisible()
    await expect(page.locator('.el-table thead th:has-text("业务线代码")')).toBeVisible()
    await expect(page.locator('.el-table thead th:has-text("奖金池权重")')).toBeVisible()
    await expect(page.locator('.el-table thead th:has-text("部门数量")')).toBeVisible()
    await expect(page.locator('.el-table thead th:has-text("员工数量")')).toBeVisible()
    await expect(page.locator('.el-table thead th:has-text("操作")')).toBeVisible()
  })

  test('应该能够新增业务线', async ({ page }) => {
    await helpers.navigateTo('业务线管理')
    
    const testData = helpers.generateTestData('BL')
    const initialRowCount = await helpers.getTableRowCount()
    
    // 打开新增对话框
    await helpers.openCreateDialog()
    
    // 验证对话框标题
    await expect(page.locator('.el-dialog__title:has-text("新增业务线")')).toBeVisible()
    
    // 填写业务线信息
    await helpers.fillFormField('业务线名称', testData.name)
    await helpers.fillFormField('业务线代码', testData.code)
    
    // 填写奖金池权重
    await page.fill('.el-form-item:has(.el-form-item__label:text("奖金池权重")) .el-input-number input', '0.3')
    
    // 填写业务线描述
    await helpers.fillFormField('业务线描述', `这是${testData.name}的描述`)
    
    // 填写业务目标
    await helpers.fillFormField('业务目标', '提升业务线整体营收水平')
    
    // 添加关键指标
    await page.click('button:has-text("添加指标")')
    await page.fill('.list-item input[placeholder="请输入关键指标"]', '营收增长率')
    
    // 提交表单
    await helpers.submitForm()
    
    // 验证数据已添加到表格
    await helpers.verifyTableContains(testData.name)
    await helpers.verifyTableContains(testData.code)
    
    // 验证表格行数增加
    const newRowCount = await helpers.getTableRowCount()
    expect(newRowCount).toBe(initialRowCount + 1)
  })

  test('应该能够搜索业务线', async ({ page }) => {
    await helpers.navigateTo('业务线管理')
    await helpers.waitForTableLoad()
    
    // 在搜索框中输入业务线名称
    await page.fill('input[placeholder*="业务线名称/代码"]', '核心业务线')
    await page.click('button:has-text("搜索")')
    
    // 等待搜索结果
    await helpers.waitForTableLoad()
    
    // 验证搜索结果
    await expect(page.locator('.el-table').locator('text=核心业务线')).toBeVisible()
  })

  test('应该能够查看业务线详情', async ({ page }) => {
    await helpers.navigateTo('业务线管理')
    await helpers.waitForTableLoad()
    
    // 点击第一行的详情按钮
    const detailButtons = page.locator('button:has-text("详情")')
    const buttonCount = await detailButtons.count()
    
    if (buttonCount > 0) {
      await detailButtons.first().click()
      
      // 等待详情对话框出现
      await page.waitForSelector('.el-dialog', { timeout: 5000 })
      
      // 验证详情对话框标题
      await expect(page.locator('.el-dialog__title:has-text("业务线详情")')).toBeVisible()
      
      // 关闭对话框
      await page.click('.el-dialog__header .el-dialog__headerbtn')
    }
  })

  test('应该能够编辑业务线', async ({ page }) => {
    await helpers.navigateTo('业务线管理')
    await helpers.waitForTableLoad()
    
    // 点击第一行的编辑按钮
    const editButtons = page.locator('button:has-text("编辑")')
    const buttonCount = await editButtons.count()
    
    if (buttonCount > 0) {
      await editButtons.first().click()
      
      // 等待编辑对话框出现
      await page.waitForSelector('.el-dialog', { timeout: 5000 })
      
      // 验证编辑对话框标题
      await expect(page.locator('.el-dialog__title:has-text("编辑业务线")')).toBeVisible()
      
      // 关闭对话框
      await page.click('.el-dialog__header .el-dialog__headerbtn')
    }
  })

  test('应该能够调整权重', async ({ page }) => {
    await helpers.navigateTo('业务线管理')
    await helpers.waitForTableLoad()
    
    // 点击第一行的调整权重按钮
    const adjustButtons = page.locator('button:has-text("调整权重")')
    const buttonCount = await adjustButtons.count()
    
    if (buttonCount > 0) {
      await adjustButtons.first().click()
      
      // 等待权重调整对话框出现
      await page.waitForSelector('.el-dialog', { timeout: 5000 })
      
      // 验证对话框存在
      await expect(page.locator('.el-dialog')).toBeVisible()
      
      // 关闭对话框
      await page.click('.el-dialog__header .el-dialog__headerbtn')
    }
  })

  test('应该能够重置搜索', async ({ page }) => {
    await helpers.navigateTo('业务线管理')
    await helpers.waitForTableLoad()
    
    const initialRowCount = await helpers.getTableRowCount()
    
    // 进行搜索
    await page.fill('input[placeholder*="业务线名称/代码"]', 'NONEXISTENT')
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
    await helpers.navigateTo('业务线管理')
    await helpers.openCreateDialog()
    
    // 尝试提交空表单
    await page.click('.el-dialog__footer button:has-text("创建")')
    
    // 验证错误消息
    await expect(page.locator('.el-form-item__error:has-text("请输入业务线名称")')).toBeVisible()
    await expect(page.locator('.el-form-item__error:has-text("请输入业务线代码")')).toBeVisible()
    await expect(page.locator('.el-form-item__error:has-text("请输入奖金池权重")')).toBeVisible()
    
    // 关闭对话框
    await page.click('.el-dialog__header .el-dialog__headerbtn')
  })

  test('业务线代码格式验证应该正常工作', async ({ page }) => {
    await helpers.navigateTo('业务线管理')
    await helpers.openCreateDialog()
    
    // 填写无效的业务线代码
    await helpers.fillFormField('业务线名称', '测试业务线')
    await helpers.fillFormField('业务线代码', 'invalid-code!')
    await page.fill('.el-form-item:has(.el-form-item__label:text("奖金池权重")) .el-input-number input', '0.3')
    
    // 尝试提交表单
    await page.click('.el-dialog__footer button:has-text("创建")')
    
    // 验证代码格式错误消息
    await expect(page.locator('.el-form-item__error:has-text("业务线代码只能包含大写字母、数字、下划线和连字符")')).toBeVisible()
    
    // 关闭对话框
    await page.click('.el-dialog__header .el-dialog__headerbtn')
  })

  test('奖金池权重范围验证应该正常工作', async ({ page }) => {
    await helpers.navigateTo('业务线管理')
    await helpers.openCreateDialog()
    
    // 填写基本信息
    await helpers.fillFormField('业务线名称', '测试业务线')
    await helpers.fillFormField('业务线代码', 'TEST_BL')
    
    // 输入超出范围的权重值
    await page.fill('.el-form-item:has(.el-form-item__label:text("奖金池权重")) .el-input-number input', '1.5')
    
    // 尝试提交表单
    await page.click('.el-dialog__footer button:has-text("创建")')
    
    // 验证权重范围错误消息
    await expect(page.locator('.el-form-item__error:has-text("权重范围为 0-1")')).toBeVisible()
    
    // 关闭对话框
    await page.click('.el-dialog__header .el-dialog__headerbtn')
  })

  test('应该能够删除关键指标', async ({ page }) => {
    await helpers.navigateTo('业务线管理')
    await helpers.openCreateDialog()
    
    // 添加关键指标
    await page.click('button:has-text("添加指标")')
    await page.fill('.list-item input[placeholder="请输入关键指标"]', '测试指标')
    
    // 删除关键指标
    await page.click('.list-item button[type="danger"]')
    
    // 验证指标已被删除
    await expect(page.locator('.empty-list:has-text("暂无关键指标")')).toBeVisible()
    
    // 关闭对话框
    await page.click('.el-dialog__header .el-dialog__headerbtn')
  })

  test('应该能够添加多个关键指标', async ({ page }) => {
    await helpers.navigateTo('业务线管理')
    await helpers.openCreateDialog()
    
    // 添加第一个关键指标
    await page.click('button:has-text("添加指标")')
    await page.fill('.list-item:first-child input[placeholder="请输入关键指标"]', '营收增长率')
    
    // 添加第二个关键指标
    await page.click('button:has-text("添加指标")')
    await page.fill('.list-item:nth-child(2) input[placeholder="请输入关键指标"]', '客户满意度')
    
    // 验证两个指标都存在
    await expect(page.locator('input[value="营收增长率"]')).toBeVisible()
    await expect(page.locator('input[value="客户满意度"]')).toBeVisible()
    
    // 关闭对话框
    await page.click('.el-dialog__header .el-dialog__headerbtn')
  })

  test('应该显示统计信息', async ({ page }) => {
    await helpers.navigateTo('业务线管理')
    
    // 等待统计卡片加载
    await page.waitForSelector('.stats-cards', { timeout: 10000 })
    
    // 验证统计卡片存在
    await expect(page.locator('.stat-card')).toBeVisible()
  })
})