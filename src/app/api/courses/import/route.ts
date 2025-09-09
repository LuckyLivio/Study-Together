import { NextRequest, NextResponse } from 'next/server';
import { verifyUserAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

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

    const contentType = request.headers.get('content-type') || '';
    let rawCourses: any[] = [];
    let replaceExisting = false;

    if (contentType.includes('multipart/form-data')) {
      // 处理文件上传
      const formData = await request.formData();
      const file = formData.get('file') as File;
      replaceExisting = formData.get('replaceExisting') === 'true';

      if (!file) {
        return NextResponse.json(
          { error: '请选择要导入的文件' },
          { status: 400 }
        );
      }

      const fileBuffer = await file.arrayBuffer();
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.csv')) {
        // 解析CSV文件
        const csvText = new TextDecoder().decode(fileBuffer);
        const parseResult = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim()
        });
        rawCourses = parseResult.data;
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // 解析Excel文件
        const workbook = XLSX.read(fileBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        rawCourses = XLSX.utils.sheet_to_json(worksheet);
      } else {
        return NextResponse.json(
          { error: '不支持的文件格式，请上传CSV或Excel文件' },
          { status: 400 }
        );
      }
    } else {
      // 处理JSON数据（文本导入）
      const body = await request.json();
      const { textData, replaceExisting: replace } = body;
      replaceExisting = replace || false;

      if (!textData || typeof textData !== 'string') {
        return NextResponse.json(
          { error: '请提供有效的文本数据' },
          { status: 400 }
        );
      }

      // 解析文本数据（CSV格式）
      const csvData = Papa.parse(textData, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => {
          // 转换中文列名到英文字段名
          const headerMap: Record<string, string> = {
            '课程名称': 'name',
            '星期': 'dayOfWeek',
            '开始时间': 'startTime',
            '结束时间': 'endTime',
            '地点': 'location',
            '教师': 'teacher',
            '学分': 'credits',
            '周次': 'weeks'
          };
          return headerMap[header] || header;
        }
      });
      const parseResult = csvData;

      if (parseResult.data.length === 0) {
        return NextResponse.json(
          { error: '文本数据为空' },
          { status: 400 }
        );
      }

      // 由于使用了header:true，数据已经是对象格式
      rawCourses = parseResult.data;
    }

    if (!Array.isArray(rawCourses) || rawCourses.length === 0) {
      return NextResponse.json(
        { error: '没有找到有效的课程数据' },
        { status: 400 }
      );
    }

    // 如果选择替换所有课程，先删除现有课程
    if (replaceExisting) {
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
      message: `课程导入完成，成功导入 ${importResults.success} 门课程${importResults.failed > 0 ? `，失败 ${importResults.failed} 门` : ''}`,
      importedCount: importResults.success,
      errors: importResults.errors
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

    // 创建CSV模板内容
    const headers = [
      'name',        // 课程名称 (必填)
      'code',        // 课程代码
      'instructor',  // 授课教师
      'location',    // 上课地点
      'credits',     // 学分
      'color',       // 课程颜色
      'dayOfWeek',   // 星期几 (1-7 或 周一-周日)
      'startTime',   // 开始时间 (HH:mm)
      'endTime',     // 结束时间 (HH:mm)
      'weeks'        // 上课周次 (如: 1-16 或 1,3,5-8)
    ];

    const exampleData = [
      [
        '高等数学',
        'MATH101',
        '张教授',
        '教学楼A101',
        '4',
        '#3B82F6',
        '1',
        '08:00',
        '09:40',
        '1-16'
      ],
      [
        '大学英语',
        'ENG101',
        '李老师',
        '外语楼201',
        '3',
        '#10B981',
        '3',
        '10:00',
        '11:40',
        '1-18'
      ]
    ];

    // 生成CSV内容
    const csvContent = Papa.unparse({
      fields: headers,
      data: exampleData
    });

    // 添加说明注释
    const instructions = [
      '# 课程导入模板说明：',
      '# 1. name (课程名称) 为必填字段',
      '# 2. dayOfWeek 可以是数字(1-7)，1=周一，7=周日',
      '# 3. startTime 和 endTime 使用 HH:mm 格式，如 08:00',
      '# 4. weeks 支持范围格式(1-16)或列表格式(1,3,5-8)',
      '# 5. credits 可以是数字',
      '# 6. color 使用十六进制颜色代码，如 #3B82F6',
      '# 请删除这些注释行后再导入',
      ''
    ].join('\n');

    const finalCsvContent = instructions + csvContent;

    // 返回CSV文件
    return new NextResponse(finalCsvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="course_import_template.csv"'
      }
    });
  } catch (error) {
    console.error('获取导入模板失败:', error);
    return NextResponse.json(
      { error: '获取导入模板失败' },
      { status: 500 }
    );
  }
}