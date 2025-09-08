import { test as setup } from '@playwright/test'
import { ComprehensiveTestUtils } from '../../utils/comprehensive-test-utils'

/**
 * Authentication Setup for Comprehensive E2E Tests
 * Pre-authenticates test users and validates system readiness
 */

const authFile = '.auth/user.json'
const adminAuthFile = '.auth/admin.json' 
const managerAuthFile = '.auth/manager.json'

setup('setup admin authentication', async ({ page, request }) => {
  const utils = new ComprehensiveTestUtils(page, request)
  
  console.log('🔧 Setting up admin authentication...')
  
  try {
    const adminToken = await utils.loginAs('admin')
    
    // Verify admin has full permissions
    const hasPermissions = await utils.verifyTokenPermissions(adminToken, ['*'])
    if (!hasPermissions) {
      throw new Error('Admin user does not have required permissions')
    }
    
    // Save authentication state
    await page.context().storageState({ path: adminAuthFile })
    
    console.log('✅ Admin authentication setup complete')
  } catch (error) {
    console.error('❌ Admin authentication setup failed:', error)
    throw error
  }
})

setup('setup project manager authentication', async ({ page, request }) => {
  const utils = new ComprehensiveTestUtils(page, request)
  
  console.log('🔧 Setting up project manager authentication...')
  
  try {
    const managerToken = await utils.loginAs('project_manager')
    
    // Verify manager has project permissions
    const hasPermissions = await utils.verifyTokenPermissions(managerToken, [
      'project.create', 
      'project.edit', 
      'project.view',
      'employee.view'
    ])
    
    if (!hasPermissions) {
      console.warn('⚠️ Project manager may not have all expected permissions')
    }
    
    // Save authentication state
    await page.context().storageState({ path: managerAuthFile })
    
    console.log('✅ Project manager authentication setup complete')
  } catch (error) {
    console.error('❌ Project manager authentication setup failed:', error)
    throw error
  }
})

setup('setup employee authentication', async ({ page, request }) => {
  const utils = new ComprehensiveTestUtils(page, request)
  
  console.log('🔧 Setting up employee authentication...')
  
  try {
    const employeeToken = await utils.loginAs('employee')
    
    // Verify employee has basic permissions
    const hasPermissions = await utils.verifyTokenPermissions(employeeToken, [
      'project.view',
      'personal.view'
    ])
    
    if (!hasPermissions) {
      console.warn('⚠️ Employee may not have expected permissions')
    }
    
    // Save authentication state
    await page.context().storageState({ path: authFile })
    
    console.log('✅ Employee authentication setup complete')
  } catch (error) {
    console.error('❌ Employee authentication setup failed:', error)
    throw error
  }
})

setup('validate backend services', async ({ request }) => {
  console.log('🔧 Validating backend services...')
  
  // Test database connection
  try {
    const healthResponse = await request.get('/api/health')
    if (healthResponse.status() !== 200) {
      throw new Error(`Backend health check failed: ${healthResponse.status()}`)
    }
    
    console.log('✅ Backend health check passed')
  } catch (error) {
    console.error('❌ Backend health check failed:', error)
    throw error
  }
  
  // Test NeDB services
  try {
    const nedbResponse = await request.get('/api/employees?page=1&limit=1')
    if (nedbResponse.status() !== 401 && nedbResponse.status() !== 200) {
      throw new Error(`NeDB service test failed: ${nedbResponse.status()}`)
    }
    
    console.log('✅ NeDB services responsive')
  } catch (error) {
    console.error('❌ NeDB service test failed:', error)
    throw error
  }
})

setup('prepare test data', async ({ page, request }) => {
  const utils = new ComprehensiveTestUtils(page, request)
  
  console.log('🔧 Preparing test data...')
  
  try {
    // Login as admin to create test data
    const adminToken = await utils.loginAs('admin')
    
    // Create test employees if they don't exist
    const testEmployees = [
      {
        employeeNo: 'TEST001',
        name: '测试员工A',
        departmentId: 1,
        positionId: 1,
        annualSalary: 100000,
        entryDate: '2024-01-01'
      },
      {
        employeeNo: 'TEST002', 
        name: '测试员工B',
        departmentId: 2,
        positionId: 2,
        annualSalary: 120000,
        entryDate: '2024-01-01'
      }
    ]
    
    for (const employeeData of testEmployees) {
      try {
        await utils.createTestEmployee(adminToken, employeeData)
      } catch {
        // Employee might already exist
      }
    }
    
    // Create test projects
    const testProjects = [
      {
        name: '测试项目Alpha',
        code: 'TEST_ALPHA',
        description: '用于综合测试的项目Alpha',
        budget: 100000,
        bonusPool: 50000,
        profitTarget: 200000,
        status: 'published' as const
      },
      {
        name: '测试项目Beta',
        code: 'TEST_BETA', 
        description: '用于综合测试的项目Beta',
        budget: 150000,
        bonusPool: 75000,
        profitTarget: 300000,
        status: 'draft' as const
      }
    ]
    
    for (const projectData of testProjects) {
      try {
        await utils.createTestProject(adminToken, projectData)
      } catch {
        // Project might already exist
      }
    }
    
    console.log('✅ Test data preparation complete')
  } catch (error) {
    console.error('❌ Test data preparation failed:', error)
    // Don't throw - tests should still be able to run
  }
})