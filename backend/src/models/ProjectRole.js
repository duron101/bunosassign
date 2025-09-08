const { createModel } = require('../adapters/model-adapter')

const ProjectRole = createModel('project_roles')

// 项目角色表 - 定义项目内的角色类型
ProjectRole.attributes = {
  id: { type: 'STRING', primaryKey: true },
  name: { type: 'STRING', allowNull: false }, // 角色名称：技术负责人、开发工程师、测试工程师、产品经理等
  code: { type: 'STRING', allowNull: false, unique: true }, // 角色代码
  description: { type: 'TEXT', allowNull: true }, // 角色描述
  defaultWeight: { 
    type: 'DECIMAL', 
    allowNull: false, 
    defaultValue: 1.0 // 默认权重系数
  },
  responsibilities: { type: 'JSON', allowNull: true }, // 职责列表
  requiredSkills: { type: 'JSON', allowNull: true }, // 所需技能
  status: { 
    type: 'INTEGER', 
    allowNull: false, 
    defaultValue: 1 // 1-启用, 0-禁用
  },
  createdAt: { type: 'DATE', defaultValue: Date.now },
  updatedAt: { type: 'DATE', defaultValue: Date.now }
}

module.exports = ProjectRole