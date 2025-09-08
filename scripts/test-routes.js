const axios = require('axios')

// 测试路由修复
async function testRoutes() {
  try {
    console.log('🧪 测试路由修复...\n')
    
    // 首先登录获取token
    console.log('1️⃣ 登录获取token...')
    const loginResponse = await axios.post('http://localhost:3002/api/auth/login', {
      username: 'test',
      password: 'test123'
    })
    
    if (loginResponse.data.code !== 200) {
      throw new Error('登录失败: ' + loginResponse.data.message)
    }
    
    const token = loginResponse.data.data.token
    console.log('✅ 登录成功，获取到token')
    
    const headers = {
      'Authorization': `Bearer ${token}`
    }
    
    // 测试各个路由
    const routes = [
      { name: '概览', path: '/api/personal-bonus/overview' },
      { name: '趋势', path: '/api/personal-bonus/trend' },
      { name: '绩效', path: '/api/personal-bonus/performance' },
      { name: '项目', path: '/api/personal-bonus/projects' },
      { name: '三维分解', path: '/api/personal-bonus/three-dimensional' },
      { name: '模拟分析', path: '/api/personal-bonus/simulation' },
      { name: '改进建议', path: '/api/personal-bonus/improvement-suggestions' },
      { name: '同级对比', path: '/api/personal-bonus/peer-comparison' }
    ]
    
    console.log('\n2️⃣ 测试各个路由...')
    
    for (const route of routes) {
      try {
        console.log(`🔍 测试 ${route.name} 路由: ${route.path}`)
        const response = await axios.get(`http://localhost:3002${route.path}`, { headers })
        
        if (response.data.code === 200) {
          console.log(`✅ ${route.name} 路由正常`)
        } else {
          console.log(`⚠️ ${route.name} 路由返回错误: ${response.data.message}`)
        }
      } catch (error) {
        if (error.response) {
          console.log(`❌ ${route.name} 路由失败: ${error.response.status} - ${error.response.data?.message || error.message}`)
        } else {
          console.log(`❌ ${route.name} 路由失败: ${error.message}`)
        }
      }
    }
    
    console.log('\n✨ 路由测试完成！')
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    if (error.response) {
      console.error('响应状态:', error.response.status)
      console.error('响应数据:', error.response.data)
    }
  }
}

// 运行测试
testRoutes()
