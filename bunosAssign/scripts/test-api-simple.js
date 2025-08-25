// 简单的 API 测试脚本
console.log('🧪 开始测试 API...');

// 测试部门列表 API
async function testDepartments() {
  try {
    console.log('\n📋 测试部门列表 API...');
    const response = await fetch('http://localhost:3001/api/departments');
    const data = await response.json();
    console.log('✅ 部门列表响应:', data);
    console.log(`📊 部门数量: ${data.data?.departments?.length || 0}`);
  } catch (error) {
    console.error('❌ 部门列表 API 失败:', error.message);
  }
}

// 测试岗位列表 API
async function testPositions() {
  try {
    console.log('\n📋 测试岗位列表 API...');
    const response = await fetch('http://localhost:3001/api/positions');
    const data = await response.json();
    console.log('✅ 岗位列表响应:', data);
    console.log(`📊 岗位数量: ${data.data?.positions?.length || 0}`);
  } catch (error) {
    console.error('❌ 岗位列表 API 失败:', error.message);
  }
}

// 测试业务线列表 API
async function testBusinessLines() {
  try {
    console.log('\n📋 测试业务线列表 API...');
    const response = await fetch('http://localhost:3001/api/business-lines');
    const data = await response.json();
    console.log('✅ 业务线列表响应:', data);
    console.log(`📊 业务线数量: ${data.data?.businessLines?.length || 0}`);
  } catch (error) {
    console.error('❌ 业务线列表 API 失败:', error.message);
  }
}

// 运行所有测试
async function runAllTests() {
  await testDepartments();
  await testPositions();
  await testBusinessLines();
  console.log('\n🎯 所有测试完成！');
}

runAllTests();
