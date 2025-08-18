import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import jwt from 'jsonwebtoken'

const updateTaskSchema = z.object({
  title: z.string().min(1, '任务名称不能为空').optional(),
  description: z.string().optional(),
  taskType: z.enum(['CHECKIN', 'POMODORO', 'READING', 'EXERCISE', 'REVIEW', 'OTHER']).optional(),
  duration: z.number().min(1).max(480).optional()
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const taskId = params.id
    const body = await request.json()
    const validatedData = updateTaskSchema.parse(body)

    // 验证任务是否存在且属于当前用户
    const task = await prisma.studyTask.findFirst({
      where: {
        id: taskId
      },
      include: {
        plan: {
          select: {
            userId: true
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 })
    }

    if (task.plan.userId !== userId) {
      return NextResponse.json({ error: '无权限修改此任务' }, { status: 403 })
    }

    // 更新任务
    const updatedTask = await prisma.studyTask.update({
      where: {
        id: taskId
      },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.taskType && { taskType: validatedData.taskType }),
        ...(validatedData.duration && { duration: validatedData.duration })
      }
    })

    return NextResponse.json(updatedTask, { status: 200 })
  } catch (error) {
    console.error('更新任务失败:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: '数据验证失败', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: '更新任务失败' }, { status: 500 })
  }
}