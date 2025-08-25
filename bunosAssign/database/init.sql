-- 奖金模拟系统数据库初始化脚本
-- 创建数据库
CREATE DATABASE IF NOT EXISTS bonus_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE bonus_system;

-- 1. 角色表
CREATE TABLE roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL COMMENT '角色名称',
    description VARCHAR(200) COMMENT '角色描述',
    permissions JSON COMMENT '权限列表',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT '角色表';

-- 2. 业务条线表
CREATE TABLE business_lines (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '条线名称',
    code VARCHAR(50) UNIQUE NOT NULL COMMENT '条线代码',
    weight DECIMAL(5,2) DEFAULT 0 COMMENT '权重比例',
    status TINYINT DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT '业务条线表';

-- 3. 部门表
CREATE TABLE departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '部门名称',
    code VARCHAR(50) UNIQUE NOT NULL COMMENT '部门代码',
    parent_id INT COMMENT '上级部门ID',
    line_id INT COMMENT '所属条线ID',
    manager_id INT COMMENT '部门经理ID',
    status TINYINT DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES departments(id),
    FOREIGN KEY (line_id) REFERENCES business_lines(id)
) COMMENT '部门表';

-- 4. 岗位表
CREATE TABLE positions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '岗位名称',
    code VARCHAR(50) UNIQUE NOT NULL COMMENT '岗位代码',
    level VARCHAR(20) NOT NULL COMMENT '岗位等级',
    benchmark_value DECIMAL(5,2) NOT NULL COMMENT '基准值比例',
    line_id INT COMMENT '所属条线ID',
    description TEXT COMMENT '岗位描述',
    status TINYINT DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (line_id) REFERENCES business_lines(id)
) COMMENT '岗位表';

-- 5. 用户表
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL COMMENT '用户名',
    password VARCHAR(100) NOT NULL COMMENT '密码',
    real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
    email VARCHAR(100) UNIQUE NOT NULL COMMENT '邮箱',
    phone VARCHAR(20) COMMENT '手机号',
    role_id INT NOT NULL COMMENT '角色ID',
    department_id INT COMMENT '部门ID',
    status TINYINT DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
    last_login DATETIME COMMENT '最后登录时间',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (department_id) REFERENCES departments(id)
) COMMENT '用户表';

-- 6. 员工表
CREATE TABLE employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_no VARCHAR(50) UNIQUE NOT NULL COMMENT '工号',
    name VARCHAR(50) NOT NULL COMMENT '姓名',
    department_id INT NOT NULL COMMENT '部门ID',
    position_id INT NOT NULL COMMENT '岗位ID',
    annual_salary DECIMAL(12,2) NOT NULL COMMENT '年薪',
    entry_date DATE NOT NULL COMMENT '入职日期',
    status TINYINT DEFAULT 1 COMMENT '状态：1-在职，0-离职',
    user_id INT COMMENT '关联用户ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (position_id) REFERENCES positions(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
) COMMENT '员工表';

-- 7. 绩效记录表
CREATE TABLE performance_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL COMMENT '员工ID',
    period VARCHAR(20) NOT NULL COMMENT '考核期间',
    rating VARCHAR(20) NOT NULL COMMENT '绩效评级',
    coefficient DECIMAL(3,2) NOT NULL COMMENT '绩效系数',
    excellence_rating VARCHAR(5) COMMENT '卓越贡献评级',
    excellence_coefficient DECIMAL(3,2) COMMENT '卓越贡献系数',
    comments TEXT COMMENT '评价意见',
    evaluator_id INT NOT NULL COMMENT '评价人ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (evaluator_id) REFERENCES users(id)
) COMMENT '绩效记录表';

-- 8. 奖金池表
CREATE TABLE bonus_pools (
    id INT PRIMARY KEY AUTO_INCREMENT,
    period VARCHAR(20) UNIQUE NOT NULL COMMENT '计算期间',
    total_profit DECIMAL(15,2) NOT NULL COMMENT '公司总利润',
    pool_ratio DECIMAL(5,2) NOT NULL COMMENT '奖金池比例',
    pool_amount DECIMAL(15,2) NOT NULL COMMENT '奖金池总额',
    reserve_ratio DECIMAL(5,2) DEFAULT 0 COMMENT '预留调节金比例',
    special_ratio DECIMAL(5,2) DEFAULT 0 COMMENT '特别奖励基金比例',
    distributable_amount DECIMAL(15,2) NOT NULL COMMENT '可分配金额',
    status VARCHAR(20) DEFAULT 'draft' COMMENT '状态：draft-草稿，active-生效，archived-归档',
    created_by INT NOT NULL COMMENT '创建人ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
) COMMENT '奖金池表';

-- 9. 条线奖金分配表
CREATE TABLE line_bonus_allocations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pool_id INT NOT NULL COMMENT '奖金池ID',
    line_id INT NOT NULL COMMENT '条线ID',
    weight DECIMAL(5,2) NOT NULL COMMENT '权重',
    bonus_amount DECIMAL(15,2) NOT NULL COMMENT '分配金额',
    basic_amount DECIMAL(15,2) NOT NULL COMMENT '基础奖金池',
    excellence_amount DECIMAL(15,2) NOT NULL COMMENT '卓越贡献奖金池',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pool_id) REFERENCES bonus_pools(id),
    FOREIGN KEY (line_id) REFERENCES business_lines(id)
) COMMENT '条线奖金分配表';

-- 10. 员工奖金记录表
CREATE TABLE employee_bonus_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    pool_id INT NOT NULL COMMENT '奖金池ID',
    employee_id INT NOT NULL COMMENT '员工ID',
    department_id INT NOT NULL COMMENT '部门ID',
    line_id INT NOT NULL COMMENT '条线ID',
    position_id INT NOT NULL COMMENT '岗位ID',
    benchmark_value DECIMAL(5,2) NOT NULL COMMENT '岗位基准值',
    performance_coefficient DECIMAL(3,2) NOT NULL COMMENT '绩效系数',
    basic_points DECIMAL(8,2) NOT NULL COMMENT '基础积分',
    basic_bonus DECIMAL(12,2) NOT NULL COMMENT '基础奖金',
    excellence_rating VARCHAR(5) COMMENT '卓越贡献评级',
    excellence_bonus DECIMAL(12,2) DEFAULT 0 COMMENT '卓越贡献奖金',
    total_bonus DECIMAL(12,2) NOT NULL COMMENT '总奖金',
    history_average DECIMAL(12,2) COMMENT '历史平均奖金',
    minimum_bonus DECIMAL(12,2) COMMENT '保底金额',
    final_bonus DECIMAL(12,2) NOT NULL COMMENT '最终奖金',
    status VARCHAR(20) DEFAULT 'calculated' COMMENT '状态：calculated-已计算，confirmed-已确认，paid-已发放',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pool_id) REFERENCES bonus_pools(id),
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (line_id) REFERENCES business_lines(id),
    FOREIGN KEY (position_id) REFERENCES positions(id)
) COMMENT '员工奖金记录表';

-- 11. 模拟场景表
CREATE TABLE simulation_scenarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '场景名称',
    description TEXT COMMENT '场景描述',
    base_pool_id INT NOT NULL COMMENT '基础奖金池ID',
    parameters JSON NOT NULL COMMENT '模拟参数',
    created_by INT NOT NULL COMMENT '创建人ID',
    is_public BOOLEAN DEFAULT FALSE COMMENT '是否公开',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (base_pool_id) REFERENCES bonus_pools(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
) COMMENT '模拟场景表';

-- 12. 操作日志表
CREATE TABLE operation_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '操作用户ID',
    action VARCHAR(50) NOT NULL COMMENT '操作动作',
    target_type VARCHAR(50) NOT NULL COMMENT '目标类型',
    target_id INT COMMENT '目标ID',
    details JSON COMMENT '操作详情',
    ip_address VARCHAR(50) COMMENT 'IP地址',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
) COMMENT '操作日志表';

-- 创建索引
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_employees_no ON employees(employee_no);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_performance_employee_period ON performance_records(employee_id, period);
CREATE INDEX idx_bonus_records_pool_employee ON employee_bonus_records(pool_id, employee_id);
CREATE INDEX idx_operation_logs_user_action ON operation_logs(user_id, action);
CREATE INDEX idx_operation_logs_created_at ON operation_logs(created_at);

-- 初始化基础数据
-- 角色数据
INSERT INTO roles (name, description, permissions) VALUES
('超级管理员', '系统超级管理员，拥有所有权限', '["*"]'),
('HR管理员', '人力资源管理员', '["user:read", "user:create", "user:update", "employee:*", "calculation:*", "report:*"]'),
('财务管理员', '财务管理员', '["calculation:read", "calculation:create", "report:read"]'),
('部门管理者', '部门管理者', '["employee:read", "calculation:read", "report:read"]'),
('普通员工', '普通员工', '["personal:read"]');

-- 业务条线数据
INSERT INTO business_lines (name, code, weight) VALUES
('实施', 'IMPL', 0.55),
('售前', 'PRESALE', 0.20),
('市场', 'MARKET', 0.15),
('运营', 'OPERATION', 0.10);

-- 部门数据
INSERT INTO departments (name, code, line_id) VALUES
('实施一部', 'IMPL01', 1),
('实施二部', 'IMPL02', 1),
('售前部', 'PRESALE01', 2),
('市场部', 'MARKET01', 3),
('运营部', 'OPERATION01', 4),
('人力资源部', 'HR01', 4),
('财务部', 'FINANCE01', 4);

-- 岗位数据
INSERT INTO positions (name, code, level, benchmark_value, line_id) VALUES
-- 实施条线
('项目经理', 'PM', 'P6', 1.0, 1),
('高级实施顾问', 'SC_SENIOR', 'P5', 0.8, 1),
('实施顾问', 'SC', 'P4', 0.6, 1),
('初级实施顾问', 'SC_JUNIOR', 'P3', 0.4, 1),
-- 售前条线
('售前总监', 'PRESALE_DIRECTOR', 'M2', 1.2, 2),
('高级售前顾问', 'PRESALE_SENIOR', 'P5', 0.9, 2),
('售前顾问', 'PRESALE', 'P4', 0.7, 2),
-- 市场条线
('市场总监', 'MARKET_DIRECTOR', 'M2', 1.1, 3),
('市场经理', 'MARKET_MANAGER', 'M1', 0.8, 3),
('市场专员', 'MARKET_SPECIALIST', 'P3', 0.5, 3),
-- 运营条线
('人事经理', 'HR_MANAGER', 'M1', 0.7, 4),
('财务经理', 'FINANCE_MANAGER', 'M1', 0.7, 4),
('行政专员', 'ADMIN_SPECIALIST', 'P3', 0.4, 4);

-- 创建默认管理员用户
-- 密码为: admin123 (已加密)
INSERT INTO users (username, password, real_name, email, role_id, department_id) VALUES
('admin', '$2b$12$rHyDHWz1V9qRx8RFgGk1yeSl9DCQCLwEo4SJcUhvQQxN8eqMfhWCm', '系统管理员', 'admin@company.com', 1, 6);

COMMIT;