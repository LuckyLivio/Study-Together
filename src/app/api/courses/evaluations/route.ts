import { NextRequest, NextResponse } from 'next/server';
import { verifyUserAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - 获取所有课程评价
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    // 获取当前用户的所有课程评价
    const userEvaluations = await prisma.courseEvaluation.findMany({
      where: {
        userId: authResult.userId
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
            instructor: true
          }
        },
        user: {
          select: {
            id: true,
            displayName: true,
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 获取情侣的共享评价（如果存在情侣关系）
    const user = await prisma.user.findUnique({
      where: { id: authResult.userId },
      include: {
        couple: {
          include: {
            users: {
              where: {
                id: { not: authResult.userId }
              },
              select: {
                id: true,
                displayName: true,
                username: true
              }
            }
          }
        }
      }
    });

    let partnerEvaluations: any[] = [];
    if (user?.couple?.users.length) {
      const partnerId = user.couple.users[0].id;
      
      // 获取情侣的共享评价
      partnerEvaluations = await prisma.courseEvaluation.findMany({
        where: {
          userId: partnerId,
          isShared: true
        },
        include: {
          course: {
            select: {
              id: true,
              name: true,
              code: true,
              instructor: true
            }
          },
          user: {
            select: {
              id: true,
              displayName: true,
              username: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }

    // 合并所有评价
    const allEvaluations = [...userEvaluations, ...partnerEvaluations];

    return NextResponse.json({
      evaluations: allEvaluations,
      userEvaluations,
      partnerEvaluations
    });
  } catch (error) {
    console.error('获取课程评价失败:', error);
    return NextResponse.json(
      { error: '获取课程评价失败' },
      { status: 500 }
    );
  }
}