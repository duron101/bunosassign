#!/usr/bin/env node

/**
 * 测试数据导入的简单脚本
 */

const fs = require('fs');
const path = require('path');

async function testDataImport() {
  try {
    console.log('🧪 测试数据导入...');
    
    // 读取 JSON 数据
    const dataFile = path.join(__dirname, '../database/bonus_system.json');
    console.log('📁 数据文件路径:', dataFile);
    
    if (!fs.existsSync(dataFile)) {
      throw new Error('数据文件不存在');
    }
    
    const data = fs.readFileSync(dataFile, 'utf8');
    const jsonData = JSON.parse(data);
    console.log('✅ 数据文件读取成功');
    
    // 检查业务线数据
    const businessLines = jsonData.data.businessLines || [];
    console.log(`📊 业务线数量: ${businessLines.length}`);
    
    if (businessLines.length > 0) {
      console.log('\n🔍 第一个业务线数据:');
      const firstLine = businessLines[0];
      console.log('  name:', firstLine.name);
      console.log('  code:', firstLine.code);
      console.log('  description:', firstLine.description);
      console.log('  weight:', firstLine.weight);
      console.log('  status:', firstLine.status);
      
      // 检查是否有 null 值
      const hasNullName = businessLines.some(line => line.name === null || line.name === undefined);
      const hasNullCode = businessLines.some(line => line.code === null || line.code === undefined);
      
      console.log('\n⚠️  数据完整性检查:');
      console.log('  存在 null name:', hasNullName);
      console.log('  存在 null code:', hasNullCode);
      
      if (hasNullName || hasNullCode) {
        console.log('\n❌ 发现无效数据:');
        businessLines.forEach((line, index) => {
          if (line.name === null || line.name === undefined || line.code === null || line.code === undefined) {
            console.log(`  索引 ${index}:`, JSON.stringify(line));
          }
        });
      }
    }
    
    // 检查部门数据
    const departments = jsonData.data.departments || [];
    console.log(`\n📊 部门数量: ${departments.length}`);
    
    // 检查岗位数据
    const positions = jsonData.data.positions || [];
    console.log(`📊 岗位数量: ${positions.length}`);
    
    // 检查员工数据
    const employees = jsonData.data.employees || [];
    console.log(`📊 员工数量: ${employees.length}`);
    
    console.log('\n🎉 数据检查完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', error);
  }
}

testDataImport();
