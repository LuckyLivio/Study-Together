import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyUserAuth } from '@/lib/auth'

// 更新学习任务
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await verifyUserAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }
    
    const userId = authResult.userId!
    const taskId = params.id

    const { isCompleted } = await request.json()

    // 验证任务是否属于当前用户
    const task = await prisma.studyTask.findFirst({
      where: {
        id: taskId,
        plan: {
          userId
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: '任务不存在或无权限' }, { status: 404 })
    }

    const updatedTask = await prisma.studyTask.update({
      where: { id: taskId },
      data: {
        isCompleted,
        completedAt: isCompleted ? new Date() : null
      }
    })

    return NextResponse.json({ task: updatedTask })
  } catch (error) {
    console.error('更新学习任务失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}