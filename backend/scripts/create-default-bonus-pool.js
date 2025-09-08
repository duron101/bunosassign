const fs = require('fs')
const path = require('path')

// 数据库文件路径
const dbPath = path.join(__dirname, '../database/bonus_system.json')

// 读取现有数据
let dbData = { data: {}, nextId: {} }

if (fs.existsSync(dbPath)) {
  try {
    const rawData = fs.readFileSync(dbPath, 'utf8')
    dbData = JSON.parse(rawData)
    console.log('✅ 数据库文件已加载')
  } catch (error) {
    console.error('❌ 读取数据库文件失败:', error.message)
    process.exit(1)
  }
}

// 创建默认奖金池数据
const defaultBonusPool = {
  id: 1,
  period: '2024Q4',
  totalProfit: 10000000, // 1000万
  poolRatio: 0.15, // 15%
  poolAmount: 1500000, // 150万
  reserveRatio: 0.1, // 10%
  specialRatio: 0.05, // 5%
  distributableAmount: 1275000, // 127.5万
  status: 'draft',
  weightConfigId: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

// 检查是否已存在奖金池
if (!dbData.data.bonusPools) {
  dbData.data.bonusPools = []
}

if (dbData.data.bonusPools.length === 0) {
  // 添加默认奖金池
  dbData.data.bonusPools.push(defaultBonusPool)
  
  // 更新nextId
  if (!dbData.nextId.bonusPools) {
    dbData.nextId.bonusPools = 2
  }
  
  console.log('✅ 已创建默认奖金池:', defaultBonusPool.period)
} else {
  console.log('ℹ️ 奖金池数据已存在，跳过创建')
}

// 保存数据
try {
  fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8')
  console.log('💾 数据库已保存')
} catch (error) {
  console.error('❌ 保存数据库失败:', error.message)
  process.exit(1)
}

console.log('🎉 默认奖金池创建完成!')
