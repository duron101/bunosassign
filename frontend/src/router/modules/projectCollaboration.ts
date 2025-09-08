import type { RouteRecordRaw } from 'vue-router'

const projectCollaborationRoutes: RouteRecordRaw[] = [
  {
    path: '/project',
    name: 'Project',
    redirect: '/project/management',
    meta: {
      title: '项目管理',
      icon: 'FolderOpened',
      requiresAuth: true
    }
  },
  {
    path: '/project/management',
    name: 'ProjectManagement',
    component: () => import('@/views/project/ProjectManagement.vue'),
    meta: {
      title: '项目管理',
      requiresAuth: true,
      permissions: ['project:view', '*']
    }
  },
  {
    path: '/project/collaboration',
    name: 'ProjectCollaboration',
    component: () => import('@/views/project/ProjectCollaboration.vue'),
    meta: {
      title: '项目协作',
      requiresAuth: true,
      permissions: ['project:view', '*'],
      breadcrumb: [
        { title: '项目管理', to: '/project/management' },
        { title: '项目协作' }
      ]
    }
  },
  {
    path: '/project/publish',
    name: 'ProjectPublish',
    component: () => import('@/views/project/ProjectPublish.vue'),
    meta: {
      title: '发布项目',
      requiresAuth: true,
      permissions: ['project:create', '*'],
      breadcrumb: [
        { title: '项目管理', to: '/project/management' },
        { title: '发布项目' }
      ]
    }
  },
  {
    path: '/project/cost-management',
    name: 'ProjectCostManagement',
    component: () => import('@/views/project/ProjectCostManagement.vue'),
    meta: {
      title: '项目成本管理',
      requiresAuth: true,
      permissions: ['project:cost:view', '*'],
      breadcrumb: [
        { title: '项目管理', to: '/project/management' },
        { title: '项目成本管理' }
      ]
    }
  }
]

export default projectCollaborationRoutes