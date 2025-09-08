import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

interface TestMetrics {
  duration: number
  retries: number
  status: string
  error?: string
  annotations: Array<{ type: string; description?: string }>
}

interface SuiteMetrics {
  name: string
  tests: TestMetrics[]
  totalDuration: number
  passRate: number
  performanceIssues: number
  securityIssues: number
}

/**
 * Custom Reporter for Comprehensive E2E Tests
 * Tracks performance, security, and bug fix validation metrics
 */
class ComprehensiveTestReporter implements Reporter {
  private suites: Map<string, SuiteMetrics> = new Map()
  private startTime: number = Date.now()
  private performanceThresholds = {
    pageLoad: 3000, // 3 seconds
    apiResponse: 500, // 500ms
    dbQuery: 200 // 200ms
  }

  onBegin() {
    console.log('🚀 Starting Comprehensive E2E Test Suite...')
    console.log('📋 Focus Areas:')
    console.log('  • Authentication & Authorization (JWT/RBAC)')
    console.log('  • API Integration & Error Handling') 
    console.log('  • Performance & Database Optimizations')
    console.log('  • Security Vulnerabilities')
    console.log('  • Bonus Calculation Engine')
    console.log('  • Bug Fix Regression Testing')
    console.log('')
  }

  onTestBegin(test: TestCase) {
    const suiteName = this.getSuiteName(test)
    
    if (!this.suites.has(suiteName)) {
      this.suites.set(suiteName, {
        name: suiteName,
        tests: [],
        totalDuration: 0,
        passRate: 0,
        performanceIssues: 0,
        securityIssues: 0
      })
    }
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const suiteName = this.getSuiteName(test)
    const suite = this.suites.get(suiteName)!
    
    const testMetric: TestMetrics = {
      duration: result.duration,
      retries: result.retry,
      status: result.status,
      error: result.error?.message,
      annotations: result.annotations
    }

    // Check for performance issues
    if (this.isPerformanceTest(test)) {
      if (result.duration > this.getPerformanceThreshold(test)) {
        suite.performanceIssues++
        testMetric.annotations.push({
          type: 'performance-issue',
          description: `Exceeded threshold: ${result.duration}ms > ${this.getPerformanceThreshold(test)}ms`
        })
      }
    }

    // Check for security issues
    if (this.isSecurityTest(test) && result.status !== 'passed') {
      suite.securityIssues++
      testMetric.annotations.push({
        type: 'security-issue',
        description: 'Security test failed - potential vulnerability'
      })
    }

    suite.tests.push(testMetric)
    suite.totalDuration += result.duration
    
    // Update pass rate
    const passedTests = suite.tests.filter(t => t.status === 'passed').length
    suite.passRate = (passedTests / suite.tests.length) * 100

    // Log test result with context
    this.logTestResult(test, result)
  }

  onEnd(result: FullResult) {
    const endTime = Date.now()
    const totalDuration = endTime - this.startTime

    console.log('\n📊 Comprehensive Test Results Summary:')
    console.log('=' .repeat(60))

    // Overall statistics
    const totalTests = Array.from(this.suites.values())
      .reduce((sum, suite) => sum + suite.tests.length, 0)
    const totalPassed = Array.from(this.suites.values())
      .reduce((sum, suite) => sum + suite.tests.filter(t => t.status === 'passed').length, 0)
    const overallPassRate = (totalPassed / totalTests) * 100

    console.log(`📈 Overall Statistics:`)
    console.log(`   Total Tests: ${totalTests}`)
    console.log(`   Passed: ${totalPassed} (${overallPassRate.toFixed(1)}%)`)
    console.log(`   Failed: ${totalTests - totalPassed}`)
    console.log(`   Duration: ${this.formatDuration(totalDuration)}`)
    console.log('')

    // Suite-by-suite breakdown
    for (const [suiteName, suite] of this.suites.entries()) {
      this.printSuiteResults(suite)
    }

    // Bug fix validation summary
    this.printBugFixValidation()

    // Performance analysis
    this.printPerformanceAnalysis()

    // Security analysis
    this.printSecurityAnalysis()

    // Generate detailed reports
    this.generateDetailedReport(totalDuration, overallPassRate)

    // Final verdict
    this.printFinalVerdict(overallPassRate, result.status)
  }

  private getSuiteName(test: TestCase): string {
    const file = test.location.file
    if (file.includes('auth-security')) return 'Authentication & Security'
    if (file.includes('api-integration')) return 'API Integration'
    if (file.includes('performance')) return 'Performance'
    if (file.includes('database')) return 'Database Layer'
    if (file.includes('bonus-calculation')) return 'Bonus Calculation'
    if (file.includes('regression')) return 'Regression Tests'
    if (file.includes('security')) return 'Security Tests'
    if (file.includes('critical-path')) return 'Critical Path'
    return 'Other'
  }

  private isPerformanceTest(test: TestCase): boolean {
    return test.title.toLowerCase().includes('performance') ||
           test.title.toLowerCase().includes('load') ||
           test.title.toLowerCase().includes('response time')
  }

  private isSecurityTest(test: TestCase): boolean {
    return test.title.toLowerCase().includes('security') ||
           test.title.toLowerCase().includes('auth') ||
           test.title.toLowerCase().includes('permission') ||
           test.title.toLowerCase().includes('xss') ||
           test.title.toLowerCase().includes('injection')
  }

  private getPerformanceThreshold(test: TestCase): number {
    if (test.title.toLowerCase().includes('page load')) return this.performanceThresholds.pageLoad
    if (test.title.toLowerCase().includes('api')) return this.performanceThresholds.apiResponse
    if (test.title.toLowerCase().includes('database') || test.title.toLowerCase().includes('query')) {
      return this.performanceThresholds.dbQuery
    }
    return this.performanceThresholds.apiResponse // default
  }

  private logTestResult(test: TestCase, result: TestResult) {
    const icon = result.status === 'passed' ? '✅' :
                result.status === 'failed' ? '❌' :
                result.status === 'skipped' ? '⏭️' : '⚠️'
    
    const duration = this.formatDuration(result.duration)
    const retryInfo = result.retry > 0 ? ` (retry ${result.retry})` : ''
    
    console.log(`${icon} ${test.title} - ${duration}${retryInfo}`)
    
    if (result.error) {
      console.log(`   💥 Error: ${result.error.message}`)
    }

    // Log performance metrics if applicable
    if (this.isPerformanceTest(test)) {
      const threshold = this.getPerformanceThreshold(test)
      const status = result.duration <= threshold ? '🚀 FAST' : '🐌 SLOW'
      console.log(`   ⏱️ Performance: ${status} (${result.duration}ms / ${threshold}ms)`)
    }
  }

  private printSuiteResults(suite: SuiteMetrics) {
    console.log(`📂 ${suite.name}:`)
    console.log(`   Tests: ${suite.tests.length}`)
    console.log(`   Pass Rate: ${suite.passRate.toFixed(1)}%`)
    console.log(`   Duration: ${this.formatDuration(suite.totalDuration)}`)
    
    if (suite.performanceIssues > 0) {
      console.log(`   🐌 Performance Issues: ${suite.performanceIssues}`)
    }
    
    if (suite.securityIssues > 0) {
      console.log(`   🔒 Security Issues: ${suite.securityIssues}`)
    }
    
    console.log('')
  }

  private printBugFixValidation() {
    console.log('🔧 Bug Fix Validation:')
    
    const regressionSuite = this.suites.get('Regression Tests')
    if (regressionSuite) {
      const passedTests = regressionSuite.tests.filter(t => t.status === 'passed').length
      const totalTests = regressionSuite.tests.length
      
      console.log(`   Fixed Bugs Verified: ${passedTests}/${totalTests}`)
      
      if (passedTests === totalTests) {
        console.log('   ✅ All bug fixes are working correctly!')
      } else {
        console.log('   ⚠️ Some bug fixes may have regressed!')
      }
    } else {
      console.log('   ⚠️ No regression tests found!')
    }
    
    console.log('')
  }

  private printPerformanceAnalysis() {
    console.log('🚀 Performance Analysis:')
    
    const performanceSuite = this.suites.get('Performance')
    if (performanceSuite) {
      console.log(`   Performance Issues: ${performanceSuite.performanceIssues}`)
      
      const avgDuration = performanceSuite.totalDuration / performanceSuite.tests.length
      console.log(`   Average Test Duration: ${this.formatDuration(avgDuration)}`)
      
      if (performanceSuite.performanceIssues === 0) {
        console.log('   ✅ All performance optimizations are working!')
      } else {
        console.log('   ⚠️ Some performance issues detected!')
      }
    }
    
    console.log('')
  }

  private printSecurityAnalysis() {
    console.log('🔒 Security Analysis:')
    
    const securitySuite = this.suites.get('Security Tests')
    const authSuite = this.suites.get('Authentication & Security')
    
    const totalSecurityIssues = (securitySuite?.securityIssues || 0) + 
                               (authSuite?.securityIssues || 0)
    
    console.log(`   Security Issues Found: ${totalSecurityIssues}`)
    
    if (totalSecurityIssues === 0) {
      console.log('   ✅ All security measures are working correctly!')
    } else {
      console.log('   ⚠️ Security vulnerabilities detected!')
    }
    
    console.log('')
  }

  private generateDetailedReport(totalDuration: number, overallPassRate: number) {
    const reportDir = 'comprehensive-e2e-report'
    
    try {
      mkdirSync(reportDir, { recursive: true })
    } catch {
      // Directory might already exist
    }

    // Generate JSON report
    const report = {
      testSuite: 'Comprehensive E2E Tests',
      timestamp: new Date().toISOString(),
      summary: {
        totalDuration,
        overallPassRate,
        suites: Array.from(this.suites.entries()).map(([name, suite]) => ({
          name,
          ...suite
        }))
      },
      bugFixValidation: this.getBugFixValidationData(),
      performanceAnalysis: this.getPerformanceAnalysisData(),
      securityAnalysis: this.getSecurityAnalysisData()
    }

    writeFileSync(
      join(reportDir, 'detailed-report.json'), 
      JSON.stringify(report, null, 2)
    )

    // Generate markdown report
    const markdownReport = this.generateMarkdownReport(report)
    writeFileSync(join(reportDir, 'test-report.md'), markdownReport)

    console.log(`📄 Detailed reports generated in: ${reportDir}/`)
  }

  private printFinalVerdict(overallPassRate: number, status: string) {
    console.log('🏆 Final Verdict:')
    console.log('=' .repeat(60))
    
    if (status === 'passed' && overallPassRate >= 95) {
      console.log('✅ EXCELLENT: All bug fixes and optimizations are working correctly!')
      console.log('🚀 System is ready for production deployment.')
    } else if (overallPassRate >= 90) {
      console.log('✅ GOOD: Most bug fixes and optimizations are working.')
      console.log('⚠️ Minor issues detected - review recommended.')
    } else if (overallPassRate >= 80) {
      console.log('⚠️ FAIR: Some issues detected with bug fixes or optimizations.')
      console.log('🔧 Investigation and fixes needed before deployment.')
    } else {
      console.log('❌ POOR: Significant issues detected!')
      console.log('🚨 Critical fixes needed before deployment.')
    }
    
    console.log('')
  }

  private getBugFixValidationData() {
    const regressionSuite = this.suites.get('Regression Tests')
    return {
      totalBugFixes: regressionSuite?.tests.length || 0,
      verifiedFixes: regressionSuite?.tests.filter(t => t.status === 'passed').length || 0,
      failedValidations: regressionSuite?.tests.filter(t => t.status === 'failed').length || 0
    }
  }

  private getPerformanceAnalysisData() {
    const performanceSuite = this.suites.get('Performance')
    return {
      performanceTests: performanceSuite?.tests.length || 0,
      performanceIssues: performanceSuite?.performanceIssues || 0,
      averageDuration: performanceSuite ? 
        performanceSuite.totalDuration / performanceSuite.tests.length : 0
    }
  }

  private getSecurityAnalysisData() {
    const securitySuite = this.suites.get('Security Tests')
    const authSuite = this.suites.get('Authentication & Security')
    
    return {
      securityTests: (securitySuite?.tests.length || 0) + (authSuite?.tests.length || 0),
      securityIssues: (securitySuite?.securityIssues || 0) + (authSuite?.securityIssues || 0),
      authTests: authSuite?.tests.length || 0
    }
  }

  private generateMarkdownReport(report: any): string {
    return `
# Comprehensive E2E Test Report

**Generated:** ${report.timestamp}  
**Test Suite:** ${report.testSuite}  
**Overall Pass Rate:** ${report.summary.overallPassRate.toFixed(1)}%  
**Total Duration:** ${this.formatDuration(report.summary.totalDuration)}

## 📊 Test Suite Results

${report.summary.suites.map((suite: any) => `
### ${suite.name}
- **Tests:** ${suite.tests.length}
- **Pass Rate:** ${suite.passRate.toFixed(1)}%
- **Duration:** ${this.formatDuration(suite.totalDuration)}
- **Performance Issues:** ${suite.performanceIssues}
- **Security Issues:** ${suite.securityIssues}
`).join('')}

## 🔧 Bug Fix Validation
- **Total Bug Fixes Tested:** ${report.bugFixValidation.totalBugFixes}
- **Verified Working:** ${report.bugFixValidation.verifiedFixes}
- **Failed Validations:** ${report.bugFixValidation.failedValidations}

## 🚀 Performance Analysis
- **Performance Tests:** ${report.performanceAnalysis.performanceTests}
- **Performance Issues:** ${report.performanceAnalysis.performanceIssues}
- **Average Duration:** ${this.formatDuration(report.performanceAnalysis.averageDuration)}

## 🔒 Security Analysis
- **Security Tests:** ${report.securityAnalysis.securityTests}
- **Security Issues:** ${report.securityAnalysis.securityIssues}
- **Authentication Tests:** ${report.securityAnalysis.authTests}

---
Generated by Comprehensive E2E Test Reporter
    `.trim()
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
  }
}

export default ComprehensiveTestReporter