import { NextRequest, NextResponse } from 'next/server'
import { verifyUserAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyUserAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    // 通过用户ID获取用户信息
    const currentUser = await prisma.user.findUnique({
      where: { id: authResult.userId }
    })
    
    if (!currentUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    const requestBody = await request.json()
    console.log('打卡请求数据:', requestBody)
    const { studyTime, completedTasks, notes } = requestBody
    
    // 验证必需字段
    if (typeof studyTime !== 'number' || typeof completedTasks !== 'number') {
      console.log('数据验证失败:', { studyTime, completedTasks, notes })
      return NextResponse.json(
        { error: '数据格式错误：studyTime 和 completedTasks 必须是数字' },
        { status: 400 }
      )
    }
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    // 检查今日是否已打卡（使用studyPlan表模拟）
    console.log('检查打卡时间范围:', { todayStart, todayEnd, userId: currentUser.id })
    const existingCheckin = await prisma.studyPlan.findFirst({
      where: {
        userId: currentUser.id,
        planDate: {
          gte: todayStart,
          lt: todayEnd
        },
        title: '每日打卡'
      }
    })
    
    console.log('现有打卡记录:', existingCheckin)

    if (existingCheckin) {
      console.log('今日已打卡，更新现有记录')
      // 更新现有打卡记录而不是返回错误
      const updatedCheckin = await prisma.studyPlan.update({
        where: { id: existingCheckin.id },
        data: {
          description: notes || '每日学习打卡',
          tasks: {
            deleteMany: {},
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
      
      return NextResponse.json({
        success: true,
        checkin: updatedCheckin,
        consecutiveDays: 1, // 简化处理
        totalCheckins: 1
      })
    }

    // 创建打卡记录
    const checkinRecord = await prisma.studyPlan.create({
      data: {
        userId: currentUser.id,
        title: '每日打卡',
        description: notes || '每日学习打卡',
        planDate: todayStart,
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
    const authResult = await verifyUserAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    // 通过用户ID获取用户信息
    const currentUser = await prisma.user.findUnique({
      where: { id: authResult.userId }
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
    const todayCheckin = checkinRecords.find(record => {
      const recordDate = new Date(record.planDate)
      return recordDate.toISOString().split('T')[0] === today
    })
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