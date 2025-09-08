// 测试项目奖金分配完整工作流程
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const nedbService = require('../backend/src/services/nedbService')
const projectMemberService = require('../backend/src/services/projectMemberService')
const projectBonusService = require('../backend/src/services/projectBonusService')

async function testProjectWorkflow() {
  try {
    console.log('🚀 开始测试项目奖金分配工作流程...')
    
    // 初始化服务
    await nedbService.initialize()

    // 1. 测试员工申请加入项目
    console.log('\n📋 测试1: 员工申请加入项目')
    
    const projects = await nedbService.find('projects', { status: 'active' })
    const employees = await nedbService.find('employees', { status: 1 })
    
    if (projects.length === 0 || employees.length === 0) {
      console.log('⚠️  缺少测试数据，请先运行基础数据初始化')
      return
    }

    const testProject = projects[0]
    const testEmployee = employees.find(emp => emp.name !== '系统管理员') || employees[0]
    
    console.log(`   申请员工: ${testEmployee.name}`)
    console.log(`   目标项目: ${testProject.name}`)

    // 检查是否已有申请
    const existingApplication = await nedbService.findOne('projectMembers', {
      projectId: testProject._id,
      employeeId: testEmployee._id
    })

    if (!existingApplication) {
      try {
        await projectMemberService.applyToJoinProject(
          testEmployee._id,
          testProject._id,
          '我希望加入这个项目，贡献我的专业技能'
        )
        console.log('   ✅ 申请提交成功')
      } catch (error) {
        console.log(`   ❌ 申请失败: ${error.message}`)
      }
    } else {
      console.log(`   ℹ️  申请已存在，状态: ${existingApplication.status}`)
    }

    // 2. 测试项目经理审批申请
    console.log('\n📋 测试2: 项目经理审批申请')
    
    const pendingApplications = await nedbService.find('projectMembers', {
      projectId: testProject._id,
      status: 'pending'
    })

    if (pendingApplications.length > 0) {
      const application = pendingApplications[0]
      const projectRoles = await nedbService.find('projectRoles', { status: 1 })
      
      if (projectRoles.length > 0) {
        try {
          await projectMemberService.approveApplication(
            application._id,
            projectRoles[0]._id,
            1.0, // 100% 参与度
            '审批通过，欢迎加入项目团队'
          )
          console.log('   ✅ 申请审批成功')
        } catch (error) {
          console.log(`   ❌ 审批失败: ${error.message}`)
        }
      }
    } else {
      console.log('   ℹ️  暂无待审批的申请')
    }

    // 3. 测试设置项目角色权重
    console.log('\n📋 测试3: 设置项目角色权重')
    
    const roleWeights = {
      'tech_lead': 3.0,
      'senior_dev': 2.5,
      'developer': 2.0,
      'tester': 1.8,
      'product_mgr': 2.2
    }

    // 获取角色ID映射
    const roles = await nedbService.find('projectRoles', { status: 1 })
    const weightsByRoleId = {}
    
    for (const role of roles) {
      if (roleWeights[role.code]) {
        weightsByRoleId[role._id] = roleWeights[role.code]
      }
    }

    try {
      await projectBonusService.setProjectRoleWeights(
        testProject._id,
        weightsByRoleId,
        'test-user'
      )
      console.log('   ✅ 角色权重设置成功')
    } catch (error) {
      console.log(`   ❌ 权重设置失败: ${error.message}`)
    }

    // 4. 测试创建项目奖金池
    console.log('\n📋 测试4: 创建项目奖金池')
    
    const existingPool = await nedbService.findOne('projectBonusPools', {
      projectId: testProject._id,
      period: '2024Q4'
    })

    if (!existingPool) {
      try {
        const pool = await projectBonusService.createProjectBonusPool(
          testProject._id,
          '2024Q4',
          150000, // 15万元奖金池
          0.25, // 25% 利润分配比例
          'test-user'
        )
        console.log('   ✅ 项目奖金池创建成功')
        console.log(`   奖金池ID: ${pool._id}`)
      } catch (error) {
        console.log(`   ❌ 奖金池创建失败: ${error.message}`)
      }
    } else {
      console.log(`   ℹ️  奖金池已存在，状态: ${existingPool.status}`)
    }

    // 5. 测试计算项目奖金分配
    console.log('\n📋 测试5: 计算项目奖金分配')
    
    const bonusPool = await nedbService.findOne('projectBonusPools', {
      projectId: testProject._id,
      period: '2024Q4'
    })

    if (bonusPool) {
      try {
        const result = await projectBonusService.calculateProjectBonus(bonusPool._id)
        console.log('   ✅ 奖金计算成功')
        console.log(`   总金额: ${result.totalAmount}`)
        console.log(`   分配人数: ${result.allocations.length}`)
        
        // 显示分配详情
        if (result.allocations.length > 0) {
          console.log('   分配详情:')
          for (const allocation of result.allocations) {
            console.log(`     - ${allocation.employeeName}: ¥${allocation.bonusAmount}`)
          }
        }
      } catch (error) {
        console.log(`   ❌ 奖金计算失败: ${error.message}`)
      }
    } else {
      console.log('   ⚠️  未找到奖金池')
    }

    // 6. 测试审批项目奖金分配
    console.log('\n📋 测试6: 审批项目奖金分配')
    
    if (bonusPool) {
      try {
        await projectBonusService.approveProjectBonusAllocation(
          bonusPool._id,
          'test-hr-user'
        )
        console.log('   ✅ 奖金分配审批成功')
      } catch (error) {
        console.log(`   ❌ 奖金分配审批失败: ${error.message}`)
      }
    }

    // 7. 输出最终统计
    console.log('\n📊 工作流程测试完成，最终统计:')
    
    const finalStats = {
      totalProjects: await nedbService.count('projects', {}),
      totalMembers: await nedbService.count('projectMembers', {}),
      approvedMembers: await nedbService.count('projectMembers', { status: 'approved' }),
      bonusPools: await nedbService.count('projectBonusPools', {}),
      bonusAllocations: await nedbService.count('projectBonusAllocations', {})
    }

    console.log(`   总项目数: ${finalStats.totalProjects}`)
    console.log(`   总申请数: ${finalStats.totalMembers}`)
    console.log(`   已通过申请: ${finalStats.approvedMembers}`)
    console.log(`   奖金池数: ${finalStats.bonusPools}`)
    console.log(`   奖金分配记录: ${finalStats.bonusAllocations}`)

    console.log('\n🎉 项目奖金分配工作流程测试完成！')

  } catch (error) {
    console.error('❌ 测试失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testProjectWorkflow()
    .then(() => {
      console.log('✅ 测试完成')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ 测试失败:', error)
      process.exit(1)
    })
}

module.exports = { testProjectWorkflow }