import React, { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export default function ProfileForm({ user, userProfile, onComplete, onCancel }) {
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [age, setAge] = useState(userProfile?.age || '');
  const [gender, setGender] = useState(userProfile?.gender || 'nam');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || '');
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const profileData = {
        uid: user.uid,
        email: user.email,
        displayName,
        age: Number(age),
        gender,
        bio,
        photoURL: photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500&auto=format&fit=crop&q=60',
        updatedAt: serverTimestamp()
      };
      await setDoc(doc(db, 'users', user.uid), profileData, { merge: true });
      alert("Cập nhật hồ sơ thành công!");
      onComplete(profileData);
    } catch (error) {
      alert("Lỗi khi lưu hồ sơ: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 max-w-md mx-auto">
      <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-center mb-1 text-rose-500">Cập Nhật Hồ Sơ Cá Nhân</h2>
        <p className="text-xs text-slate-400 text-center mb-6">Thông tin này sẽ hiển thị khi người khác quẹt thẻ bạn</p>
        
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Tên hiển thị</label>
            <input type="text" placeholder="Ví dụ: Nguyễn Anh" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500" required />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1 block">Tuổi</label>
              <input type="number" placeholder="22" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500" required />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-400 mb-1 block">Giới tính</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-rose-500">
                <option value="nam">Nam</option>
                <option value="nu">Nữ</option>
                <option value="khac">Khác</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Đường dẫn Link Ảnh đại diện (URL)</label>
            <input type="url" placeholder="https://images.unsplash.com/..." value={photoURL} onChange={(e) => setPhotoURL(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500" />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">Giới thiệu ngắn (Bio)</label>
            <textarea placeholder="Sở thích, câu nói yêu thích..." value={bio} onChange={(e) => setBio(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-500 h-24" required />
          </div>

          <button type="submit" disabled={saving} className="w-full bg-rose-500 text-white font-semibold py-3 rounded-xl shadow-lg hover:bg-rose-600 transition">{saving ? 'Đang lưu...' : 'Lưu thông tin hồ sơ'}</button>
          {userProfile && (
            <button type="button" onClick={onCancel} className="w-full bg-slate-800 text-slate-400 text-sm py-2 rounded-xl mt-2">Hủy bỏ</button>
          )}
        </form>
      </div>
    </div>
  );
}
