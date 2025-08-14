import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, password } = body
    const loginIdentifier = username || email

    // 验证必填字段
    if (!loginIdentifier || !password) {
      return NextResponse.json(
        { error: '用户名和密码为必填字段' },
        { status: 400 }
      )
    }

    // 查找管理员用户（必须是isAdmin=true或role=ADMIN）
    const user = await prisma.user.findFirst({
      where: {
        AND: [
          {
            OR: [
              { username: loginIdentifier },
              { email: loginIdentifier }
            ]
          },
          {
            OR: [
              { isAdmin: true },
              { role: 'ADMIN' }
            ]
          }
        ]
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: '管理员账户不存在或权限不足' },
        { status: 401 }
      )
    }

    // 检查用户状态
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: '账户已被禁用' },
        { status: 403 }
      )
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      )
    }

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

    // 生成JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    )

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      message: '管理员登录成功',
      user: userWithoutPassword,
      token
    })

  } catch (error) {
    console.error('管理员登录错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}