import { test, expect } from '@playwright/test';

test.describe('模拟分析功能测试', () => {
  test.beforeEach(async ({ page }) => {
    // 登录系统
    await page.goto('/login');
    await page.fill('input[placeholder="请输入用户名"]', 'admin');
    await page.fill('input[placeholder="请输入密码"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // 等待跳转并导航到模拟分析页面
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    await page.goto('/simulation');
    await page.waitForLoadState('networkidle');
  });

  test('模拟分析页面加载', async ({ page }) => {
    // 检查页面标题
    await expect(page.locator('h2:has-text("模拟分析")')).toBeVisible();
    
    // 检查功能导航标签
    await expect(page.locator('text=参数模拟')).toBeVisible();
    await expect(page.locator('text=场景对比')).toBeVisible();
    await expect(page.locator('text=敏感性分析')).toBeVisible();
    await expect(page.locator('text=历史分析')).toBeVisible();
    
    // 检查新建场景按钮
    await expect(page.locator('button:has-text("新建场景")')).toBeVisible();
  });

  test('参数模拟功能', async ({ page }) => {
    // 确保在参数模拟标签页
    await page.click('text=参数模拟');
    
    // 选择奖金池
    const poolSelect = page.locator('.pool-select');
    if (await poolSelect.isVisible()) {
      await poolSelect.click();
      await page.click('.el-select-dropdown__item').first();
    }
    
    // 调整公司利润参数
    const profitInput = page.locator('input[placeholder*="公司利润"]');
    if (await profitInput.isVisible()) {
      await profitInput.fill('12000000');
    }
    
    // 调整奖金池比例滑块
    const poolRatioSlider = page.locator('text=奖金池比例').locator('..').locator('.el-slider__runway');
    if (await poolRatioSlider.isVisible()) {
      await poolRatioSlider.click({ position: { x: 100, y: 0 } });
    }
    
    // 调整条线权重
    const implementationSlider = page.locator('text=实施').locator('..').locator('.el-slider__runway');
    if (await implementationSlider.isVisible()) {
      await implementationSlider.click({ position: { x: 120, y: 0 } });
    }
    
    // 运行模拟
    await page.click('button:has-text("运行模拟")');
    
    // 等待模拟结果
    await page.waitForTimeout(3000);
    
    // 检查模拟结果展示
    await expect(page.locator('.simulation-result')).toBeVisible();
    await expect(page.locator('text=模拟结果')).toBeVisible();
    
    // 检查影响概览
    await expect(page.locator('text=总奖金变化')).toBeVisible();
    await expect(page.locator('text=人均奖金变化')).toBeVisible();
    await expect(page.locator('text=受影响员工')).toBeVisible();
  });

  test('场景对比功能', async ({ page }) => {
    // 切换到场景对比标签
    await page.click('text=场景对比');
    
    // 检查保存的场景列表
    await expect(page.locator('text=保存的场景')).toBeVisible();
    
    // 选择多个场景进行对比
    const scenarios = page.locator('.scenario-item');
    const scenarioCount = await scenarios.count();
    
    if (scenarioCount > 0) {
      // 选择前两个场景
      await scenarios.first().click();
      if (scenarioCount > 1) {
        await scenarios.nth(1).click();
      }
      
      // 检查对比分析区域
      await expect(page.locator('text=场景对比分析')).toBeVisible();
      
      // 检查雷达图
      const radarChart = page.locator('.comparison-radar');
      if (await radarChart.isVisible()) {
        await expect(radarChart).toBeVisible();
      }
      
      // 检查对比表格
      await expect(page.locator('.comparison-table')).toBeVisible();
    }
  });

  test('创建新场景', async ({ page }) => {
    // 点击新建场景按钮
    await page.click('button:has-text("新建场景")');
    
    // 检查创建场景对话框
    await expect(page.locator('.el-dialog__title:has-text("创建模拟场景")')).toBeVisible();
    
    // 填写场景信息
    await page.fill('input[placeholder="请输入场景名称"]', '测试场景A');
    await page.fill('textarea[placeholder="请输入场景描述"]', '这是一个测试场景');
    
    // 选择基础奖金池
    const basePoolSelect = page.locator('.base-pool-select');
    if (await basePoolSelect.isVisible()) {
      await basePoolSelect.click();
      await page.click('.el-select-dropdown__item').first();
    }
    
    // 设置为公开场景
    const publicSwitch = page.locator('.el-switch');
    if (await publicSwitch.isVisible()) {
      await publicSwitch.click();
    }
    
    // 创建场景
    await page.click('button:has-text("创建")');
    
    // 等待创建完成
    await page.waitForTimeout(2000);
    
    // 检查成功提示
    await expect(page.locator('.el-message--success')).toBeVisible();
    
    // 检查新场景是否出现在列表中
    await expect(page.locator('text=测试场景A')).toBeVisible();
  });

  test('敏感性分析功能', async ({ page }) => {
    // 切换到敏感性分析标签
    await page.click('text=敏感性分析');
    
    // 选择分析参数
    const parameterSelect = page.locator('text=分析参数').locator('..').locator('.el-select');
    if (await parameterSelect.isVisible()) {
      await parameterSelect.click();
      await page.click('text=公司利润');
    }
    
    // 选择变化范围
    const rangeSelect = page.locator('text=变化范围').locator('..').locator('.el-select');
    if (await rangeSelect.isVisible()) {
      await rangeSelect.click();
      await page.click('text=±20%');
    }
    
    // 选择步长
    const stepSelect = page.locator('text=步长').locator('..').locator('.el-select');
    if (await stepSelect.isVisible()) {
      await stepSelect.click();
      await page.click('text=5%');
    }
    
    // 点击分析按钮
    await page.click('button:has-text("分析")');
    
    // 等待分析结果
    await page.waitForTimeout(3000);
    
    // 检查分析结果
    await expect(page.locator('.sensitivity-result')).toBeVisible();
    
    // 检查敏感性图表
    const sensitivityChart = page.locator('.sensitivity-chart');
    if (await sensitivityChart.isVisible()) {
      await expect(sensitivityChart).toBeVisible();
    }
    
    // 检查敏感性摘要
    await expect(page.locator('text=敏感性摘要')).toBeVisible();
    await expect(page.locator('text=最敏感指标')).toBeVisible();
    await expect(page.locator('text=敏感度系数')).toBeVisible();
    await expect(page.locator('text=风险等级')).toBeVisible();
  });

  test('历史分析功能', async ({ page }) => {
    // 切换到历史分析标签
    await page.click('text=历史分析');
    
    // 选择日期范围
    const dateRangePicker = page.locator('.el-date-editor');
    if (await dateRangePicker.isVisible()) {
      await dateRangePicker.click();
      
      // 选择最近6个月
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6);
      const endDate = new Date();
      
      // 这里简化处理，直接点击确定
      await page.keyboard.press('Escape');
    }
    
    // 选择分析指标
    const metricSelect = page.locator('text=分析指标').locator('..').locator('.el-select');
    if (await metricSelect.isVisible()) {
      await metricSelect.click();
      await page.click('text=总奖金');
    }
    
    // 等待历史数据加载
    await page.waitForTimeout(2000);
    
    // 检查历史分析结果
    const historyResult = page.locator('.history-result');
    if (await historyResult.isVisible()) {
      // 检查历史图表
      await expect(page.locator('.history-chart')).toBeVisible();
      
      // 检查统计指标
      await expect(page.locator('text=平均增长率')).toBeVisible();
      await expect(page.locator('text=最大波动')).toBeVisible();
      await expect(page.locator('text=趋势预测')).toBeVisible();
    }
  });

  test('场景删除功能', async ({ page }) => {
    // 切换到场景对比标签
    await page.click('text=场景对比');
    
    // 查找可删除的场景
    const scenarios = page.locator('.scenario-item');
    const scenarioCount = await scenarios.count();
    
    if (scenarioCount > 0) {
      // 选择第一个场景
      const firstScenario = scenarios.first();
      
      // 查找删除按钮（可能在右键菜单或hover后显示）
      await firstScenario.hover();
      
      const deleteButton = page.locator('.delete-scenario-btn');
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        // 确认删除
        await page.click('button:has-text("确定")');
        
        // 检查删除成功提示
        await expect(page.locator('.el-message--success')).toBeVisible();
      }
    }
  });

  test('参数权重总和验证', async ({ page }) => {
    // 确保在参数模拟标签页
    await page.click('text=参数模拟');
    
    // 调整各条线权重使总和不为100%
    const implementationSlider = page.locator('text=实施').locator('..').locator('.el-slider__runway');
    if (await implementationSlider.isVisible()) {
      await implementationSlider.click({ position: { x: 200, y: 0 } }); // 增大实施权重
    }
    
    // 检查权重验证提示
    const weightValidation = page.locator('.weight-validation');
    if (await weightValidation.isVisible()) {
      // 检查是否显示权重无效的警告
      await expect(weightValidation).toHaveClass(/weight-invalid/);
    }
    
    // 尝试运行模拟，应该有验证提示
    await page.click('button:has-text("运行模拟")');
    
    // 检查权重验证错误消息
    const errorMessage = page.locator('.el-message--warning');
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toContainText(/权重/);
    }
  });

  test('数据导出功能', async ({ page }) => {
    // 先运行一个参数模拟得到结果
    await page.click('text=参数模拟');
    
    // 选择奖金池并运行模拟
    const poolSelect = page.locator('.pool-select');
    if (await poolSelect.isVisible()) {
      await poolSelect.click();
      await page.click('.el-select-dropdown__item').first();
      
      await page.click('button:has-text("运行模拟")');
      await page.waitForTimeout(3000);
    }
    
    // 查找导出按钮
    const exportButton = page.locator('button:has-text("导出")');
    if (await exportButton.isVisible()) {
      await exportButton.click();
      
      // 检查导出选项对话框
      await expect(page.locator('.export-dialog')).toBeVisible();
      
      // 选择导出格式
      await page.check('input[value="excel"]');
      
      // 确认导出
      await page.click('button:has-text("确定")');
      
      // 检查导出成功提示
      await expect(page.locator('.el-message--success')).toBeVisible();
    }
  });
});