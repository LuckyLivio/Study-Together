import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// 检查维护模式状态
async function checkMaintenanceMode(request: NextRequest): Promise<{ enabled: boolean; message: string }> {
  try {
    // 构建完整的 API URL
    const baseUrl = request.nextUrl.origin;
    const apiUrl = `${baseUrl}/api/admin/maintenance`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      return { enabled: false, message: '' };
    }
    
    const data = await response.json();
    
    return {
      enabled: data.enabled || false,
      message: data.message || '网站正在维护中，请稍后访问'
    };
  } catch (error) {
    return { enabled: false, message: '' };
  }
}

// 检查用户是否为管理员
async function isAdminUser(request: NextRequest): Promise<boolean> {
  try {
    // 检查 admin_token cookie
    const adminToken = request.cookies.get('admin_token')?.value;
    
    if (adminToken) {
      try {
        const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
        const secret = new TextEncoder().encode(jwtSecret);
        const { payload } = await jwtVerify(adminToken, secret);
        return payload.isAdmin === true;
      } catch {
        // admin_token 无效，继续检查普通 token
      }
    }

    // 检查普通用户 token
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return false;
    }

    try {
      const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
      const secret = new TextEncoder().encode(jwtSecret);
      const { payload } = await jwtVerify(token, secret);
      return payload && typeof payload === 'object' && payload.isAdmin === true;
    } catch {
      return false;
    }
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 跳过静态资源和API路由（除了非管理员API）
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public')
  ) {
    return NextResponse.next();
  }

  // 跳过某些路径的维护模式检查
  if (
    pathname.startsWith('/api/admin/maintenance') || // 允许维护模式API
    pathname.startsWith('/api/auth') || // 允许认证API
    pathname.startsWith('/admin') // 允许管理员页面
  ) {
    return NextResponse.next();
  }

  // 检查维护模式
  const maintenanceStatus = await checkMaintenanceMode(request);
  
  if (maintenanceStatus.enabled) {
    // 如果是管理员，允许访问
    const isAdmin = await isAdminUser(request);
    
    if (isAdmin) {
      return NextResponse.next();
    }

    // 如果已经在维护页面，避免重定向循环
    if (pathname === '/maintenance') {
      return NextResponse.next();
    }

    // 重定向到维护页面
    const url = request.nextUrl.clone();
    url.pathname = '/maintenance';
    url.searchParams.set('message', encodeURIComponent(maintenanceStatus.message));
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};