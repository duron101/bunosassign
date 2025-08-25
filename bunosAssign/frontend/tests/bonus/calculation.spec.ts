import { test, expect } from '@playwright/test';

test.describe('奖金计算功能测试', () => {
  test.beforeEach(async ({ page }) => {
    // 先登录系统
    await page.goto('/login');
    await page.fill('input[placeholder="请输入用户名"]', 'admin');
    await page.fill('input[placeholder="请输入密码"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // 等待跳转到仪表盘
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    
    // 导航到奖金计算页面
    await page.goto('/calculation');
    await page.waitForLoadState('networkidle');
  });

  test('奖金计算页面加载', async ({ page }) => {
    // 检查页面标题
    await expect(page.locator('h2:has-text("奖金计算")')).toBeVisible();
    
    // 检查主要功能区域
    await expect(page.locator('text=奖金池管理')).toBeVisible();
    await expect(page.locator('text=统计概览')).toBeVisible();
    await expect(page.locator('text=参数配置')).toBeVisible();
  });

  test('创建新奖金池', async ({ page }) => {
    // 点击创建奖金池按钮
    await page.click('button:has-text("创建奖金池")');
    
    // 检查对话框是否出现
    await expect(page.locator('.el-dialog__title:has-text("创建奖金池")')).toBeVisible();
    
    // 填写奖金池信息
    await page.fill('input[placeholder="请输入期间"]', '2025-Q2');
    await page.fill('input[placeholder="请输入公司总利润"]', '15000000');
    
    // 调整奖金池比例滑块
    const poolRatioSlider = page.locator('.el-slider__runway').first();
    await poolRatioSlider.click({ position: { x: 100, y: 0 } });
    
    // 保存奖金池
    await page.click('button:has-text("创建")');
    
    // 等待创建完成
    await page.waitForTimeout(2000);
    
    // 检查成功提示
    await expect(page.locator('.el-message--success')).toBeVisible();
    
    // 检查奖金池是否出现在列表中
    await expect(page.locator('text=2025-Q2')).toBeVisible();
  });

  test('奖金池参数配置', async ({ page }) => {
    // 选择第一个奖金池
    const firstPool = page.locator('.pool-card').first();
    await firstPool.click();
    
    // 检查参数配置区域
    await expect(page.locator('text=三维权重配置')).toBeVisible();
    
    // 调整利润贡献度权重
    const profitWeightSlider = page.locator('text=利润贡献度').locator('..').locator('.el-slider__runway');
    await profitWeightSlider.click({ position: { x: 120, y: 0 } });
    
    // 调整岗位价值权重
    const positionWeightSlider = page.locator('text=岗位价值').locator('..').locator('.el-slider__runway');
    await positionWeightSlider.click({ position: { x: 80, y: 0 } });
    
    // 调整绩效表现权重
    const performanceWeightSlider = page.locator('text=绩效表现').locator('..').locator('.el-slider__runway');
    await performanceWeightSlider.click({ position: { x: 100, y: 0 } });
    
    // 检查权重总和验证
    const weightTotal = page.locator('.weight-validation');
    await expect(weightTotal).toBeVisible();
  });

  test('业务线权重配置', async ({ page }) => {
    // 选择奖金池
    const firstPool = page.locator('.pool-card').first();
    await firstPool.click();
    
    // 检查业务线权重配置
    await expect(page.locator('text=业务线权重分配')).toBeVisible();
    
    // 配置实施线权重
    const implementationSlider = page.locator('text=实施').locator('..').locator('.el-slider__runway');
    await implementationSlider.click({ position: { x: 150, y: 0 } });
    
    // 配置售前线权重
    const presalesSlider = page.locator('text=售前').locator('..').locator('.el-slider__runway');
    await presalesSlider.click({ position: { x: 60, y: 0 } });
    
    // 检查权重分配图表
    const chartContainer = page.locator('.weight-chart');
    if (await chartContainer.isVisible()) {
      await expect(chartContainer).toBeVisible();
    }
  });

  test('执行奖金计算', async ({ page }) => {
    // 选择奖金池
    const firstPool = page.locator('.pool-card').first();
    await firstPool.click();
    
    // 点击开始计算按钮
    await page.click('button:has-text("开始计算")');
    
    // 检查确认对话框
    await expect(page.locator('.el-message-box__title:has-text("确认计算")')).toBeVisible();
    
    // 确认计算
    await page.click('button:has-text("确定")');
    
    // 等待计算进度
    await page.waitForTimeout(3000);
    
    // 检查计算进度条
    const progressBar = page.locator('.el-progress');
    if (await progressBar.isVisible()) {
      await expect(progressBar).toBeVisible();
    }
    
    // 等待计算完成
    await page.waitForTimeout(5000);
    
    // 检查计算结果
    await expect(page.locator('text=计算完成')).toBeVisible();
  });

  test('查看计算结果', async ({ page }) => {
    // 选择已计算的奖金池
    const calculatedPool = page.locator('.pool-card[data-status="calculated"]').first();
    if (await calculatedPool.isVisible()) {
      await calculatedPool.click();
      
      // 点击查看结果按钮
      await page.click('button:has-text("查看结果")');
      
      // 检查结果页面
      await expect(page.locator('text=计算结果详情')).toBeVisible();
      
      // 检查结果统计
      await expect(page.locator('text=总奖金')).toBeVisible();
      await expect(page.locator('text=人均奖金')).toBeVisible();
      await expect(page.locator('text=参与员工数')).toBeVisible();
      
      // 检查结果表格
      await expect(page.locator('.result-table')).toBeVisible();
      
      // 检查图表展示
      const chartContainer = page.locator('.result-charts');
      if (await chartContainer.isVisible()) {
        await expect(chartContainer).toBeVisible();
      }
    }
  });

  test('导出计算结果', async ({ page }) => {
    // 选择已计算的奖金池
    const calculatedPool = page.locator('.pool-card[data-status="calculated"]').first();
    if (await calculatedPool.isVisible()) {
      await calculatedPool.click();
      
      // 点击导出按钮
      await page.click('button:has-text("导出结果")');
      
      // 检查导出选项对话框
      await expect(page.locator('.el-dialog__title:has-text("导出设置")')).toBeVisible();
      
      // 选择导出格式
      await page.check('input[value="excel"]');
      
      // 选择导出内容
      await page.check('text=基本信息');
      await page.check('text=计算明细');
      await page.check('text=统计汇总');
      
      // 点击导出
      await page.click('button:has-text("开始导出")');
      
      // 等待导出完成
      await page.waitForTimeout(3000);
      
      // 检查成功提示
      await expect(page.locator('.el-message--success:has-text("导出成功")')).toBeVisible();
    }
  });

  test('模拟计算功能', async ({ page }) => {
    // 选择奖金池
    const firstPool = page.locator('.pool-card').first();
    await firstPool.click();
    
    // 调整参数
    const profitInput = page.locator('input[placeholder="请输入公司总利润"]');
    await profitInput.fill('18000000');
    
    // 点击模拟计算按钮
    await page.click('button:has-text("模拟计算")');
    
    // 等待模拟结果
    await page.waitForTimeout(2000);
    
    // 检查模拟结果展示
    await expect(page.locator('.simulation-result')).toBeVisible();
    await expect(page.locator('text=模拟结果')).toBeVisible();
    
    // 检查对比数据
    await expect(page.locator('text=变化对比')).toBeVisible();
    
    // 检查模拟图表
    const simulationChart = page.locator('.simulation-chart');
    if (await simulationChart.isVisible()) {
      await expect(simulationChart).toBeVisible();
    }
  });

  test('历史记录查看', async ({ page }) => {
    // 点击历史记录标签
    await page.click('text=历史记录');
    
    // 检查历史记录列表
    await expect(page.locator('.history-list')).toBeVisible();
    
    // 选择日期范围筛选
    const dateRangePicker = page.locator('.el-date-editor');
    if (await dateRangePicker.isVisible()) {
      await dateRangePicker.click();
      
      // 选择本月
      await page.click('text=本月');
      
      // 应用筛选
      await page.click('button:has-text("查询")');
      
      // 检查筛选结果
      await page.waitForTimeout(1000);
    }
    
    // 检查历史记录详情
    const firstRecord = page.locator('.history-item').first();
    if (await firstRecord.isVisible()) {
      await firstRecord.click();
      
      // 检查详情展示
      await expect(page.locator('.history-detail')).toBeVisible();
    }
  });

  test('批量操作功能', async ({ page }) => {
    // 选择多个奖金池
    await page.check('.pool-checkbox').first();
    await page.check('.pool-checkbox').nth(1);
    
    // 检查批量操作按钮是否可用
    const batchButton = page.locator('button:has-text("批量操作")');
    if (await batchButton.isVisible()) {
      await expect(batchButton).not.toBeDisabled();
      
      // 点击批量操作
      await batchButton.click();
      
      // 检查批量操作菜单
      await expect(page.locator('.batch-menu')).toBeVisible();
      
      // 选择批量删除
      await page.click('text=批量删除');
      
      // 确认删除
      await page.click('button:has-text("确定")');
      
      // 检查操作结果
      await expect(page.locator('.el-message--success')).toBeVisible();
    }
  });
});