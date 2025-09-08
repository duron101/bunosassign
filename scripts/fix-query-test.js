#!/usr/bin/env node

/**
 * 修复 WebAssembly SQLite 查询问题的测试脚本
 */

console.log('🧪 开始修复查询问题测试...');

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
    db.exec("INSERT INTO test VALUES (1, 'test1')");
    db.exec("INSERT INTO test VALUES (2, 'test2')");
    db.exec("INSERT INTO test VALUES (3, 'test3')");
    console.log('✅ 测试数据插入成功');
    
    // 步骤6: 尝试不同的查询方法
    console.log('🔍 步骤6: 尝试不同的查询方法...');
    
    // 方法1: 使用 get() 但不指定列索引
    try {
      console.log('  尝试方法1: get() 不指定列索引...');
      const stmt1 = db.prepare('SELECT * FROM test');
      stmt1.step();
      const result1 = stmt1.get();
      stmt1.finalize();
      console.log('  ✅ 方法1成功，结果:', result1);
    } catch (error) {
      console.log('  ❌ 方法1失败:', error.message);
    }
    
    // 方法2: 使用 get() 并指定列索引
    try {
      console.log('  尝试方法2: get() 指定列索引...');
      const stmt2 = db.prepare('SELECT * FROM test');
      stmt2.step();
      const result2 = stmt2.get(0); // 指定列索引 0
      stmt2.finalize();
      console.log('  ✅ 方法2成功，结果:', result2);
    } catch (error) {
      console.log('  ❌ 方法2失败:', error.message);
    }
    
    // 方法3: 使用 get() 并指定列名
    try {
      console.log('  尝试方法3: get() 指定列名...');
      const stmt3 = db.prepare('SELECT id, name FROM test');
      stmt3.step();
      const result3 = stmt3.get(['id', 'name']); // 指定列名
      stmt3.finalize();
      console.log('  ✅ 方法3成功，结果:', result3);
    } catch (error) {
      console.log('  ❌ 方法3失败:', error.message);
    }
    
    // 方法4: 使用 selectValues
    try {
      console.log('  尝试方法4: selectValues...');
      const result4 = db.selectValues('SELECT * FROM test');
      console.log('  ✅ 方法4成功，结果:', result4);
    } catch (error) {
      console.log('  ❌ 方法4失败:', error.message);
    }
    
    // 方法5: 使用 select
    try {
      console.log('  尝试方法5: select...');
      const result5 = db.select('SELECT * FROM test');
      console.log('  ✅ 方法5成功，结果:', result5);
    } catch (error) {
      console.log('  ❌ 方法5失败:', error.message);
    }
    
    // 方法6: 使用 exec 并解析结果
    try {
      console.log('  尝试方法6: exec 解析结果...');
      const result6 = db.exec('SELECT * FROM test');
      console.log('  ✅ 方法6成功，结果:', result6);
    } catch (error) {
      console.log('  ❌ 方法6失败:', error.message);
    }
    
    // 方法7: 逐行读取
    try {
      console.log('  尝试方法7: 逐行读取...');
      const stmt7 = db.prepare('SELECT * FROM test');
      const rows = [];
      while (stmt7.step()) {
        try {
          const row = stmt7.get();
          if (row) rows.push(row);
        } catch (rowError) {
          console.log('    行读取失败:', rowError.message);
        }
      }
      stmt7.finalize();
      console.log('  ✅ 方法7成功，结果:', rows);
    } catch (error) {
      console.log('  ❌ 方法7失败:', error.message);
    }
    
    // 关闭数据库
    db.close();
    console.log('✅ 查询测试完成');
    
  })
  .catch(error => {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', error);
  });
