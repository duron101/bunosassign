const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')

class SQLiteManager {
  constructor(dbPath) {
    this.dbPath = dbPath
    this.data = {
      users: [],
      roles: [],
      departments: [],
      positions: [],
      employees: [],
      businessLines: [],
      projects: [],
      bonusPools: [],
      calculations: []
    }
    this.nextId = {
      users: 1,
      roles: 1,
      departments: 1,
      positions: 1,
      employees: 1,
      businessLines: 1,
      projects: 1,
      bonusPools: 1,
      calculations: 1
    }
    
    this.loadData()
  }

  // 加载数据库文件
  loadData() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const rawData = fs.readFileSync(this.dbPath, 'utf8')
        const loadedData = JSON.parse(rawData)
        this.data = { ...this.data, ...loadedData.data }
        this.nextId = { ...this.nextId, ...loadedData.nextId }
        console.log(`✅ 数据库文件已加载: ${this.dbPath}`)
      } else {
        console.log(`📝 数据库文件不存在，将创建新文件: ${this.dbPath}`)
        this.initializeDatabase()
      }
    } catch (error) {
      console.error('❌ 加载数据库文件失败:', error.message)
      this.initializeDatabase()
    }
  }

  // 保存数据到文件
  saveData() {
    try {
      const dataToSave = {
        data: this.data,
        nextId: this.nextId,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
      
      // 确保目录存在
      const dir = path.dirname(this.dbPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      
      fs.writeFileSync(this.dbPath, JSON.stringify(dataToSave, null, 2), 'utf8')
      console.log(`💾 数据库已保存到: ${this.dbPath}`)
    } catch (error) {
      console.error('❌ 保存数据库文件失败:', error.message)
    }
  }

  // 初始化数据库
  async initializeDatabase() {
    try {
      console.log('🚀 开始初始化数据库...')
      
      // 创建默认管理员角色
      const adminRole = {
        id: 1,
        name: '系统管理员',
        code: 'admin',
        description: '拥有所有系统权限',
        permissions: ['*'],
        status: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      this.data.roles.push(adminRole)
      this.nextId.roles = 2

      // 创建HR角色
      const hrRole = {
        id: 2,
        name: 'HR管理员',
        code: 'hr',
        description: '人事管理权限',
        permissions: [
          'employee:view', 'employee:create', 'employee:edit', 'employee:delete',
          'department:view', 'department:create', 'department:edit',
          'position:view', 'position:create', 'position:edit',
          'user:view', 'user:create', 'user:edit'
        ],
        status: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      this.data.roles.push(hrRole)

      // 创建财务角色
      const financeRole = {
        id: 3,
        name: '财务管理员', 
        code: 'finance',
        description: '财务相关权限',
        permissions: [
          'bonus:view', 'bonus:calculate', 'bonus:manage',
          'report:view', 'report:export',
          'employee:view', 'department:view'
        ],
        status: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      this.data.roles.push(financeRole)
      this.nextId.roles = 4

      // 创建默认管理员用户
      const hashedPassword = await bcrypt.hash('admin123', 10)
      const adminUser = {
        id: 1,
        username: 'admin',
        password: hashedPassword,
        name: '系统管理员',
        email: 'admin@company.com',
        phone: '13800138000',
        roleId: 1,
        status: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      this.data.users.push(adminUser)
      this.nextId.users = 2

      // 创建默认部门
      const departments = [
        {
          id: 1,
          name: '技术部',
          code: 'TECH',
          description: '负责技术研发工作',
          managerId: null,
          parentId: null,
          status: 1,
          sort: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          name: '市场部',
          code: 'MARKET', 
          description: '负责市场营销工作',
          managerId: null,
          parentId: null,
          status: 1,
          sort: 2,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 3,
          name: '财务部',
          code: 'FINANCE',
          description: '负责财务管理工作',
          managerId: null,
          parentId: null,
          status: 1,
          sort: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      this.data.departments.push(...departments)
      this.nextId.departments = 4

      // 创建默认岗位
      const positions = [
        {
          id: 1,
          name: '高级工程师',
          code: 'SR_ENG',
          level: 'P6',
          departmentId: 1,
          benchmarkValue: 15000,
          salaryRange: '120000-180000',
          description: '负责核心技术开发',
          status: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          name: '市场经理',
          code: 'MKT_MGR',
          level: 'M1',
          departmentId: 2,
          benchmarkValue: 12000,
          salaryRange: '100000-150000',
          description: '负责市场推广',
          status: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 3,
          name: '财务专员',
          code: 'FIN_SPEC',
          level: 'P3',
          departmentId: 3,
          benchmarkValue: 8000,
          salaryRange: '60000-100000',
          description: '负责财务核算',
          status: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      this.data.positions.push(...positions)
      this.nextId.positions = 4

      // 创建默认业务线
      const businessLines = [
        {
          id: 1,
          name: '核心业务线',
          code: 'CORE',
          description: '公司核心产品线',
          weight: 0.6,
          status: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          name: '创新业务线',
          code: 'INNOVATION',
          description: '新兴产品线',
          weight: 0.4,
          status: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
      this.data.businessLines.push(...businessLines)
      this.nextId.businessLines = 3

      // 保存初始化数据
      this.saveData()
      console.log('✅ 数据库初始化完成!')
      
    } catch (error) {
      console.error('❌ 数据库初始化失败:', error.message)
      throw error
    }
  }

  // 通用查询方法
  findAll(table, options = {}) {
    const { where = {}, include = [], limit, offset, order = [] } = options
    let data = [...(this.data[table] || [])]
    
    // 应用where条件
    if (Object.keys(where).length > 0) {
      data = data.filter(item => {
        return Object.entries(where).every(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            // 支持操作符 (简化版)
            if (value.$like) {
              return item[key] && item[key].toString().includes(value.$like.replace(/%/g, ''))
            }
            if (value.$in) {
              return value.$in.includes(item[key])
            }
            if (value.$ne) {
              return item[key] !== value.$ne
            }
            return item[key] === value
          }
          return item[key] === value
        })
      })
    }

    // 应用关联查询 (简化版)
    if (include.length > 0) {
      data = data.map(item => {
        const result = { ...item }
        include.forEach(inc => {
          const { model, foreignKey } = inc
          // 处理模型名称，支持字符串或模型对象
          let modelName = model
          let propertyName = model
          
          if (typeof model === 'object' && model !== null && model.tableName) {
            modelName = model.tableName
            // 将表名转换为模型名（首字母大写，去掉s）
            propertyName = modelName.charAt(0).toUpperCase() + modelName.slice(1, -1)
          } else if (typeof model === 'object' && model !== null && model.name) {
            modelName = model.name
            propertyName = model.name
          } else if (typeof model === 'string') {
            modelName = model
            propertyName = model
          } else {
            // 处理非字符串且非对象的情况，包括函数等
            modelName = 'Role' // 默认为Role，因为最常用的关联
            propertyName = 'Role'
          }
          
          const relatedTable = this.getTableName(modelName)
          const relatedData = this.data[relatedTable]?.find(r => r.id === item[foreignKey])
          result[propertyName] = relatedData || null
        })
        return result
      })
    }

    // 应用排序
    if (order.length > 0) {
      data.sort((a, b) => {
        for (let [field, direction] of order) {
          const aVal = a[field]
          const bVal = b[field]
          if (aVal < bVal) return direction === 'ASC' ? -1 : 1
          if (aVal > bVal) return direction === 'ASC' ? 1 : -1
        }
        return 0
      })
    }

    // 应用分页
    const total = data.length
    if (offset) data = data.slice(offset)
    if (limit) data = data.slice(0, limit)

    return { rows: data, count: total }
  }

  // 查找单条记录
  findOne(table, options = {}) {
    const result = this.findAll(table, { ...options, limit: 1 })
    return result.rows[0] || null
  }

  // 根据ID查找
  findByPk(table, id, options = {}) {
    return this.findOne(table, { ...options, where: { id } })
  }

  // 创建记录
  create(table, data) {
    const id = this.nextId[table]++
    const record = {
      id,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    this.data[table].push(record)
    this.saveData()
    return record
  }

  // 更新记录
  update(table, id, data) {
    const index = this.data[table].findIndex(item => item.id === id)
    if (index === -1) return [0]
    
    this.data[table][index] = {
      ...this.data[table][index],
      ...data,
      updated_at: new Date().toISOString()
    }
    this.saveData()
    return [1]
  }

  // 删除记录
  destroy(table, id) {
    const index = this.data[table].findIndex(item => item.id === id)
    if (index === -1) return 0
    
    this.data[table].splice(index, 1)
    this.saveData()
    return 1
  }

  // 批量操作
  bulkCreate(table, dataArray) {
    const records = dataArray.map(data => {
      const id = this.nextId[table]++
      return {
        id,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })
    this.data[table].push(...records)
    this.saveData()
    return records
  }

  // 计数方法
  count(table, options = {}) {
    const { where = {}, include = [] } = options
    let data = [...(this.data[table] || [])]
    
    // 应用where条件
    if (Object.keys(where).length > 0) {
      data = data.filter(item => {
        return Object.entries(where).every(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            // 支持操作符 (简化版)
            if (value.$like) {
              return item[key] && item[key].toString().includes(value.$like.replace(/%/g, ''))
            }
            if (value.$in) {
              return value.$in.includes(item[key])
            }
            if (value.$ne) {
              return item[key] !== value.$ne
            }
            return item[key] === value
          }
          return item[key] === value
        })
      })
    }

    // 应用关联查询过滤 (简化版)
    if (include.length > 0) {
      data = data.filter(item => {
        return include.every(inc => {
          const { model, where: includeWhere } = inc
          if (!includeWhere) return true
          
          // 处理模型名称
          let modelName = model
          if (typeof model === 'object' && model.tableName) {
            modelName = model.tableName
          } else if (typeof model === 'object' && model.name) {
            modelName = model.name
          } else if (typeof model !== 'string') {
            modelName = 'Department' // 默认为Department，因为在这个上下文中最常用
          }
          
          const relatedTable = this.getTableName(modelName)
          const foreignKey = inc.foreignKey || (relatedTable.slice(0, -1) + 'Id')
          const relatedItem = this.data[relatedTable]?.find(r => r.id === item[foreignKey])
          
          if (!relatedItem) return false
          
          // 检查include的where条件
          return Object.entries(includeWhere).every(([key, value]) => {
            return relatedItem[key] === value
          })
        })
      })
    }

    return data.length
  }

  // 获取表名的辅助方法
  getTableName(modelName) {
    const tableMap = {
      'Role': 'roles',
      'User': 'users',
      'Department': 'departments',
      'Position': 'positions',
      'Employee': 'employees',
      'BusinessLine': 'businessLines',
      // 添加复数形式的映射
      'roles': 'roles',
      'users': 'users',
      'departments': 'departments',
      'positions': 'positions',
      'employees': 'employees',
      'businessLines': 'businessLines'
    }
    return tableMap[modelName] || modelName.toLowerCase() + 's'
  }
}

module.exports = SQLiteManager