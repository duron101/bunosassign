#!/usr/bin/env node

/**
 * 基础管理数据初始化脚本
 * 根据用户要求初始化30人规模的完整组织架构
 */

const fs = require('fs');
const path = require('path');

// 数据库文件路径
const DB_PATH = path.join(__dirname, '../database/bonus_system.json');

// 读取当前数据库
function loadDatabase() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('读取数据库文件失败:', error);
    process.exit(1);
  }
}

// 保存数据库
function saveDatabase(database) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(database, null, 2), 'utf8');
    console.log('✅ 数据库已保存');
  } catch (error) {
    console.error('保存数据库文件失败:', error);
    process.exit(1);
  }
}

// 生成新的ID
function getNextId(database, tableName) {
  if (!database.nextId) {
    database.nextId = {};
  }
  if (!database.nextId[tableName]) {
    database.nextId[tableName] = 1;
  }
  return database.nextId[tableName]++;
}

// 初始化业务线数据
function initBusinessLines(database) {
  console.log('🔄 初始化业务线数据...');
  
  database.data.businessLines = [
    {
      id: getNextId(database, 'businessLines'),
      name: '产品研发线',
      code: 'PRODUCT',
      description: '产品开发与优化',
      weight: 0.30,
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'businessLines'),
      name: '项目实施线',
      code: 'IMPLEMENTATION',
      description: '项目交付实施',
      weight: 0.35,
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'businessLines'),
      name: '市场工程线',
      code: 'MARKETING_ENG',
      description: '售前支持、市场推广、技术支持',
      weight: 0.25,
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'businessLines'),
      name: '运营支持线',
      code: 'OPERATION',
      description: '内部运营管理',
      weight: 0.10,
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  
  console.log('✅ 业务线数据初始化完成，共', database.data.businessLines.length, '条');
}

// 初始化部门数据
function initDepartments(database) {
  console.log('🔄 初始化部门数据...');
  
  database.data.departments = [
    {
      id: getNextId(database, 'departments'),
      name: '产品部',
      code: 'PRODUCT',
      description: '产品规划、设计、研发、优化',
      businessLineId: 1, // 产品研发线
      managerId: null,
      parentId: null,
      status: 1,
      sort: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'departments'),
      name: '项目实施一部',
      code: 'IMPL_01',
      description: '客户项目交付实施',
      businessLineId: 2, // 项目实施线
      managerId: null,
      parentId: null,
      status: 1,
      sort: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'departments'),
      name: '项目实施二部',
      code: 'IMPL_02',
      description: '客户项目交付实施',
      businessLineId: 2, // 项目实施线
      managerId: null,
      parentId: null,
      status: 1,
      sort: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'departments'),
      name: '市场工程部',
      code: 'MARKETING_ENG',
      description: '售前支持、市场推广、技术支持',
      businessLineId: 3, // 市场工程线
      managerId: null,
      parentId: null,
      status: 1,
      sort: 4,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'departments'),
      name: '商务部',
      code: 'BUSINESS',
      description: '商务拓展与合作',
      businessLineId: 3, // 市场工程线
      managerId: null,
      parentId: null,
      status: 1,
      sort: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'departments'),
      name: '综合管理部',
      code: 'ADMINISTRATION',
      description: '财务、人事、行政管理',
      businessLineId: 4, // 运营支持线
      managerId: null,
      parentId: null,
      status: 1,
      sort: 6,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  
  console.log('✅ 部门数据初始化完成，共', database.data.departments.length, '个部门');
}

// 初始化岗位数据
function initPositions(database) {
  console.log('🔄 初始化岗位数据...');
  
  database.data.positions = [
    // 高层管理
    {
      id: getNextId(database, 'positions'),
      name: '总经理',
      code: 'CEO',
      level: 'M4',
      benchmarkValue: 1.5,
      description: '公司全面管理，重点监管市场部',
      responsibilities: ['战略决策', '团队管理', '业务监督'],
      requirements: ['MBA学历', '10年以上管理经验'],
      status: 1,
      createdBy: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    
    // 产品部岗位
    {
      id: getNextId(database, 'positions'),
      name: '产品总监',
      code: 'PRODUCT_DIRECTOR',
      level: 'M3',
      benchmarkValue: 1.3,
      description: '产品规划与团队管理',
      responsibilities: ['产品战略规划', '团队管理', '需求分析'],
      requirements: ['本科以上学历', '5年以上产品经验'],
      status: 1,
      createdBy: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'positions'),
      name: '高级产品经理',
      code: 'SR_PRODUCT_MANAGER',
      level: 'P6',
      benchmarkValue: 1.0,
      description: '核心产品设计与优化',
      responsibilities: ['产品设计', '用户研究', '需求分析'],
      requirements: ['本科以上学历', '3年以上产品经验'],
      status: 1,
      createdBy: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'positions'),
      name: '产品经理',
      code: 'PRODUCT_MANAGER',
      level: 'P5',
      benchmarkValue: 0.8,
      description: '产品功能设计与迭代',
      responsibilities: ['功能设计', '用户体验', '产品测试'],
      requirements: ['本科以上学历', '2年以上产品经验'],
      status: 1,
      createdBy: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'positions'),
      name: '产品专员',
      code: 'PRODUCT_SPECIALIST',
      level: 'P4',
      benchmarkValue: 0.6,
      description: '产品执行与协调',
      responsibilities: ['需求收集', '产品测试', '文档编写'],
      requirements: ['本科学历', '1年以上相关经验'],
      status: 1,
      createdBy: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    
    // 项目实施岗位
    {
      id: getNextId(database, 'positions'),
      name: '实施总监',
      code: 'IMPL_DIRECTOR',
      level: 'M3',
      benchmarkValue: 1.2,
      description: '实施团队管理与项目监督',
      responsibilities: ['团队管理', '项目监督', '客户关系'],
      requirements: ['本科以上学历', '5年以上项目管理经验'],
      status: 1,
      createdBy: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'positions'),
      name: '项目经理',
      code: 'PROJECT_MANAGER',
      level: 'M1',
      benchmarkValue: 0.9,
      description: '项目管理与团队协调',
      responsibilities: ['项目管理', '团队协调', '客户沟通'],
      requirements: ['本科学历', '3年以上项目经验'],
      status: 1,
      createdBy: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'positions'),
      name: '部门经理',
      code: 'DEPT_MANAGER',
      level: 'M2',
      benchmarkValue: 1.1,
      description: '部门管理与业务统筹',
      responsibilities: ['部门管理', '业务统筹', '团队建设'],
      requirements: ['本科以上学历', '4年以上管理经验'],
      status: 1,
      createdBy: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'positions'),
      name: '高级实施顾问',
      code: 'SR_IMPL_CONSULTANT',
      level: 'P5',
      benchmarkValue: 0.8,
      description: '复杂项目实施与技术指导',
      responsibilities: ['项目实施', '技术指导', '方案设计'],
      requirements: ['本科学历', '3年以上实施经验'],
      status: 1,
      createdBy: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'positions'),
      name: '实施顾问',
      code: 'IMPL_CONSULTANT',
      level: 'P4',
      benchmarkValue: 0.6,
      description: '项目实施与配置',
      responsibilities: ['系统配置', '用户培训', '问题解决'],
      requirements: ['本科学历', '1年以上实施经验'],
      status: 1,
      createdBy: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'positions'),
      name: '初级实施顾问',
      code: 'JR_IMPL_CONSULTANT',
      level: 'P3',
      benchmarkValue: 0.4,
      description: '基础实施与支持',
      responsibilities: ['基础配置', '文档整理', '辅助实施'],
      requirements: ['大专以上学历', '计算机相关专业'],
      status: 1,
      createdBy: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    
    // 市场工程部岗位
    {
      id: getNextId(database, 'positions'),
      name: '市场工程总监',
      code: 'MARKETING_ENG_DIRECTOR',
      level: 'M3',
      benchmarkValue: 1.2,
      description: '市场工程团队管理',
      responsibilities: ['团队管理', '业务规划', '客户关系'],
      requirements: ['本科以上学历', '5年以上市场经验'],
      status: 1,
      createdBy: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'positions'),
      name: '高级售前顾问',
      code: 'SR_PRESALE_CONSULTANT',
      level: 'P5',
      benchmarkValue: 0.8,
      description: '售前技术支持与方案设计',
      responsibilities: ['技术交流', '方案设计', '演示讲解'],
      requirements: ['本科学历', '3年以上售前经验'],
      status: 1,
      createdBy: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'positions'),
      name: '售前顾问',
      code: 'PRESALE_CONSULTANT',
      level: 'P4',
      benchmarkValue: 0.6,
      description: '售前支持与客户沟通',
      responsibilities: ['客户沟通', '需求调研', '方案协助'],
      requirements: ['本科学历', '1年以上售前经验'],
      status: 1,
      createdBy: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'positions'),
      name: '市场专员',
      code: 'MARKETING_SPECIALIST',
      level: 'P4',
      benchmarkValue: 0.6,
      description: '市场推广与品牌建设',
      responsibilities: ['市场推广', '品牌宣传', '活动策划'],
      requirements: ['本科学历', '市场营销相关专业'],
      status: 1,
      createdBy: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'positions'),
      name: '技术支持专员',
      code: 'TECH_SUPPORT_SPECIALIST',
      level: 'P4',
      benchmarkValue: 0.6,
      description: '技术支持与运维保障',
      responsibilities: ['技术支持', '系统运维', '问题处理'],
      requirements: ['本科学历', '计算机相关专业'],
      status: 1,
      createdBy: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    
    // 商务部岗位
    {
      id: getNextId(database, 'positions'),
      name: '商务经理',
      code: 'BUSINESS_MANAGER',
      level: 'M1',
      benchmarkValue: 0.9,
      description: '商务拓展与合作管理',
      responsibilities: ['商务拓展', '合作谈判', '渠道管理'],
      requirements: ['本科学历', '3年以上商务经验'],
      status: 1,
      createdBy: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    
    // 综合管理部岗位
    {
      id: getNextId(database, 'positions'),
      name: '财务经理',
      code: 'FINANCE_MANAGER',
      level: 'M1',
      benchmarkValue: 0.8,
      description: '财务管理与成本控制',
      responsibilities: ['财务管理', '成本控制', '报表分析'],
      requirements: ['财务相关专业', '3年以上财务经验'],
      status: 1,
      createdBy: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'positions'),
      name: '人事行政专员',
      code: 'HR_ADMIN_SPECIALIST',
      level: 'P4',
      benchmarkValue: 0.5,
      description: '人事行政管理',
      responsibilities: ['人事管理', '行政事务', '制度建设'],
      requirements: ['本科学历', '人力资源相关专业'],
      status: 1,
      createdBy: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  
  console.log('✅ 岗位数据初始化完成，共', database.data.positions.length, '个岗位');
}

// 初始化员工数据
function initEmployees(database) {
  console.log('🔄 初始化员工数据...');
  
  database.data.employees = [
    // 高层管理（1人）
    {
      id: getNextId(database, 'employees'),
      employeeNo: 'CEO001',
      name: '张总经理',
      departmentId: 4, // 市场工程部（总经理监管市场）
      positionId: 1, // 总经理
      annualSalary: 500000,
      entryDate: '2020-01-01',
      phone: '13800000001',
      email: 'ceo@company.com',
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    
    // 产品部（4人）
    {
      id: getNextId(database, 'employees'),
      employeeNo: 'PD001',
      name: '李产品总监',
      departmentId: 1,
      positionId: 2, // 产品总监
      annualSalary: 400000,
      entryDate: '2020-03-01',
      phone: '13800000002',
      email: 'li.pd@company.com',
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'employees'),
      employeeNo: 'PD002',
      name: '王高级产品经理',
      departmentId: 1,
      positionId: 3, // 高级产品经理
      annualSalary: 300000,
      entryDate: '2021-01-15',
      phone: '13800000003',
      email: 'wang.pm@company.com',
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'employees'),
      employeeNo: 'PD003',
      name: '陈产品经理',
      departmentId: 1,
      positionId: 4, // 产品经理
      annualSalary: 250000,
      entryDate: '2021-06-01',
      phone: '13800000004',
      email: 'chen.pm@company.com',
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'employees'),
      employeeNo: 'PD004',
      name: '刘产品专员',
      departmentId: 1,
      positionId: 5, // 产品专员
      annualSalary: 180000,
      entryDate: '2022-03-01',
      phone: '13800000005',
      email: 'liu.ps@company.com',
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    
    // 项目实施一部（8人）
    {
      id: getNextId(database, 'employees'),
      employeeNo: 'IMPL001',
      name: '张实施总监',
      departmentId: 2,
      positionId: 6, // 实施总监
      annualSalary: 350000,
      entryDate: '2020-02-01',
      phone: '13800000006',
      email: 'zhang.id@company.com',
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'employees'),
      employeeNo: 'IMPL002',
      name: '李项目经理',
      departmentId: 2,
      positionId: 7, // 项目经理
      annualSalary: 250000,
      entryDate: '2020-08-01',
      phone: '13800000007',
      email: 'li.pm1@company.com',
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'employees'),
      employeeNo: 'IMPL003',
      name: '王项目经理',
      departmentId: 2,
      positionId: 7, // 项目经理
      annualSalary: 250000,
      entryDate: '2021-01-01',
      phone: '13800000008',
      email: 'wang.pm1@company.com',
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'employees'),
      employeeNo: 'IMPL004',
      name: '陈高级实施顾问',
      departmentId: 2,
      positionId: 9, // 高级实施顾问
      annualSalary: 220000,
      entryDate: '2020-10-01',
      phone: '13800000009',
      email: 'chen.sc1@company.com',
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'employees'),
      employeeNo: 'IMPL005',
      name: '刘高级实施顾问',
      departmentId: 2,
      positionId: 9, // 高级实施顾问
      annualSalary: 220000,
      entryDate: '2021-03-01',
      phone: '13800000010',
      email: 'liu.sc1@company.com',
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'employees'),
      employeeNo: 'IMPL006',
      name: '赵实施顾问',
      departmentId: 2,
      positionId: 10, // 实施顾问
      annualSalary: 180000,
      entryDate: '2021-08-01',
      phone: '13800000011',
      email: 'zhao.ic1@company.com',
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'employees'),
      employeeNo: 'IMPL007',
      name: '孙实施顾问',
      departmentId: 2,
      positionId: 10, // 实施顾问
      annualSalary: 180000,
      entryDate: '2022-01-01',
      phone: '13800000012',
      email: 'sun.ic1@company.com',
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'employees'),
      employeeNo: 'IMPL008',
      name: '周初级实施顾问',
      departmentId: 2,
      positionId: 11, // 初级实施顾问
      annualSalary: 120000,
      entryDate: '2022-06-01',
      phone: '13800000013',
      email: 'zhou.jic1@company.com',
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    
    // 项目实施二部（7人）
    {
      id: getNextId(database, 'employees'),
      employeeNo: 'IMPL009',
      name: '吴部门经理',
      departmentId: 3,
      positionId: 8, // 部门经理
      annualSalary: 300000,
      entryDate: '2020-05-01',
      phone: '13800000014',
      email: 'wu.dm@company.com',
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'employees'),
      employeeNo: 'IMPL010',
      name: '郑项目经理',
      departmentId: 3,
      positionId: 7, // 项目经理
      annualSalary: 250000,
      entryDate: '2021-02-01',
      phone: '13800000015',
      email: 'zheng.pm2@company.com',
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'employees'),
      employeeNo: 'IMPL011',
      name: '冯高级实施顾问',
      departmentId: 3,
      positionId: 9, // 高级实施顾问
      annualSalary: 220000,
      entryDate: '2020-11-01',
      phone: '13800000016',
      email: 'feng.sc2@company.com',
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'employees'),
      employeeNo: 'IMPL012',
      name: '卫高级实施顾问',
      departmentId: 3,
      positionId: 9, // 高级实施顾问
      annualSalary: 220000,
      entryDate: '2021-04-01',
      phone: '13800000017',
      email: 'wei.sc2@company.com',
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'employees'),
      employeeNo: 'IMPL013',
      name: '蒋实施顾问',
      departmentId: 3,
      positionId: 10, // 实施顾问
      annualSalary: 180000,
      entryDate: '2021-09-01',
      phone: '13800000018',
      email: 'jiang.ic2@company.com',
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'employees'),
      employeeNo: 'IMPL014',
      name: '韩实施顾问',
      departmentId: 3,
      positionId: 10, // 实施顾问
      annualSalary: 180000,
      entryDate: '2022-02-01',
      phone: '13800000019',
      email: 'han.ic2@company.com',
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'employees'),
      employeeNo: 'IMPL015',
      name: '杨初级实施顾问',
      departmentId: 3,
      positionId: 11, // 初级实施顾问
      annualSalary: 120000,
      entryDate: '2022-07-01',
      phone: '13800000020',
      email: 'yang.jic2@company.com',
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    
    // 市场工程部（5人）
    {
      id: getNextId(database, 'employees'),
      employeeNo: 'MKT001',
      name: '朱市场工程总监',
      departmentId: 4,
      positionId: 12, // 市场工程总监
      annualSalary: 350000,
      entryDate: '2020-04-01',
      phone: '13800000021',
      email: 'zhu.med@company.com',
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'employees'),
      employeeNo: 'MKT002',
      name: '秦高级售前顾问',
      departmentId: 4,
      positionId: 13, // 高级售前顾问
      annualSalary: 240000,
      entryDate: '2020-09-01',
      phone: '13800000022',
      email: 'qin.spc@company.com',
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'employees'),
      employeeNo: 'MKT003',
      name: '尤售前顾问',
      departmentId: 4,
      positionId: 14, // 售前顾问
      annualSalary: 180000,
      entryDate: '2021-05-01',
      phone: '13800000023',
      email: 'you.pc@company.com',
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'employees'),
      employeeNo: 'MKT004',
      name: '许市场专员',
      departmentId: 4,
      positionId: 15, // 市场专员
      annualSalary: 160000,
      entryDate: '2021-10-01',
      phone: '13800000024',
      email: 'xu.ms@company.com',
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'employees'),
      employeeNo: 'MKT005',
      name: '何技术支持专员',
      departmentId: 4,
      positionId: 16, // 技术支持专员
      annualSalary: 180000,
      entryDate: '2022-01-15',
      phone: '13800000025',
      email: 'he.tss@company.com',
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    
    // 商务部（1人）
    {
      id: getNextId(database, 'employees'),
      employeeNo: 'BIZ001',
      name: '吕商务经理',
      departmentId: 5,
      positionId: 17, // 商务经理
      annualSalary: 250000,
      entryDate: '2020-12-01',
      phone: '13800000026',
      email: 'lv.bm@company.com',
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    
    // 综合管理部（2人）
    {
      id: getNextId(database, 'employees'),
      employeeNo: 'ADM001',
      name: '施财务经理',
      departmentId: 6,
      positionId: 18, // 财务经理
      annualSalary: 220000,
      entryDate: '2020-07-01',
      phone: '13800000027',
      email: 'shi.fm@company.com',
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: getNextId(database, 'employees'),
      employeeNo: 'ADM002',
      name: '张人事行政专员',
      departmentId: 6,
      positionId: 19, // 人事行政专员
      annualSalary: 150000,
      entryDate: '2021-11-01',
      phone: '13800000028',
      email: 'zhang.has@company.com',
      status: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  
  console.log('✅ 员工数据初始化完成，共', database.data.employees.length, '名员工');
}

// 主函数
function main() {
  console.log('🚀 开始初始化基础管理数据...');
  
  // 加载数据库
  const database = loadDatabase();
  
  // 清理现有数据
  console.log('🧹 清理现有数据...');
  database.data.businessLines = [];
  database.data.departments = [];
  database.data.positions = [];
  database.data.employees = [];
  
  // 重置nextId
  database.nextId = {
    users: database.nextId?.users || 2,
    roles: database.nextId?.roles || 4,
    businessLines: 1,
    departments: 1,
    positions: 1,
    employees: 1,
    projects: 1,
    bonusPools: 1,
    calculations: 1
  };
  
  // 初始化各类数据
  initBusinessLines(database);
  initDepartments(database);
  initPositions(database);
  initEmployees(database);
  
  // 保存数据库
  saveDatabase(database);
  
  console.log('');
  console.log('🎉 基础管理数据初始化完成！');
  console.log('📊 数据统计:');
  console.log(`   - 业务线: ${database.data.businessLines.length} 条`);
  console.log(`   - 部门: ${database.data.departments.length} 个`);
  console.log(`   - 岗位: ${database.data.positions.length} 个`);
  console.log(`   - 员工: ${database.data.employees.length} 人`);
  console.log('');
  console.log('🏢 组织架构:');
  console.log('   产品部: 4人 (产品研发线 30%)');
  console.log('   项目实施一部: 8人 (项目实施线 35%)');
  console.log('   项目实施二部: 7人');
  console.log('   市场工程部: 5人 (市场工程线 25%)');
  console.log('   商务部: 1人');
  console.log('   综合管理部: 2人 (运营支持线 10%)');
  console.log('   总经理: 1人');
  console.log('');
  console.log('✅ 现在可以在前端页面查看和管理这些数据了！');
}

// 执行初始化
if (require.main === module) {
  main();
}

module.exports = {
  main,
  initBusinessLines,
  initDepartments,
  initPositions,
  initEmployees
};