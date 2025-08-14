import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { verifyAdminAuth } from '@/lib/auth'

const prisma = new PrismaClient()

// 获取安全设置
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdminAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    // 获取安全设置（如果不存在则创建默认设置）
    let securitySettings = await prisma.securitySettings.findFirst()
    
    if (!securitySettings) {
      securitySettings = await prisma.securitySettings.create({
        data: {}
      })
    }

    // 获取最近的登录记录（最近50条）
    const loginAttempts = await prisma.loginAttempt.findMany({
      take: 50,
      orderBy: {
        timestamp: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      settings: {
        maxLoginAttempts: securitySettings.maxLoginAttempts,
        lockoutDuration: securitySettings.lockoutDuration,
        sessionTimeout: securitySettings.sessionTimeout,
        requireTwoFactor: securitySettings.requireTwoFactor,
        allowedIPs: securitySettings.allowedIPs,
        passwordPolicy: {
          minLength: securitySettings.passwordMinLength,
          requireUppercase: securitySettings.passwordRequireUppercase,
          requireLowercase: securitySettings.passwordRequireLowercase,
          requireNumbers: securitySettings.passwordRequireNumbers,
          requireSpecialChars: securitySettings.passwordRequireSpecialChars,
          maxAge: securitySettings.passwordMaxAge
        }
      },
      loginAttempts: loginAttempts.map(attempt => ({
        id: attempt.id,
        ip: attempt.ip,
        userAgent: attempt.userAgent || '',
        timestamp: attempt.timestamp.toISOString(),
        success: attempt.success,
        reason: attempt.reason,
        user: attempt.user ? {
          username: attempt.user.username,
          email: attempt.user.email
        } : null
      }))
    })
  } catch (error) {
    console.error('获取安全设置失败:', error)
    return NextResponse.json(
      { error: '获取安全设置失败' },
      { status: 500 }
    )
  }
}

// 更新安全设置
export async function PUT(request: NextRequest) {
  try {
    // 验证管理员权限
    const authResult = await verifyAdminAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const body = await request.json()
    const { settings } = body

    // 验证输入数据
    if (!settings) {
      return NextResponse.json(
        { error: '缺少安全设置数据' },
        { status: 400 }
      )
    }

    // 验证数值范围
    if (settings.maxLoginAttempts < 1 || settings.maxLoginAttempts > 10) {
      return NextResponse.json(
        { error: '最大登录尝试次数必须在1-10之间' },
        { status: 400 }
      )
    }

    if (settings.lockoutDuration < 1 || settings.lockoutDuration > 1440) {
      return NextResponse.json(
        { error: '锁定时长必须在1-1440分钟之间' },
        { status: 400 }
      )
    }

    if (settings.sessionTimeout < 5 || settings.sessionTimeout > 1440) {
      return NextResponse.json(
        { error: '会话超时必须在5-1440分钟之间' },
        { status: 400 }
      )
    }

    if (settings.passwordPolicy.minLength < 6 || settings.passwordPolicy.minLength > 32) {
      return NextResponse.json(
        { error: '密码最小长度必须在6-32之间' },
        { status: 400 }
      )
    }

    if (settings.passwordPolicy.maxAge < 30 || settings.passwordPolicy.maxAge > 365) {
      return NextResponse.json(
        { error: '密码有效期必须在30-365天之间' },
        { status: 400 }
      )
    }

    // 验证IP地址格式
    if (settings.allowedIPs && Array.isArray(settings.allowedIPs)) {
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
      for (const ip of settings.allowedIPs) {
        if (!ipRegex.test(ip)) {
          return NextResponse.json(
            { error: `无效的IP地址格式: ${ip}` },
            { status: 400 }
          )
        }
      }
    }

    // 更新或创建安全设置
    const securitySettings = await prisma.securitySettings.upsert({
      where: { id: 'default' },
      update: {
        maxLoginAttempts: settings.maxLoginAttempts,
        lockoutDuration: settings.lockoutDuration,
        sessionTimeout: settings.sessionTimeout,
        requireTwoFactor: settings.requireTwoFactor,
        allowedIPs: settings.allowedIPs || [],
        passwordMinLength: settings.passwordPolicy.minLength,
        passwordRequireUppercase: settings.passwordPolicy.requireUppercase,
        passwordRequireLowercase: settings.passwordPolicy.requireLowercase,
        passwordRequireNumbers: settings.passwordPolicy.requireNumbers,
        passwordRequireSpecialChars: settings.passwordPolicy.requireSpecialChars,
        passwordMaxAge: settings.passwordPolicy.maxAge
      },
      create: {
        id: 'default',
        maxLoginAttempts: settings.maxLoginAttempts,
        lockoutDuration: settings.lockoutDuration,
        sessionTimeout: settings.sessionTimeout,
        requireTwoFactor: settings.requireTwoFactor,
        allowedIPs: settings.allowedIPs || [],
        passwordMinLength: settings.passwordPolicy.minLength,
        passwordRequireUppercase: settings.passwordPolicy.requireUppercase,
        passwordRequireLowercase: settings.passwordPolicy.requireLowercase,
        passwordRequireNumbers: settings.passwordPolicy.requireNumbers,
        passwordRequireSpecialChars: settings.passwordPolicy.requireSpecialChars,
        passwordMaxAge: settings.passwordPolicy.maxAge
      }
    })

    return NextResponse.json({
      message: '安全设置已更新',
      settings: {
        maxLoginAttempts: securitySettings.maxLoginAttempts,
        lockoutDuration: securitySettings.lockoutDuration,
        sessionTimeout: securitySettings.sessionTimeout,
        requireTwoFactor: securitySettings.requireTwoFactor,
        allowedIPs: securitySettings.allowedIPs,
        passwordPolicy: {
          minLength: securitySettings.passwordMinLength,
          requireUppercase: securitySettings.passwordRequireUppercase,
          requireLowercase: securitySettings.passwordRequireLowercase,
          requireNumbers: securitySettings.passwordRequireNumbers,
          requireSpecialChars: securitySettings.passwordRequireSpecialChars,
          maxAge: securitySettings.passwordMaxAge
        }
      }
    })
  } catch (error) {
    console.error('更新安全设置失败:', error)
    return NextResponse.json(
      { error: '更新安全设置失败' },
      { status: 500 }
    )
  }
}