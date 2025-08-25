#!/usr/bin/env node

/**
 * 分步测试 WebAssembly SQLite 的各个功能
 */

const fs = require('fs');
const path = require('path');

async function stepByStepTest() {
  try {
    console.log('🧪 开始分步测试...');
    
    // 步骤1: 导入模块
    console.log('\n📥 步骤1: 导入模块...');
    const sqlite3InitModule = (await import('../database/sqlite-wasm-3500400/jswasm/sqlite3-node.mjs')).default;
    console.log('✅ 模块导入成功');
    
    // 步骤2: 初始化模块
    console.log('\n🔧 步骤2: 初始化模块...');
    const sqlite3 = await sqlite3InitModule();
    console.log('✅ 模块初始化完成');
    
    // 步骤3: 创建数据库
    console.log('\n🔧 步骤3: 创建数据库...');
    const dbPath = path.join(__dirname, '../database/test_step.db');
    const db = new sqlite3.oo1.DB(dbPath);
    console.log('✅ 数据库创建成功');
    
    // 步骤4: 创建简单表
    console.log('\n🔧 步骤4: 创建简单表...');
    const createTableStmt = db.prepare('CREATE TABLE IF NOT EXISTS test_simple (id INTEGER PRIMARY KEY, name TEXT)');
    createTableStmt.step();
    createTableStmt.finalize();
    console.log('✅ 简单表创建成功');
    
    // 步骤5: 插入测试数据
    console.log('\n🔧 步骤5: 插入测试数据...');
    const insertStmt = db.prepare('INSERT INTO test_simple (name) VALUES (?)');
    insertStmt.bind(['测试数据']);
    insertStmt.step();
    insertStmt.finalize();
    console.log('✅ 测试数据插入成功');
    
    // 步骤6: 查询测试数据
    console.log('\n🔧 步骤6: 查询测试数据...');
    const selectStmt = db.prepare('SELECT * FROM test_simple');
    selectStmt.step();
    const result = selectStmt.get();
    selectStmt.finalize();
    console.log('✅ 查询成功，结果:', result);
    
    // 步骤7: 关闭数据库
    console.log('\n🔧 步骤7: 关闭数据库...');
    db.close();
    console.log('✅ 数据库关闭成功');
    
    // 步骤8: 删除测试数据库
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log('✅ 测试数据库已删除');
    }
    
    console.log('\n🎉 所有步骤测试通过！');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('错误详情:', error);
  }
}

stepByStepTest();
