const path = require('path')
const Datastore = require('nedb')

// 数据库路径
const dbPath = path.join(__dirname, '../database')

// 初始化数据库连接
const databases = {
  users: new Datastore({ filename: path.join(dbPath, 'users.db'), autoload: true }),
  employees: new Datastore({ filename: path.join(dbPath, 'employees.db'), autoload: true })
}

// 测试用户-员工关联
async function testUserEmployeeLink() {
  try {
    console.log('🧪 测试用户-员工关联逻辑...\n')
    
    // 1. 查找test用户
    console.log('1️⃣ 查找test用户...')
    const testUser = await queryDatabase('users', { username: 'test' })
    if (testUser.length === 0) {
      console.log('❌ 未找到test用户')
      return
    }
    
    const user = testUser[0]
    console.log('✅ 找到test用户:', {
      id: user._id,
      username: user.username,
      realName: user.realName,
      email: user.email,
      employeeId: user.employeeId
    })
    
    // 2. 查找所有员工记录
    console.log('\n2️⃣ 查找所有员工记录...')
    const allEmployees = await queryDatabase('employees', {})
    console.log(`📊 总共有 ${allEmployees.length} 个员工记录`)
    
    // 3. 尝试各种匹配方法
    console.log('\n3️⃣ 尝试各种匹配方法...')
    
    // 方法1: 通过employeeId直接关联
    if (user.employeeId) {
      console.log('🔍 方法1: 通过employeeId直接关联')
      const employee = allEmployees.find(emp => emp._id === user.employeeId)
      if (employee) {
        console.log(`✅ 找到关联员工: ${employee.name}`)
        return
      } else {
        console.log(`❌ employeeId ${user.employeeId} 对应的员工不存在`)
      }
    }
    
    // 方法2: 通过用户名作为员工工号匹配
    console.log('🔍 方法2: 通过用户名作为员工工号匹配')
    const employeeByNo = allEmployees.find(emp => emp.employeeNo === user.username)
    if (employeeByNo) {
      console.log(`✅ 通过工号匹配到员工: ${employeeByNo.name} (工号: ${employeeByNo.employeeNo})`)
      return
    } else {
      console.log(`❌ 未找到工号为 ${user.username} 的员工`)
    }
    
    // 方法3: 通过realName匹配员工姓名
    if (user.realName) {
      console.log('🔍 方法3: 通过realName匹配员工姓名')
      const employeeByName = allEmployees.find(emp => emp.name === user.realName)
      if (employeeByName) {
        console.log(`✅ 通过姓名匹配到员工: ${employeeByName.name}`)
        return
      } else {
        console.log(`❌ 未找到姓名为 ${user.realName} 的员工`)
      }
    }
    
    // 方法4: 通过邮箱匹配
    if (user.email) {
      console.log('🔍 方法4: 通过邮箱匹配')
      const employeeByEmail = allEmployees.find(emp => emp.email === user.email)
      if (employeeByEmail) {
        console.log(`✅ 通过邮箱匹配到员工: ${employeeByEmail.name}`)
        return
      } else {
        console.log(`❌ 未找到邮箱为 ${user.email} 的员工`)
      }
    }
    
    // 方法5: 模糊匹配（处理test用户）
    console.log('🔍 方法5: 模糊匹配用户名')
    if (user.username === 'test') {
      const testEmployee = allEmployees.find(emp => 
        emp.name && emp.name.toLowerCase().includes('测试')
      )
      if (testEmployee) {
        console.log(`✅ 通过模糊匹配找到测试员工: ${testEmployee.name}`)
        return
      } else {
        console.log(`❌ 未找到包含"测试"的员工`)
      }
      
      // 尝试通过用户名作为员工姓名的一部分进行匹配
      const fuzzyEmployee = allEmployees.find(emp => 
        emp.name && emp.name.toLowerCase().includes(user.username.toLowerCase())
      )
      if (fuzzyEmployee) {
        console.log(`✅ 通过用户名模糊匹配找到员工: ${fuzzyEmployee.name}`)
        return
      } else {
        console.log(`❌ 未找到包含用户名 ${user.username} 的员工`)
      }
    }
    
    // 显示所有员工信息用于调试
    console.log('\n📋 所有员工信息:')
    allEmployees.forEach((emp, index) => {
      console.log(`  ${index + 1}. ${emp.name} (工号: ${emp.employeeNo}, 邮箱: ${emp.email || 'N/A'})`)
    })
    
    console.log('\n❌ 所有匹配方法都失败了')
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 数据库查询辅助函数
function queryDatabase(collectionName, query = {}) {
  return new Promise((resolve, reject) => {
    databases[collectionName].find(query, (err, docs) => {
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
  console.log('🚀 用户-员工关联测试工具')
  console.log('==================================================')
  
  await testUserEmployeeLink()
  
  // 关闭数据库连接
  Object.values(databases).forEach(db => {
    if (db.persistence) {
      db.persistence.compactDatafile()
    }
  })
  
  console.log('\n✨ 测试完成！')
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
