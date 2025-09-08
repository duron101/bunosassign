const path = require('path')
const Datastore = require('nedb')

// 数据库路径
const dbPath = path.join(__dirname, '../database')

// 初始化数据库连接
const databases = {
  users: new Datastore({ filename: path.join(dbPath, 'users.db'), autoload: true }),
  employees: new Datastore({ filename: path.join(dbPath, 'employees.db'), autoload: true }),
  roles: new Datastore({ filename: path.join(dbPath, 'roles.db'), autoload: true })
}

// 修复用户-员工关联关系
async function fixUserEmployeeLinks() {
  console.log('🔧 开始修复用户-员工关联关系...\n')

  try {
    // 获取所有用户
    const users = await queryDatabase('users')
    console.log(`📊 找到 ${users.length} 个用户`)

    // 获取所有员工
    const employees = await queryDatabase('employees')
    console.log(`👥 找到 ${employees.length} 个员工\n`)

    // 检查每个用户的关联状态
    for (const user of users) {
      console.log(`🔍 检查用户: ${user.username}`)
      
      let linkedEmployee = null
      let linkMethod = ''

      // 方法1: 检查是否已有employeeId关联
      if (user.employeeId) {
        linkedEmployee = employees.find(emp => emp._id === user.employeeId)
        if (linkedEmployee) {
          console.log(`  ✅ 已关联员工: ${linkedEmployee.name} (通过employeeId)`)
          continue
        } else {
          console.log(`  ⚠️  employeeId关联的员工不存在，需要重新关联`)
        }
      }

      // 方法2: 通过realName匹配员工姓名
      if (user.realName && !linkedEmployee) {
        linkedEmployee = employees.find(emp => emp.name === user.realName)
        if (linkedEmployee) {
          linkMethod = 'realName'
          console.log(`  🔗 通过realName匹配到员工: ${linkedEmployee.name}`)
        }
      }

      // 方法3: 通过邮箱匹配
      if (user.email && !linkedEmployee) {
        linkedEmployee = employees.find(emp => emp.email === user.email)
        if (linkedEmployee) {
          linkMethod = 'email'
          console.log(`  🔗 通过邮箱匹配到员工: ${linkedEmployee.name}`)
        }
      }

      // 方法4: 通过用户名匹配员工工号（向后兼容）
      if (!linkedEmployee) {
        linkedEmployee = employees.find(emp => emp.employeeNo === user.username)
        if (linkedEmployee) {
          linkMethod = 'username'
          console.log(`  🔗 通过用户名匹配到员工: ${linkedEmployee.name}`)
        }
      }

      // 如果找到了匹配的员工，建立关联
      if (linkedEmployee) {
        try {
          await updateUserEmployeeLink(user._id, linkedEmployee._id)
          console.log(`  ✅ 成功建立关联: ${user.username} -> ${linkedEmployee.name}`)
        } catch (error) {
          console.log(`  ❌ 建立关联失败: ${error.message}`)
        }
      } else {
        console.log(`  ❌ 未找到匹配的员工记录`)
        
        // 为test用户创建默认员工记录
        if (user.username === 'test') {
          try {
            const defaultEmployee = await createDefaultEmployeeForTest(user)
            if (defaultEmployee) {
              await updateUserEmployeeLink(user._id, defaultEmployee._id)
              console.log(`  ✅ 为test用户创建并关联了默认员工记录`)
            }
          } catch (error) {
            console.log(`  ❌ 创建默认员工记录失败: ${error.message}`)
          }
        }
      }
      
      console.log('')
    }

    console.log('🎯 关联关系修复完成！')
    
    // 显示最终关联状态
    await showFinalLinkStatus()

  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error)
  }
}

// 为test用户创建默认员工记录
async function createDefaultEmployeeForTest(user) {
  try {
    // 查找默认部门和岗位
    const departments = await queryDatabase('departments')
    const positions = await queryDatabase('positions')
    
    const defaultDept = departments.find(d => d.name.includes('技术') || d.name.includes('产品'))
    const defaultPos = positions.find(p => p.name.includes('经理') || p.name.includes('工程师'))
    
    const employeeData = {
      name: '测试项目经理',
      employeeNo: 'TEST001',
      departmentId: defaultDept ? defaultDept._id : 'DsYMP3aBv5fLHeuW',
      positionId: defaultPos ? defaultPos._id : '0BPrxtIAgT1r5e0j',
      annualSalary: 200000,
      entryDate: new Date().toISOString().split('T')[0],
      status: 1,
      userId: user._id,
      email: 'test@company.com',
      phone: '13800138000',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return new Promise((resolve, reject) => {
      databases.employees.insert(employeeData, (err, newEmployee) => {
        if (err) {
          reject(err)
        } else {
          console.log(`  📝 创建了新的员工记录: ${newEmployee.name}`)
          resolve(newEmployee)
        }
      })
    })
  } catch (error) {
    console.error('创建默认员工记录失败:', error)
    return null
  }
}

// 更新用户-员工关联
async function updateUserEmployeeLink(userId, employeeId) {
  return new Promise((resolve, reject) => {
    databases.users.update(
      { _id: userId },
      { $set: { employeeId: employeeId } },
      {},
      (err, numReplaced) => {
        if (err) {
          reject(err)
        } else if (numReplaced > 0) {
          resolve(true)
        } else {
          reject(new Error('更新失败，未找到匹配的用户'))
        }
      }
    )
  })
}

// 显示最终关联状态
async function showFinalLinkStatus() {
  console.log('📋 最终关联状态:')
  console.log('=' * 50)
  
  const users = await queryDatabase('users')
  const employees = await queryDatabase('employees')
  
  for (const user of users) {
    const employee = user.employeeId ? 
      employees.find(emp => emp._id === user.employeeId) : null
    
    const status = employee ? '✅' : '❌'
    const employeeName = employee ? employee.name : '未关联'
    
    console.log(`${status} ${user.username} -> ${employeeName}`)
  }
  
  console.log('=' * 50)
}

// 数据库查询辅助函数
function queryDatabase(collectionName) {
  return new Promise((resolve, reject) => {
    databases[collectionName].find({}, (err, docs) => {
      if (err) {
        reject(err)
      } else {
        resolve(docs)
      }
    })
  })
}

// 主函数
async function main() {
  console.log('🚀 用户-员工关联修复工具')
  console.log('=' * 50)
  
  await fixUserEmployeeLinks()
  
  // 关闭数据库连接
  Object.values(databases).forEach(db => {
    if (db.persistence) {
      db.persistence.compactDatafile()
    }
  })
  
  console.log('\n✨ 修复完成！')
  process.exit(0)
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason)
  process.exit(1)
})

// 运行主函数
main().catch(error => {
  console.error('程序执行失败:', error)
  process.exit(1)
})
