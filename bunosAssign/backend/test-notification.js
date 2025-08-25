/**
 * 通知功能测试脚本
 * 用于测试通知服务的各项功能
 */

const NeDBService = require('./src/services/nedbService')
const NotificationService = require('./src/services/notificationService')
const path = require('path')

async function testNotificationService() {
  console.log('🚀 开始测试通知服务...')
  
  try {
    // 初始化 NeDB 服务
    const nedbService = new NeDBService()
    await nedbService.initialize()
    
    // 初始化通知服务
    const notificationService = require('./src/services/notificationService')
    
    console.log('\n📋 测试1: 创建单个通知')
    const singleNotification = await notificationService.createNotification({
      userId: 'user001',
      notificationType: 'project_published',
      title: '新项目发布通知',
      content: '项目"企业管理系统升级"已发布，请关注项目进展',
      projectId: 'project001',
      priority: 'normal'
    })
    console.log('✅ 单个通知创建成功:', singleNotification._id || singleNotification.id)
    
    console.log('\n📋 测试2: 批量创建通知')
    const batchNotifications = await notificationService.createBatchNotifications([
      {
        userId: 'user002',
        notificationType: 'team_applied',
        title: '团队申请通知',
        content: '张三申请加入项目"移动端开发"',
        projectId: 'project002',
        priority: 'high'
      },
      {
        userId: 'user003',
        notificationType: 'approval_needed',
        title: '需要审批通知',
        content: '项目"数据分析平台"需要您的审批',
        projectId: 'project003',
        priority: 'urgent'
      }
    ])
    console.log('✅ 批量通知创建成功，数量:', batchNotifications.length)
    
    console.log('\n📋 测试3: 获取用户通知')
    const userNotifications = await notificationService.getUserNotifications('user001', {
      page: 1,
      pageSize: 10
    })
    console.log('✅ 用户通知获取成功:', {
      total: userNotifications.total,
      unreadCount: userNotifications.unreadCount,
      notifications: userNotifications.notifications.length
    })
    
    console.log('\n📋 测试4: 标记通知为已读')
    const notificationId = singleNotification._id || singleNotification.id
    const updatedNotification = await notificationService.markNotificationRead(notificationId, 'user001')
    console.log('✅ 通知标记已读成功:', updatedNotification.isRead)
    
    console.log('\n📋 测试5: 批量标记通知为已读')
    const batchUpdateResult = await notificationService.markAllNotificationsRead('user001')
    console.log('✅ 批量标记已读成功，更新数量:', batchUpdateResult)
    
    console.log('\n📋 测试6: 获取通知统计信息')
    const stats = await notificationService.getNotificationStats('user001')
    console.log('✅ 通知统计信息获取成功:', {
      total: stats.total,
      unread: stats.unread,
      read: stats.read,
      byType: stats.byType
    })
    
    console.log('\n📋 测试7: 发送项目通知')
    const projectNotificationResult = await notificationService.sendProjectNotification(
      'project001',
      'project_update',
      '项目状态更新',
      '项目"企业管理系统升级"状态已更新为"进行中"',
      ['user001', 'user002', 'user003'],
      {
        projectName: '企业管理系统升级',
        status: '进行中',
        updateTime: new Date().toISOString()
      }
    )
    console.log('✅ 项目通知发送成功，数量:', projectNotificationResult.length)
    
    console.log('\n📋 测试8: 发送团队申请通知')
    const teamNotificationResult = await notificationService.sendTeamApplicationNotification(
      'application001',
      'project002',
      'user004',
      'applied',
      ['user005', 'user006']
    )
    console.log('✅ 团队申请通知发送成功，数量:', teamNotificationResult.length)
    
    console.log('\n📋 测试9: 发送系统通知')
    const systemNotificationResult = await notificationService.sendSystemNotification(
      'system_maintenance',
      '系统维护通知',
      '系统将于今晚22:00-24:00进行维护，期间可能影响正常使用',
      ['user001', 'user002', 'user003', 'user004'],
      {
        maintenanceType: '定期维护',
        duration: '2小时',
        impact: '可能影响正常使用'
      }
    )
    console.log('✅ 系统通知发送成功，数量:', systemNotificationResult.length)
    
    console.log('\n📋 测试10: 清理过期通知')
    const cleanupResult = await notificationService.cleanupExpiredNotifications(1) // 清理1天前的已读通知
    console.log('✅ 过期通知清理完成，清理数量:', cleanupResult)
    
    console.log('\n📋 测试11: 删除通知')
    const deleteResult = await notificationService.deleteNotification(notificationId, 'user001')
    console.log('✅ 通知删除成功:', deleteResult)
    
    console.log('\n🎉 所有测试完成！')
    
    // 显示最终统计
    const finalStats = await notificationService.getNotificationStats('user001')
    console.log('\n📊 最终统计信息:')
    console.log('总通知数:', finalStats.total)
    console.log('未读通知:', finalStats.unread)
    console.log('已读通知:', finalStats.read)
    console.log('按类型统计:', finalStats.byType)
    
  } catch (error) {
    console.error('❌ 测试失败:', error)
  } finally {
    process.exit(0)
  }
}

// 运行测试
testNotificationService()
