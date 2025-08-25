const path = require('path');
const fs = require('fs');

// SQLite3 DLL路径
const sqliteDllPath = path.join(__dirname, '../database/sqlite3.dll');

// 检查DLL文件是否存在
if (!fs.existsSync(sqliteDllPath)) {
  throw new Error(`SQLite3 DLL not found at: ${sqliteDllPath}`);
}

console.log(`Loading SQLite3 from: ${sqliteDllPath}`);

// 尝试加载SQLite3 DLL
try {
  const sqlite3 = require(sqliteDllPath);
  module.exports = sqlite3;
} catch (error) {
  console.error('Failed to load SQLite3 DLL:', error.message);
  
  // 回退到模拟实现
  module.exports = {
    Database: class MockDatabase {
      constructor(filename, callback) {
        console.log('Using mock SQLite3 database');
        if (callback) callback(null);
      }
      
      run(sql, params, callback) {
        if (callback) callback(null);
      }
      
      get(sql, params, callback) {
        if (callback) callback(null, null);
      }
      
      all(sql, params, callback) {
        if (callback) callback(null, []);
      }
      
      close(callback) {
        if (callback) callback(null);
      }
    }
  };
}