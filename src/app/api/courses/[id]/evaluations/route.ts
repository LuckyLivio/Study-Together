import { NextRequest, NextResponse } from 'next/server';
import { verifyUserAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// 课程评价的验证模式
const evaluationSchema = z.object({
  rating: z.number().min(1).max(5, '评分必须在1-5之间'),
  difficulty: z.number().min(1).max(5, '难度必须在1-5之间'),
  workload: z.number().min(1).max(5, '工作量必须在1-5之间'),
  comment: z.string().optional(),
  isRecommended: z.boolean().default(true),
  isShared: z.boolean().default(false)
});

// GET - 获取课程的所有评价
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    // 验证课程是否存在
    const course = await prisma.course.findFirst({
      where: {
        id: params.id,
        userId: authResult.userId
      }
    });

    if (!course) {
      return NextResponse.json({ error: '课程不存在' }, { status: 404 });
    }

    // 获取当前用户的评价
    const userEvaluation = await prisma.courseEvaluation.findUnique({
      where: {
        courseId_userId: {
          courseId: params.id,
          userId: authResult.userId
        }
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatar: true
          }
        }
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
                avatar: true
              }
            }
          }
        }
      }
    });

    let partnerEvaluations: any[] = [];
    if (user?.couple?.users.length) {
      const partnerId = user.couple.users[0].id;
      
      // 查找情侣对相同课程名称的评价（共享的）
      const partnerCourses = await prisma.course.findMany({
        where: {
          userId: partnerId,
          name: course.name // 匹配课程名称
        },
        include: {
          evaluations: {
            where: {
              userId: partnerId,
              isShared: true
            },
            include: {
              user: {
                select: {
                  id: true,
                  displayName: true,
                  avatar: true
                }
              }
            }
          }
        }
      });

      partnerEvaluations = partnerCourses.flatMap(c => c.evaluations);
    }

    return NextResponse.json({
      userEvaluation,
      partnerEvaluations,
      course: {
        id: course.id,
        name: course.name,
        code: course.code
      }
    });
  } catch (error) {
    console.error('获取课程评价失败:', error);
    return NextResponse.json(
      { error: '获取课程评价失败' },
      { status: 500 }
    );
  }
}

// POST - 创建或更新课程评价
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    // 验证课程是否存在且属于当前用户
    const course = await prisma.course.findFirst({
      where: {
        id: params.id,
        userId: authResult.userId
      }
    });

    if (!course) {
      return NextResponse.json({ error: '课程不存在' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = evaluationSchema.parse(body);

    // 使用 upsert 创建或更新评价
    const evaluation = await prisma.courseEvaluation.upsert({
      where: {
        courseId_userId: {
          courseId: params.id,
          userId: authResult.userId
        }
      },
      update: {
        rating: validatedData.rating,
        difficulty: validatedData.difficulty,
        workload: validatedData.workload,
        comment: validatedData.comment,
        isRecommended: validatedData.isRecommended,
        isShared: validatedData.isShared
      },
      create: {
        courseId: params.id,
        userId: authResult.userId,
        rating: validatedData.rating,
        difficulty: validatedData.difficulty,
        workload: validatedData.workload,
        comment: validatedData.comment,
        isRecommended: validatedData.isRecommended,
        isShared: validatedData.isShared
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatar: true
          }
        },
        course: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    return NextResponse.json({ evaluation }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '数据验证失败', details: error.errors },
        { status: 400 }
      );
    }

    console.error('创建/更新课程评价失败:', error);
    return NextResponse.json(
      { error: '创建/更新课程评价失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除课程评价
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    // 验证评价是否存在且属于当前用户
    const evaluation = await prisma.courseEvaluation.findUnique({
      where: {
        courseId_userId: {
          courseId: params.id,
          userId: authResult.userId
        }
      }
    });

    if (!evaluation) {
      return NextResponse.json({ error: '评价不存在' }, { status: 404 });
    }

    // 删除评价
    await prisma.courseEvaluation.delete({
      where: {
        courseId_userId: {
          courseId: params.id,
          userId: authResult.userId
        }
      }
    });

    return NextResponse.json({ message: '评价删除成功' });
  } catch (error) {
    console.error('删除课程评价失败:', error);
    return NextResponse.json(
      { error: '删除课程评价失败' },
      { status: 500 }
    );
  }
}