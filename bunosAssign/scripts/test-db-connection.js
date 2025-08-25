#!/usr/bin/env node

/**
 * 测试数据库连接和数据
 */

const fs = require('fs');
const path = require('path');

async function testDatabaseConnection() {
  try {
    console.log('🧪 测试数据库连接...');
    
    // 导入 WebAssembly SQLite 模块
    const sqlite3InitModule = (await import('../database/sqlite-wasm-3500400/jswasm/sqlite3-node.mjs')).default;
    const sqlite3 = await sqlite3InitModule();
    
    // 尝试连接数据库
    const dbPath = path.join(__dirname, '../database/bonus_system.db');
    console.log('🔍 数据库路径:', dbPath);
    
    const db = new sqlite3.oo1.DB(dbPath);
    console.log('✅ 数据库连接成功');
    
    // 查询业务线数据
    console.log('\n📊 查询业务线数据...');
    const businessLinesStmt = db.prepare('SELECT COUNT(*) as count FROM business_lines');
    businessLinesStmt.step();
    const businessLinesCount = businessLinesStmt.get();
    businessLinesStmt.finalize();
    console.log('业务线数量:', businessLinesCount);
    
    // 查询部门数据
    console.log('\n📊 查询部门数据...');
    const departmentsStmt = db.prepare('SELECT COUNT(*) as count FROM departments');
    departmentsStmt.step();
    const departmentsCount = departmentsStmt.get();
    departmentsStmt.finalize();
    console.log('部门数量:', departmentsCount);
    
    // 查询岗位数据
    console.log('\n📊 查询岗位数据...');
    const positionsStmt = db.prepare('SELECT COUNT(*) as count FROM positions');
    positionsStmt.step();
    const positionsCount = positionsStmt.get();
    positionsStmt.finalize();
    console.log('岗位数量:', positionsCount);
    
    // 查询员工数据
    console.log('\n📊 查询员工数据...');
    const employeesStmt = db.prepare('SELECT COUNT(*) as count FROM employees');
    employeesStmt.step();
    const employeesCount = employeesStmt.get();
    employeesStmt.finalize();
    console.log('员工数量:', employeesCount);
    
    // 关闭数据库
    db.close();
    console.log('\n✅ 数据库测试完成');
    
  } catch (error) {
    console.error('❌ 数据库测试失败:', error.message);
    console.error('错误详情:', error);
  }
}

testDatabaseConnection();
