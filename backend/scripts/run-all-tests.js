const path = require('path');
const { spawn } = require('child_process');

/**
 * 主测试执行脚本
 * 依次运行所有测试和验证脚本，确保在localhost:3002环境下正常工作
 */
class TestRunner {
    constructor() {
        this.scripts = [
            {
                name: 'NeDB数据查看',
                file: 'check-nedb-data.js',
                description: '读取并显示NeDB数据库内容，分析数据结构和关联关系'
            },
            {
                name: '数据一致性检查',
                file: 'data-consistency-check.js',
                description: '验证用户-员工关联关系、检查角色-权限配置、确保项目数据完整性'
            },
            {
                name: '测试数据创建',
                file: 'create-test-data.js',
                description: '确保有可申请的项目、test2用户有正确的员工记录和角色权限'
            },
            {
                name: 'API接口测试',
                file: 'test-available-api.js',
                description: '模拟用户登录获取token，测试 /api/projects/available 接口调用'
            }
        ];

        this.results = [];
    }

    /**
     * 运行单个脚本
     */
    runScript(scriptFile) {
        return new Promise((resolve) => {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`🚀 运行脚本: ${scriptFile}`);
            console.log(`${'='.repeat(60)}`);

            const scriptPath = path.join(__dirname, scriptFile);
            const child = spawn('node', [scriptPath], {
                cwd: path.join(__dirname, '..'),
                stdio: 'inherit'
            });

            const startTime = Date.now();

            child.on('close', (code) => {
                const duration = Date.now() - startTime;
                const result = {
                    script: scriptFile,
                    success: code === 0,
                    duration: duration,
                    exitCode: code
                };

                this.results.push(result);

                if (code === 0) {
                    console.log(`\n✅ ${scriptFile} 执行成功 (耗时: ${duration}ms)`);
                } else {
                    console.log(`\n❌ ${scriptFile} 执行失败 (退出码: ${code}, 耗时: ${duration}ms)`);
                }

                resolve(result);
            });

            child.on('error', (error) => {
                console.log(`\n❌ ${scriptFile} 执行出错:`, error.message);
                const result = {
                    script: scriptFile,
                    success: false,
                    duration: Date.now() - startTime,
                    error: error.message
                };
                this.results.push(result);
                resolve(result);
            });
        });
    }

    /**
     * 检查服务器状态
     */
    async checkServerStatus() {
        console.log('\n🔍 检查localhost:3002服务器状态...');

        try {
            const axios = require('axios');
            const response = await axios.get('http://localhost:3002/api/health', {
                timeout: 5000
            });
            
            console.log('✅ 服务器运行正常');
            console.log(`📊 响应状态: ${response.status}`);
            return true;
        } catch (error) {
            console.log('❌ 服务器不可访问');
            console.log(`❌ 错误: ${error.message}`);
            console.log('\n💡 请确保后端服务已启动:');
            console.log('   cd backend && npm run dev');
            return false;
        }
    }

    /**
     * 生成执行报告
     */
    generateReport() {
        console.log('\n📊 测试执行报告');
        console.log('='.repeat(60));
        
        const successCount = this.results.filter(r => r.success).length;
        const totalCount = this.results.length;
        const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

        console.log(`\n📋 执行概览:`);
        console.log(`   总脚本数: ${totalCount}`);
        console.log(`   成功数: ${successCount}`);
        console.log(`   失败数: ${totalCount - successCount}`);
        console.log(`   总耗时: ${totalDuration}ms (${(totalDuration / 1000).toFixed(2)}s)`);
        
        console.log(`\n📄 详细结果:`);
        this.results.forEach((result, index) => {
            const status = result.success ? '✅' : '❌';
            const script = this.scripts.find(s => s.file === result.script);
            console.log(`   ${index + 1}. ${status} ${script?.name || result.script}`);
            console.log(`      文件: ${result.script}`);
            console.log(`      耗时: ${result.duration}ms`);
            if (!result.success) {
                console.log(`      错误: ${result.error || `退出码 ${result.exitCode}`}`);
            }
            console.log('');
        });

        // 生成建议
        const failedScripts = this.results.filter(r => !r.success);
        if (failedScripts.length > 0) {
            console.log(`\n💡 修复建议:`);
            console.log(`   1. 确保backend服务运行在 localhost:3002`);
            console.log(`   2. 检查NeDB数据库文件是否存在于 database/ 目录`);
            console.log(`   3. 确保已安装所有必需的npm依赖`);
            console.log(`   4. 检查文件权限是否正确`);
            
            failedScripts.forEach(script => {
                console.log(`   5. 单独运行失败的脚本进行调试: node scripts/${script.script}`);
            });
        } else {
            console.log(`\n🎉 所有测试脚本执行成功！系统状态良好。`);
        }
    }

    /**
     * 创建快速测试脚本
     */
    createQuickTestScript() {
        const quickTestContent = `#!/bin/bash

# 快速测试脚本 - 用于快速验证系统状态

echo "🚀 快速测试开始..."
echo "目标: localhost:3002"

# 1. 检查数据
echo "\\n1️⃣ 检查NeDB数据..."
node scripts/check-nedb-data.js

# 2. 验证数据一致性
echo "\\n2️⃣ 验证数据一致性..."
node scripts/data-consistency-check.js

# 3. 快速API测试
echo "\\n3️⃣ 快速API测试..."
node scripts/test-available-api.js --quick

echo "\\n✅ 快速测试完成！"
`;

        const fs = require('fs');
        const quickTestPath = path.join(__dirname, 'quick-test.sh');
        
        try {
            fs.writeFileSync(quickTestPath, quickTestContent);
            console.log(`\n📄 创建快速测试脚本: ${quickTestPath}`);
            
            // 在Windows下创建.bat版本
            const quickTestBatContent = `@echo off
echo 🚀 快速测试开始...
echo 目标: localhost:3002

echo.
echo 1️⃣ 检查NeDB数据...
node scripts/check-nedb-data.js

echo.
echo 2️⃣ 验证数据一致性...
node scripts/data-consistency-check.js

echo.
echo 3️⃣ 快速API测试...
node scripts/test-available-api.js --quick

echo.
echo ✅ 快速测试完成！
pause
`;
            
            const quickTestBatPath = path.join(__dirname, 'quick-test.bat');
            fs.writeFileSync(quickTestBatPath, quickTestBatContent);
            console.log(`📄 创建快速测试脚本 (Windows): ${quickTestBatPath}`);
            
        } catch (error) {
            console.log(`❌ 创建快速测试脚本失败:`, error.message);
        }
    }

    /**
     * 运行所有测试
     */
    async run() {
        console.log('🚀 NeDB测试套件启动器');
        console.log('目标环境: localhost:3002');
        console.log('='.repeat(60));

        // 检查服务器状态
        const serverRunning = await this.checkServerStatus();
        if (!serverRunning) {
            console.log('\n⚠️  服务器未运行，部分测试可能失败');
            console.log('继续执行测试以检查数据完整性...\n');
        }

        // 依次运行所有脚本
        for (const script of this.scripts) {
            console.log(`\n📝 准备运行: ${script.name}`);
            console.log(`📄 描述: ${script.description}`);
            
            try {
                await this.runScript(script.file);
                
                // 在脚本之间添加延迟，避免资源竞争
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                console.log(`❌ 执行 ${script.name} 时出现异常:`, error.message);
            }
        }

        // 生成报告
        this.generateReport();
        
        // 创建快速测试脚本
        this.createQuickTestScript();

        console.log('\n🏁 测试套件执行完成');
    }

    /**
     * 运行指定的脚本
     */
    async runSpecific(scriptName) {
        console.log(`🎯 运行指定脚本: ${scriptName}`);
        
        const script = this.scripts.find(s => s.file === scriptName || s.name === scriptName);
        if (!script) {
            console.log(`❌ 未找到脚本: ${scriptName}`);
            console.log('可用脚本:');
            this.scripts.forEach(s => {
                console.log(`  - ${s.file} (${s.name})`);
            });
            return;
        }

        const serverRunning = await this.checkServerStatus();
        if (!serverRunning && script.file === 'test-available-api.js') {
            console.log('❌ API测试需要服务器运行，请先启动backend服务');
            return;
        }

        await this.runScript(script.file);
        this.generateReport();
    }
}

// 命令行参数处理
if (require.main === module) {
    const runner = new TestRunner();
    const args = process.argv.slice(2);

    if (args.length > 0) {
        // 运行指定脚本
        runner.runSpecific(args[0]).catch(console.error);
    } else {
        // 运行所有测试
        runner.run().catch(console.error);
    }
}

module.exports = TestRunner;