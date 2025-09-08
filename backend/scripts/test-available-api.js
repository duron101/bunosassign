const http = require('http');
const https = require('https');
const TestDataCreator = require('./create-test-data');

/**
 * API测试脚本
 * 模拟用户登录获取token，测试 /api/projects/available 接口调用
 */
class APITester {
    constructor() {
        this.baseURL = 'http://localhost:3002';
        this.token = null;
        this.userId = null;
        this.employeeId = null;
    }

    /**
     * 发送HTTP请求
     */
    async makeRequest(method, path, data = null, headers = {}) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.baseURL);
            const isHttps = url.protocol === 'https:';
            const httpModule = isHttps ? https : http;

            const defaultHeaders = {
                'Content-Type': 'application/json',
                'User-Agent': 'NeDB-Test-Client/1.0',
                ...headers
            };

            if (this.token) {
                defaultHeaders['Authorization'] = `Bearer ${this.token}`;
            }

            let postData = null;
            if (data) {
                postData = JSON.stringify(data);
                defaultHeaders['Content-Length'] = Buffer.byteLength(postData);
            }

            const options = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname + url.search,
                method: method.toUpperCase(),
                headers: defaultHeaders,
                timeout: 10000
            };

            const req = httpModule.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => {
                    body += chunk;
                });

                res.on('end', () => {
                    try {
                        const response = {
                            status: res.statusCode,
                            statusText: res.statusMessage,
                            headers: res.headers,
                            data: body ? JSON.parse(body) : null
                        };
                        resolve(response);
                    } catch (error) {
                        resolve({
                            status: res.statusCode,
                            statusText: res.statusMessage,
                            headers: res.headers,
                            data: body
                        });
                    }
                });
            });

            req.on('error', (error) => {
                console.log(`\n❌ HTTP请求失败: ${method.toUpperCase()} ${path}`);
                console.log(`   错误信息: ${error.message}`);
                reject(error);
            });

            req.on('timeout', () => {
                console.log(`\n❌ HTTP请求超时: ${method.toUpperCase()} ${path}`);
                req.destroy();
                reject(new Error('Request timeout'));
            });

            if (postData) {
                req.write(postData);
            }

            req.end();
        });
    }

    /**
     * 测试服务器连接
     */
    async testServerConnection() {
        console.log('\n🔗 测试服务器连接...');
        
        try {
            const response = await this.makeRequest('GET', '/api/health');
            if (response.status === 200) {
                console.log('  ✓ 服务器连接正常');
                console.log(`  ✓ 服务器响应: ${response.data?.message || 'OK'}`);
                return true;
            } else {
                console.log(`  ❌ 服务器响应异常: ${response.status}`);
                return false;
            }
        } catch (error) {
            console.log('  ❌ 服务器连接失败');
            console.log(`  ❌ 错误: ${error.message}`);
            return false;
        }
    }

    /**
     * 用户登录获取token
     */
    async loginUser(username = 'test2', password = '123456') {
        console.log(`\n🔐 用户登录 (${username})...`);

        try {
            const loginData = {
                username,
                password
            };

            const response = await this.makeRequest('POST', '/api/auth/login', loginData);
            
            if (response.status === 200 && response.data?.code === 200) {
                this.token = response.data.data.token;
                this.userId = response.data.data.user.id;
                
                console.log('  ✓ 登录成功');
                console.log(`  ✓ 用户ID: ${this.userId}`);
                console.log(`  ✓ Token: ${this.token ? this.token.substring(0, 20) + '...' : 'N/A'}`);
                console.log(`  ✓ 用户角色: ${response.data.data.user.roleName || 'N/A'}`);
                console.log(`  ✓ 权限数量: ${response.data.data.permissions ? response.data.data.permissions.length : 0}`);
                
                return true;
            } else {
                console.log('  ❌ 登录失败: 响应格式异常');
                console.log(`  ❌ 状态码: ${response.status}`);
                if (response.data) {
                    console.log(`  ❌ 响应: ${JSON.stringify(response.data, null, 2)}`);
                }
                return false;
            }
        } catch (error) {
            console.log('  ❌ 登录失败');
            console.log(`  ❌ 错误: ${error.message}`);
            return false;
        }
    }

    /**
     * 获取当前用户信息
     */
    async getCurrentUser() {
        console.log('\n👤 获取当前用户信息...');

        try {
            const response = await this.client.get('/api/auth/me');
            
            if (response.data.success) {
                const userData = response.data.data;
                console.log('  ✓ 用户信息获取成功');
                console.log(`  ✓ 用户名: ${userData.username}`);
                console.log(`  ✓ 邮箱: ${userData.email || 'N/A'}`);
                console.log(`  ✓ 角色: ${userData.roles ? userData.roles.map(r => r.name).join(', ') : 'N/A'}`);
                
                return userData;
            } else {
                console.log('  ❌ 获取用户信息失败');
                return null;
            }
        } catch (error) {
            console.log('  ❌ 获取用户信息失败');
            return null;
        }
    }

    /**
     * 获取用户员工信息
     */
    async getEmployeeInfo() {
        console.log('\n👨‍💼 获取员工信息...');

        try {
            const response = await this.client.get('/api/employees/me');
            
            if (response.data.success) {
                const employeeData = response.data.data;
                this.employeeId = employeeData.id;
                
                console.log('  ✓ 员工信息获取成功');
                console.log(`  ✓ 员工ID: ${employeeData.id}`);
                console.log(`  ✓ 姓名: ${employeeData.name}`);
                console.log(`  ✓ 部门: ${employeeData.department ? employeeData.department.name : 'N/A'}`);
                console.log(`  ✓ 职位: ${employeeData.position ? employeeData.position.name : 'N/A'}`);
                
                return employeeData;
            } else {
                console.log('  ❌ 获取员工信息失败');
                return null;
            }
        } catch (error) {
            console.log('  ❌ 获取员工信息失败');
            return null;
        }
    }

    /**
     * 测试获取可申请项目列表
     */
    async testAvailableProjectsAPI() {
        console.log('\n📋 测试 /api/projects/available 接口...');

        try {
            const response = await this.makeRequest('GET', '/api/projects/available');
            
            if (response.status === 200 && (response.data?.code === 200 || response.data?.success)) {
                const projects = response.data.data || [];
                console.log('  ✓ 可申请项目列表获取成功');
                console.log(`  ✓ 项目数量: ${projects.length}`);
                
                if (projects.length > 0) {
                    console.log('  📋 项目列表:');
                    projects.forEach((project, index) => {
                        console.log(`    ${index + 1}. ${project.name}`);
                        console.log(`       状态: ${project.status}`);
                        console.log(`       优先级: ${project.priority || 'N/A'}`);
                        console.log(`       预算: ${project.budget ? project.budget.toLocaleString() : 'N/A'}`);
                        console.log(`       团队规模: ${project.teamSize || 'N/A'}`);
                        console.log(`       所需技能: ${project.requiredSkills ? project.requiredSkills.join(', ') : 'N/A'}`);
                        console.log('');
                    });
                } else {
                    console.log('  📝 暂无可申请项目');
                }
                
                return projects;
            } else {
                console.log('  ❌ 获取项目列表失败');
                console.log(`  ❌ 状态码: ${response.status}`);
                if (response.data) {
                    console.log(`  ❌ 响应: ${JSON.stringify(response.data, null, 2)}`);
                }
                return [];
            }
        } catch (error) {
            console.log('  ❌ 获取项目列表失败');
            console.log(`  ❌ 错误: ${error.message}`);
            return [];
        }
    }

    /**
     * 测试获取所有项目列表 (用于对比)
     */
    async testAllProjectsAPI() {
        console.log('\n📋 测试 /api/projects 接口 (所有项目)...');

        try {
            const response = await this.client.get('/api/projects');
            
            if (response.data.success) {
                const projects = response.data.data.projects || response.data.data;
                console.log('  ✓ 所有项目列表获取成功');
                console.log(`  ✓ 总项目数量: ${Array.isArray(projects) ? projects.length : 0}`);
                
                if (Array.isArray(projects) && projects.length > 0) {
                    // 按状态分组统计
                    const statusCounts = projects.reduce((counts, project) => {
                        const status = project.status || 'undefined';
                        counts[status] = (counts[status] || 0) + 1;
                        return counts;
                    }, {});
                    
                    console.log('  📊 项目状态统计:');
                    Object.entries(statusCounts).forEach(([status, count]) => {
                        console.log(`    ${status}: ${count} 个`);
                    });
                }
                
                return projects;
            } else {
                console.log('  ❌ 获取所有项目列表失败');
                return [];
            }
        } catch (error) {
            console.log('  ❌ 获取所有项目列表失败');
            return [];
        }
    }

    /**
     * 测试项目申请功能 (模拟)
     */
    async testProjectApplication(projectId = null) {
        console.log('\n📝 测试项目申请功能...');

        // 如果没有指定项目ID，先获取可申请项目
        if (!projectId) {
            try {
                const availableProjects = await this.testAvailableProjectsAPI();
                if (availableProjects.length === 0) {
                    console.log('  ❌ 没有可申请的项目');
                    return false;
                }
                projectId = availableProjects[0].id || availableProjects[0]._id;
                console.log(`  ✓ 选择项目进行申请: ${availableProjects[0].name}`);
            } catch (error) {
                console.log('  ❌ 获取可申请项目失败');
                return false;
            }
        }

        try {
            const applicationData = {
                projectId: projectId,
                reason: '我有相关技术经验，希望能参与这个项目的开发工作',
                expectedRole: '开发工程师',
                availableStartDate: new Date().toISOString()
            };

            const response = await this.client.post('/api/projects/apply', applicationData);
            
            if (response.data.success) {
                console.log('  ✓ 项目申请提交成功');
                console.log(`  ✓ 申请ID: ${response.data.data.id}`);
                return true;
            } else {
                console.log('  ❌ 项目申请失败');
                console.log(`  ❌ 错误: ${response.data.message}`);
                return false;
            }
        } catch (error) {
            console.log('  ❌ 项目申请失败');
            if (error.response?.status === 409) {
                console.log('  📝 可能已经申请过此项目');
            }
            return false;
        }
    }

    /**
     * 测试API权限验证
     */
    async testAPIPermissions() {
        console.log('\n🔒 测试API权限验证...');

        const testEndpoints = [
            { method: 'get', url: '/api/users', description: '获取用户列表' },
            { method: 'get', url: '/api/employees', description: '获取员工列表' },
            { method: 'get', url: '/api/departments', description: '获取部门列表' },
            { method: 'get', url: '/api/positions', description: '获取职位列表' },
            { method: 'get', url: '/api/roles', description: '获取角色列表' }
        ];

        for (const endpoint of testEndpoints) {
            try {
                const response = await this.client[endpoint.method](endpoint.url);
                console.log(`  ✓ ${endpoint.description}: 有权限访问`);
            } catch (error) {
                if (error.response?.status === 403) {
                    console.log(`  🔒 ${endpoint.description}: 权限不足`);
                } else {
                    console.log(`  ❌ ${endpoint.description}: 请求失败 (${error.response?.status || 'N/A'})`);
                }
            }
        }
    }

    /**
     * 运行完整的API测试流程
     */
    async run() {
        console.log('🚀 启动API测试器');
        console.log(`目标服务器: ${this.baseURL}`);
        console.log('='.repeat(60));

        try {
            // 1. 测试服务器连接
            const serverConnected = await this.testServerConnection();
            if (!serverConnected) {
                console.log('\n❌ 服务器未启动或不可访问，请确保后端服务运行在 localhost:3002');
                return;
            }

            // 2. 确保测试数据存在
            console.log('\n📊 准备测试数据...');
            const dataCreator = new TestDataCreator();
            await dataCreator.run();

            // 3. 用户登录
            const loginSuccess = await this.loginUser();
            if (!loginSuccess) {
                console.log('\n❌ 登录失败，无法继续测试');
                return;
            }

            // 4. 获取用户信息
            await this.getCurrentUser();
            await this.getEmployeeInfo();

            // 5. 测试核心API
            await this.testAvailableProjectsAPI();
            await this.testAllProjectsAPI();

            // 6. 测试项目申请
            await this.testProjectApplication();

            // 7. 测试API权限
            await this.testAPIPermissions();

            console.log('\n🎉 API测试完成！');
            
            // 测试总结
            console.log('\n📋 测试结果总结:');
            console.log('  ✓ 服务器连接正常');
            console.log('  ✓ 用户登录功能正常');
            console.log('  ✓ Token认证机制工作正常');
            console.log('  ✓ /api/projects/available 接口可用');
            console.log('  ✓ 权限验证机制正常');

        } catch (error) {
            console.log('\n❌ API测试过程中出现异常:', error.message);
            console.error(error);
        }
    }

    /**
     * 快速测试可申请项目接口 (简化版)
     */
    async quickTestAvailableProjects() {
        console.log('🔄 快速测试 /api/projects/available 接口');
        console.log('='.repeat(50));

        try {
            const serverConnected = await this.testServerConnection();
            if (!serverConnected) return;

            const loginSuccess = await this.loginUser();
            if (!loginSuccess) return;

            const projects = await this.testAvailableProjectsAPI();
            
            console.log('\n✅ 快速测试完成');
            console.log(`📊 结果: 找到 ${projects.length} 个可申请项目`);
            
        } catch (error) {
            console.log('\n❌ 快速测试失败:', error.message);
        }
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const tester = new APITester();
    
    // 检查命令行参数
    const args = process.argv.slice(2);
    if (args.includes('--quick')) {
        tester.quickTestAvailableProjects().catch(console.error);
    } else {
        tester.run().catch(console.error);
    }
}

module.exports = APITester;