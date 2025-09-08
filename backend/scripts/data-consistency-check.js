const Datastore = require('nedb');
const path = require('path');
const bcrypt = require('bcryptjs');

/**
 * 数据一致性检查脚本
 * 验证用户-员工关联关系、检查角色-权限配置、确保项目数据完整性
 */
class DataConsistencyChecker {
    constructor() {
        this.dbPath = path.join(__dirname, '../../database');
        this.databases = {};
        this.issues = [];
        this.warnings = [];
        this.info = [];
    }

    /**
     * 添加问题记录
     */
    addIssue(type, category, message, data = null) {
        const record = {
            type,
            category,
            message,
            data,
            timestamp: new Date()
        };

        switch (type) {
            case 'error':
                this.issues.push(record);
                break;
            case 'warning':
                this.warnings.push(record);
                break;
            case 'info':
                this.info.push(record);
                break;
        }
    }

    /**
     * 初始化数据库连接
     */
    async initDatabases() {
        const dbFiles = [
            'users',
            'roles', 
            'employees',
            'departments',
            'positions',
            'projects',
            'project_members',
            'projectMembers',
            'business_lines',
            'projectBonusPools',
            'projectBonusAllocations'
        ];

        for (const dbName of dbFiles) {
            try {
                const dbFilePath = path.join(this.dbPath, `${dbName}.db`);
                this.databases[dbName] = new Datastore({
                    filename: dbFilePath,
                    autoload: true
                });
                console.log(`✓ 连接到 ${dbName}.db`);
            } catch (error) {
                console.log(`✗ 无法连接到 ${dbName}.db:`, error.message);
                this.addIssue('error', 'database', `无法连接到数据库: ${dbName}.db`, { error: error.message });
            }
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    /**
     * 查询数据库
     */
    async queryDatabase(dbName, query = {}) {
        if (!this.databases[dbName]) {
            this.addIssue('error', 'database', `数据库 ${dbName} 不存在`);
            return [];
        }

        return new Promise((resolve, reject) => {
            this.databases[dbName].find(query, (err, docs) => {
                if (err) {
                    this.addIssue('error', 'database', `查询 ${dbName} 失败`, { error: err.message, query });
                    reject(err);
                } else {
                    resolve(docs);
                }
            });
        });
    }

    /**
     * 检查用户数据完整性
     */
    async checkUserDataIntegrity() {
        console.log('\n👥 检查用户数据完整性...');

        try {
            const users = await this.queryDatabase('users');
            
            if (users.length === 0) {
                this.addIssue('warning', 'users', '系统中没有用户数据');
                return;
            }

            console.log(`  📊 总用户数: ${users.length}`);

            users.forEach((user, index) => {
                // 检查必填字段
                if (!user.username) {
                    this.addIssue('error', 'users', `用户 #${index + 1} 缺少用户名`, { userId: user._id });
                }

                if (!user.password) {
                    this.addIssue('error', 'users', `用户 ${user.username} 缺少密码`, { userId: user._id });
                }

                // 检查用户名唯一性
                const duplicates = users.filter(u => u.username === user.username);
                if (duplicates.length > 1) {
                    this.addIssue('error', 'users', `用户名重复: ${user.username}`, { userId: user._id });
                }

                // 检查邮箱格式
                if (user.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
                    this.addIssue('warning', 'users', `用户 ${user.username} 邮箱格式不正确`, { 
                        userId: user._id, 
                        email: user.email 
                    });
                }

                // 检查角色ID格式
                if (user.roleIds) {
                    if (!Array.isArray(user.roleIds)) {
                        this.addIssue('error', 'users', `用户 ${user.username} 的roleIds应该是数组`, { 
                            userId: user._id, 
                            roleIds: user.roleIds 
                        });
                    }
                }
            });

            this.addIssue('info', 'users', `用户数据完整性检查完成，检查了 ${users.length} 个用户`);

        } catch (error) {
            this.addIssue('error', 'users', '用户数据完整性检查失败', { error: error.message });
        }
    }

    /**
     * 检查用户-员工关联关系
     */
    async checkUserEmployeeRelationships() {
        console.log('\n🔗 检查用户-员工关联关系...');

        try {
            const users = await this.queryDatabase('users');
            const employees = await this.queryDatabase('employees');

            console.log(`  📊 用户数: ${users.length}, 员工数: ${employees.length}`);

            // 检查每个用户是否有对应的员工记录
            for (const user of users) {
                const relatedEmployees = employees.filter(emp => 
                    emp.userId === user._id || emp.username === user.username
                );

                if (relatedEmployees.length === 0) {
                    this.addIssue('warning', 'relationships', `用户 ${user.username} 没有对应的员工记录`, {
                        userId: user._id,
                        username: user.username
                    });
                } else if (relatedEmployees.length > 1) {
                    this.addIssue('error', 'relationships', `用户 ${user.username} 有多个员工记录`, {
                        userId: user._id,
                        employeeCount: relatedEmployees.length
                    });
                } else {
                    const employee = relatedEmployees[0];
                    this.addIssue('info', 'relationships', `用户-员工关联正常: ${user.username} -> ${employee.name}`, {
                        userId: user._id,
                        employeeId: employee._id,
                        employeeName: employee.name
                    });
                }
            }

            // 检查每个员工是否有对应的用户记录
            for (const employee of employees) {
                if (!employee.userId) {
                    this.addIssue('warning', 'relationships', `员工 ${employee.name} 没有关联用户ID`, {
                        employeeId: employee._id,
                        employeeName: employee.name
                    });
                    continue;
                }

                const relatedUser = users.find(user => user._id === employee.userId);
                if (!relatedUser) {
                    this.addIssue('error', 'relationships', `员工 ${employee.name} 关联的用户ID不存在`, {
                        employeeId: employee._id,
                        userId: employee.userId
                    });
                }
            }

        } catch (error) {
            this.addIssue('error', 'relationships', '用户-员工关联关系检查失败', { error: error.message });
        }
    }

    /**
     * 检查角色-权限配置
     */
    async checkRolePermissions() {
        console.log('\n🎭 检查角色-权限配置...');

        try {
            const roles = await this.queryDatabase('roles');
            const users = await this.queryDatabase('users');

            console.log(`  📊 角色数: ${roles.length}`);

            if (roles.length === 0) {
                this.addIssue('error', 'roles', '系统中没有角色配置');
                return;
            }

            // 预定义的权限列表
            const validPermissions = [
                'user:read', 'user:write', 'user:delete',
                'employee:read', 'employee:write', 'employee:delete',
                'project:read', 'project:write', 'project:delete', 'project:apply', 'project:manage',
                'bonus:read', 'bonus:write', 'bonus:calculate',
                'role:read', 'role:write',
                'department:read', 'department:write'
            ];

            roles.forEach(role => {
                // 检查角色基本字段
                if (!role.name) {
                    this.addIssue('error', 'roles', `角色缺少名称`, { roleId: role._id });
                }

                if (!role.code) {
                    this.addIssue('warning', 'roles', `角色 ${role.name} 缺少代码`, { roleId: role._id });
                }

                // 检查权限配置
                if (!role.permissions) {
                    this.addIssue('warning', 'roles', `角色 ${role.name} 没有权限配置`, { roleId: role._id });
                } else if (!Array.isArray(role.permissions)) {
                    this.addIssue('error', 'roles', `角色 ${role.name} 的权限应该是数组`, { 
                        roleId: role._id,
                        permissions: role.permissions 
                    });
                } else {
                    // 检查权限是否有效
                    const invalidPermissions = role.permissions.filter(perm => !validPermissions.includes(perm));
                    if (invalidPermissions.length > 0) {
                        this.addIssue('warning', 'roles', `角色 ${role.name} 包含无效权限`, {
                            roleId: role._id,
                            invalidPermissions
                        });
                    }

                    this.addIssue('info', 'roles', `角色 ${role.name} 有 ${role.permissions.length} 个权限`, {
                        roleId: role._id,
                        permissionCount: role.permissions.length
                    });
                }
            });

            // 检查用户角色分配
            const usersWithRoles = users.filter(user => user.roleIds && user.roleIds.length > 0);
            console.log(`  📊 有角色的用户数: ${usersWithRoles.length}`);

            usersWithRoles.forEach(user => {
                user.roleIds.forEach(roleId => {
                    const role = roles.find(r => r._id === roleId);
                    if (!role) {
                        this.addIssue('error', 'roles', `用户 ${user.username} 分配了不存在的角色`, {
                            userId: user._id,
                            roleId: roleId
                        });
                    }
                });
            });

        } catch (error) {
            this.addIssue('error', 'roles', '角色-权限配置检查失败', { error: error.message });
        }
    }

    /**
     * 检查项目数据完整性
     */
    async checkProjectDataIntegrity() {
        console.log('\n📋 检查项目数据完整性...');

        try {
            const projects = await this.queryDatabase('projects');
            
            console.log(`  📊 项目总数: ${projects.length}`);

            if (projects.length === 0) {
                this.addIssue('warning', 'projects', '系统中没有项目数据');
                return;
            }

            // 有效的项目状态
            const validStatuses = ['planning', 'active', 'paused', 'completed', 'cancelled'];
            const validPriorities = ['low', 'medium', 'high', 'urgent'];

            // 统计项目状态
            const statusCounts = {};
            const priorityCounts = {};

            projects.forEach(project => {
                // 检查必填字段
                if (!project.name) {
                    this.addIssue('error', 'projects', `项目缺少名称`, { projectId: project._id });
                }

                if (!project.code) {
                    this.addIssue('warning', 'projects', `项目 ${project.name} 缺少代码`, { projectId: project._id });
                }

                // 检查项目状态
                if (!project.status) {
                    this.addIssue('error', 'projects', `项目 ${project.name} 缺少状态`, { projectId: project._id });
                } else {
                    statusCounts[project.status] = (statusCounts[project.status] || 0) + 1;
                    
                    if (!validStatuses.includes(project.status)) {
                        this.addIssue('warning', 'projects', `项目 ${project.name} 状态无效: ${project.status}`, {
                            projectId: project._id,
                            status: project.status
                        });
                    }
                }

                // 检查优先级
                if (project.priority) {
                    priorityCounts[project.priority] = (priorityCounts[project.priority] || 0) + 1;
                    
                    if (!validPriorities.includes(project.priority)) {
                        this.addIssue('warning', 'projects', `项目 ${project.name} 优先级无效: ${project.priority}`, {
                            projectId: project._id,
                            priority: project.priority
                        });
                    }
                }

                // 检查日期逻辑
                if (project.startDate && project.endDate) {
                    const startDate = new Date(project.startDate);
                    const endDate = new Date(project.endDate);
                    
                    if (startDate >= endDate) {
                        this.addIssue('error', 'projects', `项目 ${project.name} 开始时间晚于结束时间`, {
                            projectId: project._id,
                            startDate: project.startDate,
                            endDate: project.endDate
                        });
                    }
                }

                // 检查预算
                if (project.budget && (typeof project.budget !== 'number' || project.budget < 0)) {
                    this.addIssue('warning', 'projects', `项目 ${project.name} 预算格式不正确`, {
                        projectId: project._id,
                        budget: project.budget
                    });
                }

                // 检查团队规模
                if (project.teamSize && (typeof project.teamSize !== 'number' || project.teamSize < 1)) {
                    this.addIssue('warning', 'projects', `项目 ${project.name} 团队规模不合理`, {
                        projectId: project._id,
                        teamSize: project.teamSize
                    });
                }
            });

            // 输出统计信息
            console.log('  📊 项目状态分布:', statusCounts);
            console.log('  📊 优先级分布:', priorityCounts);

            // 检查可申请项目
            const availableProjects = projects.filter(p => p.status === 'active' || p.status === 'planning');
            this.addIssue('info', 'projects', `可申请项目数量: ${availableProjects.length}`, {
                availableProjects: availableProjects.map(p => ({ id: p._id, name: p.name, status: p.status }))
            });

        } catch (error) {
            this.addIssue('error', 'projects', '项目数据完整性检查失败', { error: error.message });
        }
    }

    /**
     * 检查部门-职位层级关系
     */
    async checkDepartmentPositionHierarchy() {
        console.log('\n🏢 检查部门-职位层级关系...');

        try {
            const departments = await this.queryDatabase('departments');
            const positions = await this.queryDatabase('positions');
            const employees = await this.queryDatabase('employees');

            console.log(`  📊 部门数: ${departments.length}, 职位数: ${positions.length}`);

            // 检查职位是否关联到有效部门
            positions.forEach(position => {
                if (position.departmentId) {
                    const department = departments.find(d => d._id === position.departmentId);
                    if (!department) {
                        this.addIssue('error', 'hierarchy', `职位 ${position.name} 关联的部门不存在`, {
                            positionId: position._id,
                            departmentId: position.departmentId
                        });
                    } else {
                        this.addIssue('info', 'hierarchy', `职位-部门关联正常: ${position.name} -> ${department.name}`, {
                            positionId: position._id,
                            departmentId: department._id
                        });
                    }
                }
            });

            // 检查员工是否关联到有效的部门和职位
            employees.forEach(employee => {
                if (employee.departmentId) {
                    const department = departments.find(d => d._id === employee.departmentId);
                    if (!department) {
                        this.addIssue('error', 'hierarchy', `员工 ${employee.name} 关联的部门不存在`, {
                            employeeId: employee._id,
                            departmentId: employee.departmentId
                        });
                    }
                }

                if (employee.positionId) {
                    const position = positions.find(p => p._id === employee.positionId);
                    if (!position) {
                        this.addIssue('error', 'hierarchy', `员工 ${employee.name} 关联的职位不存在`, {
                            employeeId: employee._id,
                            positionId: employee.positionId
                        });
                    }
                }
            });

        } catch (error) {
            this.addIssue('error', 'hierarchy', '部门-职位层级关系检查失败', { error: error.message });
        }
    }

    /**
     * 检查test2用户的完整配置
     */
    async checkTest2UserConfiguration() {
        console.log('\n🔍 检查test2用户完整配置...');

        try {
            const users = await this.queryDatabase('users', { username: 'test2' });
            
            if (users.length === 0) {
                this.addIssue('error', 'test2', 'test2用户不存在');
                return;
            }

            const test2User = users[0];
            console.log(`  ✓ 找到test2用户 (ID: ${test2User._id})`);

            // 检查用户基本信息
            if (!test2User.password) {
                this.addIssue('error', 'test2', 'test2用户没有密码');
            } else {
                // 尝试验证密码
                try {
                    const isValidPassword = await bcrypt.compare('123456', test2User.password);
                    if (isValidPassword) {
                        this.addIssue('info', 'test2', 'test2用户密码验证正确');
                    } else {
                        this.addIssue('warning', 'test2', 'test2用户密码可能不是默认密码(123456)');
                    }
                } catch (error) {
                    this.addIssue('warning', 'test2', 'test2用户密码格式异常', { error: error.message });
                }
            }

            // 检查角色配置
            if (!test2User.roleIds || test2User.roleIds.length === 0) {
                this.addIssue('error', 'test2', 'test2用户没有分配角色');
            } else {
                const roles = await this.queryDatabase('roles');
                const userRoles = roles.filter(r => test2User.roleIds.includes(r._id));
                
                console.log(`  ✓ test2用户有 ${userRoles.length} 个角色:`);
                userRoles.forEach(role => {
                    console.log(`    - ${role.name} (${role.permissions ? role.permissions.length : 0} 个权限)`);
                });

                // 检查是否有项目申请权限
                const hasProjectApplyPermission = userRoles.some(role => 
                    role.permissions && role.permissions.includes('project:apply')
                );

                if (hasProjectApplyPermission) {
                    this.addIssue('info', 'test2', 'test2用户有项目申请权限');
                } else {
                    this.addIssue('error', 'test2', 'test2用户没有项目申请权限');
                }
            }

            // 检查员工记录
            const employees = await this.queryDatabase('employees', { userId: test2User._id });
            if (employees.length === 0) {
                this.addIssue('error', 'test2', 'test2用户没有对应的员工记录');
            } else {
                const employee = employees[0];
                console.log(`  ✓ 找到对应员工记录: ${employee.name} (ID: ${employee._id})`);
                
                // 检查员工详细信息
                if (!employee.departmentId) {
                    this.addIssue('warning', 'test2', 'test2员工没有分配部门');
                }
                
                if (!employee.positionId) {
                    this.addIssue('warning', 'test2', 'test2员工没有分配职位');
                }

                this.addIssue('info', 'test2', 'test2用户配置基本完整', {
                    userId: test2User._id,
                    employeeId: employee._id,
                    roles: test2User.roleIds,
                    departmentId: employee.departmentId,
                    positionId: employee.positionId
                });
            }

        } catch (error) {
            this.addIssue('error', 'test2', 'test2用户配置检查失败', { error: error.message });
        }
    }

    /**
     * 生成修复建议
     */
    generateFixSuggestions() {
        console.log('\n🔧 生成修复建议...');

        const suggestions = [];

        // 基于错误类型生成建议
        this.issues.forEach(issue => {
            switch (issue.category) {
                case 'users':
                    if (issue.message.includes('缺少用户名')) {
                        suggestions.push('运行创建测试数据脚本来添加完整的用户数据');
                    }
                    break;

                case 'relationships':
                    if (issue.message.includes('没有对应的员工记录')) {
                        suggestions.push('为孤立用户创建对应的员工记录');
                    }
                    break;

                case 'roles':
                    if (issue.message.includes('没有角色配置')) {
                        suggestions.push('运行角色初始化脚本创建默认角色');
                    }
                    break;

                case 'projects':
                    if (issue.message.includes('没有项目数据')) {
                        suggestions.push('运行示例项目创建脚本');
                    }
                    break;

                case 'test2':
                    if (issue.message.includes('不存在')) {
                        suggestions.push('运行测试数据创建脚本来创建test2用户');
                    }
                    break;
            }
        });

        // 去重并输出建议
        const uniqueSuggestions = [...new Set(suggestions)];
        
        if (uniqueSuggestions.length > 0) {
            console.log('  💡 修复建议:');
            uniqueSuggestions.forEach((suggestion, index) => {
                console.log(`    ${index + 1}. ${suggestion}`);
            });
        } else {
            console.log('  ✅ 没有发现需要修复的问题');
        }

        return uniqueSuggestions;
    }

    /**
     * 输出检查报告
     */
    generateReport() {
        console.log('\n📊 数据一致性检查报告');
        console.log('='.repeat(60));

        console.log(`\n🔴 错误数量: ${this.issues.length}`);
        if (this.issues.length > 0) {
            this.issues.forEach((issue, index) => {
                console.log(`  ${index + 1}. [${issue.category}] ${issue.message}`);
                if (issue.data) {
                    console.log(`     数据: ${JSON.stringify(issue.data, null, 2)}`);
                }
            });
        }

        console.log(`\n🟡 警告数量: ${this.warnings.length}`);
        if (this.warnings.length > 0) {
            this.warnings.forEach((warning, index) => {
                console.log(`  ${index + 1}. [${warning.category}] ${warning.message}`);
            });
        }

        console.log(`\n🟢 信息数量: ${this.info.length}`);
        console.log(`   (详细信息已在检查过程中显示)`);

        // 生成修复建议
        this.generateFixSuggestions();
    }

    /**
     * 运行完整的一致性检查
     */
    async run() {
        console.log('🚀 启动数据一致性检查器');
        console.log('运行环境: localhost:3002');
        console.log('='.repeat(60));

        try {
            await this.initDatabases();
            
            await this.checkUserDataIntegrity();
            await this.checkUserEmployeeRelationships();
            await this.checkRolePermissions();
            await this.checkProjectDataIntegrity();
            await this.checkDepartmentPositionHierarchy();
            await this.checkTest2UserConfiguration();

            this.generateReport();

            const hasErrors = this.issues.length > 0;
            const hasWarnings = this.warnings.length > 0;

            if (hasErrors) {
                console.log('\n❌ 数据一致性检查发现严重问题，建议先修复错误再进行测试');
            } else if (hasWarnings) {
                console.log('\n⚠️  数据一致性检查发现警告问题，建议修复以获得更好的系统稳定性');
            } else {
                console.log('\n✅ 数据一致性检查通过，系统数据配置正常');
            }

        } catch (error) {
            console.log('\n❌ 数据一致性检查过程中出现异常:', error.message);
            console.error(error);
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const checker = new DataConsistencyChecker();
    checker.run().catch(console.error);
}

module.exports = DataConsistencyChecker;