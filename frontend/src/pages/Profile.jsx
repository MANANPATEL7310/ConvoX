import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User as UserIcon, Shield, Mail, Calendar, 
  Video, Users, Star, ArrowLeft, Camera, Loader2, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../contexts/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import PageWrapper from '../components/PageWrapper';
import ThemeToggle from '../components/ThemeToggle';
import { toast } from 'sonner';
import axios from 'axios';

const server_url = import.meta.env.VITE_SERVER_URL || 'http://localhost:8000';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const { dark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: '',
    username: '',
    avatar: ''
  });
  const [stats, setStats] = useState({
    attended: 0,
    hosted: 0,
    feedbackGiven: 0
  });
  const [createdAt, setCreatedAt] = useState(null);
  const [hasPassword, setHasPassword] = useState(true);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    let active = true;
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(`${server_url}/api/v1/users/profile`, { withCredentials: true });
        if (active && data.success) {
          setProfileData({
            name: data.user.name || '',
            username: data.user.username || '',
            avatar: data.user.avatar || ''
          });
          setStats(data.stats);
          setCreatedAt(data.user.createdAt);
          setHasPassword(data.user.hasPassword);
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
        toast.error("Could not load profile data.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchProfile();
    return () => { active = false; };
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await axios.put(`${server_url}/api/v1/users/profile`, profileData, { withCredentials: true });
      if (data.success) {
        toast.success("Profile updated successfully!");
        // Update global auth context
        setUser((prev) => ({ ...prev, name: data.user.name, username: data.user.username, avatar: data.user.avatar }));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    setSavingPassword(true);
    try {
      const { data } = await axios.put(`${server_url}/api/v1/users/password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, { withCredentials: true });
      
      if (data.success) {
        toast.success("Password changed successfully!");
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const getJoinDate = () => {
    if (!createdAt) return 'Unknown';
    return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(createdAt));
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className={`w-8 h-8 animate-spin ${dark ? 'text-indigo-400' : 'text-indigo-600'}`} />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {/* ══════════ NAV ══════════ */}
      <nav className={`relative z-20 backdrop-blur-xl border-b sticky top-0 transition-colors duration-300 ${
        dark ? 'bg-gray-950/70 border-white/[0.06]' : 'bg-white/60 border-gray-200/50'
      }`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/home')}
                className={`p-2 h-9 w-9 rounded-full ${dark ? 'hover:bg-white/[0.08]' : 'hover:bg-gray-100'}`}
              >
                <ArrowLeft className={`w-4 h-4 ${dark ? 'text-gray-300' : 'text-gray-600'}`} />
              </Button>
              <h2 className={`text-lg font-bold tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
                Account Settings
              </h2>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Avatar & Stats */}
          <div className="flex flex-col gap-8">
            {/* Avatar Card */}
            <motion.div variants={fadeUp} className={`rounded-2xl p-8 flex flex-col items-center justify-center text-center ${dark ? 'dark-glass border border-white/[0.06]' : 'glass-card border border-gray-200/50'}`}>
              <div className="relative mb-6">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white shadow-xl shadow-indigo-500/20 overflow-hidden ring-4 ring-background">
                  {profileData.avatar ? (
                    <img src={profileData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    profileData.username?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
              </div>
              <h3 className={`text-xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{profileData.name}</h3>
              <p className={`text-sm mt-1 mb-4 flex items-center gap-1.5 justify-center ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                <Mail className="w-3.5 h-3.5" />
                {user?.email || 'No email linked'}
              </p>
              <div className={`px-4 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${dark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                <Calendar className="w-3.5 h-3.5" />
                Joined {getJoinDate()}
              </div>
            </motion.div>

            {/* Lifetime Stats */}
            <motion.div variants={fadeUp} className={`rounded-2xl p-6 ${dark ? 'dark-glass border border-white/[0.06]' : 'glass-card border border-gray-200/50'}`}>
              <h4 className={`text-sm font-semibold mb-5 uppercase tracking-wider ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Lifetime Activity</h4>
              <div className="grid grid-cols-1 gap-4">
                <div className={`flex items-center justify-between p-3 rounded-xl ${dark ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Video className="w-4 h-4" />
                    </div>
                    <span className={`text-sm font-medium ${dark ? 'text-gray-200' : 'text-gray-700'}`}>Attended</span>
                  </div>
                  <span className={`font-bold text-lg ${dark ? 'text-white' : 'text-blue-600'}`}>{stats.attended}</span>
                </div>
                <div className={`flex items-center justify-between p-3 rounded-xl ${dark ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className={`text-sm font-medium ${dark ? 'text-gray-200' : 'text-gray-700'}`}>Hosted</span>
                  </div>
                  <span className={`font-bold text-lg ${dark ? 'text-white' : 'text-emerald-600'}`}>{stats.hosted}</span>
                </div>
                <div className={`flex items-center justify-between p-3 rounded-xl ${dark ? 'bg-white/[0.03]' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <Star className="w-4 h-4" />
                    </div>
                    <span className={`text-sm font-medium ${dark ? 'text-gray-200' : 'text-gray-700'}`}>Feedback Given</span>
                  </div>
                  <span className={`font-bold text-lg ${dark ? 'text-white' : 'text-amber-600'}`}>{stats.feedbackGiven}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: Forms */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {/* Personal Info Form */}
            <motion.div variants={fadeUp} className={`rounded-2xl overflow-hidden ${dark ? 'dark-glass border border-white/[0.06]' : 'glass-card border border-gray-200/50'}`}>
              <div className={`px-6 py-5 border-b ${dark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
                <div className="flex items-center gap-2">
                  <UserIcon className={`w-5 h-5 ${dark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  <h3 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Personal Information</h3>
                </div>
                <p className={`text-sm mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Update your basic profile details and avatar.</p>
              </div>
              
              <form onSubmit={handleProfileUpdate} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>Full Name</label>
                    <Input 
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      placeholder="John Doe"
                      className={`${dark ? 'bg-black/20 border-white/[0.1] text-white placeholder:text-gray-500' : ''}`}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>Username</label>
                    <Input 
                      value={profileData.username}
                      onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                      placeholder="johndoe123"
                      className={`${dark ? 'bg-black/20 border-white/[0.1] text-white placeholder:text-gray-500' : ''}`}
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className={`text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>Avatar URL (Optional)</label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Camera className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
                        <Input 
                          value={profileData.avatar}
                          onChange={(e) => setProfileData({...profileData, avatar: e.target.value})}
                          placeholder="https://example.com/my-photo.jpg"
                          className={`pl-10 ${dark ? 'bg-black/20 border-white/[0.1] text-white placeholder:text-gray-500' : ''}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={savingProfile} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white min-w-[120px] shadow-lg shadow-indigo-500/20">
                    {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>

            {/* Security / Password Form */}
            {hasPassword ? (
              <motion.div variants={fadeUp} className={`rounded-2xl overflow-hidden ${dark ? 'dark-glass border border-white/[0.06]' : 'glass-card border border-gray-200/50'}`}>
                <div className={`px-6 py-5 border-b ${dark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
                  <div className="flex items-center gap-2">
                    <Shield className={`w-5 h-5 ${dark ? 'text-rose-400' : 'text-rose-600'}`} />
                    <h3 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Security</h3>
                  </div>
                  <p className={`text-sm mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Update your password to keep your account secure.</p>
                </div>
                
                <form onSubmit={handlePasswordUpdate} className="p-6">
                  <div className="space-y-5 mb-6">
                    <div className="space-y-2 max-w-md">
                      <label className={`text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>Current Password</label>
                      <Input 
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className={`${dark ? 'bg-black/20 border-white/[0.1] text-white' : ''}`}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className={`text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>New Password</label>
                        <Input 
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                          className={`${dark ? 'bg-black/20 border-white/[0.1] text-white' : ''}`}
                          minLength={6}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className={`text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`}>Confirm New Password</label>
                        <Input 
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                          className={`${dark ? 'bg-black/20 border-white/[0.1] text-white' : ''}`}
                          minLength={6}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={savingPassword} className={`min-w-[120px] border ${
                      dark ? 'bg-white/[0.05] hover:bg-white/[0.1] border-white/[0.1] text-white' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-900'
                    }`}>
                      {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                    </Button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div variants={fadeUp} className={`rounded-2xl overflow-hidden p-6 text-center ${dark ? 'dark-glass border border-white/[0.06] bg-gradient-to-br from-indigo-500/5 to-purple-500/5' : 'glass-card border border-gray-200/50 bg-indigo-50/30'}`}>
                <Shield className={`w-10 h-10 mx-auto mb-4 ${dark ? 'text-indigo-400' : 'text-indigo-500'}`} />
                <h3 className={`text-lg font-bold mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>Linked Account</h3>
                <p className={`text-sm max-w-md mx-auto leading-relaxed ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                  You signed in using a Google account. Password management is handled securely by your provider.
                </p>
              </motion.div>
            )}

          </div>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
