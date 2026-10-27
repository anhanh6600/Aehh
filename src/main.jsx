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

const firebaseConfig = {
  apiKey: "AIzaSyD-Placeholder-Key-DatingApp",
  authDomain: "dating-app-web.firebaseapp.com",
  projectId: "dating-app-web",
  storageBucket: "dating-app-web.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
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
    if (currentTab === 'chat') {
      const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubscribe();
    }
  }, [currentTab]);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      alert("Lỗi xác thực: " + error.message);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      alert("Lỗi đăng nhập Google: " + error.message);
    }
  };

  const handleSwipe = (direction) => {
    if (direction === 'right') {
      setMatches(prev => [...prev, profiles[currentIndex]]);
    }
    setCurrentIndex(prev => prev + 1);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    await addDoc(collection(db, 'messages'), {
      text: newMessage,
      uid: user.uid,
      email: user.email || 'Thành viên',
      createdAt: serverTimestamp()
    });
    setNewMessage('');
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-rose-500 font-bold">Đang tải ứng dụng...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex justify-center mb-6 text-rose-500"><Flame size={48} /></div>
          <h1 className="text-2xl font-black text-center mb-2">Hẹn Hò & Nhắn Tin</h1>
          <p className="text-slate-400 text-center text-sm mb-6">Kết nối yêu thương trong tầm tay</p>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="email" placeholder="Email của bạn" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-rose-500" required />
            <input type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-rose-500" required />
            <button type="submit" className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:opacity-90 transition">{isRegister ? 'Đăng ký tài khoản' : 'Đăng nhập ngay'}</button>
          </form>

          <button onClick={handleGoogleLogin} className="w-full mt-3 bg-white text-slate-900 font-semibold py-3 rounded-xl shadow hover:bg-slate-100 transition flex items-center justify-center gap-2 text-sm">Đăng nhập với Google</button>
          
          <div className="text-center mt-6">
            <button onClick={() => setIsRegister(!isRegister)} className="text-rose-400 text-xs hover:underline">{isRegister ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col max-w-md mx-auto relative pb-20">
      <header className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950 sticky top-0 z-10">
        <div className="flex items-center gap-2 text-rose-500 font-black text-lg"><Flame /><span>Aehh Dating</span></div>
        <button onClick={() => signOut(auth)} className="text-slate-400 hover:text-white"><LogOut size={20} /></button>
      </header>

      <main className="flex-1 p-4 flex flex-col items-center justify-center">
        {currentTab === 'swipe' && (
          currentIndex < profiles.length ? (
            <div className="w-full max-w-xs bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-xl">
              <img src={profiles[currentIndex].image} alt="Profile" className="w-full h-80 object-cover" />
              <div className="p-5">
                <h2 className="text-xl font-bold">{profiles[currentIndex].name}, {profiles[currentIndex].age}</h2>
                <p className="text-slate-400 text-sm mt-2">{profiles[currentIndex].bio}</p>
                <div className="flex justify-around mt-6">
                  <button onClick={() => handleSwipe('left')} className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center text-red-400 border border-slate-700 text-xl font-bold shadow">✕</button>
                  <button onClick={() => handleSwipe('right')} className="w-14 h-14 bg-rose-500 rounded-full flex items-center justify-center text-white text-xl shadow-lg">❤️</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-6 text-slate-400">Đã xem hết hồ sơ quanh đây! Hãy quay lại sau nhé.</div>
          )
        )}

        {currentTab === 'matches' && (
          <div className="w-full">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Sparkles className="text-rose-500" /> Danh sách tương hợp</h2>
            {matches.length === 0 ? <p className="text-slate-500 text-sm">Chưa có lượt thích nào. Hãy quẹt phải thêm nhé!</p> : (
              <div className="grid grid-cols-2 gap-4">
                {matches.map(m => (
                  <div key={m.id} className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
                    <img src={m.image} alt={m.name} className="w-full h-32 object-cover" />
                    <div className="p-3"><h3 className="font-bold text-sm">{m.name}</h3></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentTab === 'chat' && (
          <div className="w-full flex flex-col h-[75vh]">
            <h2 className="text-lg font-bold mb-3">Phòng Nhắn Tin Chung</h2>
            <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 p-4 overflow-y-auto space-y-3 mb-3">
              {messages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.uid === user.uid ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-slate-500 mb-1">{msg.email}</span>
                  <div className={`px-4 py-2 rounded-2xl text-sm max-w-[80%] ${msg.uid === user.uid ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-200'}`}>{msg.text}</div>
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} className="flex gap-2">
              <input type="text" placeholder="Nhập tin nhắn..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-rose-500" />
              <button type="submit" className="bg-rose-500 text-white px-5 rounded-xl flex items-center justify-center shadow"><Send size={18} /></button>
            </form>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-950 border-t border-slate-900 flex justify-around py-3 z-20">
        <button onClick={() => setCurrentTab('swipe')} className={`flex flex-col items-center ${currentTab === 'swipe' ? 'text-rose-500' : 'text-slate-500'} text-xs gap-1`}><Flame size={22} />Khám phá</button>
        <button onClick={() => setCurrentTab('matches')} className={`flex flex-col items-center ${currentTab === 'matches' ? 'text-rose-500' : 'text-slate-500'} text-xs gap-1`}><Heart size={22} />Tương hợp</button>
        <button onClick={() => setCurrentTab('chat')} className={`flex flex-col items-center ${currentTab === 'chat' ? 'text-rose-500' : 'text-slate-500'} text-xs gap-1`}><MessageCircle size={22} />Nhắn tin</button>
      </nav>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
