import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  getDocs,
  collection, 
  addDoc, 
  setDoc,
  arrayUnion,
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { MessageCircle, Heart, LogOut, Send, Flame, User, Edit3, RefreshCw, Sparkles } from 'lucide-react';
import { auth, db } from './firebase';
import ProfileForm from './ProfileForm';

export default function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [currentTab, setCurrentTab] = useState('swipe');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // State Quẹt thẻ & Tương hợp
  const [feedProfiles, setFeedProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [matchedModalUser, setMatchedModalUser] = useState(null); // Popup khi match thành công
  const [matchesList, setMatchesList] = useState([]);

  // State Chat
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserProfile(currentUser.uid);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserProfile(data);
        await loadFeedAndMatches(uid, data.likes || [], data.passes || []);
      } else {
        setIsEditingProfile(true);
      }
    } catch (err) {
      console.error("Lỗi lấy hồ sơ:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadFeedAndMatches = async (currentUid, likes = [], passes = []) => {
    setLoadingProfiles(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const interactedSet = new Set([currentUid, ...likes, ...passes]);
      
      const availableProfiles = [];
      const matchedUsers = [];

      querySnapshot.forEach((docSnap) => {
        const otherId = docSnap.id;
        const otherData = docSnap.data();

        if (otherId === currentUid) return;

        // Kiểm tra nếu người kia nằm trong danh sách đã thích mình
        const otherLikes = otherData.likes || [];
        const isMutualMatch = likes.includes(otherId) && otherLikes.includes(currentUid);

        if (isMutualMatch) {
          matchedUsers.push({ id: otherId, ...otherData });
        }

        // Đưa vào danh sách quẹt thẻ nếu chưa tương tác
        if (!interactedSet.has(otherId)) {
          availableProfiles.push({ id: otherId, ...otherData });
        }
      });

      setFeedProfiles(availableProfiles);
      setMatchesList(matchedUsers);
      setCurrentIndex(0);
    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleSwipe = async (direction) => {
    if (!feedProfiles[currentIndex] || !user) return;

    const targetUser = feedProfiles[currentIndex];
    const userRef = doc(db, 'users', user.uid);

    try {
      if (direction === 'right') {
        // Cập nhật likes của mình trên Firestore
        await setDoc(userRef, {
          likes: arrayUnion(targetUser.id)
        }, { merge: true });

        const updatedLikes = [...(userProfile?.likes || []), targetUser.id];
        setUserProfile(prev => ({ ...prev, likes: updatedLikes }));

        // Kiểm tra xem đối phương đã thích mình chưa
        const targetDoc = await getDoc(doc(db, 'users', targetUser.id));
        if (targetDoc.exists()) {
          const targetData = targetDoc.data();
          if (targetData.likes && targetData.likes.includes(user.uid)) {
            // MATCH THÀNH CÔNG!
            setMatchedModalUser(targetUser);
            setMatchesList(prev => [...prev, targetUser]);
          }
        }
      } else {
        await setDoc(userRef, {
          passes: arrayUnion(targetUser.id)
        }, { merge: true });

        setUserProfile(prev => ({
          ...prev,
          passes: [...(prev?.passes || []), targetUser.id]
        }));
      }
    } catch (error) {
      console.error("Lỗi quẹt thẻ:", error);
    }

    setCurrentIndex(prev => prev + 1);
  };

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

  useEffect(() => {
    if (currentTab === 'chat' && user) {
      const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsubscribe();
    }
  }, [currentTab, user]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    await addDoc(collection(db, 'messages'), {
      text: newMessage,
      uid: user.uid,
      senderName: userProfile?.displayName || user.email,
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
          <h1 className="text-2xl font-black text-center mb-2">Aehh Dating</h1>
          <p className="text-slate-400 text-center text-sm mb-6">Kết nối yêu thương trong tầm tay</p>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="email" placeholder="Email của bạn" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-rose-500" required />
            <input type="password" placeholder="Mật khẩu (tối thiểu 6 ký tự)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-rose-500" required />
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

  if (isEditingProfile) {
    return (
      <ProfileForm 
        user={user} 
        userProfile={userProfile} 
        onComplete={(newProfile) => {
          setUserProfile(newProfile);
          setIsEditingProfile(false);
          loadFeedAndMatches(user.uid, newProfile.likes || [], newProfile.passes || []);
        }} 
        onCancel={() => setIsEditingProfile(false)} 
      />
    );
  }

  const currentCard = feedProfiles[currentIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col max-w-md mx-auto relative pb-20">
      {/* Popup thông báo Match thành công */}
      {matchedModalUser && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <Sparkles className="text-rose-500 mb-4 animate-bounce" size={48} />
          <h2 className="text-3xl font-black text-rose-500 mb-2">It's a Match!</h2>
          <p className="text-slate-300 text-sm mb-6">Bạn và {matchedModalUser.displayName} đã thích nhau.</p>
          <div className="flex gap-4 mb-8">
            <img src={userProfile?.photoURL} alt="You" className="w-24 h-24 rounded-full object-cover border-2 border-rose-500 shadow-xl" />
            <img src={matchedModalUser.photoURL} alt="Partner" className="w-24 h-24 rounded-full object-cover border-2 border-rose-500 shadow-xl" />
          </div>
          <button 
            onClick={() => { setMatchedModalUser(null); setCurrentTab('matches'); }}
            className="w-full max-w-xs bg-rose-500 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-rose-600 transition"
          >
            Xem danh sách tương hợp
          </button>
          <button 
            onClick={() => setMatchedModalUser(null)}
            className="mt-3 text-slate-400 text-xs hover:underline"
          >
            Tiếp tục quẹt thẻ
          </button>
        </div>
      )}

      <header className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950 sticky top-0 z-10">
        <div className="flex items-center gap-2 text-rose-500 font-black text-lg"><Flame /><span>Aehh Dating</span></div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsEditingProfile(true)} className="p-2 bg-slate-900 border border-slate-800 rounded-full text-slate-300 hover:text-white"><Edit3 size={18} /></button>
          <button onClick={() => signOut(auth)} className="text-slate-400 hover:text-white"><LogOut size={20} /></button>
        </div>
      </header>

      <main className="flex-1 p-4 flex flex-col items-center justify-center">
        {currentTab === 'swipe' && (
          loadingProfiles ? (
            <div className="text-slate-400 text-sm">Đang tìm kiếm hồ sơ...</div>
          ) : currentCard ? (
            <div className="w-full max-w-xs bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-xl">
              <img 
                src={currentCard.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60'} 
                alt="Profile" 
                className="w-full h-80 object-cover" 
              />
              <div className="p-5">
                <h2 className="text-xl font-bold">{currentCard.displayName || 'Thành viên'}, {currentCard.age || '??'}</h2>
                <p className="text-slate-400 text-sm mt-2 min-h-[40px]">{currentCard.bio || 'Chưa cập nhật tiểu sử.'}</p>
                <div className="flex justify-around mt-6">
                  <button 
                    onClick={() => handleSwipe('left')} 
                    className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center text-red-400 border border-slate-700 text-xl font-bold shadow hover:bg-slate-700 transition"
                  >
                    ✕
                  </button>
                  <button 
                    onClick={() => handleSwipe('right')} 
                    className="w-14 h-14 bg-rose-500 rounded-full flex items-center justify-center text-white text-xl shadow-lg hover:bg-rose-600 transition"
                  >
                    ❤️
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-6 text-slate-400 flex flex-col items-center gap-3">
              <p>Đã xem hết tất cả hồ sơ quanh đây!</p>
              <button 
                onClick={() => loadFeedAndMatches(user.uid, userProfile?.likes || [], userProfile?.passes || [])} 
                className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs text-rose-400 hover:text-rose-300"
              >
                <RefreshCw size={14} /> Tải lại danh sách
              </button>
            </div>
          )
        )}

        {currentTab === 'matches' && (
          <div className="w-full h-full flex flex-col">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Sparkles className="text-rose-500" /> Tương hợp của bạn ({matchesList.length})</h2>
            {matchesList.length === 0 ? (
              <div className="text-center text-slate-500 text-sm mt-10">Chưa có lượt tương hợp nào. Hãy quẹt phải tích cực hơn nhé!</div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {matchesList.map(m => (
                  <div key={m.id} className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow">
                    <img src={m.photoURL} alt={m.displayName} className="w-full h-36 object-cover" />
                    <div className="p-3">
                      <h3 className="font-bold text-sm">{m.displayName}, {m.age}</h3>
                      <button onClick={() => setCurrentTab('chat')} className="mt-2 w-full bg-rose-500 text-white text-xs py-1.5 rounded-lg font-semibold">Nhắn tin</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentTab === 'profile' && (
          <div className="w-full bg-slate-900 rounded-3xl p-6 border border-slate-800 text-center">
            <img src={userProfile?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500&auto=format&fit=crop&q=60'} alt="Avatar" className="w-28 h-28 rounded-full object-cover mx-auto mb-4 border-2 border-rose-500" />
            <h2 className="text-xl font-bold">{userProfile?.displayName || 'Thành viên'}, {userProfile?.age || '??'}</h2>
            <p className="text-xs text-rose-400 capitalize mt-1">Giới tính: {userProfile?.gender}</p>
            <p className="text-slate-400 text-sm mt-4 bg-slate-800/50 p-4 rounded-2xl border border-slate-800">{userProfile?.bio || 'Chưa cập nhật tiểu sử.'}</p>
            <button onClick={() => setIsEditingProfile(true)} className="mt-6 w-full bg-slate-800 text-rose-400 py-3 rounded-xl border border-slate-700 font-semibold text-sm">Chỉnh sửa thông tin</button>
          </div>
        )}

        {currentTab === 'chat' && (
          <div className="w-full flex flex-col h-[75vh]">
            <h2 className="text-lg font-bold mb-3">Phòng Nhắn Tin Chung</h2>
            <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 p-4 overflow-y-auto space-y-3 mb-3">
              {messages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.uid === user.uid ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-slate-500 mb-1">{msg.senderName || 'Thành viên'}</span>
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
