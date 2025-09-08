const http = require('http');

/**
 * 最终端到端测试脚本
 * 验证奖金模拟系统的三大核心流程
 */
class FinalE2ETest {
    constructor() {
        this.baseURL = 'http://localhost:3002'; // 使用正确的端口
        this.testResults = {
            total: 0,
            passed: 0,
            failed: 0,
            warnings: 0,
            details: []
        };
    }

    /**
     * 发送HTTP请求
     */
    async makeRequest(method, path, data = null, headers = {}) {
        return new Promise((resolve, reject) => {
            const url = new URL(path, this.baseURL);
            
            const defaultHeaders = {
                'Content-Type': 'application/json',
                'User-Agent': 'E2E-Test-Client/1.0',
                ...headers
            };

            let postData = null;
            if (data) {
                postData = JSON.stringify(data);
                defaultHeaders['Content-Length'] = Buffer.byteLength(postData);
            }

            const options = {
                hostname: url.hostname,
                port: url.port || 80,
                path: url.pathname + url.search,
                method: method.toUpperCase(),
                headers: defaultHeaders,
                timeout: 10000
            };

            const req = http.request(options, (res) => {
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

            req.on('error', reject);
            req.on('timeout', () => {
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
     * 记录测试结果
     */
    recordTest(name, passed, message = '', warning = false) {
        this.testResults.total++;
        if (passed) {
            this.testResults.passed++;
        } else {
            this.testResults.failed++;
        }
        if (warning) {
            this.testResults.warnings++;
        }

        this.testResults.details.push({
            name,
            passed,
            message,
            warning,
            timestamp: new Date().toISOString()
        });

        const status = passed ? '✅' : '❌';
        const warningFlag = warning ? ' ⚠️' : '';
        console.log(`${status}${warningFlag} ${name}: ${message}`);
    }

    /**
     * 用户登录测试
     */
    async testUserLogin(username, password, expectedRole) {
        try {
            const response = await this.makeRequest('POST', '/api/auth/login', {
                username,
                password
            });

            if (response.status === 200 && response.data?.code === 200) {
                const userData = response.data.data;
                const token = userData.token;
                const userRole = userData.user?.roleName;

                this.recordTest(
                    `用户登录: ${username}`,
                    true,
                    `成功登录，角色: ${userRole}, Token: ${token.substring(0, 20)}...`
                );

                // 验证角色是否符合预期
                if (expectedRole && userRole !== expectedRole) {
                    this.recordTest(
                        `角色验证: ${username}`,
                        false,
                        `期望角色: ${expectedRole}, 实际角色: ${userRole}`,
                        true
                    );
                }

                return { token, user: userData.user };
            } else {
                this.recordTest(
                    `用户登录: ${username}`,
                    false,
                    `登录失败: ${response.status} - ${response.data?.message || '未知错误'}`
                );
                return null;
            }
        } catch (error) {
            this.recordTest(
                `用户登录: ${username}`,
                false,
                `登录异常: ${error.message}`
            );
            return null;
        }
    }

    /**
     * API端点可用性测试
     */
    async testAPIEndpoint(name, path, token = null, expectedStatus = 200) {
        try {
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await this.makeRequest('GET', path, null, headers);
            
            if (response.status === expectedStatus) {
                this.recordTest(
                    `API端点: ${name}`,
                    true,
                    `${path} - 状态码: ${response.status}`
                );
                return response;
            } else {
                this.recordTest(
                    `API端点: ${name}`,
                    false,
                    `${path} - 期望: ${expectedStatus}, 实际: ${response.status}`
                );
                return null;
            }
        } catch (error) {
            this.recordTest(
                `API端点: ${name}`,
                false,
                `${path} - 异常: ${error.message}`
            );
            return null;
        }
    }

    /**
     * 奖金查看流程测试
     */
    async testBonusViewWorkflow() {
        console.log('\n🎯 === 奖金查看流程测试 ===');
        
        // 1. 普通员工登录并查看个人奖金
        const testUser = await this.testUserLogin('test', '1234qwer', '普通员工');
        if (testUser) {
            // 个人奖金概览
            await this.testAPIEndpoint(
                '个人奖金概览',
                '/api/bonus/personal-overview',
                testUser.token
            );

            // 个人奖金详情
            await this.testAPIEndpoint(
                '个人奖金详情',
                '/api/bonus/personal-details',
                testUser.token
            );

            // 个人奖金趋势
            await this.testAPIEndpoint(
                '个人奖金趋势',
                '/api/bonus/personal-trend',
                testUser.token
            );
        }

        // 2. 部门经理登录并查看团队奖金
        const managerUser = await this.testUserLogin('test2', '123456', '部门经理');
        if (managerUser) {
            // 团队奖金概览
            await this.testAPIEndpoint(
                '团队奖金概览',
                '/api/bonus/team-overview',
                managerUser.token
            );

            // 个人奖金查询（部门经理查看自己）
            const personalBonusResponse = await this.testAPIEndpoint(
                '部门经理个人奖金查询',
                '/api/bonus/personal-query',
                managerUser.token
            );

            if (personalBonusResponse && personalBonusResponse.data) {
                this.recordTest(
                    '部门经理奖金数据完整性',
                    true,
                    '可以访问个人奖金数据'
                );
            }
        }
    }

    /**
     * 项目申请流程测试
     */
    async testProjectApplicationWorkflow() {
        console.log('\n🎯 === 项目申请流程测试 ===');

        // 1. 测试可申请项目列表
        const testUser = await this.testUserLogin('test2', '123456', '部门经理');
        if (testUser) {
            const availableProjectsResponse = await this.testAPIEndpoint(
                '可申请项目列表',
                '/api/projects/available',
                testUser.token
            );

            if (availableProjectsResponse && availableProjectsResponse.data) {
                const projects = availableProjectsResponse.data.data || availableProjectsResponse.data;
                if (Array.isArray(projects)) {
                    this.recordTest(
                        '项目列表数据格式',
                        true,
                        `找到 ${projects.length} 个可申请项目`
                    );

                    // 测试项目详情
                    if (projects.length > 0) {
                        const firstProject = projects[0];
                        if (firstProject._id || firstProject.id) {
                            const projectId = firstProject._id || firstProject.id;
                            await this.testAPIEndpoint(
                                '项目详情查看',
                                `/api/projects/${projectId}`,
                                testUser.token
                            );
                        }
                    }
                } else {
                    this.recordTest(
                        '项目列表数据格式',
                        false,
                        '项目列表不是数组格式',
                        true
                    );
                }
            }

            // 2. 测试所有项目列表（对比）
            await this.testAPIEndpoint(
                '所有项目列表',
                '/api/projects',
                testUser.token
            );

            // 3. 测试项目成员信息
            await this.testAPIEndpoint(
                '我的项目',
                '/api/projects/my-projects',
                testUser.token
            );
        }
    }

    /**
     * 岗位晋升查看流程测试
     */
    async testPositionPromotionWorkflow() {
        console.log('\n🎯 === 岗位晋升查看流程测试 ===');

        // 1. 普通员工查看岗位大全
        const testUser = await this.testUserLogin('test', '1234qwer', null);
        if (testUser) {
            const positionsResponse = await this.testAPIEndpoint(
                '岗位大全列表',
                '/api/positions',
                testUser.token
            );

            if (positionsResponse && positionsResponse.data) {
                this.recordTest(
                    '岗位大全访问权限',
                    true,
                    '普通员工可以查看岗位大全'
                );
            }

            // 岗位级别信息
            await this.testAPIEndpoint(
                '岗位级别信息',
                '/api/positions/levels',
                testUser.token
            );

            // 岗位统计信息
            await this.testAPIEndpoint(
                '岗位统计信息',
                '/api/positions/statistics',
                testUser.token
            );
        }

        // 2. 部门经理查看和维护权限
        const managerUser = await this.testUserLogin('test2', '123456', '部门经理');
        if (managerUser) {
            // 部门信息（管理权限）
            await this.testAPIEndpoint(
                '部门信息管理',
                '/api/departments',
                managerUser.token
            );

            // 员工信息（管理权限）
            const employeesResponse = await this.testAPIEndpoint(
                '员工信息管理',
                '/api/employees',
                managerUser.token
            );

            if (employeesResponse) {
                this.recordTest(
                    '部门经理管理权限',
                    true,
                    '部门经理具有员工和部门管理权限'
                );
            }
        }
    }

    /**
     * 权限和安全测试
     */
    async testSecurityAndPermissions() {
        console.log('\n🎯 === 权限和安全测试 ===');

        // 1. 无Token访问测试
        const unauthorizedResponse = await this.testAPIEndpoint(
            '无认证访问',
            '/api/bonus/personal-overview',
            null,
            401
        );

        if (unauthorizedResponse && unauthorizedResponse.status === 401) {
            this.recordTest(
                '未授权访问拦截',
                true,
                '正确拦截无Token访问'
            );
        }

        // 2. 无效Token测试
        await this.testAPIEndpoint(
            '无效Token访问',
            '/api/bonus/personal-overview',
            'invalid-token-12345',
            401
        );

        // 3. 服务器健康检查
        await this.testAPIEndpoint(
            '服务器健康检查',
            '/api/health',
            null,
            200
        );
    }

    /**
     * 运行完整测试套件
     */
    async runCompleteTests() {
        console.log('🚀 启动完整端到端测试');
        console.log(`📡 目标服务器: ${this.baseURL}`);
        console.log('=' .repeat(80));

        const startTime = Date.now();

        try {
            // 1. 基础连通性测试
            console.log('\n🔗 === 基础连通性测试 ===');
            await this.testAPIEndpoint('服务器连通性', '/api/health', null, 200);

            // 2. 核心业务流程测试
            await this.testBonusViewWorkflow();
            await this.testProjectApplicationWorkflow();
            await this.testPositionPromotionWorkflow();

            // 3. 安全和权限测试
            await this.testSecurityAndPermissions();

            const endTime = Date.now();
            const duration = endTime - startTime;

            // 生成测试报告
            this.generateTestReport(duration);

        } catch (error) {
            console.error('\n❌ 测试执行异常:', error);
            this.recordTest('测试执行', false, `异常: ${error.message}`);
        }
    }

    /**
     * 生成测试报告
     */
    generateTestReport(duration) {
        console.log('\n' + '='.repeat(80));
        console.log('📊 === 最终测试报告 ===');
        console.log('='.repeat(80));

        const { total, passed, failed, warnings } = this.testResults;
        const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;

        console.log(`📋 测试统计:`);
        console.log(`   总测试数: ${total}`);
        console.log(`   通过: ${passed} ✅`);
        console.log(`   失败: ${failed} ❌`);
        console.log(`   警告: ${warnings} ⚠️`);
        console.log(`   通过率: ${passRate}%`);
        console.log(`   执行时间: ${duration}ms`);

        console.log(`\n🎯 核心流程测试状态:`);
        
        // 分析核心流程状态
        const bonusTests = this.testResults.details.filter(t => 
            t.name.includes('奖金') || t.name.includes('bonus')
        );
        const projectTests = this.testResults.details.filter(t => 
            t.name.includes('项目') || t.name.includes('project')
        );
        const positionTests = this.testResults.details.filter(t => 
            t.name.includes('岗位') || t.name.includes('position')
        );

        this.summarizeFlowStatus('奖金查看流程', bonusTests);
        this.summarizeFlowStatus('项目申请流程', projectTests);
        this.summarizeFlowStatus('岗位晋升查看流程', positionTests);

        if (failed > 0) {
            console.log(`\n❌ 失败测试详情:`);
            this.testResults.details
                .filter(t => !t.passed)
                .forEach(test => {
                    console.log(`   - ${test.name}: ${test.message}`);
                });
        }

        if (warnings > 0) {
            console.log(`\n⚠️ 警告详情:`);
            this.testResults.details
                .filter(t => t.warning)
                .forEach(test => {
                    console.log(`   - ${test.name}: ${test.message}`);
                });
        }

        console.log(`\n💡 改进建议:`);
        if (failed > 0) {
            console.log(`   - 修复 ${failed} 个失败测试以提高系统稳定性`);
        }
        if (warnings > 0) {
            console.log(`   - 关注 ${warnings} 个警告项以优化系统表现`);
        }
        if (passRate >= 90) {
            console.log(`   - 系统状态良好，建议定期执行回归测试`);
        } else {
            console.log(`   - 通过率较低，建议优先修复核心功能问题`);
        }

        const status = passRate >= 80 ? '🎉 测试通过' : '🔧 需要修复';
        console.log(`\n${status} - 系统整体状态: ${passRate >= 80 ? '良好' : '需要改进'}`);
        console.log('='.repeat(80));
    }

    /**
     * 总结流程状态
     */
    summarizeFlowStatus(flowName, tests) {
        if (tests.length === 0) {
            console.log(`   ${flowName}: ⚪ 未测试`);
            return;
        }

        const passed = tests.filter(t => t.passed).length;
        const total = tests.length;
        const rate = ((passed / total) * 100).toFixed(0);
        
        let status;
        if (rate >= 90) status = '🟢 优秀';
        else if (rate >= 70) status = '🟡 良好';
        else status = '🔴 需要修复';

        console.log(`   ${flowName}: ${status} (${passed}/${total}, ${rate}%)`);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const tester = new FinalE2ETest();
    tester.runCompleteTests().catch(console.error);
}

module.exports = FinalE2ETest;