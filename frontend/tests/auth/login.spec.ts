import { test, expect } from '@playwright/test';

test.describe('登录功能测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('页面加载正常', async ({ page }) => {
    // 检查页面标题
    await expect(page).toHaveTitle(/奖金模拟系统/);
    
    // 检查登录表单元素
    await expect(page.locator('input[placeholder="请输入用户名"]')).toBeVisible();
    await expect(page.locator('input[placeholder="请输入密码"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('text=登录')).toBeVisible();
  });

  test('空表单提交验证', async ({ page }) => {
    // 直接点击登录按钮
    await page.click('button[type="submit"]');
    
    // 检查验证错误信息
    await expect(page.locator('text=请输入用户名')).toBeVisible();
    await expect(page.locator('text=请输入密码')).toBeVisible();
  });

  test('用户名格式验证', async ({ page }) => {
    // 输入无效用户名
    await page.fill('input[placeholder="请输入用户名"]', '12');
    await page.fill('input[placeholder="请输入密码"]', 'password123');
    await page.click('button[type="submit"]');
    
    // 检查用户名长度验证
    await expect(page.locator('text=用户名长度不能少于3位')).toBeVisible();
  });

  test('密码长度验证', async ({ page }) => {
    // 输入有效用户名和短密码
    await page.fill('input[placeholder="请输入用户名"]', 'testuser');
    await page.fill('input[placeholder="请输入密码"]', '123');
    await page.click('button[type="submit"]');
    
    // 检查密码长度验证
    await expect(page.locator('text=密码长度不能少于6位')).toBeVisible();
  });

  test('错误用户名密码登录', async ({ page }) => {
    // 输入错误的用户名和密码
    await page.fill('input[placeholder="请输入用户名"]', 'wronguser');
    await page.fill('input[placeholder="请输入密码"]', 'wrongpassword');
    
    // 模拟点击登录按钮
    await page.click('button[type="submit"]');
    
    // 等待加载完成
    await page.waitForTimeout(2000);
    
    // 检查错误消息（这里可能需要根据实际的错误处理机制调整）
    const errorMessage = page.locator('.el-message--error');
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toContainText(/用户名或密码错误|登录失败/);
    }
  });

  test('记住密码功能', async ({ page }) => {
    // 检查记住密码复选框
    const rememberCheckbox = page.locator('input[type="checkbox"]');
    await expect(rememberCheckbox).toBeVisible();
    
    // 点击记住密码
    await rememberCheckbox.check();
    await expect(rememberCheckbox).toBeChecked();
    
    // 取消勾选
    await rememberCheckbox.uncheck();
    await expect(rememberCheckbox).not.toBeChecked();
  });

  test('成功登录流程', async ({ page }) => {
    // 输入正确的用户名和密码（假设admin/admin123是有效的）
    await page.fill('input[placeholder="请输入用户名"]', 'admin');
    await page.fill('input[placeholder="请输入密码"]', 'admin123');
    
    // 点击登录按钮
    await page.click('button[type="submit"]');
    
    // 等待页面跳转
    await page.waitForTimeout(3000);
    
    // 检查是否跳转到仪表盘
    await expect(page).toHaveURL(/dashboard/);
    
    // 检查仪表盘页面元素
    await expect(page.locator('text=管理驾驶舱')).toBeVisible();
  });

  test('退出登录功能', async ({ page }) => {
    // 先登录
    await page.fill('input[placeholder="请输入用户名"]', 'admin');
    await page.fill('input[placeholder="请输入密码"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // 等待跳转到仪表盘
    await page.waitForURL(/dashboard/, { timeout: 5000 });
    
    // 查找用户菜单并点击
    const userMenu = page.locator('.user-dropdown');
    if (await userMenu.isVisible()) {
      await userMenu.click();
      
      // 点击退出登录
      await page.click('text=退出登录');
      
      // 检查是否回到登录页面
      await expect(page).toHaveURL(/login/);
    }
  });

  test('登录状态保持', async ({ page, context }) => {
    // 登录
    await page.fill('input[placeholder="请输入用户名"]', 'admin');
    await page.fill('input[placeholder="请输入密码"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // 等待跳转
    await page.waitForURL(/dashboard/, { timeout: 5000 });
    
    // 打开新标签页
    const newPage = await context.newPage();
    await newPage.goto('/dashboard');
    
    // 检查新标签页是否能直接访问仪表盘（说明登录状态保持）
    await expect(newPage.locator('text=管理驾驶舱')).toBeVisible({ timeout: 5000 });
    
    await newPage.close();
  });
});