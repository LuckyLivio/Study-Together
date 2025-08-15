import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyUserAuth } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyUserAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await request.json()
    const { isActive, title, description, targetDate } = body

    // 验证目标是否存在且属于当前用户
    const existingGoal = await prisma.studyGoal.findFirst({
      where: {
        id,
        userId: authResult.userId
      }
    })

    if (!existingGoal) {
      return NextResponse.json(
        { message: '学习目标不存在' },
        { status: 404 }
      )
    }

    // 更新学习目标
    const updatedGoal = await prisma.studyGoal.update({
      where: { id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(targetDate && { targetDate: new Date(targetDate) }),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      message: '学习目标更新成功',
      goal: updatedGoal
    })

  } catch (error) {
    console.error('更新学习目标失败:', error)
    return NextResponse.json(
      { message: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyUserAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 401 }
      )
    }

    const { id } = params

    // 验证目标是否存在且属于当前用户
    const existingGoal = await prisma.studyGoal.findFirst({
      where: {
        id,
        userId: authResult.userId
      }
    })

    if (!existingGoal) {
      return NextResponse.json(
        { message: '学习目标不存在' },
        { status: 404 }
      )
    }

    // 删除学习目标
    await prisma.studyGoal.delete({
      where: { id }
    })

    return NextResponse.json({
      message: '学习目标删除成功'
    })

  } catch (error) {
    console.error('删除学习目标失败:', error)
    return NextResponse.json(
      { message: '服务器内部错误' },
      { status: 500 }
    )
  }
}