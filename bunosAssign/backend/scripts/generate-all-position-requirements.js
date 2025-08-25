const nedbService = require('../src/services/nedbService')

async function generateAllPositionRequirements() {
  try {
    console.log('🔄 开始生成所有岗位需求数据...')
    
    // 初始化NeDB服务
    await nedbService.initialize()
    
    // 完整的岗位需求数据
    const allRequirements = [
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
      },
      {
        positionCode: 'PRODUCT_SPECIALIST',
        positionName: '产品专员',
        basicRequirements: [
          '本科及以上学历，产品管理、市场营销、计算机等相关专业',
          '1-2年产品相关工作经验',
          '具备良好的逻辑思维和学习能力',
          '对用户体验和产品设计有敏感度'
        ],
        skills: [
          '需求收集：用户访谈、问卷调研、数据分析',
          '文档编写：需求文档、产品原型、测试用例',
          '项目协调：开发协调、测试跟进、上线管理',
          '数据分析：用户行为分析、产品数据监控'
        ],
        experience: [
          '参与过2个以上产品项目',
          '独立完成需求调研和文档编写',
          '有跨部门协作经验',
          '了解产品开发流程'
        ],
        careerPath: {
          nextLevel: '产品经理',
          estimatedTime: '2-3年',
          lateralMoves: ['项目专员', '运营专员', '用户研究员'],
          specializations: ['B端产品', 'C端产品', '数据产品'],
          growthAreas: ['产品思维', '商业理解', '技术知识', '用户洞察']
        },
        salaryRange: {
          junior: '8K-15K',
          middle: '15K-25K',
          senior: '25K-35K',
          factors: ['产品能力', '项目经验', '学习能力', '沟通能力']
        }
      },
      {
        positionCode: 'IMPL_CONSULTANT',
        positionName: '实施顾问',
        basicRequirements: [
          '本科及以上学历，计算机、信息系统等相关专业',
          '2年以上系统实施或技术支持经验',
          '熟悉常见的企业软件系统',
          '具备良好的客户服务意识和沟通能力'
        ],
        skills: [
          '系统实施：需求分析、系统配置、数据迁移',
          '用户培训：培训计划制定、培训材料准备、现场培训',
          '项目管理：进度跟踪、风险识别、问题解决',
          '技术支持：系统维护、问题诊断、优化建议'
        ],
        experience: [
          '完成过5个以上系统实施项目',
          '有客户现场服务经验',
          '熟悉至少2种主流ERP或CRM系统',
          '具备项目管理经验'
        ],
        careerPath: {
          nextLevel: '高级实施顾问',
          estimatedTime: '2-3年',
          lateralMoves: ['技术支持', '项目经理', '售前顾问'],
          specializations: ['特定系统', '行业应用', '数据集成'],
          growthAreas: ['技术深度', '项目管理', '行业知识', '客户关系']
        },
        salaryRange: {
          junior: '10K-18K',
          middle: '18K-30K',
          senior: '30K-45K',
          factors: ['技术能力', '项目经验', '客户满意度', '行业背景']
        }
      },
      {
        positionCode: 'MARKETING_ENG_DIRECTOR',
        positionName: '市场工程总监',
        basicRequirements: [
          '本科及以上学历，市场营销、工程技术等相关专业',
          '8年以上市场工程经验，5年以上管理经验',
          '具备深厚的技术背景和市场洞察力',
          '优秀的团队管理和战略思维能力'
        ],
        skills: [
          '团队管理：人才培养、绩效管理、团队建设',
          '技术方案：解决方案设计、技术评估、创新引导',
          '客户关系：大客户维护、合作伙伴管理、生态建设',
          '市场策略：市场分析、竞争策略、产品定位'
        ],
        experience: [
          '管理过30人以上技术团队',
          '负责年度营收目标3000万以上',
          '有大型项目和解决方案经验',
          '具备行业影响力和客户资源'
        ],
        careerPath: {
          nextLevel: '技术副总裁/CTO',
          estimatedTime: '3-5年',
          lateralMoves: ['产品总监', '技术总监', '销售总监'],
          specializations: ['技术营销', '解决方案', '生态合作'],
          growthAreas: ['技术趋势', '市场洞察', '战略规划', '组织能力']
        },
        salaryRange: {
          junior: '60K-100K',
          middle: '100K-150K',
          senior: '150K-250K',
          factors: ['团队规模', '业务贡献', '技术影响力', '行业地位']
        }
      },
      {
        positionCode: 'BUSINESS_MANAGER',
        positionName: '商务经理',
        basicRequirements: [
          '本科及以上学历，市场营销、工商管理等相关专业',
          '3年以上商务拓展或销售经验',
          '具备优秀的商务谈判和合同管理能力',
          '良好的客户关系维护和开发能力'
        ],
        skills: [
          '商务拓展：市场开发、客户挖掘、商机识别',
          '合同管理：合同起草、谈判策略、风险控制',
          '客户关系：客户维护、需求挖掘、满意度管理',
          '项目协调：跨部门协作、资源整合、进度跟踪'
        ],
        experience: [
          '完成年度销售目标500万以上',
          '开发大客户10家以上',
          '有复杂商务谈判经验',
          '具备行业客户资源'
        ],
        careerPath: {
          nextLevel: '商务总监',
          estimatedTime: '3-5年',
          lateralMoves: ['销售经理', '产品经理', '市场经理'],
          specializations: ['特定行业', '渠道合作', '战略客户'],
          growthAreas: ['商业洞察', '战略思维', '团队管理', '数字化营销']
        },
        salaryRange: {
          junior: '15K-25K',
          middle: '25K-40K',
          senior: '40K-60K',
          factors: ['销售业绩', '客户质量', '合同金额', '市场影响']
        }
      },
      {
        positionCode: 'PRESALE_CONSULTANT',
        positionName: '售前顾问',
        basicRequirements: [
          '本科及以上学历，计算机、通信工程等相关专业',
          '2年以上技术支持或售前经验',
          '具备良好的技术理解和沟通表达能力',
          '对客户需求敏感，服务意识强'
        ],
        skills: [
          '技术交流：技术方案讲解、产品演示、技术答疑',
          '需求分析：客户需求挖掘、技术可行性分析',
          '方案设计：初步技术方案、成本估算',
          '商务配合：投标支持、商务谈判技术支持'
        ],
        experience: [
          '参与过20个以上售前项目',
          '有客户现场服务经验',
          '熟悉公司产品和解决方案',
          '具备基本的项目管理能力'
        ],
        careerPath: {
          nextLevel: '高级售前顾问',
          estimatedTime: '2-3年',
          lateralMoves: ['实施顾问', '产品专员', '技术支持'],
          specializations: ['特定技术', '行业应用', '解决方案'],
          growthAreas: ['技术深度', '沟通能力', '商业理解', '行业知识']
        },
        salaryRange: {
          junior: '10K-18K',
          middle: '18K-30K',
          senior: '30K-45K',
          factors: ['技术能力', '沟通能力', '项目贡献', '客户反馈']
        }
      },
      {
        positionCode: 'PRODUCT_MANAGER',
        positionName: '产品经理',
        basicRequirements: [
          '本科及以上学历，产品管理、工商管理、计算机等相关专业',
          '3年以上产品管理经验',
          '具备扎实的产品思维和用户洞察能力',
          '优秀的逻辑思维和数据分析能力'
        ],
        skills: [
          '产品规划：产品策略制定、功能规划、版本管理',
          '需求管理：需求收集、优先级排序、需求文档',
          '项目协调：开发协调、测试管理、上线跟踪',
          '数据分析：用户行为分析、产品效果评估'
        ],
        experience: [
          '独立负责过1个以上产品线',
          '有完整的产品生命周期管理经验',
          '具备跨部门协作能力',
          '有数据驱动产品优化经验'
        ],
        careerPath: {
          nextLevel: '高级产品经理',
          estimatedTime: '2-3年',
          lateralMoves: ['项目经理', '运营经理', '技术经理'],
          specializations: ['B端产品', 'C端产品', '平台产品'],
          growthAreas: ['商业理解', '技术理解', '用户研究', '团队协作']
        },
        salaryRange: {
          junior: '18K-28K',
          middle: '28K-45K',
          senior: '45K-70K',
          factors: ['产品影响力', '用户规模', '商业价值', '行业经验']
        }
      },
      {
        positionCode: 'JR_IMPL_CONSULTANT',
        positionName: '初级实施顾问',
        basicRequirements: [
          '大专及以上学历，计算机、信息管理等相关专业',
          '1年以上相关工作经验或优秀应届毕业生',
          '具备基本的计算机操作和学习能力',
          '良好的沟通能力和服务意识'
        ],
        skills: [
          '基础实施：系统安装、基础配置、数据录入',
          '用户支持：用户培训、操作指导、问题解答',
          '文档编写：操作手册、培训材料、问题记录',
          '测试协助：功能测试、用户验收测试'
        ],
        experience: [
          '参与过3个以上系统实施项目',
          '熟悉Windows和基本网络操作',
          '有客户服务经验',
          '具备学习新系统的能力'
        ],
        careerPath: {
          nextLevel: '实施顾问',
          estimatedTime: '2-3年',
          lateralMoves: ['技术支持', '产品专员', '测试工程师'],
          specializations: ['特定系统', '行业应用', '技术支持'],
          growthAreas: ['技术能力', '客户服务', '项目管理', '业务理解']
        },
        salaryRange: {
          junior: '6K-12K',
          middle: '12K-20K',
          senior: '20K-30K',
          factors: ['技术成长', '服务质量', '学习能力', '项目贡献']
        }
      },
      {
        positionCode: 'PRODUCT_DIRECTOR',
        positionName: '产品总监',
        basicRequirements: [
          '本科及以上学历，产品管理、工商管理等相关专业，MBA优先',
          '8年以上产品管理经验，5年以上团队管理经验',
          '具备深厚的产品战略思维和商业洞察力',
          '优秀的领导力和团队建设能力'
        ],
        skills: [
          '产品战略：产品线规划、市场定位、竞争策略',
          '团队管理：人才培养、绩效管理、组织建设',
          '商业洞察：市场分析、商业模式、盈利策略',
          '创新引导：产品创新、技术趋势、用户体验'
        ],
        experience: [
          '管理过20人以上产品团队',
          '负责产品线年收入1000万以上',
          '有成功产品从0到1的经验',
          '具备行业影响力'
        ],
        careerPath: {
          nextLevel: '产品副总裁/CPO',
          estimatedTime: '3-5年',
          lateralMoves: ['技术总监', '运营总监', '商业发展总监'],
          specializations: ['产品战略', '创新管理', '商业模式'],
          growthAreas: ['战略思维', '组织能力', '行业洞察', '技术趋势']
        },
        salaryRange: {
          junior: '50K-80K',
          middle: '80K-120K',
          senior: '120K-200K',
          factors: ['团队规模', '产品影响力', '商业贡献', '行业地位']
        }
      },
      {
        positionCode: 'MARKETING_SPECIALIST',
        positionName: '市场专员',
        basicRequirements: [
          '本科及以上学历，市场营销、广告学、新闻传播等相关专业',
          '1-2年市场营销相关工作经验',
          '具备创意思维和执行能力',
          '熟悉数字化营销工具和平台'
        ],
        skills: [
          '市场推广：活动策划、内容营销、渠道推广',
          '品牌建设：品牌形象、视觉设计、传播策略',
          '数据分析：营销效果分析、用户行为分析',
          '创意执行：文案撰写、设计协调、活动执行'
        ],
        experience: [
          '策划执行过5个以上市场活动',
          '有社交媒体运营经验',
          '熟悉主流营销工具',
          '具备基本的设计审美能力'
        ],
        careerPath: {
          nextLevel: '市场主管',
          estimatedTime: '2-3年',
          lateralMoves: ['产品专员', '运营专员', '商务专员'],
          specializations: ['数字营销', '品牌营销', '活动营销'],
          growthAreas: ['市场洞察', '创意能力', '数据分析', '项目管理']
        },
        salaryRange: {
          junior: '8K-15K',
          middle: '15K-25K',
          senior: '25K-35K',
          factors: ['创意能力', '执行效果', '学习能力', '市场敏感度']
        }
      },
      {
        positionCode: 'IMPL_DIRECTOR',
        positionName: '实施总监',
        basicRequirements: [
          '本科及以上学历，计算机、项目管理等相关专业',
          '8年以上实施管理经验，5年以上团队管理经验',
          '具备深厚的技术背景和项目管理能力',
          '优秀的客户关系管理和团队领导能力'
        ],
        skills: [
          '团队管理：人才培养、绩效管理、资源配置',
          '项目管理：大型项目规划、风险控制、质量管理',
          '技术指导：技术方案审核、疑难问题解决',
          '客户关系：大客户维护、满意度管理、续约推进'
        ],
        experience: [
          '管理过50人以上实施团队',
          '负责年度实施项目3000万以上',
          '有大型复杂项目管理经验',
          '客户满意度90%以上'
        ],
        careerPath: {
          nextLevel: '技术副总裁',
          estimatedTime: '3-5年',
          lateralMoves: ['产品总监', '技术总监', '运营总监'],
          specializations: ['实施管理', '技术咨询', '数字化转型'],
          growthAreas: ['技术趋势', '管理能力', '商业理解', '战略思维']
        },
        salaryRange: {
          junior: '50K-80K',
          middle: '80K-120K',
          senior: '120K-180K',
          factors: ['团队规模', '项目成功率', '客户满意度', '技术深度']
        }
      },
      {
        positionCode: 'FINANCE_MANAGER',
        positionName: '财务经理',
        basicRequirements: [
          '本科及以上学历，财务管理、会计学、金融学等相关专业',
          '5年以上财务管理经验，具备CPA或相关资格证书',
          '熟悉财务法规和企业财务管理制度',
          '具备优秀的数据分析和风险控制能力'
        ],
        skills: [
          '财务管理：财务规划、预算管理、成本控制',
          '财务分析：经营分析、投资分析、风险评估',
          '制度建设：财务制度设计、流程优化、内控体系',
          '税务筹划：税务规划、合规管理、成本优化'
        ],
        experience: [
          '管理过3-5人财务团队',
          '负责年度预算5000万以上',
          '有上市公司或大型企业财务经验',
          '具备投融资项目经验'
        ],
        careerPath: {
          nextLevel: '财务总监/CFO',
          estimatedTime: '3-5年',
          lateralMoves: ['运营经理', '风控经理', '投资经理'],
          specializations: ['财务分析', '成本管理', '投融资'],
          growthAreas: ['财务战略', '风险管理', '资本运作', '数字化财务']
        },
        salaryRange: {
          junior: '20K-35K',
          middle: '35K-55K',
          senior: '55K-80K',
          factors: ['财务规模', '管理复杂度', '专业资质', '行业经验']
        }
      },
      {
        positionCode: 'SR_IMPL_CONSULTANT',
        positionName: '高级实施顾问',
        basicRequirements: [
          '本科及以上学历，计算机、信息系统等相关专业',
          '5年以上系统实施经验，具备复杂项目管理能力',
          '深入了解行业业务流程和最佳实践',
          '优秀的客户沟通和团队协作能力'
        ],
        skills: [
          '复杂实施：大型系统实施、数据迁移、系统集成',
          '技术指导：技术方案设计、疑难问题解决',
          '项目管理：项目规划、进度控制、风险管理',
          '客户培训：高级培训、最佳实践分享、变革管理'
        ],
        experience: [
          '主导过10个以上大型实施项目',
          '项目金额单个500万以上',
          '有行业标杆客户实施经验',
          '具备团队带领和培养能力'
        ],
        careerPath: {
          nextLevel: '实施总监',
          estimatedTime: '3-5年',
          lateralMoves: ['技术架构师', '项目经理', '产品经理'],
          specializations: ['特定行业', '复杂集成', '数字化转型'],
          growthAreas: ['技术深度', '行业知识', '管理能力', '商业理解']
        },
        salaryRange: {
          junior: '25K-40K',
          middle: '40K-60K',
          senior: '60K-90K',
          factors: ['技术深度', '项目复杂度', '客户评价', '团队贡献']
        }
      }
    ]

    // 清空现有数据
    try {
      const existingData = await nedbService.find('position_requirements', {})
      if (existingData.length > 0) {
        for (const item of existingData) {
          await nedbService.remove('position_requirements', { _id: item._id })
        }
        console.log(`✅ 清空现有岗位需求数据 (${existingData.length} 条)`)
      }
    } catch (error) {
      console.log('📝 position_requirements 集合不存在，将创建新集合')
    }

    // 插入新数据
    let successCount = 0
    for (const req of allRequirements) {
      try {
        await nedbService.insert('position_requirements', {
          ...req,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        successCount++
        console.log(`✅ 已生成 ${req.positionName} (${req.positionCode}) 的岗位需求`)
      } catch (error) {
        console.error(`❌ 生成 ${req.positionName} 岗位需求失败:`, error.message)
      }
    }

    console.log(`\n🎉 成功生成 ${successCount}/${allRequirements.length} 个岗位的需求信息`)
    
    // 验证数据
    const allGenerated = await nedbService.find('position_requirements', {})
    console.log(`📊 数据库中共有 ${allGenerated.length} 条岗位需求记录`)
    
    // 显示统计信息
    console.log('\n📈 岗位需求统计:')
    allGenerated.forEach(req => {
      console.log(`📋 ${req.positionName}:`)
      console.log(`   基础要求: ${req.basicRequirements.length} 项`)
      console.log(`   技能要求: ${req.skills.length} 项`)
      console.log(`   经验要求: ${req.experience.length} 项`)
      console.log(`   发展方向: ${req.careerPath.nextLevel}`)
      console.log(`   薪资范围: ${req.salaryRange.junior} - ${req.salaryRange.senior}`)
      console.log('')
    })
    
    process.exit(0)
  } catch (error) {
    console.error('❌ 生成岗位需求失败:', error)
    process.exit(1)
  }
}

// 运行生成脚本
generateAllPositionRequirements()
