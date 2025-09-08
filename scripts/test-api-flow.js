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
  
  find: (collection, query = {}) => {
    return new Promise((resolve, reject) => {
      databases[collection].find(query, (err, docs) => {
        if (err) reject(err)
        else resolve(docs)
      })
    })
  }
}

// 测试API流程
async function testApiFlow() {
  try {
    console.log('🧪 测试API调用流程...\n')
    
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
    
    // 2. 直接查找员工记录
    if (testUser.employeeId) {
      console.log('\n2️⃣ 通过employeeId查找员工...')
      const employee = await nedbService.getEmployeeById(testUser.employeeId)
      if (employee) {
        console.log('✅ 找到员工:', {
          id: employee._id,
          name: employee.name,
          employeeNo: employee.employeeNo
        })
      } else {
        console.log('❌ 未找到员工记录')
      }
    } else {
      console.log('\n2️⃣ 用户没有employeeId，尝试其他匹配方法...')
      
      // 通过realName匹配
      if (testUser.realName) {
        console.log(`🔍 尝试通过realName匹配: ${testUser.realName}`)
        const employee = await nedbService.findOne('employees', { name: testUser.realName })
        if (employee) {
          console.log('✅ 通过realName找到员工:', employee.name)
        } else {
          console.log('❌ 通过realName未找到员工')
        }
      }
      
      // 通过用户名匹配工号
      console.log(`🔍 尝试通过用户名匹配工号: ${testUser.username}`)
      const employeeByNo = await nedbService.findOne('employees', { employeeNo: testUser.username })
      if (employeeByNo) {
        console.log('✅ 通过用户名找到员工:', employeeByNo.name)
      } else {
        console.log('❌ 通过用户名未找到员工')
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  }
}

// 主函数
async function main() {
  console.log('🚀 API流程测试工具')
  console.log('==================================================')
  
  await testApiFlow()
  
  console.log('\n✨ 测试完成！')
  process.exit(0)
}

// 运行主函数
main().catch(error => {
  console.error('程序执行失败:', error)
  process.exit(1)
})
