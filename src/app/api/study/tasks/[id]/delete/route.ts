import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export async function DELETE(
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
      return NextResponse.json({ error: '无权限删除此任务' }, { status: 403 })
    }

    // 删除任务
    await prisma.studyTask.delete({
      where: {
        id: taskId
      }
    })

    return NextResponse.json({ message: '任务删除成功' }, { status: 200 })
  } catch (error) {
    console.error('删除任务失败:', error)
    return NextResponse.json({ error: '删除任务失败' }, { status: 500 })
  }
}