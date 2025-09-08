/**
 * 快速API可用性检查脚本
 * 在运行完整测试之前，快速验证关键API端点的可用性
 */

const request = require('supertest')
const app = require('../app')

async function quickAPICheck() {
  console.log('🔍 快速API可用性检查')
  console.log('=' .repeat(50))

  const results = {
    total: 0,
    available: 0,
    unavailable: 0,
    errors: []
  }

  // 测试用户登录
  console.log('\n🔐 测试用户登录...')
  const testUsers = [
    { username: 'admin', password: 'admin123', name: '超级管理员' },
    { username: 'test', password: '1234qwer', name: '普通员工' },
    { username: 'test2', password: '123456', name: '部门经理' }
  ]

  const userTokens = {}

  for (const user of testUsers) {
    try {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ username: user.username, password: user.password })
        .timeout(5000)

      if (response.status === 200) {
        userTokens[user.username] = response.body.data.accessToken
        console.log(`  ✅ ${user.name}(${user.username}) 登录成功`)
      } else {
        console.log(`  ❌ ${user.name}(${user.username}) 登录失败: ${response.status}`)
        results.errors.push(`${user.username}登录失败`)
      }
    } catch (error) {
      console.log(`  ❌ ${user.name}(${user.username}) 登录异常: ${error.message}`)
      results.errors.push(`${user.username}登录异常: ${error.message}`)
    }
  }

  // 快速检查关键API端点
  console.log('\n📊 检查关键API端点...')
  
  const apiEndpoints = [
    { 
      path: '/api/auth/me', 
      name: '用户信息', 
      token: userTokens.admin || userTokens.test,
      expectedStatus: [200]
    },
    { 
      path: '/api/personal-bonus/overview', 
      name: '个人奖金概览', 
      token: userTokens.test,
      expectedStatus: [200, 404]
    },
    { 
      path: '/api/projects/available', 
      name: '可申请项目列表', 
      token: userTokens.test,
      expectedStatus: [200, 400]
    },
    { 
      path: '/api/positions', 
      name: '岗位列表', 
      token: userTokens.test,
      expectedStatus: [200, 403]
    },
    { 
      path: '/api/positions/levels', 
      name: '岗位级别选项', 
      token: userTokens.test,
      expectedStatus: [200, 403]
    },
    { 
      path: '/api/health', 
      name: '系统健康检查', 
      token: null,
      expectedStatus: [200, 404]
    }
  ]

  for (const endpoint of apiEndpoints) {
    results.total++
    
    try {
      const requestBuilder = request(app).get(endpoint.path)
      
      if (endpoint.token) {
        requestBuilder.set('Authorization', `Bearer ${endpoint.token}`)
      }

      const response = await requestBuilder.timeout(5000)
      
      if (endpoint.expectedStatus.includes(response.status)) {
        console.log(`  ✅ ${endpoint.name}: ${response.status} (正常)`)
        results.available++
      } else {
        console.log(`  ⚠️  ${endpoint.name}: ${response.status} (意外状态)`)
        results.available++
        results.errors.push(`${endpoint.name}返回意外状态: ${response.status}`)
      }
    } catch (error) {
      console.log(`  ❌ ${endpoint.name}: 请求失败 (${error.message})`)
      results.unavailable++
      results.errors.push(`${endpoint.name}请求失败: ${error.message}`)
    }
  }

  // 数据库连接检查
  console.log('\n💾 检查数据库连接...')
  try {
    if (userTokens.admin) {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userTokens.admin}`)
        .timeout(5000)

      if ([200, 403].includes(response.status)) {
        console.log(`  ✅ 数据库连接正常: ${response.status}`)
      } else {
        console.log(`  ⚠️  数据库连接状态: ${response.status}`)
      }
    } else {
      console.log(`  ⏭️  跳过数据库检查（管理员未登录）`)
    }
  } catch (error) {
    console.log(`  ❌ 数据库连接检查失败: ${error.message}`)
    results.errors.push(`数据库连接检查失败: ${error.message}`)
  }

  // 生成总结报告
  console.log('\n📋 快速检查总结')
  console.log('=' .repeat(50))
  console.log(`📊 API端点统计:`)
  console.log(`   总检查数: ${results.total}`)
  console.log(`   可用端点: ${results.available}`)
  console.log(`   不可用端点: ${results.unavailable}`)
  console.log(`   可用率: ${results.total > 0 ? ((results.available / results.total) * 100).toFixed(1) : 0}%`)

  const loginSuccess = Object.keys(userTokens).length
  const totalUsers = testUsers.length
  console.log(`\n🔐 用户登录统计:`)
  console.log(`   成功登录: ${loginSuccess}/${totalUsers}`)
  console.log(`   登录成功率: ${((loginSuccess / totalUsers) * 100).toFixed(1)}%`)

  if (results.errors.length > 0) {
    console.log(`\n🚨 发现的问题:`)
    results.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error}`)
    })
  }

  // 给出建议
  console.log(`\n💡 建议:`)
  if (results.unavailable === 0 && loginSuccess >= 2) {
    console.log(`   ✅ 系统状态良好，可以运行完整测试`)
    return true
  } else if (results.unavailable > results.available) {
    console.log(`   ❌ 系统问题较多，建议检查服务器状态和配置`)
    console.log(`   🔧 确保服务器运行在 localhost:3002`)
    console.log(`   🔧 检查数据库连接和初始化`)
    return false
  } else {
    console.log(`   ⚠️  系统部分功能可用，可以尝试运行测试，但可能有限制`)
    console.log(`   🔧 建议修复发现的问题后再运行完整测试`)
    return true
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  quickAPICheck()
    .then((systemReady) => {
      console.log('')
      if (systemReady) {
        console.log('🚀 系统检查完成，可以运行完整测试')
        process.exit(0)
      } else {
        console.log('🛑 系统检查发现问题，建议修复后再测试')
        process.exit(1)
      }
    })
    .catch((error) => {
      console.error('❌ 检查过程中发生异常:', error)
      process.exit(1)
    })
}

module.exports = { quickAPICheck }