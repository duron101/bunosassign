import { test, expect } from '@playwright/test'
import { TestHelpers } from '../utils/test-helpers'

test.describe('岗位管理页面测试', () => {
  let helpers: TestHelpers

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page)
    await helpers.login()
  })

  test('应该能够导航到岗位管理页面', async ({ page }) => {
    await helpers.navigateTo('岗位管理')
    await helpers.verifyPageTitle('岗位管理')
    
    // 验证页面元素存在
    await expect(page.locator('button:has-text("新增岗位")')).toBeVisible()
    await expect(page.locator('button:has-text("批量调整基准值")')).toBeVisible()
    await expect(page.locator('button:has-text("导出数据")')).toBeVisible()
  })

  test('应该显示统计卡片', async ({ page }) => {
    await helpers.navigateTo('岗位管理')
    
    // 等待统计卡片加载
    await page.waitForSelector('.stats-cards', { timeout: 10000 })
    
    // 验证统计卡片存在
    await expect(page.locator('.stat-card')).toBeVisible()
  })

  test('应该显示岗位列表', async ({ page }) => {
    await helpers.navigateTo('岗位管理')
    await helpers.waitForTableLoad()
    
    // 验证表格头部
    await expect(page.locator('.el-table thead th:has-text("岗位名称")')).toBeVisible()
    await expect(page.locator('.el-table thead th:has-text("岗位代码")')).toBeVisible()
    await expect(page.locator('.el-table thead th:has-text("职级")')).toBeVisible()
    await expect(page.locator('.el-table thead th:has-text("基准值")')).toBeVisible()
    await expect(page.locator('.el-table thead th:has-text("员工数量")')).toBeVisible()
    await expect(page.locator('.el-table thead th:has-text("操作")')).toBeVisible()
  })

  test('应该能够新增岗位', async ({ page }) => {
    await helpers.navigateTo('岗位管理')
    
    const testData = helpers.generateTestData('POS')
    const initialRowCount = await helpers.getTableRowCount()
    
    // 打开新增对话框
    await helpers.openCreateDialog()
    
    // 验证对话框标题
    await expect(page.locator('.el-dialog__title:has-text("新增岗位")')).toBeVisible()
    
    // 填写基本信息
    await helpers.fillFormField('岗位名称', testData.name)
    await helpers.fillFormField('岗位代码', testData.code)
    
    // 选择职级
    await helpers.selectOption('职级', 'P3 - 高级')
    
    // 填写基准值
    await page.fill('.el-form-item:has(.el-form-item__label:text("基准值")) .el-input-number input', '5000')
    
    // 填写岗位描述
    await helpers.fillFormField('岗位描述', `这是${testData.name}的描述`)
    
    // 添加岗位职责
    await page.click('button:has-text("添加职责")')
    await page.fill('.list-item input[placeholder="请输入岗位职责"]', '负责产品开发工作')
    
    // 添加任职要求
    await page.click('button:has-text("添加要求")')
    await page.fill('.list-item input[placeholder="请输入任职要求"]', '本科及以上学历')
    
    // 提交表单
    await helpers.submitForm()
    
    // 验证数据已添加到表格
    await helpers.verifyTableContains(testData.name)
    await helpers.verifyTableContains(testData.code)
    
    // 验证表格行数增加
    const newRowCount = await helpers.getTableRowCount()
    expect(newRowCount).toBe(initialRowCount + 1)
  })

  test('应该能够搜索岗位', async ({ page }) => {
    await helpers.navigateTo('岗位管理')
    await helpers.waitForTableLoad()
    
    // 在搜索框中输入岗位名称
    await page.fill('input[placeholder*="岗位名称/代码"]', '高级工程师')
    await page.click('button:has-text("搜索")')
    
    // 等待搜索结果
    await helpers.waitForTableLoad()
    
    // 验证搜索结果
    await expect(page.locator('.el-table').locator('text=高级工程师')).toBeVisible()
  })

  test('应该能够按职级筛选岗位', async ({ page }) => {
    await helpers.navigateTo('岗位管理')
    await helpers.waitForTableLoad()
    
    // 选择职级筛选
    await page.click('.el-form-item:has(.el-form-item__label:text("职级")) .el-select')
    await page.waitForSelector('.el-select-dropdown', { timeout: 3000 })
    
    const options = page.locator('.el-select-dropdown .el-option')
    const optionCount = await options.count()
    
    if (optionCount > 0) {
      await options.first().click()
      await page.click('button:has-text("搜索")')
      await helpers.waitForTableLoad()
    }
  })

  test('应该能够查看岗位详情', async ({ page }) => {
    await helpers.navigateTo('岗位管理')
    await helpers.waitForTableLoad()
    
    // 点击第一行的详情按钮
    const detailButtons = page.locator('button:has-text("详情")')
    const buttonCount = await detailButtons.count()
    
    if (buttonCount > 0) {
      await detailButtons.first().click()
      
      // 等待详情对话框出现
      await page.waitForSelector('.el-dialog', { timeout: 5000 })
      
      // 验证详情对话框标题
      await expect(page.locator('.el-dialog__title:has-text("岗位详情")')).toBeVisible()
      
      // 关闭对话框
      await page.click('.el-dialog__header .el-dialog__headerbtn')
    }
  })

  test('应该能够编辑岗位', async ({ page }) => {
    await helpers.navigateTo('岗位管理')
    await helpers.waitForTableLoad()
    
    // 点击第一行的编辑按钮
    const editButtons = page.locator('button:has-text("编辑")')
    const buttonCount = await editButtons.count()
    
    if (buttonCount > 0) {
      await editButtons.first().click()
      
      // 等待编辑对话框出现
      await page.waitForSelector('.el-dialog', { timeout: 5000 })
      
      // 验证编辑对话框标题
      await expect(page.locator('.el-dialog__title:has-text("编辑岗位")')).toBeVisible()
      
      // 关闭对话框
      await page.click('.el-dialog__header .el-dialog__headerbtn')
    }
  })

  test('应该能够调整基准值', async ({ page }) => {
    await helpers.navigateTo('岗位管理')
    await helpers.waitForTableLoad()
    
    // 点击第一行的调整基准值按钮
    const adjustButtons = page.locator('button:has-text("调整基准值")')
    const buttonCount = await adjustButtons.count()
    
    if (buttonCount > 0) {
      await adjustButtons.first().click()
      
      // 等待基准值调整对话框出现
      await page.waitForSelector('.el-dialog', { timeout: 5000 })
      
      // 验证对话框存在
      await expect(page.locator('.el-dialog')).toBeVisible()
      
      // 关闭对话框
      await page.click('.el-dialog__header .el-dialog__headerbtn')
    }
  })

  test('应该能够批量调整基准值', async ({ page }) => {
    await helpers.navigateTo('岗位管理')
    await helpers.waitForTableLoad()
    
    // 点击批量调整基准值按钮
    await page.click('button:has-text("批量调整基准值")')
    
    // 等待批量调整对话框出现
    await page.waitForSelector('.el-dialog', { timeout: 5000 })
    
    // 验证对话框存在
    await expect(page.locator('.el-dialog')).toBeVisible()
    
    // 关闭对话框
    await page.click('.el-dialog__header .el-dialog__headerbtn')
  })

  test('应该能够重置搜索', async ({ page }) => {
    await helpers.navigateTo('岗位管理')
    await helpers.waitForTableLoad()
    
    const initialRowCount = await helpers.getTableRowCount()
    
    // 进行搜索
    await page.fill('input[placeholder*="岗位名称/代码"]', 'NONEXISTENT')
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
    await helpers.navigateTo('岗位管理')
    await helpers.openCreateDialog()
    
    // 尝试提交空表单
    await page.click('.el-dialog__footer button:has-text("创建")')
    
    // 验证错误消息
    await expect(page.locator('.el-form-item__error:has-text("请输入岗位名称")')).toBeVisible()
    await expect(page.locator('.el-form-item__error:has-text("请输入岗位代码")')).toBeVisible()
    await expect(page.locator('.el-form-item__error:has-text("请选择职级")')).toBeVisible()
    
    // 关闭对话框
    await page.click('.el-dialog__header .el-dialog__headerbtn')
  })

  test('基准值范围验证应该正常工作', async ({ page }) => {
    await helpers.navigateTo('岗位管理')
    await helpers.openCreateDialog()
    
    // 填写基本信息
    await helpers.fillFormField('岗位名称', '测试岗位')
    await helpers.fillFormField('岗位代码', 'TEST_POS')
    await helpers.selectOption('职级', 'P3 - 高级')
    
    // 输入超出范围的基准值
    await page.fill('.el-form-item:has(.el-form-item__label:text("基准值")) .el-input-number input', '15')
    
    // 尝试提交表单
    await page.click('.el-dialog__footer button:has-text("创建")')
    
    // 验证基准值范围错误消息
    await expect(page.locator('.el-form-item__error:has-text("基准值范围为 0-10")')).toBeVisible()
    
    // 关闭对话框
    await page.click('.el-dialog__header .el-dialog__headerbtn')
  })

  test('应该能够删除岗位职责', async ({ page }) => {
    await helpers.navigateTo('岗位管理')
    await helpers.openCreateDialog()
    
    // 添加岗位职责
    await page.click('button:has-text("添加职责")')
    await page.fill('.list-item input[placeholder="请输入岗位职责"]', '测试职责')
    
    // 删除岗位职责
    await page.click('.list-item button[type="danger"]')
    
    // 验证职责已被删除
    await expect(page.locator('.empty-list:has-text("暂无岗位职责")')).toBeVisible()
    
    // 关闭对话框
    await page.click('.el-dialog__header .el-dialog__headerbtn')
  })

  test('应该能够删除任职要求', async ({ page }) => {
    await helpers.navigateTo('岗位管理')
    await helpers.openCreateDialog()
    
    // 添加任职要求
    await page.click('button:has-text("添加要求")')
    await page.fill('.list-item input[placeholder="请输入任职要求"]', '测试要求')
    
    // 删除任职要求
    await page.click('.list-item button[type="danger"]')
    
    // 验证要求已被删除
    await expect(page.locator('.empty-list:has-text("暂无任职要求")')).toBeVisible()
    
    // 关闭对话框
    await page.click('.el-dialog__header .el-dialog__headerbtn')
  })
})