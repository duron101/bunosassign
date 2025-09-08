#!/usr/bin/env node

/**
 * 端到端测试执行器
 * 运行完整的奖金模拟系统测试套件并生成详细报告
 */

const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

console.log('🚀 启动奖金模拟系统端到端测试套件')
console.log('=' .repeat(60))

// 测试配置
const testConfig = {
  testFile: 'comprehensive-e2e.test.js',
  timeout: 120000, // 2分钟超时
  verbose: true,
  detectOpenHandles: true,
  forceExit: true
}

// 生成时间戳
const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const reportDir = path.join(__dirname, '..', '..', 'test-reports')
const reportFile = path.join(reportDir, `e2e-test-report-${timestamp}.json`)

// 确保报告目录存在
if (!fs.existsSync(reportDir)) {
  fs.mkdirSync(reportDir, { recursive: true })
}

// Jest 命令行参数
const jestArgs = [
  testConfig.testFile,
  '--verbose',
  '--detectOpenHandles', 
  '--forceExit',
  '--testTimeout', testConfig.timeout.toString(),
  '--json',
  '--outputFile', reportFile
]

console.log(`📂 测试文件: ${testConfig.testFile}`)
console.log(`⏱️  超时设置: ${testConfig.timeout}ms`)
console.log(`📊 报告输出: ${reportFile}`)
console.log('')

// 启动测试
const jestProcess = spawn('npx', ['jest', ...jestArgs], {
  cwd: path.join(__dirname, '..', '..'),
  stdio: 'pipe'
})

let testOutput = ''
let testError = ''

// 实时输出测试结果
jestProcess.stdout.on('data', (data) => {
  const output = data.toString()
  testOutput += output
  
  // 过滤和美化输出
  const lines = output.split('\n')
  lines.forEach(line => {
    if (line.trim()) {
      // 高亮重要信息
      if (line.includes('✅') || line.includes('PASS')) {
        console.log(`\x1b[32m${line}\x1b[0m`) // 绿色
      } else if (line.includes('❌') || line.includes('FAIL')) {
        console.log(`\x1b[31m${line}\x1b[0m`) // 红色
      } else if (line.includes('⚠️') || line.includes('WARNING')) {
        console.log(`\x1b[33m${line}\x1b[0m`) // 黄色
      } else if (line.includes('🚀') || line.includes('🎯') || line.includes('📚')) {
        console.log(`\x1b[36m${line}\x1b[0m`) // 青色
      } else {
        console.log(line)
      }
    }
  })
})

jestProcess.stderr.on('data', (data) => {
  const error = data.toString()
  testError += error
  
  // 只输出重要错误
  if (error.includes('Error') || error.includes('Failed')) {
    console.error(`\x1b[31m${error}\x1b[0m`)
  }
})

// 测试完成处理
jestProcess.on('close', (code) => {
  console.log('')
  console.log('=' .repeat(60))
  console.log(`🏁 测试执行完成 - 退出码: ${code}`)
  
  // 尝试读取和解析测试报告
  setTimeout(() => {
    try {
      if (fs.existsSync(reportFile)) {
        const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'))
        generateEnhancedReport(report, testOutput)
      } else {
        console.log('⚠️  未找到JSON报告文件，生成简化报告')
        generateSimpleReport(testOutput, testError, code)
      }
    } catch (error) {
      console.log('⚠️  报告解析失败，生成简化报告')
      generateSimpleReport(testOutput, testError, code)
    }
  }, 1000)
})

// 生成增强版报告（基于Jest JSON输出）
function generateEnhancedReport(jestReport, testOutput) {
  console.log('')
  console.log('📋 详细测试报告')
  console.log('=' .repeat(60))
  
  // 基本统计信息
  console.log(`📊 测试统计:`)
  console.log(`   总测试套件: ${jestReport.numTotalTestSuites}`)
  console.log(`   通过套件: ${jestReport.numPassedTestSuites}`)
  console.log(`   失败套件: ${jestReport.numFailedTestSuites}`)
  console.log(`   总测试用例: ${jestReport.numTotalTests}`)
  console.log(`   通过用例: ${jestReport.numPassedTests}`)
  console.log(`   失败用例: ${jestReport.numFailedTests}`)
  console.log(`   跳过用例: ${jestReport.numPendingTests}`)
  console.log(`   执行时间: ${(jestReport.runTime / 1000).toFixed(2)}s`)
  
  // 测试结果
  if (jestReport.success) {
    console.log(`\n✅ 整体结果: 测试通过`)
  } else {
    console.log(`\n❌ 整体结果: 测试失败`)
  }
  
  // 详细测试套件结果
  if (jestReport.testResults && jestReport.testResults.length > 0) {
    console.log(`\n📋 测试套件详情:`)
    
    jestReport.testResults.forEach((suite, index) => {
      const suiteName = path.basename(suite.testFilePath)
      const status = suite.status === 'passed' ? '✅' : '❌'
      const duration = (suite.perfStats.end - suite.perfStats.start) / 1000
      
      console.log(`\n${index + 1}. ${status} ${suiteName} (${duration.toFixed(2)}s)`)
      
      if (suite.assertionResults) {
        suite.assertionResults.forEach((test) => {
          const testStatus = test.status === 'passed' ? '  ✅' : 
                           test.status === 'failed' ? '  ❌' : '  ⏸️'
          console.log(`${testStatus} ${test.title} (${test.duration || 0}ms)`)
          
          if (test.failureMessages && test.failureMessages.length > 0) {
            test.failureMessages.forEach(msg => {
              console.log(`      🚨 ${msg.split('\n')[0]}`)
            })
          }
        })
      }
    })
  }
  
  // 性能分析
  analyzePerformance(testOutput)
  
  // 生成建议
  generateRecommendations(jestReport, testOutput)
}

// 生成简化报告
function generateSimpleReport(testOutput, testError, exitCode) {
  console.log('')
  console.log('📋 简化测试报告')
  console.log('=' .repeat(60))
  
  // 从输出中提取信息
  const lines = testOutput.split('\n')
  let passCount = 0, failCount = 0, warnCount = 0
  
  lines.forEach(line => {
    if (line.includes('✅') || line.includes('passed')) passCount++
    if (line.includes('❌') || line.includes('failed')) failCount++
    if (line.includes('⚠️') || line.includes('warning')) warnCount++
  })
  
  console.log(`📊 估算统计:`)
  console.log(`   通过测试: ${passCount}`)
  console.log(`   失败测试: ${failCount}`)
  console.log(`   警告数量: ${warnCount}`)
  console.log(`   退出代码: ${exitCode}`)
  
  if (exitCode === 0) {
    console.log(`\n✅ 整体结果: 测试可能通过`)
  } else {
    console.log(`\n❌ 整体结果: 测试可能失败`)
  }
  
  // 错误信息
  if (testError.trim()) {
    console.log(`\n🚨 错误信息:`)
    console.log(testError.trim())
  }
  
  analyzePerformance(testOutput)
}

// 性能分析
function analyzePerformance(testOutput) {
  console.log(`\n⚡ 性能分析:`)
  
  const lines = testOutput.split('\n')
  const responseTimes = []
  
  lines.forEach(line => {
    const match = line.match(/(\d+)ms/)
    if (match) {
      responseTimes.push(parseInt(match[1]))
    }
  })
  
  if (responseTimes.length > 0) {
    const avg = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    const max = Math.max(...responseTimes)
    const min = Math.min(...responseTimes)
    const slow = responseTimes.filter(time => time > 2000).length
    
    console.log(`   📊 响应时间统计:`)
    console.log(`      平均响应时间: ${avg.toFixed(2)}ms`)
    console.log(`      最快响应: ${min}ms`)
    console.log(`      最慢响应: ${max}ms`)
    console.log(`      慢响应(>2s): ${slow} 个`)
    
    if (avg > 1000) {
      console.log(`   ⚠️  平均响应时间较慢，建议优化`)
    }
  } else {
    console.log(`   📊 未检测到性能数据`)
  }
}

// 生成建议
function generateRecommendations(jestReport, testOutput) {
  console.log(`\n💡 改进建议:`)
  
  const suggestions = []
  
  // 基于测试结果的建议
  if (jestReport && jestReport.numFailedTests > 0) {
    suggestions.push('修复失败的测试用例以确保系统稳定性')
  }
  
  if (jestReport && jestReport.runTime > 60000) {
    suggestions.push('测试执行时间较长，考虑并行化测试或优化测试数据')
  }
  
  // 基于输出的建议
  if (testOutput.includes('未关联员工信息')) {
    suggestions.push('完善测试用户的员工数据关联，确保业务流程完整')
  }
  
  if (testOutput.includes('权限不足')) {
    suggestions.push('检查测试用户的权限配置，确保测试覆盖所有权限场景')
  }
  
  if (testOutput.includes('响应时间较慢') || testOutput.includes('超过')) {
    suggestions.push('优化API响应性能，特别是超过1秒的端点')
  }
  
  if (suggestions.length === 0) {
    suggestions.push('测试运行良好，继续保持代码质量')
  }
  
  suggestions.forEach((suggestion, index) => {
    console.log(`   ${index + 1}. ${suggestion}`)
  })
}

console.log('')
console.log('⏳ 开始执行测试...')
console.log('')