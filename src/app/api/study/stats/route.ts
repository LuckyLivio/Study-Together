import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'

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
    
    const userId = currentUser.id
    const now = new Date()
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)

    // 获取用户学习统计数据
    const [studyPlans, studyTasks, user] = await Promise.all([
      // 学习计划统计
      prisma.studyPlan.findMany({
        where: { userId },
        include: { tasks: true }
      }),
      
      // 任务完成统计
      prisma.studyTask.count({
        where: {
          plan: { userId },
          isCompleted: true
        }
      }),
      
      // 获取用户信息和情侣关系
      prisma.user.findUnique({
        where: { id: userId },
        include: {
          couple: {
            include: {
              users: true
            }
          }
        }
      })
    ])
    
    // 模拟番茄时间和打卡数据
    const pomodoroSessions = Math.floor(Math.random() * 20) + 5
    const checkinRecords = Math.floor(Math.random() * 7) + 1

    // 计算总学习时间（分钟）
    const totalStudyTime = studyPlans.reduce((total: number, plan: any) => {
      return total + plan.tasks.reduce((planTotal: number, task: any) => {
        return planTotal + (task.isCompleted ? (task.duration || 0) : 0)
      }, 0)
    }, 0)

    // 计算本周学习时间
    const weeklyProgress = studyPlans
      .filter((plan: any) => {
        const planDate = new Date(plan.planDate)
        return planDate >= weekStart && planDate < weekEnd
      })
      .reduce((total: number, plan: any) => {
        return total + plan.tasks.reduce((planTotal: number, task: any) => {
          return planTotal + (task.isCompleted ? (task.duration || 0) : 0)
        }, 0)
      }, 0)

    const myStats = {
      totalStudyTime,
      completedTasks: studyTasks,
      pomodoroSessions,
      checkinDays: checkinRecords,
      weeklyGoal: 1200, // 20小时/周
      weeklyProgress
    }

    // 获取伴侣统计数据
    let partnerStats = null
    if (user?.couple && user.couple.users) {
      const partner = user.couple.users.find((u: any) => u.id !== userId)
      
      if (partner) {
        const [partnerPlans, partnerTasks] = await Promise.all([
          prisma.studyPlan.findMany({
            where: { userId: partner.id },
            include: { tasks: true }
          }),
          
          prisma.studyTask.count({
            where: {
              plan: { userId: partner.id },
              isCompleted: true
            }
          })
        ])
        
        // 模拟伴侣数据
        const partnerPomodoro = Math.floor(Math.random() * 20) + 3
        const partnerCheckin = Math.floor(Math.random() * 7) + 1

        const partnerTotalStudyTime = partnerPlans.reduce((total: number, plan: any) => {
          return total + plan.tasks.reduce((planTotal: number, task: any) => {
            return planTotal + (task.isCompleted ? (task.duration || 0) : 0)
          }, 0)
        }, 0)

        const partnerWeeklyProgress = partnerPlans
          .filter((plan: any) => {
            const planDate = new Date(plan.planDate)
            return planDate >= weekStart && planDate < weekEnd
          })
          .reduce((total: number, plan: any) => {
            return total + plan.tasks.reduce((planTotal: number, task: any) => {
              return planTotal + (task.isCompleted ? (task.duration || 0) : 0)
            }, 0)
          }, 0)

        partnerStats = {
          name: partner.displayName || '学习伙伴',
          avatar: partner.avatar,
          stats: {
            totalStudyTime: partnerTotalStudyTime,
            completedTasks: partnerTasks,
            pomodoroSessions: partnerPomodoro,
            checkinDays: partnerCheckin,
            weeklyGoal: 1200,
            weeklyProgress: partnerWeeklyProgress
          },
          lastActive: partner.updatedAt.toISOString()
        }
      }
    }

    return NextResponse.json({
      stats: myStats,
      partnerStats
    })
  } catch (error) {
    console.error('获取学习统计失败:', error)
    return NextResponse.json(
      { error: '获取学习统计失败' },
      { status: 500 }
    )
  }
}