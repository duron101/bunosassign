// 初始化项目成员相关数据
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const nedbService = require('../backend/src/services/nedbService')

async function initProjectMemberData() {
  try {
    console.log('📋 开始初始化项目成员相关数据...')

    // 初始化服务
    await nedbService.initialize()

    // 1. 初始化项目角色数据
    console.log('📝 初始化项目角色数据...')
    const projectRoles = [
      {
        name: '技术负责人',
        code: 'tech_lead',
        description: '负责技术方案设计和团队管理',
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: '高级开发工程师',
        code: 'senior_dev',
        description: '负责核心模块开发和技术攻关',
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: '开发工程师',
        code: 'developer',
        description: '负责功能模块开发和测试',
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: '初级开发工程师',
        code: 'junior_dev',
        description: '负责简单功能开发和学习',
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: '测试工程师',
        code: 'tester',
        description: '负责测试用例设计和质量保证',
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: '产品经理',
        code: 'product_mgr',
        description: '负责产品需求分析和项目管理',
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'UI设计师',
        code: 'ui_designer',
        description: '负责界面设计和用户体验',
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: '运维工程师',
        code: 'devops',
        description: '负责部署运维和系统监控',
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    for (const role of projectRoles) {
      try {
        const existing = await nedbService.findOne('projectRoles', { code: role.code })
        if (!existing) {
          await nedbService.insert('projectRoles', role)
          console.log(`✅ 已创建项目角色: ${role.name}`)
        } else {
          console.log(`ℹ️  项目角色已存在: ${role.name}`)
        }
      } catch (error) {
        // 如果查询失败，可能是集合不存在，直接插入
        await nedbService.insert('projectRoles', role)
        console.log(`✅ 已创建项目角色: ${role.name}`)
      }
    }

    // 2. 为现有项目创建示例项目角色权重配置
    console.log('📝 初始化项目角色权重配置...')
    const projects = await nedbService.find('projects', { status: { $in: ['planning', 'active'] } })
    
    if (projects && projects.length > 0) {
      const defaultWeights = {
        'tech_lead': 3.0,
        'senior_dev': 2.5,
        'developer': 2.0,
        'junior_dev': 1.5,
        'tester': 1.8,
        'product_mgr': 2.2,
        'ui_designer': 1.8,
        'devops': 2.0
      }

      // 将角色代码转换为角色ID
      const roleMap = {}
      for (const role of projectRoles) {
        const dbRole = await nedbService.findOne('projectRoles', { code: role.code })
        if (dbRole) {
          roleMap[role.code] = dbRole._id
        }
      }

      const weightsByRoleId = {}
      for (const [code, weight] of Object.entries(defaultWeights)) {
        if (roleMap[code]) {
          weightsByRoleId[roleMap[code]] = weight
        }
      }

      for (const project of projects) {
        try {
          const existing = await nedbService.findOne('projectRoleWeights', { projectId: project._id })
          if (!existing) {
            const weightData = {
              projectId: project._id,
              weights: weightsByRoleId,
              totalWeight: Object.values(defaultWeights).reduce((sum, w) => sum + w, 0),
              updatedBy: 'system',
              createdAt: new Date(),
              updatedAt: new Date()
            }
            await nedbService.insert('projectRoleWeights', weightData)
            console.log(`✅ 已创建项目权重配置: ${project.name}`)
          } else {
            console.log(`ℹ️  项目权重配置已存在: ${project.name}`)
          }
        } catch (error) {
          const weightData = {
            projectId: project._id,
            weights: weightsByRoleId,
            totalWeight: Object.values(defaultWeights).reduce((sum, w) => sum + w, 0),
            updatedBy: 'system',
            createdAt: new Date(),
            updatedAt: new Date()
          }
          await nedbService.insert('projectRoleWeights', weightData)
          console.log(`✅ 已创建项目权重配置: ${project.name}`)
        }
      }
    }

    // 3. 创建示例项目成员申请
    console.log('📝 初始化示例项目成员申请...')
    const employees = await nedbService.find('employees', { status: 1 })
    
    if (projects && projects.length > 0 && employees && employees.length > 0) {
      // 为第一个项目创建几个示例申请
      const project = projects[0]
      const sampleEmployees = employees.slice(0, 3) // 取前3个员工
      const roles = await nedbService.find('projectRoles', { status: 1 })

      for (const employee of sampleEmployees) {
        try {
          const existing = await nedbService.findOne('projectMembers', { 
            projectId: project._id, 
            employeeId: employee._id 
          })
          
          if (!existing) {
            const memberData = {
              projectId: project._id,
              employeeId: employee._id,
              status: 'pending', // pending, approved, rejected
              applyReason: `我希望能够加入${project.name}项目，发挥我的专业技能，为项目成功贡献力量。我有相关的技术经验和学习能力，能够快速适应项目需求。`,
              expectedRoleId: roles[Math.floor(Math.random() * roles.length)]._id,
              appliedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date()
            }
            
            await nedbService.insert('projectMembers', memberData)
            console.log(`✅ 已创建项目成员申请: ${employee.name} -> ${project.name}`)
          } else {
            console.log(`ℹ️  项目成员申请已存在: ${employee.name} -> ${project.name}`)
          }
        } catch (error) {
          const memberData = {
            projectId: project._id,
            employeeId: employee._id,
            status: 'pending',
            applyReason: `我希望能够加入${project.name}项目，发挥我的专业技能，为项目成功贡献力量。我有相关的技术经验和学习能力，能够快速适应项目需求。`,
            expectedRoleId: roles[Math.floor(Math.random() * roles.length)]._id,
            appliedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
          
          await nedbService.insert('projectMembers', memberData)
          console.log(`✅ 已创建项目成员申请: ${employee.name} -> ${project.name}`)
        }
      }
    }

    // 4. 创建示例项目奖金池
    console.log('📝 初始化示例项目奖金池...')
    if (projects && projects.length > 0) {
      const project = projects[0]
      try {
        const existing = await nedbService.findOne('projectBonusPools', { 
          projectId: project._id, 
          period: '2024Q4' 
        })
        
        if (!existing) {
          const poolData = {
            projectId: project._id,
            period: '2024Q4',
            totalAmount: 100000, // 10万元奖金池
            profitRatio: 0.2, // 20%的利润分配比例
            status: 'pending',
            createdBy: 'system',
            createdAt: new Date(),
            updatedAt: new Date()
          }
          
          await nedbService.insert('projectBonusPools', poolData)
          console.log(`✅ 已创建项目奖金池: ${project.name} - 2024Q4`)
        } else {
          console.log(`ℹ️  项目奖金池已存在: ${project.name} - 2024Q4`)
        }
      } catch (error) {
        const poolData = {
          projectId: project._id,
          period: '2024Q4',
          totalAmount: 100000,
          profitRatio: 0.2,
          status: 'pending',
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        await nedbService.insert('projectBonusPools', poolData)
        console.log(`✅ 已创建项目奖金池: ${project.name} - 2024Q4`)
      }
    }

    console.log('✅ 项目成员数据初始化完成！')
    
    // 输出统计信息
    const stats = {
      projectRoles: await nedbService.count('projectRoles', { status: 1 }),
      projectMembers: await nedbService.count('projectMembers', {}),
      projectRoleWeights: await nedbService.count('projectRoleWeights', {}),
      projectBonusPools: await nedbService.count('projectBonusPools', {})
    }

    console.log('📊 数据统计:')
    console.log(`   项目角色: ${stats.projectRoles}`)
    console.log(`   项目成员申请: ${stats.projectMembers}`)
    console.log(`   角色权重配置: ${stats.projectRoleWeights}`)
    console.log(`   项目奖金池: ${stats.projectBonusPools}`)

  } catch (error) {
    console.error('❌ 初始化失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initProjectMemberData()
    .then(() => {
      console.log('🎉 初始化完成')
      process.exit(0)
    })
    .catch(error => {
      console.error('❌ 初始化失败:', error)
      process.exit(1)
    })
}

module.exports = { initProjectMemberData }