const axios = require('axios')

// 测试个人奖金概览API
async function testPersonalBonusAPI() {
  try {
    console.log('🧪 测试个人奖金概览API...')
    
    // 首先登录获取token
    const loginResponse = await axios.post('http://localhost:3002/api/auth/login', {
      username: 'test',
      password: 'test123'
    })
    
    if (loginResponse.data.code !== 200) {
      throw new Error('登录失败: ' + loginResponse.data.message)
    }
    
    const token = loginResponse.data.data.token
    console.log('✅ 登录成功，获取到token')
    
    // 测试个人奖金概览API
    const overviewResponse = await axios.get('http://localhost:3002/api/personal-bonus/overview', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (overviewResponse.data.code === 200) {
      console.log('✅ 个人奖金概览API调用成功')
      console.log('📊 响应数据结构:')
      console.log('- 用户信息:', overviewResponse.data.data.user ? '✅ 存在' : '❌ 缺失')
      console.log('- 员工信息:', overviewResponse.data.data.employee ? '✅ 存在' : '❌ 缺失')
      console.log('- 当前期间:', overviewResponse.data.data.currentPeriod || '❌ 缺失')
      console.log('- 奖金数据:', overviewResponse.data.data.bonusData ? '✅ 存在' : '❌ 缺失')
      
      if (overviewResponse.data.data.employee) {
        const emp = overviewResponse.data.data.employee
        console.log('👤 员工详细信息:')
        console.log(`  - ID: ${emp.id}`)
        console.log(`  - 姓名: ${emp.name}`)
        console.log(`  - 工号: ${emp.employeeNumber}`)
        console.log(`  - 部门: ${emp.departmentName}`)
        console.log(`  - 岗位: ${emp.positionName}`)
        console.log(`  - 职级: ${emp.level}`)
        console.log(`  - 状态: ${emp.status}`)
        console.log(`  - 入职日期: ${emp.joinDate}`)
      }
      
      if (overviewResponse.data.data.bonusData) {
        const bonus = overviewResponse.data.data.bonusData
        console.log('💰 奖金数据:')
        console.log(`  - 总奖金: ¥${bonus.totalBonus}`)
        console.log(`  - 奖金构成:`, bonus.bonusBreakdown)
        
        if (bonus.projectBonus) {
          console.log(`  - 项目奖金: ¥${bonus.projectBonus.totalAmount}`)
          console.log(`  - 项目数量: ${bonus.projectBonus.projectCount}`)
          if (bonus.projectBonus.allocations) {
            console.log(`  - 分配详情: ${bonus.projectBonus.allocations.length} 个项目`)
            bonus.projectBonus.allocations.forEach((proj, index) => {
              console.log(`    项目${index + 1}: ${proj.projectName} - ¥${proj.amount} (${proj.role})`)
            })
          }
        }
      }
      
    } else {
      console.log('❌ 个人奖金概览API调用失败:', overviewResponse.data.message)
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    if (error.response) {
      console.error('响应状态:', error.response.status)
      console.error('响应数据:', error.response.data)
    }
  }
}

// 运行测试
testPersonalBonusAPI()
