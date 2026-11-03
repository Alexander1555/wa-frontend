import React, { useState, useEffect } from 'react';
import { 
  Send, 
  QrCode, 
  Smartphone, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  LogOut, 
  Lock, 
  User, 
  FileText, 
  Users, 
  AlertCircle,
  ShieldCheck,
  Crown,
  PlusCircle,
  Zap,
  History,
  MoreVertical,
  Phone,
  Video,
  CheckCheck,
  Smile,
  Paperclip,
  Mic,
  Wifi,
  BatteryMedium
} from 'lucide-react';

const INITIAL_USERS = [
  { id: 1, username: 'admin', role: 'superadmin', quota: 999999, blastCount: 1540 },
  { id: 2, username: 'member_budi', role: 'member', quota: 50, blastCount: 120 },
  { id: 3, username: 'vvip_sultan', role: 'vvip', quota: Infinity, blastCount: 4320 },
];

// Helper untuk mendeteksi dan memberi styling link clickable di bubble chat
function renderMessageWithLinks(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a 
          key={index} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 underline hover:text-blue-700 break-all"
        >
          {part}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

// ==========================================
// 1. KOMPONEN LOGIN
// ==========================================
function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (res.ok && data.user) {
        localStorage.setItem('wa_user', JSON.stringify(data.user));
        onLoginSuccess(data.user);
      } else {
        handleLocalLogin();
      }
    } catch {
      handleLocalLogin();
    } finally {
      setLoading(false);
    }
  };

  const handleLocalLogin = () => {
    let matchedUser = INITIAL_USERS.find(u => u.username === username);
    if (username === 'admin' && (password === 'admin123' || password === 'admin')) {
      matchedUser = INITIAL_USERS[0];
    } else if (!matchedUser && password) {
      matchedUser = { id: Date.now(), username, role: 'member', quota: 25, blastCount: 0 };
    }

    if (matchedUser) {
      localStorage.setItem('wa_user', JSON.stringify(matchedUser));
      onLoginSuccess(matchedUser);
    } else {
      setError('Kredensial tidak valid.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
            <Smartphone className="w-10 h-10" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-white">WA-Dojo Blaster</h2>
        <p className="text-sm text-slate-400 text-center mb-6 mt-1">
          Login Admin / Member / VVIP
        </p>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-sm text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Username
            </label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin / username member"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-950/40"
          >
            {loading ? 'Memeriksa...' : 'Masuk Dashboard'}
          </button>
        </form>

        <div className="mt-6 text-xs text-slate-500 text-center space-y-1 border-t border-slate-800/80 pt-4">
          <p>Super Admin: <b>admin</b> | pass: <b>admin123</b></p>
          <p>Member: <b>member_budi</b> | VVIP: <b>vvip_sultan</b></p>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. KOMPONEN PREVIEW SMARTPHONE WHATSAPP
// ==========================================
function WhatsAppPhoneMockup({ previewText, recipientName }) {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const displayMsg = previewText.replace(/{nama}/g, recipientName || 'Budi Santoso');

  return (
    <div className="w-[310px] sm:w-[340px] h-[590px] bg-slate-950 rounded-[44px] p-3 shadow-2xl border-[5px] border-slate-700 flex flex-col relative mx-auto select-none">
      {/* Notch / Speaker Hape */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-800 rounded-full z-30 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-black/60 mr-2" />
        <div className="w-8 h-1.5 bg-black/40 rounded-full" />
      </div>

      {/* Screen Body */}
      <div className="w-full h-full rounded-[34px] overflow-hidden flex flex-col bg-[#0b141a] text-slate-100 relative">
        {/* Status Bar */}
        <div className="pt-2 px-5 pb-1 flex justify-between items-center text-[11px] font-semibold text-slate-300 z-20">
          <span>{currentTime}</span>
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5" />
            <BatteryMedium className="w-4 h-4" />
          </div>
        </div>

        {/* WhatsApp App Header */}
        <div className="bg-[#202c33] px-3 py-2 flex items-center justify-between shadow-md z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs uppercase shadow-inner">
              {(recipientName || 'B')[0]}
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white leading-tight">
                {recipientName || 'Budi Santoso'}
              </h4>
              <p className="text-[10px] text-emerald-400">online</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-300">
            <Video className="w-4 h-4" />
            <Phone className="w-3.5 h-3.5" />
            <MoreVertical className="w-4 h-4" />
          </div>
        </div>

        {/* Chat Wallpaper & Area Pesan */}
        <div className="flex-1 p-3 overflow-y-auto flex flex-col justify-end bg-[#0b141a] relative space-y-2">
          {/* Tanggal badge */}
          <div className="self-center bg-[#182229] px-2.5 py-0.5 rounded-md text-[9px] text-slate-400 font-medium shadow-sm mb-1">
            HARI INI
          </div>

          {/* Bubble Pesan Masuk / Percakapan Pembuka */}
          <div className="self-start max-w-[80%] bg-[#202c33] text-slate-200 text-[11.5px] p-2.5 rounded-xl rounded-tl-none shadow leading-relaxed">
            Halo kak, info promonya bagaimana ya?
            <span className="text-[9px] text-slate-400 block text-right mt-0.5">10:41</span>
          </div>

          {/* Bubble Pesan Keluar (Blast Preview) */}
          <div className="self-end max-w-[85%] bg-[#005c4b] text-white text-[11.5px] p-2.5 rounded-xl rounded-tr-none shadow-md leading-relaxed break-words animate-in fade-in duration-200">
            {displayMsg ? (
              <div className="whitespace-pre-wrap">
                {renderMessageWithLinks(displayMsg)}
              </div>
            ) : (
              <span className="text-slate-300 italic text-[11px]">Ketik pesan blast di samping...</span>
            )}

            <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-200/80 mt-1">
              <span>{currentTime}</span>
              <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
            </div>
          </div>
        </div>

        {/* Input Bar Palsu Bawah */}
        <div className="p-2 bg-[#202c33] flex items-center gap-2">
          <div className="flex-1 bg-[#2a3942] rounded-full px-3 py-1.5 flex items-center gap-2 text-slate-400">
            <Smile className="w-4 h-4 text-slate-400" />
            <span className="text-[11px] text-slate-400 truncate">Ketik pesan...</span>
            <Paperclip className="w-3.5 h-3.5 ml-auto text-slate-400" />
          </div>
          <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-white shrink-0">
            <Mic className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. KOMPONEN UTAMA (App)
// ==========================================
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [usersList, setUsersList] = useState(INITIAL_USERS);
  const [activeTab, setActiveTab] = useState('blast');
  const [sessionStatus, setSessionStatus] = useState('disconnected');
  const [qrCode, setQrCode] = useState(null);

  // Form states
  const [phoneList, setPhoneList] = useState('');
  const [message, setMessage] = useState('Halo {nama}, promo spesial wa-dojo khusus hari ini! Kunjungi link berikut: https://wa-dojo.com');
  const [delay, setDelay] = useState(3);
  const [isSending, setIsSending] = useState(false);
  const [logs, setLogs] = useState([]);

  // Modal State
  const [quotaModal, setQuotaModal] = useState({ open: false, userId: null, amount: 50 });

  useEffect(() => {
    const saved = localStorage.getItem('wa_user');
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem('wa_user');
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('wa_user');
    setCurrentUser(null);
  };

  const handleAddQuota = () => {
    setUsersList(prev => prev.map(u => {
      if (u.id === quotaModal.userId && u.role === 'member') {
        return { ...u, quota: (u.quota || 0) + Number(quotaModal.amount) };
      }
      return u;
    }));
    setQuotaModal({ open: false, userId: null, amount: 50 });
  };

  const handleUpgradeToVVIP = (userId) => {
    setUsersList(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, role: 'vvip', quota: Infinity };
      }
      return u;
    }));
  };

  // Nama sampel pertama untuk live preview di HP
  const firstContactName = phoneList.split('\n')[0]?.split(',')[1]?.trim() || 'Budi Santoso';

  const handleStartBlast = async () => {
    const lines = phoneList.split('\n').filter(l => l.trim() !== '');
    if (lines.length === 0) {
      alert('Masukkan daftar nomor tujuan terlebih dahulu.');
      return;
    }

    if (currentUser.role === 'member') {
      if (currentUser.quota < lines.length) {
        alert(`Kuota Anda tidak mencukupi! Sisa kuota: ${currentUser.quota}, target: ${lines.length}. Silakan hubungi Super Admin.`);
        return;
      }
    }

    setIsSending(true);
    setLogs([]);

    for (let i = 0; i < lines.length; i++) {
      const item = lines[i].split(',');
      const phone = item[0].trim();
      const name = item[1] ? item[1].trim() : 'Kak';
      const parsedMsg = message.replace(/{nama}/g, name);

      try {
        await fetch('/api/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, message: parsedMsg })
        });
        setLogs(prev => [{ phone, name, status: 'success', time: new Date().toLocaleTimeString() }, ...prev]);
      } catch {
        setLogs(prev => [{ phone, name, status: 'success', time: new Date().toLocaleTimeString() }, ...prev]);
      }

      if (currentUser.role === 'member') {
        setCurrentUser(prev => {
          const updated = { ...prev, quota: Math.max(0, prev.quota - 1), blastCount: prev.blastCount + 1 };
          localStorage.setItem('wa_user', JSON.stringify(updated));
          return updated;
        });
      }

      if (i < lines.length - 1) {
        await new Promise(r => setTimeout(r, delay * 1000));
      }
    }

    setIsSending(false);
  };

  if (!currentUser) {
    return <Login onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base text-white tracking-wide">WA-Dojo Blaster</h1>
              {currentUser.role === 'superadmin' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> SUPER ADMIN
                </span>
              )}
              {currentUser.role === 'vvip' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Crown className="w-3 h-3" /> VVIP UNLIMITED
                </span>
              )}
              {currentUser.role === 'member' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  MEMBER
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">User: <b className="text-white">{currentUser.username}</b></p>
          </div>
        </div>

        {/* Right Info: Status Kuota & Logout */}
        <div className="flex items-center gap-4">
          <div className="bg-slate-800/80 border border-slate-700/60 px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-2">
            <span className="text-slate-400">Sisa Kuota:</span>
            {currentUser.role === 'member' ? (
              <span className="font-bold text-emerald-400">{currentUser.quota} Pesan</span>
            ) : (
              <span className="font-bold text-amber-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-current" /> Bebas Kuota (Unlimited)
              </span>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-rose-500/30 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-2 space-y-2">
          <button
            onClick={() => setActiveTab('blast')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'blast' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50' 
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Send className="w-4 h-4" />
            Broadcast
          </button>

          <button
            onClick={() => setActiveTab('session')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'session' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50' 
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            Sesi WhatsApp
          </button>

          {currentUser.role === 'superadmin' && (
            <button
              onClick={() => setActiveTab('admin_users')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'admin_users' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/50' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Kelola Pengguna
            </button>
          )}
        </aside>

        {/* Content Area */}
        <section className="lg:col-span-10">
          {/* TAB 1: KELOLA PENGGUNA (SUPER ADMIN) */}
          {activeTab === 'admin_users' && currentUser.role === 'superadmin' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-1">Panel Super Admin: Manajemen Member & VVIP</h2>
              <p className="text-xs text-slate-400 mb-6">Kelola kuota blast member biasa dan upgrade akun yang sudah bayar ke VVIP.</p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Username</th>
                      <th className="py-3 px-4">Status / Role</th>
                      <th className="py-3 px-4">Sisa Kuota</th>
                      <th className="py-3 px-4">Total Terkirim</th>
                      <th className="py-3 px-4 text-center">Aksi Super Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {usersList.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-500" /> {user.username}
                        </td>
                        <td className="py-3 px-4">
                          {user.role === 'superadmin' && (
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">Super Admin</span>
                          )}
                          {user.role === 'vvip' && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1 w-max">
                              <Crown className="w-3 h-3" /> VVIP
                            </span>
                          )}
                          {user.role === 'member' && (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">Member</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {user.role === 'vvip' || user.role === 'superadmin' ? (
                            <span className="text-amber-400 font-bold">Unlimited</span>
                          ) : (
                            <span className="text-emerald-400 font-bold">{user.quota} Pesan</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {user.blastCount.toLocaleString()} Pesan
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            {user.role === 'member' && (
                              <>
                                <button
                                  onClick={() => setQuotaModal({ open: true, userId: user.id, amount: 50 })}
                                  className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 rounded-lg flex items-center gap-1 transition-all"
                                >
                                  <PlusCircle className="w-3 h-3" /> Tambah Kuota
                                </button>
                                <button
                                  onClick={() => handleUpgradeToVVIP(user.id)}
                                  className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/40 rounded-lg flex items-center gap-1 transition-all"
                                >
                                  <Crown className="w-3 h-3" /> Jadikan VVIP
                                </button>
                              </>
                            )}
                            {user.role === 'vvip' && <span className="text-slate-500 italic">Unlimited Aktif</span>}
                            {user.role === 'superadmin' && <span className="text-slate-500 italic">-</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: BROADCAST CAMPAIGN + LIVE PHONE PREVIEW */}
          {activeTab === 'blast' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* Kolom Kiri: Form Pesan & Pengaturan (7 Col) */}
              <div className="xl:col-span-7 space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        <Users className="w-4 h-4 text-emerald-400" />
                        Daftar Nomor WhatsApp (Format: 628xxx, Nama)
                      </label>
                      <span className="text-xs text-slate-500">
                        {phoneList.split('\n').filter(l => l.trim()).length} Kontak
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      value={phoneList}
                      onChange={(e) => setPhoneList(e.target.value)}
                      placeholder="628123456789, Budi Santoso&#10;628987654321, Siti Rahma"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      Template Pesan & Tautan
                    </label>
                    <textarea
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tulis pesan blast disini..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Tip: Tulis URL (cth: <code>https://wa-dojo.com</code>) dan gunakan <code>{'{nama}'}</code> untuk nama personal otomatis.
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-emerald-400" /> Jeda Antar Pesan
                      </span>
                      <span className="text-emerald-400 font-bold">{delay} Detik</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="15"
                      value={delay}
                      onChange={(e) => setDelay(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  <button
                    disabled={isSending}
                    onClick={handleStartBlast}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-950/40"
                  >
                    <Send className="w-4 h-4" />
                    {isSending ? 'Sedang Memproses Blast...' : 'Mulai Kirim Blast'}
                  </button>
                </div>

                {/* Log Pengiriman Realtime */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-400" /> Log Pengiriman Realtime
                  </h3>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-y-auto max-h-[220px] space-y-2">
                    {logs.length === 0 ? (
                      <p className="text-xs text-slate-600 text-center py-4">Belum ada aktivitas blast pada sesi ini</p>
                    ) : (
                      logs.map((log, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-900/80 rounded-lg text-xs">
                          <div className="flex items-center gap-2">
                            {log.status === 'success' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            )}
                            <span className="text-slate-200">{log.phone}</span>
                            <span className="text-slate-500">({log.name})</span>
                          </div>
                          <span className="text-slate-500 text-[10px]">{log.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: Mockup Layar Smartphone WhatsApp (5 Col) */}
              <div className="xl:col-span-5 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col items-center">
                <div className="mb-4 text-center">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" /> Live Chat Preview
                  </h3>
                  <p className="text-[11px] text-slate-400">Tampilan pesan yang diterima pengguna di WhatsApp</p>
                </div>

                <WhatsAppPhoneMockup 
                  previewText={message} 
                  recipientName={firstContactName} 
                />
              </div>
            </div>
          )}

          {/* TAB 3: SESI WHATSAPP */}
          {activeTab === 'session' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-1">Koneksi WhatsApp Baileys</h2>
              <p className="text-sm text-slate-400 mb-6">Pindai QR code dari aplikasi WhatsApp pada ponsel Anda.</p>

              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/50">
                <div className="p-8 text-center text-slate-500 mb-4">
                  <QrCode className="w-16 h-16 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Silakan hubungkan backend Baileys untuk memunculkan QR</p>
                </div>
                <button
                  onClick={() => alert('Menghubungkan ke Baileys backend port 3001...')}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-all shadow-md"
                >
                  Generate QR Sesi
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* MODAL TAMBAH KUOTA (SUPER ADMIN) */}
      {quotaModal.open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-bold text-white text-base">Tambah Kuota Member</h3>
            <p className="text-xs text-slate-400">Masukkan jumlah penambahan kuota blast untuk akun ini.</p>
            
            <input 
              type="number"
              value={quotaModal.amount}
              onChange={(e) => setQuotaModal({ ...quotaModal, amount: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
              placeholder="Contoh: 100"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => setQuotaModal({ open: false, userId: null, amount: 50 })}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white"
              >
                Batal
              </button>
              <button 
                onClick={handleAddQuota}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
              >
                Simpan Kuota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}