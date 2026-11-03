import React, { useState, useMemo, useEffect } from 'react';
import {
  Send, BarChart3, ShieldCheck, CheckCircle2,
  AlertCircle, Phone, MessageSquare, Play, Pause, RefreshCw,
  User, Plus, Trash2, ExternalLink, Link2, Eye,
  Clock, Check, Search, Globe, Smartphone, Copy, X, PlusCircle, Crown, Settings, QrCode, PowerOff
} from 'lucide-react';

const INITIAL_LINKS = [
  { id: 1, label: '🌐 Kunjungi Website & Katalog', url: 'https://tokoku.id/promo?ref={{nomor}}', enabled: true },
  { id: 2, label: '💬 Chat CS WhatsApp', url: 'https://wa.me/6281234567890?text=Halo%20Admin', enabled: true },
  { id: 3, label: '🎁 Klaim Voucher Diskon', url: 'https://tokoku.id/voucher?user={{nomor}}', enabled: true },
];

export default function App() {
  const [currentUserRole, setCurrentUserRole] = useState('customer'); // 'customer' | 'admin'
  const [activeTab, setActiveTab] = useState('campaign'); // 'campaign', 'history', 'admin_monitor', 'admin_settings'
  const [campaignStep, setCampaignStep] = useState(1);
  const [activeCustomerId, setActiveCustomerId] = useState(1);

  // Status Koneksi WhatsApp Backend & QR Code
  const [waStatus, setWaStatus] = useState({
    status: 'disconnected', // 'connected' | 'connecting' | 'disconnected'
    qrImage: null,
    phoneNumber: null
  });
  const [isQrLoading, setIsQrLoading] = useState(false);

  // Polling Status WhatsApp dari Backend setiap 3 detik
  const fetchWaStatus = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/wa/status');
      if (res.ok) {
        const data = await res.json();
        setWaStatus(data);
      }
    } catch (err) {
      // Backend offline
      setWaStatus(prev => ({ ...prev, status: 'offline' }));
    }
  };

  useEffect(() => {
    fetchWaStatus();
    const interval = setInterval(fetchWaStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // Handler Trigger Generate / Scan QR Baru
  const handleGenerateNewQR = async () => {
    setIsQrLoading(true);
    try {
      await fetch('http://localhost:3001/api/wa/restart', { method: 'POST' });
      await fetchWaStatus();
      showToast('Meminta QR Code baru...');
    } catch (err) {
      alert('Gagal menghubungi backend!');
    } finally {
      setIsQrLoading(false);
    }
  };

  // Handler Logout WhatsApp
  const handleLogoutWA = async () => {
    if (!window.confirm('Yakin ingin memutuskan koneksi nomor WhatsApp ini?')) return;
    try {
      await fetch('http://localhost:3001/api/wa/logout', { method: 'POST' });
      await fetchWaStatus();
      showToast('Nomor berhasil diputuskan');
    } catch (err) {
      alert('Gagal logout WhatsApp');
    }
  };

  // Data Pelanggan
  const [customers, setCustomers] = useState([
    {
      id: 1,
      name: 'Budi Santoso',
      email: 'budi@bisnis.com',
      businessName: 'Budi Elektronik Store',
      tier: 'VVIP',
      quota: 0,
      totalSent: 28400,
      totalSuccess: 27920,
      totalFailed: 480,
      campaigns: [
        {
          id: 'CMP-201',
          title: 'VVIP Flash Promo Payday',
          date: '28 Okt 2026, 09:30',
          target: 1500,
          success: 1480,
          failed: 20,
          message: 'Halo Pelanggan Setia!\n\nPromo Payday diskon spesial hari ini!\n\nCek promo: https://tokoku.id/promo',
          mediaUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&auto=format&fit=crop&q=80',
        }
      ]
    },
    {
      id: 2,
      name: 'Dewi Lestari',
      email: 'dewi@fashionstore.id',
      businessName: 'Dewi Hijab Fashion',
      tier: 'Regular',
      quota: 350,
      totalSent: 4200,
      totalSuccess: 4120,
      totalFailed: 80,
      campaigns: []
    }
  ]);

  const currentCustomer = customers.find(c => c.id === activeCustomerId) || customers[0];

  // State Pesan
  const [campaignTitle, setCampaignTitle] = useState('Promo Spesial Weekend');
  const [messageText, setMessageText] = useState(
    'Halo Pelanggan Setia!\n\nDiskon spesial weekend khusus untuk Anda.\n\nKunjungi katalog kami:\n{{link1}}\n{{link2}}\n\nTerima kasih!'
  );
  const [mediaUrl, setMediaUrl] = useState('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&auto=format&fit=crop&q=80');
  const [links, setLinks] = useState(INITIAL_LINKS);
  const [rawNumbers, setRawNumbers] = useState('081234567890\n085712345678\n082198765432');
  const [delaySeconds, setDelaySeconds] = useState(3);

  // State Blast
  const [isBlasting, setIsBlasting] = useState(false);
  const [blastProgress, setBlastProgress] = useState(0);
  const [blastResults, setBlastResults] = useState([]);
  const [logs, setLogs] = useState([]);

  // Modal State
  const [selectedCustomerForDetail, setSelectedCustomerForDetail] = useState(null);
  const [selectedCustomerForQuota, setSelectedCustomerForQuota] = useState(null);
  const [quotaToAdd, setQuotaToAdd] = useState(1000);
  const [toastNotification, setToastNotification] = useState('');

  const showToast = (msg) => {
    setToastNotification(msg);
    setTimeout(() => setToastNotification(''), 3500);
  };

  const toggleLink = (id) => {
    setLinks(prev => prev.map(item => item.id === id ? { ...item, enabled: !item.enabled } : item));
  };

  const updateLink = (id, field, value) => {
    setLinks(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleToggleTier = (customerId) => {
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        const nextTier = c.tier === 'VVIP' ? 'Regular' : 'VVIP';
        showToast(`Status ${c.name} diubah menjadi ${nextTier}`);
        return { ...c, tier: nextTier };
      }
      return c;
    }));
  };

  const parsedRecipients = useMemo(() => {
    if (!rawNumbers.trim()) return [];
    const lines = rawNumbers.split('\n');
    const seen = new Set();
    const list = [];
    lines.forEach((line) => {
      let phone = line.trim().replace(/[^0-9]/g, '');
      if (!phone) return;
      if (phone.startsWith('0')) phone = '62' + phone.slice(1);
      if (phone.length >= 10 && !seen.has(phone)) {
        seen.add(phone);
        list.push({ phone });
      }
    });
    return list;
  }, [rawNumbers]);

  const previewMessage = useMemo(() => {
    let text = messageText;
    const samplePhone = parsedRecipients[0]?.phone || '6281234567890';
    text = text.replace(/\{\{nomor\}\}/gi, samplePhone);
    links.forEach((l, idx) => {
      const tag = new RegExp(`\\{\\{link${idx + 1}\\}\\}`, 'gi');
      text = l.enabled && l.url ? text.replace(tag, l.url.replace(/\{\{nomor\}\}/gi, samplePhone)) : text.replace(tag, '');
    });
    return text.trim();
  }, [messageText, parsedRecipients, links]);

  const addQuotaDirectly = (customerId, amount) => {
    const numericAmount = parseInt(amount, 10);
    if (isNaN(numericAmount) || numericAmount <= 0) return;
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, quota: c.quota + numericAmount } : c));
    showToast(`✅ Berhasil menambahkan ${numericAmount.toLocaleString()} kuota`);
    setSelectedCustomerForQuota(null);
  };

  // Eksekusi Blast ke Backend
  const startBlast = async () => {
    if (parsedRecipients.length === 0) return;

    if (waStatus.status !== 'connected') {
      alert('Nomor WhatsApp belum terhubung! Silakan buka panel Super Admin > Pengaturan WhatsApp untuk scan QR terlebih dahulu.');
      return;
    }

    if (currentCustomer.tier === 'Regular' && currentCustomer.quota < parsedRecipients.length) {
      alert(`Kuota tidak cukup! Anda memiliki ${currentCustomer.quota} kuota, target adalah ${parsedRecipients.length} nomor.`);
      return;
    }

    setIsBlasting(true);
    setBlastProgress(0);
    setBlastResults(parsedRecipients.map(r => ({ ...r, status: 'pending' })));
    setLogs([`[${new Date().toLocaleTimeString()}] Menghubungi backend untuk memulai blast...`]);

    try {
      const res = await fetch('http://localhost:3001/api/blast/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: parsedRecipients.map(r => r.phone),
          message: messageText,
          mediaUrl: mediaUrl,
          links: links.filter(l => l.enabled),
          minDelay: delaySeconds,
          maxDelay: delaySeconds + 4
        })
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Gagal: ${err.error}`);
        setIsBlasting(false);
        return;
      }

      // Simulasi progress bar di visual frontend
      let idx = 0;
      const interval = setInterval(() => {
        setBlastResults(prev => {
          if (idx >= prev.length) {
            clearInterval(interval);
            setIsBlasting(false);
            setLogs(l => [`[${new Date().toLocaleTimeString()}] ✅ Selesai! Pesan telah diproses backend.`, ...l]);
            return prev;
          }
          const updated = [...prev];
          updated[idx] = { ...updated[idx], status: 'success', time: new Date().toLocaleTimeString() };
          setLogs(l => [`[${new Date().toLocaleTimeString()}] Terkirim ke +${updated[idx].phone}`, ...l]);
          idx++;
          setBlastProgress(Math.round((idx / prev.length) * 100));
          return updated;
        });
      }, (delaySeconds + 1) * 1000);

    } catch (error) {
      alert('Gagal terhubung ke server backend! Pastikan server node.js sudah dijalankan.');
      setIsBlasting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b141a] text-slate-100 flex flex-col font-sans">
      {/* Toast Alert */}
      {toastNotification && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold border border-emerald-400/40">
          <span>{toastNotification}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-[#111b21] border-b border-slate-800 px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              WA Master Blast
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                Pro
              </span>
            </h1>
            <p className="text-xs text-slate-400">Broadcast WhatsApp Otomatis</p>
          </div>
        </div>

        {/* User Info / Role */}
        <div className="flex items-center gap-4">
          {currentUserRole === 'customer' && (
            <div className="flex items-center gap-2.5">
              {currentCustomer.tier === 'VVIP' ? (
                <div className="bg-amber-500/20 border border-amber-500/40 text-amber-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-400" /> VVIP (Unlimited)
                </div>
              ) : (
                <div className="bg-[#202c33] border border-slate-700 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2">
                  <span className="text-slate-400">Kuota:</span>
                  <span className="font-bold text-emerald-400">{currentCustomer.quota} Pesan</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 bg-[#202c33] p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => { setCurrentUserRole('customer'); setActiveTab('campaign'); }}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                currentUserRole === 'customer' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Customer
            </button>
            <button
              onClick={() => { setCurrentUserRole('admin'); setActiveTab('admin_monitor'); }}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                currentUserRole === 'admin' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Super Admin
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Sidebar Nav */}
        <aside className="w-64 bg-[#111b21] border-r border-slate-800 p-4 flex flex-col justify-between hidden md:flex">
          <nav className="space-y-1.5">
            {currentUserRole === 'customer' ? (
              <>
                <button
                  onClick={() => setActiveTab('campaign')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'campaign' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:bg-[#202c33]'
                  }`}
                >
                  <Send className="w-4 h-4" /> Buat Campaign Blast
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'history' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:bg-[#202c33]'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" /> Riwayat & Statistik
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('admin_monitor')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'admin_monitor' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:bg-[#202c33]'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" /> Monitoring Admin
                </button>
                <button
                  onClick={() => setActiveTab('admin_settings')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'admin_settings' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' : 'text-slate-400 hover:bg-[#202c33]'
                  }`}
                >
                  <Settings className="w-4 h-4" /> Pengaturan WhatsApp (Scan QR)
                </button>
              </>
            )}
          </nav>

          {/* Status Box di Pojok Kiri Bawah Sidebar */}
          <div className="p-3 bg-[#202c33] rounded-xl border border-slate-700/50 text-xs space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${
                waStatus.status === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`} />
              <span className="font-semibold text-white">Status Nomor Pengirim</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {waStatus.status === 'connected' ? `Terhubung (+${waStatus.phoneNumber})` : 'Belum Terhubung'}
            </p>
          </div>
        </aside>

        {/* Content Body */}
        <main className="flex-1 p-6 overflow-y-auto">
          {currentUserRole === 'admin' ? (
            activeTab === 'admin_settings' ? (
              /* ================= MENU SETTING SCAN QR WHATSAPP ================= */
              <div className="max-w-2xl mx-auto space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-purple-400" /> Pengaturan Gateway WhatsApp
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Hubungkan nomor WhatsApp yang akan digunakan sistem untuk mengirim pesan blast pelanggan.
                  </p>
                </div>

                <div className="bg-[#111b21] p-6 rounded-2xl border border-slate-800 space-y-6">
                  {/* Status Card */}
                  <div className="flex items-center justify-between p-4 bg-[#202c33] rounded-xl border border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        waStatus.status === 'connected' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Status Gateway</p>
                        <p className="text-sm font-bold text-white">
                          {waStatus.status === 'connected' ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              ● Terhubung (+{waStatus.phoneNumber})
                            </span>
                          ) : waStatus.status === 'connecting' ? (
                            <span className="text-amber-400">Sedang Memuat QR...</span>
                          ) : (
                            <span className="text-rose-400">Terputus / Belum Discan</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {waStatus.status === 'connected' ? (
                      <button
                        onClick={handleLogoutWA}
                        className="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-rose-500/30 transition-all flex items-center gap-1.5"
                      >
                        <PowerOff className="w-3.5 h-3.5" /> Putuskan Nomor
                      </button>
                    ) : (
                      <button
                        onClick={handleGenerateNewQR}
                        disabled={isQrLoading}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isQrLoading ? 'animate-spin' : ''}`} />
                        {isQrLoading ? 'Memproses...' : 'Generate QR Baru'}
                      </button>
                    )}
                  </div>

                  {/* Area Gambar QR Code */}
                  {waStatus.status !== 'connected' && (
                    <div className="flex flex-col items-center justify-center p-6 bg-[#202c33]/50 rounded-xl border border-dashed border-slate-700 space-y-4">
                      {waStatus.qrImage ? (
                        <>
                          <div className="p-3 bg-white rounded-2xl shadow-xl">
                            <img src={waStatus.qrImage} alt="QR WhatsApp" className="w-56 h-56" />
                          </div>
                          <div className="text-center space-y-1">
                            <p className="text-xs font-bold text-white">Pindai QR Menggunakan WhatsApp di HP Anda</p>
                            <p className="text-[11px] text-slate-400">
                              Buka WhatsApp di HP &rarr; Titik Tiga &rarr; <strong>Perangkat Tertaut</strong> &rarr; <strong>Tautkan Perangkat</strong>.
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8 space-y-2">
                          <QrCode className="w-12 h-12 text-slate-600 mx-auto" />
                          <p className="text-xs text-slate-400">Belum ada QR Code aktif.</p>
                          <button
                            onClick={handleGenerateNewQR}
                            className="text-xs text-emerald-400 font-bold hover:underline"
                          >
                            Klik di sini untuk membuat QR Code
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {waStatus.status === 'connected' && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-1">
                      <p className="text-xs font-bold text-emerald-400">✅ WhatsApp Siap Digunakan!</p>
                      <p className="text-[11px] text-slate-300">
                        Nomor ini akan otomatis digunakan oleh seluruh pelanggan yang melakukan pengiriman blast pesan.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ================= MONITORING SUPER ADMIN ================= */
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white">Monitoring Member VVIP & Biasa</h2>
                  <p className="text-xs text-slate-400 mt-1">Pantau penggunaan blast dan kuota pelanggan.</p>
                </div>

                <div className="bg-[#111b21] rounded-xl border border-slate-800 overflow-hidden">
                  <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="font-semibold text-sm text-white">Daftar Pengguna</h3>
                    <button
                      onClick={() => setActiveTab('admin_settings')}
                      className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Settings className="w-3.5 h-3.5" /> Pengaturan WhatsApp (Scan QR)
                    </button>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#202c33] text-slate-300">
                      <tr>
                        <th className="p-3">Customer</th>
                        <th className="p-3">Tier</th>
                        <th className="p-3">Status Kuota</th>
                        <th className="p-3">Total Blast</th>
                        <th className="p-3">Berhasil</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {customers.map((c) => (
                        <tr key={c.id}>
                          <td className="p-3">
                            <p className="font-bold text-white">{c.name}</p>
                            <p className="text-[11px] text-slate-400">{c.businessName}</p>
                          </td>
                          <td className="p-3">
                            {c.tier === 'VVIP' ? (
                              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[11px] font-bold">VVIP</span>
                            ) : (
                              <span className="bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded text-[11px]">Biasa</span>
                            )}
                          </td>
                          <td className="p-3">
                            {c.tier === 'VVIP' ? (
                              <span className="text-amber-400 font-bold">Unlimited</span>
                            ) : (
                              <span className="text-emerald-400 font-bold">{c.quota} Pesan</span>
                            )}
                          </td>
                          <td className="p-3 text-white font-semibold">{c.totalSent.toLocaleString()}</td>
                          <td className="p-3 text-emerald-400 font-semibold">{c.totalSuccess.toLocaleString()}</td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => handleToggleTier(c.id)}
                              className="px-2 py-1 rounded text-[10px] font-bold border border-slate-700 bg-slate-800 hover:bg-slate-700"
                            >
                              {c.tier === 'VVIP' ? 'Jadikan Biasa' : 'Jadikan VVIP'}
                            </button>
                            {c.tier === 'Regular' && (
                              <button
                                onClick={() => setSelectedCustomerForQuota(c)}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded text-[11px] font-semibold"
                              >
                                + Kuota
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedCustomerForDetail(c)}
                              className="bg-[#202c33] hover:bg-slate-700 text-slate-200 px-2 py-1 rounded text-[11px] font-semibold"
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : activeTab === 'history' ? (
            /* ================= RIWAYAT CUSTOMER ================= */
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">Riwayat Pengiriman</h2>
              <div className="bg-[#111b21] rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#202c33] text-slate-300">
                    <tr>
                      <th className="p-3">Kampanye</th>
                      <th className="p-3">Tanggal</th>
                      <th className="p-3">Target</th>
                      <th className="p-3">Berhasil</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {currentCustomer.campaigns.map(camp => (
                      <tr key={camp.id}>
                        <td className="p-3 font-bold text-white">{camp.title}</td>
                        <td className="p-3 text-slate-400">{camp.date}</td>
                        <td className="p-3">{camp.target} Nomor</td>
                        <td className="p-3 text-emerald-400 font-bold">{camp.success} Berhasil</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ================= CUSTOMER PORTAL BLAST ================= */
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <button
                  onClick={() => setCampaignStep(1)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${campaignStep === 1 ? 'bg-emerald-600 text-white' : 'bg-[#202c33] text-slate-400'}`}
                >
                  1. Pesan & Multi-Link
                </button>
                <span className="text-slate-600">→</span>
                <button
                  onClick={() => setCampaignStep(2)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${campaignStep === 2 ? 'bg-emerald-600 text-white' : 'bg-[#202c33] text-slate-400'}`}
                >
                  2. Input Nomor ({parsedRecipients.length})
                </button>
                <span className="text-slate-600">→</span>
                <button
                  onClick={() => setCampaignStep(3)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${campaignStep === 3 ? 'bg-emerald-600 text-white' : 'bg-[#202c33] text-slate-400'}`}
                >
                  3. Eksekusi Blast
                </button>
              </div>

              {campaignStep === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-7 space-y-4">
                    <div className="bg-[#111b21] p-4 rounded-xl border border-slate-800 space-y-3">
                      <label className="text-xs font-semibold text-slate-300">Judul Campaign</label>
                      <input
                        type="text"
                        value={campaignTitle}
                        onChange={(e) => setCampaignTitle(e.target.value)}
                        className="w-full bg-[#202c33] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div className="bg-[#111b21] p-4 rounded-xl border border-slate-800 space-y-3">
                      <label className="text-xs font-semibold text-slate-300">Pesan WhatsApp</label>
                      <textarea
                        rows={6}
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        className="w-full bg-[#202c33] border border-slate-700 rounded-lg p-3 text-xs text-white font-mono"
                      />
                    </div>

                    {/* Multi-Link CTA */}
                    <div className="bg-[#111b21] p-4 rounded-xl border border-slate-800 space-y-3">
                      <h3 className="text-xs font-semibold text-white">Multi-Link & CTA</h3>
                      {links.map(link => (
                        <div key={link.id} className="p-3 bg-[#202c33] rounded-lg border border-slate-700 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-300">Link {link.id}</span>
                            <button
                              type="button"
                              onClick={() => toggleLink(link.id)}
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                link.enabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {link.enabled ? 'Aktif' : 'Nonaktif'}
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={link.label}
                              onChange={(e) => updateLink(link.id, 'label', e.target.value)}
                              className="bg-[#111b21] border border-slate-700 rounded px-2 py-1 text-xs text-white"
                            />
                            <input
                              type="text"
                              value={link.url}
                              onChange={(e) => updateLink(link.id, 'url', e.target.value)}
                              className="bg-[#111b21] border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => setCampaignStep(2)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-xs font-bold"
                      >
                        Lanjut: Input Nomor →
                      </button>
                    </div>
                  </div>

                  {/* Simulator Phone */}
                  <div className="lg:col-span-5 flex flex-col items-center">
                    <p className="text-xs text-slate-400 mb-2">Pratinjau Pesan</p>
                    <div className="w-[300px] h-[520px] bg-black rounded-[36px] p-3 shadow-2xl border-4 border-slate-700 flex flex-col overflow-hidden">
                      <div className="w-24 h-3 bg-slate-800 rounded-b-xl mx-auto mb-1"></div>
                      <div className="bg-[#1f2c34] text-white p-2 rounded-t-xl text-xs font-bold">WhatsApp Business</div>
                      <div className="flex-1 bg-[#0b141a] p-2.5 overflow-y-auto space-y-2">
                        <div className="bg-[#005c4b] text-white rounded-lg p-2.5 text-xs whitespace-pre-wrap">
                          {previewMessage}
                        </div>
                        <div className="space-y-1">
                          {links.filter(l => l.enabled).map(l => (
                            <div key={l.id} className="p-2 text-center text-xs font-semibold bg-[#1f2c34] text-emerald-400 rounded-md">
                              {l.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {campaignStep === 2 && (
                <div className="max-w-2xl mx-auto space-y-4">
                  <div className="bg-[#111b21] p-5 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold text-white">Masukkan Nomor Penerima (1 per baris)</h3>
                      <span className="text-xs text-emerald-400 font-bold">{parsedRecipients.length} Nomor</span>
                    </div>
                    <textarea
                      rows={8}
                      value={rawNumbers}
                      onChange={(e) => setRawNumbers(e.target.value)}
                      className="w-full bg-[#202c33] border border-slate-700 rounded-lg p-3 text-xs text-white font-mono"
                    />
                  </div>
                  <div className="flex justify-between">
                    <button onClick={() => setCampaignStep(1)} className="bg-[#202c33] text-white px-4 py-2 rounded-lg text-xs">← Kembali</button>
                    <button onClick={() => setCampaignStep(3)} className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-xs font-bold">Lanjut: Eksekusi Blast →</button>
                  </div>
                </div>
              )}

              {campaignStep === 3 && (
                <div className="space-y-6">
                  <div className="bg-[#111b21] p-5 rounded-xl border border-slate-800 space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-base font-bold text-white">{campaignTitle}</h3>
                        <p className="text-xs text-slate-400">Target: {parsedRecipients.length} Nomor</p>
                      </div>
                      <button
                        onClick={startBlast}
                        disabled={isBlasting}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
                      >
                        <Play className="w-4 h-4" /> Mulai Kirim Sekarang
                      </button>
                    </div>

                    <div className="w-full bg-[#202c33] h-3 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full transition-all" style={{ width: `${blastProgress}%` }} />
                    </div>
                  </div>

                  <div className="bg-[#111b21] p-4 rounded-xl border border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-white">Log Pengiriman</h4>
                    <div className="bg-black/60 p-3 rounded-lg font-mono text-[11px] text-slate-300 h-48 overflow-y-auto space-y-1">
                      {logs.map((log, i) => <div key={i}>{log}</div>)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* MODAL TAMBAH KUOTA MANUAL */}
      {selectedCustomerForQuota && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#111b21] border border-slate-700 rounded-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Tambah Kuota: {selectedCustomerForQuota.name}</h3>
            <input
              type="number"
              value={quotaToAdd}
              onChange={(e) => setQuotaToAdd(e.target.value)}
              className="w-full bg-[#202c33] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setSelectedCustomerForQuota(null)} className="bg-slate-700 text-white px-4 py-2 rounded-lg text-xs">Batal</button>
              <button onClick={() => addQuotaDirectly(selectedCustomerForQuota.id, quotaToAdd)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('wa_token', data.token);
        onLoginSuccess();
      } else {
        setError(data.message || 'Login gagal');
      }
    } catch (err) {
      setError('Gagal menghubungi server');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-md p-8 rounded-2xl shadow-xl text-white">
        <h2 className="text-2xl font-bold text-center mb-2">WA-Dojo Blaster</h2>
        <p className="text-sm text-slate-400 text-center mb-6">Masuk untuk mengelola pesan blast</p>
        
        {error && <div className="bg-red-500/20 border border-red-500 text-red-300 text-sm p-3 rounded-lg mb-4">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
              required 
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-slate-400 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
              required 
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 font-semibold py-2.5 rounded-lg transition-colors mt-2"
          >
            Masuk ke Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}