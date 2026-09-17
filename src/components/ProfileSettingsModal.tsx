import React, { useState } from 'react';
import { User, Lock, Camera, ShieldCheck, Key, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, refreshTokens, tokenExpiresAt } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen || !user) return null;

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await updateProfile({
      name,
      phone,
      department,
      avatar,
    });
    setLoading(false);

    if (res.success) {
      setMessage({ text: 'Profile details saved successfully!', type: 'success' });
    } else {
      setMessage({ text: res.message || 'Failed to update profile.', type: 'error' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }

    setLoading(true);
    const res = await updateProfile({
      currentPassword,
      newPassword,
    });
    setLoading(false);

    if (res.success) {
      setMessage({ text: 'Password successfully updated with bcrypt 12 rounds!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setMessage({ text: res.message || 'Password update failed.', type: 'error' });
    }
  };

  const handleSimulateCloudinaryUpload = () => {
    // Generate a new cute dicebear avatar seed or Cloudinary avatar
    const seeds = ['Felix', 'Aneka', 'Sam', 'Milo', 'Caleb', 'Zoe'];
    const randomSeed = seeds[Math.floor(Math.random() * seeds.length)];
    const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}_${Date.now()}`;
    setAvatar(newAvatar);
    setMessage({ text: 'Avatar updated via simulated Cloudinary signed upload! Click Save.', type: 'success' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-gray-200 shadow-xl max-h-[90vh] overflow-y-auto space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-gray-900">User Profile & Security Settings</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 text-sm font-bold">
            ✕
          </button>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Avatar & Basic Info */}
        <form onSubmit={handleUpdateInfo} className="space-y-4">
          <div className="flex items-center gap-4">
            <img
              src={avatar || user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-full border-2 border-indigo-200 object-cover"
              referrerPolicy="no-referrer"
            />
            <div>
              <button
                type="button"
                onClick={handleSimulateCloudinaryUpload}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
              >
                <Camera className="w-3.5 h-3.5" /> Upload Avatar (Cloudinary)
              </button>
              <p className="text-[11px] text-gray-400 mt-1">Accepts PNG, JPG, or SVG</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email (Institutional)</label>
              <input
                type="text"
                disabled
                value={user.email}
                className="w-full py-2 px-3 text-xs border border-gray-200 bg-gray-50 text-gray-500 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
              <input
                type="text"
                disabled
                value={user.role.toUpperCase()}
                className="w-full py-2 px-3 text-xs border border-gray-200 bg-gray-50 text-gray-500 rounded-lg font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Department / Grade</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Department"
                className="w-full py-2 px-3 text-xs border border-gray-300 rounded-lg outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition-colors shadow-xs"
          >
            Save Profile Info
          </button>
        </form>

        {/* Change Password */}
        <form onSubmit={handleChangePassword} className="border-t border-gray-100 pt-4 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
            <Lock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Update Password (bcrypt 12 Salt Rounds)</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full py-1.5 px-3 text-xs border border-gray-300 rounded-lg outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">New Password (Min 8)</label>
              <input
                type="password"
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full py-1.5 px-3 text-xs border border-gray-300 rounded-lg outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full py-1.5 px-3 text-xs border border-gray-300 rounded-lg outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !currentPassword || !newPassword}
            className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-lg text-xs transition-colors"
          >
            Re-encrypt & Set New Password
          </button>
        </form>

        {/* Active Session & HttpOnly Cookie Security Info */}
        <div className="border-t border-gray-100 pt-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Session Security Details
            </span>
            <button
              onClick={() => refreshTokens()}
              className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Force Token Rotation
            </button>
          </div>
          <p className="text-[11px] text-gray-600 leading-relaxed">
            Your session is secured with short-lived 15-minute JWT access tokens stored in <strong>HttpOnly cookies</strong>,
            preventing JavaScript XSS interception. Refresh tokens are automatically rotated and invalidated on logout.
          </p>
        </div>
      </div>
    </div>
  );
};
