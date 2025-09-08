const Datastore = require('nedb');
const path = require('path');

/**
 * NeDB数据查看脚本
 * 读取并显示各个.db文件的内容，分析数据结构和关联关系
 */
class NeDBDataChecker {
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
            'business_lines',
            'notifications',
            'audit_logs',
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
                console.log(`✓ 已连接到 ${dbName}.db`);
            } catch (error) {
                console.log(`✗ 无法连接到 ${dbName}.db:`, error.message);
            }
        }

        // 等待所有数据库加载完成
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    /**
     * 查看指定数据库的所有数据
     */
    async viewDatabase(dbName) {
        if (!this.databases[dbName]) {
            console.log(`❌ 数据库 ${dbName} 未找到`);
            return null;
        }

        return new Promise((resolve, reject) => {
            this.databases[dbName].find({}, (err, docs) => {
                if (err) {
                    console.log(`❌ 查询 ${dbName} 失败:`, err);
                    reject(err);
                } else {
                    resolve(docs);
                }
            });
        });
    }

    /**
     * 显示数据库概览
     */
    async showDatabaseOverview() {
        console.log('\n🔍 NeDB数据库概览');
        console.log('='.repeat(50));

        for (const dbName of Object.keys(this.databases)) {
            try {
                const docs = await this.viewDatabase(dbName);
                if (docs) {
                    console.log(`\n📊 ${dbName}.db (${docs.length} 条记录)`);
                    if (docs.length > 0) {
                        // 显示数据结构
                        const sample = docs[0];
                        const fields = Object.keys(sample);
                        console.log(`   字段: ${fields.join(', ')}`);
                    }
                }
            } catch (error) {
                console.log(`❌ ${dbName}.db 查询失败:`, error.message);
            }
        }
    }

    /**
     * 显示详细数据
     */
    async showDetailedData() {
        console.log('\n📋 详细数据内容');
        console.log('='.repeat(50));

        // 关键数据库详情
        const keyDatabases = ['users', 'roles', 'employees', 'projects'];

        for (const dbName of keyDatabases) {
            console.log(`\n📁 ${dbName.toUpperCase()}`);
            console.log('-'.repeat(30));
            
            try {
                const docs = await this.viewDatabase(dbName);
                if (docs && docs.length > 0) {
                    docs.forEach((doc, index) => {
                        console.log(`  ${index + 1}. ${JSON.stringify(doc, null, 2)}`);
                    });
                } else {
                    console.log('  📝 无数据');
                }
            } catch (error) {
                console.log(`  ❌ 错误: ${error.message}`);
            }
        }
    }

    /**
     * 分析数据关联关系
     */
    async analyzeRelationships() {
        console.log('\n🔗 数据关联关系分析');
        console.log('='.repeat(50));

        try {
            const users = await this.viewDatabase('users');
            const employees = await this.viewDatabase('employees');
            const roles = await this.viewDatabase('roles');
            const projects = await this.viewDatabase('projects');

            // 分析用户-员工关联
            console.log('\n👥 用户-员工关联关系:');
            if (users && employees) {
                users.forEach(user => {
                    const employee = employees.find(emp => emp.userId === user._id || emp.username === user.username);
                    console.log(`  用户: ${user.username} (${user._id}) -> 员工: ${employee ? employee.name || employee._id : '未关联'}`);
                });
            }

            // 分析用户-角色关联
            console.log('\n🎭 用户-角色关联关系:');
            if (users && roles) {
                users.forEach(user => {
                    const userRoles = roles.filter(role => user.roleIds && user.roleIds.includes(role._id));
                    console.log(`  用户: ${user.username} -> 角色: ${userRoles.map(r => r.name).join(', ') || '无角色'}`);
                });
            }

            // 分析项目状态
            console.log('\n📋 项目状态分析:');
            if (projects) {
                const statusCounts = projects.reduce((counts, project) => {
                    const status = project.status || 'undefined';
                    counts[status] = (counts[status] || 0) + 1;
                    return counts;
                }, {});
                
                Object.entries(statusCounts).forEach(([status, count]) => {
                    console.log(`  ${status}: ${count} 个项目`);
                });

                // 显示可申请的项目
                const availableProjects = projects.filter(p => 
                    p.status === 'active' || p.status === 'planning'
                );
                console.log(`\n✅ 可申请项目 (${availableProjects.length} 个):`);
                availableProjects.forEach(project => {
                    console.log(`  - ${project.name} (${project.status})`);
                });
            }

        } catch (error) {
            console.log('❌ 关联关系分析失败:', error.message);
        }
    }

    /**
     * 检查test2用户数据
     */
    async checkTest2UserData() {
        console.log('\n🔍 test2用户数据检查');
        console.log('='.repeat(50));

        try {
            const users = await this.viewDatabase('users');
            const employees = await this.viewDatabase('employees');
            const roles = await this.viewDatabase('roles');

            const test2User = users ? users.find(u => u.username === 'test2') : null;
            
            if (!test2User) {
                console.log('❌ 未找到test2用户');
                return;
            }

            console.log('📋 test2用户信息:');
            console.log(`  ID: ${test2User._id}`);
            console.log(`  用户名: ${test2User.username}`);
            console.log(`  邮箱: ${test2User.email || '无'}`);
            console.log(`  角色ID: ${test2User.roleIds ? test2User.roleIds.join(', ') : '无'}`);

            // 检查员工记录
            const test2Employee = employees ? employees.find(emp => 
                emp.userId === test2User._id || emp.username === test2User.username
            ) : null;

            if (test2Employee) {
                console.log('\n👤 对应员工记录:');
                console.log(`  员工ID: ${test2Employee._id}`);
                console.log(`  姓名: ${test2Employee.name || '无'}`);
                console.log(`  部门ID: ${test2Employee.departmentId || '无'}`);
                console.log(`  职位ID: ${test2Employee.positionId || '无'}`);
            } else {
                console.log('\n❌ 未找到对应的员工记录');
            }

            // 检查角色权限
            if (test2User.roleIds && roles) {
                console.log('\n🎭 角色权限:');
                test2User.roleIds.forEach(roleId => {
                    const role = roles.find(r => r._id === roleId);
                    if (role) {
                        console.log(`  - ${role.name}: ${role.permissions ? role.permissions.join(', ') : '无权限'}`);
                    }
                });
            }

        } catch (error) {
            console.log('❌ test2用户数据检查失败:', error.message);
        }
    }

    /**
     * 运行完整检查
     */
    async run() {
        console.log('🚀 启动NeDB数据检查器');
        console.log('运行环境: localhost:3002');
        
        try {
            await this.initDatabases();
            await this.showDatabaseOverview();
            await this.showDetailedData();
            await this.analyzeRelationships();
            await this.checkTest2UserData();
            
            console.log('\n✅ 数据检查完成');
        } catch (error) {
            console.log('\n❌ 数据检查失败:', error.message);
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const checker = new NeDBDataChecker();
    checker.run().catch(console.error);
}

module.exports = NeDBDataChecker;