const path = require('path')
const Datastore = require('nedb')

// 数据库路径
const dbPath = path.join(__dirname, '../database')

// 初始化数据库连接
const databases = {
  users: new Datastore({ filename: path.join(dbPath, 'users.db'), autoload: true }),
  employees: new Datastore({ filename: path.join(dbPath, 'employees.db'), autoload: true })
}

// 模拟nedbService
const nedbService = {
  getUserById: (userId) => {
    return new Promise((resolve, reject) => {
      databases.users.findOne({ _id: userId }, (err, doc) => {
        if (err) reject(err)
        else resolve(doc)
      })
    })
  },
  
  getEmployeeById: (employeeId) => {
    return new Promise((resolve, reject) => {
      databases.employees.findOne({ _id: employeeId }, (err, doc) => {
        if (err) reject(err)
        else resolve(doc)
      })
    })
  },
  
  findOne: (collection, query) => {
    return new Promise((resolve, reject) => {
      databases[collection].findOne(query, (err, doc) => {
        if (err) reject(err)
        else resolve(doc)
      })
    })
  },
  
  updateUser: (userId, update) => {
    return new Promise((resolve, reject) => {
      databases.users.update({ _id: userId }, { $set: update }, {}, (err, numReplaced) => {
        if (err) reject(err)
        else resolve(numReplaced)
      })
    })
  }
}

// 测试修复后的getEmployeeByUserId方法
async function testFixedEmployeeLink() {
  try {
    console.log('🧪 测试修复后的员工关联逻辑...\n')
    
    // 1. 查找test用户
    console.log('1️⃣ 查找test用户...')
    const testUser = await nedbService.getUserById('qU9lAi67euvPCh2H')
    if (!testUser) {
      console.log('❌ 未找到test用户')
      return
    }
    
    console.log('✅ 找到test用户:', {
      id: testUser._id,
      username: testUser.username,
      realName: testUser.realName,
      email: testUser.email,
      employeeId: testUser.employeeId
    })
    
    // 2. 模拟getEmployeeByUserId方法
    console.log('\n2️⃣ 模拟getEmployeeByUserId方法...')
    
    // 方法1: 如果用户表中已有employeeId，直接使用
    let employee = null
    if (testUser.employeeId) {
      console.log(`🔗 尝试通过employeeId直接关联: ${testUser.employeeId}`)
      employee = await nedbService.getEmployeeById(testUser.employeeId)
      if (employee) {
        console.log(`✅ 通过employeeId找到员工: ${employee.name}`)
      } else {
        console.log(`⚠️ employeeId ${testUser.employeeId} 对应的员工不存在，尝试其他方法`)
      }
    }

    // 方法2: 通过用户名作为员工工号匹配（主要方法）
    if (!employee && testUser.username) {
      console.log(`🔍 尝试通过用户名作为员工工号匹配: ${testUser.username}`)
      employee = await nedbService.findOne('employees', { employeeNo: testUser.username })
      if (employee) {
        console.log(`✅ 通过用户名匹配到员工: ${employee.name} (工号: ${employee.employeeNo})`)
        // 找到匹配的员工后，更新用户表的employeeId字段，建立关联
        try {
          await nedbService.updateUser(testUser._id, { employeeId: employee._id })
          console.log(`🔗 已建立用户-员工关联: ${testUser.username} -> ${employee.name}`)
        } catch (updateError) {
          console.warn('⚠️ 更新用户employeeId失败:', updateError.message)
        }
      }
    }

    // 方法3: 通过realName匹配员工姓名
    if (!employee && testUser.realName) {
      console.log(`🔍 尝试通过realName匹配员工姓名: ${testUser.realName}`)
      employee = await nedbService.findOne('employees', { name: testUser.realName })
      if (employee) {
        console.log(`✅ 通过realName匹配到员工: ${employee.name}`)
        // 找到匹配的员工后，更新用户表的employeeId字段，建立关联
        try {
          await nedbService.updateUser(testUser._id, { employeeId: employee._id })
          console.log(`🔗 已建立用户-员工关联: ${testUser.username} -> ${employee.name}`)
        } catch (updateError) {
          console.warn('⚠️ 更新用户employeeId失败:', updateError.message)
        }
      }
    }

    // 方法4: 通过邮箱匹配
    if (!employee && testUser.email) {
      console.log(`🔍 尝试通过邮箱匹配: ${testUser.email}`)
      employee = await nedbService.findOne('employees', { email: testUser.email })
      if (employee) {
        console.log(`✅ 通过邮箱匹配到员工: ${employee.name}`)
        // 找到匹配的员工后，更新用户表的employeeId字段，建立关联
        try {
          await nedbService.updateUser(testUser._id, { employeeId: employee._id })
          console.log(`🔗 已建立用户-员工关联: ${testUser.username} -> ${employee.name}`)
        } catch (updateError) {
          console.warn('⚠️ 更新用户employeeId失败:', updateError.message)
        }
      }
    }

    // 3. 检查结果
    if (employee) {
      console.log('\n✅ 成功找到员工:', {
        id: employee._id,
        name: employee.name,
        employeeNo: employee.employeeNo,
        email: employee.email
      })
    } else {
      console.log('\n❌ 未找到员工记录')
    }
    
    // 4. 检查用户记录是否已更新
    console.log('\n3️⃣ 检查用户记录是否已更新...')
    const updatedUser = await nedbService.getUserById(testUser._id)
    console.log('更新后的用户信息:', {
      id: updatedUser._id,
      username: updatedUser.username,
      employeeId: updatedUser.employeeId
    })
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 主函数
async function main() {
  console.log('🚀 员工关联修复测试工具')
  console.log('==================================================')
  
  await testFixedEmployeeLink()
  
  console.log('\n✨ 测试完成！')
  process.exit(0)
}

// 运行主函数
main().catch(error => {
  console.error('程序执行失败:', error)
  process.exit(1)
})
