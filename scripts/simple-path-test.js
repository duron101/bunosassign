#!/usr/bin/env node

/**
 * 简单的路径测试
 */

const path = require('path');

async function simplePathTest() {
  try {
    console.log('🧪 开始简单路径测试...');
    
    // 导入模块
    console.log('📥 导入模块...');
    const sqlite3InitModule = (await import('../database/sqlite-wasm-3500400/jswasm/sqlite3-node.mjs')).default;
    console.log('✅ 模块导入成功');
    
    // 初始化
    console.log('🔧 初始化模块...');
    const sqlite3 = await sqlite3InitModule();
    console.log('✅ 模块初始化成功');
    
    // 测试内存数据库
    console.log('\n🔍 测试内存数据库...');
    try {
      const db = new sqlite3.oo1.DB(':memory:');
      console.log('✅ 内存数据库连接成功');
      
      // 创建测试表
      db.exec('CREATE TABLE test (id INTEGER, name TEXT)');
      console.log('✅ 测试表创建成功');
      
      // 插入测试数据
      db.exec("INSERT INTO test VALUES (1, 'test')");
      console.log('✅ 测试数据插入成功');
      
      // 查询测试数据
      const stmt = db.prepare('SELECT * FROM test');
      stmt.step();
      const result = stmt.get();
      stmt.finalize();
      console.log('✅ 查询结果:', result);
      
      db.close();
      console.log('✅ 内存数据库测试完成');
    } catch (error) {
      console.error('❌ 内存数据库测试失败:', error.message);
    }
    
    // 测试文件数据库 - 相对路径
    console.log('\n🔍 测试文件数据库 - 相对路径...');
    try {
      const db = new sqlite3.oo1.DB('./test.db');
      console.log('✅ 文件数据库连接成功');
      
      // 创建测试表
      db.exec('CREATE TABLE test_file (id INTEGER, name TEXT)');
      console.log('✅ 文件测试表创建成功');
      
      // 插入测试数据
      db.exec("INSERT INTO test_file VALUES (1, 'file_test')");
      console.log('✅ 文件测试数据插入成功');
      
      // 查询测试数据
      const stmt = db.prepare('SELECT * FROM test_file');
      stmt.step();
      const result = stmt.get();
      stmt.finalize();
      console.log('✅ 文件查询结果:', result);
      
      db.close();
      console.log('✅ 文件数据库测试完成');
      
      // 检查文件是否创建
      const fs = require('fs');
      if (fs.existsSync('./test.db')) {
        const stats = fs.statSync('./test.db');
        console.log('✅ 数据库文件已创建，大小:', stats.size, '字节');
      } else {
        console.log('❌ 数据库文件未创建');
      }
      
    } catch (error) {
      console.error('❌ 文件数据库测试失败:', error.message);
    }
    
    console.log('\n✅ 所有测试完成');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', error);
  }
}

simplePathTest();
