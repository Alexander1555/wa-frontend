import React, { useState, useEffect } from 'react';

export default function App() {
  // Auth & User State
  const [token, setToken] = useState(localStorage.getItem('wa_token') || '');
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem('wa_user') || 'null')
  );
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // Active Tab: 'broadcast' | 'monitor' | 'session' | 'users'
  const [activeTab, setActiveTab] = useState('broadcast');

  // Broadcast Form State
  const [phoneList, setPhoneList] = useState('');
  const [message, setMessage] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [buttons, setButtons] = useState([
    { text: '', url: '' },
    { text: '', url: '' },
    { text: '', url: '' }
  ]);

  // Pengaturan Delay Pengiriman (Detik)
  // Opsi: 5-10 detik (Testing), 60-120 detik (1-2 Menit), 60-300 detik (1-5 Menit Acak Aman)
  const [delayMode, setDelayMode] = useState('safe'); 

  // Blast Progress & Monitoring State
  const [isBlasting, setIsBlasting] = useState(false);
  const [monitorLogs, setMonitorLogs] = useState([]);
  const [blastSummary, setBlastSummary] = useState({ total: 0, success: 0, pending: 0, failed: 0 });
  const [currentDelayCountdown, setCurrentDelayCountdown] = useState(0);

  // WhatsApp Session State
  const [waStatus, setWaStatus] = useState('disconnected');
  const [qrCodeData, setQrCodeData] = useState('');
  const [isQrLoading, setIsQrLoading] = useState(false);

  // Cek Status QR saat tab session dibuka
  const fetchSessionStatus = async () => {
    setIsQrLoading(true);
    try {
      const res = await fetch('/api/qr');
      const data = await res.json();
      setWaStatus(data.status || 'disconnected');
      setQrCodeData(data.qr || '');
    } catch (err) {
      console.error('Error fetching QR:', err);
    } finally {
      setIsQrLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'session') {
      fetchSessionStatus();
    }
  }, [activeTab]);

  // Login Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        setCurrentUser(data.user);
        localStorage.setItem('wa_token', data.token);
        localStorage.setItem('wa_user', JSON.stringify(data.user));
      } else {
        setLoginError(data.message || 'Login gagal.');
      }
    } catch (err) {
      setLoginError('Koneksi ke backend gagal.');
    }
  };

  const handleLogout = () => {
    setToken('');
    setCurrentUser(null);
    localStorage.removeItem('wa_token');
    localStorage.removeItem('wa_user');
  };

  // Upload Gambar ke Base64
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageBase64('');
  };

  // Helper Countdown Sleep
  const waitWithCountdown = (seconds) => {
    return new Promise((resolve) => {
      let remaining = seconds;
      setCurrentDelayCountdown(remaining);
      const interval = setInterval(() => {
        remaining -= 1;
        setCurrentDelayCountdown(remaining);
        if (remaining <= 0) {
          clearInterval(interval);
          resolve();
        }
      }, 1000);
    });
  };

  // Generator Delay Acak / Statis
  const getDelaySeconds = () => {
    if (delayMode === 'fast') return 5; // Cepat / Testing
    if (delayMode === 'medium') return 60; // 1 Menit per nomor
    if (delayMode === 'safe') {
      // 1 sampai 5 Menit Acak (60s - 300s)
      return Math.floor(Math.random() * (300 - 60 + 1)) + 60;
    }
    return 60;
  };

  // Handler Mulai Blast
  const handleStartBlast = async () => {
    const rawNumbers = phoneList
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    if (rawNumbers.length === 0) {
      alert('Masukkan minimal satu nomor tujuan.');
      return;
    }

    if (!message && !imageBase64) {
      alert('Pesan teks atau gambar wajib diisi.');
      return;
    }

    // Inisialisasi daftar antrean monitor
    const logs = rawNumbers.map((phone, idx) => ({
      id: idx + 1,
      phone,
      status: 'pending', // 'pending' | 'success' | 'failed'
      time: '-'
    }));

    setMonitorLogs(logs);
    setBlastSummary({
      total: logs.length,
      success: 0,
      pending: logs.length,
      failed: 0
    });

    setIsBlasting(true);
    setActiveTab('monitor'); // Otomatis pindah ke monitor

    let currentSuccess = 0;
    let currentFailed = 0;

    for (let i = 0; i < rawNumbers.length; i++) {
      const targetPhone = rawNumbers[i];

      try {
        const res = await fetch('/api/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: targetPhone,
            message,
            imageBase64,
            buttons
          })
        });

        const data = await res.json();
        const now = new Date().toLocaleTimeString('id-ID');

        if (data.success) {
          currentSuccess++;
          logs[i].status = 'success';
          logs[i].time = now;
        } else {
          currentFailed++;
          logs[i].status = 'failed';
          logs[i].time = now;
        }
      } catch (err) {
        currentFailed++;
        logs[i].status = 'failed';
        logs[i].time = new Date().toLocaleTimeString('id-ID');
      }

      setMonitorLogs([...logs]);
      setBlastSummary({
        total: logs.length,
        success: currentSuccess,
        pending: logs.length - (currentSuccess + currentFailed),
        failed: currentFailed
      });

      // Jika bukan nomor terakhir, jalankan delay keamanan
      if (i < rawNumbers.length - 1) {
        const delaySeconds = getDelaySeconds();
        await waitWithCountdown(delaySeconds);
      }
    }

    setCurrentDelayCountdown(0);
    setIsBlasting(false);
  };

  // Tampilan Login jika belum autentikasi
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">WA-Dojo Blaster</h1>
            <p className="text-sm text-slate-400">Masuk untuk mengelola broadcast mandiri</p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-sm text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Username
              </label>
              <input
                type="text"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-lg transition duration-200 mt-2 shadow-lg shadow-emerald-900/20"
            >
              Masuk Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard Utama
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-slate-950">
            W
          </div>
          <span className="font-bold text-lg text-white">WA-Dojo Blaster</span>
          <span className="text-xs uppercase px-2 py-0.5 rounded font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {currentUser?.role || 'User'}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-xs text-slate-400">
            Sisa Kuota:{' '}
            <strong className="text-amber-400">
              {currentUser?.quota === Infinity ? 'Bebas Kuota (Unlimited)' : currentUser?.quota}
            </strong>
          </span>
          <button
            onClick={handleLogout}
            className="text-xs bg-slate-800 hover:bg-rose-950 hover:text-rose-400 border border-slate-700 px-3 py-1.5 rounded-md transition"
          >
            Keluar
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-6 gap-6">
        {/* Sidebar Nav */}
        <nav className="w-56 flex flex-col space-y-1">
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'broadcast'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            📢 Broadcast
          </button>
          <button
            onClick={() => setActiveTab('monitor')}
            className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'monitor'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            📊 Hasil Broadcast
          </button>
          <button
            onClick={() => setActiveTab('session')}
            className={`flex items-center px-4 py-2.5 rounded-xl text-sm font-medium transition ${
              activeTab === 'session'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            📱 Sesi WhatsApp
          </button>
        </nav>

        {/* Dynamic Content */}
        <main className="flex-1">
          {/* TAB 1: FORM BROADCAST & LIVE PHONE MOCKUP */}
          {activeTab === 'broadcast' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Form Input */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Buat Pesan Broadcast</h2>
                  <p className="text-xs text-slate-400">
                    Kirim pesan massal dengan proteksi anti-banned berbasis jeda pengiriman.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Daftar Nomor WhatsApp (Satu nomor per baris)
                  </label>
                  <textarea
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="081234567890&#10;6285283831840"
                    value={phoneList}
                    onChange={(e) => setPhoneList(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Isi Pesan Teks
                  </label>
                  <textarea
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Tulis pesan promosi atau pemberitahuan..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                {/* Upload Gambar */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    Lampirkan Gambar (Opsional)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                    />
                    {imageBase64 && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="text-xs text-rose-400 hover:underline"
                      >
                        Hapus Gambar
                      </button>
                    )}
                  </div>
                </div>

                {/* 3 Tombol Link Aksi */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                    Action Link Buttons (Maks 3 Tombol)
                  </label>
                  <div className="space-y-2">
                    {buttons.map((btn, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          placeholder={`Nama Tombol ${index + 1}`}
                          className="w-1/3 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                          value={btn.text}
                          onChange={(e) => {
                            const newButtons = [...buttons];
                            newButtons[index].text = e.target.value;
                            setButtons(newButtons);
                          }}
                        />
                        <input
                          type="url"
                          placeholder="https://..."
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                          value={btn.url}
                          onChange={(e) => {
                            const newButtons = [...buttons];
                            newButtons[index].url = e.target.value;
                            setButtons(newButtons);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* PILIHAN DELAY PENGIRIMAN (ANTI-BANNED) */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                      Jeda Waktu Antar Pesan (Delay)
                    </label>
                    <span className="text-[11px] text-emerald-400 font-medium">🛡️ Rekomendasi: 1 - 5 Menit</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setDelayMode('fast')}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium transition text-center ${
                        delayMode === 'fast'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      5 - 10 Detik
                      <span className="block text-[10px] text-slate-500 mt-0.5">Hanya Testing</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDelayMode('medium')}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium transition text-center ${
                        delayMode === 'medium'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      1 Menit
                      <span className="block text-[10px] text-slate-500 mt-0.5">Konstan 60s</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDelayMode('safe')}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium transition text-center ${
                        delayMode === 'safe'
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 font-semibold shadow-sm'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      1 - 5 Menit Acak
                      <span className="block text-[10px] text-emerald-500/80 mt-0.5">Paling Aman (Anti-Spam)</span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isBlasting}
                  onClick={handleStartBlast}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition duration-200 shadow-lg shadow-emerald-900/20"
                >
                  {isBlasting ? 'Sedang Mengirim Broadcast...' : 'Mulai Kirim Broadcast 🚀'}
                </button>
              </div>

              {/* Realtime Smartphone Mockup Preview */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-[320px] h-[640px] bg-slate-900 border-[8px] border-slate-800 rounded-[40px] shadow-2xl flex flex-col overflow-hidden relative">
                  {/* Speaker Notch */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-800 rounded-full z-20"></div>

                  {/* Header WhatsApp Bar */}
                  <div className="bg-[#075E54] text-white pt-8 pb-3 px-4 flex items-center space-x-3 z-10 shadow">
                    <div className="w-8 h-8 rounded-full bg-slate-200/20 flex items-center justify-center font-bold text-xs">
                      WA
                    </div>
                    <div>
                      <div className="font-semibold text-xs leading-none">WA-Dojo Blaster</div>
                      <div className="text-[10px] text-emerald-200 mt-0.5">online</div>
                    </div>
                  </div>

                  {/* Chat Area Body */}
                  <div className="flex-1 bg-[#0b141a] p-3 overflow-y-auto space-y-2">
                    <div className="max-w-[85%] bg-[#005c4b] text-white rounded-lg p-2.5 shadow text-xs relative ml-auto space-y-2">
                      {/* Gambar Preview */}
                      {imageBase64 && (
                        <img
                          src={imageBase64}
                          alt="Preview"
                          className="w-full h-36 object-cover rounded-md"
                        />
                      )}

                      {/* Pesan Teks */}
                      <p className="whitespace-pre-line text-[11px] leading-relaxed">
                        {message || 'Pesan Anda akan tampil di sini secara real-time...'}
                      </p>

                      {/* Action Links Preview */}
                      {buttons.some((b) => b.text && b.url) && (
                        <div className="pt-1 border-t border-emerald-600/40 space-y-1">
                          {buttons
                            .filter((b) => b.text && b.url)
                            .map((b, i) => (
                              <div
                                key={i}
                                className="bg-[#025144] hover:bg-[#03443a] text-center text-sky-300 py-1 rounded text-[10px] font-medium block truncate"
                              >
                                🔗 {b.text}
                              </div>
                            ))}
                        </div>
                      )}

                      <div className="text-[9px] text-emerald-200 text-right leading-none mt-1">
                        12:00 ✓✓
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MONITOR HASIL BROADCAST DENGAN COUNTDOWN TIMER */}
          {activeTab === 'monitor' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Monitor Hasil Broadcast</h2>
                  <p className="text-xs text-slate-400">Pantau progres pengiriman dan jeda antar pesan secara real-time</p>
                </div>
                {!isBlasting && (
                  <button
                    onClick={() => setActiveTab('broadcast')}
                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-lg"
                  >
                    + Buat Pesan Baru
                  </button>
                )}
              </div>

              {/* Status Box Countdown Saat Jeda Pengiriman */}
              {isBlasting && currentDelayCountdown > 0 && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full animate-ping"></div>
                    <span className="text-sm text-emerald-200">
                      Menjaga akun tetap aman: Menunggu jeda pengiriman berikutnya...
                    </span>
                  </div>
                  <div className="text-sm font-mono font-bold text-emerald-400 bg-emerald-900/50 px-3 py-1 rounded-md border border-emerald-500/20">
                    ⏳ {Math.floor(currentDelayCountdown / 60)}m {currentDelayCountdown % 60}s
                  </div>
                </div>
              )}

              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <div className="text-xs text-slate-400">Total Target</div>
                  <div className="text-2xl font-bold text-white mt-1">{blastSummary.total}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <div className="text-xs text-emerald-400">Berhasil</div>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">{blastSummary.success}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <div className="text-xs text-amber-400">Menunggu (Pending)</div>
                  <div className="text-2xl font-bold text-amber-400 mt-1">{blastSummary.pending}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <div className="text-xs text-rose-400">Gagal</div>
                  <div className="text-2xl font-bold text-rose-400 mt-1">{blastSummary.failed}</div>
                </div>
              </div>

              {/* Table Status Realtime */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800/60 text-xs uppercase text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">No.</th>
                      <th className="py-3 px-4">Nomor WhatsApp</th>
                      <th className="py-3 px-4">Status Pengiriman</th>
                      <th className="py-3 px-4">Waktu Eksekusi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 font-mono text-xs">
                    {monitorLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-500 font-sans">
                          Belum ada aktivitas blast yang dijalankan.
                        </td>
                      </tr>
                    ) : (
                      monitorLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/30">
                          <td className="py-3 px-4 text-slate-400">{log.id}</td>
                          <td className="py-3 px-4 text-white font-medium">{log.phone}</td>
                          <td className="py-3 px-4">
                            {log.status === 'success' && (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans">
                                ✓ Berhasil
                              </span>
                            )}
                            {log.status === 'failed' && (
                              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-sans">
                                ✕ Gagal
                              </span>
                            )}
                            {log.status === 'pending' && (
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-sans animate-pulse">
                                ⏳ Menunggu Antrean
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-400">{log.time}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: MANAJEMEN SESI WHATSAPP & QR */}
          {activeTab === 'session' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Status Sesi WhatsApp</h2>
                <p className="text-xs text-slate-400">
                  Tautkan nomor WhatsApp blast melalui pemindaian QR code Baileys.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-300">Status Saat Ini:</span>
                {waStatus === 'connected' ? (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ● WhatsApp Terhubung Aktif
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    ● Belum Terhubung (Menunggu Scan)
                  </span>
                )}
              </div>

              {/* Kotak QR Code */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center min-h-[260px]">
                {waStatus === 'connected' ? (
                  <div className="text-center space-y-2">
                    <div className="text-4xl">✅</div>
                    <div className="text-sm font-semibold text-emerald-400">Koneksi Siap Digunakan</div>
                    <p className="text-xs text-slate-400">
                      Nomor Anda telah terikat di VPS. Anda dapat langsung menjalankan broadcast.
                    </p>
                  </div>
                ) : qrCodeData ? (
                  <div className="flex flex-col items-center space-y-3">
                    <img
                      src={qrCodeData}
                      alt="WhatsApp QR Code"
                      className="w-56 h-56 rounded-lg bg-white p-2 shadow-lg"
                    />
                    <span className="text-xs text-slate-400">
                      Buka WA di HP &gt; Perangkat Tertaut &gt; Scan QR di atas
                    </span>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 text-center">
                    {isQrLoading ? 'Memuat QR code...' : 'Klik tombol di bawah untuk memeriksa status QR'}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={fetchSessionStatus}
                disabled={isQrLoading}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-xl text-xs transition"
              >
                {isQrLoading ? 'Memeriksa...' : '🔄 Refresh Sesi / Cek QR'}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}