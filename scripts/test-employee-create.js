const axios = require('axios');

// 测试员工创建 API
async function testCreateEmployee() {
  try {
    console.log('🧪 测试员工创建 API...');
    
    const testData = {
      employeeNo: 'TEST001',
      name: '测试员工',
      departmentId: '1', // 使用字符串 ID
      positionId: '1',   // 使用字符串 ID
      annualSalary: 200000,
      entryDate: '2025-01-01',
      phone: '13800000000',
      email: 'test@company.com'
    };

    console.log('📝 测试数据:', JSON.stringify(testData, null, 2));

    const response = await axios.post('http://localhost:3001/api/employees', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ API 调用成功!');
    console.log('📊 响应状态:', response.status);
    console.log('📄 响应数据:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ API 调用失败:');
    if (error.response) {
      console.error('📊 响应状态:', error.response.status);
      console.error('📄 响应数据:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('🚫 错误信息:', error.message);
    }
  }
}

// 运行测试
testCreateEmployee();
