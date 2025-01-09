// src/scripts/generateTestToken.ts
import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import '../config/firebase';

async function generateTestToken() {
  try {
    const uid = 'test-user-123';
    let userRecord;
    
    try {
      userRecord = await getAuth().getUser(uid);
    } catch (error) {
      // 用户不存在，创建新用户
      userRecord = await getAuth().createUser({
        uid,
        email: 'test@example.com',
        emailVerified: true
      });
    }

    // 设置自定义声明
    await getAuth().setCustomUserClaims(uid, {
      role: 'admin'
    });

    // 只生成 Custom Token
    const customToken = await getAuth().createCustomToken(uid);
    
    console.log('Custom Token Generated:');
    console.log(customToken);
    
    console.log('\nFor test.http:');
    console.log(`Authorization: Bearer ${customToken}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

generateTestToken();