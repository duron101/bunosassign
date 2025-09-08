#!/usr/bin/env node

/**
 * 简单的数据库连接测试
 */

const path = require('path');

async function simpleTest() {
  try {
    console.log('🧪 简单测试开始...');
    
    // 导入模块
    console.log('📥 导入模块...');
    const sqlite3InitModule = (await import('../database/sqlite-wasm-3500400/jswasm/sqlite3-node.mjs')).default;
    console.log('✅ 模块导入成功');
    
    // 初始化
    console.log('🔧 初始化模块...');
    const sqlite3 = await sqlite3InitModule();
    console.log('✅ 模块初始化成功');
    
    // 连接数据库
    console.log('🔌 连接数据库...');
    const dbPath = path.join(__dirname, '../database/bonus_system.db');
    const db = new sqlite3.oo1.DB(dbPath);
    console.log('✅ 数据库连接成功');
    
    // 简单查询
    console.log('🔍 执行简单查询...');
    const stmt = db.prepare('SELECT 1 as test');
    stmt.step();
    const result = stmt.get();
    stmt.finalize();
    console.log('✅ 查询结果:', result);
    
    // 关闭数据库
    db.close();
    console.log('✅ 测试完成');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', error);
  }
}

simpleTest();
