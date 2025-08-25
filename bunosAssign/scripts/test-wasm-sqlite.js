#!/usr/bin/env node

/**
 * 测试 WebAssembly SQLite 的 API
 */

const fs = require('fs');
const path = require('path');

async function testWasmSqlite() {
  try {
    console.log('🧪 测试 WebAssembly SQLite API...');
    
    // 动态导入 WebAssembly SQLite 模块
    console.log('📥 导入模块...');
    const sqlite3InitModule = (await import('../database/sqlite-wasm-3500400/jswasm/sqlite3-node.mjs')).default;
    
    console.log('🔧 初始化模块...');
    const sqlite3 = await sqlite3InitModule();
    
    console.log('📋 检查 sqlite3 对象:');
    console.log('sqlite3 类型:', typeof sqlite3);
    console.log('sqlite3 键:', Object.keys(sqlite3));
    
    // 检查 oo1 对象（对象导向接口）
    if (sqlite3.oo1) {
      console.log('\n🔍 检查 oo1 对象:');
      console.log('oo1 类型:', typeof sqlite3.oo1);
      console.log('oo1 键:', Object.keys(sqlite3.oo1));
      
      if (typeof sqlite3.oo1.DB === 'function') {
        console.log('✅ oo1.DB 是一个构造函数');
      }
    }
    
    // 检查 client 对象
    if (sqlite3.client) {
      console.log('\n🔍 检查 client 对象:');
      console.log('client 类型:', typeof sqlite3.client);
      console.log('client 键:', Object.keys(sqlite3.client));
    }
    
    // 检查 capi 对象（C API 接口）
    if (sqlite3.capi) {
      console.log('\n🔍 检查 capi 对象:');
      console.log('capi 类型:', typeof sqlite3.capi);
      console.log('capi 键:', Object.keys(sqlite3.capi).slice(0, 20)); // 只显示前20个
    }
    
    // 尝试使用 oo1.DB 创建数据库
    if (sqlite3.oo1 && typeof sqlite3.oo1.DB === 'function') {
      console.log('\n🧪 尝试创建数据库连接...');
      try {
        const dbPath = path.join(__dirname, '../database/test.db');
        const db = new sqlite3.oo1.DB(dbPath);
        console.log('✅ 数据库连接创建成功！');
        console.log('数据库路径:', dbPath);
        
        // 测试执行 SQL
        console.log('🧪 测试执行 SQL...');
        db.exec('CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)');
        console.log('✅ 表创建成功');
        
        // 关闭数据库
        db.close();
        console.log('✅ 数据库连接已关闭');
        
        // 删除测试数据库
        if (fs.existsSync(dbPath)) {
          fs.unlinkSync(dbPath);
          console.log('✅ 测试数据库已删除');
        }
        
      } catch (dbError) {
        console.error('❌ 数据库操作失败:', dbError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', error);
  }
}

testWasmSqlite();
