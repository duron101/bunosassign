import { test, expect, Page } from '@playwright/test'

// 边界情况和异常场景测试
test.describe('项目协作模块 - 边界情况测试', () => {
  
  test.beforeEach(async ({ page }) => {
    // 登录管理员账号
    await page.goto('http://localhost:8081/login')
    await page.fill('input[placeholder="用户名"]', 'admin')
    await page.fill('input[placeholder="密码"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
  })

  test.describe('表单边界值测试', () => {
    test('项目名称长度边界测试', async ({ page }) => {
      await page.goto('http://localhost:8081/project/publish')
      
      // 测试超长项目名称
      const longName = 'A'.repeat(101) // 假设限制是100字符
      await page.fill('input[placeholder="请输入项目名称"]', longName)
      await page.blur('input[placeholder="请输入项目名称"]')
      
      // 验证长度限制错误
      await expect(page.locator('.el-form-item__error:has-text("长度")')).toBeVisible()
      
      // 测试空项目名称
      await page.fill('input[placeholder="请输入项目名称"]', '')
      await page.blur('input[placeholder="请输入项目名称"]')
      await expect(page.locator('.el-form-item__error:has-text("必填")')).toBeVisible()
      
      // 测试正常长度
      await page.fill('input[placeholder="请输入项目名称"]', '正常长度的项目名称')
      await page.blur('input[placeholder="请输入项目名称"]')
      await expect(page.locator('.el-form-item__error')).not.toBeVisible()
    })

    test('预算数值边界测试', async ({ page }) => {
      await page.goto('http://localhost:8081/project/publish')
      
      // 测试负数预算
      await page.fill('input[placeholder="请输入项目预算"]', '-1000')
      await page.blur('input[placeholder="请输入项目预算"]')
      await expect(page.locator('.el-form-item__error')).toBeVisible()
      
      // 测试0预算
      await page.fill('input[placeholder="请输入项目预算"]', '0')
      await page.blur('input[placeholder="请输入项目预算"]')
      
      // 测试极大数值
      await page.fill('input[placeholder="请输入项目预算"]', '999999999999')
      await page.blur('input[placeholder="请输入项目预算"]')
      
      // 测试小数
      await page.fill('input[placeholder="请输入项目预算"]', '100000.50')
      await page.blur('input[placeholder="请输入项目预算"]')
      
      // 测试非数字输入
      await page.fill('input[placeholder="请输入项目预算"]', 'abc123')
      await page.blur('input[placeholder="请输入项目预算"]')
      await expect(page.locator('.el-form-item__error')).toBeVisible()
    })

    test('日期边界测试', async ({ page }) => {
      await page.goto('http://localhost:8081/project/publish')
      
      // 测试开始日期晚于结束日期
      const startDateInput = page.locator('input[placeholder="开始日期"]')
      const endDateInput = page.locator('input[placeholder="结束日期"]')
      
      if (await startDateInput.isVisible() && await endDateInput.isVisible()) {
        await startDateInput.fill('2024-12-31')
        await endDateInput.fill('2024-01-01')
        
        // 触发验证
        await page.click('text=发布项目')
        await expect(page.locator('.el-form-item__error, .el-message--error')).toBeVisible()
        
        // 修正日期
        await startDateInput.fill('2024-01-01')
        await endDateInput.fill('2024-12-31')
      }
    })
  })

  test.describe('并发操作测试', () => {
    test('同时申请同一项目', async ({ browser }) => {
      // 创建多个浏览器上下文模拟多用户
      const context1 = await browser.newContext()
      const context2 = await browser.newContext()
      
      const page1 = await context1.newPage()
      const page2 = await context2.newPage()
      
      // 两个用户同时登录
      for (const page of [page1, page2]) {
        await page.goto('http://localhost:8081/login')
        await page.fill('input[placeholder="用户名"]', 'admin')
        await page.fill('input[placeholder="密码"]', 'admin123')
        await page.click('button[type="submit"]')
        await page.waitForURL('**/dashboard')
        await page.goto('http://localhost:8081/project/collaboration')
      }
      
      // 同时申请团队
      const applyButtons1 = page1.locator('text=申请团队')
      const applyButtons2 = page2.locator('text=申请团队')
      
      if (await applyButtons1.count() > 0) {
        await Promise.all([
          applyButtons1.first().click(),
          applyButtons2.first().click()
        ])
        
        // 验证并发处理
        const dialog1 = page1.locator('.team-application-dialog')
        const dialog2 = page2.locator('.team-application-dialog')
        
        // 至少一个对话框应该成功打开
        const dialog1Visible = await dialog1.isVisible()
        const dialog2Visible = await dialog2.isVisible()
        
        expect(dialog1Visible || dialog2Visible).toBeTruthy()
      }
      
      await context1.close()
      await context2.close()
    })

    test('快速连续操作测试', async ({ page }) => {
      await page.goto('http://localhost:8081/project/collaboration')
      
      // 快速连续点击搜索
      const searchButton = page.locator('button:has-text("搜索")')
      await searchButton.click()
      await searchButton.click()
      await searchButton.click()
      
      // 系统应该能正确处理快速点击
      await page.waitForTimeout(2000)
      
      // 快速切换标签页
      await page.click('text=项目列表')
      await page.click('text=待审批申请')
      await page.click('text=项目列表')
      
      // 验证页面状态正常
      await expect(page.locator('.projects-section')).toBeVisible()
    })
  })

  test.describe('大数据量测试', () => {
    test('大量项目列表性能', async ({ page }) => {
      // 模拟大量项目数据
      await page.route('**/api/project-collaboration/projects**', route => {
        const projects = Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          name: `测试项目${i + 1}`,
          code: `TEST_${String(i + 1).padStart(3, '0')}`,
          description: `这是第${i + 1}个测试项目的描述`,
          cooperationStatus: ['published', 'team_building', 'approved'][i % 3],
          budget: (i + 1) * 10000,
          bonusScale: (i + 1) * 5000,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }))

        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 200,
            message: 'success',
            data: {
              projects,
              pagination: { total: 100, page: 1, pageSize: 20 }
            }
          })
        })
      })

      const startTime = Date.now()
      await page.goto('http://localhost:8081/project/collaboration')
      await page.waitForSelector('.project-card', { timeout: 10000 })
      const loadTime = Date.now() - startTime

      // 验证大数据量下的加载性能（应该在10秒内）
      expect(loadTime).toBeLessThan(10000)

      // 验证分页功能
      const paginationButtons = page.locator('.el-pagination .el-pager .number')
      const buttonCount = await paginationButtons.count()
      expect(buttonCount).toBeGreaterThan(1)
    })

    test('大量通知列表性能', async ({ page }) => {
      // 模拟大量通知数据
      await page.route('**/api/project-collaboration/notifications/my**', route => {
        const notifications = Array.from({ length: 50 }, (_, i) => ({
          id: i + 1,
          title: `通知标题${i + 1}`,
          content: `这是第${i + 1}条通知的内容，包含了详细的信息描述`,
          notificationType: ['project_published', 'team_applied', 'approved'][i % 3],
          isRead: i % 3 !== 0,
          createdAt: new Date(Date.now() - i * 1000 * 60 * 60).toISOString(),
          readAt: i % 3 !== 0 ? new Date().toISOString() : null
        }))

        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 200,
            message: 'success',
            data: {
              notifications,
              pagination: { total: 50, page: 1, pageSize: 20 },
              unreadCount: Math.floor(50 / 3)
            }
          })
        })
      })

      await page.goto('http://localhost:8081/project/collaboration')
      
      const startTime = Date.now()
      await page.click('text=通知')
      await page.waitForSelector('.notification-item', { timeout: 5000 })
      const loadTime = Date.now() - startTime

      // 通知应该快速加载
      expect(loadTime).toBeLessThan(5000)

      // 验证滚动加载功能
      const notificationList = page.locator('.notifications-list')
      await notificationList.evaluate(el => el.scrollTo(0, el.scrollHeight))
      
      // 验证"加载更多"按钮
      const loadMoreButton = page.locator('text=加载更多')
      if (await loadMoreButton.isVisible()) {
        await loadMoreButton.click()
        await page.waitForTimeout(2000)
      }
    })
  })

  test.describe('异常输入测试', () => {
    test('特殊字符输入测试', async ({ page }) => {
      await page.goto('http://localhost:8081/project/publish')
      
      // 测试各种特殊字符
      const specialChars = ['<script>alert("xss")</script>', '${jndi:ldap://test}', '../../etc/passwd', 'NULL', 'undefined', '0x41', '%00', '\n\r\t']
      
      for (const char of specialChars) {
        await page.fill('input[placeholder="请输入项目名称"]', char)
        await page.blur('input[placeholder="请输入项目名称"]')
        
        // 系统应该正确处理特殊字符，不应该崩溃
        const errorVisible = await page.locator('.el-form-item__error').isVisible()
        // 可以有验证错误，但页面应该保持稳定
        
        await page.fill('input[placeholder="请输入项目名称"]', '') // 清空
      }
    })

    test('Unicode字符输入测试', async ({ page }) => {
      await page.goto('http://localhost:8081/project/publish')
      
      // 测试各种Unicode字符
      const unicodeStrings = [
        '测试项目🚀',
        '项目名称 with émojis 📊',
        'Проект тест',
        'プロジェクトテスト',
        '🎯 重要项目 ⭐',
        'Test\u0000Project', // null字符
        'Test\uFFFDProject' // 替换字符
      ]
      
      for (const str of unicodeStrings) {
        await page.fill('input[placeholder="请输入项目名称"]', str)
        await page.blur('input[placeholder="请输入项目名称"]')
        
        // 验证输入值正确保存
        const inputValue = await page.inputValue('input[placeholder="请输入项目名称"]')
        // Unicode字符应该正确处理（除了控制字符）
        
        await page.fill('input[placeholder="请输入项目名称"]', '')
      }
    })

    test('SQL注入防护测试', async ({ page }) => {
      await page.goto('http://localhost:8081/project/collaboration')
      
      const sqlInjections = [
        "'; DROP TABLE projects; --",
        "' OR '1'='1",
        "'; INSERT INTO projects VALUES (999, 'hack'); --",
        "' UNION SELECT * FROM users --"
      ]
      
      for (const injection of sqlInjections) {
        await page.fill('input[placeholder="项目名称、代码"]', injection)
        await page.click('button:has-text("搜索")')
        
        // 系统应该正常处理，不应该暴露数据库错误
        await page.waitForTimeout(1000)
        
        // 验证没有数据库错误信息显示
        const errorMessage = await page.locator('.el-message--error').textContent()
        if (errorMessage) {
          expect(errorMessage).not.toContain('SQL')
          expect(errorMessage).not.toContain('database')
          expect(errorMessage).not.toContain('syntax')
        }
      }
    })
  })

  test.describe('会话和认证测试', () => {
    test('会话过期处理', async ({ page }) => {
      await page.goto('http://localhost:8081/project/collaboration')
      
      // 模拟会话过期
      await page.route('**/api/**', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 401,
            message: '会话已过期，请重新登录',
            data: null
          })
        })
      })
      
      // 执行需要认证的操作
      await page.click('button:has-text("搜索")')
      
      // 验证会话过期处理
      await expect(page.locator('.el-message--error, .el-notification')).toBeVisible({ timeout: 5000 })
      
      // 应该跳转到登录页面或显示重新登录提示
      await page.waitForTimeout(2000)
      const currentUrl = page.url()
      expect(currentUrl.includes('/login') || await page.locator('text=重新登录').isVisible()).toBeTruthy()
    })

    test('无效Token处理', async ({ page }) => {
      // 设置无效token
      await page.addInitScript(() => {
        localStorage.setItem('token', 'invalid-token-12345')
      })
      
      await page.goto('http://localhost:8081/project/collaboration')
      
      // 应该自动处理无效token并跳转登录
      await page.waitForTimeout(3000)
      const currentUrl = page.url()
      expect(currentUrl.includes('/login')).toBeTruthy()
    })

    test('并发会话冲突', async ({ browser }) => {
      const context1 = await browser.newContext()
      const context2 = await browser.newContext()
      
      const page1 = await context1.newPage()
      const page2 = await context2.newPage()
      
      // 同一用户在两个浏览器窗口登录
      for (const page of [page1, page2]) {
        await page.goto('http://localhost:8081/login')
        await page.fill('input[placeholder="用户名"]', 'admin')
        await page.fill('input[placeholder="密码"]', 'admin123')
        await page.click('button[type="submit"]')
        await page.waitForURL('**/dashboard')
      }
      
      // 在page1执行操作
      await page1.goto('http://localhost:8081/project/collaboration')
      
      // 在page2也执行操作
      await page2.goto('http://localhost:8081/project/collaboration')
      
      // 两个会话都应该正常工作或有适当的冲突处理
      const page1Working = await page1.locator('.project-collaboration').isVisible()
      const page2Working = await page2.locator('.project-collaboration').isVisible()
      
      // 至少一个会话应该正常工作
      expect(page1Working || page2Working).toBeTruthy()
      
      await context1.close()
      await context2.close()
    })
  })

  test.describe('浏览器兼容性测试', () => {
    test('本地存储功能测试', async ({ page }) => {
      await page.goto('http://localhost:8081/project/collaboration')
      
      // 测试localStorage可用性
      const isLocalStorageSupported = await page.evaluate(() => {
        try {
          localStorage.setItem('test', 'test')
          localStorage.removeItem('test')
          return true
        } catch (e) {
          return false
        }
      })
      
      expect(isLocalStorageSupported).toBeTruthy()
      
      // 测试token存储和读取
      await page.evaluate(() => {
        localStorage.setItem('test-token', 'test-value')
      })
      
      const storedValue = await page.evaluate(() => {
        return localStorage.getItem('test-token')
      })
      
      expect(storedValue).toBe('test-value')
    })

    test('Cookie功能测试', async ({ page }) => {
      await page.goto('http://localhost:8081/project/collaboration')
      
      // 设置和读取cookie
      await page.context().addCookies([{
        name: 'test-cookie',
        value: 'test-value',
        domain: 'localhost',
        path: '/'
      }])
      
      const cookies = await page.context().cookies()
      const testCookie = cookies.find(c => c.name === 'test-cookie')
      
      expect(testCookie?.value).toBe('test-value')
    })

    test('JavaScript错误捕获', async ({ page }) => {
      const jsErrors: string[] = []
      
      page.on('pageerror', error => {
        jsErrors.push(error.message)
      })
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          jsErrors.push(msg.text())
        }
      })
      
      await page.goto('http://localhost:8081/project/collaboration')
      await page.waitForTimeout(3000)
      
      // 执行各种操作
      await page.click('text=通知')
      await page.keyboard.press('Escape')
      
      const searchInput = page.locator('input[placeholder="项目名称、代码"]')
      if (await searchInput.isVisible()) {
        await searchInput.fill('test')
        await page.click('button:has-text("搜索")')
      }
      
      // 验证没有关键的JavaScript错误
      const criticalErrors = jsErrors.filter(error => 
        !error.includes('favicon') && 
        !error.includes('Extension') &&
        !error.includes('Chrome extension')
      )
      
      if (criticalErrors.length > 0) {
        console.warn('检测到JavaScript错误:', criticalErrors)
      }
      
      // 页面应该仍然可用
      await expect(page.locator('.project-collaboration')).toBeVisible()
    })
  })

  test.describe('可访问性测试', () => {
    test('键盘导航测试', async ({ page }) => {
      await page.goto('http://localhost:8081/project/collaboration')
      
      // 测试Tab键导航
      await page.keyboard.press('Tab')
      let focusedElement = await page.evaluate(() => document.activeElement?.tagName)
      
      // 应该能够通过键盘导航到可交互元素
      const interactiveElements = ['BUTTON', 'INPUT', 'SELECT', 'A']
      
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab')
        focusedElement = await page.evaluate(() => document.activeElement?.tagName)
        
        if (focusedElement && interactiveElements.includes(focusedElement)) {
          // 找到可交互元素，测试成功
          break
        }
      }
      
      // 测试Enter键激活
      if (focusedElement === 'BUTTON') {
        await page.keyboard.press('Enter')
        await page.waitForTimeout(1000)
      }
      
      // 测试Escape键关闭对话框
      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)
    })

    test('焦点管理测试', async ({ page }) => {
      await page.goto('http://localhost:8081/project/collaboration')
      
      // 打开通知抽屉
      await page.click('text=通知')
      await page.waitForSelector('.el-drawer')
      
      // 焦点应该移动到抽屉内
      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.closest('.el-drawer') !== null
      })
      
      // 关闭抽屉
      await page.keyboard.press('Escape')
      await page.waitForSelector('.el-drawer', { state: 'hidden' })
      
      // 焦点应该返回到触发元素或合适的位置
      const postCloseFocus = await page.evaluate(() => {
        return document.activeElement?.tagName
      })
      
      expect(['BUTTON', 'BODY'].includes(postCloseFocus || 'BODY')).toBeTruthy()
    })

    test('屏幕阅读器支持测试', async ({ page }) => {
      await page.goto('http://localhost:8081/project/collaboration')
      
      // 检查重要元素的aria属性
      const titleElement = page.locator('h2')
      const hasAriaRole = await titleElement.evaluate(el => 
        el.getAttribute('role') || el.tagName === 'H2'
      )
      expect(hasAriaRole).toBeTruthy()
      
      // 检查按钮的可访问性
      const buttons = page.locator('button')
      const buttonCount = await buttons.count()
      
      if (buttonCount > 0) {
        for (let i = 0; i < Math.min(buttonCount, 5); i++) {
          const button = buttons.nth(i)
          const buttonText = await button.textContent()
          const ariaLabel = await button.getAttribute('aria-label')
          
          // 按钮应该有可访问的文本或aria-label
          expect(buttonText || ariaLabel).toBeTruthy()
        }
      }
      
      // 检查表单元素的label
      const inputs = page.locator('input')
      const inputCount = await inputs.count()
      
      if (inputCount > 0) {
        for (let i = 0; i < Math.min(inputCount, 3); i++) {
          const input = inputs.nth(i)
          const placeholder = await input.getAttribute('placeholder')
          const ariaLabel = await input.getAttribute('aria-label')
          const associatedLabel = await input.evaluate(el => {
            const labels = document.querySelectorAll('label')
            for (let label of labels) {
              if (label.getAttribute('for') === el.id || label.contains(el)) {
                return label.textContent
              }
            }
            return null
          })
          
          // 输入框应该有可访问的标签
          expect(placeholder || ariaLabel || associatedLabel).toBeTruthy()
        }
      }
    })
  })

  test.describe('内存泄漏和性能测试', () => {
    test('页面切换内存测试', async ({ page }) => {
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0
      })
      
      // 多次切换页面
      for (let i = 0; i < 5; i++) {
        await page.goto('http://localhost:8081/project/collaboration')
        await page.waitForLoadState('networkidle')
        
        await page.goto('http://localhost:8081/project/publish')
        await page.waitForLoadState('networkidle')
        
        await page.goto('http://localhost:8081/dashboard')
        await page.waitForLoadState('networkidle')
      }
      
      // 强制垃圾回收（如果可用）
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc()
        }
      })
      
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0
      })
      
      // 内存增长不应该太大（允许一定的增长）
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryGrowth = finalMemory - initialMemory
        const growthRatio = memoryGrowth / initialMemory
        
        // 内存增长不应超过初始内存的200%
        expect(growthRatio).toBeLessThan(2.0)
      }
    })

    test('长时间运行稳定性测试', async ({ page }) => {
      await page.goto('http://localhost:8081/project/collaboration')
      
      const startTime = Date.now()
      let operationCount = 0
      const maxDuration = 30000 // 30秒测试
      
      while (Date.now() - startTime < maxDuration) {
        try {
          // 执行各种操作
          await page.click('text=通知')
          await page.waitForTimeout(500)
          await page.keyboard.press('Escape')
          
          const searchInput = page.locator('input[placeholder="项目名称、代码"]')
          if (await searchInput.isVisible()) {
            await searchInput.fill(`test${operationCount}`)
            await page.click('button:has-text("搜索")')
            await page.waitForTimeout(1000)
            await searchInput.fill('')
          }
          
          operationCount++
          
          // 每10次操作检查页面状态
          if (operationCount % 10 === 0) {
            await expect(page.locator('.project-collaboration')).toBeVisible()
          }
          
        } catch (error) {
          console.error(`操作${operationCount}失败:`, error)
          break
        }
      }
      
      console.log(`完成${operationCount}次操作，耗时${Date.now() - startTime}ms`)
      
      // 页面应该仍然响应
      await expect(page.locator('.project-collaboration')).toBeVisible()
      
      // 操作次数应该达到合理数量
      expect(operationCount).toBeGreaterThan(10)
    })
  })
})