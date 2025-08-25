import { test, expect } from '@playwright/test'
import { ComprehensiveTestUtils } from '../../utils/comprehensive-test-utils'

/**
 * Bonus Calculation Performance Tests
 * Validates three-dimensional calculation engine performance and scalability
 */

test.describe('Bonus Calculation Performance Tests', () => {
  let utils: ComprehensiveTestUtils
  let adminToken: string

  test.beforeAll(async ({ request }) => {
    const page = await request.newContext().then(c => c.newPage())
    utils = new ComprehensiveTestUtils(page, request)
    adminToken = await utils.loginAs('admin')
    await page.close()
  })

  test.describe('Three-Dimensional Calculation Performance', () => {
    test('single employee calculation should be fast', async ({ request }) => {
      const calculationData = {
        employeeId: 1,
        period: '2024Q1',
        profitContribution: 50000,
        positionValue: 80,
        performanceScore: 85
      }

      const startTime = performance.now()
      
      const result = await utils.testThreeDimensionalCalculation(adminToken, calculationData)
      
      const endTime = performance.now()
      const calculationTime = endTime - startTime

      expect(result.status).toBe(200)
      expect(calculationTime).toBeLessThan(500) // Should complete within 500ms

      // Verify calculation results are provided
      expect(result.data.calculationResult).toBeDefined()
      expect(result.data.calculationResult.totalBonus).toBeGreaterThan(0)
    })

    test('batch calculation should scale efficiently', async ({ request }) => {
      const batchSize = 10
      const calculationPromises = []

      const startTime = performance.now()

      // Create batch calculations
      for (let i = 1; i <= batchSize; i++) {
        const calculationData = {
          employeeId: i,
          period: '2024Q1',
          profitContribution: 40000 + (i * 5000),
          positionValue: 70 + i,
          performanceScore: 80 + i
        }

        calculationPromises.push(
          utils.testThreeDimensionalCalculation(adminToken, calculationData)
        )
      }

      const results = await Promise.all(calculationPromises)
      const endTime = performance.now()
      const totalTime = endTime - startTime

      // All calculations should succeed
      results.forEach((result, index) => {
        expect(result.status, `Calculation ${index + 1} failed`).toBe(200)
      })

      // Average time per calculation should be reasonable
      const avgTime = totalTime / batchSize
      expect(avgTime).toBeLessThan(800) // Average less than 800ms per calculation

      // Total time should show decent parallelization
      expect(totalTime).toBeLessThan(batchSize * 500) // Better than sequential execution
    })

    test('complex calculation with all components should perform well', async ({ request }) => {
      const complexCalculationData = {
        employeeId: 1,
        period: '2024Q1',
        profitContribution: 100000,
        positionValue: 95,
        performanceScore: 92,
        bonusPoolId: 1,
        departmentMultiplier: 1.2,
        positionMultiplier: 1.15,
        performanceMultiplier: 1.1,
        includeProjectBonus: true,
        includeSpecialAwards: true
      }

      const startTime = performance.now()
      
      const result = await utils.testApiEndpoint('POST', '/api/calculations/comprehensive', {
        token: adminToken,
        data: complexCalculationData
      })
      
      const endTime = performance.now()
      const calculationTime = endTime - startTime

      expect(result.status).toBe(200)
      expect(calculationTime).toBeLessThan(1000) // Complex calculation within 1 second

      // Verify all components are calculated
      if (result.data.calculationResult) {
        expect(result.data.calculationResult.profitComponent).toBeDefined()
        expect(result.data.calculationResult.positionComponent).toBeDefined()
        expect(result.data.calculationResult.performanceComponent).toBeDefined()
        expect(result.data.calculationResult.totalBonus).toBeDefined()
      }
    })

    test('calculation with large datasets should remain responsive', async ({ request }) => {
      // Test calculation that involves large employee datasets
      const largeBatchCalculation = {
        period: '2024Q1',
        calculationType: 'department_wide',
        departmentId: 1,
        includeAllEmployees: true,
        profitPool: 500000,
        distributionRules: {
          profitWeight: 0.4,
          positionWeight: 0.3,
          performanceWeight: 0.3
        }
      }

      const startTime = performance.now()

      const result = await utils.testApiEndpoint('POST', '/api/calculations/batch', {
        token: adminToken,
        data: largeBatchCalculation,
        timeout: 30000 // Allow up to 30 seconds for large batch
      })

      const endTime = performance.now()
      const calculationTime = endTime - startTime

      if (result.status === 200) {
        expect(calculationTime).toBeLessThan(20000) // Should complete within 20 seconds
        
        // Verify batch results structure
        expect(result.data.batchResults).toBeDefined()
        expect(Array.isArray(result.data.batchResults)).toBe(true)
        
        if (result.data.batchResults.length > 0) {
          expect(result.data.summary.totalCalculated).toBeGreaterThan(0)
          expect(result.data.summary.totalBonusDistributed).toBeGreaterThan(0)
        }
      }
    })
  })

  test.describe('Calculation Algorithm Efficiency', () => {
    test('profit contribution calculation should be optimized', async ({ request }) => {
      const profitData = {
        employeeId: 1,
        period: '2024Q1',
        individualContribution: 75000,
        teamContribution: 120000,
        departmentProfit: 800000,
        companyProfit: 5000000,
        contributionFactors: {
          directSales: 0.6,
          projectDelivery: 0.3,
          Innovation: 0.1
        }
      }

      const startTime = performance.now()

      const result = await utils.testApiEndpoint('POST', '/api/calculations/profit-contribution', {
        token: adminToken,
        data: profitData
      })

      const endTime = performance.now()
      const calculationTime = endTime - startTime

      expect(result.status).toBe(200)
      expect(calculationTime).toBeLessThan(200) // Profit calculation should be very fast

      if (result.data.profitAnalysis) {
        expect(result.data.profitAnalysis.calculatedContribution).toBeGreaterThan(0)
        expect(result.data.profitAnalysis.contributionRatio).toBeGreaterThan(0)
      }
    })

    test('position value assessment should be efficient', async ({ request }) => {
      const positionValueData = {
        employeeId: 1,
        positionId: 1,
        period: '2024Q1',
        marketBenchmarks: {
          industry: 'Technology',
          region: 'China',
          companySize: 'Large'
        },
        assessmentCriteria: {
          responsibility: 85,
          complexity: 90,
          impact: 88,
          leadership: 82
        }
      }

      const startTime = performance.now()

      const result = await utils.testApiEndpoint('POST', '/api/calculations/position-value', {
        token: adminToken,
        data: positionValueData
      })

      const endTime = performance.now()
      const calculationTime = endTime - startTime

      expect(result.status).toBe(200)
      expect(calculationTime).toBeLessThan(300) // Position value calculation

      if (result.data.positionAnalysis) {
        expect(result.data.positionAnalysis.valueScore).toBeGreaterThan(0)
        expect(result.data.positionAnalysis.marketComparison).toBeDefined()
      }
    })

    test('performance assessment calculation should be fast', async ({ request }) => {
      const performanceData = {
        employeeId: 1,
        period: '2024Q1',
        kpis: [
          { name: 'Quality', weight: 0.3, score: 85 },
          { name: 'Efficiency', weight: 0.25, score: 90 },
          { name: 'Innovation', weight: 0.2, score: 88 },
          { name: 'Collaboration', weight: 0.15, score: 92 },
          { name: 'Learning', weight: 0.1, score: 87 }
        ],
        objectives: [
          { description: 'Complete project A', weight: 0.4, achievement: 95 },
          { description: 'Improve process B', weight: 0.3, achievement: 85 },
          { description: 'Mentor junior staff', weight: 0.3, achievement: 90 }
        ]
      }

      const startTime = performance.now()

      const result = await utils.testApiEndpoint('POST', '/api/calculations/performance', {
        token: adminToken,
        data: performanceData
      })

      const endTime = performance.now()
      const calculationTime = endTime - startTime

      expect(result.status).toBe(200)
      expect(calculationTime).toBeLessThan(250) // Performance calculation

      if (result.data.performanceAnalysis) {
        expect(result.data.performanceAnalysis.overallScore).toBeGreaterThan(0)
        expect(result.data.performanceAnalysis.componentScores).toBeDefined()
      }
    })
  })

  test.describe('Calculation Caching and Optimization', () => {
    test('repeated calculations should benefit from caching', async ({ request }) => {
      const calculationData = {
        employeeId: 1,
        period: '2024Q1',
        profitContribution: 50000,
        positionValue: 80,
        performanceScore: 85
      }

      // First calculation (cold cache)
      const firstStart = performance.now()
      const firstResult = await utils.testThreeDimensionalCalculation(adminToken, calculationData)
      const firstEnd = performance.now()
      const firstTime = firstEnd - firstStart

      expect(firstResult.status).toBe(200)

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 100))

      // Second identical calculation (should hit cache)
      const secondStart = performance.now()
      const secondResult = await utils.testThreeDimensionalCalculation(adminToken, calculationData)
      const secondEnd = performance.now()
      const secondTime = secondEnd - secondStart

      expect(secondResult.status).toBe(200)

      // Second calculation should be faster (cached)
      expect(secondTime).toBeLessThanOrEqual(firstTime * 0.8) // At least 20% faster
      expect(secondTime).toBeLessThan(200) // Should be very fast from cache
    })

    test('calculation cache invalidation should work correctly', async ({ request }) => {
      const baseCalculationData = {
        employeeId: 1,
        period: '2024Q1',
        profitContribution: 60000,
        positionValue: 85,
        performanceScore: 88
      }

      // First calculation
      const initialResult = await utils.testThreeDimensionalCalculation(adminToken, baseCalculationData)
      expect(initialResult.status).toBe(200)
      const initialBonus = initialResult.data.calculationResult?.totalBonus

      // Update employee data (should invalidate cache)
      const updateResult = await utils.testApiEndpoint('PUT', '/api/employees/1', {
        token: adminToken,
        data: { annualSalary: 150000 } // Significant change
      })

      if (updateResult.status === 200) {
        // Recalculate with same data
        const updatedResult = await utils.testThreeDimensionalCalculation(adminToken, baseCalculationData)
        expect(updatedResult.status).toBe(200)
        
        const updatedBonus = updatedResult.data.calculationResult?.totalBonus
        
        // Results should potentially be different due to salary change
        expect(updatedBonus).toBeDefined()
      }
    })

    test('bulk calculations should use optimized algorithms', async ({ request }) => {
      const bulkCalculationData = {
        period: '2024Q1',
        employees: [
          { employeeId: 1, profitContribution: 45000, positionValue: 80, performanceScore: 85 },
          { employeeId: 2, profitContribution: 55000, positionValue: 85, performanceScore: 90 },
          { employeeId: 3, profitContribution: 40000, positionValue: 75, performanceScore: 82 },
          { employeeId: 4, profitContribution: 65000, positionValue: 90, performanceScore: 88 },
          { employeeId: 5, profitContribution: 50000, positionValue: 78, performanceScore: 87 }
        ]
      }

      const startTime = performance.now()

      const result = await utils.testApiEndpoint('POST', '/api/calculations/bulk-three-dimensional', {
        token: adminToken,
        data: bulkCalculationData
      })

      const endTime = performance.now()
      const calculationTime = endTime - startTime

      expect(result.status).toBe(200)
      
      // Bulk calculation should be more efficient than individual calculations
      const expectedIndividualTime = bulkCalculationData.employees.length * 500 // 500ms each
      expect(calculationTime).toBeLessThan(expectedIndividualTime * 0.6) // At least 40% better

      if (result.data.bulkResults) {
        expect(result.data.bulkResults.length).toBe(bulkCalculationData.employees.length)
        result.data.bulkResults.forEach((calc: any, index: number) => {
          expect(calc.employeeId).toBe(bulkCalculationData.employees[index].employeeId)
          expect(calc.totalBonus).toBeGreaterThan(0)
        })
      }
    })
  })

  test.describe('Memory Usage in Calculations', () => {
    test('large calculation datasets should not cause memory issues', async ({ request }) => {
      // Test with a large number of employees
      const largeDatasetCalculation = {
        period: '2024Q1',
        calculationType: 'company_wide',
        maxEmployees: 1000,
        profitPool: 2000000,
        distributionMethod: 'proportional'
      }

      const startTime = performance.now()

      const result = await utils.testApiEndpoint('POST', '/api/calculations/company-wide', {
        token: adminToken,
        data: largeDatasetCalculation,
        timeout: 45000 // Allow up to 45 seconds
      })

      const endTime = performance.now()
      const calculationTime = endTime - startTime

      if (result.status === 200) {
        expect(calculationTime).toBeLessThan(40000) // Should complete within 40 seconds
        
        // Verify results are properly structured
        expect(result.data.summary).toBeDefined()
        expect(result.data.summary.totalEmployees).toBeGreaterThan(0)
        expect(result.data.summary.totalBonusDistributed).toBeGreaterThan(0)
        
        // Check memory efficiency indicators
        if (result.data.performance) {
          expect(result.data.performance.memoryUsage).toBeLessThan(500) // MB
          expect(result.data.performance.calculationBatches).toBeGreaterThan(0)
        }
      } else if (result.status === 413) {
        // Request too large - should be handled gracefully
        expect(result.data.message).toContain('数据集过大')
      }
    })

    test('streaming calculations should handle large results', async ({ request }) => {
      const streamingCalculation = {
        period: '2024Q1',
        departmentId: 1,
        streamResults: true,
        batchSize: 50
      }

      const startTime = performance.now()

      const result = await utils.testApiEndpoint('POST', '/api/calculations/streaming', {
        token: adminToken,
        data: streamingCalculation,
        timeout: 30000
      })

      const endTime = performance.now()
      const calculationTime = endTime - startTime

      if (result.status === 200) {
        expect(calculationTime).toBeLessThan(25000)
        
        // Streaming results should have batch information
        if (result.data.streamingInfo) {
          expect(result.data.streamingInfo.batchesProcessed).toBeGreaterThan(0)
          expect(result.data.streamingInfo.totalProcessed).toBeGreaterThan(0)
        }
      }
    })
  })

  test.describe('Calculation Error Handling Performance', () => {
    test('invalid calculations should fail fast', async ({ request }) => {
      const invalidCalculationData = {
        employeeId: 99999, // Non-existent employee
        period: 'invalid-period',
        profitContribution: -50000, // Negative contribution
        positionValue: 150, // Out of range
        performanceScore: -10 // Invalid score
      }

      const startTime = performance.now()

      const result = await utils.testThreeDimensionalCalculation(adminToken, invalidCalculationData)

      const endTime = performance.now()
      const errorTime = endTime - startTime

      // Should fail quickly
      expect(errorTime).toBeLessThan(100) // Error detection should be very fast
      expect(result.status).toBe(400)
      expect(result.data.message).toContain('验证失败')
    })

    test('calculation timeouts should be handled gracefully', async ({ request }) => {
      // Simulate a calculation that might timeout
      const timeoutCalculation = {
        period: '2024Q1',
        calculationType: 'complex_simulation',
        iterations: 10000,
        precision: 'high',
        timeout: 1000 // 1 second timeout
      }

      const startTime = performance.now()

      const result = await utils.testApiEndpoint('POST', '/api/calculations/simulation', {
        token: adminToken,
        data: timeoutCalculation,
        timeout: 5000 // 5 second request timeout
      })

      const endTime = performance.now()
      const responseTime = endTime - startTime

      // Should either complete or timeout gracefully
      if (result.status === 200) {
        expect(responseTime).toBeLessThan(4000)
      } else if (result.status === 408) {
        // Timeout handled gracefully
        expect(result.data.message).toContain('计算超时')
        expect(responseTime).toBeLessThan(2000) // Should detect timeout quickly
      }
    })
  })

  test.describe('Concurrent Calculation Performance', () => {
    test('multiple concurrent calculations should not interfere', async ({ request }) => {
      const concurrentCalculations = 5
      const calculationPromises = []

      for (let i = 1; i <= concurrentCalculations; i++) {
        const calculationData = {
          employeeId: i,
          period: '2024Q1',
          profitContribution: 40000 + (i * 1000),
          positionValue: 70 + i,
          performanceScore: 80 + i
        }

        calculationPromises.push({
          promise: utils.testThreeDimensionalCalculation(adminToken, calculationData),
          expectedEmployeeId: i
        })
      }

      const startTime = performance.now()
      const results = await Promise.all(calculationPromises.map(p => p.promise))
      const endTime = performance.now()
      const totalTime = endTime - startTime

      // All calculations should succeed
      results.forEach((result, index) => {
        expect(result.status, `Concurrent calculation ${index + 1} failed`).toBe(200)
      })

      // Concurrent execution should be more efficient than sequential
      const sequentialEstimate = concurrentCalculations * 500 // 500ms each
      expect(totalTime).toBeLessThan(sequentialEstimate * 0.8) // At least 20% better
    })

    test('calculation queue should handle high load', async ({ request }) => {
      const highLoadCalculations = 20
      const loadPromises = []

      const startTime = performance.now()

      // Submit many calculations simultaneously
      for (let i = 1; i <= highLoadCalculations; i++) {
        const calculationData = {
          employeeId: (i % 10) + 1, // Cycle through employee IDs
          period: '2024Q1',
          profitContribution: 30000 + (i * 500),
          positionValue: 60 + (i % 30),
          performanceScore: 70 + (i % 20)
        }

        loadPromises.push(utils.testThreeDimensionalCalculation(adminToken, calculationData))
      }

      const results = await Promise.all(loadPromises)
      const endTime = performance.now()
      const totalTime = endTime - startTime

      // Most calculations should succeed
      const successCount = results.filter(r => r.status === 200).length
      const successRate = successCount / highLoadCalculations

      expect(successRate).toBeGreaterThan(0.8) // At least 80% success rate
      expect(totalTime).toBeLessThan(30000) // Should complete within 30 seconds

      // Average response time should be reasonable
      const avgTime = totalTime / highLoadCalculations
      expect(avgTime).toBeLessThan(2000)
    })
  })
})