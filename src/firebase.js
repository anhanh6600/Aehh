import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDY7mpeXKj5UgrEEKyMZcjL_W9XFZHYLwc",
  authDomain: "nguyen-anh-d9f91.firebaseapp.com",
  projectId: "nguyen-anh-d9f91",
  storageBucket: "nguyen-anh-d9f91.firebasestorage.app",
  messagingSenderId: "48825173466",
  appId: "1:48825173466:web:d0dce6896a574573642ce3",
  measurementId: "G-JPJ28V5WSV"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
