import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// 数据库操作函数
const getCoupleByInviteCode = async (inviteCode: string) => {
  return await prisma.couple.findUnique({
    where: { inviteCode }
  })
}

const getCoupleByUserId = async (userId: string) => {
  return await prisma.couple.findFirst({
    where: {
      OR: [
        { person1Id: userId },
        { person2Id: userId }
      ]
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const { inviteCode } = await request.json()
    
    if (!inviteCode) {
      return NextResponse.json(
        { error: '邀请码不能为空' },
        { status: 400 }
      )
    }
    
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth-token')
    
    if (!authToken) {
      return NextResponse.json(
        { error: '请先登录' },
        { status: 401 }
      )
    }

    // 验证JWT token
    let decoded: any
    try {
      decoded = jwt.verify(authToken.value, JWT_SECRET)
    } catch (error) {
      return NextResponse.json(
        { error: '登录已过期，请重新登录' },
        { status: 401 }
      )
    }

    // 从数据库获取用户信息
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: '用户不存在' },
        { status: 401 }
      )
    }
    
    // 检查用户是否已经有情侣
    const existingCouple = await getCoupleByUserId(user.id)
    if (existingCouple) {
      return NextResponse.json(
        { error: '您已经有情侣伴侣了' },
        { status: 400 }
      )
    }
    
    // 查找邀请码对应的情侣记录
    const couple = await getCoupleByInviteCode(inviteCode.toUpperCase())
    
    if (!couple) {
      return NextResponse.json(
        { error: '邀请码不存在或已失效' },
        { status: 404 }
      )
    }
    
    if (couple.isComplete) {
      return NextResponse.json(
        { error: '该邀请码已被使用' },
        { status: 400 }
      )
    }
    
    if (couple.person1Id === user.id) {
      return NextResponse.json(
        { error: '不能加入自己创建的情侣空间' },
        { status: 400 }
      )
    }
    
    // 更新情侣记录
    const updatedCouple = await prisma.couple.update({
      where: { id: couple.id },
      data: {
        person2Id: user.id,
        person2Name: user.displayName || user.username,
        isComplete: true
      }
    })
    
    // 更新两个用户的情侣关联
    await prisma.user.update({
      where: { id: user.id },
      data: {
        coupleId: updatedCouple.id
      }
    })
    
    // 同时更新邀请者的情侣关联
    if (couple.person1Id) {
      await prisma.user.update({
        where: { id: couple.person1Id },
        data: {
          coupleId: updatedCouple.id
        }
      })
    }
    
    // 获取伴侣信息
    const partner = await prisma.user.findUnique({
      where: { id: updatedCouple.person1Id! },
      select: { id: true, displayName: true, username: true }
    })

    return NextResponse.json({
      success: true,
      couple: updatedCouple,
      user: {
        ...user,
        coupleId: updatedCouple.id,
        partnerId: partner?.id || null,
        partnerName: partner ? (partner.displayName || partner.username) : null,
        role: 'person2'
      },
      message: '成功加入情侣空间'
    })
    
  } catch (error) {
    console.error('加入情侣失败:', error)
    return NextResponse.json(
      { error: '加入情侣失败' },
      { status: 500 }
    )
  }
}