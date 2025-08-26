import { PrismaClient } from '../src/generated/prisma/index.js';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始初始化数据库...');

  // 1. 创建安全设置
  console.log('📋 创建安全设置...');
  const securitySettings = await prisma.securitySettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      maxLoginAttempts: 5,
      lockoutDuration: 15,
      sessionTimeout: 60,
      requireTwoFactor: false,
      allowedIPs: '', // SQLite不支持数组，使用空字符串
      passwordMinLength: 8,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumbers: true,
      passwordRequireSpecialChars: false,
      passwordMaxAge: 90,
    },
  });
  console.log('✅ 安全设置创建完成');

  // 2. 创建站点设置
  console.log('⚙️ 创建站点设置...');
  const siteSettings = [
    {
      key: 'maintenance',
      value: JSON.stringify({
        enabled: false,
        message: '系统维护中，请稍后再试',
        startTime: null,
        endTime: null,
      }),
    },
    {
      key: 'theme',
      value: JSON.stringify({
        primaryColor: '#3b82f6',
        secondaryColor: '#8b5cf6',
        darkMode: false,
      }),
    },
    {
      key: 'features',
      value: JSON.stringify({
        aiChat: true,
        messageWall: true,
        studyPlanner: true,
        coupleMode: true,
      }),
    },
    {
      key: 'limits',
      value: JSON.stringify({
        maxMessagesPerDay: 100,
        maxFileSize: 10485760, // 10MB
        maxCoupleInvites: 5,
      }),
    },
  ];

  for (const setting of siteSettings) {
    await prisma.siteSettings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log('✅ 站点设置创建完成');

  // 3. 创建测试用户
  console.log('👥 创建测试用户...');
  const users = [
    {
      username: 'admin',
      email: 'admin@studytogether.com',
      displayName: '系统管理员',
      password: 'admin123',
      role: 'ADMIN' as const,
      status: 'ACTIVE' as const,
      gender: 'OTHER' as const,
      isAdmin: true,
      bio: '系统管理员账户',
    },
    {
      username: 'alice',
      email: 'alice@example.com',
      displayName: '爱丽丝',
      password: 'user123',
      role: 'USER' as const,
      status: 'ACTIVE' as const,
      gender: 'FEMALE' as const,
      bio: '热爱学习的女孩子 📚',
    },
    {
      username: 'bob',
      email: 'bob@example.com',
      displayName: '鲍勃',
      password: 'user123',
      role: 'USER' as const,
      status: 'ACTIVE' as const,
      gender: 'MALE' as const,
      bio: '努力奋斗的程序员 💻',
    },
    {
      username: 'charlie',
      email: 'charlie@example.com',
      displayName: '查理',
      password: 'user123',
      role: 'USER' as const,
      status: 'ACTIVE' as const,
      gender: 'MALE' as const,
      bio: '考研党，目标985 🎯',
    },
    {
      username: 'diana',
      email: 'diana@example.com',
      displayName: '黛安娜',
      password: 'user123',
      role: 'USER' as const,
      status: 'ACTIVE' as const,
      gender: 'FEMALE' as const,
      bio: '准备出国留学 ✈️',
    },
    {
      username: 'moderator',
      email: 'mod@example.com',
      displayName: '版主小助手',
      password: 'mod123',
      role: 'MODERATOR' as const,
      status: 'ACTIVE' as const,
      gender: 'OTHER' as const,
      bio: '维护社区秩序的小助手',
    },
  ];

  const createdUsers = [];
  for (const userData of users) {
    const existingUser = await prisma.user.findUnique({
      where: { username: userData.username },
    });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
        },
      });
      createdUsers.push(user);
      console.log(`✅ 创建用户: ${userData.username}`);
    } else {
      createdUsers.push(existingUser);
      console.log(`ℹ️ 用户已存在: ${userData.username}`);
    }
  }

  // 4. 创建情侣关系
  console.log('💕 创建情侣关系...');
  const alice = createdUsers.find(u => u.username === 'alice');
  const bob = createdUsers.find(u => u.username === 'bob');

  if (alice && bob && !alice.coupleId && !bob.coupleId) {
    const couple = await prisma.couple.create({
      data: {
        name: 'Alice & Bob',
        inviteCode: 'ALICE-BOB-2024',
        person1Id: alice.id,
        person1Name: alice.displayName,
        person2Id: bob.id,
        person2Name: bob.displayName,
        isComplete: true,
      },
    });

    // 更新用户的情侣关系
    await prisma.user.update({
      where: { id: alice.id },
      data: { coupleId: couple.id },
    });
    await prisma.user.update({
      where: { id: bob.id },
      data: { coupleId: couple.id },
    });
    console.log('✅ 创建情侣关系: Alice & Bob');
  }

  // 5. 创建学习目标
  console.log('🎯 创建学习目标...');
  const studyGoals = [
    {
      userId: alice?.id,
      title: '考研英语',
      description: '目标英语一80分以上',
      targetDate: new Date('2024-12-21'),
    },
    {
      userId: bob?.id,
      title: '前端技能提升',
      description: '掌握React、Vue、TypeScript',
      targetDate: new Date('2024-06-30'),
    },
    {
      userId: createdUsers.find(u => u.username === 'charlie')?.id,
      title: '考研数学',
      description: '数学一目标130分',
      targetDate: new Date('2024-12-21'),
    },
  ];

  for (const goal of studyGoals) {
    if (goal.userId) {
      await prisma.studyGoal.create({ 
        data: {
          userId: goal.userId,
          title: goal.title,
          description: goal.description,
          targetDate: goal.targetDate,
        }
      });
    }
  }
  console.log('✅ 学习目标创建完成');

  // 6. 创建学习计划
  console.log('📅 创建学习计划...');
  if (alice) {
    const studyPlan = await prisma.studyPlan.create({
      data: {
        userId: alice.id,
        title: '今日英语学习',
        description: '单词背诵 + 阅读理解练习',
        planDate: new Date(),
      },
    });

    // 创建学习任务
    const tasks = [
      {
        planId: studyPlan.id,
        title: '背诵单词',
        description: '背诵100个新单词',
        taskType: 'READING' as const,
        duration: 60,
      },
      {
        planId: studyPlan.id,
        title: '阅读理解练习',
        description: '完成3篇阅读理解',
        taskType: 'EXERCISE' as const,
        duration: 90,
      },
    ];

    for (const task of tasks) {
      await prisma.studyTask.create({ data: task });
    }
  }
  console.log('✅ 学习计划创建完成');

  // 7. 创建留言墙消息
  console.log('💌 创建留言墙消息...');
  if (alice && bob) {
    const messages = [
      {
        senderId: alice.id,
        receiverId: bob.id,
        content: '今天的学习计划完成了！你呢？ 💪',
        messageType: 'TEXT' as const,
        visibility: 'PRIVATE' as const,
      },
      {
        senderId: bob.id,
        receiverId: alice.id,
        content: '我也完成了！明天一起加油！ 🔥',
        messageType: 'TEXT' as const,
        visibility: 'PRIVATE' as const,
      },
      {
        senderId: createdUsers.find(u => u.username === 'charlie')?.id || alice.id,
        receiverId: alice.id,
        content: '学习路上不孤单，大家一起努力！ 📚✨',
        messageType: 'TEXT' as const,
        visibility: 'PUBLIC' as const,
      },
    ];

    for (const message of messages) {
      await prisma.messageWallPost.create({ data: message });
    }
  }
  console.log('✅ 留言墙消息创建完成');

  // 8. 创建示例聊天对话
  console.log('💬 创建示例聊天对话...');
  if (alice) {
    const conversation = await prisma.chatConversation.create({
      data: {
        userId: alice.id,
        title: '学习计划咨询',
      },
    });

    const chatMessages = [
      {
        conversationId: conversation.id,
        userId: alice.id,
        role: 'user',
        content: '你好，我想制定一个考研英语的学习计划',
      },
      {
        conversationId: conversation.id,
        userId: alice.id,
        role: 'assistant',
        content: '你好！我很乐意帮你制定考研英语学习计划。首先，请告诉我你的英语基础如何？目标分数是多少？距离考试还有多长时间？',
      },
    ];

    for (const msg of chatMessages) {
      await prisma.chatMessage.create({ data: msg });
    }
  }
  console.log('✅ 示例聊天对话创建完成');

  // 9. 创建课程表数据
  console.log('📚 创建课程表数据...');
  if (alice && bob) {
    // 为Alice创建课程
    const aliceCourses = [
      {
        userId: alice.id,
        name: '高等数学',
        code: 'MATH101',
        instructor: '张教授',
        location: '教学楼A101',
        description: '微积分基础课程',
        credits: 4.0,
        color: '#3B82F6',
      },
      {
        userId: alice.id,
        name: '英语听说',
        code: 'ENG201',
        instructor: '李老师',
        location: '语音室B203',
        description: '英语口语和听力训练',
        credits: 2.0,
        color: '#10B981',
      },
      {
        userId: alice.id,
        name: '计算机基础',
        code: 'CS101',
        instructor: '王教授',
        location: '机房C301',
        description: '计算机科学导论',
        credits: 3.0,
        color: '#F59E0B',
      },
    ];

    // 为Bob创建课程
    const bobCourses = [
      {
        userId: bob.id,
        name: '高等数学',
        code: 'MATH101',
        instructor: '张教授',
        location: '教学楼A101',
        description: '微积分基础课程',
        credits: 4.0,
        color: '#3B82F6',
      },
      {
        userId: bob.id,
        name: '物理学',
        code: 'PHY101',
        instructor: '赵教授',
        location: '实验楼D201',
        description: '大学物理基础',
        credits: 4.0,
        color: '#8B5CF6',
      },
      {
        userId: bob.id,
        name: '程序设计',
        code: 'CS102',
        instructor: '刘老师',
        location: '机房C302',
        description: 'Python程序设计',
        credits: 3.0,
        color: '#EF4444',
      },
    ];

    const allCourses = [...aliceCourses, ...bobCourses];
    const createdCourses = [];

    for (const course of allCourses) {
      const createdCourse = await prisma.course.create({ data: course });
      createdCourses.push(createdCourse);
    }

    // 创建课程时间表
    const schedules = [
      // Alice的高等数学 - 周一、周三 8:00-9:40
      {
        courseId: createdCourses[0].id,
        dayOfWeek: 1, // 周一
        startTime: '08:00',
        endTime: '09:40',
        weeks: JSON.stringify([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]),
      },
      {
        courseId: createdCourses[0].id,
        dayOfWeek: 3, // 周三
        startTime: '08:00',
        endTime: '09:40',
        weeks: JSON.stringify([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]),
      },
      // Alice的英语听说 - 周二、周四 10:00-11:40
      {
        courseId: createdCourses[1].id,
        dayOfWeek: 2, // 周二
        startTime: '10:00',
        endTime: '11:40',
        weeks: JSON.stringify([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]),
      },
      {
        courseId: createdCourses[1].id,
        dayOfWeek: 4, // 周四
        startTime: '10:00',
        endTime: '11:40',
        weeks: JSON.stringify([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]),
      },
      // Alice的计算机基础 - 周五 14:00-16:40
      {
        courseId: createdCourses[2].id,
        dayOfWeek: 5, // 周五
        startTime: '14:00',
        endTime: '16:40',
        weeks: JSON.stringify([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]),
      },
      // Bob的高等数学 - 周一、周三 8:00-9:40 (与Alice相同)
      {
        courseId: createdCourses[3].id,
        dayOfWeek: 1, // 周一
        startTime: '08:00',
        endTime: '09:40',
        weeks: JSON.stringify([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]),
      },
      {
        courseId: createdCourses[3].id,
        dayOfWeek: 3, // 周三
        startTime: '08:00',
        endTime: '09:40',
        weeks: JSON.stringify([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]),
      },
      // Bob的物理学 - 周二、周四 14:00-15:40
      {
        courseId: createdCourses[4].id,
        dayOfWeek: 2, // 周二
        startTime: '14:00',
        endTime: '15:40',
        weeks: JSON.stringify([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]),
      },
      {
        courseId: createdCourses[4].id,
        dayOfWeek: 4, // 周四
        startTime: '14:00',
        endTime: '15:40',
        weeks: JSON.stringify([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]),
      },
      // Bob的程序设计 - 周五 10:00-12:40
      {
        courseId: createdCourses[5].id,
        dayOfWeek: 5, // 周五
        startTime: '10:00',
        endTime: '12:40',
        weeks: JSON.stringify([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]),
      },
    ];

    for (const schedule of schedules) {
      await prisma.courseSchedule.create({ data: schedule });
    }

    // 创建课程评价
    const evaluations = [
      {
        courseId: createdCourses[0].id, // Alice的高等数学
        userId: alice.id,
        rating: 4.5,
        difficulty: 4,
        workload: 4,
        comment: '张教授讲得很清楚，但是作业比较多，需要多练习',
        isRecommended: true,
        isShared: true,
      },
      {
        courseId: createdCourses[1].id, // Alice的英语听说
        userId: alice.id,
        rating: 4.0,
        difficulty: 2,
        workload: 2,
        comment: '李老师很有耐心，课堂氛围轻松，对提高口语很有帮助',
        isRecommended: true,
        isShared: true,
      },
      {
        courseId: createdCourses[3].id, // Bob的高等数学
        userId: bob.id,
        rating: 4.0,
        difficulty: 4,
        workload: 4,
        comment: '内容有一定难度，但是很有用，建议提前预习',
        isRecommended: true,
        isShared: true,
      },
      {
        courseId: createdCourses[5].id, // Bob的程序设计
        userId: bob.id,
        rating: 5.0,
        difficulty: 3,
        workload: 3,
        comment: '刘老师讲得非常好，实践性强，学到了很多实用技能',
        isRecommended: true,
        isShared: true,
      },
    ];

    for (const evaluation of evaluations) {
      await prisma.courseEvaluation.create({ data: evaluation });
    }
  }
  console.log('✅ 课程表数据创建完成');

  console.log('🎉 数据库初始化完成！');
  console.log('\n📊 初始化统计:');
  console.log(`👥 用户数量: ${await prisma.user.count()}`);
  console.log(`💕 情侣数量: ${await prisma.couple.count()}`);
  console.log(`🎯 学习目标: ${await prisma.studyGoal.count()}`);
  console.log(`📅 学习计划: ${await prisma.studyPlan.count()}`);
  console.log(`📝 学习任务: ${await prisma.studyTask.count()}`);
  console.log(`💌 留言数量: ${await prisma.messageWallPost.count()}`);
  console.log(`💬 聊天对话: ${await prisma.chatConversation.count()}`);
  console.log(`📚 课程数量: ${await prisma.course.count()}`);
  console.log(`📋 课程时间表: ${await prisma.courseSchedule.count()}`);
  console.log(`⭐ 课程评价: ${await prisma.courseEvaluation.count()}`);
  console.log(`⚙️ 站点设置: ${await prisma.siteSettings.count()}`);
}

main()
  .catch((e) => {
    console.error('❌ 数据库初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🔌 数据库连接已断开');
  });