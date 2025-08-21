import { prisma } from '@/lib/prisma'
import { getClientIP, getUserAgent } from './auth'
import { NextRequest } from 'next/server'

interface SecuritySettings {
  maxLoginAttempts: number
  lockoutDuration: number
  sessionTimeout: number
  requireTwoFactor: boolean
  allowedIPs: string // SQLite compatibility - stored as comma-separated string
  passwordMinLength: number
  passwordRequireUppercase: boolean
  passwordRequireLowercase: boolean
  passwordRequireNumbers: boolean
  passwordRequireSpecialChars: boolean
  passwordMaxAge: number
}

// 获取安全设置
export async function getSecuritySettings(): Promise<SecuritySettings> {
  let settings = await prisma.securitySettings.findFirst()
  
  if (!settings) {
    settings = await prisma.securitySettings.create({
      data: { id: 'default' }
    })
  }
  
  return {
    maxLoginAttempts: settings.maxLoginAttempts,
    lockoutDuration: settings.lockoutDuration,
    sessionTimeout: settings.sessionTimeout,
    requireTwoFactor: settings.requireTwoFactor,
    allowedIPs: settings.allowedIPs,
    passwordMinLength: settings.passwordMinLength,
    passwordRequireUppercase: settings.passwordRequireUppercase,
    passwordRequireLowercase: settings.passwordRequireLowercase,
    passwordRequireNumbers: settings.passwordRequireNumbers,
    passwordRequireSpecialChars: settings.passwordRequireSpecialChars,
    passwordMaxAge: settings.passwordMaxAge
  }
}

// 记录登录尝试
export async function recordLoginAttempt(
  request: NextRequest,
  success: boolean,
  userId?: string,
  username?: string,
  reason?: string
): Promise<void> {
  const ip = getClientIP(request)
  const userAgent = getUserAgent(request)
  
  await prisma.loginAttempt.create({
    data: {
      ip,
      userAgent,
      userId,
      username,
      success,
      reason
    }
  })
}

// 检查用户是否被锁定
export async function checkUserLockout(userId?: string, ip?: string): Promise<{
  isLocked: boolean
  unlockAt?: Date
  attempts?: number
}> {
  if (!userId && !ip) {
    return { isLocked: false }
  }
  
  const lockout = await prisma.userLockout.findFirst({
    where: {
      OR: [
        userId ? { userId } : {},
        ip ? { ip } : {}
      ].filter(condition => Object.keys(condition).length > 0)
    }
  })
  
  if (!lockout) {
    return { isLocked: false }
  }
  
  // 检查是否仍在锁定期内
  if (lockout.unlockAt && lockout.unlockAt > new Date()) {
    return {
      isLocked: true,
      unlockAt: lockout.unlockAt,
      attempts: lockout.attempts
    }
  }
  
  // 锁定期已过，清除锁定记录
  if (lockout.unlockAt && lockout.unlockAt <= new Date()) {
    await prisma.userLockout.delete({
      where: { id: lockout.id }
    })
  }
  
  return { isLocked: false }
}

// 增加失败尝试次数
export async function incrementFailedAttempts(
  request: NextRequest,
  userId?: string,
  username?: string
): Promise<{ shouldLock: boolean; unlockAt?: Date }> {
  const ip = getClientIP(request)
  const settings = await getSecuritySettings()
  
  // 记录失败的登录尝试
  await recordLoginAttempt(request, false, userId, username, '密码错误')
  
  // 查找或创建锁定记录
  let lockout = await prisma.userLockout.findFirst({
    where: {
      OR: [
        userId ? { userId } : {},
        { ip }
      ].filter(condition => Object.keys(condition).length > 0)
    }
  })
  
  if (!lockout) {
    lockout = await prisma.userLockout.create({
      data: {
        userId,
        ip,
        attempts: 1
      }
    })
  } else {
    lockout = await prisma.userLockout.update({
      where: { id: lockout.id },
      data: {
        attempts: lockout.attempts + 1
      }
    })
  }
  
  // 检查是否需要锁定
  if (lockout.attempts >= settings.maxLoginAttempts) {
    const unlockAt = new Date(Date.now() + settings.lockoutDuration * 60 * 1000)
    
    await prisma.userLockout.update({
      where: { id: lockout.id },
      data: {
        lockedAt: new Date(),
        unlockAt
      }
    })
    
    return { shouldLock: true, unlockAt }
  }
  
  return { shouldLock: false }
}

// 清除失败尝试记录（登录成功时调用）
export async function clearFailedAttempts(
  request: NextRequest,
  userId: string
): Promise<void> {
  const ip = getClientIP(request)
  
  // 记录成功的登录尝试
  await recordLoginAttempt(request, true, userId)
  
  // 清除锁定记录
  await prisma.userLockout.deleteMany({
    where: {
      OR: [
        { userId },
        { ip }
      ]
    }
  })
}

// 检查IP白名单
export async function checkIPWhitelist(request: NextRequest): Promise<boolean> {
  const settings = await getSecuritySettings()
  
  // 如果没有设置IP白名单，允许所有IP
  if (!settings.allowedIPs || settings.allowedIPs.trim() === '') {
    return true
  }
  
  const clientIP = getClientIP(request)
  const allowedIPList = settings.allowedIPs.split(',').map(ip => ip.trim()).filter(ip => ip)
  return allowedIPList.includes(clientIP)
}

// 验证密码策略
export async function validatePasswordPolicy(password: string): Promise<{
  valid: boolean
  errors: string[]
}> {
  const settings = await getSecuritySettings()
  const errors: string[] = []
  
  if (password.length < settings.passwordMinLength) {
    errors.push(`密码长度至少需要${settings.passwordMinLength}个字符`)
  }
  
  if (settings.passwordRequireUppercase && !/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母')
  }
  
  if (settings.passwordRequireLowercase && !/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母')
  }
  
  if (settings.passwordRequireNumbers && !/\d/.test(password)) {
    errors.push('密码必须包含数字')
  }
  
  if (settings.passwordRequireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('密码必须包含特殊字符')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// 清理过期的登录记录
export async function cleanupOldLoginAttempts(daysToKeep: number = 30): Promise<void> {
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000)
  
  await prisma.loginAttempt.deleteMany({
    where: {
      timestamp: {
        lt: cutoffDate
      }
    }
  })
}

// 获取登录统计
export async function getLoginStats(days: number = 7): Promise<{
  totalAttempts: number
  successfulLogins: number
  failedAttempts: number
  uniqueIPs: number
  topFailureReasons: Array<{ reason: string; count: number }>
}> {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
  
  const attempts = await prisma.loginAttempt.findMany({
    where: {
      timestamp: {
        gte: startDate
      }
    }
  })
  
  const totalAttempts = attempts.length
  const successfulLogins = attempts.filter(a => a.success).length
  const failedAttempts = attempts.filter(a => !a.success).length
  const uniqueIPs = new Set(attempts.map(a => a.ip)).size
  
  // 统计失败原因
  const failureReasons = attempts
    .filter(a => !a.success && a.reason)
    .reduce((acc, attempt) => {
      const reason = attempt.reason!
      acc[reason] = (acc[reason] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  
  const topFailureReasons = Object.entries(failureReasons)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  
  return {
    totalAttempts,
    successfulLogins,
    failedAttempts,
    uniqueIPs,
    topFailureReasons
  }
}