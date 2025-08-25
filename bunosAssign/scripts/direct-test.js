#!/usr/bin/env node

/**
 * 直接测试脚本
 */

console.log('🧪 开始直接测试...');

// 步骤1: 导入模块
console.log('📥 步骤1: 导入模块...');
import('../database/sqlite-wasm-3500400/jswasm/sqlite3-node.mjs')
  .then(module => {
    console.log('✅ 模块导入成功');
    
    // 步骤2: 初始化模块
    console.log('🔧 步骤2: 初始化模块...');
    return module.default();
  })
  .then(sqlite3 => {
    console.log('✅ 模块初始化成功');
    
    // 步骤3: 测试内存数据库
    console.log('🔍 步骤3: 测试内存数据库...');
    const db = new sqlite3.oo1.DB(':memory:');
    console.log('✅ 内存数据库连接成功');
    
    // 步骤4: 创建测试表
    console.log('🔍 步骤4: 创建测试表...');
    db.exec('CREATE TABLE test (id INTEGER, name TEXT)');
    console.log('✅ 测试表创建成功');
    
    // 步骤5: 插入测试数据
    console.log('🔍 步骤5: 插入测试数据...');
    db.exec("INSERT INTO test VALUES (1, 'test')");
    console.log('✅ 测试数据插入成功');
    
    // 步骤6: 查询测试数据
    console.log('🔍 步骤6: 查询测试数据...');
    const stmt = db.prepare('SELECT * FROM test');
    stmt.step();
    const result = stmt.get();
    stmt.finalize();
    console.log('✅ 查询结果:', result);
    
    // 步骤7: 关闭数据库
    console.log('🔍 步骤7: 关闭数据库...');
    db.close();
    console.log('✅ 内存数据库测试完成');
    
    // 步骤8: 测试文件数据库
    console.log('🔍 步骤8: 测试文件数据库...');
    const fileDb = new sqlite3.oo1.DB('./test.db');
    console.log('✅ 文件数据库连接成功');
    
    // 步骤9: 创建文件测试表
    console.log('🔍 步骤9: 创建文件测试表...');
    fileDb.exec('CREATE TABLE test_file (id INTEGER, name TEXT)');
    console.log('✅ 文件测试表创建成功');
    
    // 步骤10: 插入文件测试数据
    console.log('🔍 步骤10: 插入文件测试数据...');
    fileDb.exec("INSERT INTO test_file VALUES (1, 'file_test')");
    console.log('✅ 文件测试数据插入成功');
    
    // 步骤11: 查询文件测试数据
    console.log('🔍 步骤11: 查询文件测试数据...');
    const fileStmt = fileDb.prepare('SELECT * FROM test_file');
    fileStmt.step();
    const fileResult = fileStmt.get();
    fileStmt.finalize();
    console.log('✅ 文件查询结果:', fileResult);
    
    // 步骤12: 关闭文件数据库
    console.log('🔍 步骤12: 关闭文件数据库...');
    fileDb.close();
    console.log('✅ 文件数据库测试完成');
    
    // 步骤13: 检查文件是否创建
    console.log('🔍 步骤13: 检查文件是否创建...');
    const fs = require('fs');
    if (fs.existsSync('./test.db')) {
      const stats = fs.statSync('./test.db');
      console.log('✅ 数据库文件已创建，大小:', stats.size, '字节');
    } else {
      console.log('❌ 数据库文件未创建');
    }
    
    console.log('\n🎉 所有测试完成！');
  })
  .catch(error => {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', error);
  });
