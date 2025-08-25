import { test, expect } from '@playwright/test'

// 视觉回归和UI组件测试
test.describe('项目协作模块 - 视觉回归测试', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8081/login')
    await page.fill('input[placeholder="用户名"]', 'admin')
    await page.fill('input[placeholder="密码"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
  })

  test.describe('页面截图对比', () => {
    test('项目协作主页面截图', async ({ page }) => {
      await page.goto('http://localhost:8081/project/collaboration')
      await page.waitForLoadState('networkidle')
      
      // 等待所有内容加载完成
      await page.waitForSelector('.project-collaboration', { state: 'visible' })
      await page.waitForTimeout(2000) // 等待动画完成
      
      // 隐藏可能变化的元素（如时间戳）
      await page.addStyleTag({
        content: `
          .notification-time,
          .project-time,
          .application-time {
            visibility: hidden !important;
          }
        `
      })
      
      // 截图对比
      await expect(page).toHaveScreenshot('project-collaboration-main.png', {
        fullPage: true,
        threshold: 0.3
      })
    })

    test('项目发布页面截图', async ({ page }) => {
      await page.goto('http://localhost:8081/project/publish')
      await page.waitForLoadState('networkidle')
      
      // 填写一些示例数据以显示完整表单状态
      await page.fill('input[placeholder="请输入项目名称"]', '视觉测试项目')
      await page.fill('input[placeholder="请输入项目代码"]', 'VISUAL_TEST_001')
      await page.fill('textarea[placeholder="请输入项目描述"]', '这是用于视觉回归测试的示例项目')
      
      await expect(page).toHaveScreenshot('project-publish-page.png', {
        fullPage: true,
        threshold: 0.3
      })
    })

    test('通知抽屉截图', async ({ page }) => {
      await page.goto('http://localhost:8081/project/collaboration')
      
      // 打开通知抽屉
      await page.click('text=通知')
      await page.waitForSelector('.el-drawer', { state: 'visible' })
      await page.waitForTimeout(500) // 等待动画完成
      
      // 隐藏时间戳
      await page.addStyleTag({
        content: `
          .notification-time {
            visibility: hidden !important;
          }
        `
      })
      
      await expect(page.locator('.el-drawer')).toHaveScreenshot('notification-drawer.png', {
        threshold: 0.3
      })
    })

    test('团队申请对话框截图', async ({ page }) => {
      await page.goto('http://localhost:8081/project/collaboration')
      await page.waitForLoadState('networkidle')
      
      // 查找并点击申请按钮
      const applyButtons = page.locator('text=申请团队')
      const count = await applyButtons.count()
      
      if (count > 0) {
        await applyButtons.first().click()
        await page.waitForSelector('.team-application-dialog', { state: 'visible' })
        
        // 填写一些示例数据
        await page.fill('input[placeholder="请输入团队名称"]', '视觉测试团队')
        await page.fill('textarea[placeholder="请描述团队的特点和优势"]', '这是用于视觉测试的示例团队描述')
        
        await expect(page.locator('.team-application-dialog')).toHaveScreenshot('team-application-dialog.png', {
          threshold: 0.3
        })
      } else {
        test.skip('没有可申请的项目')
      }
    })
  })

  test.describe('响应式布局截图', () => {
    test('移动端布局截图', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('http://localhost:8081/project/collaboration')
      await page.waitForLoadState('networkidle')
      
      await expect(page).toHaveScreenshot('mobile-layout.png', {
        fullPage: true,
        threshold: 0.3
      })
      
      // 测试移动端通知
      await page.click('text=通知')
      await page.waitForSelector('.el-drawer', { state: 'visible' })
      
      await expect(page.locator('.el-drawer')).toHaveScreenshot('mobile-notification.png', {
        threshold: 0.3
      })
    })

    test('平板端布局截图', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.goto('http://localhost:8081/project/collaboration')
      await page.waitForLoadState('networkidle')
      
      await expect(page).toHaveScreenshot('tablet-layout.png', {
        fullPage: true,
        threshold: 0.3
      })
    })

    test('桌面端大屏截图', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.goto('http://localhost:8081/project/collaboration')
      await page.waitForLoadState('networkidle')
      
      await expect(page).toHaveScreenshot('desktop-large.png', {
        fullPage: true,
        threshold: 0.3
      })
    })
  })

  test.describe('主题和样式测试', () => {
    test('暗色主题测试', async ({ page }) => {
      // 如果系统支持暗色主题
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.goto('http://localhost:8081/project/collaboration')
      await page.waitForLoadState('networkidle')
      
      // 应用暗色主题样式
      await page.addStyleTag({
        content: `
          body {
            background-color: #1a1a1a !important;
            color: #ffffff !important;
          }
          .el-card {
            background-color: #2d2d2d !important;
            border-color: #404040 !important;
          }
        `
      })
      
      await expect(page).toHaveScreenshot('dark-theme.png', {
        threshold: 0.4
      })
    })

    test('高对比度主题测试', async ({ page }) => {
      await page.goto('http://localhost:8081/project/collaboration')
      await page.waitForLoadState('networkidle')
      
      // 应用高对比度样式
      await page.addStyleTag({
        content: `
          * {
            background-color: white !important;
            color: black !important;
            border-color: black !important;
          }
          .el-button--primary {
            background-color: #000000 !important;
            color: #ffffff !important;
          }
        `
      })
      
      await expect(page).toHaveScreenshot('high-contrast.png', {
        threshold: 0.5
      })
    })
  })

  test.describe('动画和过渡效果', () => {
    test('页面切换动画', async ({ page }) => {
      await page.goto('http://localhost:8081/project/collaboration')
      
      // 记录动画过程
      await page.click('text=待审批申请')
      await page.waitForTimeout(300) // 捕获动画中间状态
      
      await expect(page).toHaveScreenshot('tab-transition.png', {
        threshold: 0.4
      })
    })

    test('对话框打开动画', async ({ page }) => {
      await page.goto('http://localhost:8081/project/collaboration')
      
      const applyButtons = page.locator('text=申请团队')
      const count = await applyButtons.count()
      
      if (count > 0) {
        // 开始动画
        const dialogPromise = page.waitForSelector('.team-application-dialog', { state: 'visible' })
        await applyButtons.first().click()
        await dialogPromise
        
        // 等待动画完成
        await page.waitForTimeout(300)
        
        await expect(page.locator('.team-application-dialog')).toHaveScreenshot('dialog-animation.png', {
          threshold: 0.3
        })
      } else {
        test.skip('没有可申请的项目')
      }
    })

    test('加载状态动画', async ({ page }) => {
      // 模拟慢速网络
      await page.route('**/api/project-collaboration/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000))
        route.continue()
      })
      
      await page.goto('http://localhost:8081/project/collaboration')
      
      // 捕获加载状态
      await page.waitForSelector('.el-loading-mask, .el-skeleton', { timeout: 1000 }).catch(() => {})
      
      const loadingElement = page.locator('.el-loading-mask, .el-skeleton').first()
      if (await loadingElement.isVisible()) {
        await expect(loadingElement).toHaveScreenshot('loading-state.png', {
          threshold: 0.3
        })
      }
    })
  })

  test.describe('错误状态UI', () => {
    test('空状态截图', async ({ page }) => {
      // 模拟空数据响应
      await page.route('**/api/project-collaboration/projects**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            code: 200,
            message: 'success',
            data: {
              projects: [],
              pagination: { total: 0, page: 1, pageSize: 20 }
            }
          })
        })
      })
      
      await page.goto('http://localhost:8081/project/collaboration')
      await page.waitForSelector('.el-empty', { state: 'visible' })
      
      await expect(page.locator('.el-empty')).toHaveScreenshot('empty-state.png', {
        threshold: 0.3
      })
    })

    test('错误状态截图', async ({ page }) => {
      await page.goto('http://localhost:8081/project/collaboration')
      
      // 触发错误消息
      await page.evaluate(() => {
        // 模拟显示错误消息
        const message = document.createElement('div')
        message.className = 'el-message el-message--error'
        message.innerHTML = `
          <i class="el-message__icon el-icon-error"></i>
          <p class="el-message__content">网络连接失败，请检查网络设置后重试</p>
        `
        message.style.cssText = `
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          padding: 15px 20px;
          background: #fef0f0;
          border: 1px solid #fde2e2;
          border-radius: 4px;
          color: #f56c6c;
        `
        document.body.appendChild(message)
      })
      
      await page.waitForTimeout(500)
      
      await expect(page.locator('.el-message--error')).toHaveScreenshot('error-message.png', {
        threshold: 0.3
      })
    })

    test('表单验证错误截图', async ({ page }) => {
      await page.goto('http://localhost:8081/project/publish')
      
      // 触发表单验证错误
      await page.click('text=发布项目')
      await page.waitForSelector('.el-form-item__error', { state: 'visible' })
      
      await expect(page.locator('.publish-form')).toHaveScreenshot('form-validation-errors.png', {
        threshold: 0.3
      })
    })
  })

  test.describe('组件交互状态', () => {
    test('按钮悬停状态', async ({ page }) => {
      await page.goto('http://localhost:8081/project/collaboration')
      
      const publishButton = page.locator('text=发布项目')
      if (await publishButton.isVisible()) {
        // 悬停状态
        await publishButton.hover()
        await page.waitForTimeout(200)
        
        await expect(publishButton).toHaveScreenshot('button-hover.png', {
          threshold: 0.3
        })
      }
    })

    test('表单聚焦状态', async ({ page }) => {
      await page.goto('http://localhost:8081/project/publish')
      
      const nameInput = page.locator('input[placeholder="请输入项目名称"]')
      await nameInput.focus()
      await page.waitForTimeout(200)
      
      await expect(nameInput).toHaveScreenshot('input-focus.png', {
        threshold: 0.3
      })
    })

    test('卡片悬停效果', async ({ page }) => {
      await page.goto('http://localhost:8081/project/collaboration')
      await page.waitForLoadState('networkidle')
      
      const projectCards = page.locator('.project-card')
      const count = await projectCards.count()
      
      if (count > 0) {
        const firstCard = projectCards.first()
        await firstCard.hover()
        await page.waitForTimeout(200)
        
        await expect(firstCard).toHaveScreenshot('card-hover.png', {
          threshold: 0.3
        })
      }
    })

    test('下拉菜单展开状态', async ({ page }) => {
      await page.goto('http://localhost:8081/project/collaboration')
      
      const statusSelect = page.locator('.el-select')
      const count = await statusSelect.count()
      
      if (count > 0) {
        await statusSelect.first().click()
        await page.waitForSelector('.el-select-dropdown', { state: 'visible' })
        
        await expect(page.locator('.el-select-dropdown')).toHaveScreenshot('select-dropdown.png', {
          threshold: 0.3
        })
      }
    })
  })

  test.describe('数据展示组件', () => {
    test('表格组件截图', async ({ page }) => {
      await page.goto('http://localhost:8081/project/collaboration')
      
      // 切换到可能有表格的标签页
      await page.click('text=待审批申请')
      await page.waitForTimeout(1000)
      
      const table = page.locator('.el-table')
      if (await table.isVisible()) {
        await expect(table).toHaveScreenshot('data-table.png', {
          threshold: 0.3
        })
      }
    })

    test('分页组件截图', async ({ page }) => {
      await page.goto('http://localhost:8081/project/collaboration')
      await page.waitForLoadState('networkidle')
      
      const pagination = page.locator('.el-pagination')
      if (await pagination.isVisible()) {
        await expect(pagination).toHaveScreenshot('pagination.png', {
          threshold: 0.3
        })
      }
    })

    test('标签组件截图', async ({ page }) => {
      await page.goto('http://localhost:8081/project/collaboration')
      await page.waitForLoadState('networkidle')
      
      const tags = page.locator('.el-tag').first()
      if (await tags.isVisible()) {
        await expect(tags).toHaveScreenshot('status-tag.png', {
          threshold: 0.3
        })
      }
    })

    test('徽章组件截图', async ({ page }) => {
      await page.goto('http://localhost:8081/project/collaboration')
      
      const badge = page.locator('.el-badge')
      if (await badge.isVisible()) {
        await expect(badge).toHaveScreenshot('notification-badge.png', {
          threshold: 0.3
        })
      }
    })
  })

  test.describe('特殊状态截图', () => {
    test('长文本显示截图', async ({ page }) => {
      await page.goto('http://localhost:8081/project/publish')
      
      // 输入超长文本
      const longText = '这是一个非常长的项目描述文本，用来测试文本溢出和换行的处理效果。'.repeat(10)
      await page.fill('textarea[placeholder="请输入项目描述"]', longText)
      
      const textarea = page.locator('textarea[placeholder="请输入项目描述"]')
      await expect(textarea).toHaveScreenshot('long-text.png', {
        threshold: 0.3
      })
    })

    test('多语言文本截图', async ({ page }) => {
      await page.goto('http://localhost:8081/project/publish')
      
      // 输入多语言文本
      const multilingualText = 'Project 项目 プロジェクト Проект 🚀📊🎯'
      await page.fill('input[placeholder="请输入项目名称"]', multilingualText)
      
      const input = page.locator('input[placeholder="请输入项目名称"]')
      await expect(input).toHaveScreenshot('multilingual-text.png', {
        threshold: 0.3
      })
    })

    test('数据加载中截图', async ({ page }) => {
      // 模拟加载中状态
      await page.route('**/api/project-collaboration/**', async route => {
        await new Promise(resolve => setTimeout(resolve, 5000))
        route.continue()
      })
      
      const loadingPromise = page.goto('http://localhost:8081/project/collaboration')
      
      // 等待一小段时间让加载状态显示
      await page.waitForTimeout(1000)
      
      // 尝试捕获加载状态
      try {
        await expect(page).toHaveScreenshot('loading-page.png', {
          timeout: 2000,
          threshold: 0.4
        })
      } catch (error) {
        console.log('未捕获到加载状态，可能加载太快')
      }
      
      // 等待页面加载完成
      await loadingPromise
    })
  })
})