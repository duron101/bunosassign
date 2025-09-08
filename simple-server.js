const express = require('express');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const XLSX = require('xlsx');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 配置文件上传
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB限制
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('只允许上传Excel文件(.xlsx, .xls)'), false);
    }
  }
});

// 静态文件服务
app.use(express.static(path.join(__dirname, 'frontend/dist')));

// 基本API路由
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: '奖金模拟系统后端服务运行正常',
    timestamp: new Date().toISOString()
  });
});

// ========== 认证API ==========
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // 简单验证
  if (username === 'admin' && password === 'admin123') {
    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token: 'mock-jwt-token-' + Date.now(),
        user: {
          id: 1,
          username: 'admin',
          name: '管理员',
          role: 'admin'
        }
      }
    });
  } else {
    res.status(401).json({
      code: 401,
      message: '用户名或密码错误'
    });
  }
});

// ========== 员工管理API ==========
app.get('/api/employees', (req, res) => {
  res.json({
    code: 200,
    message: '获取成功',
    data: {
      list: [
        {
          id: 1,
          employeeNo: 'EMP001',
          name: '张三',
          departmentId: 1,
          departmentName: '技术部',
          positionId: 1,
          positionName: '高级工程师',
          annualSalary: 150000,
          entryDate: '2023-01-15',
          phone: '13800138001',
          email: 'zhangsan@company.com',
          status: 1
        },
        {
          id: 2,
          employeeNo: 'EMP002',
          name: '李四',
          departmentId: 2,
          departmentName: '市场部',
          positionId: 2,
          positionName: '市场经理',
          annualSalary: 120000,
          entryDate: '2023-03-20',
          phone: '13800138002',
          email: 'lisi@company.com',
          status: 1
        }
      ],
      total: 2,
      page: 1,
      pageSize: 10
    }
  });
});

app.post('/api/employees', (req, res) => {
  res.json({
    code: 200,
    message: '创建成功',
    data: { id: Date.now(), ...req.body }
  });
});

app.put('/api/employees/:id', (req, res) => {
  res.json({
    code: 200,
    message: '更新成功',
    data: { id: req.params.id, ...req.body }
  });
});

app.delete('/api/employees/:id', (req, res) => {
  res.json({
    code: 200,
    message: '删除成功',
    data: null
  });
});

// 下载员工导入模板
app.get('/api/employees/template', (req, res) => {
  try {
    // 创建Excel模板
    const workbook = XLSX.utils.book_new();
    
    // 定义模板数据
    const templateData = [
      {
        '员工编号': 'EMP001',
        '姓名': '张三',
        '部门ID': 1,
        '岗位ID': 1,
        '年薪': 150000,
        '入职日期': '2023-01-15',
        '手机号': '13800138001',
        '邮箱': 'zhangsan@company.com',
        '身份证号': '110101199001011234',
        '紧急联系人': '张父',
        '紧急联系电话': '13800138000',
        '地址': '北京市朝阳区'
      },
      {
        '员工编号': 'EMP002',
        '姓名': '李四',
        '部门ID': 2,
        '岗位ID': 2,
        '年薪': 120000,
        '入职日期': '2023-03-20',
        '手机号': '13800138002',
        '邮箱': 'lisi@company.com',
        '身份证号': '110101199002022345',
        '紧急联系人': '李母',
        '紧急联系电话': '13800138003',
        '地址': '北京市海淀区'
      }
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(workbook, worksheet, '员工信息');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="employee_template.xlsx"');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '模板生成失败: ' + error.message
    });
  }
});

// Excel文件上传解析
app.post('/api/employees/import', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        message: '请选择要上传的Excel文件'
      });
    }

    // 解析Excel文件
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return res.status(400).json({
        code: 400,
        message: 'Excel文件为空或格式不正确'
      });
    }

    // 数据验证和转换
    const employees = [];
    const errors = [];

    jsonData.forEach((row, index) => {
      const rowNum = index + 2; // Excel行号从2开始（第1行是标题）
      
      try {
        // 验证必填字段
        if (!row['员工编号']) {
          errors.push(`第${rowNum}行：员工编号不能为空`);
          return;
        }
        if (!row['姓名']) {
          errors.push(`第${rowNum}行：姓名不能为空`);
          return;
        }
        if (!row['部门ID']) {
          errors.push(`第${rowNum}行：部门ID不能为空`);
          return;
        }
        if (!row['岗位ID']) {
          errors.push(`第${rowNum}行：岗位ID不能为空`);
          return;
        }

        const employee = {
          employeeNo: row['员工编号'],
          name: row['姓名'],
          departmentId: parseInt(row['部门ID']),
          positionId: parseInt(row['岗位ID']),
          annualSalary: parseInt(row['年薪']) || 0,
          entryDate: row['入职日期'] || new Date().toISOString().split('T')[0],
          phone: row['手机号'] || '',
          email: row['邮箱'] || '',
          idCard: row['身份证号'] || '',
          emergencyContact: row['紧急联系人'] || '',
          emergencyPhone: row['紧急联系电话'] || '',
          address: row['地址'] || '',
          status: 1
        };

        employees.push(employee);
      } catch (error) {
        errors.push(`第${rowNum}行：数据格式错误 - ${error.message}`);
      }
    });

    if (errors.length > 0) {
      return res.status(400).json({
        code: 400,
        message: '数据验证失败',
        data: {
          errors,
          totalRows: jsonData.length,
          successCount: employees.length,
          errorCount: errors.length
        }
      });
    }

    // 模拟保存到数据库
    const savedEmployees = employees.map((emp, index) => ({
      id: Date.now() + index,
      ...emp,
      createTime: new Date().toISOString()
    }));

    res.json({
      code: 200,
      message: `成功导入${employees.length}名员工`,
      data: {
        imported: savedEmployees,
        totalCount: employees.length,
        successCount: employees.length,
        errorCount: 0
      }
    });

  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '导入失败: ' + error.message
    });
  }
});

// ========== 部门管理API ==========
app.get('/api/departments', (req, res) => {
  res.json({
    code: 200,
    message: '获取成功',
    data: [
      {
        id: 1,
        name: '技术部',
        code: 'TECH',
        description: '负责技术研发',
        managerId: 1,
        managerName: '张三',
        parentId: null,
        status: 1,
        employeeCount: 15,
        createTime: '2023-01-01'
      },
      {
        id: 2,
        name: '市场部',
        code: 'MARKET',
        description: '负责市场营销',
        managerId: 2,
        managerName: '李四',
        parentId: null,
        status: 1,
        employeeCount: 8,
        createTime: '2023-01-01'
      }
    ]
  });
});

app.post('/api/departments', (req, res) => {
  res.json({
    code: 200,
    message: '创建成功',
    data: { id: Date.now(), ...req.body }
  });
});

// ========== 岗位管理API ==========
app.get('/api/positions', (req, res) => {
  res.json({
    code: 200,
    message: '获取成功',
    data: [
      {
        id: 1,
        name: '高级工程师',
        code: 'SR_ENG',
        level: 'P6',
        departmentId: 1,
        departmentName: '技术部',
        salaryRange: '120000-180000',
        description: '负责核心技术开发',
        status: 1
      },
      {
        id: 2,
        name: '市场经理',
        code: 'MKT_MGR',
        level: 'M1',
        departmentId: 2,
        departmentName: '市场部',
        salaryRange: '100000-150000',
        description: '负责市场推广',
        status: 1
      }
    ]
  });
});

// ========== 业务线管理API ==========
app.get('/api/business-lines', (req, res) => {
  res.json({
    code: 200,
    message: '获取成功',
    data: [
      {
        id: 1,
        name: '核心业务线',
        code: 'CORE',
        description: '公司核心产品线',
        weight: 0.6,
        status: 1
      },
      {
        id: 2,
        name: '创新业务线',
        code: 'INNOVATION',
        description: '新兴产品线',
        weight: 0.4,
        status: 1
      }
    ]
  });
});

// ========== 奖金计算API ==========
app.get('/api/calculations', (req, res) => {
  res.json({
    code: 200,
    message: '获取成功',
    data: {
      totalProfit: 5000000,
      totalBonus: 500000,
      calculatedCount: 25,
      lastCalculateTime: '2024-01-15 14:30:00',
      results: [
        {
          employeeId: 1,
          employeeName: '张三',
          departmentName: '技术部',
          profitContribution: 15000,
          positionValue: 12000,
          performanceBonus: 8000,
          totalBonus: 35000
        }
      ]
    }
  });
});

app.post('/api/calculations/execute', (req, res) => {
  res.json({
    code: 200,
    message: '计算完成',
    data: {
      calculationId: Date.now(),
      totalEmployees: 25,
      totalBonus: 500000,
      completedAt: new Date().toISOString()
    }
  });
});

// ========== 模拟分析API ==========
app.get('/api/simulations', (req, res) => {
  res.json({
    code: 200,
    message: '获取成功',
    data: [
      {
        id: 1,
        name: '2024年Q1模拟',
        description: '第一季度奖金分配模拟',
        parameters: {
          profitWeight: 0.4,
          positionWeight: 0.3,
          performanceWeight: 0.3
        },
        results: {
          totalBonus: 480000,
          avgBonus: 19200,
          maxBonus: 45000,
          minBonus: 8000
        },
        status: 'completed',
        createTime: '2024-01-10'
      }
    ]
  });
});

// ========== 系统配置API ==========
app.get('/api/system/config', (req, res) => {
  res.json({
    code: 200,
    message: '获取成功',
    data: {
      basic: {
        systemName: '奖金模拟系统',
        version: '1.0.0',
        company: '示例公司'
      },
      bonus: {
        profitRatio: 0.1,
        minBonus: 5000,
        maxBonus: 100000
      },
      calculation: {
        profitWeight: 0.4,
        positionWeight: 0.3,
        performanceWeight: 0.3
      }
    }
  });
});

app.post('/api/system/config', (req, res) => {
  res.json({
    code: 200,
    message: '配置保存成功',
    data: req.body
  });
});

// ========== 用户管理API ==========
// 模拟用户数据存储
let users = [
  {
    id: 1,
    username: 'admin',
    name: '系统管理员',
    email: 'admin@company.com',
    roleId: 1,
    roleName: '系统管理员',
    phone: '13800138000',
    status: 1,
    createTime: '2023-01-01'
  }
];

// 获取用户列表
app.get('/api/users', (req, res) => {
  const { search, status, roleId } = req.query;
  let filteredUsers = [...users];

  // 搜索过滤
  if (search) {
    filteredUsers = filteredUsers.filter(user => 
      user.username.includes(search) || 
      user.name.includes(search) || 
      user.email.includes(search)
    );
  }

  // 状态过滤
  if (status !== undefined && status !== '') {
    filteredUsers = filteredUsers.filter(user => user.status === parseInt(status));
  }

  // 角色过滤
  if (roleId !== undefined && roleId !== '') {
    filteredUsers = filteredUsers.filter(user => user.roleId === parseInt(roleId));
  }

  res.json({
    code: 200,
    message: '获取成功',
    data: {
      users: filteredUsers,
      pagination: {
        total: filteredUsers.length,
        page: 1,
        pageSize: 20
      }
    }
  });
});

// 创建用户
app.post('/api/users', (req, res) => {
  try {
    const { username, name, email, phone, roleId, password } = req.body;

    // 验证必填字段
    if (!username) {
      return res.status(400).json({
        code: 400,
        message: '用户名不能为空'
      });
    }

    if (!name) {
      return res.status(400).json({
        code: 400,
        message: '姓名不能为空'
      });
    }

    if (!email) {
      return res.status(400).json({
        code: 400,
        message: '邮箱不能为空'
      });
    }

    if (!roleId) {
      return res.status(400).json({
        code: 400,
        message: '角色不能为空'
      });
    }

    // 检查用户名是否重复
    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
      return res.status(400).json({
        code: 400,
        message: '用户名已存在'
      });
    }

    // 检查邮箱是否重复
    const existingEmail = users.find(user => user.email === email);
    if (existingEmail) {
      return res.status(400).json({
        code: 400,
        message: '邮箱已存在'
      });
    }

    // 获取角色名称
    const role = roles.find(r => r.id === roleId);
    const roleName = role ? role.name : '未知角色';

    const newUser = {
      id: Math.max(...users.map(u => u.id)) + 1,
      username,
      name,
      email,
      phone: phone || '',
      roleId,
      roleName,
      status: 1,
      createTime: new Date().toISOString().split('T')[0]
    };

    users.push(newUser);

    res.json({
      code: 200,
      message: '用户创建成功',
      data: newUser
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '用户创建失败: ' + error.message
    });
  }
});

// 更新用户
app.put('/api/users/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { username, name, email, phone, roleId, status } = req.body;

    const userIndex = users.findIndex(user => user.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 验证必填字段
    if (!username) {
      return res.status(400).json({
        code: 400,
        message: '用户名不能为空'
      });
    }

    if (!name) {
      return res.status(400).json({
        code: 400,
        message: '姓名不能为空'
      });
    }

    if (!email) {
      return res.status(400).json({
        code: 400,
        message: '邮箱不能为空'
      });
    }

    // 检查用户名是否重复（排除当前用户）
    const existingUser = users.find(user => user.username === username && user.id !== userId);
    if (existingUser) {
      return res.status(400).json({
        code: 400,
        message: '用户名已存在'
      });
    }

    // 检查邮箱是否重复（排除当前用户）
    const existingEmail = users.find(user => user.email === email && user.id !== userId);
    if (existingEmail) {
      return res.status(400).json({
        code: 400,
        message: '邮箱已存在'
      });
    }

    // 获取角色名称
    const role = roles.find(r => r.id === roleId);
    const roleName = role ? role.name : '未知角色';

    // 更新用户信息
    users[userIndex] = {
      ...users[userIndex],
      username,
      name,
      email,
      phone: phone || '',
      roleId: roleId || users[userIndex].roleId,
      roleName,
      status: status !== undefined ? status : users[userIndex].status,
      updateTime: new Date().toISOString().split('T')[0]
    };

    res.json({
      code: 200,
      message: '用户更新成功',
      data: users[userIndex]
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '用户更新失败: ' + error.message
    });
  }
});

// 删除用户
app.delete('/api/users/:id', (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // 不允许删除系统管理员
    if (userId === 1) {
      return res.status(400).json({
        code: 400,
        message: '系统管理员不允许删除'
      });
    }

    const userIndex = users.findIndex(user => user.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    users.splice(userIndex, 1);

    res.json({
      code: 200,
      message: '用户删除成功',
      data: null
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '用户删除失败: ' + error.message
    });
  }
});

// 批量操作用户
app.post('/api/users/batch', (req, res) => {
  try {
    const { action, userIds } = req.body;

    if (!action || !userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        code: 400,
        message: '参数错误'
      });
    }

    let successCount = 0;
    const errors = [];

    userIds.forEach(userId => {
      const userIndex = users.findIndex(user => user.id === userId);
      if (userIndex === -1) {
        errors.push(`用户ID ${userId} 不存在`);
        return;
      }

      switch (action) {
        case 'enable':
          users[userIndex].status = 1;
          successCount++;
          break;
        case 'disable':
          if (userId === 1) {
            errors.push('系统管理员不允许禁用');
          } else {
            users[userIndex].status = 0;
            successCount++;
          }
          break;
        default:
          errors.push(`不支持的操作: ${action}`);
      }
    });

    res.json({
      code: 200,
      message: `批量${action === 'enable' ? '启用' : '禁用'}完成`,
      data: {
        successCount,
        errorCount: errors.length,
        errors
      }
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '批量操作失败: ' + error.message
    });
  }
});

// 重置用户密码
app.post('/api/users/:id/reset-password', (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    const userIndex = users.findIndex(user => user.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    // 模拟重置密码为默认密码
    const defaultPassword = '123456';

    res.json({
      code: 200,
      message: '密码重置成功',
      data: {
        newPassword: defaultPassword
      }
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '密码重置失败: ' + error.message
    });
  }
});

// ========== 角色管理API ==========
// 模拟角色数据存储
let roles = [
  {
    id: 1,
    name: '系统管理员',
    code: 'admin',
    description: '拥有所有权限',
    permissions: ['*'],
    status: 1,
    createTime: '2023-01-01'
  },
  {
    id: 2,
    name: 'HR管理员',
    code: 'hr',
    description: '人事管理权限',
    permissions: ['employee:view', 'employee:create', 'employee:edit', 'department:view', 'department:create'],
    status: 1,
    createTime: '2023-01-01'
  },
  {
    id: 3,
    name: '财务管理员',
    code: 'finance',
    description: '财务相关权限',
    permissions: ['bonus:view', 'bonus:calculate', 'report:view'],
    status: 1,
    createTime: '2023-01-01'
  }
];

// 获取角色列表
app.get('/api/roles', (req, res) => {
  const { search, status } = req.query;
  let filteredRoles = [...roles];

  // 搜索过滤
  if (search) {
    filteredRoles = filteredRoles.filter(role => 
      role.name.includes(search) || role.description.includes(search)
    );
  }

  // 状态过滤
  if (status !== undefined && status !== '') {
    filteredRoles = filteredRoles.filter(role => role.status === parseInt(status));
  }

  // 获取权限名称映射
  const permissionMap = {};
  const allPermissions = [
    { code: 'employee:view', name: '查看员工' },
    { code: 'employee:create', name: '新增员工' },
    { code: 'employee:edit', name: '编辑员工' },
    { code: 'employee:delete', name: '删除员工' },
    { code: 'employee:import', name: '导入员工' },
    { code: 'employee:export', name: '导出员工' },
    { code: 'department:view', name: '查看部门' },
    { code: 'department:create', name: '新增部门' },
    { code: 'department:edit', name: '编辑部门' },
    { code: 'department:delete', name: '删除部门' },
    { code: 'position:view', name: '查看岗位' },
    { code: 'position:create', name: '新增岗位' },
    { code: 'position:edit', name: '编辑岗位' },
    { code: 'position:delete', name: '删除岗位' },
    { code: 'bonus:view', name: '查看奖金' },
    { code: 'bonus:calculate', name: '奖金计算' },
    { code: 'bonus:personal', name: '个人奖金查询' },
    { code: 'report:view', name: '查看报表' },
    { code: 'report:export', name: '导出报表' },
    { code: 'user:view', name: '查看用户' },
    { code: 'user:create', name: '新增用户' },
    { code: 'user:edit', name: '编辑用户' },
    { code: 'user:delete', name: '删除用户' },
    { code: 'role:view', name: '查看角色' },
    { code: 'role:create', name: '新增角色' },
    { code: 'role:edit', name: '编辑角色' },
    { code: 'role:delete', name: '删除角色' },
    { code: 'system:config', name: '系统配置' },
    { code: '*', name: '所有权限' }
  ];

  allPermissions.forEach(perm => {
    permissionMap[perm.code] = perm.name;
  });

  // 为每个角色添加权限名称和用户数量
  const rolesWithDetails = filteredRoles.map(role => ({
    ...role,
    permissionNames: role.permissions.includes('*') 
      ? ['所有权限'] 
      : role.permissions.map(code => permissionMap[code] || code),
    userCount: role.id === 1 ? 1 : 0 // 模拟用户数量
  }));

  res.json({
    code: 200,
    message: '获取成功',
    data: {
      roles: rolesWithDetails,
      pagination: {
        total: rolesWithDetails.length,
        page: 1,
        pageSize: 20
      }
    }
  });
});

// 创建角色
app.post('/api/roles', (req, res) => {
  try {
    const { name, code, description, permissions } = req.body;

    // 验证必填字段
    if (!name) {
      return res.status(400).json({
        code: 400,
        message: '角色名称不能为空'
      });
    }

    if (!code) {
      return res.status(400).json({
        code: 400,
        message: '角色编码不能为空'
      });
    }

    // 检查编码是否重复
    const existingRole = roles.find(role => role.code === code);
    if (existingRole) {
      return res.status(400).json({
        code: 400,
        message: '角色编码已存在'
      });
    }

    const newRole = {
      id: Math.max(...roles.map(r => r.id)) + 1,
      name,
      code,
      description: description || '',
      permissions: permissions || [],
      status: 1,
      createTime: new Date().toISOString().split('T')[0]
    };

    roles.push(newRole);

    res.json({
      code: 200,
      message: '角色创建成功',
      data: newRole
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '角色创建失败: ' + error.message
    });
  }
});

// 更新角色
app.put('/api/roles/:id', (req, res) => {
  try {
    const roleId = parseInt(req.params.id);
    const { name, code, description, permissions, status } = req.body;

    const roleIndex = roles.findIndex(role => role.id === roleId);
    if (roleIndex === -1) {
      return res.status(404).json({
        code: 404,
        message: '角色不存在'
      });
    }

    // 验证必填字段
    if (!name) {
      return res.status(400).json({
        code: 400,
        message: '角色名称不能为空'
      });
    }

    if (!code) {
      return res.status(400).json({
        code: 400,
        message: '角色编码不能为空'
      });
    }

    // 检查编码是否重复（排除当前角色）
    const existingRole = roles.find(role => role.code === code && role.id !== roleId);
    if (existingRole) {
      return res.status(400).json({
        code: 400,
        message: '角色编码已存在'
      });
    }

    // 更新角色信息
    roles[roleIndex] = {
      ...roles[roleIndex],
      name,
      code,
      description: description || '',
      permissions: permissions || [],
      status: status !== undefined ? status : roles[roleIndex].status,
      updateTime: new Date().toISOString().split('T')[0]
    };

    res.json({
      code: 200,
      message: '角色更新成功',
      data: roles[roleIndex]
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '角色更新失败: ' + error.message
    });
  }
});

// 删除角色
app.delete('/api/roles/:id', (req, res) => {
  try {
    const roleId = parseInt(req.params.id);

    // 不允许删除系统管理员角色
    if (roleId === 1) {
      return res.status(400).json({
        code: 400,
        message: '系统管理员角色不允许删除'
      });
    }

    const roleIndex = roles.findIndex(role => role.id === roleId);
    if (roleIndex === -1) {
      return res.status(404).json({
        code: 404,
        message: '角色不存在'
      });
    }

    roles.splice(roleIndex, 1);

    res.json({
      code: 200,
      message: '角色删除成功',
      data: null
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '角色删除失败: ' + error.message
    });
  }
});

// 批量操作角色
app.post('/api/roles/batch', (req, res) => {
  try {
    const { action, roleIds } = req.body;

    if (!action || !roleIds || !Array.isArray(roleIds)) {
      return res.status(400).json({
        code: 400,
        message: '参数错误'
      });
    }

    let successCount = 0;
    const errors = [];

    roleIds.forEach(roleId => {
      const roleIndex = roles.findIndex(role => role.id === roleId);
      if (roleIndex === -1) {
        errors.push(`角色ID ${roleId} 不存在`);
        return;
      }

      switch (action) {
        case 'enable':
          roles[roleIndex].status = 1;
          successCount++;
          break;
        case 'disable':
          if (roleId === 1) {
            errors.push('系统管理员角色不允许禁用');
          } else {
            roles[roleIndex].status = 0;
            successCount++;
          }
          break;
        default:
          errors.push(`不支持的操作: ${action}`);
      }
    });

    res.json({
      code: 200,
      message: `批量${action === 'enable' ? '启用' : '禁用'}完成`,
      data: {
        successCount,
        errorCount: errors.length,
        errors
      }
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: '批量操作失败: ' + error.message
    });
  }
});

// 获取系统权限列表
app.get('/api/permissions', (req, res) => {
  const permissions = [
    {
      group: '员工管理',
      permissions: [
        { code: 'employee:view', name: '查看员工' },
        { code: 'employee:create', name: '新增员工' },
        { code: 'employee:edit', name: '编辑员工' },
        { code: 'employee:delete', name: '删除员工' },
        { code: 'employee:import', name: '导入员工' },
        { code: 'employee:export', name: '导出员工' }
      ]
    },
    {
      group: '部门管理',
      permissions: [
        { code: 'department:view', name: '查看部门' },
        { code: 'department:create', name: '新增部门' },
        { code: 'department:edit', name: '编辑部门' },
        { code: 'department:delete', name: '删除部门' }
      ]
    },
    {
      group: '岗位管理',
      permissions: [
        { code: 'position:view', name: '查看岗位' },
        { code: 'position:create', name: '新增岗位' },
        { code: 'position:edit', name: '编辑岗位' },
        { code: 'position:delete', name: '删除岗位' }
      ]
    },
    {
      group: '奖金管理',
      permissions: [
        { code: 'bonus:view', name: '查看奖金' },
        { code: 'bonus:calculate', name: '奖金计算' },
        { code: 'bonus:personal', name: '个人奖金查询' }
      ]
    },
    {
      group: '报表管理',
      permissions: [
        { code: 'report:view', name: '查看报表' },
        { code: 'report:export', name: '导出报表' }
      ]
    },
    {
      group: '系统管理',
      permissions: [
        { code: 'user:view', name: '查看用户' },
        { code: 'user:create', name: '新增用户' },
        { code: 'user:edit', name: '编辑用户' },
        { code: 'user:delete', name: '删除用户' },
        { code: 'role:view', name: '查看角色' },
        { code: 'role:create', name: '新增角色' },
        { code: 'role:edit', name: '编辑角色' },
        { code: 'role:delete', name: '删除角色' },
        { code: 'system:config', name: '系统配置' }
      ]
    }
  ];

  res.json({
    code: 200,
    message: '获取成功',
    data: permissions
  });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`奖金模拟系统服务器运行在 http://localhost:${PORT}`);
  console.log(`API健康检查: http://localhost:${PORT}/api/health`);
  console.log(`默认登录: admin / admin123`);
});

module.exports = app;