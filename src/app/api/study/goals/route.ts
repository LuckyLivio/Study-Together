import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyUserAuth } from '@/lib/auth'

// 获取用户的学习目标
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyUserAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }
    
    const userId = authResult.userId!

    const goals = await prisma.studyGoal.findMany({
      where: { 
        userId,
        isActive: true
      },
      orderBy: { targetDate: 'asc' }
    })

    return NextResponse.json({ goals })
  } catch (error) {
    console.error('获取学习目标失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 创建新的学习目标
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyUserAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }
    
    const userId = authResult.userId!

    const { title, description, targetDate } = await request.json()

    if (!title || !targetDate) {
      return NextResponse.json({ error: '标题和目标日期不能为空' }, { status: 400 })
    }

    const goal = await prisma.studyGoal.create({
      data: {
        userId,
        title,
        description,
        targetDate: new Date(targetDate)
      }
    })

    return NextResponse.json({ goal })
  } catch (error) {
    console.error('创建学习目标失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}