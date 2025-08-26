import { NextRequest, NextResponse } from 'next/server';
import { verifyUserAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// 时间转换为分钟数的辅助函数
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// 分钟数转换为时间字符串的辅助函数
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// 检查两个时间段是否重叠
function isTimeOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number
): boolean {
  return start1 < end2 && start2 < end1;
}

// 计算单日空闲时间段
function calculateDayFreeTime(
  userSchedules: Array<{ startTime: string; endTime: string }>,
  partnerSchedules: Array<{ startTime: string; endTime: string }>,
  dayStart: number = 8 * 60, // 8:00
  dayEnd: number = 22 * 60   // 22:00
): Array<{ startTime: string; endTime: string; duration: number }> {
  // 合并所有忙碌时间段
  const allBusyTimes = [
    ...userSchedules.map(s => ({
      start: timeToMinutes(s.startTime),
      end: timeToMinutes(s.endTime)
    })),
    ...partnerSchedules.map(s => ({
      start: timeToMinutes(s.startTime),
      end: timeToMinutes(s.endTime)
    }))
  ];

  // 按开始时间排序
  allBusyTimes.sort((a, b) => a.start - b.start);

  // 合并重叠的时间段
  const mergedBusyTimes: Array<{ start: number; end: number }> = [];
  for (const busyTime of allBusyTimes) {
    if (mergedBusyTimes.length === 0) {
      mergedBusyTimes.push(busyTime);
    } else {
      const last = mergedBusyTimes[mergedBusyTimes.length - 1];
      if (busyTime.start <= last.end) {
        // 重叠，合并
        last.end = Math.max(last.end, busyTime.end);
      } else {
        // 不重叠，添加新的时间段
        mergedBusyTimes.push(busyTime);
      }
    }
  }

  // 计算空闲时间段
  const freeTimeSlots: Array<{ startTime: string; endTime: string; duration: number }> = [];
  
  // 检查一天开始到第一个忙碌时间段之间的空闲时间
  if (mergedBusyTimes.length === 0) {
    // 整天都空闲
    const duration = dayEnd - dayStart;
    if (duration > 0) {
      freeTimeSlots.push({
        startTime: minutesToTime(dayStart),
        endTime: minutesToTime(dayEnd),
        duration
      });
    }
  } else {
    // 一天开始到第一个忙碌时间段
    if (mergedBusyTimes[0].start > dayStart) {
      const duration = mergedBusyTimes[0].start - dayStart;
      if (duration >= 30) { // 至少30分钟才算有效空闲时间
        freeTimeSlots.push({
          startTime: minutesToTime(dayStart),
          endTime: minutesToTime(mergedBusyTimes[0].start),
          duration
        });
      }
    }

    // 忙碌时间段之间的空闲时间
    for (let i = 0; i < mergedBusyTimes.length - 1; i++) {
      const currentEnd = mergedBusyTimes[i].end;
      const nextStart = mergedBusyTimes[i + 1].start;
      const duration = nextStart - currentEnd;
      
      if (duration >= 30) { // 至少30分钟才算有效空闲时间
        freeTimeSlots.push({
          startTime: minutesToTime(currentEnd),
          endTime: minutesToTime(nextStart),
          duration
        });
      }
    }

    // 最后一个忙碌时间段到一天结束
    const lastBusyEnd = mergedBusyTimes[mergedBusyTimes.length - 1].end;
    if (lastBusyEnd < dayEnd) {
      const duration = dayEnd - lastBusyEnd;
      if (duration >= 30) { // 至少30分钟才算有效空闲时间
        freeTimeSlots.push({
          startTime: minutesToTime(lastBusyEnd),
          endTime: minutesToTime(dayEnd),
          duration
        });
      }
    }
  }

  return freeTimeSlots;
}

// GET - 计算两人的空闲时间
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyUserAuth(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }

    // 获取当前用户信息和情侣关系
    const user = await prisma.user.findUnique({
      where: { id: authResult.userId },
      include: {
        couple: {
          include: {
            users: {
              where: {
                id: { not: authResult.userId }
              }
            }
          }
        }
      }
    });

    if (!user?.couple || !user.couple.users.length) {
      return NextResponse.json({ error: '未找到情侣关系' }, { status: 404 });
    }

    const partnerId = user.couple.users[0].id;

    // 获取两人的课程时间表
    const [userCourses, partnerCourses] = await Promise.all([
      prisma.course.findMany({
        where: { userId: authResult.userId },
        include: {
          schedules: true
        }
      }),
      prisma.course.findMany({
        where: { userId: partnerId },
        include: {
          schedules: true
        }
      })
    ]);

    // 按星期几分组计算空闲时间
    const weeklyFreeTime: Record<number, {
      dayName: string;
      freeTimeSlots: Array<{ startTime: string; endTime: string; duration: number }>;
      totalFreeTime: number;
    }> = {};
    const dayNames = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];

    for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek++) {
      // 获取当天的课程时间表
      const userDaySchedules = userCourses
        .flatMap(course => course.schedules)
        .filter(schedule => schedule.dayOfWeek === dayOfWeek)
        .map(schedule => ({
          startTime: schedule.startTime,
          endTime: schedule.endTime
        }));

      const partnerDaySchedules = partnerCourses
        .flatMap(course => course.schedules)
        .filter(schedule => schedule.dayOfWeek === dayOfWeek)
        .map(schedule => ({
          startTime: schedule.startTime,
          endTime: schedule.endTime
        }));

      // 计算当天的空闲时间
      const dayFreeTime = calculateDayFreeTime(userDaySchedules, partnerDaySchedules);
      
      weeklyFreeTime[dayOfWeek] = {
        dayName: dayNames[dayOfWeek],
        freeTimeSlots: dayFreeTime,
        totalFreeTime: dayFreeTime.reduce((sum, slot) => sum + slot.duration, 0)
      };
    }

    // 保存计算结果到数据库
    await prisma.freeTimeSlot.deleteMany({
      where: { coupleId: user.couple.id }
    });

    const freeTimeSlots = Object.entries(weeklyFreeTime)
      .flatMap(([dayOfWeek, dayData]) => 
        dayData.freeTimeSlots.map((slot: any) => ({
          coupleId: user.couple!.id,
          dayOfWeek: parseInt(dayOfWeek),
          startTime: slot.startTime,
          endTime: slot.endTime,
          duration: slot.duration
        }))
      );

    if (freeTimeSlots.length > 0) {
      await prisma.freeTimeSlot.createMany({
        data: freeTimeSlots
      });
    }

    // 计算总体统计
    const totalWeeklyFreeTime = Object.values(weeklyFreeTime)
      .reduce((sum, day) => sum + day.totalFreeTime, 0);

    const averageDailyFreeTime = totalWeeklyFreeTime / 7;

    return NextResponse.json({
      weeklyFreeTime,
      statistics: {
        totalWeeklyFreeTime,
        averageDailyFreeTime,
        totalFreeSlots: freeTimeSlots.length
      },
      couple: {
        id: user.couple.id,
        users: [
          {
            id: user.id,
            displayName: user.displayName,
            courseCount: userCourses.length
          },
          {
            id: partnerId,
            displayName: user.couple.users[0].displayName,
            courseCount: partnerCourses.length
          }
        ]
      }
    });
  } catch (error) {
    console.error('计算空闲时间失败:', error);
    return NextResponse.json(
      { error: '计算空闲时间失败' },
      { status: 500 }
    );
  }
}