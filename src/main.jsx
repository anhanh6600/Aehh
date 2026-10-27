import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { MessageCircle, Heart, LogOut, Send, Flame, Sparkles } from 'lucide-react';

if (!document.getElementById('tailwind-cdn')) {
  const style = document.createElement('script');
  style.id = 'tailwind-cdn';
  style.src = 'https://cdn.tailwindcss.com';
  document.head.appendChild(style);
}

// Cấu hình Firebase chính xác của bạn
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
const auth = getAuth(app);
const db = getFirestore(app);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [currentTab, setCurrentTab] = useState('swipe');
  
  const [profiles] = useState([
    { id: '1', name: 'Linh Chi', age: 22, bio: 'Thích xem phim, uống trà sữa và du lịch cuối tuần ✨', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60' },
    { id: '2', name: 'Phương Thảo', age: 24, bio: 'Tìm người cùng đi cà phê sách và nghe nhạc Jazz ☕', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=60' },
    { id: '3', name: 'Hoàng Anh', age: 25, bio: 'Yêu thể thao, thích chụp ảnh hoàng hôn 📸', image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=60' }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentTab === 'chat' && user) {
      const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubscribe();
    }
  }, [currentTab, user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Vui lòng nhập đầy đủ Email và Mật khẩu
