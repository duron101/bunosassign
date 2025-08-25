设计一个完整的管理系统，包括：
1. 岗位分类管理 - 管理岗位的大类和小类
2. 技能标签管理 - 管理技能标签的增删改查
3. 职业路径模板 - 管理不同职级的职业发展路径


目前这三个tab页都只是显示"功能开发中..."的提示，没有实际功能实现。让我先查看一下相关的数据结构和API。


## 设计方案

### 1. 岗位分类管理

**功能目标：**
- 管理岗位的大类（如技术研发、项目管理、售前业务等）
- 管理每个大类下的子分类
- 支持分类的增删改查、排序、启用/禁用
- 分类与岗位的关联管理

**数据结构设计：**
```typescript
interface PositionCategory {
  id: string
  name: string           // 分类名称
  code: string           // 分类代码
  type: 'main' | 'sub'  // 主分类或子分类
  parentId?: string      // 父分类ID（子分类才有）
  level: number          // 分类层级
  sortOrder: number      // 排序
  description: string    // 分类描述
  icon: string          // 分类图标
  color: string         // 分类颜色
  isActive: boolean     // 是否启用
  positionCount: number // 关联岗位数量
  createdAt: string
  updatedAt: string
}
```

**功能特性：**
- 树形结构展示分类层级
- 拖拽排序
- 分类图标和颜色自定义
- 分类状态管理
- 分类与岗位的关联统计

### 2. 技能标签管理

**功能目标：**
- 管理岗位核心技能标签
- 支持技能标签的分类管理
- 技能标签的增删改查、合并、禁用
- 技能标签使用频率统计

**数据结构设计：**
```typescript
interface SkillTag {
  id: string
  name: string           // 技能名称
  code: string           // 技能代码
  category: string       // 技能分类
  level: 'basic' | 'intermediate' | 'advanced' | 'expert'  // 技能等级
  description: string    // 技能描述
  synonyms: string[]     // 同义词/别名
  relatedSkills: string[] // 相关技能
  usageCount: number     // 使用次数
  isActive: boolean      // 是否启用
  isSystem: boolean      // 是否系统预设
  createdAt: string
  updatedAt: string
}

interface SkillCategory {
  id: string
  name: string           // 分类名称
  description: string    // 分类描述
  color: string         // 分类颜色
  sortOrder: number     // 排序
  skillCount: number    // 技能数量
}
```

**功能特性：**
- 技能标签分类管理
- 技能标签合并功能
- 使用频率统计
- 相关技能推荐
- 批量操作支持

### 3. 职业路径模板

**功能目标：**
- 管理不同职级的职业发展路径模板
- 支持路径模板的复制、修改、版本管理
- 路径模板与岗位的关联

**数据结构设计：**
```typescript
interface CareerPathTemplate {
  id: string
  name: string           // 模板名称
  code: string           // 模板代码
  level: string          // 适用职级
  category: string       // 岗位类别
  description: string    // 模板描述
  version: string        // 版本号
  isActive: boolean      // 是否启用
  isDefault: boolean     // 是否默认模板
  
  // 职业路径结构
  careerPath: {
    nextLevel: string    // 下一级别
    estimatedTime: string // 预计时间
    lateralMoves: string[] // 横向发展
    specializations: string[] // 专业方向
    growthAreas: string[] // 成长领域
    requirements: {      // 晋升要求
      minExperience: string
      skillLevel: string
      performanceLevel: string
      projectContribution: string
    }
  }
  
  // 技能发展路径
  skillDevelopment: {
    coreSkills: string[]     // 核心技能
    advancedSkills: string[] // 进阶技能
    leadershipSkills: string[] // 领导力技能
    learningPath: {          // 学习路径
      courses: string[]
      certifications: string[]
      projects: string[]
    }
  }
  
  usageCount: number     // 使用次数
  createdAt: string
  updatedAt: string
}
```

**功能特性：**
- 模板版本管理
- 路径可视化展示
- 模板复制和修改
- 使用统计
- 模板导入导出

### 4. 技术架构设计

**前端组件结构：**
```
components/
├── management/
│   ├── CategoryManager.vue      # 岗位分类管理
│   ├── SkillTagManager.vue      # 技能标签管理
│   ├── CareerPathTemplateManager.vue # 职业路径模板管理
│   └── common/
│       ├── TreeEditor.vue       # 树形编辑器
│       ├── TagEditor.vue        # 标签编辑器
│       └── PathVisualizer.vue   # 路径可视化
```

**API接口设计：**
```
/api/management/
├── categories/          # 岗位分类管理
│   ├── GET /           # 获取分类列表
│   ├── POST /          # 创建分类
│   ├── PUT /:id        # 更新分类
│   ├── DELETE /:id     # 删除分类
│   └── /:id/positions  # 获取分类下的岗位
├── skills/             # 技能标签管理
│   ├── GET /           # 获取技能标签
│   ├── POST /          # 创建技能标签
│   ├── PUT /:id        # 更新技能标签
│   ├── DELETE /:id     # 删除技能标签
│   └── /merge          # 合并技能标签
└── templates/          # 职业路径模板
    ├── GET /           # 获取模板列表
    ├── POST /          # 创建模板
    ├── PUT /:id        # 更新模板
    ├── DELETE /:id     # 删除模板
    └── /:id/copy       # 复制模板
```

**数据库设计：**
- 新增 `position_categories` 表
- 新增 `skill_tags` 表
- 新增 `skill_categories` 表
- 新增 `career_path_templates` 表
- 新增关联表 `position_category_relations`

### 5. 用户体验设计

**交互设计原则：**
- 直观的树形结构展示
- 拖拽操作支持
- 实时预览和验证
- 批量操作支持
- 操作确认和撤销

**界面布局：**
- 左侧：分类/标签/模板树形结构
- 右侧：详细信息和编辑区域
- 顶部：操作工具栏
- 底部：状态信息和操作日志

## 开发计划

### 第一阶段：基础架构
1. 创建管理组件的基础结构
2. 实现数据模型和API接口
3. 建立基础的CRUD操作

### 第二阶段：核心功能
1. 岗位分类管理功能
2. 技能标签管理功能
3. 职业路径模板管理功能

### 第三阶段：高级特性
1. 拖拽排序功能
2. 批量操作支持
3. 数据导入导出
4. 操作日志和审计

### 第四阶段：优化完善
1. 性能优化
2. 用户体验改进
3. 错误处理和验证
