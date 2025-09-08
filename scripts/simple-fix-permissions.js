/**
 * 简化权限修复脚本
 * 只处理关键的权限配置问题
 */

const Datastore = require('nedb');
const path = require('path');

// 初始化数据库
const databases = {
  users: new Datastore({ filename: path.join(__dirname, '../database/users.db'), autoload: true }),
  roles: new Datastore({ filename: path.join(__dirname, '../database/roles.db'), autoload: true }),
  employees: new Datastore({ filename: path.join(__dirname, '../database/employees.db'), autoload: true })
};

console.log('🔧 开始简化权限修复...\n');

// 激活所有用户
async function activateAllUsers() {
  return new Promise((resolve, reject) => {
    databases.users.update(
      {},
      { $set: { isActive: true } },
      { multi: true },
      (err, numReplaced) => {
        if (err) {
          reject(err);
          return;
        }
        
        console.log(`✅ 激活了 ${numReplaced} 个用户账户`);
        resolve();
      }
    );
  });
}

// 为test2用户关联现有员工
async function linkTest2ToEmployee() {
  return new Promise((resolve, reject) => {
    // 找到一个合适的员工记录
    databases.employees.findOne({ name: '吴部门经理' }, (err, employee) => {
      if (err || !employee) {
        // 如果没有找到，使用任意一个员工
        databases.employees.findOne({}, (err2, anyEmployee) => {
          if (err2 || !anyEmployee) {
            console.log('⚠️  没有找到员工记录，跳过关联');
            resolve();
            return;
          }
          
          linkUserToEmployee('test2', anyEmployee, resolve, reject);
        });
        return;
      }
      
      linkUserToEmployee('test2', employee, resolve, reject);
    });
  });
}

function linkUserToEmployee(username, employee, resolve, reject) {
  databases.users.update(
    { username: username },
    { $set: { employeeId: employee._id } },
    {},
    (updateErr, numReplaced) => {
      if (updateErr) {
        reject(updateErr);
        return;
      }
      
      if (numReplaced > 0) {
        console.log(`✅ 为用户 ${username} 关联员工: ${employee.name} (${employee._id})`);
      }
      resolve();
    }
  );
}

// 修复关键角色权限
async function fixCriticalRolePermissions() {
  const roleUpdates = [
    {
      name: '部门经理',
      addPermissions: ['bonus:view', 'report:personal', 'simulation:view', 'bonus_pool:view']
    },
    {
      name: '普通员工', 
      addPermissions: ['bonus:view', 'notification:view']
    },
    {
      name: '项目经理',
      addPermissions: ['bonus:view', 'simulation:view', 'report:view', 'report:export']
    }
  ];
  
  for (const update of roleUpdates) {
    await updateRolePermissions(update.name, update.addPermissions);
  }
}

async function updateRolePermissions(roleName, additionalPermissions) {
  return new Promise((resolve, reject) => {
    databases.roles.findOne({ name: roleName }, (err, role) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!role) {
        console.log(`⚠️  角色 "${roleName}" 不存在，跳过`);
        resolve();
        return;
      }
      
      const currentPermissions = role.permissions || [];
      const newPermissions = additionalPermissions.filter(p => !currentPermissions.includes(p));
      
      if (newPermissions.length === 0) {
        console.log(`✅ 角色 "${roleName}" 已有所需权限`);
        resolve();
        return;
      }
      
      const updatedPermissions = [...currentPermissions, ...newPermissions];
      
      databases.roles.update(
        { _id: role._id },
        { $set: { permissions: updatedPermissions } },
        {},
        (updateErr, numReplaced) => {
          if (updateErr) {
            reject(updateErr);
            return;
          }
          
          console.log(`✅ 为角色 "${roleName}" 添加权限: ${newPermissions.join(', ')}`);
          resolve();
        }
      );
    });
  });
}

// 验证修复结果
async function verifyFix() {
  return new Promise((resolve, reject) => {
    databases.users.findOne({ username: 'test2' }, (err, user) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!user) {
        console.log('❌ test2用户不存在');
        resolve();
        return;
      }
      
      databases.roles.findOne({ _id: user.roleId }, (roleErr, role) => {
        if (roleErr || !role) {
          console.log('❌ test2用户角色不存在');
          resolve();
          return;
        }
        
        console.log('\n🔍 修复验证:');
        console.log(`- test2用户状态: ${user.isActive ? '✅ 已激活' : '❌ 未激活'}`);
        console.log(`- test2员工关联: ${user.employeeId ? '✅ 已关联' : '❌ 未关联'}`);
        console.log(`- test2角色: ${role.name}`);
        console.log(`- project:view权限: ${role.permissions.includes('project:view') ? '✅' : '❌'}`);
        console.log(`- bonus:view权限: ${role.permissions.includes('bonus:view') ? '✅' : '❌'}`);
        resolve();
      });
    });
  });
}

// 主函数
async function main() {
  try {
    await activateAllUsers();
    await linkTest2ToEmployee();
    await fixCriticalRolePermissions();
    await verifyFix();
    
    console.log('\n🎉 权限修复完成！');
    console.log('\n📋 建议:');
    console.log('1. 重启后端服务以确保权限缓存更新');
    console.log('2. 使用test2用户重新登录测试');
    console.log('3. 检查项目管理和奖金查看功能是否正常');
    
  } catch (error) {
    console.error('❌ 修复失败:', error);
  }
}

// 运行修复
main();