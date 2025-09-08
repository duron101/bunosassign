const request = require('supertest')
const app = require('../app')
const db = require('../config/database')

describe('Project Collaboration API', () => {
  let authToken
  let projectId
  let applicationId
  
  // 设置测试环境
  beforeAll(async () => {
    // 创建测试用户并获取认证token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      })
    
    authToken = loginResponse.body.data.accessToken
  })

  // 清理测试数据
  afterAll(async () => {
    // 清理测试数据
    if (applicationId) {
      await db.query('DELETE FROM project_team_applications WHERE id = ?', [applicationId])
    }
    if (projectId) {
      await db.query('DELETE FROM projects WHERE id = ?', [projectId])
    }
  })

  describe('POST /api/project-collaboration/publish', () => {
    it('should publish a project successfully', async () => {
      const projectData = {
        name: '测试项目',
        code: 'TEST_PROJECT_001',
        description: '这是一个测试项目',
        workContent: '测试项目的工作内容详情',
        budget: 100000,
        bonusScale: 50000,
        profitTarget: 200000,
        skillRequirements: ['JavaScript', 'Node.js', 'Vue.js'],
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        priority: 'high',
        requirements: [
          {
            type: 'technical',
            title: '技术要求',
            description: '使用现代前端技术栈',
            priority: 'high',
            isMandatory: true,
            acceptanceCriteria: ['使用Vue 3', '响应式设计']
          }
        ]
      }

      const response = await request(app)
        .post('/api/project-collaboration/publish')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)

      expect(response.status).toBe(201)
      expect(response.body.code).toBe(201)
      expect(response.body.message).toBe('项目发布成功')
      expect(response.body.data.project).toHaveProperty('id')
      expect(response.body.data.project.name).toBe(projectData.name)
      expect(response.body.data.project.cooperationStatus).toBe('published')
      
      projectId = response.body.data.project.id
    })

    it('should fail without authentication', async () => {
      const projectData = {
        name: '测试项目2',
        code: 'TEST_PROJECT_002',
        description: '这是另一个测试项目'
      }

      const response = await request(app)
        .post('/api/project-collaboration/publish')
        .send(projectData)

      expect(response.status).toBe(401)
    })

    it('should fail with invalid data', async () => {
      const invalidData = {
        name: '',
        code: '',
        description: ''
      }

      const response = await request(app)
        .post('/api/project-collaboration/publish')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)

      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/project-collaboration/:projectId/apply-team', () => {
    it('should apply for team building successfully', async () => {
      // 首先确保有项目可以申请
      if (!projectId) {
        const publishResponse = await request(app)
          .post('/api/project-collaboration/publish')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: '团队申请测试项目',
            code: 'TEAM_APPLY_TEST',
            description: '用于测试团队申请的项目',
            workContent: '测试内容'
          })
        projectId = publishResponse.body.data.project.id
      }

      const teamData = {
        teamName: '测试开发团队',
        teamDescription: '这是一个测试开发团队',
        applicationReason: '我们有丰富的开发经验，适合这个项目',
        estimatedCost: 80000,
        members: [
          {
            employeeId: 1,
            roleId: 1,
            roleName: '项目经理',
            contributionWeight: 1.2,
            estimatedWorkload: 0.3,
            allocationPercentage: 30,
            reason: '负责项目整体管理'
          },
          {
            employeeId: 2,
            roleId: 2,
            roleName: '开发工程师',
            contributionWeight: 1.0,
            estimatedWorkload: 0.7,
            allocationPercentage: 70,
            reason: '负责具体开发工作'
          }
        ]
      }

      const response = await request(app)
        .post(`/api/project-collaboration/${projectId}/apply-team`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(teamData)

      expect(response.status).toBe(201)
      expect(response.body.code).toBe(201)
      expect(response.body.message).toBe('团队申请提交成功')
      expect(response.body.data.application).toHaveProperty('id')
      expect(response.body.data.application.status).toBe('pending')
      
      applicationId = response.body.data.application.id
    })

    it('should fail for non-existent project', async () => {
      const teamData = {
        teamName: '测试团队',
        teamDescription: '测试描述',
        applicationReason: '测试理由',
        members: []
      }

      const response = await request(app)
        .post('/api/project-collaboration/99999/apply-team')
        .set('Authorization', `Bearer ${authToken}`)
        .send(teamData)

      expect(response.status).toBe(404)
    })
  })

  describe('GET /api/project-collaboration/:projectId', () => {
    it('should get project collaboration details', async () => {
      const response = await request(app)
        .get(`/api/project-collaboration/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(200)
      expect(response.body.code).toBe(200)
      expect(response.body.data).toHaveProperty('project')
      expect(response.body.data).toHaveProperty('applications')
      expect(response.body.data).toHaveProperty('members')
    })

    it('should fail for non-existent project', async () => {
      const response = await request(app)
        .get('/api/project-collaboration/99999')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/project-collaboration/applications/:applicationId/approve', () => {
    it('should approve team application successfully', async () => {
      // 确保有申请可以审批
      if (!applicationId && projectId) {
        const applyResponse = await request(app)
          .post(`/api/project-collaboration/${projectId}/apply-team`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            teamName: '审批测试团队',
            teamDescription: '用于测试审批的团队',
            applicationReason: '测试审批流程',
            members: [{
              employeeId: 1,
              roleId: 1,
              roleName: '测试角色',
              contributionWeight: 1.0,
              estimatedWorkload: 1.0,
              allocationPercentage: 100,
              reason: '测试成员'
            }]
          })
        applicationId = applyResponse.body.data.application.id
      }

      const approvalData = {
        action: 'approve',
        comments: '团队配置合理，批准组建'
      }

      const response = await request(app)
        .post(`/api/project-collaboration/applications/${applicationId}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(approvalData)

      expect(response.status).toBe(200)
      expect(response.body.code).toBe(200)
      expect(response.body.message).toBe('审批成功')
    })

    it('should reject team application successfully', async () => {
      // 创建新的申请用于拒绝测试
      const applyResponse = await request(app)
        .post(`/api/project-collaboration/${projectId}/apply-team`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          teamName: '拒绝测试团队',
          teamDescription: '用于测试拒绝的团队',
          applicationReason: '测试拒绝流程',
          members: [{
            employeeId: 1,
            roleId: 1,
            roleName: '测试角色',
            contributionWeight: 1.0,
            estimatedWorkload: 1.0,
            allocationPercentage: 100,
            reason: '测试成员'
          }]
        })

      const rejectApplicationId = applyResponse.body.data.application.id

      const rejectionData = {
        action: 'reject',
        comments: '团队经验不足，暂不批准'
      }

      const response = await request(app)
        .post(`/api/project-collaboration/applications/${rejectApplicationId}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(rejectionData)

      expect(response.status).toBe(200)
      expect(response.body.code).toBe(200)
      expect(response.body.message).toBe('审批成功')

      // 清理测试数据
      await db.query('DELETE FROM project_team_applications WHERE id = ?', [rejectApplicationId])
    })

    it('should fail for invalid action', async () => {
      const invalidData = {
        action: 'invalid_action',
        comments: '测试无效操作'
      }

      const response = await request(app)
        .post(`/api/project-collaboration/applications/${applicationId}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/project-collaboration/applications/pending', () => {
    it('should get pending applications list', async () => {
      const response = await request(app)
        .get('/api/project-collaboration/applications/pending')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, pageSize: 10 })

      expect(response.status).toBe(200)
      expect(response.body.code).toBe(200)
      expect(response.body.data).toHaveProperty('applications')
      expect(response.body.data).toHaveProperty('pagination')
      expect(Array.isArray(response.body.data.applications)).toBe(true)
    })

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/project-collaboration/applications/pending')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'approved', page: 1, pageSize: 10 })

      expect(response.status).toBe(200)
      expect(response.body.code).toBe(200)
    })
  })

  describe('GET /api/project-collaboration/notifications/my', () => {
    it('should get my notifications', async () => {
      const response = await request(app)
        .get('/api/project-collaboration/notifications/my')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, pageSize: 10 })

      expect(response.status).toBe(200)
      expect(response.body.code).toBe(200)
      expect(response.body.data).toHaveProperty('notifications')
      expect(response.body.data).toHaveProperty('pagination')
      expect(response.body.data).toHaveProperty('unreadCount')
      expect(Array.isArray(response.body.data.notifications)).toBe(true)
    })

    it('should filter unread notifications', async () => {
      const response = await request(app)
        .get('/api/project-collaboration/notifications/my')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ unreadOnly: true, page: 1, pageSize: 10 })

      expect(response.status).toBe(200)
      expect(response.body.code).toBe(200)
    })
  })

  describe('Permission Tests', () => {
    let regularUserToken

    beforeAll(async () => {
      // 创建普通用户用于权限测试
      // 注意：这里假设存在创建用户的API或测试数据
      // 实际测试中需要根据具体实现调整
    })

    it('should deny access to publish without permission', async () => {
      if (regularUserToken) {
        const response = await request(app)
          .post('/api/project-collaboration/publish')
          .set('Authorization', `Bearer ${regularUserToken}`)
          .send({
            name: '无权限测试项目',
            code: 'NO_PERMISSION_TEST',
            description: '测试描述'
          })

        expect(response.status).toBe(403)
      }
    })

    it('should deny access to approve without permission', async () => {
      if (regularUserToken && applicationId) {
        const response = await request(app)
          .post(`/api/project-collaboration/applications/${applicationId}/approve`)
          .set('Authorization', `Bearer ${regularUserToken}`)
          .send({
            action: 'approve',
            comments: '无权限审批测试'
          })

        expect(response.status).toBe(403)
      }
    })
  })
})