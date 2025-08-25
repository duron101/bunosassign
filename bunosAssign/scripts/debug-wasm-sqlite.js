#!/usr/bin/env node

/**
 * 调试 WebAssembly SQLite 的简单脚本
 */

const fs = require('fs');
const path = require('path');

async function debugWasmSqlite() {
  try {
    console.log('🧪 开始调试 WebAssembly SQLite...');
    
    // 步骤1: 导入模块
    console.log('\n📥 步骤1: 导入模块...');
    const sqlite3InitModule = (await import('../database/sqlite-wasm-3500400/jswasm/sqlite3-node.mjs')).default;
    console.log('✅ 模块导入成功');
    
    // 步骤2: 初始化模块
    console.log('\n🔧 步骤2: 初始化模块...');
    const sqlite3 = await sqlite3InitModule();
    console.log('✅ 模块初始化完成');
    
    // 步骤3: 检查 oo1 对象
    console.log('\n🔍 步骤3: 检查 oo1 对象...');
    if (!sqlite3.oo1 || !sqlite3.oo1.DB) {
      throw new Error('sqlite3.oo1.DB 构造函数不可用');
    }
    console.log('✅ oo1.DB 构造函数可用');
    
    // 步骤4: 创建数据库实例
    console.log('\n🔧 步骤4: 创建数据库实例...');
    const dbPath = path.join(__dirname, '../database/test_debug.db');
    console.log('数据库路径:', dbPath);
    
    const db = new sqlite3.oo1.DB(dbPath);
    console.log('✅ 数据库实例创建成功');
    
    // 步骤5: 检查数据库对象的方法
    console.log('\n🔍 步骤5: 检查数据库对象的方法...');
    console.log('数据库对象类型:', typeof db);
    console.log('数据库对象方法:', Object.getOwnPropertyNames(db));
    console.log('数据库对象原型方法:', Object.getOwnPropertyNames(Object.getPrototypeOf(db)));
    
    // 步骤6: 测试基本操作
    console.log('\n🧪 步骤6: 测试基本操作...');
    
    // 尝试使用 prepare 和 exec
    try {
      console.log('尝试使用 prepare...');
      const stmt = db.prepare('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)');
      stmt.step();
      stmt.finalize();
      console.log('✅ 使用 prepare 创建表成功');
    } catch (error) {
      console.log('❌ prepare 方法失败:', error.message);
    }
    
    try {
      console.log('尝试使用 exec...');
      db.exec('CREATE TABLE IF NOT EXISTS test2 (id INTEGER PRIMARY KEY, name TEXT)');
      console.log('✅ 使用 exec 创建表成功');
    } catch (error) {
      console.log('❌ exec 方法失败:', error.message);
    }
    
    // 关闭数据库
    console.log('关闭数据库...');
    db.close();
    console.log('✅ 数据库已关闭');
    
    // 删除测试数据库
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log('✅ 测试数据库已删除');
    }
    
    console.log('\n🎉 调试完成！');
    
  } catch (error) {
    console.error('\n❌ 调试失败:', error.message);
    console.error('错误详情:', error);
  }
}

debugWasmSqlite();
