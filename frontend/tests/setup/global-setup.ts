import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 开始Playwright测试全局设置...')
  
  // 创建浏览器实例用于数据准备
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // 等待服务启动
    console.log('⏳ 等待前端服务启动...')
    await page.goto('http://localhost:8081', { 
      waitUntil: 'networkidle', 
      timeout: 120000 
    })
    
    console.log('⏳ 等待后端服务启动...')
    const backendResponse = await page.goto('http://localhost:3000/api/health', { 
      timeout: 120000 
    }).catch(() => null)
    
    if (!backendResponse || backendResponse.status() !== 200) {
      console.warn('⚠️  后端服务可能未启动，某些测试可能失败')
    }
    
    // 准备测试数据
    await prepareTestData(page)
    
    console.log('✅ 全局设置完成')
    
  } catch (error) {
    console.error('❌ 全局设置失败:', error)
    throw error
  } finally {
    await browser.close()
  }
}

async function prepareTestData(page: any) {
  console.log('📊 准备测试数据...')
  
  try {
    // 登录管理员账号
    await page.goto('http://localhost:8081/login')
    
    // 检查是否已经登录
    const currentUrl = page.url()
    if (currentUrl.includes('/dashboard')) {
      console.log('已登录，跳过登录步骤')
      return
    }
    
    // 执行登录
    await page.fill('input[placeholder="用户名"]', 'admin')
    await page.fill('input[placeholder="密码"]', 'admin123')
    await page.click('button[type="submit"]')
    
    // 等待登录完成
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    
    // 创建测试项目（如果不存在）
    await createTestProjectIfNeeded(page)
    
    console.log('✅ 测试数据准备完成')
    
  } catch (error) {
    console.warn('⚠️  测试数据准备失败，将使用现有数据:', error.message)
  }
}

async function createTestProjectIfNeeded(page: any) {
  try {
    // 检查是否有测试项目
    await page.goto('http://localhost:8081/project/collaboration')
    await page.waitForLoadState('networkidle')
    
    // 搜索测试项目
    const searchInput = page.locator('input[placeholder="项目名称、代码"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('自动化测试')
      await page.click('button:has-text("搜索")')
      await page.waitForTimeout(2000)
      
      const projectCards = page.locator('.project-card')
      const cardCount = await projectCards.count()
      
      if (cardCount === 0) {
        // 没有测试项目，创建一个
        console.log('📝 创建测试项目...')
        await createTestProject(page)
      } else {
        console.log(`✅ 找到${cardCount}个测试项目`)
      }
    }
    
  } catch (error) {
    console.warn('创建测试项目失败:', error.message)
  }
}

async function createTestProject(page: any) {
  // 点击发布项目按钮
  const publishButton = page.locator('text=发布项目')
  if (await publishButton.isVisible()) {
    await publishButton.click()
    await page.waitForURL('**/project/publish')
    
    // 填写项目信息
    await page.fill('input[placeholder="请输入项目名称"]', '自动化测试项目')
    await page.fill('input[placeholder="请输入项目代码"]', 'AUTO_TEST_001')
    await page.fill('textarea[placeholder="请输入项目描述"]', '这是用于Playwright自动化测试的项目')
    await page.fill('textarea[placeholder="请详细描述项目的工作内容、目标和交付物"]', '测试项目内容')
    
    // 填写预算信息
    await page.fill('input[placeholder="请输入项目预算"]', '100000')
    await page.fill('input[placeholder="请输入预计奖金规模"]', '50000')
    await page.fill('input[placeholder="请输入利润目标"]', '200000')
    
    // 发布项目
    await page.click('text=发布项目')
    
    // 确认发布
    await page.waitForSelector('.el-message-box', { timeout: 5000 })
    await page.click('.el-message-box .el-button--primary')
    
    // 等待成功消息
    await page.waitForSelector('.el-message--success', { timeout: 10000 })
    
    console.log('✅ 测试项目创建成功')
  } else {
    console.log('⚠️  无权限创建项目，将使用现有项目进行测试')
  }
}

export default globalSetup