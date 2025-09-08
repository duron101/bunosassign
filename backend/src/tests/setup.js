const db = require('../config/database')

// Global test setup
beforeAll(async () => {
  // 等待数据库连接
  try {
    await db.authenticate()
    console.log('Test database connection established successfully.')
  } catch (error) {
    console.error('Unable to connect to the test database:', error)
  }
})

// Global test cleanup
afterAll(async () => {
  // 清理测试数据
  try {
    // 清理项目协作相关测试数据
    await db.query(`
      DELETE FROM project_notifications 
      WHERE title LIKE '%测试%' OR title LIKE '%test%'
    `)
    
    await db.query(`
      DELETE FROM project_collaboration_logs 
      WHERE operation_description LIKE '%测试%' OR operation_description LIKE '%test%'
    `)
    
    await db.query(`
      DELETE FROM project_team_members 
      WHERE reason LIKE '%测试%' OR reason LIKE '%test%'
    `)
    
    await db.query(`
      DELETE FROM project_team_applications 
      WHERE team_name LIKE '%测试%' OR team_name LIKE '%test%'
    `)
    
    await db.query(`
      DELETE FROM project_requirements 
      WHERE title LIKE '%测试%' OR title LIKE '%test%'
    `)
    
    await db.query(`
      DELETE FROM projects 
      WHERE name LIKE '%测试%' OR name LIKE '%test%' OR code LIKE '%TEST%'
    `)
    
    console.log('Test data cleanup completed.')
  } catch (error) {
    console.error('Error during test cleanup:', error)
  } finally {
    // 关闭数据库连接
    await db.close()
  }
})

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})