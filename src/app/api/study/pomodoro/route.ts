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

    const { sessionType, duration, completedAt } = await request.json()

    // 创建番茄时间会话记录（使用studyPlan表模拟）
    const pomodoroSession = await prisma.studyPlan.create({
      data: {
        userId: currentUser.id,
        title: `${sessionType}会话`,
        description: `番茄时间${sessionType}会话，时长${duration}分钟`,
        planDate: new Date().toISOString().split('T')[0],
        isCompleted: true,
        tasks: {
          create: {
            title: `${sessionType}任务`,
            description: `番茄时间${sessionType}任务`,
            taskType: sessionType === 'WORK' ? 'POMODORO' : 'OTHER',
            duration: duration,
            isCompleted: true,
            completedAt: completedAt ? new Date(completedAt) : new Date()
          }
        }
      },
      include: {
        tasks: true
      }
    })

    return NextResponse.json({
      success: true,
      session: pomodoroSession
    })
  } catch (error) {
    console.error('创建番茄时间会话失败:', error)
    return NextResponse.json(
      { error: '创建番茄时间会话失败' },
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
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // 获取番茄时间会话记录（从studyPlan中筛选）
    const whereClause: any = {
      userId: currentUser.id,
      title: {
        contains: '会话'
      }
    }

    if (startDate && endDate) {
      whereClause.planDate = {
        gte: startDate,
        lte: endDate
      }
    }

    const pomodoroSessions = await prisma.studyPlan.findMany({
      where: whereClause,
      include: {
        tasks: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // 统计数据
    const totalSessions = pomodoroSessions.length
    const totalWorkTime = pomodoroSessions
      .filter(session => session.title.includes('WORK'))
      .reduce((total, session) => {
        return total + session.tasks.reduce((taskTotal, task) => {
          return taskTotal + (task.duration || 0)
        }, 0)
      }, 0)

    return NextResponse.json({
      sessions: pomodoroSessions,
      stats: {
        totalSessions,
        totalWorkTime,
        averageSessionLength: totalSessions > 0 ? Math.round(totalWorkTime / totalSessions) : 0
      }
    })
  } catch (error) {
    console.error('获取番茄时间会话失败:', error)
    return NextResponse.json(
      { error: '获取番茄时间会话失败' },
      { status: 500 }
    )
  }
}