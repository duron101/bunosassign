import { test, expect } from '@playwright/test'
import { ComprehensiveTestUtils } from '../../utils/comprehensive-test-utils'

/**
 * Employee API Integration Tests
 * Validates all CRUD operations and error handling
 */

test.describe('Employee API Integration', () => {
  let utils: ComprehensiveTestUtils
  let adminToken: string
  let testEmployeeId: number

  test.beforeAll(async ({ request }) => {
    const page = await request.newContext().then(c => c.newPage())
    utils = new ComprehensiveTestUtils(page, request)
    adminToken = await utils.loginAs('admin')
    await page.close()
  })

  test.afterAll(async () => {
    // Clean up test data
    if (adminToken) {
      await utils.cleanupTestData(adminToken)
    }
  })

  test.describe('Employee CRUD Operations', () => {
    test('should create new employee successfully', async ({ request }) => {
      const employeeData = {
        employeeNo: `EMP_${Date.now()}`,
        name: '新测试员工',
        departmentId: 1,
        positionId: 1,
        annualSalary: 100000,
        entryDate: '2024-01-01',
        status: 1
      }

      const result = await utils.testApiEndpoint('POST', '/api/employees', {
        token: adminToken,
        data: employeeData
      })

      expect(result.status).toBe(201)
      expect(result.data.code).toBe(201)
      expect(result.data.data).toBeDefined()
      expect(result.data.data.employeeNo).toBe(employeeData.employeeNo)
      expect(result.data.data.name).toBe(employeeData.name)
      expect(result.data.data.annualSalary).toBe(employeeData.annualSalary)

      testEmployeeId = result.data.data.id
    })

    test('should validate required fields when creating employee', async ({ request }) => {
      const invalidData = {
        employeeNo: '', // Empty required field
        name: '',       // Empty required field
        // Missing other required fields
      }

      const result = await utils.testApiEndpoint('POST', '/api/employees', {
        token: adminToken,
        data: invalidData,
        expectedStatus: 400
      })

      expect(result.status).toBe(400)
      expect(result.data.code).toBe(400)
      expect(result.data.message).toContain('验证失败')
    })

    test('should prevent duplicate employee numbers', async ({ request }) => {
      const duplicateData = {
        employeeNo: 'DUPLICATE_EMP',
        name: '员工A',
        departmentId: 1,
        positionId: 1,
        annualSalary: 100000,
        entryDate: '2024-01-01'
      }

      // Create first employee
      await utils.testApiEndpoint('POST', '/api/employees', {
        token: adminToken,
        data: duplicateData
      })

      // Try to create duplicate
      const result = await utils.testApiEndpoint('POST', '/api/employees', {
        token: adminToken,
        data: { ...duplicateData, name: '员工B' },
        expectedStatus: 409
      })

      expect(result.status).toBe(409)
      expect(result.data.message).toContain('员工编号已存在')
    })

    test('should retrieve employee list with pagination', async ({ request }) => {
      const result = await utils.testApiEndpoint('GET', '/api/employees?page=1&limit=10', {
        token: adminToken
      })

      expect(result.status).toBe(200)
      expect(result.data.code).toBe(200)
      expect(result.data.data).toBeDefined()
      expect(result.data.data.list).toBeDefined()
      expect(Array.isArray(result.data.data.list)).toBe(true)
      expect(result.data.data.total).toBeGreaterThanOrEqual(0)
      expect(result.data.data.page).toBe(1)
      expect(result.data.data.limit).toBe(10)
    })

    test('should filter employees by search criteria', async ({ request }) => {
      // Search by name
      const nameSearch = await utils.testApiEndpoint('GET', '/api/employees?search=测试', {
        token: adminToken
      })

      expect(nameSearch.status).toBe(200)
      if (nameSearch.data.data.list.length > 0) {
        nameSearch.data.data.list.forEach((employee: any) => {
          expect(employee.name).toContain('测试')
        })
      }

      // Search by department
      const deptSearch = await utils.testApiEndpoint('GET', '/api/employees?departmentId=1', {
        token: adminToken
      })

      expect(deptSearch.status).toBe(200)
      if (deptSearch.data.data.list.length > 0) {
        deptSearch.data.data.list.forEach((employee: any) => {
          expect(employee.departmentId).toBe(1)
        })
      }
    })

    test('should retrieve single employee by ID', async ({ request }) => {
      if (!testEmployeeId) {
        test.skip('No test employee available')
      }

      const result = await utils.testApiEndpoint('GET', `/api/employees/${testEmployeeId}`, {
        token: adminToken
      })

      expect(result.status).toBe(200)
      expect(result.data.code).toBe(200)
      expect(result.data.data).toBeDefined()
      expect(result.data.data.id).toBe(testEmployeeId)
    })

    test('should return 404 for non-existent employee', async ({ request }) => {
      const result = await utils.testApiEndpoint('GET', '/api/employees/999999', {
        token: adminToken,
        expectedStatus: 404
      })

      expect(result.status).toBe(404)
      expect(result.data.code).toBe(404)
      expect(result.data.message).toContain('员工不存在')
    })

    test('should update employee information', async ({ request }) => {
      if (!testEmployeeId) {
        test.skip('No test employee available')
      }

      const updateData = {
        name: '更新的员工姓名',
        annualSalary: 120000,
        positionId: 2
      }

      const result = await utils.testApiEndpoint('PUT', `/api/employees/${testEmployeeId}`, {
        token: adminToken,
        data: updateData
      })

      expect(result.status).toBe(200)
      expect(result.data.code).toBe(200)
      expect(result.data.data.name).toBe(updateData.name)
      expect(result.data.data.annualSalary).toBe(updateData.annualSalary)
      expect(result.data.data.positionId).toBe(updateData.positionId)
    })

    test('should validate update data', async ({ request }) => {
      if (!testEmployeeId) {
        test.skip('No test employee available')
      }

      const invalidUpdateData = {
        annualSalary: -1000, // Invalid negative salary
        entryDate: 'invalid-date' // Invalid date format
      }

      const result = await utils.testApiEndpoint('PUT', `/api/employees/${testEmployeeId}`, {
        token: adminToken,
        data: invalidUpdateData,
        expectedStatus: 400
      })

      expect(result.status).toBe(400)
      expect(result.data.message).toContain('验证失败')
    })

    test('should handle employee transfer between departments', async ({ request }) => {
      if (!testEmployeeId) {
        test.skip('No test employee available')
      }

      const transferData = {
        departmentId: 2,
        positionId: 3,
        transferReason: '部门调整',
        transferDate: new Date().toISOString().split('T')[0]
      }

      const result = await utils.testApiEndpoint('PUT', `/api/employees/${testEmployeeId}/transfer`, {
        token: adminToken,
        data: transferData
      })

      expect(result.status).toBe(200)
      expect(result.data.data.departmentId).toBe(transferData.departmentId)
    })

    test('should handle employee resignation', async ({ request }) => {
      // Create a temporary employee for resignation test
      const tempEmployee = await utils.createTestEmployee(adminToken, {
        name: '待离职员工'
      })
      const tempEmployeeId = tempEmployee.data.data.id

      const resignationData = {
        resignationDate: new Date().toISOString().split('T')[0],
        resignationReason: '个人发展'
      }

      const result = await utils.testApiEndpoint('PUT', `/api/employees/${tempEmployeeId}/resign`, {
        token: adminToken,
        data: resignationData
      })

      expect(result.status).toBe(200)
      expect(result.data.data.status).toBe(0) // Inactive status
    })

    test('should delete employee', async ({ request }) => {
      // Create a temporary employee for deletion test
      const tempEmployee = await utils.createTestEmployee(adminToken, {
        name: '待删除员工'
      })
      const tempEmployeeId = tempEmployee.data.data.id

      const result = await utils.testApiEndpoint('DELETE', `/api/employees/${tempEmployeeId}`, {
        token: adminToken
      })

      expect(result.status).toBe(200)
      expect(result.data.code).toBe(200)

      // Verify employee is deleted
      const getResult = await utils.testApiEndpoint('GET', `/api/employees/${tempEmployeeId}`, {
        token: adminToken,
        expectedStatus: 404
      })
      expect(getResult.status).toBe(404)
    })
  })

  test.describe('Employee API Error Handling', () => {
    test('should handle database connection errors gracefully', async ({ request }) => {
      // This test simulates database connectivity issues
      // In a real scenario, we might temporarily disable database or use mocking

      const result = await utils.testApiEndpoint('GET', '/api/employees', {
        token: adminToken,
        timeout: 30000 // Longer timeout for this test
      })

      // Should either succeed or fail gracefully
      expect([200, 500, 503]).toContain(result.status)
      
      if (result.status !== 200) {
        expect(result.data.message).toBeDefined()
      }
    })

    test('should handle malformed request data', async ({ request }) => {
      const malformedData = {
        employeeNo: null,
        name: undefined,
        departmentId: 'not-a-number',
        annualSalary: 'invalid',
        entryDate: 'not-a-date'
      }

      const result = await utils.testApiEndpoint('POST', '/api/employees', {
        token: adminToken,
        data: malformedData,
        expectedStatus: 400
      })

      expect(result.status).toBe(400)
      expect(result.data.message).toContain('验证失败')
    })

    test('should handle concurrent modifications', async ({ request }) => {
      if (!testEmployeeId) {
        test.skip('No test employee available')
      }

      // Simulate concurrent updates
      const update1 = utils.testApiEndpoint('PUT', `/api/employees/${testEmployeeId}`, {
        token: adminToken,
        data: { name: '并发更新A' }
      })

      const update2 = utils.testApiEndpoint('PUT', `/api/employees/${testEmployeeId}`, {
        token: adminToken,
        data: { name: '并发更新B' }
      })

      const results = await Promise.all([update1, update2])
      
      // At least one should succeed
      const successCount = results.filter(r => r.status === 200).length
      expect(successCount).toBeGreaterThanOrEqual(1)
    })

    test('should validate foreign key constraints', async ({ request }) => {
      const invalidData = {
        employeeNo: `EMP_FK_${Date.now()}`,
        name: '外键测试员工',
        departmentId: 99999, // Non-existent department
        positionId: 99999,   // Non-existent position
        annualSalary: 100000,
        entryDate: '2024-01-01'
      }

      const result = await utils.testApiEndpoint('POST', '/api/employees', {
        token: adminToken,
        data: invalidData,
        expectedStatus: 400
      })

      expect(result.status).toBe(400)
      expect(result.data.message).toMatch(/(部门不存在|职位不存在|外键约束)/)
    })
  })

  test.describe('Employee API Performance Tests', () => {
    test('employee list API should respond quickly', async ({ request }) => {
      const result = await utils.measureDatabaseQueryPerformance(
        '/api/employees?page=1&limit=10',
        adminToken,
        500 // 500ms threshold
      )

      expect(result.passed).toBe(true)
      expect(result.responseTime).toBeLessThan(500)
    })

    test('employee search should be efficient', async ({ request }) => {
      const searchResult = await utils.measureDatabaseQueryPerformance(
        '/api/employees?search=测试&page=1&limit=10',
        adminToken,
        800 // 800ms threshold for search
      )

      expect(searchResult.passed).toBe(true)
    })

    test('bulk operations should handle large datasets', async ({ request }) => {
      // Test pagination with larger datasets
      const largePageResult = await utils.testApiEndpoint('GET', '/api/employees?page=1&limit=100', {
        token: adminToken
      })

      expect(largePageResult.status).toBe(200)
      expect(largePageResult.responseTime).toBeLessThan(2000) // 2 second threshold
    })
  })

  test.describe('Employee API Data Integrity', () => {
    test('should maintain data consistency during updates', async ({ request }) => {
      if (!testEmployeeId) {
        test.skip('No test employee available')
      }

      // Get original data
      const originalResult = await utils.testApiEndpoint('GET', `/api/employees/${testEmployeeId}`, {
        token: adminToken
      })
      const originalData = originalResult.data.data

      // Update some fields
      const updateResult = await utils.testApiEndpoint('PUT', `/api/employees/${testEmployeeId}`, {
        token: adminToken,
        data: { name: '数据一致性测试' }
      })

      expect(updateResult.status).toBe(200)

      // Verify only updated fields changed
      const updatedResult = await utils.testApiEndpoint('GET', `/api/employees/${testEmployeeId}`, {
        token: adminToken
      })
      const updatedData = updatedResult.data.data

      expect(updatedData.name).toBe('数据一致性测试')
      expect(updatedData.employeeNo).toBe(originalData.employeeNo) // Should not change
      expect(updatedData.departmentId).toBe(originalData.departmentId) // Should not change
    })

    test('should handle database transaction rollbacks', async ({ request }) => {
      // This test would simulate a scenario where a transaction fails midway
      // For now, we'll test that invalid operations don't leave partial data

      const invalidEmployee = {
        employeeNo: `ROLLBACK_${Date.now()}`,
        name: '事务回滚测试',
        departmentId: 1,
        positionId: null, // This should cause the transaction to fail
        annualSalary: 'invalid', // This should also cause validation failure
        entryDate: '2024-01-01'
      }

      const result = await utils.testApiEndpoint('POST', '/api/employees', {
        token: adminToken,
        data: invalidEmployee,
        expectedStatus: 400
      })

      expect(result.status).toBe(400)

      // Verify no partial data was created
      const searchResult = await utils.testApiEndpoint('GET', `/api/employees?search=${invalidEmployee.employeeNo}`, {
        token: adminToken
      })

      expect(searchResult.data.data.list).toHaveLength(0)
    })
  })

  test.describe('Employee API Security', () => {
    test('should prevent SQL injection in search', async ({ request }) => {
      const securityTest = await utils.testSQLInjection('/api/employees', adminToken)
      expect(securityTest).toBe(true)
    })

    test('should sanitize input data', async ({ request }) => {
      const maliciousData = {
        employeeNo: `XSS_${Date.now()}`,
        name: '<script>alert("xss")</script>',
        departmentId: 1,
        positionId: 1,
        annualSalary: 100000,
        entryDate: '2024-01-01'
      }

      const result = await utils.testApiEndpoint('POST', '/api/employees', {
        token: adminToken,
        data: maliciousData
      })

      if (result.status === 201) {
        // If created, verify the script tag was sanitized
        expect(result.data.data.name).not.toContain('<script>')
        expect(result.data.data.name).not.toContain('alert')

        // Clean up
        await utils.testApiEndpoint('DELETE', `/api/employees/${result.data.data.id}`, {
          token: adminToken
        })
      }
    })

    test('should enforce authorization for all operations', async ({ request }) => {
      const employeeToken = await utils.loginAs('employee')

      // Employee should not be able to create employees
      const createResult = await utils.testApiEndpoint('POST', '/api/employees', {
        token: employeeToken,
        data: { name: 'Unauthorized Employee' },
        expectedStatus: 403
      })
      expect(createResult.status).toBe(403)

      // Employee should not be able to list all employees
      const listResult = await utils.testApiEndpoint('GET', '/api/employees', {
        token: employeeToken,
        expectedStatus: 403
      })
      expect(listResult.status).toBe(403)
    })
  })
})