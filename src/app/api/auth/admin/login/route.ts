import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getClientIP, getUserAgent } from '@/lib/auth'
import { 
  recordLoginAttempt, 
  checkUserLockout, 
  incrementFailedAttempts, 
  clearFailedAttempts,
  checkIPWhitelist 
} from '@/lib/security'

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request)
  const userAgent = getUserAgent(request)
  let userId: string | null = null
  
  try {
    const body = await request.json()
    const { username, email, password } = body
    const loginIdentifier = username || email

    // 验证必填字段
    if (!loginIdentifier || !password) {
      await recordLoginAttempt(request, false, undefined, undefined, '缺少必填字段')
      return NextResponse.json(
        { error: '用户名和密码为必填字段' },
        { status: 400 }
      )
    }

    // 检查IP白名单
    const ipAllowed = await checkIPWhitelist(request)
    if (!ipAllowed) {
      await recordLoginAttempt(request, false, undefined, undefined, 'IP地址不在白名单中')
      return NextResponse.json(
        { error: 'IP地址不在允许范围内' },
        { status: 403 }
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
      await recordLoginAttempt(request, false, undefined, loginIdentifier, '管理员账户不存在或权限不足')
      return NextResponse.json(
        { error: '管理员账户不存在或权限不足' },
        { status: 401 }
      )
    }

    userId = user.id

    // 检查用户是否被锁定
    const lockoutResult = await checkUserLockout(userId, clientIP)
    if (lockoutResult.isLocked) {
      await recordLoginAttempt(request, false, userId, user.username, '账户已被锁定')
      return NextResponse.json(
        { error: '账户已被锁定，请稍后再试' },
        { status: 423 }
      )
    }

    // 检查用户状态
    if (user.status !== 'ACTIVE') {
      await recordLoginAttempt(request, false, userId, user.username, '账户已被禁用')
      return NextResponse.json(
        { error: '账户已被禁用' },
        { status: 403 }
      )
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      // 记录失败的登录尝试并增加失败次数
      await Promise.all([
        recordLoginAttempt(request, false, userId, user.username, '密码错误'),
        incrementFailedAttempts(request, userId, user.username)
      ])
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      )
    }

    // 登录成功，清除失败尝试记录并更新最后登录时间
    await Promise.all([
      clearFailedAttempts(request, userId),
      prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      }),
      recordLoginAttempt(request, true, userId, user.username, '登录成功')
    ])

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

    const response = NextResponse.json({
      success: true,
      message: '管理员登录成功',
      user: userWithoutPassword,
      token
    })

    // 设置cookie
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24小时
    })

    return response

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