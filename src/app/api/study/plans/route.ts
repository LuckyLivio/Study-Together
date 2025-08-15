import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyUserAuth } from '@/lib/auth'

// 获取用户的学习计划
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyUserAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }
    
    const userId = authResult.userId!

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    
    let whereClause: any = { userId }
    
    if (date) {
      const targetDate = new Date(date)
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0))
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999))
      
      whereClause.planDate = {
        gte: startOfDay,
        lte: endOfDay
      }
    }

    const plans = await prisma.studyPlan.findMany({
      where: whereClause,
      include: {
        tasks: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { planDate: 'desc' }
    })

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('获取学习计划失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 创建新的学习计划
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyUserAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }
    
    const userId = authResult.userId!

    const { title, description, planDate, tasks } = await request.json()

    if (!title || !planDate) {
      return NextResponse.json({ error: '标题和计划日期不能为空' }, { status: 400 })
    }

    const plan = await prisma.studyPlan.create({
      data: {
        userId,
        title,
        description,
        planDate: new Date(planDate),
        tasks: {
          create: tasks?.map((task: any) => ({
            title: task.title,
            description: task.description,
            taskType: task.taskType,
            duration: task.duration
          })) || []
        }
      },
      include: {
        tasks: true
      }
    })

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('创建学习计划失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}