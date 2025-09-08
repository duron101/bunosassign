const nedbService = require('../src/services/nedbService')
const positionRequirementsService = require('../src/services/positionRequirementsService')

async function initPositionRequirements() {
  try {
    console.log('🔄 开始初始化岗位要求数据...')
    
    // 初始化NeDB服务
    await nedbService.initialize()
    
    // 初始化岗位要求数据
    await positionRequirementsService.initializeRequirements()
    
    console.log('✅ 岗位要求数据初始化完成')
    
    // 验证数据
    const allRequirements = await positionRequirementsService.getAllRequirements()
    console.log(`📊 共初始化了 ${allRequirements.length} 个岗位的要求信息`)
    
    // 显示详细信息
    allRequirements.forEach(req => {
      console.log(`\n📋 ${req.positionName} (${req.positionCode}):`)
      console.log(`   基础要求: ${req.basicRequirements.length} 项`)
      console.log(`   技能要求: ${req.skills.length} 项`)
      console.log(`   经验要求: ${req.experience.length} 项`)
      console.log(`   发展方向: ${req.careerPath.nextLevel}`)
      console.log(`   预计时间: ${req.careerPath.estimatedTime}`)
    })
    
    process.exit(0)
  } catch (error) {
    console.error('❌ 初始化失败:', error)
    process.exit(1)
  }
}

// 运行初始化
initPositionRequirements()
