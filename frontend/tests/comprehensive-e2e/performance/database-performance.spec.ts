import { test, expect } from '@playwright/test'
import { ComprehensiveTestUtils } from '../../utils/comprehensive-test-utils'

/**
 * Database Performance Tests
 * Validates database optimizations, query performance, and scalability
 */

test.describe('Database Performance Tests', () => {
  let utils: ComprehensiveTestUtils
  let adminToken: string

  test.beforeAll(async ({ request }) => {
    const page = await request.newContext().then(c => c.newPage())
    utils = new ComprehensiveTestUtils(page, request)
    adminToken = await utils.loginAs('admin')
    await page.close()
  })

  test.describe('Query Performance Benchmarks', () => {
    test('employee list queries should be fast', async ({ request }) => {
      // Test basic employee list
      const basicQuery = await utils.measureDatabaseQueryPerformance(
        '/api/employees?page=1&limit=10',
        adminToken,
        300 // 300ms threshold
      )

      expect(basicQuery.passed).toBe(true)
      expect(basicQuery.responseTime).toBeLessThan(300)

      // Test employee list with filters
      const filteredQuery = await utils.measureDatabaseQueryPerformance(
        '/api/employees?departmentId=1&status=1&page=1&limit=10',
        adminToken,
        400 // 400ms threshold for filtered queries
      )

      expect(filteredQuery.passed).toBe(true)

      // Test employee search
      const searchQuery = await utils.measureDatabaseQueryPerformance(
        '/api/employees?search=测试&page=1&limit=10',
        adminToken,
        500 // 500ms threshold for search
      )

      expect(searchQuery.passed).toBe(true)
    })

    test('project queries should perform well', async ({ request }) => {
      // Test project list
      const projectList = await utils.measureDatabaseQueryPerformance(
        '/api/projects?page=1&limit=10',
        adminToken,
        400
      )

      expect(projectList.passed).toBe(true)

      // Test project with complex filters
      const complexProjectQuery = await utils.measureDatabaseQueryPerformance(
        '/api/projects?status=published&businessLineId=1&page=1&limit=20',
        adminToken,
        600
      )

      expect(complexProjectQuery.passed).toBe(true)

      // Test project search
      const projectSearch = await utils.measureDatabaseQueryPerformance(
        '/api/projects?search=测试&page=1&limit=10',
        adminToken,
        500
      )

      expect(projectSearch.passed).toBe(true)
    })

    test('bonus calculation queries should be optimized', async ({ request }) => {
      // Test bonus pool queries
      const bonusPoolQuery = await utils.measureDatabaseQueryPerformance(
        '/api/bonus-pools?page=1&limit=10',
        adminToken,
        300
      )

      expect(bonusPoolQuery.passed).toBe(true)

      // Test calculation results
      const calculationQuery = await utils.measureDatabaseQueryPerformance(
        '/api/calculations/results?period=2024&page=1&limit=10',
        adminToken,
        800 // Calculations can be more complex
      )

      expect(calculationQuery.passed).toBe(true)
    })

    test('aggregation queries should be efficient', async ({ request }) => {
      // Test department statistics
      const deptStats = await utils.measureDatabaseQueryPerformance(
        '/api/departments/statistics',
        adminToken,
        600
      )

      expect(deptStats.passed).toBe(true)

      // Test employee statistics
      const empStats = await utils.measureDatabaseQueryPerformance(
        '/api/employees/statistics',
        adminToken,
        700
      )

      expect(empStats.passed).toBe(true)
    })
  })

  test.describe('NeDB Service Performance', () => {
    test('NeDB read operations should be fast', async ({ request }) => {
      // Test NeDB-backed endpoints
      const nedbEndpoints = [
        '/api/users',
        '/api/roles', 
        '/api/departments',
        '/api/positions'
      ]

      for (const endpoint of nedbEndpoints) {
        const performance = await utils.measureDatabaseQueryPerformance(
          endpoint,
          adminToken,
          200 // NeDB should be faster for small datasets
        )

        expect(performance.passed, `NeDB performance failed for ${endpoint}`).toBe(true)
        expect(performance.responseTime).toBeLessThan(200)
      }
    })

    test('NeDB write operations should be responsive', async ({ request }) => {
      // Test NeDB create operation
      const startTime = performance.now()

      const testDept = {
        name: `性能测试部门_${Date.now()}`,
        description: 'NeDB性能测试',
        parentId: null
      }

      const createResult = await utils.testApiEndpoint('POST', '/api/departments', {
        token: adminToken,
        data: testDept
      })

      const endTime = performance.now()
      const createTime = endTime - startTime

      expect(createResult.status).toBe(201)
      expect(createTime).toBeLessThan(100) // Very fast for NeDB

      // Test NeDB update operation
      const deptId = createResult.data.data.id
      const updateStartTime = performance.now()

      const updateResult = await utils.testApiEndpoint('PUT', `/api/departments/${deptId}`, {
        token: adminToken,
        data: { name: '更新的性能测试部门' }
      })

      const updateEndTime = performance.now()
      const updateTime = updateEndTime - updateStartTime

      expect(updateResult.status).toBe(200)
      expect(updateTime).toBeLessThan(100)

      // Clean up
      await utils.testApiEndpoint('DELETE', `/api/departments/${deptId}`, {
        token: adminToken
      })
    })

    test('NeDB batch operations should be efficient', async ({ request }) => {
      // Create multiple records rapidly
      const batchSize = 10
      const createPromises = []

      const startTime = performance.now()

      for (let i = 0; i < batchSize; i++) {
        createPromises.push(
          utils.testApiEndpoint('POST', '/api/positions', {
            token: adminToken,
            data: {
              name: `批量职位${i}_${Date.now()}`,
              level: 1,
              benchmarkSalary: 100000 + i * 10000
            }
          })
        )
      }

      const results = await Promise.all(createPromises)
      const endTime = performance.now()
      const totalTime = endTime - startTime

      // All should succeed
      results.forEach(result => {
        expect(result.status).toBe(201)
      })

      // Average time per operation should be reasonable
      const avgTime = totalTime / batchSize
      expect(avgTime).toBeLessThan(50) // Very fast for NeDB

      // Clean up
      const createdIds = results.map(r => r.data.data.id)
      for (const id of createdIds) {
        await utils.testApiEndpoint('DELETE', `/api/positions/${id}`, {
          token: adminToken
        }).catch(() => {}) // Ignore cleanup failures
      }
    })
  })

  test.describe('Pagination Performance', () => {
    test('large page sizes should perform reasonably', async ({ request }) => {
      // Test different page sizes
      const pageSizes = [10, 25, 50, 100]

      for (const pageSize of pageSizes) {
        const result = await utils.measureDatabaseQueryPerformance(
          `/api/employees?page=1&limit=${pageSize}`,
          adminToken,
          1000 // 1 second threshold even for large pages
        )

        expect(result.passed, `Failed for page size ${pageSize}`).toBe(true)
        
        // Response time should scale reasonably with page size
        const expectedMaxTime = 200 + (pageSize * 5) // Base 200ms + 5ms per record
        expect(result.responseTime).toBeLessThan(expectedMaxTime)
      }
    })

    test('deep pagination should remain performant', async ({ request }) => {
      // Test pagination at different offsets
      const pages = [1, 5, 10, 20]

      for (const page of pages) {
        const result = await utils.measureDatabaseQueryPerformance(
          `/api/employees?page=${page}&limit=10`,
          adminToken,
          600 // Should not degrade significantly with offset
        )

        expect(result.passed, `Failed for page ${page}`).toBe(true)
      }
    })

    test('pagination metadata should be accurate', async ({ request }) => {
      const result = await utils.testApiEndpoint('GET', '/api/employees?page=1&limit=5', {
        token: adminToken
      })

      expect(result.status).toBe(200)
      expect(result.data.data.page).toBe(1)
      expect(result.data.data.limit).toBe(5)
      expect(result.data.data.total).toBeGreaterThanOrEqual(0)
      expect(result.data.data.list.length).toBeLessThanOrEqual(5)

      // Total pages calculation should be correct
      const expectedPages = Math.ceil(result.data.data.total / 5)
      expect(result.data.data.pages).toBe(expectedPages)
    })
  })

  test.describe('Query Optimization Tests', () => {
    test('indexed fields should query faster', async ({ request }) => {
      // Test queries on indexed fields vs non-indexed fields
      
      // Query by ID (should be very fast - primary key)
      const idQuery = await utils.measureDatabaseQueryPerformance(
        '/api/employees/1',
        adminToken,
        50 // Should be very fast
      )

      if (idQuery.recordCount !== undefined) {
        expect(idQuery.responseTime).toBeLessThan(50)
      }

      // Query by employee number (should be fast - likely indexed)
      const empNoQuery = await utils.measureDatabaseQueryPerformance(
        '/api/employees?employeeNo=EMP001',
        adminToken,
        200
      )

      expect(empNoQuery.passed).toBe(true)
    })

    test('complex joins should be optimized', async ({ request }) => {
      // Test queries that require joins
      const complexQuery = await utils.measureDatabaseQueryPerformance(
        '/api/employees?includeDepartment=true&includePosition=true&page=1&limit=10',
        adminToken,
        800 // Joins take longer but should still be reasonable
      )

      expect(complexQuery.passed).toBe(true)
    })

    test('filtering should use efficient strategies', async ({ request }) => {
      // Test various filter combinations
      const filterTests = [
        { filter: 'status=1', threshold: 300 },
        { filter: 'departmentId=1', threshold: 400 },
        { filter: 'status=1&departmentId=1', threshold: 500 },
        { filter: 'annualSalary>100000', threshold: 600 }
      ]

      for (const { filter, threshold } of filterTests) {
        const result = await utils.measureDatabaseQueryPerformance(
          `/api/employees?${filter}&page=1&limit=10`,
          adminToken,
          threshold
        )

        expect(result.passed, `Filter query failed: ${filter}`).toBe(true)
      }
    })
  })

  test.describe('Concurrent Access Performance', () => {
    test('concurrent read operations should scale well', async ({ request }) => {
      const concurrentReads = 10
      const startTime = performance.now()

      const readPromises = Array(concurrentReads).fill(null).map(() =>
        utils.testApiEndpoint('GET', '/api/employees?page=1&limit=10', {
          token: adminToken
        })
      )

      const results = await Promise.all(readPromises)
      const endTime = performance.now()
      const totalTime = endTime - startTime

      // All reads should succeed
      results.forEach(result => {
        expect(result.status).toBe(200)
      })

      // Average time should be reasonable
      const avgTime = totalTime / concurrentReads
      expect(avgTime).toBeLessThan(800)
    })

    test('mixed read/write operations should handle contention', async ({ request }) => {
      // Simulate mixed workload
      const operations = []

      // Add read operations
      for (let i = 0; i < 5; i++) {
        operations.push(
          utils.testApiEndpoint('GET', '/api/employees?page=1&limit=5', {
            token: adminToken
          })
        )
      }

      // Add write operations
      for (let i = 0; i < 3; i++) {
        operations.push(
          utils.createTestEmployee(adminToken, {
            name: `并发测试员工${i}_${Date.now()}`
          })
        )
      }

      const startTime = performance.now()
      const results = await Promise.all(operations)
      const endTime = performance.now()

      const totalTime = endTime - startTime
      expect(totalTime).toBeLessThan(5000) // Should complete within 5 seconds

      // Most operations should succeed
      const successCount = results.filter(r => r.status === 200 || r.status === 201).length
      expect(successCount).toBeGreaterThanOrEqual(6) // At least 75% success rate
    })

    test('database connections should be managed efficiently', async ({ request }) => {
      // Test rapid successive requests
      const rapidRequests = 20
      const requests = []

      for (let i = 0; i < rapidRequests; i++) {
        requests.push(
          utils.testApiEndpoint('GET', '/api/health', {
            token: adminToken
          })
        )
      }

      const startTime = performance.now()
      const results = await Promise.all(requests)
      const endTime = performance.now()

      // All should succeed (no connection pool exhaustion)
      results.forEach(result => {
        expect(result.status).toBe(200)
      })

      const totalTime = endTime - startTime
      expect(totalTime).toBeLessThan(3000) // Should handle rapid requests
    })
  })

  test.describe('Memory and Resource Usage', () => {
    test('large result sets should not cause memory issues', async ({ request }) => {
      // Request largest possible page size
      const largePageResult = await utils.testApiEndpoint('GET', '/api/employees?page=1&limit=1000', {
        token: adminToken,
        timeout: 10000
      })

      // Should either succeed or gracefully limit the results
      expect([200, 400]).toContain(largePageResult.status)

      if (largePageResult.status === 200) {
        expect(largePageResult.data.data.list.length).toBeLessThanOrEqual(1000)
      }
    })

    test('complex aggregations should be memory efficient', async ({ request }) => {
      // Test endpoints that might perform aggregations
      const aggregationEndpoints = [
        '/api/employees/statistics',
        '/api/departments/statistics', 
        '/api/projects/statistics'
      ]

      for (const endpoint of aggregationEndpoints) {
        const result = await utils.testApiEndpoint('GET', endpoint, {
          token: adminToken,
          timeout: 15000
        })

        // Should succeed or gracefully handle the request
        expect([200, 404, 501]).toContain(result.status)

        if (result.status === 200) {
          expect(result.data.data).toBeDefined()
        }
      }
    })
  })

  test.describe('Query Caching Performance', () => {
    test('repeated queries should benefit from caching', async ({ request }) => {
      const queryUrl = '/api/departments?page=1&limit=10'

      // First query (cold cache)
      const firstQuery = await utils.measureDatabaseQueryPerformance(
        queryUrl,
        adminToken,
        500
      )

      expect(firstQuery.passed).toBe(true)
      const firstTime = firstQuery.responseTime

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 100))

      // Second identical query (should be cached)
      const secondQuery = await utils.measureDatabaseQueryPerformance(
        queryUrl,
        adminToken,
        500
      )

      expect(secondQuery.passed).toBe(true)

      // Second query should be at least as fast (possibly cached)
      // Note: In test environment, caching might not be as effective
      expect(secondQuery.responseTime).toBeLessThanOrEqual(firstTime + 100)
    })

    test('cache invalidation should work correctly', async ({ request }) => {
      const listUrl = '/api/positions?page=1&limit=10'

      // Get initial list
      const initialList = await utils.testApiEndpoint('GET', listUrl, {
        token: adminToken
      })
      expect(initialList.status).toBe(200)
      const initialCount = initialList.data.data.total

      // Create new position
      const newPosition = await utils.testApiEndpoint('POST', '/api/positions', {
        token: adminToken,
        data: {
          name: `缓存测试职位_${Date.now()}`,
          level: 1,
          benchmarkSalary: 100000
        }
      })
      expect(newPosition.status).toBe(201)

      // Get list again - should reflect the new position
      const updatedList = await utils.testApiEndpoint('GET', listUrl, {
        token: adminToken
      })
      expect(updatedList.status).toBe(200)
      expect(updatedList.data.data.total).toBe(initialCount + 1)

      // Clean up
      await utils.testApiEndpoint('DELETE', `/api/positions/${newPosition.data.data.id}`, {
        token: adminToken
      })
    })
  })

  test.describe('Database Load Testing', () => {
    test('system should handle sustained load', async ({ request }) => {
      const loadTestDuration = 5000 // 5 seconds
      const requestInterval = 100 // Request every 100ms
      const expectedRequests = loadTestDuration / requestInterval

      const startTime = Date.now()
      const results: any[] = []

      while (Date.now() - startTime < loadTestDuration) {
        const request = utils.testApiEndpoint('GET', '/api/health', {
          token: adminToken
        })
        
        results.push(request)
        await new Promise(resolve => setTimeout(resolve, requestInterval))
      }

      const actualResults = await Promise.all(results)
      
      // Should handle most requests successfully
      const successRate = actualResults.filter(r => r.status === 200).length / actualResults.length
      expect(successRate).toBeGreaterThan(0.9) // 90% success rate

      // Average response time should remain reasonable under load
      const avgResponseTime = actualResults.reduce((sum, r) => sum + r.responseTime, 0) / actualResults.length
      expect(avgResponseTime).toBeLessThan(1000)
    })

    test('system should recover from overload gracefully', async ({ request }) => {
      // Create a burst of requests
      const burstSize = 50
      const burstPromises = Array(burstSize).fill(null).map(() =>
        utils.testApiEndpoint('GET', '/api/employees?page=1&limit=10', {
          token: adminToken
        })
      )

      const burstResults = await Promise.all(burstPromises)

      // Some requests might fail under extreme load, but system should not crash
      const successCount = burstResults.filter(r => r.status === 200).length
      const errorCount = burstResults.filter(r => r.status >= 500).length

      // Should have some successes
      expect(successCount).toBeGreaterThan(0)

      // If there are errors, they should be proper HTTP errors (not crashes)
      if (errorCount > 0) {
        const errorResults = burstResults.filter(r => r.status >= 500)
        errorResults.forEach(result => {
          expect(result.data).toBeDefined() // Should have proper error response
        })
      }

      // Wait for system to recover
      await new Promise(resolve => setTimeout(resolve, 2000))

      // System should be responsive again
      const recoveryTest = await utils.testApiEndpoint('GET', '/api/health', {
        token: adminToken
      })
      expect(recoveryTest.status).toBe(200)
    })
  })
})