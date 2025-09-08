const Datastore = require('nedb');
const path = require('path');
const bcrypt = require('bcryptjs');

/**
 * 测试数据创建脚本
 * 确保有可申请的项目、test2用户有正确的员工记录和角色权限
 */
class TestDataCreator {
    constructor() {
        this.dbPath = path.join(__dirname, '../../database');
        this.databases = {};
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
            'business_lines'
        ];

        for (const dbName of dbFiles) {
            const dbFilePath = path.join(this.dbPath, `${dbName}.db`);
            this.databases[dbName] = new Datastore({
                filename: dbFilePath,
                autoload: true
            });
        }

        // 等待所有数据库加载完成
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('✓ 数据库连接初始化完成');
    }

    /**
     * 插入数据到指定数据库
     */
    async insertData(dbName, data) {
        return new Promise((resolve, reject) => {
            this.databases[dbName].insert(data, (err, newDoc) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(newDoc);
                }
            });
        });
    }

    /**
     * 查找数据
     */
    async findData(dbName, query = {}) {
        return new Promise((resolve, reject) => {
            this.databases[dbName].find(query, (err, docs) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(docs);
                }
            });
        });
    }

    /**
     * 更新数据
     */
    async updateData(dbName, query, update, options = {}) {
        return new Promise((resolve, reject) => {
            this.databases[dbName].update(query, update, options, (err, numReplaced) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(numReplaced);
                }
            });
        });
    }

    /**
     * 创建默认角色
     */
    async createDefaultRoles() {
        console.log('\n🎭 创建默认角色...');

        const defaultRoles = [
            {
                _id: 'role_admin',
                name: '系统管理员',
                code: 'admin',
                permissions: [
                    'user:read', 'user:write', 'user:delete',
                    'employee:read', 'employee:write', 'employee:delete',
                    'project:read', 'project:write', 'project:delete',
                    'project:apply', 'project:manage',
                    'bonus:read', 'bonus:write', 'bonus:calculate'
                ],
                description: '系统管理员，拥有所有权限',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                _id: 'role_employee',
                name: '普通员工',
                code: 'employee',
                permissions: [
                    'user:read',
                    'employee:read',
                    'project:read', 'project:apply',
                    'bonus:read'
                ],
                description: '普通员工，基本权限',
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                _id: 'role_manager',
                name: '项目经理',
                code: 'manager',
                permissions: [
                    'user:read',
                    'employee:read', 'employee:write',
                    'project:read', 'project:write', 'project:manage',
                    'bonus:read', 'bonus:write'
                ],
                description: '项目经理，管理权限',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        for (const role of defaultRoles) {
            try {
                const existing = await this.findData('roles', { _id: role._id });
                if (existing.length === 0) {
                    await this.insertData('roles', role);
                    console.log(`  ✓ 创建角色: ${role.name}`);
                } else {
                    console.log(`  - 角色已存在: ${role.name}`);
                }
            } catch (error) {
                console.log(`  ❌ 创建角色失败 ${role.name}:`, error.message);
            }
        }
    }

    /**
     * 创建默认部门
     */
    async createDefaultDepartments() {
        console.log('\n🏢 创建默认部门...');

        const defaultDepartments = [
            {
                _id: 'dept_tech',
                name: '技术部',
                code: 'TECH',
                description: '技术开发部门',
                parentId: null,
                level: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                _id: 'dept_product',
                name: '产品部',
                code: 'PRODUCT',
                description: '产品管理部门',
                parentId: null,
                level: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                _id: 'dept_operation',
                name: '运营部',
                code: 'OPERATION',
                description: '业务运营部门',
                parentId: null,
                level: 1,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        for (const dept of defaultDepartments) {
            try {
                const existing = await this.findData('departments', { _id: dept._id });
                if (existing.length === 0) {
                    await this.insertData('departments', dept);
                    console.log(`  ✓ 创建部门: ${dept.name}`);
                } else {
                    console.log(`  - 部门已存在: ${dept.name}`);
                }
            } catch (error) {
                console.log(`  ❌ 创建部门失败 ${dept.name}:`, error.message);
            }
        }
    }

    /**
     * 创建默认职位
     */
    async createDefaultPositions() {
        console.log('\n💼 创建默认职位...');

        const defaultPositions = [
            {
                _id: 'pos_dev',
                name: '开发工程师',
                code: 'DEVELOPER',
                level: 'P3',
                departmentId: 'dept_tech',
                baseSalary: 15000,
                benchmarkValue: 1.0,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                _id: 'pos_senior_dev',
                name: '高级开发工程师',
                code: 'SENIOR_DEV',
                level: 'P4',
                departmentId: 'dept_tech',
                baseSalary: 22000,
                benchmarkValue: 1.3,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                _id: 'pos_pm',
                name: '产品经理',
                code: 'PM',
                level: 'P4',
                departmentId: 'dept_product',
                baseSalary: 20000,
                benchmarkValue: 1.2,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        for (const position of defaultPositions) {
            try {
                const existing = await this.findData('positions', { _id: position._id });
                if (existing.length === 0) {
                    await this.insertData('positions', position);
                    console.log(`  ✓ 创建职位: ${position.name}`);
                } else {
                    console.log(`  - 职位已存在: ${position.name}`);
                }
            } catch (error) {
                console.log(`  ❌ 创建职位失败 ${position.name}:`, error.message);
            }
        }
    }

    /**
     * 创建/更新test2用户
     */
    async createOrUpdateTest2User() {
        console.log('\n👤 创建/更新test2用户...');

        try {
            // 查找现有test2用户
            const existingUsers = await this.findData('users', { username: 'test2' });
            
            const hashedPassword = await bcrypt.hash('123456', 10);
            
            const test2UserData = {
                username: 'test2',
                email: 'test2@example.com',
                password: hashedPassword,
                roleIds: ['role_employee', 'role_manager'],
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            let test2User;
            if (existingUsers.length === 0) {
                test2User = await this.insertData('users', test2UserData);
                console.log('  ✓ 创建test2用户');
            } else {
                test2User = existingUsers[0];
                await this.updateData('users', { _id: test2User._id }, { 
                    $set: { 
                        ...test2UserData,
                        _id: test2User._id 
                    } 
                });
                console.log('  ✓ 更新test2用户');
            }

            // 创建对应的员工记录
            const existingEmployees = await this.findData('employees', { userId: test2User._id });
            
            const test2EmployeeData = {
                userId: test2User._id,
                username: 'test2',
                name: '测试员工2',
                employeeId: 'EMP002',
                departmentId: 'dept_tech',
                positionId: 'pos_senior_dev',
                baseSalary: 22000,
                hireDate: new Date('2023-01-15'),
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            if (existingEmployees.length === 0) {
                await this.insertData('employees', test2EmployeeData);
                console.log('  ✓ 创建test2员工记录');
            } else {
                await this.updateData('employees', { userId: test2User._id }, { 
                    $set: test2EmployeeData 
                });
                console.log('  ✓ 更新test2员工记录');
            }

        } catch (error) {
            console.log('  ❌ 创建/更新test2用户失败:', error.message);
        }
    }

    /**
     * 创建示例项目
     */
    async createSampleProjects() {
        console.log('\n📋 创建示例项目...');

        const sampleProjects = [
            {
                _id: 'proj_active_1',
                name: '移动端APP开发项目',
                code: 'MOBILE_APP_2024',
                description: '开发公司移动端应用，包含用户管理、订单系统等核心功能',
                status: 'active',
                priority: 'high',
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-06-30'),
                budget: 500000,
                managerId: null,
                teamSize: 5,
                requiredSkills: ['React Native', 'Node.js', 'MySQL'],
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                _id: 'proj_planning_1',
                name: '数据分析平台建设',
                code: 'DATA_PLATFORM_2024',
                description: '构建企业级数据分析平台，支持实时数据处理和可视化展示',
                status: 'planning',
                priority: 'medium',
                startDate: new Date('2024-03-01'),
                endDate: new Date('2024-09-30'),
                budget: 800000,
                managerId: null,
                teamSize: 8,
                requiredSkills: ['Python', 'Spark', 'Elasticsearch', 'Vue.js'],
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                _id: 'proj_active_2',
                name: '微服务架构升级',
                code: 'MICROSERVICE_2024',
                description: '将现有单体应用拆分为微服务架构，提升系统可扩展性',
                status: 'active',
                priority: 'high',
                startDate: new Date('2024-02-01'),
                endDate: new Date('2024-08-31'),
                budget: 600000,
                managerId: null,
                teamSize: 6,
                requiredSkills: ['Java', 'Spring Boot', 'Docker', 'Kubernetes'],
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                _id: 'proj_completed_1',
                name: '客户管理系统',
                code: 'CRM_2023',
                description: '已完成的客户管理系统项目',
                status: 'completed',
                priority: 'medium',
                startDate: new Date('2023-06-01'),
                endDate: new Date('2023-12-31'),
                budget: 300000,
                managerId: null,
                teamSize: 4,
                requiredSkills: ['Vue.js', 'Express', 'PostgreSQL'],
                createdAt: new Date('2023-06-01'),
                updatedAt: new Date()
            }
        ];

        for (const project of sampleProjects) {
            try {
                const existing = await this.findData('projects', { _id: project._id });
                if (existing.length === 0) {
                    await this.insertData('projects', project);
                    console.log(`  ✓ 创建项目: ${project.name} (${project.status})`);
                } else {
                    console.log(`  - 项目已存在: ${project.name}`);
                }
            } catch (error) {
                console.log(`  ❌ 创建项目失败 ${project.name}:`, error.message);
            }
        }
    }

    /**
     * 创建业务线数据
     */
    async createBusinessLines() {
        console.log('\n🏭 创建业务线数据...');

        const businessLines = [
            {
                _id: 'bl_tech',
                name: '技术研发',
                code: 'TECH',
                weight: 0.4,
                description: '技术开发相关业务',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                _id: 'bl_product',
                name: '产品运营',
                code: 'PRODUCT',
                weight: 0.3,
                description: '产品管理和运营',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            },
            {
                _id: 'bl_sales',
                name: '销售市场',
                code: 'SALES',
                weight: 0.3,
                description: '销售和市场推广',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];

        for (const bl of businessLines) {
            try {
                const existing = await this.findData('business_lines', { _id: bl._id });
                if (existing.length === 0) {
                    await this.insertData('business_lines', bl);
                    console.log(`  ✓ 创建业务线: ${bl.name}`);
                } else {
                    console.log(`  - 业务线已存在: ${bl.name}`);
                }
            } catch (error) {
                console.log(`  ❌ 创建业务线失败 ${bl.name}:`, error.message);
            }
        }
    }

    /**
     * 验证创建的数据
     */
    async validateCreatedData() {
        console.log('\n✅ 验证创建的数据...');

        try {
            // 验证test2用户
            const test2Users = await this.findData('users', { username: 'test2' });
            if (test2Users.length > 0) {
                const test2User = test2Users[0];
                console.log(`  ✓ test2用户存在 (ID: ${test2User._id})`);
                
                const test2Employee = await this.findData('employees', { userId: test2User._id });
                if (test2Employee.length > 0) {
                    console.log(`  ✓ test2员工记录存在 (姓名: ${test2Employee[0].name})`);
                } else {
                    console.log('  ❌ test2员工记录不存在');
                }
            } else {
                console.log('  ❌ test2用户不存在');
            }

            // 验证可申请项目
            const availableProjects = await this.findData('projects', { 
                status: { $in: ['active', 'planning'] }
            });
            console.log(`  ✓ 可申请项目数量: ${availableProjects.length}`);
            availableProjects.forEach(project => {
                console.log(`    - ${project.name} (${project.status})`);
            });

            // 验证角色权限
            const roles = await this.findData('roles');
            console.log(`  ✓ 角色数量: ${roles.length}`);
            roles.forEach(role => {
                console.log(`    - ${role.name}: ${role.permissions ? role.permissions.length : 0} 个权限`);
            });

        } catch (error) {
            console.log('  ❌ 数据验证失败:', error.message);
        }
    }

    /**
     * 运行完整的数据创建流程
     */
    async run() {
        console.log('🚀 启动测试数据创建器');
        console.log('目标环境: localhost:3002');
        console.log('='.repeat(50));

        try {
            await this.initDatabases();
            await this.createDefaultRoles();
            await this.createDefaultDepartments();
            await this.createDefaultPositions();
            await this.createBusinessLines();
            await this.createSampleProjects();
            await this.createOrUpdateTest2User();
            await this.validateCreatedData();

            console.log('\n🎉 测试数据创建完成！');
            console.log('\n📋 创建的数据摘要:');
            console.log('  - 3个默认角色 (管理员、员工、经理)');
            console.log('  - 3个部门 (技术部、产品部、运营部)');
            console.log('  - 3个职位 (开发工程师、高级开发工程师、产品经理)');
            console.log('  - 4个示例项目 (2个active, 1个planning, 1个completed)');
            console.log('  - 3个业务线 (技术研发、产品运营、销售市场)');
            console.log('  - test2用户和对应员工记录');
            
        } catch (error) {
            console.log('\n❌ 测试数据创建失败:', error.message);
            console.error(error);
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const creator = new TestDataCreator();
    creator.run().catch(console.error);
}

module.exports = TestDataCreator;