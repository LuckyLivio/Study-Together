import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    // 通过email获取用户ID
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!currentUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    const { studyTime, completedTasks, notes } = await request.json()
    const today = new Date().toISOString().split('T')[0]

    // 检查今日是否已打卡（使用studyPlan表模拟）
    const existingCheckin = await prisma.studyPlan.findFirst({
      where: {
        userId: currentUser.id,
        planDate: today,
        title: '每日打卡'
      }
    })

    if (existingCheckin) {
      return NextResponse.json(
        { error: '今日已完成打卡' },
        { status: 400 }
      )
    }

    // 创建打卡记录
    const checkinRecord = await prisma.studyPlan.create({
      data: {
        userId: currentUser.id,
        title: '每日打卡',
        description: notes || '每日学习打卡',
        planDate: today,
        isCompleted: true,
        tasks: {
          create: {
            title: '打卡任务',
            description: `学习时长: ${studyTime}分钟, 完成任务: ${completedTasks}个`,
            taskType: 'CHECKIN',
            duration: studyTime || 0,
            isCompleted: true,
            completedAt: new Date()
          }
        }
      },
      include: {
        tasks: true
      }
    })

    // 计算连续打卡天数
    const checkinHistory = await prisma.studyPlan.findMany({
      where: {
        userId: currentUser.id,
        title: '每日打卡',
        isCompleted: true
      },
      orderBy: {
        planDate: 'desc'
      }
    })

    let consecutiveDays = 1
    const dates = checkinHistory.map(record => record.planDate).sort()
    
    for (let i = dates.length - 2; i >= 0; i--) {
      const currentDate = new Date(dates[i + 1])
      const prevDate = new Date(dates[i])
      const diffTime = currentDate.getTime() - prevDate.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) {
        consecutiveDays++
      } else {
        break
      }
    }

    return NextResponse.json({
      success: true,
      checkin: checkinRecord,
      consecutiveDays,
      totalCheckins: checkinHistory.length
    })
  } catch (error) {
    console.error('打卡失败:', error)
    return NextResponse.json(
      { error: '打卡失败' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    // 通过email获取用户ID
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    
    if (!currentUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // YYYY-MM format
    const today = new Date().toISOString().split('T')[0]

    // 获取打卡记录
    const whereClause: any = {
      userId: currentUser.id,
      title: '每日打卡'
    }

    if (month) {
      whereClause.planDate = {
        startsWith: month
      }
    }

    const checkinRecords = await prisma.studyPlan.findMany({
      where: whereClause,
      include: {
        tasks: true
      },
      orderBy: {
        planDate: 'desc'
      }
    })

    // 检查今日是否已打卡
    const todayCheckin = checkinRecords.find(record => record.planDate === today)
    const hasCheckedInToday = !!todayCheckin

    // 计算连续打卡天数
    const completedCheckins = checkinRecords.filter(record => record.isCompleted)
    let consecutiveDays = 0
    
    if (completedCheckins.length > 0) {
      const dates = completedCheckins.map(record => record.planDate).sort().reverse()
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

    // 计算本月统计
    const currentMonth = new Date().toISOString().slice(0, 7)
    const monthlyCheckins = checkinRecords.filter(record => 
      record.planDate && record.planDate.toString().startsWith(currentMonth) && record.isCompleted
    )
    
    const monthlyStudyTime = monthlyCheckins.reduce((total, record) => {
      return total + record.tasks.reduce((taskTotal, task) => {
        return taskTotal + (task.duration || 0)
      }, 0)
    }, 0)

    return NextResponse.json({
      records: checkinRecords,
      hasCheckedInToday,
      consecutiveDays,
      stats: {
        totalCheckins: completedCheckins.length,
        monthlyCheckins: monthlyCheckins.length,
        monthlyStudyTime,
        currentStreak: consecutiveDays
      }
    })
  } catch (error) {
    console.error('获取打卡记录失败:', error)
    return NextResponse.json(
      { error: '获取打卡记录失败' },
      { status: 500 }
    )
  }
}