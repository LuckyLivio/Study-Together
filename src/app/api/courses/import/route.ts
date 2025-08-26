import { NextRequest, NextResponse } from 'next/server';
import { verifyUserAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// CSV/Excel导入数据的验证模式
const importCourseSchema = z.object({
  name: z.string().min(1, '课程名称不能为空'),
  code: z.string().optional(),
  instructor: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  credits: z.union([z.string(), z.number()]).optional(),
  color: z.string().default('#3B82F6'),
  // 时间表信息
  dayOfWeek: z.union([z.string(), z.number()]).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  weeks: z.union([z.string(), z.array(z.number())]).optional()
});

// 解析星期几的辅助函数
function parseDayOfWeek(day: string | number): number {
  if (typeof day === 'number') {
    return day >= 1 && day <= 7 ? day : 1;
  }
  
  const dayMap: Record<string, number> = {
    '周一': 1, '星期一': 1, 'Monday': 1, 'Mon': 1, '1': 1,
    '周二': 2, '星期二': 2, 'Tuesday': 2, 'Tue': 2, '2': 2,
    '周三': 3, '星期三': 3, 'Wednesday': 3, 'Wed': 3, '3': 3,
    '周四': 4, '星期四': 4, 'Thursday': 4, 'Thu': 4, '4': 4,
    '周五': 5, '星期五': 5, 'Friday': 5, 'Fri': 5, '5': 5,
    '周六': 6, '星期六': 6, 'Saturday': 6, 'Sat': 6, '6': 6,
    '周日': 7, '星期日': 7, 'Sunday': 7, 'Sun': 7, '7': 7
  };
  
  return dayMap[day] || 1;
}

// 解析时间格式的辅助函数
function parseTime(time: string): string {
  if (!time) return '08:00';
  
  // 移除空格和中文字符
  const cleanTime = time.replace(/[^0-9:：]/g, '').replace('：', ':');
  
  // 匹配 HH:mm 格式
  const timeMatch = cleanTime.match(/^(\d{1,2}):(\d{2})$/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]).toString().padStart(2, '0');
    const minutes = timeMatch[2];
    return `${hours}:${minutes}`;
  }
  
  // 匹配纯数字格式 (如 830 表示 8:30)
  const numberMatch = cleanTime.match(/^(\d{3,4})$/);
  if (numberMatch) {
    const timeStr = numberMatch[1];
    if (timeStr.length === 3) {
      return `0${timeStr[0]}:${timeStr.slice(1)}`;
    } else if (timeStr.length === 4) {
      return `${timeStr.slice(0, 2)}:${timeStr.slice(2)}`;
    }
  }
  
  return '08:00'; // 默认值
}

// 解析周次的辅助函数
function parseWeeks(weeks: string | number[]): number[] {
  if (Array.isArray(weeks)) {
    return weeks;
  }
  
  if (!weeks || typeof weeks !== 'string') {
    return []; // 默认所有周次
  }
  
  const weekArray: number[] = [];
  
  // 解析类似 "1-16" 或 "1,3,5-8" 的格式
  const parts = weeks.split(',');
  
  for (const part of parts) {
    const trimmed = part.trim();
    
    if (trimmed.includes('-')) {
      // 范围格式 "1-16"
      const [start, end] = trimmed.split('-').map(s => parseInt(s.trim()));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          weekArray.push(i);
        }
      }
    } else {
      // 单个数字
      const week = parseInt(trimmed);
      if (!isNaN(week)) {
        weekArray.push(week);
      }
    }
  }
  
  return weekArray.length > 0 ? weekArray : [];
}

// POST - 导入课程数据
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    const body = await request.json();
    const { courses: rawCourses, replaceAll = false } = body;

    if (!Array.isArray(rawCourses) || rawCourses.length === 0) {
      return NextResponse.json(
        { error: '请提供有效的课程数据数组' },
        { status: 400 }
      );
    }

    // 如果选择替换所有课程，先删除现有课程
    if (replaceAll) {
      await prisma.course.deleteMany({
        where: {
          userId: authResult.userId
        }
      });
    }

    const importResults = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    // 处理每个课程
    for (let i = 0; i < rawCourses.length; i++) {
      try {
        const rawCourse = rawCourses[i];
        const validatedData = importCourseSchema.parse(rawCourse);

        // 转换数据类型
        const credits = validatedData.credits ? 
          (typeof validatedData.credits === 'string' ? 
            parseFloat(validatedData.credits) : validatedData.credits) : undefined;

        // 创建课程
        const courseData = {
          userId: authResult.userId,
          name: validatedData.name,
          code: validatedData.code,
          instructor: validatedData.instructor,
          location: validatedData.location,
          description: validatedData.description,
          credits: credits,
          color: validatedData.color
        };

        const course = await prisma.course.create({
          data: courseData
        });

        // 如果有时间表信息，创建时间表
        if (validatedData.dayOfWeek && validatedData.startTime && validatedData.endTime) {
          const dayOfWeek = parseDayOfWeek(validatedData.dayOfWeek);
          const startTime = parseTime(validatedData.startTime);
          const endTime = parseTime(validatedData.endTime);
          const weeks = parseWeeks(validatedData.weeks || []);

          await prisma.courseSchedule.create({
            data: {
              courseId: course.id,
              dayOfWeek,
              startTime,
              endTime,
              weeks: JSON.stringify(weeks)
            }
          });
        }

        importResults.success++;
      } catch (error) {
        importResults.failed++;
        const errorMsg = error instanceof z.ZodError ? 
          `第${i + 1}行数据验证失败: ${error.errors.map(e => e.message).join(', ')}` :
          `第${i + 1}行导入失败: ${error instanceof Error ? error.message : '未知错误'}`;
        importResults.errors.push(errorMsg);
        console.error(`导入第${i + 1}行课程失败:`, error);
      }
    }

    return NextResponse.json({
      message: '课程导入完成',
      results: importResults
    }, { status: 200 });
  } catch (error) {
    console.error('导入课程失败:', error);
    return NextResponse.json(
      { error: '导入课程失败' },
      { status: 500 }
    );
  }
}

// GET - 获取导入模板
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    // 返回CSV导入模板
    const template = {
      headers: [
        'name',        // 课程名称 (必填)
        'code',        // 课程代码
        'instructor',  // 授课教师
        'location',    // 上课地点
        'description', // 课程描述
        'credits',     // 学分
        'color',       // 课程颜色
        'dayOfWeek',   // 星期几 (1-7 或 周一-周日)
        'startTime',   // 开始时间 (HH:mm)
        'endTime',     // 结束时间 (HH:mm)
        'weeks'        // 上课周次 (如: 1-16 或 1,3,5-8)
      ],
      example: [
        {
          name: '高等数学',
          code: 'MATH101',
          instructor: '张教授',
          location: '教学楼A101',
          description: '微积分基础课程',
          credits: 4,
          color: '#3B82F6',
          dayOfWeek: '周一',
          startTime: '08:00',
          endTime: '09:40',
          weeks: '1-16'
        },
        {
          name: '大学英语',
          code: 'ENG101',
          instructor: '李老师',
          location: '外语楼201',
          description: '英语听说读写训练',
          credits: 3,
          color: '#10B981',
          dayOfWeek: 3,
          startTime: '10:00',
          endTime: '11:40',
          weeks: '1-18'
        }
      ],
      instructions: [
        '1. name (课程名称) 为必填字段',
        '2. dayOfWeek 可以是数字(1-7)或中文(周一-周日)或英文(Monday-Sunday)',
        '3. startTime 和 endTime 使用 HH:mm 格式，如 08:00',
        '4. weeks 支持范围格式(1-16)或列表格式(1,3,5-8)',
        '5. credits 可以是数字或字符串',
        '6. color 使用十六进制颜色代码，如 #3B82F6'
      ]
    };

    return NextResponse.json(template);
  } catch (error) {
    console.error('获取导入模板失败:', error);
    return NextResponse.json(
      { error: '获取导入模板失败' },
      { status: 500 }
    );
  }
}