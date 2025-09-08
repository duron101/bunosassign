const nedbService = require('./nedbService')
const logger = require('../utils/logger')

class PositionRequirementsService {
  constructor() {
    this.requirementsCollection = 'position_requirements'
  }

  // 初始化岗位要求数据
  async initializeRequirements() {
    try {
      const requirements = [
        {
          positionCode: 'PROJECT_MANAGER',
          positionName: '项目经理',
          basicRequirements: [
            '本科及以上学历，项目管理、工商管理、计算机等相关专业',
            '3年以上项目管理经验，有PMP证书优先',
            '熟悉项目管理方法论（敏捷、传统等）',
            '具备良好的沟通协调能力和团队管理能力'
          ],
          skills: [
            '项目管理工具：JIRA、禅道、Project等',
            '团队协作：Scrum、看板、站会等',
            '风险控制：风险识别、评估、应对策略',
            '沟通协调：跨部门沟通、客户沟通、团队激励'
          ],
          experience: [
            '独立管理过3个以上中大型项目',
            '团队规模10人以上',
            '项目预算100万以上',
            '具备客户关系管理经验'
          ],
          careerPath: {
            nextLevel: '项目总监',
            estimatedTime: '3-5年',
            lateralMoves: ['产品经理', '技术经理', '运营总监'],
            specializations: ['敏捷管理', '传统项目管理', '数字化转型'],
            growthAreas: ['战略规划', '资源管理', '成本控制', '质量管理']
          },
          salaryRange: {
            junior: '15K-25K',
            middle: '25K-40K',
            senior: '40K-60K',
            factors: ['项目规模', '团队人数', '行业经验', '证书等级']
          }
        },
        {
          positionCode: 'SR_PRESALE_CONSULTANT',
          positionName: '高级售前顾问',
          basicRequirements: [
            '本科及以上学历，计算机科学、软件工程、信息系统等相关专业',
            '5年以上售前咨询或技术支持经验',
            '具备深厚的技术背景和行业解决方案经验',
            '优秀的沟通表达能力和客户服务意识'
          ],
          skills: [
            '技术架构：系统架构设计、技术选型、性能优化',
            '方案设计：需求分析、技术方案、成本估算、风险评估',
            '客户沟通：需求挖掘、方案讲解、技术答疑、商务配合',
            '行业知识：深入了解目标行业业务流程和技术痛点'
          ],
          experience: [
            '主导过10个以上大型项目售前工作',
            '项目金额累计500万以上',
            '具备3个以上行业解决方案经验',
            '有成功案例和客户推荐信'
          ],
          careerPath: {
            nextLevel: '售前总监',
            estimatedTime: '2-3年',
            lateralMoves: ['产品经理', '技术架构师', '解决方案专家'],
            specializations: ['行业解决方案', '技术架构', '数字化转型'],
            growthAreas: ['行业深度', '技术趋势', '商业模式', '团队管理']
          },
          salaryRange: {
            junior: '20K-30K',
            middle: '30K-50K',
            senior: '50K-80K',
            factors: ['行业经验', '技术深度', '项目规模', '客户关系']
          }
        },
        {
          positionCode: 'SR_PRODUCT_MANAGER',
          positionName: '高级产品经理',
          basicRequirements: [
            '本科及以上学历，产品管理、工商管理、计算机等相关专业',
            '5年以上产品管理经验，有成功产品案例',
            '具备深度的用户洞察和商业思维',
            '优秀的逻辑思维和数据分析能力'
          ],
          skills: [
            '产品规划：产品策略、路线图制定、功能优先级',
            '需求分析：用户调研、需求挖掘、需求文档编写',
            '数据分析：用户行为分析、A/B测试、数据驱动决策',
            '项目协调：跨部门沟通、资源协调、进度管理'
          ],
          experience: [
            '独立负责过2个以上成功产品的全生命周期',
            '用户规模10万以上或营收贡献500万以上',
            '具备B端或C端产品经验',
            '有数据驱动产品优化的成功案例'
          ],
          careerPath: {
            nextLevel: '产品总监',
            estimatedTime: '2-3年',
            lateralMoves: ['项目经理', '运营总监', '技术总监'],
            specializations: ['B端产品', 'C端产品', '平台产品', 'AI产品'],
            growthAreas: ['商业模式', '用户研究', '技术理解', '团队管理']
          },
          salaryRange: {
            junior: '25K-35K',
            middle: '35K-55K',
            senior: '55K-85K',
            factors: ['产品规模', '用户数量', '商业价值', '行业经验']
          }
        },
        {
          positionCode: 'CEO',
          positionName: '总经理',
          basicRequirements: [
            '硕士及以上学历，工商管理、企业管理等相关专业优先',
            '10年以上企业管理经验，5年以上高级管理岗位经验',
            '具备全面的企业经营管理能力和战略眼光',
            '优秀的领导力和决策能力'
          ],
          skills: [
            '战略规划：企业战略制定、市场分析、竞争策略',
            '团队管理：组织建设、人才培养、绩效管理',
            '业务拓展：市场开拓、合作伙伴关系、商业模式创新',
            '财务管理：财务规划、成本控制、投资决策'
          ],
          experience: [
            '成功管理过100人以上规模企业',
            '年营收规模5000万以上',
            '有过企业转型或快速增长的成功经验',
            '具备行业影响力和丰富的人脉资源'
          ],
          careerPath: {
            nextLevel: '董事会成员/集团CEO',
            estimatedTime: '5-10年',
            lateralMoves: ['创业', '投资合伙人', '企业顾问'],
            specializations: ['企业战略', '资本运作', '并购重组'],
            growthAreas: ['行业洞察', '国际视野', '资本市场', '创新思维']
          },
          salaryRange: {
            junior: '100K-200K',
            middle: '200K-500K',
            senior: '500K+',
            factors: ['企业规模', '行业地位', '业绩表现', '股权激励']
          }
        },
        {
          positionCode: 'TECH_SUPPORT_SPECIALIST',
          positionName: '技术支持专员',
          basicRequirements: [
            '大专及以上学历，计算机、软件技术等相关专业',
            '2年以上技术支持或运维经验',
            '熟悉常见操作系统和网络配置',
            '具备良好的客户服务意识和沟通能力'
          ],
          skills: [
            '技术诊断：系统故障分析、网络问题排查、性能调优',
            '客户服务：问题响应、解决方案提供、客户培训',
            '系统维护：日常维护、备份恢复、安全防护',
            '文档管理：技术文档编写、知识库维护、问题总结'
          ],
          experience: [
            '处理过500个以上技术支持案例',
            '熟悉3种以上主流操作系统或技术栈',
            '有客户现场服务经验',
            '具备7*24小时服务经验优先'
          ],
          careerPath: {
            nextLevel: '技术支持主管',
            estimatedTime: '2-3年',
            lateralMoves: ['实施顾问', '运维工程师', '测试工程师'],
            specializations: ['特定技术栈', '行业应用', '运维自动化'],
            growthAreas: ['技术深度', '服务能力', '问题分析', '团队协作']
          },
          salaryRange: {
            junior: '8K-15K',
            middle: '15K-25K',
            senior: '25K-35K',
            factors: ['技术广度', '服务质量', '客户满意度', '解决问题能力']
          }
        },
        {
          positionCode: 'DEPT_MANAGER',
          positionName: '部门经理',
          basicRequirements: [
            '本科及以上学历，相关专业背景',
            '5年以上相关工作经验，3年以上管理经验',
            '具备扎实的专业技能和管理能力',
            '优秀的沟通协调和团队建设能力'
          ],
          skills: [
            '部门管理：团队建设、目标制定、资源配置',
            '业务统筹：业务流程优化、跨部门协作、项目推进',
            '绩效管理：目标设定、过程监控、结果评估',
            '人才发展：员工培养、职业规划、激励管理'
          ],
          experience: [
            '管理过20人以上团队',
            '负责部门年度目标达成',
            '有跨部门协作和项目管理经验',
            '有人才培养和团队建设成功案例'
          ],
          careerPath: {
            nextLevel: '部门总监',
            estimatedTime: '3-5年',
            lateralMoves: ['项目总监', '产品总监', '运营总监'],
            specializations: ['特定业务领域', '管理方法论', '数字化转型'],
            growthAreas: ['战略思维', '跨部门协作', '变革管理', '数据分析']
          },
          salaryRange: {
            junior: '20K-30K',
            middle: '30K-50K',
            senior: '50K-70K',
            factors: ['部门规模', '业务复杂度', '团队绩效', '行业经验']
          }
        },
        {
          positionCode: 'HR_ADMIN_SPECIALIST',
          positionName: '人事行政专员',
          basicRequirements: [
            '本科及以上学历，人力资源管理、行政管理等相关专业',
            '2年以上人事行政工作经验',
            '熟悉劳动法规和HR管理流程',
            '具备良好的服务意识和沟通能力'
          ],
          skills: [
            '招聘管理：招聘流程设计、面试组织、人才评估',
            '员工关系：员工沟通、冲突处理、文化建设',
            '薪酬福利：薪酬体系设计、福利管理、考勤管理',
            '行政事务：办公环境管理、供应商管理、资产管理'
          ],
          experience: [
            '完成过100人以上招聘任务',
            '熟悉薪酬福利体系设计',
            '有员工关系处理经验',
            '具备HRBP或相关认证优先'
          ],
          careerPath: {
            nextLevel: 'HR主管',
            estimatedTime: '2-3年',
            lateralMoves: ['培训专员', '薪酬专员', '组织发展专员'],
            specializations: ['招聘', '培训', '薪酬', '员工关系'],
            growthAreas: ['人力资源战略', '组织发展', '数据分析', '法律法规']
          },
          salaryRange: {
            junior: '8K-15K',
            middle: '15K-25K',
            senior: '25K-35K',
            factors: ['HR技能广度', '处理复杂度', '公司规模', '行业经验']
          }
        }
      ]

      // 检查是否已存在数据
      const existing = await nedbService.find(this.requirementsCollection, {})
      if (existing.length === 0) {
        for (const req of requirements) {
          await nedbService.insert(this.requirementsCollection, {
            ...req,
            createdAt: new Date(),
            updatedAt: new Date()
          })
        }
        logger.info('岗位要求数据初始化完成')
      }
    } catch (error) {
      logger.error('初始化岗位要求数据失败:', error)
      throw error
    }
  }

  // 根据岗位代码获取岗位要求
  async getRequirementsByPositionCode(positionCode) {
    try {
      const requirements = await nedbService.findOne(this.requirementsCollection, { positionCode })
      return requirements
    } catch (error) {
      logger.error(`获取岗位要求失败 [${positionCode}]:`, error)
      return null
    }
  }

  // 根据岗位名称获取岗位要求
  async getRequirementsByPositionName(positionName) {
    try {
      const requirements = await nedbService.findOne(this.requirementsCollection, { positionName })
      return requirements
    } catch (error) {
      logger.error(`获取岗位要求失败 [${positionName}]:`, error)
      return null
    }
  }

  // 获取所有岗位要求
  async getAllRequirements() {
    try {
      const requirements = await nedbService.find(this.requirementsCollection, {})
      return requirements
    } catch (error) {
      logger.error('获取所有岗位要求失败:', error)
      return []
    }
  }
}

module.exports = new PositionRequirementsService()
