// src/config/firebase.ts
import * as admin from 'firebase-admin';
import { env } from './env';

// 初始化 Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.firebase.projectId,
      clientEmail: env.firebase.clientEmail,
      privateKey: env.firebase.privateKey
    })
  });
}

export const firebaseAdmin = admin;