#!/usr/bin/env node

/**
 * 测试不同的文件路径格式
 */

const fs = require('fs');
const path = require('path');

async function testPaths() {
  try {
    console.log('🧪 测试不同的文件路径格式...');
    
    // 导入 WebAssembly SQLite 模块
    const sqlite3InitModule = (await import('../database/sqlite-wasm-3500400/jswasm/sqlite3-node.mjs')).default;
    const sqlite3 = await sqlite3InitModule();
    
    // 测试不同的路径格式
    const testPaths = [
      // 方案1: 相对路径
      './bonus_system.db',
      
      // 方案2: 当前目录
      'bonus_system.db',
      
      // 方案3: 绝对路径（Windows 格式）
      'E:\\dev\\bunosAssign\\database\\bonus_system.db',
      
      // 方案4: 绝对路径（Unix 格式）
      'E:/dev/bunosAssign/database/bonus_system.db',
      
      // 方案5: 数据库目录下的相对路径
      '../database/bonus_system.db',
      
      // 方案6: 内存数据库（作为对比）
      ':memory:'
    ];
    
    for (let i = 0; i < testPaths.length; i++) {
      const testPath = testPaths[i];
      console.log(`\n🔍 测试路径 ${i + 1}: ${testPath}`);
      
      try {
        // 尝试创建数据库连接
        const db = new sqlite3.oo1.DB(testPath);
        console.log('✅ 数据库连接成功');
        
        // 尝试创建简单表
        try {
          db.exec('CREATE TABLE IF NOT EXISTS test_table (id INTEGER PRIMARY KEY, name TEXT)');
          console.log('✅ 表创建成功');
          
          // 尝试插入数据
          db.exec("INSERT INTO test_table (name) VALUES ('test')");
          console.log('✅ 数据插入成功');
          
          // 尝试查询数据
          const stmt = db.prepare('SELECT COUNT(*) as count FROM test_table');
          stmt.step();
          const result = stmt.get();
          stmt.finalize();
          console.log('✅ 数据查询成功，结果:', result);
          
          // 关闭数据库
          db.close();
          console.log('✅ 数据库关闭成功');
          
          // 如果是文件数据库，检查文件是否创建
          if (testPath !== ':memory:') {
            const fullPath = path.isAbsolute(testPath) ? testPath : path.resolve(testPath);
            if (fs.existsSync(fullPath)) {
              const stats = fs.statSync(fullPath);
              console.log(`✅ 数据库文件已创建: ${fullPath}`);
              console.log(`   文件大小: ${stats.size} 字节`);
              console.log(`   创建时间: ${stats.birthtime}`);
            } else {
              console.log(`❌ 数据库文件未创建: ${fullPath}`);
            }
          }
          
          console.log(`🎉 路径 ${testPath} 测试完全成功！`);
          return; // 找到可用的路径，退出测试
          
        } catch (tableError) {
          console.error('❌ 表操作失败:', tableError.message);
          db.close();
        }
        
      } catch (error) {
        console.error('❌ 数据库连接失败:', error.message);
      }
    }
    
    console.log('\n❌ 所有路径格式都失败了');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', error);
  }
}

testPaths();
