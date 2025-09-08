const path = require('path')
const DataStore = require('nedb')

/**
 * 测试数据初始化脚本
 * 创建项目申请功能测试所需的完整数据
 */

class TestDataInitializer {
  constructor() {
    this.databases = {}
    this.dataDir = path.join(__dirname, '../../database')
  }

  // 初始化数据库连接
  async initDatabases() {
    console.log('🚀 初始化测试数据库连接...')
    
    const dbConfigs = [
      'users', 'employees', 'departments', 'positions', 'roles', 
      'business_lines', 'projects', 'project_members', 'project_roles',
      'project_line_weights', 'permission_delegations'
    ]

    for (const dbName of dbConfigs) {
      this.databases[dbName] = new DataStore({
        filename: path.join(this.dataDir, `${dbName}.db`),
        autoload: true
      })
    }

    console.log('✅ 数据库连接初始化完成')
  }

  // 生成唯一ID
  generateId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  // 检查数据是否存在
  async findOne(dbName, query) {
    return new Promise((resolve, reject) => {
      this.databases[dbName].findOne(query, (err, doc) => {
        if (err) reject(err)
        else resolve(doc)
      })
    })
  }

  // 插入数据
  async insert(dbName, data) {
    return new Promise((resolve, reject) => {
      this.databases[dbName].insert(data, (err, doc) => {
        if (err) reject(err)
        else resolve(doc)
      })
    })
  }

  // 查询数据
  async find(dbName, query = {}) {
    return new Promise((resolve, reject) => {
      this.databases[dbName].find(query, (err, docs) => {
        if (err) reject(err)
        else resolve(docs)
      })
    })
  }

  // 初始化基础数据
  async initBasicData() {
    console.log('📊 初始化基础数据...')

    // 1. 角色数据
    const roles = [
      {
        _id: 'role_admin',
        name: '系统管理员',
        code: 'admin',
        permissions: ['*'],
        description: '系统管理员',
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'role_manager',
        name: '项目经理',
        code: 'manager',
        permissions: ['project:*', 'employee:view', 'bonus:view'],
        description: '项目经理',
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'role_employee',
        name: '普通员工',
        code: 'employee',
        permissions: ['project:view', 'personal:*'],
        description: '普通员工',
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    for (const role of roles) {
      const existing = await this.findOne('roles', { code: role.code })
      if (!existing) {
        await this.insert('roles', role)
        console.log(`  ✅ 创建角色: ${role.name}`)
      } else {
        console.log(`  ⏭️  角色已存在: ${role.name}`)
      }
    }

    // 2. 部门数据
    const departments = [
      {
        _id: 'dept_tech',
        name: '技术部',
        code: 'TECH',
        parentId: null,
        description: '技术开发部门',
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'dept_product',
        name: '产品部',
        code: 'PRODUCT',
        parentId: null,
        description: '产品设计部门',
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'dept_qa',
        name: '质量保证部',
        code: 'QA',
        parentId: null,
        description: '质量保证部门',
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    for (const dept of departments) {
      const existing = await this.findOne('departments', { code: dept.code })
      if (!existing) {
        await this.insert('departments', dept)
        console.log(`  ✅ 创建部门: ${dept.name}`)
      } else {
        console.log(`  ⏭️  部门已存在: ${dept.name}`)
      }
    }

    // 3. 职位数据
    const positions = [
      {
        _id: 'pos_dev_senior',
        name: '高级开发工程师',
        code: 'DEV_SENIOR',
        departmentId: 'dept_tech',
        level: 'P6',
        salaryRange: { min: 15000, max: 25000 },
        description: '高级开发工程师',
        requirements: ['3年以上开发经验', '熟练掌握主流开发技术'],
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'pos_dev_mid',
        name: '开发工程师',
        code: 'DEV_MID',
        departmentId: 'dept_tech',
        level: 'P5',
        salaryRange: { min: 10000, max: 18000 },
        description: '开发工程师',
        requirements: ['1年以上开发经验'],
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'pos_pm',
        name: '产品经理',
        code: 'PM',
        departmentId: 'dept_product',
        level: 'P6',
        salaryRange: { min: 12000, max: 20000 },
        description: '产品经理',
        requirements: ['产品设计经验', '需求分析能力'],
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'pos_tester',
        name: '测试工程师',
        code: 'TESTER',
        departmentId: 'dept_qa',
        level: 'P5',
        salaryRange: { min: 9000, max: 15000 },
        description: '测试工程师',
        requirements: ['测试经验', '自动化测试技能'],
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    for (const position of positions) {
      const existing = await this.findOne('positions', { code: position.code })
      if (!existing) {
        await this.insert('positions', position)
        console.log(`  ✅ 创建职位: ${position.name}`)
      } else {
        console.log(`  ⏭️  职位已存在: ${position.name}`)
      }
    }

    // 4. 业务线数据
    const businessLines = [
      {
        _id: 'bl_web',
        name: 'Web开发',
        code: 'WEB',
        weight: 0.4,
        description: 'Web应用开发业务线',
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'bl_mobile',
        name: '移动开发',
        code: 'MOBILE',
        weight: 0.3,
        description: '移动应用开发业务线',
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'bl_data',
        name: '数据分析',
        code: 'DATA',
        weight: 0.3,
        description: '数据分析业务线',
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    for (const line of businessLines) {
      const existing = await this.findOne('business_lines', { code: line.code })
      if (!existing) {
        await this.insert('business_lines', line)
        console.log(`  ✅ 创建业务线: ${line.name}`)
      } else {
        console.log(`  ⏭️  业务线已存在: ${line.name}`)
      }
    }

    console.log('✅ 基础数据初始化完成')
  }

  // 初始化用户数据
  async initUsers() {
    console.log('👤 初始化测试用户数据...')

    const users = [
      {
        _id: 'user_admin',
        username: 'admin',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: admin123
        name: '系统管理员',
        email: 'admin@test.com',
        phone: '13800000001',
        roleId: 'role_admin',
        departmentId: null,
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'user_test',
        username: 'test',
        password: '$2b$10$E6BFd6e6oJHE2JbKX4sL4exTgO1eXW6/jRHX.J1qVm1XYfP3cTG5W', // password: 1234qwer
        name: '测试用户',
        email: 'test@test.com',
        phone: '13800000002',
        roleId: 'role_employee',
        departmentId: 'dept_tech',
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'user_test2',
        username: 'test2',
        password: '$2b$10$E6BFd6e6oJHE2JbKX4sL4exTgO1eXW6/jRHX.J1qVm1XYfP3cTG5W', // password: 1234qwer
        name: '测试用户2',
        email: 'test2@test.com',
        phone: '13800000003',
        roleId: 'role_employee',
        departmentId: 'dept_product',
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'user_manager',
        username: 'manager',
        password: '$2b$10$E6BFd6e6oJHE2JbKX4sL4exTgO1eXW6/jRHX.J1qVm1XYfP3cTG5W', // password: 1234qwer
        name: '项目经理',
        email: 'manager@test.com',
        phone: '13800000004',
        roleId: 'role_manager',
        departmentId: 'dept_tech',
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    for (const user of users) {
      const existing = await this.findOne('users', { username: user.username })
      if (!existing) {
        await this.insert('users', user)
        console.log(`  ✅ 创建用户: ${user.username} (${user.name})`)
      } else {
        console.log(`  ⏭️  用户已存在: ${user.username} (${user.name})`)
      }
    }

    console.log('✅ 用户数据初始化完成')
  }

  // 初始化员工数据
  async initEmployees() {
    console.log('👨‍💼 初始化员工数据...')

    const employees = [
      {
        _id: 'emp_admin',
        employeeNo: 'EMP001',
        name: '系统管理员',
        departmentId: 'dept_tech',
        positionId: 'pos_dev_senior',
        annualSalary: 300000,
        entryDate: '2023-01-01',
        status: 1,
        userId: 'user_admin',
        phone: '13800000001',
        email: 'admin@test.com',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'emp_test',
        employeeNo: 'EMP002',
        name: '测试用户',
        departmentId: 'dept_tech',
        positionId: 'pos_dev_mid',
        annualSalary: 150000,
        entryDate: '2023-06-01',
        status: 1,
        userId: 'user_test',
        phone: '13800000002',
        email: 'test@test.com',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'emp_test2',
        employeeNo: 'EMP003',
        name: '测试用户2',
        departmentId: 'dept_product',
        positionId: 'pos_pm',
        annualSalary: 180000,
        entryDate: '2023-03-01',
        status: 1,
        userId: 'user_test2',
        phone: '13800000003',
        email: 'test2@test.com',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'emp_manager',
        employeeNo: 'EMP004',
        name: '项目经理',
        departmentId: 'dept_tech',
        positionId: 'pos_dev_senior',
        annualSalary: 250000,
        entryDate: '2022-01-01',
        status: 1,
        userId: 'user_manager',
        phone: '13800000004',
        email: 'manager@test.com',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'emp_tester',
        employeeNo: 'EMP005',
        name: '测试工程师',
        departmentId: 'dept_qa',
        positionId: 'pos_tester',
        annualSalary: 120000,
        entryDate: '2023-08-01',
        status: 1,
        userId: null, // 没有关联用户账号
        phone: '13800000005',
        email: 'tester@test.com',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    for (const employee of employees) {
      const existing = await this.findOne('employees', { employeeNo: employee.employeeNo })
      if (!existing) {
        await this.insert('employees', employee)
        console.log(`  ✅ 创建员工: ${employee.name} (${employee.employeeNo})`)
      } else {
        console.log(`  ⏭️  员工已存在: ${employee.name} (${employee.employeeNo})`)
      }
    }

    console.log('✅ 员工数据初始化完成')
  }

  // 初始化项目数据
  async initProjects() {
    console.log('🚀 初始化项目数据...')

    const projects = [
      {
        _id: 'proj_web_platform',
        name: 'Web管理平台',
        code: 'WEB001',
        description: 'Web端管理平台开发项目',
        managerId: 'emp_manager',
        startDate: '2024-01-01',
        endDate: '2024-06-30',
        budget: 500000,
        profitTarget: 100000,
        status: 'active',
        priority: 'high',
        createdBy: 'user_admin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'proj_mobile_app',
        name: '移动应用开发',
        code: 'MOB001',
        description: '移动端应用开发项目',
        managerId: 'emp_manager',
        startDate: '2024-02-01',
        endDate: '2024-08-31',
        budget: 800000,
        profitTarget: 150000,
        status: 'planning',
        priority: 'medium',
        createdBy: 'user_admin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'proj_data_analysis',
        name: '数据分析系统',
        code: 'DATA001',
        description: '大数据分析系统开发',
        managerId: 'emp_admin',
        startDate: '2024-03-01',
        endDate: '2024-12-31',
        budget: 1200000,
        profitTarget: 300000,
        status: 'active',
        priority: 'critical',
        createdBy: 'user_admin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'proj_maintenance',
        name: '系统维护项目',
        code: 'MAINT001',
        description: '已完成的系统维护项目',
        managerId: 'emp_admin',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        budget: 200000,
        profitTarget: 50000,
        status: 'completed',
        priority: 'low',
        createdBy: 'user_admin',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date()
      }
    ]

    for (const project of projects) {
      const existing = await this.findOne('projects', { code: project.code })
      if (!existing) {
        await this.insert('projects', project)
        console.log(`  ✅ 创建项目: ${project.name} (${project.code}) - 状态: ${project.status}`)
      } else {
        console.log(`  ⏭️  项目已存在: ${project.name} (${project.code})`)
      }
    }

    console.log('✅ 项目数据初始化完成')
  }

  // 初始化项目角色数据
  async initProjectRoles() {
    console.log('👔 初始化项目角色数据...')

    const projectRoles = [
      {
        _id: 'proj_role_lead',
        name: '技术负责人',
        code: 'TECH_LEAD',
        description: '项目技术负责人',
        defaultWeight: 1.5,
        responsibilities: ['技术架构设计', '代码审查', '技术难题解决'],
        requiredSkills: ['高级编程技能', '架构设计经验', '团队协作'],
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'proj_role_dev',
        name: '开发工程师',
        code: 'DEVELOPER',
        description: '项目开发工程师',
        defaultWeight: 1.0,
        responsibilities: ['功能开发', '单元测试', '文档编写'],
        requiredSkills: ['编程技能', '调试技能'],
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'proj_role_tester',
        name: '测试工程师',
        code: 'TESTER',
        description: '项目测试工程师',
        defaultWeight: 0.8,
        responsibilities: ['测试用例设计', '功能测试', '缺陷跟踪'],
        requiredSkills: ['测试技能', '自动化测试'],
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'proj_role_pm',
        name: '产品经理',
        code: 'PM',
        description: '产品经理',
        defaultWeight: 1.2,
        responsibilities: ['需求分析', '产品设计', '项目协调'],
        requiredSkills: ['产品设计', '沟通协调', '需求分析'],
        status: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    for (const role of projectRoles) {
      const existing = await this.findOne('project_roles', { code: role.code })
      if (!existing) {
        await this.insert('project_roles', role)
        console.log(`  ✅ 创建项目角色: ${role.name}`)
      } else {
        console.log(`  ⏭️  项目角色已存在: ${role.name}`)
      }
    }

    console.log('✅ 项目角色数据初始化完成')
  }

  // 初始化项目成员数据（模拟已有的项目成员）
  async initProjectMembers() {
    console.log('👥 初始化项目成员数据...')

    // 注意：test 和 test2 用户不会在这里被添加到任何项目，确保他们可以申请项目
    const projectMembers = [
      {
        _id: 'pm_001',
        projectId: 'proj_web_platform',
        employeeId: 'emp_manager',
        roleId: 'proj_role_lead',
        status: 'approved',
        joinDate: '2024-01-01',
        contributionWeight: 1.5,
        applyReason: '作为项目经理管理该项目',
        approvedBy: 'user_admin',
        approvedAt: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        _id: 'pm_002',
        projectId: 'proj_data_analysis',
        employeeId: 'emp_admin',
        roleId: 'proj_role_lead',
        status: 'approved',
        joinDate: '2024-03-01',
        contributionWeight: 1.5,
        applyReason: '技术负责人',
        approvedBy: 'user_admin',
        approvedAt: new Date('2024-03-01'),
        createdAt: new Date('2024-03-01'),
        updatedAt: new Date('2024-03-01')
      },
      {
        _id: 'pm_003',
        projectId: 'proj_data_analysis',
        employeeId: 'emp_tester',
        roleId: 'proj_role_tester',
        status: 'approved',
        joinDate: '2024-03-15',
        contributionWeight: 0.8,
        applyReason: '负责项目测试工作',
        approvedBy: 'user_admin',
        approvedAt: new Date('2024-03-15'),
        createdAt: new Date('2024-03-15'),
        updatedAt: new Date('2024-03-15')
      }
    ]

    for (const member of projectMembers) {
      const existing = await this.findOne('project_members', { 
        projectId: member.projectId, 
        employeeId: member.employeeId 
      })
      if (!existing) {
        await this.insert('project_members', member)
        console.log(`  ✅ 添加项目成员: ${member.employeeId} -> ${member.projectId}`)
      } else {
        console.log(`  ⏭️  项目成员已存在: ${member.employeeId} -> ${member.projectId}`)
      }
    }

    console.log('✅ 项目成员数据初始化完成')
  }

  // 运行完整初始化
  async run() {
    try {
      console.log('🎯 开始初始化测试数据...')
      
      await this.initDatabases()
      await this.initBasicData()
      await this.initUsers()
      await this.initEmployees()
      await this.initProjects()
      await this.initProjectRoles()
      await this.initProjectMembers()

      console.log('')
      console.log('🎉 测试数据初始化完成!')
      console.log('')
      console.log('📋 测试账号信息:')
      console.log('  管理员: admin / admin123')
      console.log('  测试用户1: test / 1234qwer (可申请项目)')
      console.log('  测试用户2: test2 / 1234qwer (可申请项目)')
      console.log('  项目经理: manager / 1234qwer')
      console.log('')
      console.log('🚀 可申请的项目:')
      console.log('  1. Web管理平台 (WEB001) - 状态: active')
      console.log('  2. 移动应用开发 (MOB001) - 状态: planning')
      console.log('  3. 数据分析系统 (DATA001) - 状态: active')
      console.log('')
      console.log('✅ 可以在 localhost:3002 上开始测试!')

    } catch (error) {
      console.error('❌ 测试数据初始化失败:', error)
      process.exit(1)
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const initializer = new TestDataInitializer()
  initializer.run()
}

module.exports = TestDataInitializer