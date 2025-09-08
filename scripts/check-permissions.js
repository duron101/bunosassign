/**
 * 权限配置检查脚本
 * 用于检查NeDB数据库中的用户角色权限配置
 */

const Datastore = require('nedb');
const path = require('path');

// 初始化数据库
const databases = {
  users: new Datastore({ filename: path.join(__dirname, '../database/users.db'), autoload: true }),
  roles: new Datastore({ filename: path.join(__dirname, '../database/roles.db'), autoload: true }),
  employees: new Datastore({ filename: path.join(__dirname, '../database/employees.db'), autoload: true }),
  projects: new Datastore({ filename: path.join(__dirname, '../database/projects.db'), autoload: true })
};

console.log('🔍 开始检查权限配置...\n');

// 检查用户数据
function checkUsers() {
  return new Promise((resolve, reject) => {
    databases.users.find({}, (err, users) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log('👥 用户数据检查:');
      console.log(`总用户数: ${users.length}`);
      
      users.forEach(user => {
        console.log(`- 用户: ${user.username} (ID: ${user._id})`);
        console.log(`  角色ID: ${user.roleId || 'undefined'}`);
        console.log(`  员工ID: ${user.employeeId || 'undefined'}`);
        console.log(`  状态: ${user.isActive ? '激活' : '禁用'}`);
      });
      
      console.log('');
      resolve(users);
    });
  });
}

// 检查角色数据
function checkRoles() {
  return new Promise((resolve, reject) => {
    databases.roles.find({}, (err, roles) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log('👤 角色数据检查:');
      console.log(`总角色数: ${roles.length}`);
      
      roles.forEach(role => {
        console.log(`- 角色: ${role.name} (ID: ${role._id})`);
        console.log(`  描述: ${role.description || 'N/A'}`);
        console.log(`  权限数量: ${role.permissions ? role.permissions.length : 0}`);
        if (role.permissions && role.permissions.length > 0) {
          console.log(`  权限列表: ${role.permissions.slice(0, 5).join(', ')}${role.permissions.length > 5 ? '...' : ''}`);
        }
      });
      
      console.log('');
      resolve(roles);
    });
  });
}

// 检查员工数据
function checkEmployees() {
  return new Promise((resolve, reject) => {
    databases.employees.find({}, (err, employees) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log('👨‍💼 员工数据检查:');
      console.log(`总员工数: ${employees.length}`);
      
      employees.forEach(employee => {
        console.log(`- 员工: ${employee.name} (ID: ${employee._id})`);
        console.log(`  员工号: ${employee.employeeNumber || 'N/A'}`);
        console.log(`  部门ID: ${employee.departmentId || 'N/A'}`);
        console.log(`  岗位ID: ${employee.positionId || 'N/A'}`);
        console.log(`  状态: ${employee.status || 'N/A'}`);
      });
      
      console.log('');
      resolve(employees);
    });
  });
}

// 检查项目数据
function checkProjects() {
  return new Promise((resolve, reject) => {
    databases.projects.find({}, (err, projects) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log('📋 项目数据检查:');
      console.log(`总项目数: ${projects.length}`);
      
      projects.forEach(project => {
        console.log(`- 项目: ${project.name} (ID: ${project._id})`);
        console.log(`  状态: ${project.status || 'N/A'}`);
        console.log(`  经理ID: ${project.managerId || 'N/A'}`);
        console.log(`  预算: ${project.budget || 'N/A'}`);
      });
      
      console.log('');
      resolve(projects);
    });
  });
}

// 分析权限配置问题
function analyzePermissionIssues(users, roles, employees, projects) {
  console.log('🔍 权限配置问题分析:\n');
  
  const issues = [];
  
  // 检查test2用户的权限配置
  const test2User = users.find(u => u.username === 'test2');
  if (test2User) {
    console.log('📊 test2用户详细分析:');
    console.log(`- 用户名: ${test2User.username}`);
    console.log(`- 角色ID: ${test2User.roleId}`);
    console.log(`- 员工ID: ${test2User.employeeId}`);
    
    // 查找对应角色
    const userRole = roles.find(r => r._id === test2User.roleId);
    if (userRole) {
      console.log(`- 角色名称: ${userRole.name}`);
      console.log(`- 角色权限: ${userRole.permissions ? userRole.permissions.join(', ') : 'N/A'}`);
      
      // 检查是否有项目查看权限
      if (!userRole.permissions || !userRole.permissions.includes('project:view')) {
        issues.push(`test2用户缺少 project:view 权限`);
      }
      
      // 检查是否有奖金查看权限
      if (!userRole.permissions || !userRole.permissions.includes('bonus:view')) {
        issues.push(`test2用户缺少 bonus:view 权限`);
      }
    } else {
      issues.push(`test2用户的角色ID ${test2User.roleId} 在角色表中不存在`);
    }
    
    // 查找对应员工记录
    const employee = employees.find(e => e._id === test2User.employeeId);
    if (employee) {
      console.log(`- 员工姓名: ${employee.name}`);
      console.log(`- 员工状态: ${employee.status}`);
      if (employee.status !== 'active') {
        issues.push(`test2对应的员工状态为: ${employee.status}，可能影响访问`);
      }
    } else {
      issues.push(`test2用户的员工ID ${test2User.employeeId} 在员工表中不存在`);
    }
  } else {
    issues.push('test2用户不存在');
  }
  
  // 检查项目状态
  const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'planning');
  if (activeProjects.length === 0) {
    issues.push('没有处于活跃状态的项目');
  }
  
  console.log('\n');
  
  // 输出问题总结
  if (issues.length > 0) {
    console.log('❌ 发现的问题:');
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  } else {
    console.log('✅ 权限配置检查通过');
  }
  
  return issues;
}

// 生成修复建议
function generateFixSuggestions(issues, users, roles) {
  console.log('\n🔧 修复建议:\n');
  
  const test2User = users.find(u => u.username === 'test2');
  if (test2User) {
    const userRole = roles.find(r => r._id === test2User.roleId);
    
    if (userRole) {
      console.log(`1. 为角色 "${userRole.name}" 添加必要权限:`);
      
      const requiredPermissions = [
        'project:view',
        'bonus:view',
        'employee:view',
        'report:personal'
      ];
      
      const missingPermissions = requiredPermissions.filter(p => 
        !userRole.permissions || !userRole.permissions.includes(p)
      );
      
      if (missingPermissions.length > 0) {
        console.log(`   缺少权限: ${missingPermissions.join(', ')}`);
        console.log(`   建议执行SQL: 更新角色权限`);
      }
    }
  }
  
  console.log('\n2. 建议的角色权限配置:');
  console.log('   - 普通员工: [project:view, bonus:view, employee:view, report:personal]');
  console.log('   - 项目经理: [project:*, team:*, member:*, bonus:view, report:view]');
  console.log('   - HR专员: [employee:*, position:view, report:view]');
  console.log('   - 财务管理员: [bonus:*, calculation:*, simulation:*, report:*]');
  console.log('   - 系统管理员: [*] (所有权限)');
}

// 主函数
async function main() {
  try {
    const users = await checkUsers();
    const roles = await checkRoles();
    const employees = await checkEmployees();
    const projects = await checkProjects();
    
    const issues = analyzePermissionIssues(users, roles, employees, projects);
    generateFixSuggestions(issues, users, roles);
    
  } catch (error) {
    console.error('❌ 检查过程中出现错误:', error);
  }
}

// 运行检查
main();