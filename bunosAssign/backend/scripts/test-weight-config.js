/**
 * 测试权重配置功能
 * 验证项目权重配置的完整流程
 */

const nedbService = require('../src/services/nedbService')

async function testWeightConfig() {
  console.log('=== 测试权重配置功能 ===\n')
  
  try {
    // 1. 获取所有业务线
    console.log('1. 获取业务线列表:')
    const businessLines = await nedbService.getBusinessLines()
    console.log(`   找到 ${businessLines.length} 条业务线:`)
    businessLines.forEach(bl => {
      console.log(`   - ${bl.name} (${bl.code}): ${(bl.weight * 100).toFixed(1)}%`)
    })
    console.log()
    
    // 2. 获取所有项目
    console.log('2. 获取项目列表:')
    const projects = await nedbService.getProjects()
    console.log(`   找到 ${projects.length} 个项目:`)
    projects.slice(0, 5).forEach(p => {
      console.log(`   - ${p.name} (${p.code}): ${p.status}`)
    })
    if (projects.length > 5) {
      console.log(`   ... 还有 ${projects.length - 5} 个项目`)
    }
    console.log()
    
    // 3. 检查项目权重配置
    console.log('3. 检查项目权重配置:')
    if (projects.length > 0) {
      const projectId = projects[0]._id
      console.log(`   检查项目: ${projects[0].name} (ID: ${projectId})`)
      
      const weights = await nedbService.getProjectWeights(projectId)
      if (weights && weights.length > 0) {
        console.log(`   找到 ${weights.length} 条权重配置:`)
        weights.forEach(w => {
          console.log(`   - 业务线ID: ${w.businessLineId}, 权重: ${(w.weight * 100).toFixed(1)}%`)
        })
      } else {
        console.log('   暂无权重配置，将创建默认配置')
        
        // 创建默认权重配置
        const defaultWeights = businessLines.map(bl => ({
          projectId: projectId,
          businessLineId: bl._id,
          weight: bl.weight,
          reason: '系统默认配置',
          createdAt: new Date(),
          updatedAt: new Date()
        }))
        
        const result = await nedbService.updateProjectWeights(projectId, defaultWeights)
        console.log(`   创建默认权重配置成功: ${result.length} 条`)
      }
    }
    console.log()
    
    // 4. 测试权重更新
    console.log('4. 测试权重更新:')
    if (projects.length > 0) {
      const projectId = projects[0]._id
      const newWeights = businessLines.map((bl, index) => ({
        businessLineId: bl._id,
        weight: (index + 1) * 0.1 // 0.1, 0.2, 0.3, 0.4, 0.5
      }))
      
      const result = await nedbService.updateProjectWeights(projectId, newWeights)
      console.log(`   更新权重配置成功: ${result.length} 条`)
      
      // 验证更新结果
      const updatedWeights = await nedbService.getProjectWeights(projectId)
      console.log('   更新后的权重配置:')
      updatedWeights.forEach(w => {
        console.log(`   - 业务线ID: ${w.businessLineId}, 权重: ${(w.weight * 100).toFixed(1)}%`)
      })
    }
    console.log()
    
    // 5. 测试权重重置
    console.log('5. 测试权重重置:')
    if (projects.length > 0) {
      const projectId = projects[0]._id
      const result = await nedbService.resetProjectWeights(projectId)
      console.log(`   重置权重配置成功: ${result} 条记录被删除`)
      
      // 验证重置结果
      const resetWeights = await nedbService.getProjectWeights(projectId)
      console.log(`   重置后的权重配置数量: ${resetWeights.length}`)
    }
    
    console.log('\n=== 权重配置功能测试完成 ===')
    
  } catch (error) {
    console.error('测试过程中出现错误:', error)
  }
}

// 运行测试
if (require.main === module) {
  testWeightConfig()
}

module.exports = { testWeightConfig }
