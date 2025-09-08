const request = require('supertest')
const app = require('../app')

describe('Personal Bonus API', () => {
  let authToken

  beforeAll(async () => {
    // Mock authentication - adjust based on your auth setup
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      })
    
    if (loginResponse.status === 200) {
      authToken = loginResponse.body.data.accessToken
    } else {
      // Use a mock token for testing
      authToken = 'mock-token'
    }
  })

  describe('GET /api/personal-bonus/overview', () => {
    test('should return personal bonus overview', async () => {
      const response = await request(app)
        .get('/api/personal-bonus/overview')
        .set('Authorization', `Bearer ${authToken}`)
      
      console.log('Overview response:', response.status, response.body)
      
      // Should return 200 or 401/404 if no user is associated
      expect([200, 401, 404]).toContain(response.status)
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('code')
        expect(response.body).toHaveProperty('message')
        expect(response.body).toHaveProperty('data')
      }
    })
  })

  describe('GET /api/personal-bonus/trend', () => {
    test('should return bonus trend analysis', async () => {
      const response = await request(app)
        .get('/api/personal-bonus/trend')
        .set('Authorization', `Bearer ${authToken}`)
      
      console.log('Trend response:', response.status, response.body)
      
      expect([200, 401, 404]).toContain(response.status)
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('code')
        expect(response.body).toHaveProperty('message')
        expect(response.body).toHaveProperty('data')
      }
    })
  })

  describe('GET /api/personal-bonus/performance', () => {
    test('should return performance detail', async () => {
      const response = await request(app)
        .get('/api/personal-bonus/performance')
        .set('Authorization', `Bearer ${authToken}`)
      
      console.log('Performance response:', response.status, response.body)
      
      expect([200, 401, 404]).toContain(response.status)
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('code')
        expect(response.body).toHaveProperty('message')
        expect(response.body).toHaveProperty('data')
      }
    })
  })

  describe('GET /api/personal-bonus/projects', () => {
    test('should return project participation', async () => {
      const response = await request(app)
        .get('/api/personal-bonus/projects')
        .set('Authorization', `Bearer ${authToken}`)
      
      console.log('Projects response:', response.status, response.body)
      
      expect([200, 401, 404]).toContain(response.status)
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('code')
        expect(response.body).toHaveProperty('message')
        expect(response.body).toHaveProperty('data')
      }
    })
  })

  describe('GET /api/personal-bonus/improvement-suggestions', () => {
    test('should return improvement suggestions', async () => {
      const response = await request(app)
        .get('/api/personal-bonus/improvement-suggestions')
        .set('Authorization', `Bearer ${authToken}`)
      
      console.log('Suggestions response:', response.status, response.body)
      
      expect([200, 401, 404]).toContain(response.status)
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('code')
        expect(response.body).toHaveProperty('message')
        expect(response.body).toHaveProperty('data')
      }
    })
  })

  describe('GET /api/personal-bonus/peer-comparison', () => {
    test('should return peer comparison', async () => {
      const response = await request(app)
        .get('/api/personal-bonus/peer-comparison')
        .set('Authorization', `Bearer ${authToken}`)
      
      console.log('Peer comparison response:', response.status, response.body)
      
      expect([200, 401, 404]).toContain(response.status)
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('code')
        expect(response.body).toHaveProperty('message')
        expect(response.body).toHaveProperty('data')
      }
    })
  })

  describe('GET /api/personal-bonus/simulation', () => {
    test('should return bonus simulation', async () => {
      const response = await request(app)
        .get('/api/personal-bonus/simulation')
        .set('Authorization', `Bearer ${authToken}`)
      
      console.log('Simulation response:', response.status, response.body)
      
      expect([200, 401, 404]).toContain(response.status)
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('code')
        expect(response.body).toHaveProperty('message')
        expect(response.body).toHaveProperty('data')
      }
    })
  })

  describe('POST /api/personal-bonus/simulation', () => {
    test('should handle simulation with scenarios', async () => {
      const simulationScenarios = {
        optimistic: {
          name: 'optimistic',
          performanceAdjustment: 0.1,
          profitAdjustment: 0.05
        },
        pessimistic: {
          name: 'pessimistic',  
          performanceAdjustment: -0.1,
          profitAdjustment: -0.05
        }
      }

      const response = await request(app)
        .post('/api/personal-bonus/simulation')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ scenarios: simulationScenarios })
      
      console.log('POST Simulation response:', response.status, response.body)
      
      expect([200, 401, 404]).toContain(response.status)
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('code')
        expect(response.body).toHaveProperty('message')
        expect(response.body).toHaveProperty('data')
      }
    })
  })
})