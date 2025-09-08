const nedbService = require('../src/services/nedbService')

async function updatePositionData() {
  try {
    await nedbService.initialize()
    
    // 定义岗位的核心技能和发展方向
    const positionUpdates = [
      {
        code: 'PROJECT_MANAGER',
        coreSkills: ['项目管理', '团队协调', '风险控制', '沟通协调'],
        careerPath: {
          nextLevel: '项目总监',
          estimatedTime: '3-5年',
          lateralMoves: ['产品经理', '技术经理'],
          specializations: ['敏捷管理', '传统项目管理'],
          growthAreas: ['战略规划', '资源管理']
        }
      },
      {
        code: 'SR_PRESALE_CONSULTANT',
        coreSkills: ['技术方案设计', '客户需求分析', '技术交流', '方案演示'],
        careerPath: {
          nextLevel: '售前总监',
          estimatedTime: '2-3年',
          lateralMoves: ['产品经理', '技术架构师'],
          specializations: ['行业解决方案', '技术架构'],
          growthAreas: ['行业知识', '技术趋势']
        }
      },
      {
        code: 'SR_PRODUCT_MANAGER',
        coreSkills: ['产品规划', '需求分析', '用户体验设计', '数据分析'],
        careerPath: {
          nextLevel: '产品总监',
          estimatedTime: '2-3年',
          lateralMoves: ['项目经理', '技术经理'],
          specializations: ['B端产品', 'C端产品'],
          growthAreas: ['商业模式', '用户研究']
        }
      },
      {
        code: 'CEO',
        coreSkills: ['战略规划', '团队管理', '业务拓展', '财务管理'],
        careerPath: {
          nextLevel: '董事会成员',
          estimatedTime: '5-10年',
          lateralMoves: ['创业', '投资顾问'],
          specializations: ['企业战略', '资本运作'],
          growthAreas: ['行业洞察', '国际视野']
        }
      },
      {
        code: 'TECH_SUPPORT_SPECIALIST',
        coreSkills: ['技术问题诊断', '客户服务', '系统维护', '文档编写'],
        careerPath: {
          nextLevel: '技术支持主管',
          estimatedTime: '2-3年',
          lateralMoves: ['实施顾问', '运维工程师'],
          specializations: ['特定技术栈', '行业应用'],
          growthAreas: ['技术深度', '服务能力']
        }
      },
      {
        code: 'DEPT_MANAGER',
        coreSkills: ['部门管理', '业务统筹', '团队建设', '绩效管理'],
        careerPath: {
          nextLevel: '部门总监',
          estimatedTime: '3-5年',
          lateralMoves: ['项目经理', '产品经理'],
          specializations: ['特定业务领域', '管理方法论'],
          growthAreas: ['战略思维', '跨部门协作']
        }
      },
      {
        code: 'HR_ADMIN_SPECIALIST',
        coreSkills: ['招聘管理', '员工关系', '薪酬福利', '行政事务'],
        careerPath: {
          nextLevel: 'HR主管',
          estimatedTime: '2-3年',
          lateralMoves: ['培训专员', '薪酬专员'],
          specializations: ['招聘', '培训', '薪酬'],
          growthAreas: ['人力资源战略', '组织发展']
        }
      },
      {
        code: 'PRODUCT_SPECIALIST',
        coreSkills: ['产品执行', '需求收集', '用户反馈', '数据分析'],
        careerPath: {
          nextLevel: '产品经理',
          estimatedTime: '2-3年',
          lateralMoves: ['项目经理', '运营专员'],
          specializations: ['特定产品线', '用户运营'],
          growthAreas: ['产品思维', '数据分析']
        }
      },
      {
        code: 'IMPL_CONSULTANT',
        coreSkills: ['项目实施', '系统配置', '用户培训', '问题解决'],
        careerPath: {
          nextLevel: '高级实施顾问',
          estimatedTime: '2-3年',
          lateralMoves: ['技术支持', '项目经理'],
          specializations: ['特定系统', '行业应用'],
          growthAreas: ['技术深度', '项目管理']
        }
      },
      {
        code: 'MARKETING_ENG_DIRECTOR',
        coreSkills: ['团队管理', '技术方案', '客户关系', '项目管理'],
        careerPath: {
          nextLevel: '技术副总裁',
          estimatedTime: '3-5年',
          lateralMoves: ['产品总监', '技术总监'],
          specializations: ['技术营销', '解决方案'],
          growthAreas: ['技术趋势', '市场洞察']
        }
      },
      {
        code: 'BUSINESS_MANAGER',
        coreSkills: ['商务拓展', '合作管理', '合同谈判', '客户关系'],
        careerPath: {
          nextLevel: '商务总监',
          estimatedTime: '3-5年',
          lateralMoves: ['销售经理', '产品经理'],
          specializations: ['特定行业', '合作模式'],
          growthAreas: ['商业洞察', '战略思维']
        }
      },
      {
        code: 'PRESALE_CONSULTANT',
        coreSkills: ['售前支持', '客户沟通', '方案设计', '技术交流'],
        careerPath: {
          nextLevel: '高级售前顾问',
          estimatedTime: '2-3年',
          lateralMoves: ['实施顾问', '产品专员'],
          specializations: ['特定技术', '行业应用'],
          growthAreas: ['技术深度', '沟通能力']
        }
      },
      {
        code: 'PRODUCT_MANAGER',
        coreSkills: ['产品设计', '需求分析', '迭代管理', '用户研究'],
        careerPath: {
          nextLevel: '高级产品经理',
          estimatedTime: '2-3年',
          lateralMoves: ['项目经理', '技术经理'],
          specializations: ['特定产品', '用户类型'],
          growthAreas: ['产品战略', '数据分析']
        }
      },
      {
        code: 'JR_IMPL_CONSULTANT',
        coreSkills: ['基础实施', '系统配置', '用户支持', '文档编写'],
        careerPath: {
          nextLevel: '实施顾问',
          estimatedTime: '2-3年',
          lateralMoves: ['技术支持', '产品专员'],
          specializations: ['特定系统', '基础功能'],
          growthAreas: ['技术基础', '服务意识']
        }
      },
      {
        code: 'PRODUCT_DIRECTOR',
        coreSkills: ['产品规划', '团队管理', '战略制定', '资源协调'],
        careerPath: {
          nextLevel: '产品副总裁',
          estimatedTime: '3-5年',
          lateralMoves: ['技术总监', '运营总监'],
          specializations: ['产品战略', '团队建设'],
          growthAreas: ['行业洞察', '战略思维']
        }
      },
      {
        code: 'MARKETING_SPECIALIST',
        coreSkills: ['市场推广', '品牌建设', '活动策划', '数据分析'],
        careerPath: {
          nextLevel: '市场主管',
          estimatedTime: '2-3年',
          lateralMoves: ['产品专员', '运营专员'],
          specializations: ['数字营销', '传统营销'],
          growthAreas: ['市场洞察', '创意能力']
        }
      },
      {
        code: 'IMPL_DIRECTOR',
        coreSkills: ['团队管理', '项目管理', '技术指导', '客户关系'],
        careerPath: {
          nextLevel: '技术副总裁',
          estimatedTime: '3-5年',
          lateralMoves: ['产品总监', '技术总监'],
          specializations: ['实施管理', '技术架构'],
          growthAreas: ['技术趋势', '管理能力']
        }
      },
      {
        code: 'FINANCE_MANAGER',
        coreSkills: ['财务管理', '成本控制', '预算管理', '财务分析'],
        careerPath: {
          nextLevel: '财务总监',
          estimatedTime: '3-5年',
          lateralMoves: ['运营经理', '风险经理'],
          specializations: ['财务分析', '成本管理'],
          growthAreas: ['财务战略', '风险控制']
        }
      },
      {
        code: 'SR_IMPL_CONSULTANT',
        coreSkills: ['复杂实施', '技术指导', '项目管理', '客户培训'],
        careerPath: {
          nextLevel: '实施总监',
          estimatedTime: '3-5年',
          lateralMoves: ['技术架构师', '项目经理'],
          specializations: ['特定技术', '复杂项目'],
          growthAreas: ['技术深度', '项目管理']
        }
      }
    ]

    console.log('开始更新岗位数据...')
    
    for (const update of positionUpdates) {
      const position = await nedbService.findOne('positions', { code: update.code })
      if (position) {
        await nedbService.update('positions', 
          { _id: position._id }, 
          { 
            $set: {
              coreSkills: update.coreSkills,
              careerPath: update.careerPath,
              updatedAt: new Date()
            }
          }
        )
        console.log(`✅ 已更新岗位: ${update.code}`)
      } else {
        console.log(`❌ 未找到岗位: ${update.code}`)
      }
    }
    
    console.log('岗位数据更新完成！')
    process.exit(0)
    
  } catch (error) {
    console.error('更新岗位数据失败:', error)
    process.exit(1)
  }
}

updatePositionData()
