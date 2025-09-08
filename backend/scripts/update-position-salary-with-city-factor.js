const NeDB = require('nedb')
const path = require('path')

// 数据库路径
const dbPath = path.join(__dirname, '../../database/position_requirements.db')

// 创建数据库连接
const db = new NeDB({ filename: dbPath, autoload: true })

// 城市系数配置
const cityFactors = {
  '一线城市': {
    name: '一线城市',
    factor: 1.0,
    cities: ['北京', '上海', '广州', '深圳'],
    description: '北京、上海、广州、深圳等一线城市'
  },
  '新一线城市': {
    name: '新一线城市',
    factor: 0.85,
    cities: ['杭州', '南京', '成都', '武汉', '西安', '苏州', '天津', '重庆', '长沙', '青岛'],
    description: '杭州、南京、成都、武汉、西安、苏州、天津、重庆、长沙、青岛等新一线城市'
  },
  '二线城市': {
    name: '二线城市',
    factor: 0.7,
    cities: ['宁波', '无锡', '佛山', '东莞', '合肥', '大连', '福州', '厦门', '济南', '温州'],
    description: '宁波、无锡、佛山、东莞、合肥、大连、福州、厦门、济南、温州等二线城市'
  },
  '三线城市': {
    name: '三线城市',
    factor: 0.6,
    cities: ['其他地级市'],
    description: '其他地级市及以下城市'
  }
}

// 薪资下调函数（下调20%）
function adjustSalary(salary) {
  if (!salary) return salary
  
  // 如果是范围格式（如"10K-18K"）
  if (typeof salary === 'string' && salary.includes('-')) {
    const [min, max] = salary.split('-')
    const adjustedMin = Math.round(parseFloat(min) * 0.8)
    const adjustedMax = Math.round(parseFloat(max) * 0.8)
    return `${adjustedMin}K-${adjustedMax}K`
  }
  
  // 如果是单个数值
  if (typeof salary === 'string' && salary.includes('K')) {
    const value = parseFloat(salary)
    const adjusted = Math.round(value * 0.8)
    return `${adjusted}K`
  }
  
  // 如果是数字
  if (typeof salary === 'number') {
    return Math.round(salary * 0.8)
  }
  
  return salary
}

// 更新单个岗位的薪资信息
function updatePositionSalary(position) {
  const updated = { ...position }
  
  // 更新薪资范围
  if (updated.salaryRange) {
    const oldSalaryRange = { ...updated.salaryRange }
    
    updated.salaryRange = {
      // 基础薪资（已下调20%）
      base: {
        junior: adjustSalary(oldSalaryRange.junior),
        middle: adjustSalary(oldSalaryRange.middle),
        senior: adjustSalary(oldSalaryRange.senior)
      },
      // 城市系数
      cityFactors: cityFactors,
      // 薪资影响因素
      factors: oldSalaryRange.factors || ['技术能力', '沟通能力', '项目贡献', '客户反馈'],
      // 计算说明
      calculation: {
        description: '最终薪资 = 基础薪资 × 城市系数 × 个人系数',
        note: '个人系数根据技术能力、沟通能力、项目贡献、客户反馈等因素综合评估'
      }
    }
    
    // 添加示例计算
    updated.salaryRange.examples = {
      '一线城市-初级': {
        city: '一线城市',
        level: '初级',
        baseSalary: updated.salaryRange.base.junior,
        cityFactor: cityFactors['一线城市'].factor,
        finalSalary: `${updated.salaryRange.base.junior} × 1.0 = ${updated.salaryRange.base.junior}`
      },
      '新一线城市-中级': {
        city: '新一线城市',
        level: '中级',
        baseSalary: updated.salaryRange.base.middle,
        cityFactor: cityFactors['新一线城市'].factor,
        finalSalary: `${updated.salaryRange.base.middle} × 0.85 = ${adjustSalary(updated.salaryRange.base.middle)}`
      },
      '二线城市-高级': {
        city: '二线城市',
        level: '高级',
        baseSalary: updated.salaryRange.base.senior,
        cityFactor: cityFactors['二线城市'].factor,
        finalSalary: `${updated.salaryRange.base.senior} × 0.7 = ${adjustSalary(updated.salaryRange.base.senior)}`
      }
    }
  }
  
  // 添加更新时间
  updated.updatedAt = new Date()
  
  return updated
}

// 主更新函数
async function updateAllPositionSalaries() {
  console.log('🚀 开始更新岗位薪资信息...')
  console.log('📊 薪资将普遍下调20%')
  console.log('🏙️ 增加城市系数选项')
  
  try {
    // 获取所有岗位
    const positions = await new Promise((resolve, reject) => {
      db.find({}, (err, docs) => {
        if (err) reject(err)
        else resolve(docs)
      })
    })
    
    console.log(`📋 找到 ${positions.length} 个岗位`)
    
    let updatedCount = 0
    let errorCount = 0
    
    // 逐个更新岗位
    for (const position of positions) {
      try {
        const updatedPosition = updatePositionSalary(position)
        
        // 更新数据库
        await new Promise((resolve, reject) => {
          db.update(
            { _id: position._id },
            updatedPosition,
            {},
            (err, numReplaced) => {
              if (err) reject(err)
              else resolve(numReplaced)
            }
          )
        })
        
        console.log(`✅ 已更新: ${position.positionName} (${position.positionCode})`)
        console.log(`   📍 原薪资: ${position.salaryRange?.junior || 'N/A'} - ${position.salaryRange?.senior || 'N/A'}`)
        console.log(`   💰 新基础薪资: ${updatedPosition.salaryRange.base.junior} - ${updatedPosition.salaryRange.base.senior}`)
        console.log(`   🏙️ 城市系数: 一线城市(1.0) | 新一线城市(0.85) | 二线城市(0.7) | 三线城市(0.6)`)
        
        updatedCount++
      } catch (error) {
        console.error(`❌ 更新失败: ${position.positionName}`, error.message)
        errorCount++
      }
    }
    
    console.log('\n📈 更新完成统计:')
    console.log(`   ✅ 成功更新: ${updatedCount} 个岗位`)
    console.log(`   ❌ 更新失败: ${errorCount} 个岗位`)
    console.log(`   📊 总计: ${positions.length} 个岗位`)
    
    // 显示几个示例
    console.log('\n💡 薪资计算示例:')
    console.log('   1. 一线城市-初级: 基础薪资 × 1.0 = 最终薪资')
    console.log('   2. 新一线城市-中级: 基础薪资 × 0.85 = 最终薪资')
    console.log('   3. 二线城市-高级: 基础薪资 × 0.7 = 最终薪资')
    console.log('   4. 三线城市-初级: 基础薪资 × 0.6 = 最终薪资')
    
    console.log('\n🎯 城市系数说明:')
    Object.values(cityFactors).forEach(city => {
      console.log(`   ${city.name}: ${city.factor} (${city.description})`)
    })
    
  } catch (error) {
    console.error('❌ 更新过程中发生错误:', error)
  }
}

// 运行更新
if (require.main === module) {
  updateAllPositionSalaries()
    .then(() => {
      console.log('\n🎉 岗位薪资更新完成！')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 更新失败:', error)
      process.exit(1)
    })
}

module.exports = {
  updateAllPositionSalaries,
  cityFactors,
  adjustSalary
}
