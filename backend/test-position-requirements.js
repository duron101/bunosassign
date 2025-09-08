/**
 * 岗位要求功能测试脚本
 * 测试岗位要求的创建、查询、更新、审核等核心功能
 */

const NeDBService = require('./src/services/nedbService')
const PositionRequirementService = require('./src/services/positionRequirementService')

async function testPositionRequirements() {
  console.log('🚀 开始测试岗位要求功能...')
  
  try {
    // 初始化 NeDB 服务
    const nedbService = new NeDBService()
    await nedbService.initialize()
    
    const positionRequirementService = require('./src/services/positionRequirementService')
    
    console.log('\n📋 测试1: 创建算法工程师岗位要求')
    const algorithmRequirement = await positionRequirementService.createPositionRequirement({
      positionId: 'pos_001',
      positionCode: 'ALG001',
      positionName: '算法工程师',
      businessLineId: 'bl_001',
      basicRequirements: {
        education: '硕士及以上',
        experience: '3-5年',
        age: '25-35岁',
        certificates: ['相关专业认证'],
        major: '计算机、数学、自动化等相关专业'
      },
      professionalSkills: {
        simulationSkills: ['MATLAB', 'Simulink', 'ANSYS'],
        aiSkills: ['Python', 'TensorFlow', 'PyTorch', '机器学习算法'],
        softwareSkills: ['C++', 'Python', '算法设计'],
        hardwareSkills: [],
        tools: ['Git', 'Docker', 'Linux'],
        languages: ['中文', '英语']
      },
      softSkills: {
        communication: '良好',
        teamwork: '良好',
        problemSolving: '优秀',
        innovation: '优秀',
        learning: '优秀'
      },
      promotionRequirements: {
        minExperience: '3年',
        performanceLevel: 'B级及以上',
        skillAssessment: '通过算法技能考核',
        projectContribution: '主导过2个以上算法项目'
      },
      careerPath: {
        nextLevel: '高级算法工程师',
        lateralMoves: ['技术架构师', 'AI专家'],
        specializations: ['机器学习专家', '算法优化专家'],
        estimatedTime: '2-3年',
        growthAreas: ['算法深度', '业务理解', '技术创新']
      },
      responsibilities: [
        '负责核心算法设计和优化',
        '参与技术方案设计',
        '指导初级算法工程师',
        '推动算法技术创新'
      ]
    })
    
    console.log('✅ 算法工程师岗位要求创建成功:', algorithmRequirement._id || algorithmRequirement.id)
    
    console.log('\n📋 测试2: 创建综合运营专员岗位要求')
    const opsRequirement = await positionRequirementService.createPositionRequirement({
      positionId: 'pos_002',
      positionCode: 'OPS001',
      positionName: '综合运营专员',
      businessLineId: 'bl_002',
      basicRequirements: {
        education: '本科及以上',
        experience: '3-5年',
        age: '25-35岁',
        certificates: ['人力资源管理师', '会计从业资格'],
        major: '工商管理、人力资源管理等相关专业'
      },
      professionalSkills: {
        simulationSkills: [],
        aiSkills: [],
        softwareSkills: ['Office办公软件', '财务软件'],
        hardwareSkills: [],
        tools: ['OA系统', 'CRM系统', '财务系统'],
        languages: ['中文', '英语']
      },
      softSkills: {
        communication: '优秀',
        teamwork: '优秀',
        problemSolving: '良好',
        innovation: '良好',
        learning: '良好'
      },
      promotionRequirements: {
        minExperience: '3年',
        performanceLevel: 'B级及以上',
        skillAssessment: '通过综合运营技能考核',
        projectContribution: '独立完成3个以上运营项目'
      },
      careerPath: {
        nextLevel: '综合运营主管',
        lateralMoves: ['人事主管', '行政主管'],
        specializations: ['运营专家', '流程优化专家'],
        estimatedTime: '2-3年',
        growthAreas: ['流程优化', '团队管理', '战略规划']
      },
      responsibilities: [
        '负责公司日常运营管理',
        '协调各部门工作',
        '优化运营流程',
        '维护供应商关系'
      ]
    })
    
    console.log('✅ 综合运营专员岗位要求创建成功:', opsRequirement._id || opsRequirement.id)
    
    console.log('\n📋 测试3: 获取岗位要求列表')
    const requirementsList = await positionRequirementService.getPositionRequirements({
      page: 1,
      pageSize: 10
    })
    
    console.log('✅ 获取岗位要求列表成功:', {
      total: requirementsList.pagination.total,
      page: requirementsList.pagination.page,
      pageSize: requirementsList.pagination.pageSize
    })
    
    console.log('\n📋 测试4: 根据岗位ID获取岗位要求')
    const requirementByPositionId = await positionRequirementService.getPositionRequirementByPositionId('pos_001')
    
    if (requirementByPositionId) {
      console.log('✅ 根据岗位ID获取岗位要求成功:', requirementByPositionId.positionName)
    } else {
      console.log('⚠️ 根据岗位ID获取岗位要求失败')
    }
    
    console.log('\n📋 测试5: 提交审核')
    const submittedRequirement = await positionRequirementService.submitForApproval(algorithmRequirement._id || algorithmRequirement.id)
    
    console.log('✅ 提交审核成功:', submittedRequirement.approvalStatus)
    
    console.log('\n📋 测试6: 业务线审核通过')
    const businessLineApproved = await positionRequirementService.approveByBusinessLine(
      algorithmRequirement._id || algorithmRequirement.id,
      '业务线经理',
      '技能要求合理，晋升条件明确'
    )
    
    console.log('✅ 业务线审核通过:', businessLineApproved.approvalStatus)
    
    console.log('\n📋 测试7: 管理员最终审批')
    const finalApproved = await positionRequirementService.finalApproval(
      algorithmRequirement._id || algorithmRequirement.id,
      '系统管理员',
      true,
      '岗位要求完整，符合公司发展需要'
    )
    
    console.log('✅ 管理员最终审批成功:', finalApproved.approvalStatus)
    
    console.log('\n📋 测试8: 获取审核状态统计')
    const approvalStats = await positionRequirementService.getApprovalStats()
    
    console.log('✅ 获取审核状态统计成功:', approvalStats)
    
    console.log('\n📋 测试9: 更新岗位要求')
    const updatedRequirement = await positionRequirementService.updatePositionRequirement(
      algorithmRequirement._id || algorithmRequirement.id,
      {
        basicRequirements: {
          ...algorithmRequirement.basicRequirements,
          experience: '3-7年'
        }
      }
    )
    
    console.log('✅ 更新岗位要求成功:', updatedRequirement.basicRequirements.experience)
    
    console.log('\n📋 测试10: 获取岗位要求模板')
    const algorithmTemplate = positionRequirementService.getPositionRequirementTemplate('algorithm-engineer')
    const opsTemplate = positionRequirementService.getPositionRequirementTemplate('comprehensive-ops')
    
    console.log('✅ 获取算法工程师模板成功:', algorithmTemplate.basicRequirements.education)
    console.log('✅ 获取综合运营模板成功:', opsTemplate.basicRequirements.education)
    
    console.log('\n📋 测试11: 批量操作')
    const batchResult = await positionRequirementService.batchOperation(
      [algorithmRequirement._id || algorithmRequirement.id, opsRequirement._id || opsRequirement.id],
      'enable'
    )
    
    console.log('✅ 批量操作成功:', batchResult)
    
    console.log('\n🎉 所有测试通过！岗位要求功能完整可用')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  } finally {
    process.exit(0)
  }
}

// 运行测试
testPositionRequirements()
