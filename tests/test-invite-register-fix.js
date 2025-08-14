const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();
const baseUrl = 'http://localhost:3000';

async function testInviteRegisterFix() {
  try {
    console.log('=== 测试邀请码注册功能修复 ===\n');
    
    // 1. 清理测试数据
    console.log('1. 清理测试数据...');
    const testUsers = await prisma.user.findMany({
      where: {
        OR: [
          { username: 'inviter_test' },
          { username: { startsWith: 'invitee_test_' } }
        ]
      }
    });
    
    for (const user of testUsers) {
      // 删除相关情侣记录
      await prisma.couple.deleteMany({
        where: {
          OR: [
            { person1Id: user.id },
            { person2Id: user.id }
          ]
        }
      });
      
      // 删除用户
      await prisma.user.delete({
        where: { id: user.id }
      });
    }
    console.log('✓ 测试数据已清理\n');
    
    // 2. 注册第一个用户（邀请者）
    console.log('2. 注册邀请者...');
    const inviterData = {
      name: 'inviter_test',
      email: 'inviter_test@example.com',
      password: 'password123',
      gender: 'male'
    };
    
    const inviterRegisterResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inviterData)
    });
    
    const inviterRegisterResult = await inviterRegisterResponse.json();
    if (!inviterRegisterResponse.ok) {
      console.error('邀请者注册失败:', inviterRegisterResult);
      return;
    }
    console.log('✓ 邀请者注册成功:', inviterData.name);
    
    // 获取邀请者的cookies
    const inviterCookies = inviterRegisterResponse.headers.get('set-cookie');
    
    // 3. 邀请者生成邀请码
    console.log('\n3. 生成邀请码...');
    const inviteResponse = await fetch(`${baseUrl}/api/couples/invite`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': inviterCookies || ''
      }
    });
    
    const inviteResult = await inviteResponse.json();
    if (!inviteResponse.ok) {
      console.error('生成邀请码失败:', inviteResult);
      return;
    }
    
    const inviteCode = inviteResult.couple.inviteCode;
    console.log('✓ 邀请码生成成功:', inviteCode);
    
    // 4. 使用邀请码注册新用户
    console.log('\n4. 使用邀请码注册新用户...');
    const timestamp = Date.now();
    const inviteeData = {
      name: `invitee_test_${timestamp}`,
      email: `invitee_test_${timestamp}@example.com`,
      password: 'password123',
      gender: 'female',
      inviteCode: inviteCode
    };
    
    const inviteeRegisterResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inviteeData)
    });
    
    const inviteeRegisterResult = await inviteeRegisterResponse.json();
    if (!inviteeRegisterResponse.ok) {
      console.error('被邀请者注册失败:', inviteeRegisterResult);
      return;
    }
    
    console.log('✓ 被邀请者注册成功:', inviteeData.name);
    console.log('✓ 注册响应消息:', inviteeRegisterResult.message);
    
    // 5. 验证情侣绑定结果
    console.log('\n5. 验证情侣绑定结果...');
    
    // 检查被邀请者的用户信息
    console.log('被邀请者信息:');
    console.log('  - 用户ID:', inviteeRegisterResult.user.id);
    console.log('  - 情侣ID:', inviteeRegisterResult.user.coupleId);
    console.log('  - 伴侣ID:', inviteeRegisterResult.user.partnerId);
    console.log('  - 伴侣姓名:', inviteeRegisterResult.user.partnerName);
    
    // 检查情侣记录
    if (inviteeRegisterResult.couple) {
      console.log('\n情侣记录:');
      console.log('  - 情侣ID:', inviteeRegisterResult.couple.id);
      console.log('  - 邀请码:', inviteeRegisterResult.couple.inviteCode);
      console.log('  - Person1:', inviteeRegisterResult.couple.person1Name, '(ID:', inviteeRegisterResult.couple.person1Id, ')');
      console.log('  - Person2:', inviteeRegisterResult.couple.person2Name, '(ID:', inviteeRegisterResult.couple.person2Id, ')');
      console.log('  - 是否完成:', inviteeRegisterResult.couple.isComplete);
    } else {
      console.log('❌ 没有返回情侣记录');
    }
    
    // 6. 验证数据库中的记录
    console.log('\n6. 验证数据库记录...');
    const dbCouple = await prisma.couple.findUnique({
      where: { inviteCode },
      include: { users: true }
    });
    
    if (dbCouple) {
      console.log('数据库中的情侣记录:');
      console.log('  - 情侣ID:', dbCouple.id);
      console.log('  - 邀请码:', dbCouple.inviteCode);
      console.log('  - Person1:', dbCouple.person1Name, '(ID:', dbCouple.person1Id, ')');
      console.log('  - Person2:', dbCouple.person2Name, '(ID:', dbCouple.person2Id, ')');
      console.log('  - 是否完成:', dbCouple.isComplete);
      console.log('  - 关联用户数量:', dbCouple.users.length);
      
      if (dbCouple.isComplete && dbCouple.person2Id && dbCouple.users.length === 2) {
        console.log('\n🎉 邀请码注册功能修复成功！');
        console.log('✓ 情侣绑定完成');
        console.log('✓ 两个用户都正确关联到情侣记录');
      } else {
        console.log('\n❌ 邀请码注册功能仍有问题');
        if (!dbCouple.isComplete) console.log('  - 情侣记录未标记为完成');
        if (!dbCouple.person2Id) console.log('  - Person2信息未正确设置');
        if (dbCouple.users.length !== 2) console.log('  - 用户关联数量不正确');
      }
    } else {
      console.log('❌ 数据库中找不到情侣记录');
    }
    
    // 7. 测试重复使用邀请码
    console.log('\n7. 测试重复使用邀请码...');
    const duplicateData = {
      name: `duplicate_test_${timestamp}`,
      email: `duplicate_test_${timestamp}@example.com`,
      password: 'password123',
      gender: 'other',
      inviteCode: inviteCode
    };
    
    const duplicateResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(duplicateData)
    });
    
    const duplicateResult = await duplicateResponse.json();
    if (!duplicateResponse.ok && duplicateResult.error === '该邀请码已被使用') {
      console.log('✓ 重复使用邀请码被正确拒绝');
    } else {
      console.log('❌ 重复使用邀请码检查失败:', duplicateResult);
    }
    
    console.log('\n=== 测试完成 ===');
    
  } catch (error) {
    console.error('测试失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testInviteRegisterFix();