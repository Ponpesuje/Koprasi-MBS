import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Wallet, LogOut, Plus, ShieldCheck, Printer, 
  CheckCircle, Clock, AlertCircle, TrendingUp, Settings, Key, BookOpen, 
  Scale, FileText, Box, Edit, Trash2, X, PiggyBank, MessageCircle, Menu
} from 'lucide-react';

// GANTI URL DI BAWAH INI DENGAN URL WEB APP MILIK ANDA SENDIRI
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwgNbXLkv-PPJT7RxqNAoyJAsyi2zFdw9EYYpCNkF9-vy61W1KYW6YBEnifW6fL0Snp/exec'; 

const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
const generateId = (prefix) => `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
const SIMPANAN_WAJIB_PER_BULAN = 30000; 

// Pelindung localStorage agar aplikasi tidak blank di browser HP yang ketat (seperti Xiaomi Browser)
const safeStorage = {
  get: (key) => { try { return window.localStorage.getItem(key); } catch(e) { return null; } },
  set: (key, val) => { try { window.localStorage.setItem(key, val); } catch(e) {} },
  remove: (key) => { try { window.localStorage.removeItem(key); } catch(e) {} }
};

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("Aplikasi mendeteksi error:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
          <div className="bg-white p-6 rounded-3xl w-full max-w-md shadow-2xl text-center border-t-8 border-red-500">
             <h2 className="text-xl font-black text-slate-800 mb-2">Sistem Terkendala</h2>
             <p className="text-sm text-slate-500 mb-6 bg-slate-100 p-4 rounded-xl">{this.state.error?.message || "Terjadi kesalahan internal"}</p>
             <button onClick={() => window.location.reload()} className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-bold w-full transition">Muat Ulang Halaman</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainApp() {
  const [users, setUsers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [assets, setAssets] = useState([]);
  
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard'); 
  const [accountingTab, setAccountingTab] = useState('jurnal'); 
  const [savingsYear, setSavingsYear] = useState(new Date().getFullYear()); 
  const [isLoading, setIsLoading] = useState(false);
  const [printInvoice, setPrintInvoice] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [syariahForm, setSyariahForm] = useState({ itemName: '', itemPrice: 0, cashAmount: 0, tenor: 1, margin: 0, adminFee: 20000 });
  const [admSyariahForm, setAdmSyariahForm] = useState({ userId: '', itemName: '', itemPrice: 0, cashAmount: 0, tenor: 1, margin: 0, adminFee: 20000 });
  const [approveLoanData, setApproveLoanData] = useState(null);
  const [approveSyariahData, setApproveSyariahData] = useState({ margin: 0, adminFee: 20000 });
  
  const [editingLoan, setEditingLoan] = useState(null);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [showTrxModal, setShowTrxModal] = useState(false);
  const [trxTypeSelect, setTrxTypeSelect] = useState('IN'); 

  // CUSTOM MODAL STATE (Sangat Penting: Menggantikan alert, confirm, prompt bawaan browser)
  const [modal, setModal] = useState({ isOpen: false, type: 'alert', title: '', message: '', onConfirm: null, inputValue: '' });

  const showAlert = (message, title = 'Informasi') => setModal({ isOpen: true, type: 'alert', message, title, onConfirm: null, inputValue: '' });
  const showConfirm = (message, onConfirm, title = 'Konfirmasi') => setModal({ isOpen: true, type: 'confirm', message, title, onConfirm, inputValue: '' });
  const showPrompt = (message, defaultValue, onConfirm, title = 'Input Diperlukan') => setModal({ isOpen: true, type: 'prompt', message, title, inputValue: defaultValue, onConfirm });

  const TIMEOUT_MS = 10 * 60 * 1000; // 10 Menit

  const handleLogout = () => {
    setCurrentUser(null);
    safeStorage.remove('ksp_user');
    safeStorage.remove('ksp_last_activity');
  };

  useEffect(() => {
    const savedUser = safeStorage.get('ksp_user');
    const lastActivity = safeStorage.get('ksp_last_activity');

    if (savedUser && lastActivity) {
      const now = Date.now();
      if (now - parseInt(lastActivity) > TIMEOUT_MS) {
        handleLogout();
      } else {
        try { setCurrentUser(JSON.parse(savedUser)); } catch(e) {}
        safeStorage.set('ksp_last_activity', now.toString());
      }
    }

    const resetTimer = () => {
      if (safeStorage.get('ksp_user')) {
        safeStorage.set('ksp_last_activity', Date.now().toString());
      }
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('scroll', resetTimer);
    window.addEventListener('touchstart', resetTimer); 

    const intervalId = setInterval(() => {
      const lastAct = safeStorage.get('ksp_last_activity');
      if (lastAct && Date.now() - parseInt(lastAct) > TIMEOUT_MS) {
        handleLogout();
        showAlert("Sesi Anda telah berakhir karena tidak ada aktivitas. Silakan masuk kembali.");
      }
    }, 60000);

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      clearInterval(intervalId);
    };
  }, []);

  // Wrapper aman untuk komunikasi dengan Google Apps Script
  const gasFetch = async (action, data) => {
    try {
      return await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, data }),
        redirect: 'follow'
      });
    } catch (error) {
      console.error("Gagal menghubungi server", error);
      throw error;
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    const ts = new Date().getTime(); // Tambahan Anti-Cache agar browser selalu mengambil data terbaru dari Google Sheet
    try {
      const [uRes, lRes, tRes, aRes] = await Promise.all([
        fetch(`${GAS_URL}?action=getUsers&t=${ts}`).then(r => r.json().catch(()=>[])),
        fetch(`${GAS_URL}?action=getLoans&t=${ts}`).then(r => r.json().catch(()=>[])),
        fetch(`${GAS_URL}?action=getTransactions&t=${ts}`).then(r => r.json().catch(()=>[])),
        fetch(`${GAS_URL}?action=getAssets&t=${ts}`).then(r => r.json().catch(()=>[]))
      ]);
      setUsers(Array.isArray(uRes) ? uRes : []); 
      setLoans(Array.isArray(lRes) ? lRes : []); 
      setTransactions(Array.isArray(tRes) ? tRes : []); 
      setAssets(Array.isArray(aRes) ? aRes : []);
    } catch (err) { 
      showAlert("Gagal sinkronisasi data dengan server. Pastikan URL Apps Script sudah benar."); 
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;
    
    const user = (Array.isArray(users) ? users : []).find(u => u.username == username && u.password == password);
    
    if (user) {
      if(user.status === 'Nonaktif') { showAlert("Akses Ditolak: Akun dinonaktifkan Admin."); return; }
      setCurrentUser(user); 
      setCurrentView('dashboard');
      safeStorage.set('ksp_user', JSON.stringify(user));
      safeStorage.set('ksp_last_activity', Date.now().toString());
    } else { showAlert('Username atau Password salah!'); }
  };

  const isIncome = (type) => {
    if (!type) return false;
    const t = type.toLowerCase();
    return t.includes('penerimaan') || t.includes('pendapatan') || t.includes('simpanan') || t.includes('hibah') || t.includes('pemasukan') || t.includes('modal awal');
  };
  
  let totalKas = 0; let totalPendapatanUsaha = 0; let totalBebanOperasional = 0;
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeLoans = Array.isArray(loans) ? loans : [];
  const safeAssets = Array.isArray(assets) ? assets : [];
  const safeUsers = Array.isArray(users) ? users : [];

  const calcTransactions = [...safeTransactions].sort((a, b) => new Date(a.date) - new Date(b.date)).map(trx => {
    const isTrxIn = isIncome(trx.type);
    totalKas += isTrxIn ? Number(trx.amount) : -Number(trx.amount);
    const t = (trx.type || '').toLowerCase();
    if (t.includes('pendapatan') || t.includes('pemasukan lainnya')) totalPendapatanUsaha += Number(trx.amount);
    if (t.includes('biaya') || t.includes('gaji') || t.includes('pengeluaran')) totalBebanOperasional += Number(trx.amount);
    return { ...trx, isIncome: isTrxIn, currentBalance: totalKas };
  });

  const totalPiutang = safeLoans.filter(l => l.status === 'Aktif').reduce((sum, l) => sum + Number(l.remainingAmount), 0);
  const totalAsetTetap = safeAssets.reduce((sum, a) => sum + Number(a.value), 0);
  const totalAktiva = totalKas + totalPiutang + totalAsetTetap;
  const totalPasiva = totalAktiva;

  const getExpectedSavingsMonths = (joinDateStr, targetYear) => {
    if(!joinDateStr) return { start: 0, end: -1, count: 0 };
    const joinDate = new Date(joinDateStr);
    if (isNaN(joinDate.getTime())) return { start: 0, end: -1, count: 0 }; 

    const joinYear = joinDate.getFullYear();
    const joinMonth = joinDate.getMonth(); 
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth(); 

    if (targetYear < joinYear) return { start: 0, end: -1, count: 0 };
    if (targetYear > currentYear) return { start: 0, end: -1, count: 0 };

    let startMonth = (targetYear === joinYear) ? joinMonth : 0;
    let endMonth = (targetYear === currentYear) ? currentMonth : 11;

    let count = endMonth - startMonth + 1;
    return { start: startMonth, end: endMonth, count: count > 0 ? count : 0 };
  };

  const getMemberSavingsData = (userId, targetYear) => {
    const user = safeUsers.find(u => u.id === userId);
    const expected = getExpectedSavingsMonths(user?.joinDate, targetYear);
    
    // PERBAIKAN UTAMA: Identifikasi tagihan menggunakan referenceId unik (SW-{userId}-...)
    // Ini memastikan sistem tetap mendeteksi ceklis walaupun kolom type/userId di server tidak sinkron
    const userSavingsTrx = safeTransactions.filter(t => t.referenceId && t.referenceId.startsWith(`SW-${userId}-`));
    
    let paidCount = 0; let paidMonthsArray = new Array(12).fill(false);
    userSavingsTrx.forEach(trx => {
      const parts = (trx.referenceId || '').split('-');
      if(parts.length >= 4) {
        const trxYear = parseInt(parts[parts.length - 2]);
        const trxMonth = parseInt(parts[parts.length - 1]) - 1; 
        if (trxYear === targetYear && trxMonth >= 0 && trxMonth <= 11) { paidMonthsArray[trxMonth] = true; paidCount++; }
      }
    });

    let arrearsCount = 0; let unpaidMonthsNames = [];
    const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

    for(let i = expected.start; i <= expected.end; i++) {
      if(!paidMonthsArray[i]) { arrearsCount++; unpaidMonthsNames.push(monthNames[i]); }
    }

    return { 
      paidArray: paidMonthsArray, expectedInfo: expected, paidCount, 
      arrearsAmount: arrearsCount * SIMPANAN_WAJIB_PER_BULAN,
      totalPaidAllTime: userSavingsTrx.reduce((sum, t) => sum + Number(t.amount || 0), 0), unpaidMonthsNames
    };
  };

  const handleToggleSavings = async (user, year, monthIndex, isCurrentlyPaid) => {
    const monthStr = (monthIndex + 1).toString().padStart(2, '0');
    const refId = `SW-${user.id}-${year}-${monthStr}`;
    const monthName = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'][monthIndex];

    if (!isCurrentlyPaid) {
      // OPTIMISTIC UPDATE: Centang langsung muncul agar tidak ada kesan "loading" yang lama
      const newTrx = {
        id: generateId('INV'), date: new Date().toISOString().split('T')[0], type: 'Simpanan Wajib',
        amount: SIMPANAN_WAJIB_PER_BULAN, referenceId: refId, userId: user.id, adminId: currentUser.id
      };
      
      setTransactions(prev => [...prev, newTrx]);

      try {
        await gasFetch('addTransaction', newTrx);
        // fetchData(); dihapus. Biarkan optimistic update bekerja karena Sheet butuh jeda waktu untuk menyimpan.
      } catch (err) { 
        setTransactions(prev => prev.filter(t => t.id !== newTrx.id)); // Rollback jika error
        showAlert("Gagal menyimpan ceklis ke server."); 
      }
    } else {
      showConfirm(`Yakin membatalkan ceklis bulan ${monthName} untuk ${user.name}? Kas sebesar ${formatRp(SIMPANAN_WAJIB_PER_BULAN)} akan ditarik kembali.`, async () => {
         // PERBAIKAN: Penghapusan juga hanya melihat referensi ID agar selalu ditemukan
         const trxToDelete = safeTransactions.find(t => t.referenceId === refId);
         if (trxToDelete) {
           // OPTIMISTIC UPDATE: Centang langsung hilang
           setTransactions(prev => prev.filter(t => t.id !== trxToDelete.id));
           try {
             await gasFetch('deleteTransaction', { id: trxToDelete.id });
             // fetchData(); dihapus agar state optimistic bertahan
           } catch (err) { 
             setTransactions(prev => [...prev, trxToDelete]); // Rollback centang jika gagal
             showAlert("Gagal membatalkan ceklis."); 
           }
         }
      });
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault(); setIsLoading(true);
    const form = e.target;
    if (safeUsers.find(u => u.username === form.username.value)) {
      showAlert("Username sudah terdaftar! Gunakan username lain."); setIsLoading(false); return;
    }
    let phoneRaw = form.phone.value.replace(/[^0-9]/g, '');
    if (phoneRaw.startsWith('0')) phoneRaw = '62' + phoneRaw.substring(1);

    const newMember = {
      id: generateId('ANG'), username: form.username.value, password: '123456', 
      role: 'member', name: form.name.value, phone: phoneRaw,
      joinDate: form.joinDate.value, status: 'Aktif'
    };
    try {
      await gasFetch('addUser', newMember);
      showAlert(`Anggota ${newMember.name} berhasil didaftarkan! (Password default: 123456)`);
      fetchData(); form.reset();
    } catch(err) { showAlert("Gagal mendaftarkan anggota."); }
    setIsLoading(false);
  };

  const renderSyariahAnalysis = (userName, itemName, itemPrice, cash, margin, adminFee, tenor) => {
    const totalItem = itemPrice + margin;
    const totalCash = cash + adminFee;
    const cicilanItem = itemPrice > 0 ? totalItem / (tenor || 1) : 0;
    const cicilanCash = cash > 0 ? totalCash / (tenor || 1) : 0;
    const totalPengajuan = itemPrice + cash;
    
    if(totalPengajuan <= 0) return null;

    return (
      <div className="bg-slate-50 border border-slate-200 p-4 md:p-6 rounded-2xl text-sm space-y-4 shadow-inner">
         <h3 className="font-black text-lg text-slate-800 border-b-2 border-slate-200 pb-2 flex items-center gap-2">📋 HASIL ANALISIS AKAD SYARIAH KOPERASI</h3>
         
         <div className="flex justify-between">
           <span className="font-bold text-slate-500">Nama Pemohon:</span>
           <span className="font-bold text-slate-800">{userName || '...'}</span>
         </div>
         <div className="flex justify-between border-b border-slate-200 pb-2">
           <span className="font-bold text-slate-500">Total Dana yang Diajukan:</span>
           <span className="font-black text-emerald-600 text-lg">{formatRp(totalPengajuan)}</span>
         </div>

         {itemPrice > 0 && (
           <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200">
             <h4 className="font-black text-slate-800 flex items-center gap-2 mb-2">🛒 1. Pembiayaan Barang (Akad Murabahah)</h4>
             <ul className="space-y-1 text-slate-600 text-xs md:text-sm pl-6 list-disc">
               <li><b>Peruntukan:</b> Pembelian {itemName || 'Barang/Jasa'}</li>
               <li><b>Nilai Barang Asli:</b> {formatRp(itemPrice)}</li>
               <li><b>Margin Keuntungan Koperasi:</b> <span className="text-emerald-600 font-bold">{formatRp(margin)}</span></li>
               <li><b>Total Harga Jual Koperasi ke Guru:</b> <span className="font-bold">{formatRp(totalItem)}</span></li>
               <li><b>Status Sifat Angsuran:</b> Tetap (Flat) hingga lunas.</li>
             </ul>
           </div>
         )}

         {cash > 0 && (
           <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200">
             <h4 className="font-black text-slate-800 flex items-center gap-2 mb-2">🤝 {itemPrice > 0 ? '2' : '1'}. Pinjaman Tunai Darurat (Akad Qardh)</h4>
             <ul className="space-y-1 text-slate-600 text-xs md:text-sm pl-6 list-disc">
               <li><b>Peruntukan:</b> Uang Tunai Pegangan / Kebutuhan Bebas</li>
               <li><b>Nilai Pinjaman Pokok:</b> {formatRp(cash)}</li>
               <li><b>Keuntungan Koperasi:</b> Rp0 (Bebas Riba)</li>
               <li><b>Biaya Administrasi Riil Dokumen:</b> {formatRp(adminFee)} (Flat)</li>
               <li><b>Total yang Wajib Dikembalikan:</b> <span className="font-bold">{formatRp(totalCash)}</span></li>
             </ul>
           </div>
         )}

         <div className="bg-slate-900 text-white p-4 rounded-xl shadow-md">
           <h4 className="font-black flex items-center gap-2 mb-3">🧮 3. Resume Skema Angsuran (Tenor: {tenor} Bulan)</h4>
           {itemPrice > 0 && <div className="flex justify-between text-xs md:text-sm text-slate-300 mb-1"><span>Cicilan Murabahah/Bulan:</span> <span>{formatRp(cicilanItem)}</span></div>}
           {cash > 0 && <div className="flex justify-between text-xs md:text-sm text-slate-300 mb-2 border-b border-slate-700 pb-2"><span>Cicilan Qardh/Bulan:</span> <span>{formatRp(cicilanCash)}</span></div>}
           <div className="flex justify-between items-center pt-1">
             <span className="font-bold text-xs md:text-sm text-emerald-400">TOTAL POTONG GAJI / ANGSURAN PER BULAN:</span>
             <span className="font-black text-lg md:text-xl text-white">{formatRp(cicilanItem + cicilanCash)}</span>
           </div>
         </div>
         <p className="text-[10px] text-slate-400 text-justify mt-2 italic">*Catatan Syariah: Seluruh Keuntungan Margin Murabahah akan dimasukkan ke dalam Kas SHU Koperasi yang akan dibagikan kembali ke seluruh guru pada akhir tahun buku.</p>
      </div>
    );
  };

  const parseSyariahDescription = (desc) => {
    if(desc && desc.includes('|~|')) {
      const parts = desc.split('|~|');
      return { itemName: parts[0], itemPrice: Number(parts[1]), cashAmount: Number(parts[2]) };
    }
    return null;
  };

  const handleApplyLoan = async (e) => {
    e.preventDefault(); setIsLoading(true);
    const { itemName, itemPrice, cashAmount, tenor } = syariahForm;
    const principal = Number(itemPrice) + Number(cashAmount);
    
    if(principal <= 0) { showAlert("Nominal pengajuan tidak valid!"); setIsLoading(false); return; }

    const scoring = getCreditScore(currentUser.id);
    if(principal > scoring.limit) { showAlert(`Maaf, limit maksimal Anda adalah ${formatRp(scoring.limit)}`); setIsLoading(false); return; }

    const typeDesc = (itemPrice > 0 && cashAmount > 0) ? 'Hybrid (Murabahah & Qardh)' : (itemPrice > 0 ? 'Murabahah' : 'Qardh');
    const secretDescription = `${itemName || 'Barang'}|~|${itemPrice}|~|${cashAmount}`;

    const newLoan = {
      id: generateId('AKD'), userId: currentUser.id, type: typeDesc, description: secretDescription, 
      principal: principal, margin: 0, total: principal, tenor: parseInt(tenor),
      installment: 0, paidAmount: 0, remainingAmount: 0, status: 'Pending', date: new Date().toISOString().split('T')[0]
    };
    
    try {
      await gasFetch('addLoan', newLoan);
      showAlert("Pengajuan terkirim! Menunggu analisis Admin."); 
      setSyariahForm({ itemName: '', itemPrice: 0, cashAmount: 0, tenor: 1, margin: 0, adminFee: 20000 });
      fetchData(); 
    } catch(err) { showAlert("Gagal mengajukan!"); }
    setIsLoading(false);
  };

  const handleOfflineLoan = async (e) => {
    e.preventDefault(); setIsLoading(true);
    const { userId, itemName, itemPrice, cashAmount, tenor, margin, adminFee } = admSyariahForm;
    const principal = Number(itemPrice) + Number(cashAmount);
    const totalMargin = (itemPrice > 0 ? Number(margin) : 0) + (cashAmount > 0 ? Number(adminFee) : 0);
    const totalAmount = principal + totalMargin;

    if(!userId || principal <= 0) { showAlert("Data tidak lengkap!"); setIsLoading(false); return; }

    const typeDesc = (itemPrice > 0 && cashAmount > 0) ? 'Hybrid (Murabahah & Qardh)' : (itemPrice > 0 ? 'Murabahah' : 'Qardh');
    const displayDesc = (itemPrice > 0 ? itemName : '') + (cashAmount > 0 ? (itemPrice > 0 ? ' + ' : '') + 'Pinjaman Tunai' : '');

    const newLoan = {
      id: generateId('AKD'), userId: userId, type: typeDesc, description: displayDesc || 'Hybrid Akad',
      principal: principal, margin: totalMargin, total: totalAmount, tenor: parseInt(tenor), 
      installment: totalAmount / parseInt(tenor), paidAmount: 0, remainingAmount: totalAmount, status: 'Aktif', date: new Date().toISOString().split('T')[0],
      netDisbursed: principal
    };
    
    const disbursementTrx = {
      id: generateId('OUT'), date: newLoan.date, type: 'Pencairan Akad', amount: principal, 
      referenceId: `CAIR-${newLoan.id}`, userId: newLoan.userId, adminId: currentUser.id
    };

    try {
      await gasFetch('addLoan', newLoan);
      await gasFetch('addTransaction', disbursementTrx);
      showAlert("Akad Hybrid Aktif & Kas terpotong untuk pencairan!"); 
      setAdmSyariahForm({ userId: '', itemName: '', itemPrice: 0, cashAmount: 0, tenor: 1, margin: 0, adminFee: 20000 });
      fetchData(); 
    } catch(err) { showAlert("Gagal menyimpan akad manual!"); }
    setIsLoading(false);
  };

  const handleProcessApproval = async (e) => {
    e.preventDefault(); setIsLoading(true);
    
    const parsed = parseSyariahDescription(approveLoanData.description);
    if(!parsed) { showAlert("Data pengajuan lawas tidak didukung kalkulator baru."); setIsLoading(false); return; }

    const principal = parsed.itemPrice + parsed.cashAmount;
    const totalMargin = (parsed.itemPrice > 0 ? Number(approveSyariahData.margin) : 0) + (parsed.cashAmount > 0 ? Number(approveSyariahData.adminFee) : 0);
    const totalAmount = principal + totalMargin;
    
    const existingActiveLoan = safeLoans.find(l => l.userId === approveLoanData.userId && l.status === 'Aktif');
    const calculatedNetDisburse = existingActiveLoan ? (principal - Number(existingActiveLoan.remainingAmount)) : principal;
    const displayDesc = (parsed.itemPrice > 0 ? parsed.itemName : '') + (parsed.cashAmount > 0 ? (parsed.itemPrice > 0 ? ' + ' : '') + 'Pinjaman Tunai' : '');

    const updatedLoan = {
      ...approveLoanData, description: displayDesc || 'Hybrid Akad', principal: principal, margin: totalMargin, total: totalAmount, 
      paidAmount: 0, remainingAmount: totalAmount, installment: totalAmount / Number(approveLoanData.tenor || 1), 
      status: 'Aktif', date: new Date().toISOString().split('T')[0], netDisbursed: calculatedNetDisburse > 0 ? calculatedNetDisburse : 0
    };

    try {
      if (existingActiveLoan) {
        const payload = {
          oldLoanId: existingActiveLoan.id, payoffAmount: existingActiveLoan.remainingAmount, newLoan: updatedLoan, 
          trxId: generateId('TRX'), date: updatedLoan.date, userId: existingActiveLoan.userId, adminId: currentUser.id
        };
        await gasFetch('approveTopUp', payload);
        
        if(calculatedNetDisburse > 0) {
           await gasFetch('addTransaction', {
             id: generateId('OUT'), date: updatedLoan.date, type: 'Pencairan Top-Up', amount: calculatedNetDisburse, 
             referenceId: `CAIR-${updatedLoan.id}`, userId: updatedLoan.userId, adminId: currentUser.id
           });
        }
        showAlert("Top-Up Disetujui! Jurnal kas telah diperbarui otomatis.");
      } else {
        await gasFetch('updateLoan', updatedLoan);
        await gasFetch('addTransaction', {
            id: generateId('OUT'), date: updatedLoan.date, type: 'Pencairan Akad', amount: principal, 
            referenceId: `CAIR-${updatedLoan.id}`, userId: updatedLoan.userId, adminId: currentUser.id
        });
        showAlert("Pengajuan disetujui, Akad Berjalan, dan Kas dipotong!");
      }
      setApproveLoanData(null); fetchData();
    } catch(err) { showAlert("Gagal memproses persetujuan!"); }
    setIsLoading(false);
  };

  const handleRejectLoan = () => {
    showConfirm('Yakin menolak pengajuan ini? Data tidak akan bisa dikembalikan.', async () => {
        setIsLoading(true);
        const updatedLoan = { ...approveLoanData, status: 'Ditolak' };
        try {
          await gasFetch('updateLoan', updatedLoan);
          showAlert("Pengajuan telah ditolak.");
          setApproveLoanData(null); fetchData();
        } catch(err) { showAlert("Gagal menolak pengajuan."); }
        setIsLoading(false);
    });
  };

  const getCreditScore = (userId) => {
    const lunasCount = safeLoans.filter(l => l.userId === userId && l.status === 'Lunas').length;
    let limit = 5000000; let tier = "Anggota Standar";
    if (lunasCount >= 2) { limit = 10000000; tier = "Anggota Teladan"; }
    if (lunasCount >= 5) { limit = 25000000; tier = "Anggota Prioritas"; }
    return { lunasCount, limit, tier };
  };

  const handleEditLoan = async (e) => {
    e.preventDefault(); setIsLoading(true);
    const form = e.target;
    const updatedLoan = {
      ...editingLoan, description: form.description.value,
      total: parseFloat(form.total.value), remainingAmount: parseFloat(form.remaining.value), status: form.status.value
    };
    try {
      await gasFetch('editLoan', updatedLoan);
      showAlert("Akad berhasil diperbarui!"); fetchData(); setEditingLoan(null);
    } catch(err) { showAlert("Gagal memperbarui akad."); }
    setIsLoading(false);
  };

  const handleDeleteLoan = (loanOrId) => {
    const loanId = typeof loanOrId === 'object' ? loanOrId.id : loanOrId;
    if (!loanId) return;
    
    showConfirm('PERINGATAN: Yakin menghapus akad ini secara permanen?', async () => {
        setIsLoading(true);
        try {
          await gasFetch('deleteLoan', { id: loanId });
          await fetchData();
          showAlert("Akad berhasil dihapus.");
        } catch (error) {
          showAlert("Gagal menghapus pinjaman.");
        } 
        setIsLoading(false);
    });
  };

  const handlePayInstallment = (loan) => {
    showPrompt(`SETORAN CICILAN (Akad ${loan.id})\nAngsuran standar: ${formatRp(loan.installment)}`, loan.installment.toString(), async (amountStr) => {
        if (!amountStr) return;
        const parsedAmount = parseFloat(amountStr.replace(/[^0-9.-]+/g,""));
        if (isNaN(parsedAmount) || parsedAmount <= 0) { showAlert("Format nominal tidak valid!"); return; }

        setIsLoading(true);
        const currentRemaining = Number(loan.remainingAmount || 0);
        const newRemaining = currentRemaining - parsedAmount;
        
        const newTrx = {
          id: generateId('INV'), date: new Date().toISOString().split('T')[0], type: 'Penerimaan Angsuran',
          amount: parsedAmount, referenceId: loan.id, userId: loan.userId, adminId: currentUser.id
        };
        const updatedLoan = {
          ...loan, remainingAmount: newRemaining < 0 ? 0 : newRemaining,
          paidAmount: Number(loan.paidAmount || 0) + parsedAmount, status: newRemaining <= 0 ? 'Lunas' : 'Aktif'
        };

        try {
          await gasFetch('addTransaction', newTrx);
          await gasFetch('updateLoan', updatedLoan);
          showAlert("Cicilan berhasil dicatat & Sisa hutang terpotong!"); setPrintInvoice(newTrx); fetchData(); 
        } catch (err) { showAlert("Gagal memproses pembayaran."); }
        setIsLoading(false);
    });
  };

  const handleManualTrx = async (e) => {
    e.preventDefault(); setIsLoading(true);
    const form = e.target;
    const newTrx = {
      id: generateId('TRX'), date: form.date.value, type: form.type.value, amount: parseFloat(form.amount.value),
      referenceId: form.description.value, userId: 'Internal', adminId: currentUser.id
    };
    try {
      await gasFetch('addTransaction', newTrx);
      showAlert("Transaksi Kas Berhasil Dicatat!"); fetchData(); setShowTrxModal(false);
    } catch (err) {}
    setIsLoading(false);
  };

  const handleResetPassword = () => { showAlert('Silakan ganti di menu Pengaturan Akun.'); };
  const handleToggleMember = () => { showAlert('Fungsi ubah status disimulasikan.'); };
  const handleChangePassword = (e) => { e.preventDefault(); showAlert('Fungsi ubah password disimulasikan.'); };
  const handleSaveAsset = (e) => { e.preventDefault(); showAlert('Fungsi simpan aset disimulasikan.'); setShowAssetModal(false); };
  const handleDeleteAsset = () => { showAlert('Fungsi hapus aset disimulasikan.'); };

  const navigate = (view) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false); 
  };

  if (!currentUser) return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative">
        <form onSubmit={handleLogin} className="bg-white p-10 rounded-2xl shadow-xl max-w-sm w-full border-t-8 border-emerald-600 mx-4 relative z-10">
          <ShieldCheck className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-center text-slate-800 mb-6">Sistem Koperasi</h2>
          <input name="username" placeholder="Username / ID" required className="w-full mb-4 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          <input name="password" type="password" placeholder="Password" required className="w-full mb-6 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-emerald-700 transition">Masuk</button>
          <div className="text-center mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-bold">&copy; {new Date().getFullYear()} Permana Corp.</p>
          </div>
        </form>
        {/* MODAL GLOBAL DI HALAMAN LOGIN */}
        {modal.isOpen && (
           <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
             <div className="bg-white p-6 rounded-3xl max-w-sm w-full shadow-2xl">
               <h3 className="font-bold text-lg mb-2">{modal.title}</h3>
               <p className="text-slate-600 mb-6">{modal.message}</p>
               <button onClick={() => setModal({...modal, isOpen:false})} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700">Tutup</button>
             </div>
           </div>
        )}
      </div>
  );

  if (printInvoice) {
    const loanRef = safeLoans.find(l => l.id === printInvoice.referenceId);
    const memberRef = safeUsers.find(u => u.id === printInvoice.userId);
    return (
      <div className="p-8 max-w-md mx-auto bg-white min-h-screen">
        <div className="text-center mb-6 border-b-2 border-dashed border-slate-400 pb-4">
          <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto mb-2 no-print" />
          <h1 className="text-2xl font-bold">Koperasi MBS</h1>
          <p className="text-sm font-medium text-slate-500">Tanda Terima Pembayaran</p>
        </div>
        <div className="space-y-3 text-sm mb-8 text-slate-700">
          <div className="flex justify-between border-b pb-2"><span>No. Referensi:</span> <b>{printInvoice.id}</b></div>
          <div className="flex justify-between border-b pb-2"><span>Tanggal:</span> <b>{printInvoice.date}</b></div>
          <div className="flex justify-between border-b pb-2"><span>Terima Dari:</span> <b>{memberRef?.name || 'Umum'}</b></div>
          <div className="flex justify-between border-b pb-2"><span>ID Akad / Ref:</span> <b>{printInvoice.referenceId}</b></div>
          <div className="flex justify-between text-xl mt-6 pt-4 border-t-2 border-slate-800">
            <span className="font-bold">Total Diterima:</span> <b className="text-emerald-700">{formatRp(printInvoice.amount)}</b>
          </div>
          {loanRef && <div className="text-right mt-2 text-xs text-red-600">Sisa Tagihan Akad: {formatRp(loanRef.remainingAmount)}</div>}
        </div>
        <div className="no-print space-y-4">
          <button onClick={() => window.print()} className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg"><Printer/> Cetak Struk</button>
          <button onClick={() => setPrintInvoice(null)} className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-bold">Tutup</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 flex-col md:flex-row relative overflow-hidden">
      
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* SIDEBAR */}
      <aside className={`w-64 bg-slate-900 text-slate-300 flex flex-col no-print shadow-xl min-h-screen fixed md:sticky top-0 z-50 transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center gap-3">
          <div className="flex items-center gap-3">
             <ShieldCheck className="w-8 h-8 text-emerald-500" />
             <div><h1 className="font-bold text-white leading-tight">KSP MBS</h1><p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Enterprise Core</p></div>
          </div>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}><X className="w-6 h-6"/></button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 mt-2 overflow-y-auto">
          <button onClick={() => navigate('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${currentView === 'dashboard' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800'}`}><LayoutDashboard className="w-5 h-5"/> Ikhtisar</button>
          
          {currentUser.role === 'admin' && (
             <>
               <p className="text-[10px] font-bold text-slate-500 uppercase px-4 mt-6 mb-2">Operasional</p>
               <button onClick={() => navigate('members')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${currentView === 'members' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800'}`}><Users className="w-5 h-5"/> Data Anggota</button>
               <button onClick={() => navigate('savings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${currentView === 'savings' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800'}`}><PiggyBank className="w-5 h-5"/> Simpanan Anggota</button>
               <button onClick={() => navigate('loans')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${currentView === 'loans' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800'}`}><Wallet className="w-5 h-5"/> Manajemen Akad</button>
               <button onClick={() => navigate('assets')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${currentView === 'assets' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800'}`}><Box className="w-5 h-5"/> Inventaris & Aset</button>
               
               <p className="text-[10px] font-bold text-slate-500 uppercase px-4 mt-6 mb-2">Keuangan & Laporan</p>
               <button onClick={() => navigate('accounting')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${currentView === 'accounting' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800'}`}><BookOpen className="w-5 h-5"/> Laporan Keuangan</button>
             </>
          )}
          
          <p className="text-[10px] font-bold text-slate-500 uppercase px-4 mt-6 mb-2">Akun Saya</p>
          <button onClick={() => navigate('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${currentView === 'settings' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800'}`}><Settings className="w-5 h-5"/> Pengaturan</button>
        </nav>
        
        <div className="p-4 bg-slate-950 flex flex-col gap-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center font-bold text-white shrink-0">{currentUser.name?.charAt(0) || 'A'}</div>
            <div className="overflow-hidden"><p className="text-white text-sm font-bold truncate">{currentUser.name}</p><p className="text-xs text-slate-500 capitalize">{currentUser.role}</p></div>
          </div>
          <button onClick={handleLogout} className="w-full py-2 bg-slate-800 hover:bg-red-900/50 hover:text-red-400 text-slate-400 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition"><LogOut className="w-4 h-4"/> Logout</button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 h-screen overflow-y-auto bg-slate-50">
        
        <div className="p-4 md:p-8 no-print border-b border-slate-200 bg-white sticky top-0 z-30 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
             <button className="md:hidden p-2 bg-slate-100 rounded-lg text-slate-600" onClick={() => setIsMobileMenuOpen(true)}><Menu className="w-5 h-5"/></button>
             <h2 className="text-lg md:text-2xl font-black text-slate-800 hidden sm:block">
               {currentView === 'dashboard' && 'Dashboard Interaktif'}
               {currentView === 'members' && 'Manajemen Keanggotaan'}
               {currentView === 'savings' && 'Simpanan Bulanan'}
               {currentView === 'loans' && 'Manajemen & Analisis Akad'}
               {currentView === 'assets' && 'Inventaris & Aset Koperasi'}
               {currentView === 'accounting' && 'Akuntansi & Laporan Keuangan'}
               {currentView === 'settings' && 'Pengaturan Akun'}
             </h2>
          </div>
          <button onClick={fetchData} className="px-3 md:px-4 py-2 bg-slate-100 rounded-lg text-xs md:text-sm font-bold text-slate-600 hover:bg-slate-200 flex gap-2 items-center">
            {isLoading ? '🔄 Sedang...' : '🔄 Sinkron'}
          </button>
        </div>

        <div className="p-4 md:p-8">
            
            {/* ADMIN DASHBOARD */}
            {currentView === 'dashboard' && currentUser.role === 'admin' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                   <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-blue-500"><p className="text-xs md:text-sm font-bold text-slate-500 uppercase">Kas Sistem (Liquid)</p><h3 className="text-2xl md:text-3xl font-black mt-2 text-slate-800">{formatRp(totalKas)}</h3></div>
                   <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-amber-500"><p className="text-xs md:text-sm font-bold text-slate-500 uppercase">Total Piutang Berjalan</p><h3 className="text-2xl md:text-3xl font-black mt-2 text-slate-800">{formatRp(totalPiutang)}</h3></div>
                   <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-emerald-500"><p className="text-xs md:text-sm font-bold text-slate-500 uppercase">Pengajuan Akad Baru</p><h3 className="text-2xl md:text-3xl font-black mt-2 text-slate-800">{safeLoans.filter(l => l.status === 'Pending').length} Pending</h3></div>
                </div>
                <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white flex justify-between items-center shadow-xl relative overflow-hidden">
                  <div className="z-10 relative">
                    <h2 className="text-xl md:text-2xl font-bold mb-2">Selamat Bekerja, Admin {currentUser.name}!</h2>
                    <p className="text-slate-300 text-xs md:text-sm max-w-xl">Laporan keuangan diekstrak secara otomatis. Catat penerimaan/pengeluaran tambahan di Menu Laporan agar Jurnal Kas tetap seimbang.</p>
                  </div>
                  <TrendingUp className="w-32 h-32 text-slate-700 opacity-50 absolute -right-6 -bottom-6 z-0" />
                </div>
              </div>
            )}

            {currentView === 'members' && currentUser.role === 'admin' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
                  <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-emerald-600"/> Pendaftaran Anggota</h3>
                  <form onSubmit={handleAddMember} className="space-y-4">
                    <div><label className="text-xs font-bold text-slate-500">Nama Lengkap</label><input name="name" required className="w-full mt-1 border border-slate-300 p-3 rounded-lg outline-none" /></div>
                    <div><label className="text-xs font-bold text-slate-500">Nomor WhatsApp</label><input name="phone" type="tel" required placeholder="0812..." className="w-full mt-1 border border-slate-300 p-3 rounded-lg outline-none" /></div>
                    <div><label className="text-xs font-bold text-slate-500">Tanggal Bergabung</label><input name="joinDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full mt-1 border border-slate-300 p-3 rounded-lg outline-none" /></div>
                    <div><label className="text-xs font-bold text-slate-500">Username Login</label><input name="username" required className="w-full mt-1 border border-slate-300 p-3 rounded-lg outline-none" /></div>
                    <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-xs font-medium border border-amber-100 flex gap-2"><AlertCircle className="w-4 h-4 shrink-0"/> Password default: <b>123456</b></div>
                    <button type="submit" disabled={isLoading} className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800">Daftarkan Anggota Baru</button>
                  </form>
                </div>

                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                   <h3 className="font-bold text-slate-800 text-lg p-6 border-b border-slate-100 bg-slate-50">Daftar Anggota Koperasi</h3>
                   <div className="overflow-x-auto w-full">
                     <table className="w-full text-left text-sm min-w-[500px]">
                       <thead className="bg-white text-slate-500 border-b border-slate-200"><tr><th className="p-4 font-bold">Info Anggota</th><th className="p-4 font-bold text-center">Status</th><th className="p-4 font-bold text-right">Aksi</th></tr></thead>
                       <tbody className="divide-y divide-slate-50">
                         {safeUsers.filter(u => u.role === 'member').map(u => (
                           <tr key={u.id} className="hover:bg-slate-50">
                             <td className="p-4">
                               <p className="font-bold text-slate-800">{u.name}</p>
                               <p className="text-xs text-slate-500">User: {u.username} | WA: {u.phone || '-'}</p>
                               <p className="text-[10px] font-mono text-slate-400 mt-1">Join: {u.joinDate}</p>
                             </td>
                             <td className="p-4 text-center"><span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${u.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{u.status}</span></td>
                             <td className="p-4 text-right space-x-2 whitespace-nowrap">
                               <button onClick={() => handleResetPassword(u)} className="text-xs font-bold px-3 py-2 rounded border border-amber-200 text-amber-600 hover:bg-amber-50">Reset Sandi</button>
                               <button onClick={() => handleToggleMember(u)} className={`text-xs font-bold px-3 py-2 rounded border ${u.status === 'Aktif' ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>{u.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}</button>
                             </td>
                           </tr>
                         )).reverse()}
                       </tbody>
                     </table>
                   </div>
                </div>
              </div>
            )}

            {currentView === 'savings' && currentUser.role === 'admin' && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 md:p-8">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-slate-100 pb-4 gap-4">
                    <div>
                      <h2 className="text-xl font-black text-slate-800">Manajemen Simpanan Wajib Anggota</h2>
                      <p className="text-sm text-slate-500 mt-1">Tagihan Per Bulan: <b className="text-emerald-700">{formatRp(SIMPANAN_WAJIB_PER_BULAN)}</b></p>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200 w-full md:w-auto">
                       <label className="text-sm font-bold text-slate-500 pl-2">Tahun Buku:</label>
                       <select value={savingsYear} onChange={(e) => setSavingsYear(parseInt(e.target.value))} className="flex-1 bg-white border border-slate-300 p-2 rounded-lg font-bold outline-none text-slate-800">
                         {[...Array(5)].map((_, i) => { const yr = new Date().getFullYear() - i; return <option key={yr} value={yr}>{yr}</option> })}
                       </select>
                    </div>
                 </div>

                 <div className="overflow-x-auto w-full relative">
                    <table className="w-full text-left text-sm whitespace-nowrap min-w-[1000px]">
                       <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-200">
                          <tr>
                            <th className="p-4 font-bold sticky left-0 bg-slate-50 z-10 border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Nama Anggota</th>
                            <th className="p-4 font-bold text-center border-r border-slate-200 w-32">Status Tunggakan</th>
                            {['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'].map(m => ( <th key={m} className="p-4 font-bold text-center w-16 border-r border-slate-100">{m}</th> ))}
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {safeUsers.filter(u => u.role === 'member').map(user => {
                            const data = getMemberSavingsData(user.id, savingsYear);
                            
                            const waMessage = data.arrearsAmount > 0 
                              ? encodeURIComponent(`Halo ${user.name},\n\nMengingatkan bahwa Anda memiliki tunggakan Simpanan Wajib (Koperasi MBS) sebesar *${formatRp(data.arrearsAmount)}*.\n\nDetail Bulan Belum Bayar (${savingsYear}):\n- ${data.unpaidMonthsNames.join('\n- ')}\n\nMohon untuk segera melakukan pembayaran. Terima kasih.`)
                              : encodeURIComponent(`Halo ${user.name},\n\nTerima kasih banyak! Pembayaran Simpanan Wajib Anda telah kami terima. Saat ini Anda *Bebas Tunggakan*.\n\nSemoga berkah selalu.`);

                            return (
                               <tr key={user.id} className="hover:bg-slate-50">
                                  <td className="p-4 sticky left-0 bg-white z-10 border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                                     <p className="font-bold text-slate-800 truncate max-w-[150px]">{user.name}</p>
                                     <p className="text-[10px] text-slate-400 font-mono">Join: {user.joinDate || '-'}</p>
                                  </td>
                                  <td className="p-4 text-center border-r border-slate-200 bg-slate-50/50">
                                     <span className={`font-black block text-xs md:text-sm ${data.arrearsAmount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                       {data.arrearsAmount > 0 ? formatRp(data.arrearsAmount) : 'LUNAS'}
                                     </span>
                                     {user.phone && (
                                        <a href={`https://wa.me/${user.phone}?text=${waMessage}`} target="_blank" rel="noopener noreferrer" className={`mt-2 mx-auto w-fit flex items-center justify-center gap-1 text-white text-[10px] py-1.5 px-3 rounded-full transition font-bold shadow-sm ${data.arrearsAmount > 0 ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
                                           <MessageCircle className="w-3 h-3"/> {data.arrearsAmount > 0 ? 'Tagih WA' : 'Kirim Struk WA'}
                                        </a>
                                     )}
                                  </td>
                                  {data.paidArray.map((isPaid, idx) => (
                                     <td key={idx} className="p-2 text-center border-r border-slate-50 relative group">
                                        <input 
                                          type="checkbox"
                                          checked={isPaid}
                                          onChange={() => handleToggleSavings(user, savingsYear, idx, isPaid)}
                                          className="w-5 h-5 cursor-pointer accent-emerald-600 rounded-md shadow-sm border-slate-300"
                                          title={isPaid ? "Klik untuk membatalkan" : "Klik untuk menandai lunas"}
                                        />
                                     </td>
                                  ))}
                               </tr>
                            )
                         })}
                       </tbody>
                    </table>
                 </div>
              </div>
            )}

            {currentView === 'assets' && currentUser.role === 'admin' && (
              <div className="bg-white p-4 md:p-8 rounded-3xl shadow-sm border border-slate-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                   <h2 className="text-xl font-black text-slate-800">Manajemen Aset & Inventaris</h2>
                   <button onClick={() => {setEditingAsset(null); setShowAssetModal(true);}} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-md w-full md:w-auto justify-center">
                     <Plus className="w-4 h-4"/> Tambah Aset
                   </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
                   <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl"><p className="text-xs font-bold text-blue-500 uppercase">Total Item Aset</p><p className="text-2xl md:text-3xl font-black text-slate-800">{safeAssets.length}</p></div>
                   <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl"><p className="text-xs font-bold text-emerald-600 uppercase">Total Valuasi Aset</p><p className="text-2xl md:text-3xl font-black text-slate-800">{formatRp(totalAsetTetap)}</p></div>
                </div>
                <div className="overflow-x-auto w-full">
                    <table className="w-full text-left text-sm min-w-[500px]">
                        <thead><tr className="bg-slate-50 text-slate-500 uppercase text-xs">
                            <th className="p-4 font-bold border-y">Nama Aset</th><th className="p-4 font-bold border-y">Kategori</th><th className="p-4 font-bold border-y text-right">Nilai Aset (Rp)</th><th className="p-4 font-bold text-center border-y">Aksi</th>
                        </tr></thead>
                        <tbody className="divide-y divide-slate-100">
                           {safeAssets.length === 0 ? <tr><td colSpan="4" className="p-8 text-center text-slate-400">Belum ada aset.</td></tr> :
                           safeAssets.map(ast => (
                              <tr key={ast.id} className="hover:bg-slate-50">
                                 <td className="p-4 font-bold text-slate-800">{ast.name}</td>
                                 <td className="p-4 text-slate-600"><span className="bg-slate-200 px-2 py-1 rounded text-xs font-bold">{ast.category}</span></td>
                                 <td className="p-4 text-right font-black text-emerald-600">{formatRp(ast.value)}</td>
                                 <td className="p-4 text-center flex justify-center gap-2">
                                   <button onClick={() => {setEditingAsset(ast); setShowAssetModal(true);}} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition"><Edit className="w-4 h-4"/></button>
                                   <button onClick={() => handleDeleteAsset(ast.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"><Trash2 className="w-4 h-4"/></button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                    </table>
                </div>
              </div>
            )}

            {currentView === 'loans' && currentUser.role === 'admin' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                 
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
                    <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-emerald-600"/> Kalkulator Input Syariah</h3>
                    <p className="text-xs text-slate-500 mb-4">Kas koperasi akan otomatis terpotong saat disubmit.</p>
                    
                    <form onSubmit={handleOfflineLoan} className="space-y-4">
                       <select value={admSyariahForm.userId} onChange={(e)=>setAdmSyariahForm({...admSyariahForm, userId: e.target.value})} required className="w-full border p-3 rounded-lg outline-none text-sm"><option value="">Pilih Anggota...</option>{safeUsers.filter(u=>u.role==='member').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select>
                       
                       <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                         <p className="text-xs font-bold text-blue-800 mb-2">1. Kebutuhan Murabahah (Barang/Jasa)</p>
                         <input placeholder="Nama Barang (Cth: Laptop)" value={admSyariahForm.itemName} onChange={(e)=>setAdmSyariahForm({...admSyariahForm, itemName: e.target.value})} className="w-full border p-2 mb-2 rounded-lg text-sm outline-none" />
                         <input type="number" placeholder="Harga Barang Asli (Rp)" value={admSyariahForm.itemPrice || ''} onChange={(e)=>setAdmSyariahForm({...admSyariahForm, itemPrice: Number(e.target.value)})} className="w-full border p-2 mb-2 rounded-lg text-sm outline-none font-bold" />
                         <input type="number" placeholder="Margin Keuntungan (Rp)" value={admSyariahForm.margin || ''} onChange={(e)=>setAdmSyariahForm({...admSyariahForm, margin: Number(e.target.value)})} className="w-full border p-2 rounded-lg text-sm outline-none font-bold" />
                       </div>

                       <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                         <p className="text-xs font-bold text-amber-800 mb-2">2. Kebutuhan Qardh (Tunai Bebas)</p>
                         <input type="number" placeholder="Nominal Pinjaman Tunai (Rp)" value={admSyariahForm.cashAmount || ''} onChange={(e)=>setAdmSyariahForm({...admSyariahForm, cashAmount: Number(e.target.value)})} className="w-full border p-2 mb-2 rounded-lg text-sm outline-none font-bold" />
                         <input type="number" placeholder="Biaya Admin Riil (Cth: 20000)" value={admSyariahForm.adminFee || ''} onChange={(e)=>setAdmSyariahForm({...admSyariahForm, adminFee: Number(e.target.value)})} className="w-full border p-2 rounded-lg text-sm outline-none font-bold" />
                       </div>

                       <div>
                         <label className="text-xs font-bold text-slate-500">Tenor Cicilan (Bulan)</label>
                         <input type="number" min="1" required value={admSyariahForm.tenor} onChange={(e)=>setAdmSyariahForm({...admSyariahForm, tenor: Number(e.target.value)})} className="w-full border p-3 rounded-lg text-sm outline-none font-bold mt-1" />
                       </div>
                       
                       {renderSyariahAnalysis(
                          safeUsers.find(u => u.id === admSyariahForm.userId)?.name || '...', 
                          admSyariahForm.itemName, admSyariahForm.itemPrice, admSyariahForm.cashAmount, 
                          admSyariahForm.margin, admSyariahForm.adminFee, admSyariahForm.tenor
                       )}

                       <button type="submit" disabled={isLoading || (admSyariahForm.itemPrice===0 && admSyariahForm.cashAmount===0)} className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 disabled:opacity-50">Sahkan & Cairkan</button>
                    </form>
                 </div>

                 <div className="lg:col-span-2 space-y-6 md:space-y-8 overflow-hidden w-full">
                    {safeLoans.filter(l => l.status === 'Pending').length > 0 && (
                      <div className="bg-white rounded-2xl shadow-sm border-2 border-amber-200 overflow-hidden">
                        <div className="bg-amber-50 p-4 md:p-5 flex items-center justify-between border-b border-amber-200">
                          <h3 className="font-bold text-amber-800 flex items-center gap-2"><Clock className="w-5 h-5"/> Menunggu Evaluasi</h3>
                        </div>
                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-left text-sm min-w-[400px]">
                              <tbody className="divide-y divide-slate-100">
                                {safeLoans.filter(l => l.status === 'Pending').map(loan => {
                                  const parsed = parseSyariahDescription(loan.description);
                                  const displayTitle = parsed ? ((parsed.itemPrice > 0 ? parsed.itemName : '') + (parsed.cashAmount > 0 ? (parsed.itemPrice > 0 ? ' + ' : '') + 'Tunai' : '')) : loan.description;
                                  
                                  return (
                                  <tr key={loan.id} className="bg-white hover:bg-slate-50">
                                    <td className="p-4 md:p-5">
                                      <p className="font-bold text-slate-800">{safeUsers.find(u => u.id == loan.userId)?.name}</p>
                                      <p className="text-xs text-slate-500">{loan.type} | {displayTitle}</p>
                                    </td>
                                    <td className="p-4 md:p-5 font-black text-slate-800">{formatRp(loan.principal)}</td>
                                    <td className="p-4 md:p-5 text-right"><button onClick={() => setApproveLoanData(loan)} className="bg-emerald-600 text-white px-4 md:px-5 py-2 rounded-lg font-bold text-xs hover:bg-emerald-700">Tinjau Detail</button></td>
                                  </tr>
                                )})}
                              </tbody>
                            </table>
                        </div>
                      </div>
                    )}

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                      <h3 className="font-bold text-slate-800 text-lg p-4 md:p-6 border-b border-slate-100 bg-slate-50">Manajemen Tagihan Anggota</h3>
                      <div className="overflow-x-auto w-full">
                          <table className="w-full text-left text-sm min-w-[600px]">
                            <thead className="bg-white text-slate-400 border-b border-slate-100 text-xs uppercase">
                              <tr>
                                <th className="p-4 md:p-5 font-bold">Anggota & ID</th>
                                <th className="p-4 md:p-5 font-bold">Detail Tagihan</th>
                                <th className="p-4 md:p-5 font-bold text-right min-w-[200px]">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {safeLoans.filter(l => l.status !== 'Pending').map(loan => (
                                <tr key={loan.id} className="hover:bg-slate-50 group">
                                  <td className="p-4 md:p-5">
                                    <p className="font-bold text-slate-800 text-base">{safeUsers.find(u => u.id == loan.userId)?.name || loan.userId}</p>
                                    <p className="text-xs text-slate-400 mb-2">ID: {loan.id}</p>
                                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">{loan.type}</span>
                                  </td>
                                  <td className="p-4 md:p-5 w-48 md:w-64">
                                    <div className="flex justify-between text-slate-500 mb-1"><span className="text-xs">Total:</span> <span className="font-bold text-slate-800">{formatRp(loan.total)}</span></div>
                                    <div className="flex justify-between text-slate-500 mb-2"><span className="text-xs">Sisa:</span> <span className="font-bold text-red-600">{formatRp(loan.remainingAmount)}</span></div>
                                    {loan.netDisbursed !== undefined && (
                                       <div className="flex justify-between text-emerald-600 mb-2 bg-emerald-50 px-2 py-1 rounded border border-emerald-100"><span className="text-[10px] font-bold uppercase">Cair Bersih:</span> <span className="font-bold text-xs">{formatRp(loan.netDisbursed)}</span></div>
                                    )}
                                    <div className="border-t border-slate-200 pt-2 flex justify-between items-center"><span className="text-[10px] font-bold uppercase text-slate-400">CICILAN/BLN:</span> <span className="font-bold text-emerald-600">{formatRp(loan.installment)}</span></div>
                                  </td>
                                  <td className="p-4 md:p-5 text-right flex flex-col md:flex-row justify-end gap-2 items-end md:items-center h-full">
                                    {loan.status === 'Aktif' ? (
                                      <>
                                        {safeUsers.find(u => u.id == loan.userId)?.phone && (
                                          <a href={`https://wa.me/${safeUsers.find(u => u.id == loan.userId).phone}?text=${encodeURIComponent(`Halo ${safeUsers.find(u => u.id == loan.userId).name},\n\nMengingatkan untuk tagihan cicilan Akad Koperasi Anda (Ref: ${loan.id}) bulan ini sebesar *${formatRp(loan.installment)}*.\n\nSisa tagihan berjalan: ${formatRp(loan.remainingAmount)}.\n\nMohon segera melakukan pembayaran ke bendahara. Terima kasih.`)}`} target="_blank" rel="noopener noreferrer" className="bg-green-500 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-green-600 mb-2 md:mb-0 w-full md:w-auto flex items-center justify-center gap-1"><MessageCircle className="w-3 h-3"/> Tagih WA</a>
                                        )}
                                        <button onClick={() => handlePayInstallment(loan)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 mb-2 md:mb-0 w-full md:w-auto whitespace-nowrap">Terima Cicilan</button>
                                      </>
                                    ) : (
                                      <span className={`font-black text-xs px-3 py-2 bg-slate-50 rounded-lg border mb-2 md:mb-0 w-full md:w-auto text-center inline-block ${loan.status==='Ditolak'?'text-red-500 border-red-200':'text-slate-400'}`}>{loan.status.toUpperCase()}</span>
                                    )}
                                    <div className="flex gap-2 justify-end w-full md:w-auto">
                                       <button onClick={() => setEditingLoan(loan)} className="text-blue-500 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg flex-1 md:flex-none flex justify-center" title="Edit Akad"><Edit className="w-4 h-4"/></button>
                                       <button onClick={() => handleDeleteLoan(loan.id)} className="text-red-500 bg-red-50 hover:bg-red-100 p-2 rounded-lg flex-1 md:flex-none flex justify-center" title="Hapus Akad"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                  </td>
                                </tr>
                              )).reverse()}
                            </tbody>
                          </table>
                      </div>
                    </div>
                 </div>
              </div>
            )}

            {currentView === 'accounting' && currentUser.role === 'admin' && (
              <div className="space-y-6">
                 <div className="flex flex-col md:flex-row gap-2 no-print bg-white p-2 md:p-4 rounded-xl shadow-sm border border-slate-200">
                    <button onClick={()=>setAccountingTab('jurnal')} className={`flex-1 py-3 px-4 rounded-lg font-bold text-xs md:text-sm flex justify-center items-center gap-2 transition ${accountingTab==='jurnal'?'bg-slate-900 text-white shadow-md':'text-slate-500 hover:bg-slate-50 border border-slate-100'}`}><BookOpen className="w-4 h-4 hidden sm:block"/> Buku Kas</button>
                    <button onClick={()=>setAccountingTab('labarugi')} className={`flex-1 py-3 px-4 rounded-lg font-bold text-xs md:text-sm flex justify-center items-center gap-2 transition ${accountingTab==='labarugi'?'bg-slate-900 text-white shadow-md':'text-slate-500 hover:bg-slate-50 border border-slate-100'}`}><TrendingUp className="w-4 h-4 hidden sm:block"/> Laba Rugi</button>
                    <button onClick={()=>setAccountingTab('neraca')} className={`flex-1 py-3 px-4 rounded-lg font-bold text-xs md:text-sm flex justify-center items-center gap-2 transition ${accountingTab==='neraca'?'bg-slate-900 text-white shadow-md':'text-slate-500 hover:bg-slate-50 border border-slate-100'}`}><Scale className="w-4 h-4 hidden sm:block"/> Neraca</button>
                    <button onClick={()=>setAccountingTab('calk')} className={`flex-1 py-3 px-4 rounded-lg font-bold text-xs md:text-sm flex justify-center items-center gap-2 transition ${accountingTab==='calk'?'bg-slate-900 text-white shadow-md':'text-slate-500 hover:bg-slate-50 border border-slate-100'}`}><FileText className="w-4 h-4 hidden sm:block"/> C.A.L.K</button>
                 </div>

                 <div className="flex justify-between items-center no-print">
                    <button onClick={() => setShowTrxModal(true)} className="bg-emerald-600 text-white px-4 md:px-5 py-2.5 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-md">
                      <Plus className="w-4 h-4"/> Jurnal Manual
                    </button>
                    <button onClick={() => window.print()} className="bg-white border border-slate-300 text-slate-700 px-4 md:px-5 py-2.5 rounded-lg text-xs md:text-sm font-bold flex items-center gap-2 hover:bg-slate-50 shadow-sm">
                      <Printer className="w-4 h-4"/> Cetak Laporan
                    </button>
                 </div>

                 <div className="bg-white p-4 md:p-10 rounded-2xl shadow-sm border border-slate-200 print-container text-slate-800 print:shadow-none print:border-none print:p-0">
                    <div className="text-center mb-10 pb-6 border-b-4 border-slate-900 hidden print:block">
                       <h1 className="text-3xl font-black uppercase">Koperasi Mitra Baraya Sejahtera (MBS)</h1>
                       <p className="text-sm font-medium mt-1">Laporan Keuangan Internal - Diekstrak secara otomatis dari Sistem Syariah Core v2</p>
                       <p className="text-xs mt-1">Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>

                    {accountingTab === 'jurnal' && (
                       <div>
                          <h2 className="text-xl md:text-2xl font-black mb-1">Buku Kas (Jurnal Umum)</h2>
                          <p className="text-slate-500 text-xs md:text-sm mb-6">Mencatat seluruh arus kas masuk (Debit) dan keluar (Kredit).</p>
                          <div className="overflow-x-auto w-full">
                              <table className="w-full text-left text-xs md:text-sm border-collapse border border-slate-300 min-w-[700px]">
                                 <thead>
                                   <tr className="bg-slate-100 text-slate-700"><th className="p-3 border border-slate-300 w-24">Tanggal</th><th className="p-3 border border-slate-300">Keterangan Jurnal</th><th className="p-3 border border-slate-300 text-right w-32 bg-emerald-50">Debit (Masuk)</th><th className="p-3 border border-slate-300 text-right w-32 bg-red-50">Kredit (Keluar)</th><th className="p-3 border border-slate-300 text-right w-36 bg-blue-50">Saldo Akhir</th></tr>
                                 </thead>
                                 <tbody>
                                   {calcTransactions.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-slate-400 font-medium">Belum ada transaksi tercatat.</td></tr>}
                                   {calcTransactions.map(trx => {
                                     const usr = safeUsers.find(u => u.id === trx.userId);
                                     return(
                                     <tr key={trx.id} className="hover:bg-slate-50">
                                       <td className="p-3 border border-slate-300 text-[10px] md:text-xs font-mono whitespace-nowrap">{trx.date}</td>
                                       <td className="p-3 border border-slate-300">
                                          <p className="font-bold">{trx.type}</p>
                                          <p className="text-[10px] md:text-xs text-slate-500">Ref: {trx.referenceId} {usr ? `(${usr.name})` : ''}</p>
                                       </td>
                                       <td className="p-3 border border-slate-300 text-right font-medium text-emerald-700">{trx.isIncome ? formatRp(trx.amount) : '-'}</td>
                                       <td className="p-3 border border-slate-300 text-right font-medium text-red-600">{!trx.isIncome ? formatRp(trx.amount) : '-'}</td>
                                       <td className="p-3 border border-slate-300 text-right font-black text-slate-800">{formatRp(trx.currentBalance)}</td>
                                     </tr>
                                   )})}
                                 </tbody>
                                 <tfoot>
                                    <tr className="bg-slate-900 text-white font-black text-sm md:text-base">
                                       <td colSpan="2" className="p-4 text-right border border-slate-800">TOTAL SALDO KAS TERSEDIA:</td>
                                       <td colSpan="3" className="p-4 text-center border border-slate-800 bg-slate-800">{formatRp(totalKas)}</td>
                                    </tr>
                                 </tfoot>
                              </table>
                          </div>
                       </div>
                    )}

                    {accountingTab === 'labarugi' && (
                       <div className="max-w-3xl mx-auto">
                          <h2 className="text-xl md:text-2xl font-black mb-1 text-center">Laporan Laba Rugi Sederhana</h2>
                          <p className="text-slate-500 text-xs md:text-sm mb-8 text-center">Periode Berjalan S.d {new Date().toLocaleDateString('id-ID')}</p>
                          <div className="border-t-4 border-slate-900 pt-6 text-sm md:text-base">
                             <h4 className="font-black text-base md:text-lg bg-emerald-100 text-emerald-900 px-4 py-2 mb-4">A. PENDAPATAN</h4>
                             <div className="flex justify-between p-2 border-b border-slate-200"><span className="pl-4">Pendapatan Usaha & Koperasi</span><span>{formatRp(totalPendapatanUsaha)}</span></div>
                             <div className="flex justify-between p-4 bg-slate-50 font-black text-emerald-700 mt-2 mb-8"><span>TOTAL PENDAPATAN (Kotor)</span><span>{formatRp(totalPendapatanUsaha)}</span></div>

                             <h4 className="font-black text-base md:text-lg bg-red-100 text-red-900 px-4 py-2 mb-4">B. BEBAN & PENGELUARAN</h4>
                             <div className="flex justify-between p-2 border-b border-slate-200"><span className="pl-4">Beban Operasional & Gaji</span><span>{formatRp(totalBebanOperasional)}</span></div>
                             <div className="flex justify-between p-4 bg-slate-50 font-black text-red-700 mt-2 mb-8"><span>TOTAL BEBAN</span><span>({formatRp(totalBebanOperasional)})</span></div>

                             <div className="flex flex-col md:flex-row justify-between p-6 bg-slate-900 text-white font-black text-lg md:text-xl rounded-xl md:rounded-none">
                               <span className="mb-2 md:mb-0 text-center md:text-left">SHU / LABA BERSIH BERJALAN</span>
                               <span className={`text-center md:text-right ${totalPendapatanUsaha - totalBebanOperasional < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{formatRp(totalPendapatanUsaha - totalBebanOperasional)}</span>
                             </div>
                          </div>
                       </div>
                    )}

                    {accountingTab === 'neraca' && (
                       <div>
                          <h2 className="text-xl md:text-2xl font-black mb-1 text-center">Neraca Keuangan (Balance Sheet)</h2>
                          <p className="text-slate-500 text-xs md:text-sm mb-8 text-center">Per Tanggal: {new Date().toLocaleDateString('id-ID')}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t-4 border-slate-900 pt-6 text-sm md:text-base">
                             <div>
                               <h4 className="font-black text-lg md:text-xl text-center bg-blue-100 text-blue-900 py-3 mb-4">AKTIVA (ASET)</h4>
                               <p className="font-bold text-slate-800 border-b-2 border-slate-300 pb-1 mb-2 mt-4">Aset Lancar</p>
                               <div className="flex justify-between p-2"><span className="pl-2 md:pl-4">Kas & Bank</span><span className="font-medium">{formatRp(totalKas)}</span></div>
                               <div className="flex justify-between p-2"><span className="pl-2 md:pl-4">Piutang Pembiayaan</span><span className="font-medium">{formatRp(totalPiutang)}</span></div>
                               <p className="font-bold text-slate-800 border-b-2 border-slate-300 pb-1 mb-2 mt-6">Aset Tetap</p>
                               <div className="flex justify-between p-2"><span className="pl-2 md:pl-4">Inventaris Koperasi</span><span className="font-medium">{formatRp(totalAsetTetap)}</span></div>
                               <div className="flex justify-between p-4 bg-blue-50 font-black text-blue-900 mt-6 border-t-4 border-blue-200"><span>TOTAL AKTIVA</span><span>{formatRp(totalAktiva)}</span></div>
                             </div>

                             <div>
                               <h4 className="font-black text-lg md:text-xl text-center bg-slate-200 text-slate-900 py-3 mb-4">PASIVA (LIABILITAS & EKUITAS)</h4>
                               <p className="font-bold text-slate-800 border-b-2 border-slate-300 pb-1 mb-2 mt-4">Liabilitas (Kewajiban)</p>
                               <div className="flex justify-between p-2"><span className="pl-2 md:pl-4">Kewajiban Jangka Pendek</span><span className="font-medium text-slate-400">Rp 0</span></div>
                               <p className="font-bold text-slate-800 border-b-2 border-slate-300 pb-1 mb-2 mt-6">Ekuitas (Modal & SHU)</p>
                               <div className="flex justify-between p-2"><span className="pl-2 md:pl-4">Total Ekuitas</span><span className="font-medium">{formatRp(totalPasiva)}</span></div>
                               <div className="flex justify-between p-4 bg-slate-100 font-black text-slate-900 mt-6 border-t-4 border-slate-300"><span>TOTAL PASIVA</span><span>{formatRp(totalPasiva)}</span></div>
                             </div>
                          </div>
                       </div>
                    )}

                    {accountingTab === 'calk' && (
                       <div className="max-w-4xl mx-auto space-y-6">
                          <h2 className="text-xl md:text-2xl font-black mb-1 text-center">Catatan Atas Laporan Keuangan</h2>
                          <div className="border-t-2 border-slate-200 pt-6 space-y-6 text-justify">
                             <div><h3 className="font-bold text-base md:text-lg mb-2">1. Kebijakan Akuntansi Kas</h3><p className="text-xs md:text-sm leading-relaxed text-slate-700">Sistem ini mengakui transaksi penerimaan angsuran, simpanan, pendapatan usaha sebagai DEBIT (Kas Bertambah), dan transaksi pencairan akad, biaya operasional sebagai KREDIT (Kas Berkurang).</p></div>
                             <div><h3 className="font-bold text-base md:text-lg mb-2">2. Rekonsiliasi Piutang</h3><p className="text-xs md:text-sm leading-relaxed text-slate-700">Total piutang ditarik secara *real-time* dari sisa tagihan anggota pada akad aktif. Ketika dicairkan, kas akan terpotong secara otomatis oleh sistem.</p></div>
                             <div className="mt-16 pt-16 grid grid-cols-2 text-center text-xs md:text-sm font-bold">
                               <div><p className="mb-16">Mengetahui,</p><p className="underline decoration-2 underline-offset-4">Ketua Koperasi</p></div>
                               <div><p className="mb-16">Disusun Oleh,</p><p className="underline decoration-2 underline-offset-4">Bagian Keuangan / Admin</p></div>
                             </div>
                          </div>
                       </div>
                    )}
                 </div>
              </div>
            )}

            {/* MEMBER DASHBOARD */}
            {currentView === 'dashboard' && currentUser.role === 'member' && (
              <div className="space-y-6 md:space-y-8">
                {(() => {
                  const score = getCreditScore(currentUser.id);
                  const activeLoan = safeLoans.find(l => l.userId === currentUser.id && l.status === 'Aktif');
                  const savingsData = getMemberSavingsData(currentUser.id, new Date().getFullYear());
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                      
                      <div className="md:col-span-2 bg-emerald-900 rounded-3xl p-6 md:p-8 shadow-xl text-white relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-emerald-500 rounded-full blur-3xl opacity-20 -mr-20 -mt-20"></div>
                         <p className="text-emerald-300 font-bold mb-1 uppercase text-[10px] md:text-xs">{score.tier}</p>
                         <h2 className="text-2xl md:text-3xl font-black mb-2 md:mb-4">Plafon Pembiayaan</h2>
                         <p className="text-4xl md:text-5xl font-black text-emerald-100 mb-6 truncate">{formatRp(score.limit)}</p>
                         <div className="bg-emerald-950/50 p-4 rounded-xl text-[10px] md:text-xs font-medium text-emerald-200">
                           <p>Anda telah melunasi <b>{score.lunasCount} Akad</b>. Pertahankan kedisiplinan cicilan Anda untuk menaikkan limit pembiayaan!</p>
                         </div>
                      </div>

                      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col justify-center">
                         <h3 className="font-bold text-slate-800 text-base md:text-lg mb-4 flex items-center gap-2"><PiggyBank className="w-5 h-5 text-blue-500"/> Tabungan Wajib</h3>
                         
                         <div className="mb-4">
                           <p className="text-[10px] uppercase font-bold text-slate-400">Total Terkumpul</p>
                           <p className="text-xl md:text-2xl font-black text-blue-600 truncate">{formatRp(savingsData.totalPaidAllTime)}</p>
                         </div>
                         
                         <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                           <p className="text-[10px] md:text-xs font-bold text-slate-500 mb-2">Status Simpanan Wajib ({new Date().getFullYear()})</p>
                           <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mb-3">
                             {['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'].map((m, i) => {
                                 let statusStyle = "bg-slate-200 text-slate-400"; 
                                 if (i >= savingsData.expectedInfo.start && i <= savingsData.expectedInfo.end) {
                                     statusStyle = savingsData.paidArray[i] ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-red-100 text-red-700 border border-red-200";
                                 } else if (savingsData.paidArray[i]) {
                                     statusStyle = "bg-emerald-100 text-emerald-700 border border-emerald-200"; 
                                 }
                                 return (
                                     <div key={m} className={`text-center p-1 md:p-1.5 rounded-md text-[10px] font-bold ${statusStyle}`}>
                                         {m}
                                     </div>
                                 )
                             })}
                           </div>
                           
                           {savingsData.arrearsAmount > 0 ? (
                             <div>
                               <span className="text-red-500 font-bold text-xs md:text-sm">Tunggakan: {formatRp(savingsData.arrearsAmount)}</span>
                               <p className="text-[10px] text-slate-500 mt-1 leading-tight">Belum bayar bulan: {savingsData.unpaidMonthsNames.join(', ')}</p>
                             </div>
                           ) : (
                             <span className="text-emerald-500 font-bold text-xs md:text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Bebas Tunggakan</span>
                           )}
                         </div>
                      </div>

                      <div className="md:col-span-3 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
                         <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-4 md:mb-6 flex items-center gap-2">
                           {activeLoan ? <><TrendingUp className="w-5 h-5 text-amber-500"/> Ajukan Top-Up (Refinancing)</> : <><Wallet className="w-5 h-5 text-emerald-600"/> Kalkulator Pengajuan Syariah</>}
                         </h3>
                         {activeLoan && <div className="mb-4 bg-amber-50 text-amber-800 text-[10px] md:text-xs p-3 md:p-4 rounded-xl border border-amber-200"><b>Info Top-Up:</b> Anda memiliki sisa tagihan aktif {formatRp(activeLoan.remainingAmount)}. Pencairan baru akan otomatis dipotong untuk melunasi hutang lama.</div>}
                         
                         <form onSubmit={handleApplyLoan} className="space-y-6">
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="bg-blue-50 p-4 md:p-6 rounded-2xl border border-blue-100">
                               <p className="font-black text-blue-800 mb-3 flex items-center gap-2"><Box className="w-4 h-4"/> 1. Kebutuhan Murabahah (Barang)</p>
                               <input placeholder="Nama Barang (Cth: Laptop Asus)" value={syariahForm.itemName} onChange={(e)=>setSyariahForm({...syariahForm, itemName: e.target.value})} className="w-full bg-white border border-blue-200 p-3 rounded-xl outline-none text-sm mb-3" />
                               <input type="number" placeholder="Harga Barang Asli (Rp)" value={syariahForm.itemPrice || ''} onChange={(e)=>setSyariahForm({...syariahForm, itemPrice: Number(e.target.value), margin: Number(e.target.value) * 0.1})} className="w-full bg-white border border-blue-200 p-3 rounded-xl outline-none font-bold" />
                             </div>

                             <div className="bg-amber-50 p-4 md:p-6 rounded-2xl border border-amber-100">
                               <p className="font-black text-amber-800 mb-3 flex items-center gap-2"><Wallet className="w-4 h-4"/> 2. Kebutuhan Qardh (Tunai)</p>
                               <input type="number" placeholder="Nominal Pinjaman Tunai (Rp)" value={syariahForm.cashAmount || ''} onChange={(e)=>setSyariahForm({...syariahForm, cashAmount: Number(e.target.value)})} className="w-full bg-white border border-amber-200 p-3 rounded-xl outline-none font-bold" />
                               <p className="text-[10px] text-amber-700 mt-2 italic">*Hanya untuk keperluan darurat/bebas. Bebas Margin.</p>
                             </div>
                           </div>

                           <div>
                             <label className="text-xs font-bold text-slate-500">Pilih Tenor Cicilan (Bulan)</label>
                             <input type="number" min="1" max="60" required value={syariahForm.tenor} onChange={(e)=>setSyariahForm({...syariahForm, tenor: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-bold mt-1" />
                           </div>

                           {renderSyariahAnalysis(currentUser.name, syariahForm.itemName, syariahForm.itemPrice, syariahForm.cashAmount, syariahForm.margin, syariahForm.adminFee, syariahForm.tenor)}

                           <button type="submit" disabled={isLoading || (syariahForm.itemPrice === 0 && syariahForm.cashAmount === 0)} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-700 shadow-md disabled:opacity-50 transition">Kirim Pengajuan Akad</button>
                         </form>
                      </div>
                    </div>
                  );
                })()}

                {/* RIWAYAT PINJAMAN */}
                <div>
                  <h2 className="text-xl font-black text-slate-800 mb-4 md:mb-6">Riwayat & Tagihan Anda</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                     {safeLoans.filter(l => l.userId == currentUser.id).length === 0 && <div className="text-slate-400 font-medium">Belum ada riwayat tagihan.</div>}
                     {safeLoans.filter(l => l.userId == currentUser.id).map(loan => {
                       const parsed = parseSyariahDescription(loan.description);
                       const displayTitle = parsed ? ((parsed.itemPrice > 0 ? parsed.itemName : '') + (parsed.cashAmount > 0 ? (parsed.itemPrice > 0 ? ' + ' : '') + 'Tunai' : '')) : loan.description;

                       return (
                       <div key={loan.id} className="p-5 md:p-6 border border-slate-200 rounded-3xl bg-white shadow-sm flex flex-col justify-between relative overflow-hidden">
                         <div className="absolute top-0 right-0">
                           {loan.status === 'Pending' && <span className="bg-amber-100 text-amber-700 text-[10px] md:text-xs font-bold px-4 md:px-6 py-2 rounded-bl-2xl inline-block">⏳ Evaluasi</span>}
                           {loan.status === 'Aktif' && <span className="bg-red-500 text-white text-[10px] md:text-xs font-bold px-4 md:px-6 py-2 rounded-bl-2xl inline-block shadow-md">🔴 TAGIHAN AKTIF</span>}
                           {loan.status === 'Lunas' && <span className="bg-slate-800 text-white text-[10px] md:text-xs font-bold px-4 md:px-6 py-2 rounded-bl-2xl inline-block">✅ LUNAS</span>}
                           {loan.status === 'Ditolak' && <span className="bg-slate-200 text-slate-500 text-[10px] md:text-xs font-bold px-4 md:px-6 py-2 rounded-bl-2xl inline-block border-l border-b border-slate-300">❌ DITOLAK</span>}
                         </div>
                         <div className="pt-6 md:pt-4">
                           <span className="text-[10px] md:text-xs font-bold text-emerald-600 mb-2 block uppercase">{loan.type}</span>
                           <h3 className="font-black text-lg md:text-xl text-slate-800 mb-1">{displayTitle}</h3>
                           <p className="text-[10px] md:text-xs text-slate-400 font-mono mb-6">Ref: {loan.id}</p>
                           
                           {loan.status === 'Pending' && (
                              (() => {
                                const activeL = safeLoans.find(l => l.userId === loan.userId && l.status === 'Aktif' && l.id !== loan.id);
                                const oldD = activeL ? Number(activeL.remainingAmount) : 0;
                                const estCair = loan.principal - oldD;
                                return (
                                   <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                     <div className="flex justify-between items-center mb-1">
                                       <p className="text-xs text-slate-500">Estimasi Cair (Net):</p>
                                       <p className="text-[10px] font-bold text-slate-400 border border-slate-200 px-2 rounded bg-white">Pengajuan: {formatRp(loan.principal)}</p>
                                     </div>
                                     <p className="font-black text-xl md:text-2xl text-slate-800">{formatRp(estCair > 0 ? estCair : 0)}</p>
                                     {oldD > 0 && <p className="text-[10px] text-red-500 mt-2 font-bold leading-tight">*Akan dipotong pelunasan hutang sebelumnya sebesar {formatRp(oldD)}</p>}
                                   </div>
                                );
                              })()
                           )}
                           
                           {(loan.status === 'Aktif' || loan.status === 'Lunas') && (
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                {(loan.netDisbursed !== undefined) && (
                                   <div className="bg-emerald-100 text-emerald-800 px-3 py-2 rounded-lg text-[10px] md:text-xs font-bold mb-4 flex justify-between items-center shadow-sm border border-emerald-200">
                                     <span>CAIR BERSIH (NET):</span>
                                     <span className="text-xs md:text-sm">{formatRp(loan.netDisbursed)}</span>
                                   </div>
                                )}
                                <p className="text-slate-500 text-[10px] md:text-xs font-bold tracking-wider mb-1">SISA TAGIHAN</p>
                                <p className={`text-2xl md:text-3xl font-black ${loan.status === 'Aktif' ? 'text-red-600' : 'text-slate-300'}`}>{formatRp(loan.remainingAmount)}</p>
                                <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between">
                                   <div><p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase">Total Akad</p><p className="font-bold text-slate-700 text-xs md:text-sm">{formatRp(loan.total)}</p></div>
                                   <div className="text-right"><p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase">Cicilan / Bln</p><p className="font-bold text-emerald-700 text-xs md:text-sm">{formatRp(loan.installment)}</p></div>
                                </div>
                              </div>
                           )}
                         </div>
                       </div>
                     )})}
                  </div>
                </div>
              </div>
            )}

            {/* PENGATURAN */}
            {currentView === 'settings' && (
              <div className="max-w-md mx-auto md:mx-0 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Key className="w-5 h-5 text-emerald-600"/> Ubah Kata Sandi</h3>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div><label className="text-xs font-bold text-slate-500">Sandi Saat Ini</label><input name="oldPassword" type="password" required className="w-full mt-1 border p-3 rounded-lg bg-slate-50 outline-none" /></div>
                  <div><label className="text-xs font-bold text-slate-500">Sandi Baru</label><input name="newPassword" type="password" required className="w-full mt-1 border p-3 rounded-lg bg-slate-50 outline-none" /></div>
                  <button type="submit" disabled={isLoading} className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 mt-4">Simpan Sandi</button>
                </form>
              </div>
            )}
        </div>
      </main>

      
      {/* MODAL JURNAL MANUAL */}
      {showTrxModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl max-h-[95vh] flex flex-col">
            <div className="p-5 md:p-6 bg-slate-50 border-b flex justify-between items-center shrink-0">
              <h3 className="font-black text-lg text-slate-800">Jurnal Kas Manual</h3>
              <button onClick={()=>setShowTrxModal(false)} className="text-slate-400 hover:text-red-500 font-bold p-2 bg-slate-200/50 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleManualTrx} className="p-5 md:p-6 space-y-4 overflow-y-auto flex-1">
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-2">
                 <button type="button" onClick={()=>setTrxTypeSelect('IN')} className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${trxTypeSelect==='IN'?'bg-emerald-600 text-white shadow':'text-slate-500'}`}>Kas Masuk</button>
                 <button type="button" onClick={()=>setTrxTypeSelect('OUT')} className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${trxTypeSelect==='OUT'?'bg-red-600 text-white shadow':'text-slate-500'}`}>Kas Keluar</button>
              </div>
              <div><label className="text-xs font-bold text-slate-500">Tanggal</label><input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full border-2 p-3 rounded-xl mt-1 outline-none" required/></div>
              <div>
                <label className="text-xs font-bold text-slate-500">Kategori</label>
                <select name="type" className="w-full border-2 p-3 rounded-xl mt-1 font-bold outline-none" required>
                   {trxTypeSelect === 'IN' ? (
                     <><option value="Modal Awal">Modal Awal / Dana Awal Koperasi</option><option value="Pendapatan Usaha">Pendapatan Usaha (Laba/Bagi Hasil)</option><option value="Simpanan Anggota">Setoran Simpanan Anggota</option><option value="Pemasukan Lainnya">Pemasukan Lainnya</option></>
                   ) : (
                     <><option value="Biaya Operasional">Biaya Operasional (Listrik, dll)</option><option value="Gaji & Honor">Gaji Karyawan</option><option value="Pengeluaran Lainnya">Pengeluaran Lainnya</option></>
                   )}
                </select>
              </div>
              <div><label className="text-xs font-bold text-slate-500">Keterangan</label><input name="description" placeholder="Contoh: Dana awal" className="w-full border-2 p-3 rounded-xl mt-1 outline-none" required /></div>
              <div><label className={`text-xs font-bold ${trxTypeSelect === 'IN' ? 'text-emerald-600' : 'text-red-600'}`}>Nominal (Rp)</label><input type="number" name="amount" className="w-full border-2 p-3 rounded-xl mt-1 outline-none font-black text-xl" required /></div>
              <div className="pt-2">
                <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 shadow-xl">Simpan Jurnal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INPUT ASET */}
      {showAssetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl max-h-[95vh] flex flex-col">
            <div className="p-5 md:p-6 bg-slate-50 border-b flex justify-between items-center shrink-0">
              <h3 className="font-black text-lg text-slate-800">{editingAsset ? 'Edit Data Aset' : 'Input Aset Baru'}</h3>
              <button type="button" onClick={()=>{setShowAssetModal(false); setEditingAsset(null);}} className="text-slate-400 hover:text-red-500 p-2 bg-slate-200/50 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSaveAsset} className="p-5 md:p-6 space-y-4 overflow-y-auto flex-1">
              <div><label className="text-xs font-bold text-slate-500">Nama Aset</label><input name="name" defaultValue={editingAsset?.name} placeholder="Cth: Laptop Admin" className="w-full border-2 p-3 rounded-xl outline-none" required/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-slate-500">Kategori</label><select name="category" defaultValue={editingAsset?.category || 'Elektronik'} className="w-full border-2 p-3 rounded-xl outline-none"><option value="Elektronik">Elektronik</option><option value="Properti">Properti</option><option value="Kendaraan">Kendaraan</option><option value="Lainnya">Lainnya</option></select></div>
                <div><label className="text-xs font-bold text-slate-500">Tgl Perolehan</label><input type="date" name="date" defaultValue={editingAsset?.purchaseDate || new Date().toISOString().split('T')[0]} className="w-full border-2 p-3 rounded-xl outline-none" required/></div>
              </div>
              <div><label className="text-xs font-bold text-blue-600">Nilai Buku / Harga (Rp)</label><input type="number" name="value" defaultValue={editingAsset?.value} className="w-full border-2 border-blue-200 p-3 rounded-xl outline-none font-black text-blue-700" required/></div>
              <div className="pt-2"><button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 shadow-lg">Simpan Inventaris</button></div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT AKAD */}
      {editingLoan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl max-h-[95vh] flex flex-col">
            <div className="p-5 md:p-6 bg-slate-50 border-b flex justify-between items-center shrink-0">
              <h3 className="font-black text-lg text-slate-800">Edit Data Akad</h3>
              <button type="button" onClick={()=>setEditingLoan(null)} className="text-slate-400 hover:text-red-500 p-2 bg-slate-200/50 rounded-full"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleEditLoan} className="p-5 md:p-6 space-y-4 overflow-y-auto flex-1">
              <div><label className="text-xs font-bold text-slate-500">Keperluan</label><input name="description" defaultValue={editingLoan.description} className="w-full border-2 p-3 rounded-xl outline-none" required/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-slate-500">Total Piutang</label><input name="total" type="number" defaultValue={editingLoan.total} className="w-full border-2 p-3 rounded-xl outline-none" required/></div>
                <div><label className="text-xs font-bold text-slate-500">Sisa Tagihan</label><input name="remaining" type="number" defaultValue={editingLoan.remainingAmount} className="w-full border-2 border-red-200 text-red-600 p-3 rounded-xl outline-none" required/></div>
              </div>
              <div><label className="text-xs font-bold text-slate-500">Status</label><select name="status" defaultValue={editingLoan.status} className="w-full border-2 p-3 rounded-xl outline-none"><option value="Aktif">Aktif</option><option value="Lunas">Lunas</option><option value="Bermasalah">Bermasalah</option></select></div>
              <div className="pt-2"><button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 mt-2">Simpan Perubahan</button></div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL APPROVAL AKAD (SYARIAH) */}
      {approveLoanData && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[95vh] flex flex-col">
            <div className="bg-slate-900 p-5 md:p-6 text-white border-b-4 border-emerald-500 shrink-0 flex justify-between items-start">
              <div>
                 <h3 className="font-bold text-lg md:text-xl">Evaluasi & Pengesahan Akad</h3>
                 <p className="text-slate-300 text-xs md:text-sm mt-1 truncate">{safeUsers.find(u => u.id == approveLoanData.userId)?.name}</p>
              </div>
              <button type="button" onClick={() => setApproveLoanData(null)} className="text-slate-400 hover:text-white p-2"><X className="w-6 h-6"/></button>
            </div>
            
            <form onSubmit={handleProcessApproval} className="p-5 md:p-6 space-y-4 bg-slate-50 overflow-y-auto flex-1">
              
              {(() => {
                const pUserActiveLoan = safeLoans.find(l => l.userId === approveLoanData.userId && l.status === 'Aktif');
                const oldDebt = pUserActiveLoan ? Number(pUserActiveLoan.remainingAmount) : 0;
                const parsed = parseSyariahDescription(approveLoanData.description) || { itemPrice: approveLoanData.principal, cashAmount: 0 };
                const pengajuan = parsed.itemPrice + parsed.cashAmount;
                const netDisburse = pengajuan - oldDebt;
                
                return (
                  <>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4">
                       <h4 className="font-black text-slate-800 mb-3 border-b border-slate-100 pb-2">Penyesuaian Biaya & Margin</h4>
                       <div className="grid grid-cols-2 gap-4">
                          {parsed.itemPrice > 0 && (
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Margin Barang (Rp)</label>
                              <input type="number" required value={approveSyariahData.margin} onChange={(e)=>setApproveSyariahData({...approveSyariahData, margin: Number(e.target.value)})} className="w-full mt-1 border-2 border-emerald-200 p-2 rounded-lg font-bold outline-none" />
                            </div>
                          )}
                          {parsed.cashAmount > 0 && (
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Biaya Admin Tunai (Rp)</label>
                              <input type="number" required value={approveSyariahData.adminFee} onChange={(e)=>setApproveSyariahData({...approveSyariahData, adminFee: Number(e.target.value)})} className="w-full mt-1 border-2 border-amber-200 p-2 rounded-lg font-bold outline-none" />
                            </div>
                          )}
                       </div>
                    </div>

                    {renderSyariahAnalysis(
                        safeUsers.find(u => u.id == approveLoanData.userId)?.name, 
                        parsed.itemName, parsed.itemPrice, parsed.cashAmount, 
                        approveSyariahData.margin, approveSyariahData.adminFee, approveLoanData.tenor
                    )}

                    <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 mt-4 text-center">
                       <p className="text-xs font-bold text-emerald-800 uppercase mb-1">Total Dana Cair (NET) Setelah Potongan</p>
                       <p className="text-2xl font-black text-emerald-700">{formatRp(netDisburse > 0 ? netDisburse : 0)}</p>
                       {oldDebt > 0 && <p className="text-[10px] text-red-600 font-bold mt-1">*Telah dipotong otomatis pelunasan hutang {formatRp(oldDebt)}</p>}
                    </div>
                  </>
                );
              })()}
              
              <div className="flex flex-col md:flex-row gap-3 pt-4">
                <button type="button" onClick={handleRejectLoan} disabled={isLoading} className="w-full bg-white text-red-600 border border-red-200 font-bold py-4 md:py-3 rounded-xl hover:bg-red-50 transition">❌ Tolak</button>
                <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white font-bold py-4 md:py-3 rounded-xl hover:bg-emerald-700 shadow-md">✅ Sahkan Akad</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GLOBAL / ALERT / PROMPT DI HALAMAN UTAMA */}
      {modal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col border-t-8 border-emerald-500">
            <div className="p-5 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="font-black text-lg text-slate-800">{modal.title}</h3>
              <button onClick={() => setModal({...modal, isOpen: false})} className="text-slate-400 hover:text-red-500"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-700 mb-6 whitespace-pre-wrap leading-relaxed">{modal.message}</p>
              
              {modal.type === 'prompt' && (
                <input 
                  type="text" 
                  value={modal.inputValue}
                  onChange={(e) => setModal({...modal, inputValue: e.target.value})}
                  className="w-full border-2 border-emerald-200 p-3 rounded-xl mb-6 font-bold outline-none focus:border-emerald-500 text-center text-lg" 
                  autoFocus
                />
              )}

              <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
                {modal.type !== 'alert' && (
                   <button onClick={() => setModal({...modal, isOpen: false})} className="px-5 py-3 sm:py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 w-full transition">Batal</button>
                )}
                <button 
                  onClick={() => {
                     if(modal.onConfirm) {
                        if (modal.type === 'prompt') modal.onConfirm(modal.inputValue);
                        else modal.onConfirm();
                     }
                     setModal({...modal, isOpen: false});
                  }} 
                  className="px-5 py-3 sm:py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-md w-full transition">
                  {modal.type === 'alert' ? 'Tutup' : 'Lanjutkan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT STYLES */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print { body * { visibility: hidden; } .print-container, .print-container * { visibility: visible; } .print-container { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; border: none !important; box-shadow: none !important; } .no-print { display: none !important; } }
      `}} />
    </div>
  );
}

export default function App() {
  return (
     <ErrorBoundary>
        <MainApp />
     </ErrorBoundary>
  );
}
