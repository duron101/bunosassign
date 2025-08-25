#!/usr/bin/env node

/**
 * 只创建表结构的脚本
 */

const fs = require('fs');
const path = require('path');

async function createTablesOnly() {
  try {
    console.log('🧪 开始创建表结构...');
    
    // 导入 WebAssembly SQLite 模块
    const sqlite3InitModule = (await import('../database/sqlite-wasm-3500400/jswasm/sqlite3-node.mjs')).default;
    const sqlite3 = await sqlite3InitModule();
    
    // 连接数据库
    const dbPath = path.join(__dirname, '../database/bonus_system.db');
    console.log('🔍 数据库路径:', dbPath);
    
    const db = new sqlite3.oo1.DB(dbPath);
    console.log('✅ 数据库连接成功');
    
    // 创建业务线表
    console.log('\n🔧 创建业务线表...');
    try {
      db.exec('CREATE TABLE IF NOT EXISTS business_lines (id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(100) NOT NULL, code VARCHAR(50) NOT NULL UNIQUE, description TEXT, weight DECIMAL(5,2) NOT NULL, status INTEGER DEFAULT 1)');
      console.log('✅ 业务线表创建成功');
    } catch (error) {
      console.error('❌ 业务线表创建失败:', error.message);
    }
    
    // 创建部门表
    console.log('\n🔧 创建部门表...');
    try {
      db.exec('CREATE TABLE IF NOT EXISTS departments (id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(100) NOT NULL, code VARCHAR(50) NOT NULL UNIQUE, description TEXT, parent_id INTEGER, business_line_id INTEGER, manager_id INTEGER, status INTEGER DEFAULT 1, sort INTEGER DEFAULT 0)');
      console.log('✅ 部门表创建成功');
    } catch (error) {
      console.error('❌ 部门表创建失败:', error.message);
    }
    
    // 创建岗位表
    console.log('\n🔧 创建岗位表...');
    try {
      db.exec('CREATE TABLE IF NOT EXISTS positions (id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(100) NOT NULL, code VARCHAR(50) NOT NULL UNIQUE, level VARCHAR(20) NOT NULL, description TEXT, benchmark_value DECIMAL(10,2) NOT NULL, business_line_id INTEGER, status INTEGER DEFAULT 1)');
      console.log('✅ 岗位表创建成功');
    } catch (error) {
      console.error('❌ 岗位表创建失败:', error.message);
    }
    
    // 创建角色表
    console.log('\n🔧 创建角色表...');
    try {
      db.exec('CREATE TABLE IF NOT EXISTS roles (id INTEGER PRIMARY KEY AUTOINCREMENT, name VARCHAR(100) NOT NULL, code VARCHAR(50) NOT NULL UNIQUE, description TEXT, permissions TEXT, status INTEGER DEFAULT 1)');
      console.log('✅ 角色表创建成功');
    } catch (error) {
      console.error('❌ 角色表创建失败:', error.message);
    }
    
    // 创建用户表
    console.log('\n🔧 创建用户表...');
    try {
      db.exec('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username VARCHAR(50) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL, real_name VARCHAR(100) NOT NULL, email VARCHAR(100), phone VARCHAR(20), role_id INTEGER NOT NULL, department_id INTEGER, status INTEGER DEFAULT 1)');
      console.log('✅ 用户表创建成功');
    } catch (error) {
      console.error('❌ 用户表创建失败:', error.message);
    }
    
    // 创建员工表
    console.log('\n🔧 创建员工表...');
    try {
      db.exec('CREATE TABLE IF NOT EXISTS employees (id INTEGER PRIMARY KEY AUTOINCREMENT, employee_no VARCHAR(50) NOT NULL UNIQUE, name VARCHAR(100) NOT NULL, department_id INTEGER, position_id INTEGER, annual_salary DECIMAL(12,2) NOT NULL, entry_date DATE NOT NULL, phone VARCHAR(20), email VARCHAR(100), id_card VARCHAR(18), emergency_contact VARCHAR(100), emergency_phone VARCHAR(20), address TEXT, status INTEGER DEFAULT 1, resign_date DATE, resign_reason TEXT, handover_status VARCHAR(50), user_id INTEGER)');
      console.log('✅ 员工表创建成功');
    } catch (error) {
      console.error('❌ 员工表创建失败:', error.message);
    }
    
    // 验证表是否创建成功
    console.log('\n🔍 验证表结构...');
    try {
      const tablesStmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table'");
      tablesStmt.step();
      const tables = [];
      while (tablesStmt.step()) {
        const row = tablesStmt.get();
        if (row) tables.push(row.name);
      }
      tablesStmt.finalize();
      console.log('✅ 已创建的表:', tables);
    } catch (error) {
      console.error('❌ 验证表结构失败:', error.message);
    }
    
    // 关闭数据库
    db.close();
    console.log('\n✅ 表结构创建完成');
    
  } catch (error) {
    console.error('❌ 创建表结构失败:', error.message);
    console.error('错误详情:', error);
  }
}

createTablesOnly();
