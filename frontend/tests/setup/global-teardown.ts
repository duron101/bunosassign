import { chromium, FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 开始Playwright测试全局清理...')
  
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // 清理测试数据
    await cleanupTestData(page)
    
    console.log('✅ 全局清理完成')
    
  } catch (error) {
    console.error('❌ 全局清理失败:', error)
  } finally {
    await browser.close()
  }
}

async function cleanupTestData(page: any) {
  console.log('🗑️  清理测试数据...')
  
  try {
    // 登录管理员账号
    await page.goto('http://localhost:8081/login')
    
    const currentUrl = page.url()
    if (!currentUrl.includes('/dashboard')) {
      await page.fill('input[placeholder="用户名"]', 'admin')
      await page.fill('input[placeholder="密码"]', 'admin123')
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard', { timeout: 10000 })
    }
    
    // 清理测试项目
    await cleanupTestProjects(page)
    
    // 清理测试通知
    await cleanupTestNotifications(page)
    
    console.log('✅ 测试数据清理完成')
    
  } catch (error) {
    console.warn('⚠️  测试数据清理失败:', error.message)
  }
}

async function cleanupTestProjects(page: any) {
  try {
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
      
      console.log(`🔍 找到${cardCount}个测试项目`)
      
      // 注意：这里只是标记要清理的项目
      // 实际的数据清理应该通过API或数据库操作完成
      // 避免在UI中进行大量删除操作，因为可能没有删除功能
      
      if (cardCount > 0) {
        console.log('ℹ️  测试项目将在数据库清理脚本中删除')
      }
    }
    
  } catch (error) {
    console.warn('清理测试项目失败:', error.message)
  }
}

async function cleanupTestNotifications(page: any) {
  try {
    await page.goto('http://localhost:8081/project/collaboration')
    
    // 打开通知
    const notificationButton = page.locator('text=通知')
    if (await notificationButton.isVisible()) {
      await notificationButton.click()
      await page.waitForSelector('.el-drawer', { state: 'visible' })
      
      // 标记所有通知为已读（清理未读状态）
      const markAllButton = page.locator('text=全部已读')
      if (await markAllButton.isVisible()) {
        await markAllButton.click()
        await page.waitForSelector('.el-message--success', { timeout: 5000 })
        console.log('✅ 已标记所有通知为已读')
      }
      
      // 关闭通知抽屉
      await page.keyboard.press('Escape')
    }
    
  } catch (error) {
    console.warn('清理测试通知失败:', error.message)
  }
}

// 数据库清理函数（需要后端支持）
async function performDatabaseCleanup() {
  try {
    // 这里可以调用后端清理API
    // 或者直接连接数据库清理测试数据
    const response = await fetch('http://localhost:3000/api/test/cleanup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cleanupType: 'playwright-tests'
      })
    })
    
    if (response.ok) {
      console.log('✅ 数据库测试数据清理完成')
    } else {
      console.warn('⚠️  数据库清理API未可用')
    }
    
  } catch (error) {
    console.warn('⚠️  数据库清理失败:', error.message)
  }
}

export default globalTeardown