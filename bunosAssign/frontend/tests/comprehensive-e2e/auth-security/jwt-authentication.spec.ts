import { test, expect } from '@playwright/test'
import { ComprehensiveTestUtils } from '../../utils/comprehensive-test-utils'

/**
 * JWT Authentication Tests
 * Validates JWT token handling, refresh mechanisms, and security
 */

test.describe('JWT Authentication System', () => {
  let utils: ComprehensiveTestUtils

  test.beforeEach(async ({ page, request }) => {
    utils = new ComprehensiveTestUtils(page, request)
  })

  test.describe('Login Flow Tests', () => {
    test('should successfully login with valid credentials', async ({ page, request }) => {
      await page.goto('/login')
      
      // Fill login form
      await page.fill('input[placeholder="用户名"]', 'admin')
      await page.fill('input[placeholder="密码"]', 'admin123')
      
      // Intercept login API call
      const [response] = await Promise.all([
        page.waitForResponse('**/api/auth/login'),
        page.click('button[type="submit"]')
      ])
      
      // Verify API response
      expect(response.status()).toBe(200)
      const responseData = await response.json()
      
      expect(responseData.code).toBe(200)
      expect(responseData.data.token).toBeTruthy()
      expect(responseData.data.refreshToken).toBeTruthy()
      expect(responseData.data.user).toBeTruthy()
      
      // Verify JWT token structure
      const token = responseData.data.token
      const tokenParts = token.split('.')
      expect(tokenParts).toHaveLength(3) // Header.Payload.Signature
      
      // Decode and verify payload (without signature verification)
      const payload = JSON.parse(atob(tokenParts[1]))
      expect(payload.userId).toBeTruthy()
      expect(payload.username).toBe('admin')
      expect(payload.exp).toBeGreaterThan(Date.now() / 1000) // Not expired
      
      // Verify redirect to dashboard
      await expect(page).toHaveURL(/dashboard/)
      
      // Verify authentication state in localStorage
      const authState = await page.evaluate(() => {
        const token = localStorage.getItem('token')
        const refreshToken = localStorage.getItem('refreshToken')
        return { token, refreshToken }
      })
      
      expect(authState.token).toBeTruthy()
      expect(authState.refreshToken).toBeTruthy()
    })

    test('should reject invalid credentials', async ({ page }) => {
      await page.goto('/login')
      
      // Try invalid credentials
      await page.fill('input[placeholder="用户名"]', 'invalid_user')
      await page.fill('input[placeholder="密码"]', 'invalid_password')
      
      const [response] = await Promise.all([
        page.waitForResponse('**/api/auth/login'),
        page.click('button[type="submit"]')
      ])
      
      // Should return 401 Unauthorized
      expect(response.status()).toBe(401)
      
      // Should show error message
      await expect(page.locator('.el-message--error')).toBeVisible()
      
      // Should remain on login page
      expect(page.url()).toContain('/login')
    })

    test('should handle empty credentials', async ({ page }) => {
      await page.goto('/login')
      
      // Try to submit without credentials
      await page.click('button[type="submit"]')
      
      // Should show form validation errors
      await expect(page.locator('.el-form-item__error')).toBeVisible()
      
      // Should remain on login page
      expect(page.url()).toContain('/login')
    })

    test('should enforce rate limiting for failed attempts', async ({ page }) => {
      await page.goto('/login')
      
      // Attempt multiple failed logins
      for (let i = 0; i < 5; i++) {
        await page.fill('input[placeholder="用户名"]', 'test_user')
        await page.fill('input[placeholder="密码"]', 'wrong_password')
        
        await Promise.all([
          page.waitForResponse('**/api/auth/login'),
          page.click('button[type="submit"]')
        ])
        
        // Clear fields for next attempt
        await page.fill('input[placeholder="用户名"]', '')
        await page.fill('input[placeholder="密码"]', '')
      }
      
      // Next attempt should be rate limited
      await page.fill('input[placeholder="用户名"]', 'test_user')
      await page.fill('input[placeholder="密码"]', 'wrong_password')
      
      const [response] = await Promise.all([
        page.waitForResponse('**/api/auth/login'),
        page.click('button[type="submit"]')
      ])
      
      // Should return 429 Too Many Requests
      expect(response.status()).toBe(429)
    })
  })

  test.describe('Token Validation Tests', () => {
    test('should validate JWT token on protected routes', async ({ page, request }) => {
      const token = await utils.loginAs('admin')
      
      // Make authenticated request
      const result = await utils.testApiEndpoint('GET', '/api/users', { token })
      
      expect(result.status).toBe(200)
      expect(result.data.code).toBe(200)
    })

    test('should reject requests with invalid token', async ({ request }) => {
      const invalidToken = 'invalid.jwt.token'
      
      const result = await utils.testApiEndpoint('GET', '/api/users', { 
        token: invalidToken,
        expectedStatus: 401 
      })
      
      expect(result.status).toBe(401)
    })

    test('should reject requests with expired token', async ({ request }) => {
      // Create an expired token (simulate by using a token with past exp claim)
      const expiredPayload = {
        userId: 1,
        username: 'admin',
        exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
      }
      
      // This is a mock expired token - in real scenario this would be generated properly
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' + 
                          btoa(JSON.stringify(expiredPayload)) + 
                          '.mock_signature'
      
      const result = await utils.testApiEndpoint('GET', '/api/users', {
        token: expiredToken,
        expectedStatus: 401
      })
      
      expect(result.status).toBe(401)
    })

    test('should validate token permissions for role-based access', async ({ request }) => {
      // Test admin access
      const adminToken = await utils.loginAs('admin')
      const adminResult = await utils.testApiEndpoint('GET', '/api/users', { 
        token: adminToken 
      })
      expect(adminResult.status).toBe(200)
      
      // Test employee access (should be forbidden)
      const employeeToken = await utils.loginAs('employee')
      const employeeResult = await utils.testApiEndpoint('GET', '/api/users', {
        token: employeeToken,
        expectedStatus: 403
      })
      expect(employeeResult.status).toBe(403)
    })
  })

  test.describe('Token Refresh Mechanism', () => {
    test('should refresh access token using refresh token', async ({ page, request }) => {
      // Login to get tokens
      const adminToken = await utils.loginAs('admin')
      
      // Get refresh token from localStorage
      const refreshToken = await page.evaluate(() => 
        localStorage.getItem('refreshToken')
      )
      
      expect(refreshToken).toBeTruthy()
      
      // Test token refresh
      const refreshResult = await utils.testApiEndpoint('POST', '/api/auth/refresh', {
        data: { refreshToken }
      })
      
      expect(refreshResult.status).toBe(200)
      expect(refreshResult.data.data.token).toBeTruthy()
      expect(refreshResult.data.data.token).not.toBe(adminToken) // New token
    })

    test('should reject invalid refresh token', async ({ request }) => {
      const invalidRefreshToken = 'invalid_refresh_token'
      
      const result = await utils.testApiEndpoint('POST', '/api/auth/refresh', {
        data: { refreshToken: invalidRefreshToken },
        expectedStatus: 401
      })
      
      expect(result.status).toBe(401)
    })

    test('should handle automatic token refresh on API calls', async ({ page, request }) => {
      await utils.loginAs('admin')
      
      // Navigate to a protected route
      await page.goto('/employees')
      await page.waitForLoadState('networkidle')
      
      // Simulate token expiry by clearing current token
      await page.evaluate(() => {
        localStorage.setItem('token', 'expired.token.here')
      })
      
      // Make API call that should trigger refresh
      const apiCall = page.locator('text=查询').click()
      
      // Should automatically refresh token and succeed
      await expect(page.locator('.employee-table')).toBeVisible({ timeout: 10000 })
      
      // Verify new token was set
      const newToken = await page.evaluate(() => localStorage.getItem('token'))
      expect(newToken).not.toBe('expired.token.here')
    })
  })

  test.describe('Logout and Session Management', () => {
    test('should properly logout and clear authentication state', async ({ page }) => {
      await utils.loginAs('admin')
      
      // Verify logged in state
      await expect(page.locator('.user-avatar')).toBeVisible()
      
      // Perform logout
      await page.click('.user-avatar')
      await page.click('text=退出登录')
      
      // Should redirect to login page
      await expect(page).toHaveURL(/login/)
      
      // Authentication state should be cleared
      const authState = await page.evaluate(() => ({
        token: localStorage.getItem('token'),
        refreshToken: localStorage.getItem('refreshToken'),
        user: localStorage.getItem('user')
      }))
      
      expect(authState.token).toBeNull()
      expect(authState.refreshToken).toBeNull()
      expect(authState.user).toBeNull()
    })

    test('should handle concurrent sessions', async ({ context }) => {
      // Create two separate browser contexts
      const page1 = await context.newPage()
      const page2 = await context.newPage()
      
      const utils1 = new ComprehensiveTestUtils(page1)
      const utils2 = new ComprehensiveTestUtils(page2)
      
      // Login with same user in both sessions
      await utils1.loginAs('admin')
      await utils2.loginAs('admin')
      
      // Both sessions should work independently
      await page1.goto('/dashboard')
      await page2.goto('/dashboard')
      
      await expect(page1.locator('.dashboard')).toBeVisible()
      await expect(page2.locator('.dashboard')).toBeVisible()
      
      // Logout from one session
      await page1.click('.user-avatar')
      await page1.click('text=退出登录')
      
      // Other session should still work
      await page2.reload()
      await expect(page2.locator('.dashboard')).toBeVisible()
    })

    test('should handle session timeout', async ({ page }) => {
      await utils.loginAs('admin')
      
      // Simulate session timeout by manipulating token timestamp
      await page.evaluate(() => {
        const token = localStorage.getItem('token')
        if (token) {
          const parts = token.split('.')
          const payload = JSON.parse(atob(parts[1]))
          payload.exp = Math.floor(Date.now() / 1000) - 1 // Expired
          parts[1] = btoa(JSON.stringify(payload))
          localStorage.setItem('token', parts.join('.'))
        }
      })
      
      // Navigate to protected page
      await page.goto('/employees')
      
      // Should redirect to login due to expired session
      await expect(page).toHaveURL(/login/)
      
      // Should show session timeout message
      await expect(page.locator('.el-message--warning')).toBeVisible()
    })
  })

  test.describe('Security Measures', () => {
    test('should prevent JWT token tampering', async ({ request }) => {
      const validToken = await utils.loginAs('admin')
      
      // Tamper with token payload
      const parts = validToken.split('.')
      const payload = JSON.parse(atob(parts[1]))
      payload.userId = 999 // Change user ID
      payload.role = 'super_admin' // Escalate privileges
      const tamperedToken = parts[0] + '.' + btoa(JSON.stringify(payload)) + '.' + parts[2]
      
      // Should reject tampered token
      const result = await utils.testApiEndpoint('GET', '/api/users', {
        token: tamperedToken,
        expectedStatus: 401
      })
      
      expect(result.status).toBe(401)
    })

    test('should enforce HTTPS in production', async ({ request }) => {
      // This test would check for HTTPS enforcement in production environment
      // For now, we'll verify the security headers are present
      
      const response = await request.get('/api/health')
      const headers = response.headers()
      
      // Verify security headers (these should be set by the server)
      expect(headers['x-content-type-options']).toBeDefined()
      expect(headers['x-frame-options']).toBeDefined()
      expect(headers['x-xss-protection']).toBeDefined()
    })

    test('should validate token signature', async ({ request }) => {
      const validToken = await utils.loginAs('admin')
      
      // Create token with invalid signature
      const parts = validToken.split('.')
      const invalidSignatureToken = parts[0] + '.' + parts[1] + '.invalid_signature'
      
      const result = await utils.testApiEndpoint('GET', '/api/users', {
        token: invalidSignatureToken,
        expectedStatus: 401
      })
      
      expect(result.status).toBe(401)
    })

    test('should handle token replay attacks', async ({ request }) => {
      const token = await utils.loginAs('admin')
      
      // Use same token multiple times rapidly
      const promises = Array(10).fill(null).map(() =>
        utils.testApiEndpoint('GET', '/api/health', { token })
      )
      
      const results = await Promise.all(promises)
      
      // All requests should succeed (tokens are reusable until expiry)
      // But server should log suspicious activity
      results.forEach(result => {
        expect(result.status).toBe(200)
      })
    })
  })

  test.describe('Performance Tests', () => {
    test('JWT authentication response time should be fast', async ({ page }) => {
      await page.goto('/login')
      
      const startTime = performance.now()
      
      await page.fill('input[placeholder="用户名"]', 'admin')
      await page.fill('input[placeholder="密码"]', 'admin123')
      
      const [response] = await Promise.all([
        page.waitForResponse('**/api/auth/login'),
        page.click('button[type="submit"]')
      ])
      
      const endTime = performance.now()
      const responseTime = endTime - startTime
      
      expect(response.status()).toBe(200)
      expect(responseTime).toBeLessThan(2000) // Should complete within 2 seconds
    })

    test('Token validation should be fast', async ({ request }) => {
      const token = await utils.loginAs('admin')
      
      const startTime = performance.now()
      const result = await utils.testApiEndpoint('GET', '/api/health', { token })
      const endTime = performance.now()
      
      const responseTime = endTime - startTime
      
      expect(result.status).toBe(200)
      expect(responseTime).toBeLessThan(100) // Token validation should be very fast
    })
  })
})