import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

interface AuthResult {
  success: boolean
  error?: string
  userId?: string
  user?: any
}

// 验证JWT token的辅助函数
export function verifyToken(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return null
  }

  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; username: string; role: string; isAdmin?: boolean }
  } catch (error) {
    return null
  }
}

// 验证管理员权限
export async function verifyAdminAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // 尝试多种token来源
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                 request.cookies.get('admin_token')?.value ||
                 request.cookies.get('auth-token')?.value
    
    if (!token) {
      return { success: false, error: 'No token provided' }
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    if (decoded.role !== 'ADMIN' && !decoded.isAdmin) {
      return { success: false, error: 'Admin access required' }
    }

    return { success: true, userId: decoded.userId, user: decoded }
  } catch (error) {
    return { success: false, error: 'Invalid token' }
  }
}

// 验证用户权限
export async function verifyUserAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const decoded = verifyToken(request)
    
    if (!decoded) {
      return { success: false, error: 'Invalid or missing token' }
    }

    return { success: true, userId: decoded.userId, user: decoded }
  } catch (error) {
    return { success: false, error: 'Authentication failed' }
  }
}

// 生成JWT token
export function generateToken(payload: any, expiresIn: string | number = '24h'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions)
}

// 验证密码策略
export function validatePassword(password: string, policy: {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (password.length < policy.minLength) {
    errors.push(`密码长度至少需要${policy.minLength}个字符`)
  }
  
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母')
  }
  
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母')
  }
  
  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('密码必须包含数字')
  }
  
  if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('密码必须包含特殊字符')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// 验证IP地址格式
export function validateIP(ip: string): boolean {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  return ipRegex.test(ip)
}

// 获取客户端IP地址
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const remoteAddr = request.headers.get('x-remote-addr')
  
  let ip = '127.0.0.1' // 默认本地IP
  
  if (forwarded) {
    ip = forwarded.split(',')[0].trim()
  } else if (realIP) {
    ip = realIP
  } else if (remoteAddr) {
    ip = remoteAddr
  }
  
  // 如果是IPv6的localhost，转换为更友好的显示
  if (ip === '::1' || ip === '127.0.0.1') {
    ip = '本地访问 (localhost)'
  }
  
  return ip
}

// 获取用户代理
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'Unknown'
}