import { NextRequest, NextResponse } from 'next/server';
import { verifyUserAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// 课程更新的验证模式
const updateCourseSchema = z.object({
  name: z.string().min(1, '课程名称不能为空').optional(),
  code: z.string().optional(),
  instructor: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  credits: z.number().optional(),
  color: z.string().optional(),
  schedules: z.array(z.object({
    id: z.string().optional(), // 用于更新现有时间表
    dayOfWeek: z.number().min(1).max(7),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, '时间格式应为HH:mm'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, '时间格式应为HH:mm'),
    weeks: z.array(z.number()).default([])
  })).optional()
});

// GET - 获取单个课程详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const course = await prisma.course.findFirst({
      where: {
        id: params.id,
        userId: authResult.userId
      },
      include: {
        schedules: {
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' }
          ]
        },
        evaluations: {
          where: {
            userId: authResult.userId
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ error: '课程不存在' }, { status: 404 });
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error('获取课程详情失败:', error);
    return NextResponse.json(
      { error: '获取课程详情失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新课程
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    // 验证课程是否存在且属于当前用户
    const existingCourse = await prisma.course.findFirst({
      where: {
        id: params.id,
        userId: authResult.userId
      },
      include: {
        schedules: true
      }
    });

    if (!existingCourse) {
      return NextResponse.json({ error: '课程不存在' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateCourseSchema.parse(body);

    // 更新课程基本信息
    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.code !== undefined) updateData.code = validatedData.code;
    if (validatedData.instructor !== undefined) updateData.instructor = validatedData.instructor;
    if (validatedData.location !== undefined) updateData.location = validatedData.location;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.credits !== undefined) updateData.credits = validatedData.credits;
    if (validatedData.color !== undefined) updateData.color = validatedData.color;

    // 如果有时间表更新
    if (validatedData.schedules) {
      // 删除现有时间表
      await prisma.courseSchedule.deleteMany({
        where: {
          courseId: params.id
        }
      });

      // 创建新的时间表
      updateData.schedules = {
        create: validatedData.schedules.map(schedule => ({
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          weeks: JSON.stringify(schedule.weeks)
        }))
      };
    }

    const updatedCourse = await prisma.course.update({
      where: {
        id: params.id
      },
      data: updateData,
      include: {
        schedules: {
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' }
          ]
        }
      }
    });

    return NextResponse.json({ course: updatedCourse });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '数据验证失败', details: error.errors },
        { status: 400 }
      );
    }

    console.error('更新课程失败:', error);
    return NextResponse.json(
      { error: '更新课程失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除课程
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    // 验证课程是否存在且属于当前用户
    const existingCourse = await prisma.course.findFirst({
      where: {
        id: params.id,
        userId: authResult.userId
      }
    });

    if (!existingCourse) {
      return NextResponse.json({ error: '课程不存在' }, { status: 404 });
    }

    // 删除课程（级联删除时间表和评价）
    await prisma.course.delete({
      where: {
        id: params.id
      }
    });

    return NextResponse.json({ message: '课程删除成功' });
  } catch (error) {
    console.error('删除课程失败:', error);
    return NextResponse.json(
      { error: '删除课程失败' },
      { status: 500 }
    );
  }
}