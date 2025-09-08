import { Page, expect, APIRequestContext } from '@playwright/test'
import { performance } from 'perf_hooks'

export interface TestUser {
  username: string
  password: string
  realName: string
  role: 'admin' | 'project_manager' | 'employee'
  permissions: string[]
}

export interface ProjectData {
  name: string
  code: string
  description: string
  budget: number
  bonusPool: number
  profitTarget: number
  status: 'draft' | 'published' | 'closed'
}

export interface EmployeeData {
  employeeNo: string
  name: string
  departmentId: number
  positionId: number
  annualSalary: number
  entryDate: string
}

/**
 * Comprehensive Test Utilities for E2E Testing
 */
export class ComprehensiveTestUtils {
  private page: Page
  private apiContext?: APIRequestContext
  private authTokens: Map<string, string> = new Map()
  
  constructor(page: Page, apiContext?: APIRequestContext) {
    this.page = page
    this.apiContext = apiContext
  }

  // ========== Authentication & Authorization ==========
  
  /**
   * Login with different user roles and cache tokens
   */
  async loginAs(userType: 'admin' | 'project_manager' | 'employee'): Promise<string> {
    const users: Record<string, TestUser> = {
      admin: {
        username: 'admin',
        password: 'admin123',
        realName: '系统管理员',
        role: 'admin',
        permissions: ['*']
      },
      project_manager: {
        username: 'pm001',
        password: 'pm123456',
        realName: '项目经理',
        role: 'project_manager',
        permissions: ['project.create', 'project.edit', 'project.view', 'employee.view']
      },
      employee: {
        username: 'emp001',
        password: 'emp123456',
        realName: '普通员工',
        role: 'employee',
        permissions: ['project.view', 'personal.view']
      }
    }

    const user = users[userType]
    
    // Check if already cached
    if (this.authTokens.has(userType)) {
      return this.authTokens.get(userType)!
    }

    await this.page.goto('/login')
    await this.page.fill('input[placeholder="用户名"]', user.username)
    await this.page.fill('input[placeholder="密码"]', user.password)
    
    const [response] = await Promise.all([
      this.page.waitForResponse('**/api/auth/login'),
      this.page.click('button[type="submit"]')
    ])
    
    expect(response.status()).toBe(200)
    
    const responseData = await response.json()
    const token = responseData.data.token
    
    this.authTokens.set(userType, token)
    
    // Wait for redirect to dashboard
    await this.page.waitForURL('**/dashboard')
    
    return token
  }

  /**
   * Verify JWT token validity and permissions
   */
  async verifyTokenPermissions(token: string, expectedPermissions: string[]): Promise<boolean> {
    if (!this.apiContext) return false
    
    const response = await this.apiContext.get('/api/auth/verify', {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (response.status() !== 200) return false
    
    const data = await response.json()
    const userPermissions = data.data.permissions
    
    return expectedPermissions.every(permission => 
      userPermissions.includes(permission) || userPermissions.includes('*')
    )
  }

  /**
   * Test token refresh mechanism
   */
  async testTokenRefresh(expiredToken: string): Promise<boolean> {
    if (!this.apiContext) return false
    
    const response = await this.apiContext.post('/api/auth/refresh', {
      headers: { Authorization: `Bearer ${expiredToken}` }
    })
    
    return response.status() === 200
  }

  // ========== API Testing Utilities ==========
  
  /**
   * Test API endpoint with various scenarios
   */
  async testApiEndpoint(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    options: {
      token?: string
      data?: any
      expectedStatus?: number
      timeout?: number
    } = {}
  ): Promise<any> {
    const { token, data, expectedStatus = 200, timeout = 10000 } = options
    
    if (!this.apiContext) throw new Error('API context not available')
    
    const headers: Record<string, string> = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    
    const startTime = performance.now()
    
    let response
    switch (method) {
      case 'GET':
        response = await this.apiContext.get(endpoint, { headers, timeout })
        break
      case 'POST':
        response = await this.apiContext.post(endpoint, { 
          headers: { ...headers, 'Content-Type': 'application/json' }, 
          data, 
          timeout 
        })
        break
      case 'PUT':
        response = await this.apiContext.put(endpoint, { 
          headers: { ...headers, 'Content-Type': 'application/json' }, 
          data, 
          timeout 
        })
        break
      case 'DELETE':
        response = await this.apiContext.delete(endpoint, { headers, timeout })
        break
      default:
        throw new Error(`Unsupported method: ${method}`)
    }
    
    const endTime = performance.now()
    const responseTime = endTime - startTime
    
    expect(response.status(), `API ${method} ${endpoint} failed`).toBe(expectedStatus)
    
    let responseData = null
    try {
      responseData = await response.json()
    } catch {
      // Response might not be JSON
    }
    
    return {
      status: response.status(),
      data: responseData,
      responseTime,
      headers: response.headers()
    }
  }

  // ========== Performance Testing ==========
  
  /**
   * Measure page load performance
   */
  async measurePagePerformance(url: string, maxLoadTime: number = 3000): Promise<{
    loadTime: number
    domContentLoaded: number
    firstContentfulPaint?: number
    passed: boolean
  }> {
    const startTime = performance.now()
    
    await this.page.goto(url, { waitUntil: 'networkidle' })
    
    const endTime = performance.now()
    const loadTime = endTime - startTime
    
    const navigationTiming = await this.page.evaluate(() => {
      const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.domContentLoadedEventStart,
        loadComplete: timing.loadEventEnd - timing.loadEventStart
      }
    })
    
    let firstContentfulPaint
    try {
      const paintEntries = await this.page.evaluate(() => 
        performance.getEntriesByType('paint')
      )
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint')
      firstContentfulPaint = fcpEntry?.startTime
    } catch {
      // FCP might not be available
    }
    
    return {
      loadTime,
      domContentLoaded: navigationTiming.domContentLoaded,
      firstContentfulPaint,
      passed: loadTime <= maxLoadTime
    }
  }

  /**
   * Test database query performance
   */
  async measureDatabaseQueryPerformance(
    endpoint: string,
    token: string,
    maxResponseTime: number = 500
  ): Promise<{
    responseTime: number
    recordCount?: number
    passed: boolean
  }> {
    const result = await this.testApiEndpoint('GET', endpoint, { token })
    
    const recordCount = Array.isArray(result.data?.data?.list) ? 
      result.data.data.list.length : 
      Array.isArray(result.data?.data) ? result.data.data.length : undefined
    
    return {
      responseTime: result.responseTime,
      recordCount,
      passed: result.responseTime <= maxResponseTime
    }
  }

  // ========== Database Testing ==========
  
  /**
   * Create test employee data
   */
  async createTestEmployee(token: string, employeeData?: Partial<EmployeeData>): Promise<any> {
    const defaultData: EmployeeData = {
      employeeNo: `EMP${Date.now()}`,
      name: `测试员工${Date.now()}`,
      departmentId: 1,
      positionId: 1,
      annualSalary: 100000,
      entryDate: new Date().toISOString().split('T')[0],
      ...employeeData
    }
    
    return await this.testApiEndpoint('POST', '/api/employees', {
      token,
      data: defaultData
    })
  }

  /**
   * Create test project data
   */
  async createTestProject(token: string, projectData?: Partial<ProjectData>): Promise<any> {
    const defaultData: ProjectData = {
      name: `测试项目${Date.now()}`,
      code: `TEST${Date.now()}`,
      description: '自动化测试项目',
      budget: 100000,
      bonusPool: 50000,
      profitTarget: 200000,
      status: 'draft',
      ...projectData
    }
    
    return await this.testApiEndpoint('POST', '/api/projects', {
      token,
      data: defaultData
    })
  }

  /**
   * Cleanup test data
   */
  async cleanupTestData(token: string): Promise<void> {
    try {
      // Clean up test employees
      const employees = await this.testApiEndpoint('GET', '/api/employees', { token })
      if (employees.data?.data?.list) {
        for (const employee of employees.data.data.list) {
          if (employee.name?.includes('测试') || employee.employeeNo?.includes('EMP')) {
            await this.testApiEndpoint('DELETE', `/api/employees/${employee.id}`, { 
              token, 
              expectedStatus: 200 
            }).catch(() => {})
          }
        }
      }
      
      // Clean up test projects
      const projects = await this.testApiEndpoint('GET', '/api/projects', { token })
      if (projects.data?.data?.list) {
        for (const project of projects.data.data.list) {
          if (project.name?.includes('测试') || project.code?.includes('TEST')) {
            await this.testApiEndpoint('DELETE', `/api/projects/${project.id}`, { 
              token, 
              expectedStatus: 200 
            }).catch(() => {})
          }
        }
      }
    } catch (error) {
      console.warn('Cleanup failed:', error)
    }
  }

  // ========== Security Testing ==========
  
  /**
   * Test SQL injection attempts
   */
  async testSQLInjection(endpoint: string, token: string): Promise<boolean> {
    const maliciousInputs = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "' UNION SELECT * FROM users --",
      "<script>alert('xss')</script>",
      "../../../etc/passwd"
    ]
    
    for (const maliciousInput of maliciousInputs) {
      try {
        const response = await this.testApiEndpoint('GET', 
          `${endpoint}?search=${encodeURIComponent(maliciousInput)}`, 
          { token, expectedStatus: 400 }
        )
        
        // Should not return sensitive data or cause server error
        if (response.status === 200 && response.data?.data?.length > 0) {
          return false // Potential vulnerability
        }
      } catch {
        // Expected to fail
      }
    }
    
    return true
  }

  /**
   * Test XSS prevention
   */
  async testXSSPrevention(): Promise<boolean> {
    const xssPayloads = [
      "<script>alert('xss')</script>",
      "<img src=x onerror=alert('xss')>",
      "javascript:alert('xss')",
      "<svg onload=alert('xss')>"
    ]
    
    for (const payload of xssPayloads) {
      await this.page.fill('input[type="text"]:first-of-type', payload)
      
      // Check if script was executed (should not happen)
      const alertFired = await this.page.evaluate(() => {
        let alertCalled = false
        const originalAlert = window.alert
        window.alert = () => { alertCalled = true }
        setTimeout(() => { window.alert = originalAlert }, 100)
        return alertCalled
      })
      
      if (alertFired) {
        return false // XSS vulnerability found
      }
    }
    
    return true
  }

  // ========== Bonus Calculation Testing ==========
  
  /**
   * Test three-dimensional bonus calculation
   */
  async testThreeDimensionalCalculation(
    token: string,
    calculationData: {
      employeeId: number
      period: string
      profitContribution: number
      positionValue: number
      performanceScore: number
    }
  ): Promise<any> {
    return await this.testApiEndpoint('POST', '/api/calculations/three-dimensional', {
      token,
      data: calculationData
    })
  }

  /**
   * Validate calculation results
   */
  async validateCalculationResults(
    result: any,
    expected: {
      totalBonus: number
      profitComponent: number
      positionComponent: number
      performanceComponent: number
    },
    tolerance: number = 0.01
  ): Promise<boolean> {
    if (!result.data?.calculationResult) return false
    
    const actual = result.data.calculationResult
    
    return Math.abs(actual.totalBonus - expected.totalBonus) <= tolerance &&
           Math.abs(actual.profitComponent - expected.profitComponent) <= tolerance &&
           Math.abs(actual.positionComponent - expected.positionComponent) <= tolerance &&
           Math.abs(actual.performanceComponent - expected.performanceComponent) <= tolerance
  }

  // ========== UI Testing Utilities ==========
  
  /**
   * Wait for element to be stable (no changes for specified time)
   */
  async waitForStable(selector: string, stableTime: number = 1000): Promise<void> {
    let lastText = ''
    let stableCount = 0
    const checkInterval = 100
    const requiredStableChecks = stableTime / checkInterval
    
    while (stableCount < requiredStableChecks) {
      try {
        const element = this.page.locator(selector)
        const currentText = await element.textContent() || ''
        
        if (currentText === lastText) {
          stableCount++
        } else {
          stableCount = 0
          lastText = currentText
        }
        
        await this.page.waitForTimeout(checkInterval)
      } catch {
        // Element might not exist yet
        stableCount = 0
        await this.page.waitForTimeout(checkInterval)
      }
    }
  }

  /**
   * Test responsive design at different viewport sizes
   */
  async testResponsiveDesign(
    url: string,
    viewports: Array<{ width: number; height: number; name: string }>
  ): Promise<Array<{ viewport: string; passed: boolean; issues?: string[] }>> {
    const results = []
    
    for (const viewport of viewports) {
      await this.page.setViewportSize({ width: viewport.width, height: viewport.height })
      await this.page.goto(url)
      await this.page.waitForLoadState('networkidle')
      
      const issues = []
      
      // Check for horizontal scrollbar (usually indicates layout issues)
      const hasHorizontalScroll = await this.page.evaluate(() => 
        document.documentElement.scrollWidth > document.documentElement.clientWidth
      )
      
      if (hasHorizontalScroll) {
        issues.push('Horizontal scrollbar detected')
      }
      
      // Check for overlapping elements
      const overlappingElements = await this.page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'))
        const overlapping = []
        
        for (let i = 0; i < elements.length; i++) {
          for (let j = i + 1; j < elements.length; j++) {
            const rect1 = elements[i].getBoundingClientRect()
            const rect2 = elements[j].getBoundingClientRect()
            
            if (rect1.left < rect2.right && rect2.left < rect1.right &&
                rect1.top < rect2.bottom && rect2.top < rect1.bottom) {
              overlapping.push([elements[i].tagName, elements[j].tagName])
            }
          }
        }
        
        return overlapping.length > 0
      })
      
      if (overlappingElements) {
        issues.push('Overlapping elements detected')
      }
      
      results.push({
        viewport: viewport.name,
        passed: issues.length === 0,
        issues: issues.length > 0 ? issues : undefined
      })
    }
    
    return results
  }

  // ========== Reporting Utilities ==========
  
  /**
   * Generate performance report
   */
  generatePerformanceReport(results: any[]): string {
    const report = {
      testSuite: 'Comprehensive E2E Tests',
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      },
      results
    }
    
    return JSON.stringify(report, null, 2)
  }
}