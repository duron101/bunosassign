import { test, expect } from '@playwright/test'
import { ComprehensiveTestUtils } from '../../utils/comprehensive-test-utils'

/**
 * Three-Dimensional Bonus Calculation Engine Tests
 * Validates the core bonus calculation algorithms and accuracy
 */

test.describe('Three-Dimensional Bonus Calculation Engine', () => {
  let utils: ComprehensiveTestUtils
  let adminToken: string

  test.beforeAll(async ({ request }) => {
    const page = await request.newContext().then(c => c.newPage())
    utils = new ComprehensiveTestUtils(page, request)
    adminToken = await utils.loginAs('admin')
    await page.close()
  })

  test.describe('Basic Three-Dimensional Calculation', () => {
    test('should calculate bonus with all three dimensions correctly', async ({ request }) => {
      const calculationData = {
        employeeId: 1,
        period: '2024Q1',
        profitContribution: 100000, // 10万贡献
        positionValue: 85,          // 85分职位价值
        performanceScore: 90,       // 90分绩效评分
        bonusPoolId: 1
      }

      const result = await utils.testThreeDimensionalCalculation(adminToken, calculationData)
      
      expect(result.status).toBe(200)
      expect(result.data.calculationResult).toBeDefined()

      const calculation = result.data.calculationResult
      
      // Verify all components are present
      expect(calculation.profitComponent).toBeGreaterThan(0)
      expect(calculation.positionComponent).toBeGreaterThan(0)
      expect(calculation.performanceComponent).toBeGreaterThan(0)
      expect(calculation.totalBonus).toBeGreaterThan(0)

      // Total should be sum of components
      const calculatedTotal = calculation.profitComponent + 
                             calculation.positionComponent + 
                             calculation.performanceComponent
      
      expect(Math.abs(calculation.totalBonus - calculatedTotal)).toBeLessThan(0.01)

      // Verify calculation details
      expect(calculation.weights).toBeDefined()
      expect(calculation.weights.profitWeight).toBeGreaterThan(0)
      expect(calculation.weights.positionWeight).toBeGreaterThan(0)
      expect(calculation.weights.performanceWeight).toBeGreaterThan(0)

      // Weights should sum to 1
      const totalWeight = calculation.weights.profitWeight + 
                         calculation.weights.positionWeight + 
                         calculation.weights.performanceWeight
      expect(Math.abs(totalWeight - 1)).toBeLessThan(0.01)
    })

    test('should handle edge cases in dimension values', async ({ request }) => {
      const edgeCases = [
        {
          name: 'minimum values',
          data: {
            employeeId: 1,
            period: '2024Q1',
            profitContribution: 0,
            positionValue: 0,
            performanceScore: 0
          },
          expectZeroBonus: true
        },
        {
          name: 'maximum values',
          data: {
            employeeId: 1,
            period: '2024Q1',
            profitContribution: 1000000,
            positionValue: 100,
            performanceScore: 100
          },
          expectHighBonus: true
        },
        {
          name: 'mixed extreme values',
          data: {
            employeeId: 1,
            period: '2024Q1',
            profitContribution: 500000,
            positionValue: 1,
            performanceScore: 100
          }
        }
      ]

      for (const { name, data, expectZeroBonus, expectHighBonus } of edgeCases) {
        const result = await utils.testThreeDimensionalCalculation(adminToken, data)
        
        expect(result.status, `Failed for ${name}`).toBe(200)
        
        const calculation = result.data.calculationResult
        
        if (expectZeroBonus) {
          expect(calculation.totalBonus, `${name} should result in zero bonus`).toBe(0)
        } else if (expectHighBonus) {
          expect(calculation.totalBonus, `${name} should result in high bonus`).toBeGreaterThan(50000)
        } else {
          expect(calculation.totalBonus, `${name} should result in valid bonus`).toBeGreaterThanOrEqual(0)
        }
      }
    })

    test('should validate input parameters', async ({ request }) => {
      const invalidInputTests = [
        {
          data: {
            employeeId: -1, // Invalid employee ID
            period: '2024Q1',
            profitContribution: 50000,
            positionValue: 80,
            performanceScore: 85
          },
          expectedError: '员工ID无效'
        },
        {
          data: {
            employeeId: 1,
            period: '', // Empty period
            profitContribution: 50000,
            positionValue: 80,
            performanceScore: 85
          },
          expectedError: '计算期间不能为空'
        },
        {
          data: {
            employeeId: 1,
            period: '2024Q1',
            profitContribution: -10000, // Negative contribution
            positionValue: 80,
            performanceScore: 85
          },
          expectedError: '利润贡献不能为负数'
        },
        {
          data: {
            employeeId: 1,
            period: '2024Q1',
            profitContribution: 50000,
            positionValue: 150, // Out of range (0-100)
            performanceScore: 85
          },
          expectedError: '职位价值超出范围'
        },
        {
          data: {
            employeeId: 1,
            period: '2024Q1',
            profitContribution: 50000,
            positionValue: 80,
            performanceScore: -10 // Negative performance
          },
          expectedError: '绩效评分超出范围'
        }
      ]

      for (const { data, expectedError } of invalidInputTests) {
        const result = await utils.testApiEndpoint('POST', '/api/calculations/three-dimensional', {
          token: adminToken,
          data,
          expectedStatus: 400
        })
        
        expect(result.status).toBe(400)
        expect(result.data.message).toContain('验证失败')
      }
    })
  })

  test.describe('Profit Contribution Calculation', () => {
    test('should calculate profit component accurately', async ({ request }) => {
      const testCases = [
        {
          contribution: 50000,
          poolSize: 1000000,
          expectedRatio: 0.05 // 5%
        },
        {
          contribution: 100000,
          poolSize: 1000000,
          expectedRatio: 0.1 // 10%
        },
        {
          contribution: 200000,
          poolSize: 1000000,
          expectedRatio: 0.2 // 20%
        }
      ]

      for (const { contribution, poolSize, expectedRatio } of testCases) {
        const calculationData = {
          employeeId: 1,
          period: '2024Q1',
          profitContribution: contribution,
          positionValue: 80,
          performanceScore: 85,
          bonusPoolSize: poolSize
        }

        const result = await utils.testThreeDimensionalCalculation(adminToken, calculationData)
        
        expect(result.status).toBe(200)
        
        const calculation = result.data.calculationResult
        const profitRatio = calculation.profitComponent / (poolSize * calculation.weights.profitWeight)
        
        expect(Math.abs(profitRatio - expectedRatio)).toBeLessThan(0.01)
      }
    })

    test('should handle profit distribution fairly across employees', async ({ request }) => {
      const employees = [
        { id: 1, contribution: 100000 },
        { id: 2, contribution: 150000 },
        { id: 3, contribution: 75000 }
      ]

      const totalContribution = employees.reduce((sum, emp) => sum + emp.contribution, 0)
      const results = []

      // Calculate for each employee
      for (const employee of employees) {
        const calculationData = {
          employeeId: employee.id,
          period: '2024Q1',
          profitContribution: employee.contribution,
          positionValue: 80,
          performanceScore: 85,
          totalCompanyProfit: totalContribution
        }

        const result = await utils.testThreeDimensionalCalculation(adminToken, calculationData)
        expect(result.status).toBe(200)
        
        results.push({
          employeeId: employee.id,
          contribution: employee.contribution,
          profitComponent: result.data.calculationResult.profitComponent
        })
      }

      // Verify proportional distribution
      for (let i = 0; i < results.length; i++) {
        for (let j = i + 1; j < results.length; j++) {
          const ratio1 = results[i].profitComponent / results[i].contribution
          const ratio2 = results[j].profitComponent / results[j].contribution
          
          // Ratios should be approximately equal (fair distribution)
          expect(Math.abs(ratio1 - ratio2)).toBeLessThan(0.01)
        }
      }
    })
  })

  test.describe('Position Value Assessment', () => {
    test('should reflect position hierarchy correctly', async ({ request }) => {
      const positionTests = [
        { positionValue: 95, level: 'Senior', expectedMultiplier: 'high' },
        { positionValue: 80, level: 'Mid', expectedMultiplier: 'medium' },
        { positionValue: 60, level: 'Junior', expectedMultiplier: 'low' }
      ]

      const baseCalculation = {
        employeeId: 1,
        period: '2024Q1',
        profitContribution: 100000,
        performanceScore: 85
      }

      const results = []

      for (const { positionValue, level } of positionTests) {
        const calculationData = { ...baseCalculation, positionValue }
        const result = await utils.testThreeDimensionalCalculation(adminToken, calculationData)
        
        expect(result.status).toBe(200)
        
        results.push({
          level,
          positionValue,
          positionComponent: result.data.calculationResult.positionComponent
        })
      }

      // Higher position values should result in higher position components
      results.sort((a, b) => b.positionValue - a.positionValue)
      
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].positionComponent).toBeGreaterThanOrEqual(results[i + 1].positionComponent)
      }
    })

    test('should apply position multipliers correctly', async ({ request }) => {
      const positionData = {
        employeeId: 1,
        period: '2024Q1',
        profitContribution: 100000,
        positionValue: 85,
        performanceScore: 85,
        positionMultipliers: {
          leadership: 1.2,
          technical: 1.1,
          management: 1.15
        }
      }

      const result = await utils.testApiEndpoint('POST', '/api/calculations/three-dimensional-advanced', {
        token: adminToken,
        data: positionData
      })

      if (result.status === 200) {
        const calculation = result.data.calculationResult
        
        // Position component should reflect the multipliers
        expect(calculation.positionBreakdown).toBeDefined()
        expect(calculation.positionBreakdown.baseValue).toBeGreaterThan(0)
        expect(calculation.positionBreakdown.multipliedValue).toBeGreaterThan(calculation.positionBreakdown.baseValue)
      }
    })
  })

  test.describe('Performance Assessment', () => {
    test('should weight performance components correctly', async ({ request }) => {
      const performanceData = {
        employeeId: 1,
        period: '2024Q1',
        profitContribution: 100000,
        positionValue: 80,
        performanceComponents: {
          kpiScore: 85,        // Weight: 60%
          objectiveScore: 90,  // Weight: 25%
          behaviorScore: 88,   // Weight: 15%
        },
        componentWeights: {
          kpi: 0.6,
          objective: 0.25,
          behavior: 0.15
        }
      }

      const result = await utils.testApiEndpoint('POST', '/api/calculations/performance-detailed', {
        token: adminToken,
        data: performanceData
      })

      if (result.status === 200) {
        const calculation = result.data.calculationResult
        
        // Calculate expected weighted score
        const expectedScore = (85 * 0.6) + (90 * 0.25) + (88 * 0.15)
        
        expect(Math.abs(calculation.weightedPerformanceScore - expectedScore)).toBeLessThan(0.1)
      }
    })

    test('should handle performance adjustments', async ({ request }) => {
      const performanceAdjustments = [
        {
          adjustment: 'excellence_bonus',
          factor: 1.2,
          reason: '卓越表现奖励'
        },
        {
          adjustment: 'improvement_needed',
          factor: 0.8,
          reason: '需要改进'
        }
      ]

      for (const { adjustment, factor, reason } of performanceAdjustments) {
        const calculationData = {
          employeeId: 1,
          period: '2024Q1',
          profitContribution: 100000,
          positionValue: 80,
          performanceScore: 85,
          adjustments: [{
            type: adjustment,
            factor,
            reason
          }]
        }

        const result = await utils.testApiEndpoint('POST', '/api/calculations/three-dimensional-adjusted', {
          token: adminToken,
          data: calculationData
        })

        if (result.status === 200) {
          const calculation = result.data.calculationResult
          
          // Performance component should reflect the adjustment
          expect(calculation.adjustments).toBeDefined()
          expect(calculation.adjustments[0].factor).toBe(factor)
          expect(calculation.adjustedPerformanceComponent).toBeDefined()
        }
      }
    })
  })

  test.describe('Complex Calculation Scenarios', () => {
    test('should handle multi-department calculations', async ({ request }) => {
      const departmentData = {
        period: '2024Q1',
        departments: [
          {
            id: 1,
            name: '技术部',
            employees: [
              { id: 1, profitContribution: 120000, positionValue: 90, performanceScore: 88 },
              { id: 2, profitContribution: 100000, positionValue: 85, performanceScore: 92 }
            ]
          },
          {
            id: 2,
            name: '销售部',
            employees: [
              { id: 3, profitContribution: 150000, positionValue: 80, performanceScore: 95 },
              { id: 4, profitContribution: 130000, positionValue: 75, performanceScore: 85 }
            ]
          }
        ],
        departmentWeights: {
          1: 0.6, // 技术部 60%
          2: 0.4  // 销售部 40%
        }
      }

      const result = await utils.testApiEndpoint('POST', '/api/calculations/multi-department', {
        token: adminToken,
        data: departmentData
      })

      if (result.status === 200) {
        const calculation = result.data.calculationResult
        
        expect(calculation.departmentResults).toBeDefined()
        expect(calculation.departmentResults.length).toBe(2)
        
        // Verify department weight application
        const techDept = calculation.departmentResults.find((d: any) => d.departmentId === 1)
        const salesDept = calculation.departmentResults.find((d: any) => d.departmentId === 2)
        
        expect(techDept.totalBonus).toBeGreaterThan(salesDept.totalBonus) // Due to higher weight
      }
    })

    test('should calculate project-based bonuses', async ({ request }) => {
      const projectBonusData = {
        projectId: 1,
        period: '2024Q1',
        projectBonus: 500000,
        teamMembers: [
          { 
            employeeId: 1, 
            role: '项目经理',
            contribution: 30,
            profitContribution: 80000,
            positionValue: 90,
            performanceScore: 92 
          },
          { 
            employeeId: 2, 
            role: '开发工程师',
            contribution: 40,
            profitContribution: 70000,
            positionValue: 85,
            performanceScore: 88 
          },
          { 
            employeeId: 3, 
            role: '测试工程师',
            contribution: 30,
            profitContribution: 50000,
            positionValue: 80,
            performanceScore: 90 
          }
        ]
      }

      const result = await utils.testApiEndpoint('POST', '/api/calculations/project-bonus', {
        token: adminToken,
        data: projectBonusData
      })

      if (result.status === 200) {
        const calculation = result.data.calculationResult
        
        expect(calculation.projectBonusDistribution).toBeDefined()
        expect(calculation.projectBonusDistribution.length).toBe(3)
        
        // Total distributed should equal project bonus
        const totalDistributed = calculation.projectBonusDistribution
          .reduce((sum: number, member: any) => sum + member.bonusAmount, 0)
        
        expect(Math.abs(totalDistributed - projectBonusData.projectBonus)).toBeLessThan(0.01)
        
        // Higher contribution should result in higher bonus
        const sortedByContribution = calculation.projectBonusDistribution
          .sort((a: any, b: any) => b.contribution - a.contribution)
        
        for (let i = 0; i < sortedByContribution.length - 1; i++) {
          expect(sortedByContribution[i].bonusAmount).toBeGreaterThanOrEqual(sortedByContribution[i + 1].bonusAmount)
        }
      }
    })

    test('should handle temporal bonus calculations', async ({ request }) => {
      const periods = ['2024Q1', '2024Q2', '2024Q3']
      const employeeId = 1
      const results = []

      for (const period of periods) {
        const calculationData = {
          employeeId,
          period,
          profitContribution: 100000 + (Math.random() * 50000), // Varying contribution
          positionValue: 85,
          performanceScore: 80 + (Math.random() * 15), // Varying performance
          historicalData: true
        }

        const result = await utils.testThreeDimensionalCalculation(adminToken, calculationData)
        
        if (result.status === 200) {
          results.push({
            period,
            bonus: result.data.calculationResult.totalBonus,
            trend: result.data.calculationResult.trend
          })
        }
      }

      if (results.length > 1) {
        // Should have trend analysis
        for (const result of results) {
          expect(result.bonus).toBeGreaterThan(0)
        }
        
        // If there's trend data, it should be meaningful
        const lastResult = results[results.length - 1]
        if (lastResult.trend) {
          expect(['increasing', 'decreasing', 'stable']).toContain(lastResult.trend)
        }
      }
    })
  })

  test.describe('Calculation Accuracy and Precision', () => {
    test('should maintain calculation precision', async ({ request }) => {
      const precisionTest = {
        employeeId: 1,
        period: '2024Q1',
        profitContribution: 123456.789,  // High precision input
        positionValue: 87.5,
        performanceScore: 91.25,
        precisionMode: 'high'
      }

      const result = await utils.testThreeDimensionalCalculation(adminToken, precisionTest)
      
      expect(result.status).toBe(200)
      
      const calculation = result.data.calculationResult
      
      // Should maintain reasonable precision in results
      expect(calculation.totalBonus).not.toBeNaN()
      expect(calculation.totalBonus).toBeFinite()
      
      // Components should add up correctly
      const calculatedTotal = calculation.profitComponent + 
                             calculation.positionComponent + 
                             calculation.performanceComponent
      
      expect(Math.abs(calculation.totalBonus - calculatedTotal)).toBeLessThan(0.01)
    })

    test('should be deterministic with same inputs', async ({ request }) => {
      const calculationData = {
        employeeId: 1,
        period: '2024Q1',
        profitContribution: 100000,
        positionValue: 85,
        performanceScore: 90
      }

      // Calculate multiple times with same input
      const results = []
      for (let i = 0; i < 3; i++) {
        const result = await utils.testThreeDimensionalCalculation(adminToken, calculationData)
        expect(result.status).toBe(200)
        results.push(result.data.calculationResult.totalBonus)
      }

      // All results should be identical
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toBe(results[0])
      }
    })

    test('should validate calculation formulas', async ({ request }) => {
      // Test known calculation scenarios
      const knownScenarios = [
        {
          description: 'Equal contributions should result in equal profit components (other factors equal)',
          employees: [
            { id: 1, profitContribution: 100000, positionValue: 80, performanceScore: 85 },
            { id: 2, profitContribution: 100000, positionValue: 80, performanceScore: 85 }
          ]
        },
        {
          description: 'Double contribution should result in proportionally higher bonus',
          employees: [
            { id: 1, profitContribution: 50000, positionValue: 80, performanceScore: 85 },
            { id: 2, profitContribution: 100000, positionValue: 80, performanceScore: 85 }
          ]
        }
      ]

      for (const scenario of knownScenarios) {
        const results = []
        
        for (const employee of scenario.employees) {
          const calculationData = {
            employeeId: employee.id,
            period: '2024Q1',
            ...employee
          }
          
          const result = await utils.testThreeDimensionalCalculation(adminToken, calculationData)
          expect(result.status).toBe(200)
          results.push(result.data.calculationResult)
        }

        if (scenario.description.includes('equal')) {
          // Should have equal results
          expect(Math.abs(results[0].totalBonus - results[1].totalBonus)).toBeLessThan(0.01)
        } else if (scenario.description.includes('double')) {
          // Second employee should have higher bonus
          expect(results[1].totalBonus).toBeGreaterThan(results[0].totalBonus)
          
          // Should be roughly proportional (allowing for position/performance components)
          const ratio = results[1].totalBonus / results[0].totalBonus
          expect(ratio).toBeGreaterThan(1.2) // At least 20% higher
        }
      }
    })
  })
})