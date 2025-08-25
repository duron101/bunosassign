-- 项目协作模块数据库表结构
-- 扩展现有项目功能，支持管理层发布-项目经理组建-管理层审批的协作流程

USE bonus_system;

-- 1. 扩展现有项目表，添加协作相关字段
ALTER TABLE projects ADD COLUMN IF NOT EXISTS work_content TEXT COMMENT '工作内容详情';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS bonus_scale DECIMAL(15,2) DEFAULT 0 COMMENT '预计奖金规模';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS skill_requirements JSON COMMENT '技能要求';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS cooperation_status VARCHAR(20) DEFAULT 'published' COMMENT '协作状态：published-已发布，team_building-组建中，pending_approval-待审批，approved-已批准，rejected-已拒绝';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS published_by INT COMMENT '发布人ID';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS published_at DATETIME COMMENT '发布时间';

-- 2. 项目需求表 - 管理层发布的详细需求
CREATE TABLE IF NOT EXISTS project_requirements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL COMMENT '项目ID',
    requirement_type VARCHAR(50) NOT NULL COMMENT '需求类型：technical-技术，business-业务，quality-质量',
    title VARCHAR(200) NOT NULL COMMENT '需求标题',
    description TEXT NOT NULL COMMENT '需求描述',
    priority VARCHAR(20) DEFAULT 'medium' COMMENT '优先级：low-低，medium-中，high-高，critical-紧急',
    is_mandatory BOOLEAN DEFAULT true COMMENT '是否必须满足',
    acceptance_criteria JSON COMMENT '验收标准',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) COMMENT '项目需求表';

-- 3. 项目角色定义表 - 项目内的角色定义
CREATE TABLE IF NOT EXISTS project_roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '角色名称',
    code VARCHAR(50) UNIQUE NOT NULL COMMENT '角色代码',
    description TEXT COMMENT '角色描述',
    responsibilities JSON COMMENT '职责清单',
    required_skills JSON COMMENT '所需技能',
    level VARCHAR(20) COMMENT '级别要求',
    is_system_role BOOLEAN DEFAULT false COMMENT '是否为系统角色',
    status TINYINT DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT '项目角色定义表';

-- 4. 项目团队申请表 - 项目经理提交的团队组建申请
CREATE TABLE IF NOT EXISTS project_team_applications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL COMMENT '项目ID',
    applicant_id INT NOT NULL COMMENT '申请人ID（项目经理）',
    team_name VARCHAR(100) COMMENT '团队名称',
    team_description TEXT COMMENT '团队描述',
    total_members INT DEFAULT 0 COMMENT '团队总人数',
    estimated_cost DECIMAL(15,2) DEFAULT 0 COMMENT '预估成本',
    application_reason TEXT COMMENT '申请理由',
    status VARCHAR(20) DEFAULT 'pending' COMMENT '状态：pending-待审批，approved-已批准，rejected-已拒绝，modified-已修改',
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '提交时间',
    approved_by INT COMMENT '审批人ID',
    approved_at DATETIME COMMENT '审批时间',
    approval_comments TEXT COMMENT '审批意见',
    rejection_reason TEXT COMMENT '拒绝理由',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (applicant_id) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
) COMMENT '项目团队申请表';

-- 5. 扩展项目成员表，添加申请和审批相关字段
ALTER TABLE project_members ADD COLUMN IF NOT EXISTS application_id INT COMMENT '关联的团队申请ID';
ALTER TABLE project_members ADD COLUMN IF NOT EXISTS role_name VARCHAR(100) COMMENT '角色名称';
ALTER TABLE project_members ADD COLUMN IF NOT EXISTS estimated_workload DECIMAL(5,2) DEFAULT 1.0 COMMENT '预估工作量占比';
ALTER TABLE project_members ADD COLUMN IF NOT EXISTS cost_center VARCHAR(50) COMMENT '成本中心';
ALTER TABLE project_members ADD COLUMN IF NOT EXISTS allocation_percentage DECIMAL(5,2) DEFAULT 100.0 COMMENT '分配比例（%）';

-- 为project_members表添加外键约束
ALTER TABLE project_members ADD FOREIGN KEY (application_id) REFERENCES project_team_applications(id) ON DELETE SET NULL;

-- 6. 项目协作日志表 - 记录协作流程中的关键操作
CREATE TABLE IF NOT EXISTS project_collaboration_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL COMMENT '项目ID',
    actor_id INT NOT NULL COMMENT '操作人ID',
    action_type VARCHAR(50) NOT NULL COMMENT '操作类型：publish-发布，apply-申请，approve-批准，reject-拒绝，modify-修改',
    action_target VARCHAR(50) COMMENT '操作对象：project-项目，team-团队，member-成员',
    action_description TEXT COMMENT '操作描述',
    old_data JSON COMMENT '原数据',
    new_data JSON COMMENT '新数据',
    comments TEXT COMMENT '备注',
    ip_address VARCHAR(50) COMMENT 'IP地址',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES users(id)
) COMMENT '项目协作日志表';

-- 7. 项目审批流程表 - 定义不同类型的审批流程
CREATE TABLE IF NOT EXISTS project_approval_flows (
    id INT PRIMARY KEY AUTO_INCREMENT,
    flow_name VARCHAR(100) NOT NULL COMMENT '流程名称',
    flow_type VARCHAR(50) NOT NULL COMMENT '流程类型：team_application-团队申请，member_change-成员变更',
    description TEXT COMMENT '流程描述',
    steps JSON NOT NULL COMMENT '审批步骤配置',
    is_default BOOLEAN DEFAULT false COMMENT '是否为默认流程',
    status TINYINT DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
    created_by INT NOT NULL COMMENT '创建人ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
) COMMENT '项目审批流程表';

-- 8. 项目审批实例表 - 记录具体的审批实例
CREATE TABLE IF NOT EXISTS project_approval_instances (
    id INT PRIMARY KEY AUTO_INCREMENT,
    flow_id INT NOT NULL COMMENT '审批流程ID',
    project_id INT NOT NULL COMMENT '项目ID',
    application_id INT COMMENT '团队申请ID',
    current_step INT DEFAULT 1 COMMENT '当前步骤',
    status VARCHAR(20) DEFAULT 'pending' COMMENT '状态：pending-进行中，approved-已批准，rejected-已拒绝',
    initiated_by INT NOT NULL COMMENT '发起人ID',
    initiated_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '发起时间',
    completed_at DATETIME COMMENT '完成时间',
    approval_data JSON COMMENT '审批数据',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (flow_id) REFERENCES project_approval_flows(id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (application_id) REFERENCES project_team_applications(id) ON DELETE SET NULL,
    FOREIGN KEY (initiated_by) REFERENCES users(id)
) COMMENT '项目审批实例表';

-- 9. 项目通知表 - 协作过程中的通知消息
CREATE TABLE IF NOT EXISTS project_notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL COMMENT '项目ID',
    recipient_id INT NOT NULL COMMENT '接收人ID',
    sender_id INT COMMENT '发送人ID',
    notification_type VARCHAR(50) NOT NULL COMMENT '通知类型：project_published-项目发布，team_applied-团队申请，approval_needed-需要审批，approved-已批准，rejected-已拒绝',
    title VARCHAR(200) NOT NULL COMMENT '标题',
    content TEXT NOT NULL COMMENT '内容',
    related_id INT COMMENT '相关记录ID',
    is_read BOOLEAN DEFAULT false COMMENT '是否已读',
    read_at DATETIME COMMENT '阅读时间',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
) COMMENT '项目通知表';

-- 创建索引以提高查询性能
CREATE INDEX idx_project_requirements_project ON project_requirements(project_id);
CREATE INDEX idx_project_team_applications_project ON project_team_applications(project_id);
CREATE INDEX idx_project_team_applications_status ON project_team_applications(status);
CREATE INDEX idx_project_members_application ON project_members(application_id);
CREATE INDEX idx_project_collaboration_logs_project ON project_collaboration_logs(project_id);
CREATE INDEX idx_project_collaboration_logs_actor ON project_collaboration_logs(actor_id);
CREATE INDEX idx_project_approval_instances_project ON project_approval_instances(project_id);
CREATE INDEX idx_project_notifications_recipient ON project_notifications(recipient_id, is_read);

-- 插入系统默认项目角色数据
INSERT INTO project_roles (name, code, description, responsibilities, required_skills, level, is_system_role) VALUES
('项目经理', 'PM', '项目管理和协调', '["项目规划", "团队管理", "进度控制", "风险管理", "沟通协调"]', '["项目管理", "团队领导", "沟通能力"]', 'senior', true),
('技术负责人', 'TECH_LEAD', '技术架构和开发指导', '["技术架构设计", "代码审查", "技术难点攻关", "团队技术指导"]', '["技术架构", "编程能力", "技术领导"]', 'senior', true),
('高级开发工程师', 'SENIOR_DEV', '核心模块开发', '["核心功能开发", "技术方案设计", "代码审查", "技术分享"]', '["编程能力", "系统设计", "问题解决"]', 'senior', true),
('开发工程师', 'DEVELOPER', '功能模块开发', '["功能开发", "单元测试", "文档编写", "Bug修复"]', '["编程能力", "逻辑思维", "学习能力"]', 'middle', true),
('测试工程师', 'TESTER', '质量保障和测试', '["测试用例设计", "功能测试", "自动化测试", "缺陷跟踪"]', '["测试方法", "工具使用", "细致认真"]', 'middle', true),
('UI/UX设计师', 'DESIGNER', '用户界面和体验设计', '["界面设计", "交互设计", "用户体验优化", "设计规范"]', '["设计能力", "用户思维", "工具熟练"]', 'middle', true),
('产品经理', 'PRODUCT', '需求分析和产品规划', '["需求分析", "产品规划", "用户调研", "功能评审"]', '["产品思维", "需求分析", "沟通协调"]', 'middle', true);

-- 插入默认审批流程
INSERT INTO project_approval_flows (flow_name, flow_type, description, steps, is_default, created_by) VALUES
('团队申请标准流程', 'team_application', '项目团队申请的标准审批流程', 
'[
  {
    "step": 1,
    "name": "部门负责人审批",
    "description": "部门负责人审批团队申请",
    "approver_type": "department_manager",
    "required": true,
    "auto_pass": false
  },
  {
    "step": 2,
    "name": "人力资源审批",
    "description": "人力资源部门审批人员配置",
    "approver_type": "hr_manager",
    "required": true,
    "auto_pass": false
  },
  {
    "step": 3,
    "name": "高级管理层审批",
    "description": "高级管理层最终审批",
    "approver_type": "senior_management",
    "required": true,
    "auto_pass": false
  }
]', 
true, 1);

COMMIT;