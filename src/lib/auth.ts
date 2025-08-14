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
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                 request.cookies.get('admin_token')?.value
    
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
export function generateToken(payload: any, expiresIn: string = '24h'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn })
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
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (remoteAddr) {
    return remoteAddr
  }
  
  return '127.0.0.1' // 默认本地IP
}

// 获取用户代理
export function getUserAgent(request: NextRequest): string {
  return request.headers.get('user-agent') || 'Unknown'
}