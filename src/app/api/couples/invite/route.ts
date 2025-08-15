import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// 生成邀请码
const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 生成随机ID
const generateId = () => Math.random().toString(36).substr(2, 9)

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
    
    // 检查用户是否已经有情侣
    let existingCouple = await getCoupleByUserId(user.id)
    
    // 如果已经有未完成的情侣记录，返回现有的邀请码
    if (existingCouple && !existingCouple.isComplete) {
      return NextResponse.json({
        success: true,
        couple: existingCouple,
        message: '邀请码已存在'
      })
    }
    
    // 如果已经有完成的情侣关系，先解除现有关系，然后创建新的邀请
    if (existingCouple && existingCouple.isComplete) {
      // 删除现有的情侣记录
      await prisma.couple.delete({
        where: { id: existingCouple.id }
      })
      
      // 清除用户的情侣关联
      await prisma.user.update({
        where: { id: user.id },
        data: { coupleId: null }
      })
      
      // 如果有伴侣，也清除伴侣的情侣关联
      const partnerId = existingCouple.person1Id === user.id ? existingCouple.person2Id : existingCouple.person1Id
      if (partnerId) {
        await prisma.user.update({
          where: { id: partnerId },
          data: { coupleId: null }
        })
      }
    }
    
    // 创建新的情侣记录
    const newCouple = await prisma.couple.create({
      data: {
        inviteCode: generateInviteCode(),
        person1Id: user.id,
        person1Name: user.displayName || user.username,
        person2Id: null,
        person2Name: null,
        isComplete: false
      }
    })
    
    // 更新用户的情侣关联
    await prisma.user.update({
      where: { id: user.id },
      data: {
        coupleId: newCouple.id
      }
    })
    
    return NextResponse.json({
      success: true,
      couple: newCouple,
      message: '邀请码生成成功'
    })
    
  } catch (error) {
    console.error('生成邀请码失败:', error)
    return NextResponse.json(
      { error: '生成邀请码失败' },
      { status: 500 }
    )
  }
}