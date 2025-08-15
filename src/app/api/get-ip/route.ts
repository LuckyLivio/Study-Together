import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // 获取客户端IP地址
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const clientIP = request.headers.get('x-client-ip')
    
    // 优先级：x-forwarded-for > x-real-ip > x-client-ip
    let ip = forwarded?.split(',')[0]?.trim() || 
             realIP || 
             clientIP || 
             '未知'
    
    // 如果是IPv6的localhost，转换为更友好的显示
    if (ip === '::1' || ip === '127.0.0.1') {
      ip = '本地访问 (localhost)'
    }
    
    return NextResponse.json({
      ip,
      userAgent: request.headers.get('user-agent') || '未知浏览器',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('获取IP地址失败:', error)
    return NextResponse.json(
      { error: '获取IP地址失败', ip: '无法获取' },
      { status: 500 }
    )
  }
}