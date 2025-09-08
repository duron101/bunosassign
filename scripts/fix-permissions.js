/**
 * 权限配置修复脚本
 * 修复NeDB数据库中的用户角色权限配置问题
 */

const Datastore = require('nedb');
const path = require('path');

// 初始化数据库
const databases = {
  users: new Datastore({ filename: path.join(__dirname, '../database/users.db'), autoload: true }),
  roles: new Datastore({ filename: path.join(__dirname, '../database/roles.db'), autoload: true }),
  employees: new Datastore({ filename: path.join(__dirname, '../database/employees.db'), autoload: true })
};

console.log('🔧 开始修复权限配置问题...\n');

// 修复角色权限
async function fixRolePermissions() {
  return new Promise((resolve, reject) => {
    // 获取部门经理角色
    databases.roles.findOne({ name: '部门经理' }, (err, role) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!role) {
        reject(new Error('部门经理角色不存在'));
        return;
      }
      
      console.log('📝 修复部门经理角色权限...');
      console.log(`当前权限: ${role.permissions.join(', ')}`);
      
      // 添加缺失的权限
      const additionalPermissions = [
        'bonus:view',
        'report:personal',
        'position:view',
        'simulation:view',
        'bonus_pool:view'
      ];
      
      const updatedPermissions = [...new Set([...role.permissions, ...additionalPermissions])];
      
      databases.roles.update(
        { _id: role._id },
        { $set: { permissions: updatedPermissions } },
        {},
        (updateErr, numReplaced) => {
          if (updateErr) {
            reject(updateErr);
            return;
          }
          
          console.log(`✅ 部门经理角色权限已更新，新增权限: ${additionalPermissions.join(', ')}`);
          console.log(`更新后权限: ${updatedPermissions.join(', ')}\n`);
          resolve();
        }
      );
    });
  });
}

// 优化普通员工角色权限
async function optimizeEmployeeRole() {
  return new Promise((resolve, reject) => {
    databases.roles.findOne({ name: '普通员工' }, (err, role) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!role) {
        console.log('⚠️  普通员工角色不存在，跳过优化');
        resolve();
        return;
      }
      
      console.log('📝 优化普通员工角色权限...');
      console.log(`当前权限: ${role.permissions.join(', ')}`);
      
      // 确保普通员工有基本权限
      const requiredPermissions = [
        'employee:view',
        'department:view', 
        'position:view',
        'project:view',
        'bonus:view',
        'report:personal',
        'notification:view',
        'collaboration:view',
        'team:view'
      ];
      
      const updatedPermissions = [...new Set([...role.permissions, ...requiredPermissions])];
      
      databases.roles.update(
        { _id: role._id },
        { $set: { permissions: updatedPermissions } },
        {},
        (updateErr, numReplaced) => {
          if (updateErr) {
            reject(updateErr);
            return;
          }
          
          console.log(`✅ 普通员工角色权限已优化`);
          console.log(`更新后权限: ${updatedPermissions.join(', ')}\n`);
          resolve();
        }
      );
    });
  });
}

// 创建员工记录关联
async function createEmployeeRecords() {
  return new Promise((resolve, reject) => {
    databases.users.find({}, (err, users) => {
      if (err) {
        reject(err);
        return;
      }
      
      const usersNeedingEmployees = users.filter(u => !u.employeeId);
      
      if (usersNeedingEmployees.length === 0) {
        console.log('✅ 所有用户都有员工记录关联\n');
        resolve();
        return;
      }
      
      console.log('👨‍💼 为用户创建员工记录...');
      
      let completedCount = 0;
      
      usersNeedingEmployees.forEach(user => {
        const employeeData = {
          name: user.username === 'admin' ? '系统管理员' : 
                user.username === 'test' ? '测试项目经理' : 
                user.username === 'test2' ? '测试部门经理' : user.username,
          employeeNumber: `EMP${Date.now()}${Math.random().toString(36).substring(7)}`,
          departmentId: 'DsYMP3aBv5fLHeuW', // 默认分配到总经理办公室
          positionId: user.username === 'admin' ? 'AzygHw0Cpbx1YyUe' : // 总经理
                      user.username === 'test' ? '0BPrxtIAgT1r5e0j' : // 项目经理
                      user.username === 'test2' ? 'MONoncdbS6WKO15X' : // 部门经理
                      'QIUgWkY0NMp444Qt', // 普通员工
          status: 1, // 1表示在职
          hireDate: new Date().toISOString().split('T')[0],
          email: `${user.username}@company.com`,
          phone: `138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        databases.employees.insert(employeeData, (insertErr, newEmployee) => {
          if (insertErr) {
            console.error(`❌ 创建员工记录失败 (${user.username}):`, insertErr);
          } else {
            // 更新用户的员工ID
            databases.users.update(
              { _id: user._id },
              { $set: { employeeId: newEmployee._id } },
              {},
              (updateErr) => {
                if (updateErr) {
                  console.error(`❌ 更新用户员工ID失败 (${user.username}):`, updateErr);
                } else {
                  console.log(`✅ 为用户 ${user.username} 创建员工记录: ${newEmployee.name} (${newEmployee._id})`);
                }
                
                completedCount++;
                if (completedCount === usersNeedingEmployees.length) {
                  console.log('');
                  resolve();
                }
              }
            );
          }
        });
      });
    });
  });
}

// 激活用户账户
async function activateUsers() {
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
        
        console.log(`✅ 已激活 ${numReplaced} 个用户账户\n`);
        resolve();
      }
    );
  });
}

// 添加技术总监角色权限优化
async function optimizeTechDirectorRole() {
  return new Promise((resolve, reject) => {
    databases.roles.findOne({ name: '技术总监' }, (err, role) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!role) {
        console.log('⚠️  技术总监角色不存在，跳过优化');
        resolve();
        return;
      }
      
      console.log('📝 优化技术总监角色权限...');
      
      // 技术总监应该有完整的项目和团队管理权限
      const additionalPermissions = [
        'project:*',
        'team:*', 
        'member:*',
        'bonus:view',
        'bonus:calculate',
        'simulation:view',
        'simulation:run',
        'report:view',
        'report:export'
      ];
      
      const updatedPermissions = [...new Set([...role.permissions, ...additionalPermissions])];
      
      databases.roles.update(
        { _id: role._id },
        { $set: { permissions: updatedPermissions } },
        {},
        (updateErr, numReplaced) => {
          if (updateErr) {
            reject(updateErr);
            return;
          }
          
          console.log(`✅ 技术总监角色权限已优化\n`);
          resolve();
        }
      );
    });
  });
}

// 验证修复结果
async function verifyFixes() {
  return new Promise((resolve, reject) => {
    databases.users.findOne({ username: 'test2' }, (err, user) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!user) {
        reject(new Error('test2用户不存在'));
        return;
      }
      
      databases.roles.findOne({ _id: user.roleId }, (roleErr, role) => {
        if (roleErr) {
          reject(roleErr);
          return;
        }
        
        console.log('🔍 验证修复结果:');
        console.log(`- test2用户激活状态: ${user.isActive ? '已激活' : '未激活'}`);
        console.log(`- test2用户员工ID: ${user.employeeId || 'undefined'}`);
        console.log(`- test2角色名称: ${role.name}`);
        console.log(`- 是否有project:view权限: ${role.permissions.includes('project:view') ? '✅' : '❌'}`);
        console.log(`- 是否有bonus:view权限: ${role.permissions.includes('bonus:view') ? '✅' : '❌'}`);
        console.log(`- 总权限数量: ${role.permissions.length}`);
        
        if (user.employeeId) {
          databases.employees.findOne({ _id: user.employeeId }, (empErr, employee) => {
            if (empErr) {
              console.log(`❌ 查找员工记录出错: ${empErr}`);
            } else if (employee) {
              console.log(`- 关联员工: ${employee.name} (状态: ${employee.status})`);
            } else {
              console.log(`❌ 员工记录不存在`);
            }
            console.log('');
            resolve();
          });
        } else {
          console.log('');
          resolve();
        }
      });
    });
  });
}

// 主函数
async function main() {
  try {
    // 1. 修复角色权限
    await fixRolePermissions();
    
    // 2. 优化普通员工角色
    await optimizeEmployeeRole();
    
    // 3. 优化技术总监角色
    await optimizeTechDirectorRole();
    
    // 4. 创建员工记录
    await createEmployeeRecords();
    
    // 5. 激活用户账户
    await activateUsers();
    
    // 6. 验证修复结果
    await verifyFixes();
    
    console.log('🎉 权限配置修复完成！');
    console.log('');
    console.log('📋 修复总结:');
    console.log('1. ✅ 为部门经理角色添加了 bonus:view 等权限');
    console.log('2. ✅ 优化了普通员工和技术总监角色权限');
    console.log('3. ✅ 为所有用户创建了员工记录关联');
    console.log('4. ✅ 激活了所有用户账户');
    console.log('');
    console.log('现在test2用户应该可以正常访问项目和奖金相关功能了！');
    
  } catch (error) {
    console.error('❌ 修复过程中出现错误:', error);
  }
}

// 运行修复
main();