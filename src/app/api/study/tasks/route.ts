import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import jwt from 'jsonwebtoken'

const createTaskSchema = z.object({
  planId: z.string(),
  title: z.string().min(1, '任务名称不能为空'),
  description: z.string().optional(),
  taskType: z.enum(['CHECKIN', 'POMODORO', 'READING', 'EXERCISE', 'REVIEW', 'OTHER']),
  duration: z.number().min(1).max(480).optional()
})

export async function POST(request: NextRequest) {
  try {
    // 从请求头获取token
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                 request.cookies.get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    const userId = decoded.userId || decoded.id
    
    if (!userId) {
      return NextResponse.json({ error: '无效的token' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createTaskSchema.parse(body)

    // 验证学习计划是否存在且属于当前用户
    const plan = await prisma.studyPlan.findFirst({
      where: {
        id: validatedData.planId,
        userId: userId
      }
    })

    if (!plan) {
      return NextResponse.json({ error: '学习计划不存在' }, { status: 404 })
    }

    // 创建新任务
    const task = await prisma.studyTask.create({
      data: {
        planId: validatedData.planId,
        title: validatedData.title,
        description: validatedData.description || '',
        taskType: validatedData.taskType,
        duration: validatedData.duration || 30,
        isCompleted: false
      }
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('创建任务失败:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '数据验证失败', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: '创建任务失败' }, { status: 500 })
  }
}