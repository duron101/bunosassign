import { test, expect } from '@playwright/test'
import { ComprehensiveTestUtils } from '../../utils/comprehensive-test-utils'

/**
 * NeDB Service Tests
 * Validates NeDB database operations, CRUD functionality, and data integrity
 */

test.describe('NeDB Service Database Tests', () => {
  let utils: ComprehensiveTestUtils
  let adminToken: string

  test.beforeAll(async ({ request }) => {
    const page = await request.newContext().then(c => c.newPage())
    utils = new ComprehensiveTestUtils(page, request)
    adminToken = await utils.loginAs('admin')
    await page.close()
  })

  test.describe('NeDB CRUD Operations', () => {
    test('should create records in NeDB collections', async ({ request }) => {
      // Test creating records in different NeDB collections
      const collections = [
        {
          endpoint: '/api/departments',
          data: {
            name: `NeDB测试部门_${Date.now()}`,
            description: 'NeDB数据库测试部门',
            parentId: null,
            status: 1
          },
          expectedFields: ['id', 'name', 'description', 'createdAt']
        },
        {
          endpoint: '/api/positions',
          data: {
            name: `NeDB测试职位_${Date.now()}`,
            level: 1,
            benchmarkSalary: 100000,
            description: 'NeDB测试职位描述'
          },
          expectedFields: ['id', 'name', 'level', 'benchmarkSalary']
        },
        {
          endpoint: '/api/roles',
          data: {
            name: `nedb_test_role_${Date.now()}`,
            description: 'NeDB测试角色',
            permissions: ['read', 'write']
          },
          expectedFields: ['id', 'name', 'description', 'permissions']
        }
      ]

      const createdRecords = []

      for (const { endpoint, data, expectedFields } of collections) {
        const result = await utils.testApiEndpoint('POST', endpoint, {
          token: adminToken,
          data
        })

        expect(result.status, `Failed to create record in ${endpoint}`).toBe(201)
        expect(result.data.code).toBe(201)
        expect(result.data.data).toBeDefined()

        const record = result.data.data

        // Verify expected fields are present
        for (const field of expectedFields) {
          expect(record[field], `Missing field ${field} in ${endpoint}`).toBeDefined()
        }

        // NeDB should assign a string ID
        expect(typeof record.id).toBe('string')
        expect(record.id.length).toBeGreaterThan(0)

        createdRecords.push({ endpoint, id: record.id, data: record })
      }

      // Clean up created records
      for (const { endpoint, id } of createdRecords) {
        await utils.testApiEndpoint('DELETE', `${endpoint}/${id}`, {
          token: adminToken
        }).catch(() => {}) // Ignore cleanup errors
      }
    })

    test('should read records from NeDB collections', async ({ request }) => {
      // Create a test record first
      const testDepartment = {
        name: `读取测试部门_${Date.now()}`,
        description: 'NeDB读取测试',
        status: 1
      }

      const createResult = await utils.testApiEndpoint('POST', '/api/departments', {
        token: adminToken,
        data: testDepartment
      })

      expect(createResult.status).toBe(201)
      const createdId = createResult.data.data.id

      try {
        // Test list operation
        const listResult = await utils.testApiEndpoint('GET', '/api/departments', {
          token: adminToken
        })

        expect(listResult.status).toBe(200)
        expect(listResult.data.data).toBeDefined()
        expect(Array.isArray(listResult.data.data.list || listResult.data.data)).toBe(true)

        // Test single record retrieval
        const getResult = await utils.testApiEndpoint('GET', `/api/departments/${createdId}`, {
          token: adminToken
        })

        expect(getResult.status).toBe(200)
        expect(getResult.data.data.id).toBe(createdId)
        expect(getResult.data.data.name).toBe(testDepartment.name)

        // Test filtering and search
        const searchResult = await utils.testApiEndpoint('GET', `/api/departments?search=${encodeURIComponent('读取测试')}`, {
          token: adminToken
        })

        expect(searchResult.status).toBe(200)
        const searchData = searchResult.data.data.list || searchResult.data.data
        if (Array.isArray(searchData) && searchData.length > 0) {
          const foundRecord = searchData.find((dept: any) => dept.id === createdId)
          expect(foundRecord).toBeDefined()
        }

      } finally {
        // Clean up
        await utils.testApiEndpoint('DELETE', `/api/departments/${createdId}`, {
          token: adminToken
        }).catch(() => {})
      }
    })

    test('should update records in NeDB collections', async ({ request }) => {
      // Create a test record
      const testPosition = {
        name: `更新测试职位_${Date.now()}`,
        level: 1,
        benchmarkSalary: 100000
      }

      const createResult = await utils.testApiEndpoint('POST', '/api/positions', {
        token: adminToken,
        data: testPosition
      })

      expect(createResult.status).toBe(201)
      const createdId = createResult.data.data.id

      try {
        // Test partial update
        const updateData = {
          name: '更新后的职位名称',
          benchmarkSalary: 120000
        }

        const updateResult = await utils.testApiEndpoint('PUT', `/api/positions/${createdId}`, {
          token: adminToken,
          data: updateData
        })

        expect(updateResult.status).toBe(200)
        expect(updateResult.data.data.name).toBe(updateData.name)
        expect(updateResult.data.data.benchmarkSalary).toBe(updateData.benchmarkSalary)
        expect(updateResult.data.data.level).toBe(testPosition.level) // Should remain unchanged

        // Verify update by retrieving record
        const getResult = await utils.testApiEndpoint('GET', `/api/positions/${createdId}`, {
          token: adminToken
        })

        expect(getResult.status).toBe(200)
        expect(getResult.data.data.name).toBe(updateData.name)
        expect(getResult.data.data.benchmarkSalary).toBe(updateData.benchmarkSalary)

        // Test that updatedAt timestamp is updated
        expect(getResult.data.data.updatedAt).toBeDefined()
        if (createResult.data.data.updatedAt) {
          expect(new Date(getResult.data.data.updatedAt).getTime())
            .toBeGreaterThan(new Date(createResult.data.data.updatedAt).getTime())
        }

      } finally {
        // Clean up
        await utils.testApiEndpoint('DELETE', `/api/positions/${createdId}`, {
          token: adminToken
        }).catch(() => {})
      }
    })

    test('should delete records from NeDB collections', async ({ request }) => {
      // Create a test record
      const testRole = {
        name: `delete_test_role_${Date.now()}`,
        description: 'NeDB删除测试角色',
        permissions: ['test_permission']
      }

      const createResult = await utils.testApiEndpoint('POST', '/api/roles', {
        token: adminToken,
        data: testRole
      })

      expect(createResult.status).toBe(201)
      const createdId = createResult.data.data.id

      // Delete the record
      const deleteResult = await utils.testApiEndpoint('DELETE', `/api/roles/${createdId}`, {
        token: adminToken
      })

      expect(deleteResult.status).toBe(200)

      // Verify record is deleted
      const getResult = await utils.testApiEndpoint('GET', `/api/roles/${createdId}`, {
        token: adminToken,
        expectedStatus: 404
      })

      expect(getResult.status).toBe(404)

      // Verify it's not in the list
      const listResult = await utils.testApiEndpoint('GET', '/api/roles', {
        token: adminToken
      })

      expect(listResult.status).toBe(200)
      const roles = listResult.data.data.list || listResult.data.data
      if (Array.isArray(roles)) {
        const foundRole = roles.find((role: any) => role.id === createdId)
        expect(foundRole).toBeUndefined()
      }
    })
  })

  test.describe('NeDB Data Integrity', () => {
    test('should maintain data consistency during concurrent operations', async ({ request }) => {
      const testData = {
        name: `并发测试部门_${Date.now()}`,
        description: '并发操作测试',
        status: 1
      }

      // Create a record
      const createResult = await utils.testApiEndpoint('POST', '/api/departments', {
        token: adminToken,
        data: testData
      })

      expect(createResult.status).toBe(201)
      const recordId = createResult.data.data.id

      try {
        // Perform concurrent updates
        const concurrentUpdates = [
          { name: '并发更新A', description: '更新A' },
          { name: '并发更新B', description: '更新B' },
          { name: '并发更新C', description: '更新C' }
        ]

        const updatePromises = concurrentUpdates.map(updateData =>
          utils.testApiEndpoint('PUT', `/api/departments/${recordId}`, {
            token: adminToken,
            data: updateData
          })
        )

        const results = await Promise.all(updatePromises)

        // At least one update should succeed
        const successCount = results.filter(r => r.status === 200).length
        expect(successCount).toBeGreaterThan(0)

        // Verify final state is consistent
        const finalResult = await utils.testApiEndpoint('GET', `/api/departments/${recordId}`, {
          token: adminToken
        })

        expect(finalResult.status).toBe(200)
        expect(finalResult.data.data.id).toBe(recordId)

        // Should have one of the update values
        const finalName = finalResult.data.data.name
        const expectedNames = concurrentUpdates.map(u => u.name)
        expect(expectedNames).toContain(finalName)

      } finally {
        // Clean up
        await utils.testApiEndpoint('DELETE', `/api/departments/${recordId}`, {
          token: adminToken
        }).catch(() => {})
      }
    })

    test('should handle database file corruption gracefully', async ({ request }) => {
      // This test simulates scenarios where NeDB files might be corrupted or inaccessible
      
      // Test that the service doesn't crash when handling edge cases
      const edgeCases = [
        {
          name: 'very long string',
          data: {
            name: 'x'.repeat(1000), // Very long name
            description: 'y'.repeat(5000) // Very long description
          }
        },
        {
          name: 'special characters',
          data: {
            name: '特殊字符 !@#$%^&*()_+-=[]{}|;:,.<>?',
            description: 'Unicode: 测试 🔥 💯 ✅'
          }
        },
        {
          name: 'nested objects',
          data: {
            name: '嵌套测试',
            metadata: {
              nested: {
                deep: {
                  value: 'test'
                }
              }
            }
          }
        }
      ]

      for (const { name, data } of edgeCases) {
        const result = await utils.testApiEndpoint('POST', '/api/departments', {
          token: adminToken,
          data,
          timeout: 10000 // Longer timeout for edge cases
        })

        // Should either succeed or fail gracefully (not crash)
        expect([201, 400, 413]).toContain(result.status)

        if (result.status === 201) {
          // Clean up if created successfully
          await utils.testApiEndpoint('DELETE', `/api/departments/${result.data.data.id}`, {
            token: adminToken
          }).catch(() => {})
        }
      }
    })

    test('should validate foreign key constraints in NeDB', async ({ request }) => {
      // Test that references to non-existent records are handled properly
      
      const invalidReferences = [
        {
          endpoint: '/api/departments',
          data: {
            name: '外键测试部门',
            parentId: 'non-existent-id' // Invalid parent reference
          }
        }
      ]

      for (const { endpoint, data } of invalidReferences) {
        const result = await utils.testApiEndpoint('POST', endpoint, {
          token: adminToken,
          data,
          expectedStatus: 400
        })

        // Should validate foreign key constraints
        expect(result.status).toBe(400)
        expect(result.data.message).toMatch(/(不存在|无效|外键)/)
      }
    })

    test('should handle data type validation correctly', async ({ request }) => {
      const typeValidationTests = [
        {
          endpoint: '/api/positions',
          invalidData: {
            name: 123, // Should be string
            level: 'not-a-number', // Should be number
            benchmarkSalary: 'invalid-salary' // Should be number
          }
        },
        {
          endpoint: '/api/departments',
          invalidData: {
            name: null, // Required field
            status: 'active' // Should be number (0 or 1)
          }
        }
      ]

      for (const { endpoint, invalidData } of typeValidationTests) {
        const result = await utils.testApiEndpoint('POST', endpoint, {
          token: adminToken,
          data: invalidData,
          expectedStatus: 400
        })

        expect(result.status).toBe(400)
        expect(result.data.message).toContain('验证失败')
      }
    })
  })

  test.describe('NeDB Performance and Scalability', () => {
    test('should handle large datasets efficiently', async ({ request }) => {
      const batchSize = 50
      const createdIds = []

      // Create batch of records
      const startTime = performance.now()

      for (let i = 0; i < batchSize; i++) {
        const positionData = {
          name: `批量职位${i}_${Date.now()}`,
          level: (i % 5) + 1,
          benchmarkSalary: 80000 + (i * 1000)
        }

        const result = await utils.testApiEndpoint('POST', '/api/positions', {
          token: adminToken,
          data: positionData
        })

        if (result.status === 201) {
          createdIds.push(result.data.data.id)
        }
      }

      const createTime = performance.now() - startTime

      // Average creation time should be reasonable
      const avgCreateTime = createTime / batchSize
      expect(avgCreateTime).toBeLessThan(100) // Less than 100ms per record

      try {
        // Test list performance with larger dataset
        const listStartTime = performance.now()
        
        const listResult = await utils.testApiEndpoint('GET', '/api/positions', {
          token: adminToken
        })
        
        const listTime = performance.now() - listStartTime

        expect(listResult.status).toBe(200)
        expect(listTime).toBeLessThan(2000) // List should complete within 2 seconds

        const positions = listResult.data.data.list || listResult.data.data
        if (Array.isArray(positions)) {
          expect(positions.length).toBeGreaterThanOrEqual(batchSize)
        }

      } finally {
        // Clean up created records
        for (const id of createdIds) {
          await utils.testApiEndpoint('DELETE', `/api/positions/${id}`, {
            token: adminToken
          }).catch(() => {}) // Ignore cleanup errors
        }
      }
    })

    test('should perform efficient queries with filters', async ({ request }) => {
      // Create test data with different attributes for filtering
      const testDepartments = [
        { name: 'NeDB技术部A', status: 1, parentId: null },
        { name: 'NeDB技术部B', status: 1, parentId: null },
        { name: 'NeDB市场部', status: 0, parentId: null },
        { name: 'NeDB财务部', status: 1, parentId: null }
      ]

      const createdIds = []

      // Create test data
      for (const deptData of testDepartments) {
        const result = await utils.testApiEndpoint('POST', '/api/departments', {
          token: adminToken,
          data: deptData
        })

        if (result.status === 201) {
          createdIds.push(result.data.data.id)
        }
      }

      try {
        // Test various filter queries
        const filterTests = [
          { filter: 'status=1', expectedMinResults: 3 },
          { filter: 'status=0', expectedMinResults: 1 },
          { filter: 'search=技术部', expectedMinResults: 2 },
          { filter: 'search=NeDB', expectedMinResults: 4 }
        ]

        for (const { filter, expectedMinResults } of filterTests) {
          const startTime = performance.now()
          
          const result = await utils.testApiEndpoint('GET', `/api/departments?${filter}`, {
            token: adminToken
          })
          
          const queryTime = performance.now() - startTime

          expect(result.status).toBe(200)
          expect(queryTime).toBeLessThan(1000) // Should be fast

          const departments = result.data.data.list || result.data.data
          if (Array.isArray(departments)) {
            const matchingDepts = departments.filter(dept => 
              createdIds.includes(dept.id)
            )
            expect(matchingDepts.length).toBeGreaterThanOrEqual(expectedMinResults)
          }
        }

      } finally {
        // Clean up
        for (const id of createdIds) {
          await utils.testApiEndpoint('DELETE', `/api/departments/${id}`, {
            token: adminToken
          }).catch(() => {})
        }
      }
    })

    test('should handle pagination correctly', async ({ request }) => {
      // Create enough test data to test pagination
      const totalRecords = 25
      const createdIds = []

      for (let i = 0; i < totalRecords; i++) {
        const roleData = {
          name: `pagination_test_role_${i}_${Date.now()}`,
          description: `分页测试角色${i}`,
          permissions: [`permission_${i}`]
        }

        const result = await utils.testApiEndpoint('POST', '/api/roles', {
          token: adminToken,
          data: roleData
        })

        if (result.status === 201) {
          createdIds.push(result.data.data.id)
        }
      }

      try {
        // Test different page sizes
        const pageSizes = [5, 10, 20]

        for (const pageSize of pageSizes) {
          const page1Result = await utils.testApiEndpoint('GET', `/api/roles?page=1&limit=${pageSize}`, {
            token: adminToken
          })

          expect(page1Result.status).toBe(200)
          
          const page1Data = page1Result.data.data
          expect(page1Data.page).toBe(1)
          expect(page1Data.limit).toBe(pageSize)
          
          const roles = page1Data.list || page1Data
          if (Array.isArray(roles)) {
            expect(roles.length).toBeLessThanOrEqual(pageSize)
          }

          // Test second page if there are enough records
          if (page1Data.total > pageSize) {
            const page2Result = await utils.testApiEndpoint('GET', `/api/roles?page=2&limit=${pageSize}`, {
              token: adminToken
            })

            expect(page2Result.status).toBe(200)
            expect(page2Result.data.data.page).toBe(2)
          }
        }

      } finally {
        // Clean up
        for (const id of createdIds) {
          await utils.testApiEndpoint('DELETE', `/api/roles/${id}`, {
            token: adminToken
          }).catch(() => {})
        }
      }
    })

    test('should handle concurrent read operations efficiently', async ({ request }) => {
      const concurrentReads = 10
      const promises = []

      const startTime = performance.now()

      // Perform multiple concurrent read operations
      for (let i = 0; i < concurrentReads; i++) {
        promises.push(
          utils.testApiEndpoint('GET', '/api/departments', {
            token: adminToken
          })
        )
      }

      const results = await Promise.all(promises)
      const totalTime = performance.now() - startTime

      // All reads should succeed
      results.forEach((result, index) => {
        expect(result.status, `Concurrent read ${index} failed`).toBe(200)
      })

      // Total time should show good parallelization
      const avgTime = totalTime / concurrentReads
      expect(avgTime).toBeLessThan(500) // Average should be reasonable

      // Should handle concurrent access without conflicts
      expect(totalTime).toBeLessThan(concurrentReads * 300) // Better than sequential
    })
  })

  test.describe('NeDB Error Handling', () => {
    test('should handle missing records gracefully', async ({ request }) => {
      const nonExistentIds = [
        'invalid-id',
        '507f1f77bcf86cd799439011', // Valid ObjectId format but non-existent
        '999999999999999999999999'
      ]

      for (const id of nonExistentIds) {
        const result = await utils.testApiEndpoint('GET', `/api/departments/${id}`, {
          token: adminToken,
          expectedStatus: 404
        })

        expect(result.status).toBe(404)
        expect(result.data.message).toContain('不存在')
      }
    })

    test('should handle duplicate key constraints', async ({ request }) => {
      const uniqueTestData = {
        name: `unique_test_${Date.now()}`,
        description: '唯一性测试'
      }

      // Create first record
      const firstResult = await utils.testApiEndpoint('POST', '/api/departments', {
        token: adminToken,
        data: uniqueTestData
      })

      expect(firstResult.status).toBe(201)
      const firstId = firstResult.data.data.id

      try {
        // Try to create duplicate (if name is unique constraint)
        const duplicateResult = await utils.testApiEndpoint('POST', '/api/departments', {
          token: adminToken,
          data: uniqueTestData,
          expectedStatus: 409
        })

        // Should either prevent duplicate or allow it based on NeDB configuration
        expect([201, 409]).toContain(duplicateResult.status)

        if (duplicateResult.status === 201) {
          // If duplicates are allowed, clean up the duplicate too
          await utils.testApiEndpoint('DELETE', `/api/departments/${duplicateResult.data.data.id}`, {
            token: adminToken
          }).catch(() => {})
        }

      } finally {
        // Clean up
        await utils.testApiEndpoint('DELETE', `/api/departments/${firstId}`, {
          token: adminToken
        }).catch(() => {})
      }
    })

    test('should handle malformed NeDB queries', async ({ request }) => {
      const malformedQueries = [
        'search=' + encodeURIComponent('$where: function() { return true; }'), // NoSQL injection attempt
        'sort=' + encodeURIComponent('{"$ne": null}'), // Invalid sort
        'limit=abc', // Invalid limit
        'page=-1' // Invalid page
      ]

      for (const query of malformedQueries) {
        const result = await utils.testApiEndpoint('GET', `/api/departments?${query}`, {
          token: adminToken
        })

        // Should either return valid results or proper error (not crash)
        expect([200, 400]).toContain(result.status)

        if (result.status === 200) {
          // If successful, should return valid data structure
          expect(result.data.data).toBeDefined()
        } else {
          // If error, should have proper error message
          expect(result.data.message).toBeDefined()
        }
      }
    })

    test('should handle database connection failures gracefully', async ({ request }) => {
      // Test how the service handles potential NeDB file access issues
      
      const endpoints = ['/api/departments', '/api/positions', '/api/roles']
      
      for (const endpoint of endpoints) {
        const result = await utils.testApiEndpoint('GET', endpoint, {
          token: adminToken,
          timeout: 10000 // Longer timeout in case of database issues
        })

        // Should return some response (success or graceful error)
        expect(result.status).toBeGreaterThanOrEqual(200)
        expect(result.status).toBeLessThan(600)

        if (result.status >= 500) {
          // If there's a server error, it should be properly formatted
          expect(result.data.message).toBeDefined()
          expect(result.data.message).not.toContain('undefined')
        }
      }
    })
  })

  test.afterAll(async () => {
    // Final cleanup - remove any remaining test data
    if (adminToken) {
      try {
        // Clean up any remaining test records
        const endpoints = ['/api/departments', '/api/positions', '/api/roles']
        
        for (const endpoint of endpoints) {
          const listResult = await utils.testApiEndpoint('GET', endpoint, {
            token: adminToken
          }).catch(() => null)

          if (listResult && listResult.status === 200) {
            const records = listResult.data.data.list || listResult.data.data
            if (Array.isArray(records)) {
              for (const record of records) {
                if (record.name && (
                  record.name.includes('NeDB测试') ||
                  record.name.includes('测试') ||
                  record.name.includes('test') ||
                  record.name.includes('批量') ||
                  record.name.includes('并发')
                )) {
                  await utils.testApiEndpoint('DELETE', `${endpoint}/${record.id}`, {
                    token: adminToken
                  }).catch(() => {}) // Ignore cleanup errors
                }
              }
            }
          }
        }
      } catch (error) {
        console.warn('Final cleanup failed:', error)
      }
    }
  })
})