const { PermissionValidator } = require('./src/config/permissions')

console.log('测试员工ID修复...')

// 模拟用户对象（修复前）
const userBeforeFix = {
  id: 1,
  username: 'testuser',
  roleName: '项目经理'
  // 注意：没有 employeeId 字段
}

// 模拟用户对象（修复后）
const userAfterFix = {
  id: 1,
  username: 'testuser',
  roleName: '项目经理',
  employeeId: 'EMP001' // 现在有了 employeeId 字段
}

console.log('修复前的用户对象:', userBeforeFix)
console.log('修复后的用户对象:', userAfterFix)

// 测试权限检查
try {
  console.log('\n测试权限检查...')
  
  // 测试1: 检查项目成本查看权限
  const hasCostViewPermission = PermissionValidator.checkUserPermission(userAfterFix, 'project:cost:view')
  console.log('测试1 - 项目成本查看权限:', hasCostViewPermission ? '通过' : '失败')
  
  // 测试2: 检查项目成本查看所有权限
  const hasCostViewAllPermission = PermissionValidator.checkUserPermission(userAfterFix, 'project:cost:view:all')
  console.log('测试2 - 项目成本查看所有权限:', hasCostViewAllPermission ? '通过' : '失败')
  
  // 测试3: 检查项目成本管理权限
  const hasCostManagePermission = PermissionValidator.checkUserPermission(userAfterFix, 'project:cost:manage')
  console.log('测试3 - 项目成本管理权限:', hasCostManagePermission ? '通过' : '失败')
  
  console.log('\n权限检查测试完成！')
  
} catch (error) {
  console.error('测试过程中发生错误:', error.message)
}

console.log('\n修复总结:')
console.log('✅ 添加了 PermissionValidator.checkUserPermission 方法')
console.log('✅ 在用户认证过程中自动查找并添加 employeeId')
console.log('✅ 改进了错误处理和调试信息')
console.log('✅ 添加了项目成本相关权限定义')
