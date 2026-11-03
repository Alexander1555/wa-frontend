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
  AlertCircle 
} from 'lucide-react';

// ==========================================
// 1. KOMPONEN LOGIN (Sub-komponen tanpa export default)
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

      if (res.ok && data.token) {
        localStorage.setItem('wa_token', data.token);
        onLoginSuccess();
      } else {
        setError(data.message || 'Username atau password salah.');
      }
    } catch (err) {
      // Fallback demo jika backend API login belum diaktifkan
      if (username === 'admin' && password === 'admin123') {
        localStorage.setItem('wa_token', 'demo-token');
        onLoginSuccess();
      } else {
        setError('Gagal menghubungi server backend.');
      }
    } finally {
      setLoading(false);
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
          Masukkan kredensial untuk mengakses dashboard
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
                placeholder="admin"
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
            {loading ? 'Memeriksa...' : 'Masuk ke Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 2. KOMPONEN UTAMA (Satu-satunya export default)
// ==========================================
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('blast');
  const [sessionStatus, setSessionStatus] = useState('disconnected'); // 'disconnected' | 'connecting' | 'connected'
  const [qrCode, setQrCode] = useState(null);

  // Form states
  const [phoneList, setPhoneList] = useState('');
  const [message, setMessage] = useState('Halo {nama}, ini adalah pesan blast otomatis dari wa-dojo.com.');
  const [delay, setDelay] = useState(3);
  const [isSending, setIsSending] = useState(false);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('wa_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('wa_token');
    setIsAuthenticated(false);
  };

  // Simulasi atau integrasi scan QR Baileys
  const handleRequestQr = async () => {
    setSessionStatus('connecting');
    try {
      const res = await fetch('/api/qr');
      const data = await res.json();
      if (data.qr) {
        setQrCode(data.qr);
      }
    } catch {
      // Mockup QR jika offline
      setQrCode('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=WA-DOJO-SESSION');
    }
  };

  const handleStartBlast = async () => {
    const lines = phoneList.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) {
      alert('Harap masukkan daftar nomor tujuan.');
      return;
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
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('wa_token')}`
          },
          body: JSON.stringify({ phone, message: parsedMsg })
        });
        setLogs(prev => [{ phone, name, status: 'success', time: new Date().toLocaleTimeString() }, ...prev]);
      } catch {
        setLogs(prev => [{ phone, name, status: 'failed', time: new Date().toLocaleTimeString() }, ...prev]);
      }

      if (i < lines.length - 1) {
        await new Promise(r => setTimeout(r, delay * 1000));
      }
    }

    setIsSending(false);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
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
            <h1 className="font-bold text-base text-white tracking-wide">WA-Dojo Blaster</h1>
            <p className="text-xs text-slate-400">Biznet GIO VPS (wa-dojo.com)</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
            <span className={`w-2 h-2 rounded-full ${sessionStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            <span className="text-slate-300 capitalize">{sessionStatus}</span>
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-3 space-y-2">
          <button
            onClick={() => setActiveTab('blast')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'blast' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50' 
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Send className="w-4 h-4" />
            Broadcast Campaign
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
        </aside>

        {/* Content Area */}
        <section className="lg:col-span-9">
          {activeTab === 'session' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-1">Hubungkan Perangkat WhatsApp</h2>
              <p className="text-sm text-slate-400 mb-6">Pindai QR Code menggunakan aplikasi WhatsApp di ponsel Anda.</p>

              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/50">
                {qrCode ? (
                  <div className="p-4 bg-white rounded-xl shadow-lg mb-4">
                    <img src={qrCode} alt="WhatsApp QR Code" className="w-56 h-56" />
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 mb-4">
                    <QrCode className="w-16 h-16 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">QR Code belum dibuat</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleRequestQr}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-all shadow-md"
                  >
                    Generate / Refresh QR
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'blast' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form Input */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    Daftar Kontak (Format: 628xxx, Nama)
                  </label>
                  <textarea
                    rows={5}
                    value={phoneList}
                    onChange={(e) => setPhoneList(e.target.value)}
                    placeholder="628123456789, Budi&#10;628987654321, Siti"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    Template Pesan
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Gunakan tag <code>{'{nama}'}</code> untuk menyisipkan nama penerima.</p>
                </div>

                <div>
                  <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-400" /> Jeda Pengiriman
                    </span>
                    <span className="text-emerald-400">{delay} Detik</span>
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
                  {isSending ? 'Sedang Mengirim...' : 'Mulai Kirim Blast'}
                </button>
              </div>

              {/* Status / Log Window */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
                  Log Pengiriman Realtime
                </h3>

                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-y-auto max-h-[420px] space-y-2.5">
                  {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 py-12">
                      <Clock className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-xs">Belum ada aktivitas blast</p>
                    </div>
                  ) : (
                    logs.map((log, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-900/80 rounded-lg border border-slate-800/80 text-xs">
                        <div className="flex items-center gap-2">
                          {log.status === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400" />
                          )}
                          <span className="text-slate-200 font-medium">{log.phone}</span>
                          <span className="text-slate-500">({log.name})</span>
                        </div>
                        <span className="text-slate-500 text-[10px]">{log.time}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}