import { NextRequest, NextResponse } from 'next/server'
import { checkIPWhitelist, checkUserLockout } from '@/lib/security'
import { getClientIP } from '@/lib/auth'

// IP白名单验证中间件
export async function ipWhitelistMiddleware(request: NextRequest): Promise<NextResponse | null> {
  try {
    const isAllowed = await checkIPWhitelist(request)
    
    if (!isAllowed) {
      const clientIP = getClientIP(request)
      console.log(`IP访问被拒绝: ${clientIP}`)
      
      return NextResponse.json(
        { 
          error: 'Access denied: IP address not in whitelist',
          message: '访问被拒绝：IP地址不在白名单中'
        },
        { status: 403 }
      )
    }
    
    return null // 允许继续处理
  } catch (error) {
    console.error('IP白名单验证失败:', error)
    return NextResponse.json(
      { error: 'Security check failed' },
      { status: 500 }
    )
  }
}

// 用户锁定检查中间件
export async function userLockoutMiddleware(
  request: NextRequest,
  userId?: string
): Promise<NextResponse | null> {
  try {
    const clientIP = getClientIP(request)
    const lockoutStatus = await checkUserLockout(userId, clientIP)
    
    if (lockoutStatus.isLocked) {
      const unlockTime = lockoutStatus.unlockAt
      const remainingTime = unlockTime ? Math.ceil((unlockTime.getTime() - Date.now()) / 1000 / 60) : 0
      
      console.log(`用户被锁定: ${userId || clientIP}, 剩余时间: ${remainingTime}分钟`)
      
      return NextResponse.json(
        {
          error: 'Account locked',
          message: `账户已被锁定，请在${remainingTime}分钟后重试`,
          unlockAt: unlockTime?.toISOString(),
          remainingMinutes: remainingTime
        },
        { status: 423 } // 423 Locked
      )
    }
    
    return null // 允许继续处理
  } catch (error) {
    console.error('用户锁定检查失败:', error)
    return NextResponse.json(
      { error: 'Security check failed' },
      { status: 500 }
    )
  }
}

// 组合安全中间件
export async function securityMiddleware(
  request: NextRequest,
  options: {
    checkIPWhitelist?: boolean
    checkUserLockout?: boolean
    userId?: string
  } = {}
): Promise<NextResponse | null> {
  const {
    checkIPWhitelist: shouldCheckIP = true,
    checkUserLockout: shouldCheckLockout = true,
    userId
  } = options
  
  // 检查IP白名单
  if (shouldCheckIP) {
    const ipResult = await ipWhitelistMiddleware(request)
    if (ipResult) return ipResult
  }
  
  // 检查用户锁定
  if (shouldCheckLockout) {
    const lockoutResult = await userLockoutMiddleware(request, userId)
    if (lockoutResult) return lockoutResult
  }
  
  return null // 所有检查通过
}

// 管理员路由安全中间件
export async function adminSecurityMiddleware(request: NextRequest): Promise<NextResponse | null> {
  return securityMiddleware(request, {
    checkIPWhitelist: true,
    checkUserLockout: true
  })
}

// 登录路由安全中间件
export async function loginSecurityMiddleware(
  request: NextRequest,
  userId?: string
): Promise<NextResponse | null> {
  return securityMiddleware(request, {
    checkIPWhitelist: false, // 登录时不检查IP白名单，避免锁死
    checkUserLockout: true,
    userId
  })
}

// 速率限制中间件（简单实现）
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimitMiddleware(
  request: NextRequest,
  options: {
    windowMs?: number // 时间窗口（毫秒）
    maxRequests?: number // 最大请求数
  } = {}
): NextResponse | null {
  const { windowMs = 15 * 60 * 1000, maxRequests = 100 } = options // 默认15分钟100次
  
  const clientIP = getClientIP(request)
  const now = Date.now()
  const key = `${clientIP}:${request.nextUrl.pathname}`
  
  const current = rateLimitMap.get(key)
  
  if (!current || now > current.resetTime) {
    // 重置或初始化计数器
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    return null
  }
  
  if (current.count >= maxRequests) {
    const resetIn = Math.ceil((current.resetTime - now) / 1000)
    
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: '请求过于频繁，请稍后重试',
        resetIn
      },
      { 
        status: 429,
        headers: {
          'Retry-After': resetIn.toString(),
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': current.resetTime.toString()
        }
      }
    )
  }
  
  // 增加计数器
  current.count++
  rateLimitMap.set(key, current)
  
  return null
}

// 清理过期的速率限制记录
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 5 * 60 * 1000) // 每5分钟清理一次