import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyUserAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    // 通过用户ID获取用户信息
    const currentUser = await prisma.user.findUnique({
      where: { id: authResult.userId },
      include: {
        couple: true
      }
    })
    
    if (!currentUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 检查是否有完整的情侣关系
    if (!currentUser.couple?.isComplete) {
      return NextResponse.json({ error: '没有完整的情侣关系' }, { status: 400 })
    }

    // 获取伴侣ID
    const partnerId = currentUser.couple.person1Id === currentUser.id 
      ? currentUser.couple.person2Id 
      : currentUser.couple.person1Id

    if (!partnerId) {
      return NextResponse.json({ error: '找不到伴侣信息' }, { status: 400 })
    }

    // 获取伴侣信息
    const partner = await prisma.user.findUnique({
      where: { id: partnerId },
      select: { id: true, displayName: true, username: true }
    })

    if (!partner) {
      return NextResponse.json({ error: '伴侣不存在' }, { status: 404 })
    }

    const today = new Date().toISOString().split('T')[0]

    // 获取伴侣今日打卡记录
    const todayCheckin = await prisma.studyPlan.findFirst({
      where: {
        userId: partnerId,
        planDate: today,
        title: '每日打卡'
      },
      include: {
        tasks: true
      }
    })

    // 获取伴侣的打卡历史记录（用于计算连续天数）
    const checkinHistory = await prisma.studyPlan.findMany({
      where: {
        userId: partnerId,
        title: '每日打卡',
        isCompleted: true
      },
      orderBy: {
        planDate: 'desc'
      }
    })

    // 计算连续打卡天数
    let consecutiveDays = 0
    if (checkinHistory.length > 0) {
      const dates = checkinHistory.map(record => record.planDate).sort().reverse()
      consecutiveDays = 1
      
      for (let i = 1; i < dates.length; i++) {
        const currentDate = new Date(dates[i - 1])
        const prevDate = new Date(dates[i])
        const diffTime = currentDate.getTime() - prevDate.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        
        if (diffDays === 1) {
          consecutiveDays++
        } else {
          break
        }
      }
    }

    // 提取今日学习数据
    let studyTime = 0
    let completedTasks = 0
    
    if (todayCheckin?.tasks) {
      studyTime = todayCheckin.tasks.reduce((total, task) => total + (task.duration || 0), 0)
      completedTasks = todayCheckin.tasks.filter(task => task.isCompleted).length
    }

    return NextResponse.json({
      partner: {
        id: partner.id,
        name: partner.displayName || partner.username
      },
      checkin: {
        hasCheckedIn: !!todayCheckin,
        studyTime: todayCheckin ? studyTime : undefined,
        completedTasks: todayCheckin ? completedTasks : undefined,
        streak: consecutiveDays,
        date: today
      }
    })
  } catch (error) {
    console.error('获取伴侣打卡信息失败:', error)
    return NextResponse.json(
      { error: '获取伴侣打卡信息失败' },
      { status: 500 }
    )
  }
}