import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// 数据库操作函数
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

const getPartnerInfo = async (userId: string, couple: any) => {
  const partnerId = couple.person1Id === userId ? couple.person2Id : couple.person1Id
  if (partnerId) {
    return await prisma.user.findUnique({
      where: { id: partnerId }
    })
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
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
    
    // 查找用户的情侣记录
    const couple = await getCoupleByUserId(user.id)
    
    if (!couple) {
      return NextResponse.json(
        { error: '您还没有情侣伴侣' },
        { status: 400 }
      )
    }
    
    // 获取伴侣信息（用于通知）
    const partner = await getPartnerInfo(user.id, couple)
    
    // 删除情侣记录
    await prisma.couple.delete({
      where: { id: couple.id }
    })
    
    // 更新当前用户信息 - 清除情侣关联
    await prisma.user.update({
      where: { id: user.id },
      data: {
        coupleId: null
      }
    })
    
    // 更新伴侣用户信息（如果存在）
    if (partner) {
      await prisma.user.update({
        where: { id: partner.id },
        data: {
          coupleId: null
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      message: `已成功解除与${partner?.displayName || partner?.username || '伴侣'}的情侣关系`,
      partnerName: partner?.displayName || partner?.username,
      user: {
        ...user,
        coupleId: null
      }
    })
    
  } catch (error) {
    console.error('解绑情侣失败:', error)
    return NextResponse.json(
      { error: '解绑失败' },
      { status: 500 }
    )
  }
}