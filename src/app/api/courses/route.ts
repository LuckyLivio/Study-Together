import { NextRequest, NextResponse } from 'next/server';
import { verifyUserAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// 课程创建/更新的验证模式
const courseSchema = z.object({
  name: z.string().min(1, '课程名称不能为空'),
  code: z.string().optional(),
  instructor: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  credits: z.number().optional(),
  color: z.string().default('#3B82F6'),
  schedules: z.array(z.object({
    dayOfWeek: z.number().min(1).max(7),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, '时间格式应为HH:mm'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, '时间格式应为HH:mm'),
    weeks: z.array(z.number()).default([])
  })).default([])
});

// GET - 获取用户的所有课程
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const courses = await prisma.course.findMany({
      where: {
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
        },
        _count: {
          select: {
            evaluations: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('获取课程列表失败:', error);
    return NextResponse.json(
      { error: '获取课程列表失败' },
      { status: 500 }
    );
  }
}

// POST - 创建新课程
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = courseSchema.parse(body);

    // 创建课程和时间表
    const course = await prisma.course.create({
      data: {
        userId: authResult.userId,
        name: validatedData.name,
        code: validatedData.code,
        instructor: validatedData.instructor,
        location: validatedData.location,
        description: validatedData.description,
        credits: validatedData.credits,
        color: validatedData.color,
        schedules: {
          create: validatedData.schedules.map(schedule => ({
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            weeks: JSON.stringify(schedule.weeks)
          }))
        }
      },
      include: {
        schedules: true
      }
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '数据验证失败', details: error.errors },
        { status: 400 }
      );
    }

    console.error('创建课程失败:', error);
    return NextResponse.json(
      { error: '创建课程失败' },
      { status: 500 }
    );
  }
}