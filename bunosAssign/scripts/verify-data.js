#!/usr/bin/env node

/**
 * 验证数据库中的数据
 */

const fs = require('fs');
const path = require('path');

async function verifyData() {
  try {
    console.log('🧪 验证数据库中的数据...');
    
    // 导入 WebAssembly SQLite 模块
    const sqlite3InitModule = (await import('../database/sqlite-wasm-3500400/jswasm/sqlite3-node.mjs')).default;
    const sqlite3 = await sqlite3InitModule();
    
    // 连接数据库
    const dbPath = path.join(__dirname, '../database/bonus_system.db');
    console.log('🔍 数据库路径:', dbPath);
    
    const db = new sqlite3.oo1.DB(dbPath);
    console.log('✅ 数据库连接成功');
    
    // 验证业务线数据
    console.log('\n📊 验证业务线数据...');
    try {
      const countStmt = db.prepare('SELECT COUNT(*) as count FROM business_lines');
      countStmt.step();
      const result = countStmt.get();
      countStmt.finalize();
      console.log('✅ 业务线数量:', result.count);
      
      // 显示前几条业务线
      const sampleStmt = db.prepare('SELECT name, code FROM business_lines LIMIT 3');
      sampleStmt.step();
      const sample = sampleStmt.get();
      sampleStmt.finalize();
      console.log('✅ 业务线示例:', sample);
    } catch (error) {
      console.error('❌ 查询业务线失败:', error.message);
    }
    
    // 验证部门数据
    console.log('\n📊 验证部门数据...');
    try {
      const countStmt = db.prepare('SELECT COUNT(*) as count FROM departments');
      countStmt.step();
      const result = countStmt.get();
      countStmt.finalize();
      console.log('✅ 部门数量:', result.count);
    } catch (error) {
      console.error('❌ 查询部门失败:', error.message);
    }
    
    // 验证岗位数据
    console.log('\n📊 验证岗位数据...');
    try {
      const countStmt = db.prepare('SELECT COUNT(*) as count FROM positions');
      countStmt.step();
      const result = countStmt.get();
      countStmt.finalize();
      console.log('✅ 岗位数量:', result.count);
    } catch (error) {
      console.error('❌ 查询岗位失败:', error.message);
    }
    
    // 验证员工数据
    console.log('\n📊 验证员工数据...');
    try {
      const countStmt = db.prepare('SELECT COUNT(*) as count FROM employees');
      countStmt.step();
      const result = countStmt.get();
      countStmt.finalize();
      console.log('✅ 员工数量:', result.count);
    } catch (error) {
      console.error('❌ 查询员工失败:', error.message);
    }
    
    // 关闭数据库
    db.close();
    console.log('\n✅ 数据验证完成');
    
  } catch (error) {
    console.error('❌ 数据验证失败:', error.message);
    console.error('错误详情:', error);
  }
}

verifyData();
