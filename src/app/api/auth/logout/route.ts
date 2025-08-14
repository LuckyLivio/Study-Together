import { NextRequest, NextResponse } from 'next/server';

// POST /api/auth/logout - 用户注销
export async function POST(request: NextRequest) {
  try {
    // 创建响应
    const response = NextResponse.json({
      message: '注销成功'
    });

    // 清除认证cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0 // 立即过期
    });

    return response;
  } catch (error) {
    console.error('注销失败:', error);
    return NextResponse.json(
      { error: '注销失败，请稍后重试' },
      { status: 500 }
    );
  }
}