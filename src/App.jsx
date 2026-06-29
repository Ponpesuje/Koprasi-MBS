import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, Wallet, LogOut, Plus, ShieldCheck, Printer, 
  CheckCircle, Clock, AlertCircle, TrendingUp, Settings, Key, BookOpen, 
  Scale, FileText, Box, Edit, Trash2, X
} from 'lucide-react';

// ==========================================
// PART 1: KONFIGURASI UTAMA & UTILITAS
// ==========================================
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxHR90uMOrl2suWpwIlQf-HnAL44_QzTwgIfkaUnj7iMgTH1CMlOIZnC-N5SdRpnBRO/exec'; 

const formatRp = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
const generateId = (prefix) => `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

export default function App() {
  // STATE DATA UTAMA
  const [users, setUsers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [assets, setAssets] = useState([]);
  
  // STATE APLIKASI
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard'); 
  const [accountingTab, setAccountingTab] = useState('jurnal'); 
  const [isLoading, setIsLoading] = useState(false);
  const [printInvoice, setPrintInvoice] = useState(null);
  
  // STATE MODALS
  const [approveLoanData, setApproveLoanData] = useState(null);
  const [editingLoan, setEditingLoan] = useState(null);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [showTrxModal, setShowTrxModal] = useState(false);
  const [trxTypeSelect, setTrxTypeSelect] = useState('IN'); 

  // ==========================================
  // PART 2: FUNGSI FETCH & LOGIN
  // ==========================================
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [uRes, lRes, tRes, aRes] = await Promise.all([
        fetch(`${GAS_URL}?action=getUsers`).then(r => r.json().catch(()=>[])),
        fetch(`${GAS_URL}?action=getLoans`).then(r => r.json().catch(()=>[])),
        fetch(`${GAS_URL}?action=getTransactions`).then(r => r.json().catch(()=>[])),
        fetch(`${GAS_URL}?action=getAssets`).then(r => r.json().catch(()=>[]))
      ]);
      setUsers(Array.isArray(uRes) ? uRes : []); 
      setLoans(Array.isArray(lRes) ? lRes : []); 
      setTransactions(Array.isArray(tRes) ? tRes : []); 
      setAssets(Array.isArray(aRes) ? aRes : []);
    } catch (err) { 
      alert("Gagal sinkronisasi data dengan server."); 
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const password = e.target.password.value;
    
    const safeUsers = Array.isArray(users) ? users : [];
    const user = safeUsers.find(u => u.username == username && u.password == password);
    
    if (user) {
      if(user.status === 'Nonaktif') { alert("Akses Ditolak: Akun dinonaktifkan Admin."); return; }
      setCurrentUser(user); setCurrentView('dashboard');
    } else { alert('Username atau Password salah!'); }
  };

  // ==========================================
  // PART 3: LOGIKA AKUNTANSI & KEUANGAN 
  // ==========================================
  const isIncome = (type) => {
    if (!type) return false;
    const t = type.toLowerCase();
    // SUDAH DIPERBAIKI: 'modal awal' dikenali sebagai kas masuk
    return t.includes('penerimaan') || t.includes('pendapatan') || t.includes('simpanan') || t.includes('hibah') || t.includes('pemasukan') || t.includes('modal awal');
  };
  
  let totalKas = 0;
  let totalPendapatanUsaha = 0;
  let totalBebanOperasional = 0;

  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const safeLoans = Array.isArray(loans) ? loans : [];
  const safeAssets = Array.isArray(assets) ? assets : [];
  const safeUsers = Array.isArray(users) ? users : [];

  const sortedTransactions = [...safeTransactions].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const calcTransactions = sortedTransactions.map(trx => {
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
  const totalPasiva = totalAktiva; // SUDAH DIPERBAIKI: Mencegah error pasiva neraca

  // ==========================================
  // PART 4: CRUD MANAJEMEN DATA
  // ==========================================

  // --- ANGGOTA ---
  const handleAddMember = async (e) => {
    e.preventDefault(); setIsLoading(true);
    const form = e.target;
    if (safeUsers.find(u => u.username === form.username.value)) {
      alert("Username sudah terdaftar! Gunakan username lain.");
      setIsLoading(false); return;
    }
    const newMember = {
      id: generateId('ANG'), username: form.username.value, password: '123456', 
      role: 'member', name: form.name.value, joinDate: new Date().toISOString().split('T')[0], status: 'Aktif'
    };
    try {
      await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'addUser', data: newMember }) });
      alert(`Anggota ${newMember.name} berhasil didaftarkan! (Password default: 123456)`);
      fetchData(); form.reset();
    } catch(err) { alert("Gagal mendaftarkan anggota."); }
    setIsLoading(false);
  };

  const handleToggleMember = async (user) => {
    const newStatus = user.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    if(!window.confirm(`Yakin mengubah status akun ${user.name} menjadi ${newStatus}?`)) return;
    setIsLoading(true);
    try {
      await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'updateUserStatus', data: { id: user.id, status: newStatus } }) });
      fetchData();
    } catch (err) { alert("Gagal mengubah status"); }
    setIsLoading(false);
  };

  const handleResetPassword = async (user) => {
    if(!window.confirm(`Yakin mereset sandi ${user.name} menjadi 123456?`)) return;
    setIsLoading(true);
    try {
      await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'updatePassword', data: { id: user.id, password: '123456' } }) });
      alert(`Sandi ${user.name} berhasil direset!`); fetchData();
    } catch (err) { alert("Gagal mereset sandi"); }
    setIsLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if(e.target.oldPassword.value !== currentUser.password) { alert("Password lama salah!"); return; }
    setIsLoading(true);
    try {
      await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'updatePassword', data: { id: currentUser.id, password: e.target.newPassword.value } }) });
      alert("Password berhasil diubah! Silakan login kembali."); setCurrentUser(null); fetchData();
    } catch(err) { alert("Gagal mengubah password."); }
    setIsLoading(false);
  };

  // --- ASET / INVENTARIS ---
  const handleSaveAsset = async (e) => {
    e.preventDefault(); setIsLoading(true);
    const form = e.target;
    const assetData = {
      id: editingAsset ? editingAsset.id : generateId('AST'),
      name: form.name.value, category: form.category.value,
      value: parseFloat(form.value.value), purchaseDate: form.date.value, status: 'Baik'
    };
    try {
      const action = editingAsset ? 'editAsset' : 'addAsset';
      await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action, data: assetData }) });
      alert("Data Aset Berhasil Disimpan!"); fetchData(); setShowAssetModal(false); setEditingAsset(null);
    } catch (err) { alert("Gagal menyimpan aset"); }
    setIsLoading(false);
  };

  const handleDeleteAsset = async (id) => {
    if(!window.confirm('Yakin hapus aset ini?')) return;
    setIsLoading(true);
    try { await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteAsset', data: { id } }) }); fetchData(); } catch(e) { alert("Gagal hapus aset"); }
    setIsLoading(false);
  };

  // --- AKAD / PINJAMAN ---
  const getCreditScore = (userId) => {
    const lunasCount = safeLoans.filter(l => l.userId === userId && l.status === 'Lunas').length;
    let limit = 5000000; let tier = "Anggota Standar";
    if (lunasCount >= 2) { limit = 10000000; tier = "Anggota Teladan"; }
    if (lunasCount >= 5) { limit = 25000000; tier = "Anggota Prioritas"; }
    return { lunasCount, limit, tier };
  };

  const handleApplyLoan = async (e) => {
    e.preventDefault(); setIsLoading(true);
    const form = e.target; const principal = parseFloat(form.principal.value);
    const scoring = getCreditScore(currentUser.id);
    if(principal > scoring.limit) { alert(`Maaf, limit maksimal Anda adalah ${formatRp(scoring.limit)}`); setIsLoading(false); return; }

    const newLoan = {
      id: generateId('AKD'), userId: currentUser.id, type: form.type.value, description: form.description.value,
      principal, margin: 0, total: principal, tenor: parseInt(form.tenor.value),
      installment: 0, paidAmount: 0, remainingAmount: 0, status: 'Pending', date: new Date().toISOString().split('T')[0]
    };
    try {
      await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'addLoan', data: newLoan }) });
      alert("Pengajuan terkirim! Menunggu evaluasi Admin."); fetchData(); form.reset();
    } catch(err) { alert("Gagal mengajukan!"); }
    setIsLoading(false);
  };

  const handleOfflineLoan = async (e) => {
    e.preventDefault(); setIsLoading(true);
    const form = e.target; 
    
    // SUDAH DIPERBAIKI: Pembersihan input angka agar tidak error format dari form manual
    const rawPrincipal = form.principal.value;
    const rawMargin = form.margin.value || '0';
    const principal = parseFloat(rawPrincipal.replace(/[^0-9.-]+/g,"")) || 0;
    const margin = parseFloat(rawMargin.replace(/[^0-9.-]+/g,"")) || 0;
    const totalAmount = principal + margin;

    const newLoan = {
      id: generateId('AKD'), userId: form.userId.value, type: form.type.value, description: form.description.value,
      principal: principal, margin: margin, total: totalAmount, tenor: parseInt(form.tenor.value), 
      installment: totalAmount / parseInt(form.tenor.value), paidAmount: 0, remainingAmount: totalAmount, status: 'Aktif', date: new Date().toISOString().split('T')[0]
    };
    
    // PREFIX "CAIR-" AGAR TIDAK MEMOTONG SALDO HUTANG SAAT PENCAIRAN
    const disbursementTrx = {
      id: generateId('OUT'), date: newLoan.date, type: 'Pencairan Akad', amount: principal, 
      referenceId: `CAIR-${newLoan.id}`, userId: newLoan.userId, adminId: currentUser.id
    };

    try {
      await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'addLoan', data: newLoan }) });
      await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'addTransaction', data: disbursementTrx }) });
      alert("Akad Offline aktif & Kas terpotong untuk pencairan!"); fetchData(); form.reset();
    } catch(err) { alert("Gagal menyimpan akad manual!"); }
    setIsLoading(false);
  };

  const handleProcessApproval = async (e) => {
    e.preventDefault(); setIsLoading(true);
    const form = e.target; 
    
    // SUDAH DIPERBAIKI: Konversi data menjadi Angka Mutlak agar sisa tagihan = pokok + margin
    const rawPrincipal = approveLoanData.principal;
    const principal = typeof rawPrincipal === 'string' ? parseFloat(rawPrincipal.replace(/[^0-9.-]+/g,"")) : Number(rawPrincipal || 0);
    const rawMargin = form.margin.value || '0';
    const margin = parseFloat(rawMargin.replace(/[^0-9.-]+/g,"")) || 0;
    const totalAmount = principal + margin;
    
    const existingActiveLoan = safeLoans.find(l => l.userId === approveLoanData.userId && l.status === 'Aktif');

    // SUDAH DIPERBAIKI: Menerapkan totalAmount ke sisa tagihan (remainingAmount)
    const updatedLoan = {
      ...approveLoanData, 
      principal: principal,
      margin: margin, 
      total: totalAmount, 
      paidAmount: 0,
      remainingAmount: totalAmount,
      installment: totalAmount / Number(approveLoanData.tenor || 1), 
      status: 'Aktif', 
      date: new Date().toISOString().split('T')[0] 
    };

    try {
      if (existingActiveLoan) {
        const payload = {
          oldLoanId: existingActiveLoan.id, payoffAmount: existingActiveLoan.remainingAmount, newLoan: updatedLoan, 
          trxId: generateId('TRX'), date: updatedLoan.date, userId: existingActiveLoan.userId, adminId: currentUser.id
        };
        await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'approveTopUp', data: payload }) });
        
        const netDisbursement = principal - existingActiveLoan.remainingAmount;
        if(netDisbursement > 0) {
           await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'addTransaction', data: {
             id: generateId('OUT'), date: updatedLoan.date, type: 'Pencairan Top-Up', amount: netDisbursement, 
             referenceId: `CAIR-${updatedLoan.id}`, userId: updatedLoan.userId, adminId: currentUser.id
           }}) });
        }
        alert("Top-Up Disetujui! Jurnal kas telah diperbarui otomatis.");
      } else {
        await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'updateLoan', data: updatedLoan }) });
        await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'addTransaction', data: {
            id: generateId('OUT'), date: updatedLoan.date, type: 'Pencairan Akad', amount: principal, 
            referenceId: `CAIR-${updatedLoan.id}`, userId: updatedLoan.userId, adminId: currentUser.id
        }}) });
        alert("Pengajuan disetujui, Akad Berjalan, dan Kas dipotong!");
      }
      setApproveLoanData(null); fetchData();
    } catch(err) { alert("Gagal memproses persetujuan!"); }
    setIsLoading(false);
  };

  const handleEditLoan = async (e) => {
    e.preventDefault(); setIsLoading(true);
    const form = e.target;
    const updatedLoan = {
      ...editingLoan, description: form.description.value,
      total: parseFloat(form.total.value), remainingAmount: parseFloat(form.remaining.value), status: form.status.value
    };
    try {
      // PERBAIKAN: Disamakan menggunakan action 'updateLoan' agar konsisten dengan backend
      await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'updateLoan', data: updatedLoan }) });
      alert("Akad berhasil diperbarui!"); fetchData(); setEditingLoan(null);
    } catch(err) { alert("Gagal memperbarui akad"); }
    setIsLoading(false);
  };

  const handleDeleteLoan = async (id) => {
    if(!window.confirm('PERINGATAN: Yakin menghapus akad ini secara permanen?')) return;
    setIsLoading(true);
    try { await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'deleteLoan', data: { id } }) }); fetchData(); } catch(e) { alert("Gagal menghapus akad"); }
    setIsLoading(false);
  };

  // --- TRANSAKSI BUKU KAS ---
  const handlePayInstallment = async (loan) => {
    // PERBAIKAN 1: Memastikan angka bawaan yang muncul di prompt dibulatkan & tidak berdesimal aneh
    const defaultInstallment = Math.round(loan.installment || 0);
    const inputAmount = window.prompt(`SETORAN CICILAN (Akad ${loan.id})\nAngsuran standar: ${formatRp(defaultInstallment)}\n\nMasukkan nominal pembayaran (Rp):`, defaultInstallment);
    
    if(!inputAmount) return;
    
    // PERBAIKAN 2: Membersihkan input admin dari tanda titik/huruf jika mereka mengetiknya manual
    const parsedAmount = parseFloat(inputAmount.toString().replace(/[^0-9.-]+/g,""));
    if(isNaN(parsedAmount) || parsedAmount <= 0) {
        alert("Gagal: Nominal yang dimasukkan tidak valid!");
        return;
    }
    
    setIsLoading(true);
    
    const newRemaining = (loan.remainingAmount || 0) - parsedAmount;
    
    const newTrx = {
      id: generateId('INV'), date: new Date().toISOString().split('T')[0], type: 'Penerimaan Angsuran',
      amount: parsedAmount, referenceId: loan.id, userId: loan.userId, adminId: currentUser.id
    };
    
    const updatedLoan = {
      ...loan,
      remainingAmount: newRemaining < 0 ? 0 : newRemaining,
      paidAmount: (loan.paidAmount || 0) + parsedAmount,
      status: newRemaining <= 0 ? 'Lunas' : 'Aktif'
    };

    try {
      // 1. Catat kas masuk
      await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'addTransaction', data: newTrx }) });
      
      // 2. PERBAIKAN 3 FATAL: Mengganti action dari 'editLoan' menjadi 'updateLoan'.
      // Karena pada fitur approval yang sudah berjalan lancar, perintah yang digunakan adalah 'updateLoan'.
      await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'updateLoan', data: updatedLoan }) }); 
      
      alert("Cicilan berhasil dicatat & Sisa hutang terpotong!"); 
      setPrintInvoice(newTrx); 
      fetchData(); 
    } catch (err) { 
      alert("Gagal memproses pembayaran. Silakan coba lagi.");
      console.error(err);
    }
    setIsLoading(false);
  };

  const handleManualTrx = async (e) => {
    e.preventDefault(); setIsLoading(true);
    const form = e.target;
    const newTrx = {
      id: generateId('TRX'), date: form.date.value, type: form.type.value, amount: parseFloat(form.amount.value),
      referenceId: form.description.value, userId: 'Internal', adminId: currentUser.id
    };
    try {
      await fetch(GAS_URL, { method: 'POST', body: JSON.stringify({ action: 'addTransaction', data: newTrx }) });
      alert("Transaksi Kas Berhasil Dicatat ke Buku Besar!"); fetchData(); setShowTrxModal(false);
    } catch (err) { alert("Gagal memproses transaksi"); }
    setIsLoading(false);
  };

  // ==========================================
  // VIEW RENDERER UTAMA
  // ==========================================
  if (!currentUser) return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-10 rounded-2xl shadow-xl max-w-sm w-full border-t-8 border-emerald-600">
          <ShieldCheck className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-center text-slate-800 mb-6">Sistem Koperasi</h2>
          <input name="username" placeholder="Username / ID" required className="w-full mb-4 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          <input name="password" type="password" placeholder="Password" required className="w-full mb-6 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500" />
          <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-emerald-700 transition">Masuk</button>
        </form>
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
    <div className="min-h-screen flex bg-slate-50">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col no-print shadow-xl min-h-screen sticky top-0">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-emerald-500" />
          <div><h1 className="font-bold text-white leading-tight">KSP MBS</h1><p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Enterprise Core</p></div>
        </div>
        <nav className="flex-1 p-4 space-y-1 mt-2 overflow-y-auto">
          <button onClick={() => setCurrentView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${currentView === 'dashboard' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800'}`}><LayoutDashboard className="w-5 h-5"/> Ikhtisar</button>
          
          {currentUser.role === 'admin' && (
             <>
               <p className="text-[10px] font-bold text-slate-500 uppercase px-4 mt-6 mb-2">Operasional</p>
               <button onClick={() => setCurrentView('members')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${currentView === 'members' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800'}`}><Users className="w-5 h-5"/> Data Anggota</button>
               <button onClick={() => setCurrentView('loans')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${currentView === 'loans' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800'}`}><Wallet className="w-5 h-5"/> Manajemen Akad</button>
               <button onClick={() => setCurrentView('assets')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${currentView === 'assets' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800'}`}><Box className="w-5 h-5"/> Inventaris & Aset</button>
               
               <p className="text-[10px] font-bold text-slate-500 uppercase px-4 mt-6 mb-2">Keuangan & Laporan</p>
               <button onClick={() => setCurrentView('accounting')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${currentView === 'accounting' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800'}`}><BookOpen className="w-5 h-5"/> Laporan Keuangan</button>
             </>
          )}
          
          <p className="text-[10px] font-bold text-slate-500 uppercase px-4 mt-6 mb-2">Akun Saya</p>
          <button onClick={() => setCurrentView('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${currentView === 'settings' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800'}`}><Settings className="w-5 h-5"/> Pengaturan</button>
        </nav>
        <div className="p-4 bg-slate-950">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center font-bold text-white">{currentUser.name.charAt(0)}</div>
            <div><p className="text-white text-sm font-bold">{currentUser.name}</p><p className="text-xs text-slate-500 capitalize">{currentUser.role}</p></div>
          </div>
          <button onClick={() => setCurrentUser(null)} className="w-full py-2 bg-slate-800 hover:bg-red-900/50 hover:text-red-400 text-slate-400 text-sm font-bold flex items-center justify-center gap-2 rounded-lg transition"><LogOut className="w-4 h-4"/> Logout</button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <div className="p-8 no-print border-b border-slate-200 bg-white sticky top-0 z-10 flex justify-between items-center shadow-sm">
          <h2 className="text-2xl font-black text-slate-800">
            {currentView === 'dashboard' && 'Dashboard Interaktif'}
            {currentView === 'members' && 'Manajemen Keanggotaan'}
            {currentView === 'loans' && 'Persetujuan & Manajemen Akad'}
            {currentView === 'assets' && 'Inventaris & Aset Koperasi'}
            {currentView === 'accounting' && 'Akuntansi & Laporan Keuangan'}
            {currentView === 'settings' && 'Pengaturan Akun'}
          </h2>
          <button onClick={fetchData} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-200 flex gap-2 items-center">
            {isLoading ? '🔄 Loading...' : '🔄 Sinkron Data'}
          </button>
        </div>

        <div className="p-8">
            
            {/* --- DASHBOARD ADMIN --- */}
            {currentView === 'dashboard' && currentUser.role === 'admin' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-blue-500"><p className="text-sm font-bold text-slate-500 uppercase">Kas Sistem (Liquid)</p><h3 className="text-3xl font-black mt-2 text-slate-800">{formatRp(totalKas)}</h3></div>
                   <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-amber-500"><p className="text-sm font-bold text-slate-500 uppercase">Total Piutang Berjalan</p><h3 className="text-3xl font-black mt-2 text-slate-800">{formatRp(totalPiutang)}</h3></div>
                   <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-emerald-500"><p className="text-sm font-bold text-slate-500 uppercase">Pengajuan Akad Baru</p><h3 className="text-3xl font-black mt-2 text-slate-800">{safeLoans.filter(l => l.status === 'Pending').length} Pending</h3></div>
                </div>
                <div className="bg-slate-900 rounded-3xl p-8 text-white flex justify-between items-center shadow-xl">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Selamat Bekerja, Admin {currentUser.name}!</h2>
                    <p className="text-slate-300 text-sm max-w-xl">Laporan keuangan telah diekstrak secara otomatis. Pastikan selalu mencatat penerimaan dan pengeluaran manual melalui menu Laporan agar Jurnal Kas tetap seimbang.</p>
                  </div>
                  <TrendingUp className="w-24 h-24 text-slate-700 opacity-50 hidden md:block" />
                </div>
              </div>
            )}

            {/* --- MANAJEMEN ANGGOTA --- */}
            {currentView === 'members' && currentUser.role === 'admin' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
                  <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-emerald-600"/> Pendaftaran Anggota</h3>
                  <form onSubmit={handleAddMember} className="space-y-4">
                    <div><label className="text-xs font-bold text-slate-500">Nama Lengkap</label><input name="name" required className="w-full mt-1 border border-slate-300 p-3 rounded-lg outline-none" /></div>
                    <div><label className="text-xs font-bold text-slate-500">Username Login</label><input name="username" required className="w-full mt-1 border border-slate-300 p-3 rounded-lg outline-none" /></div>
                    <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-xs font-medium border border-amber-100 flex gap-2"><AlertCircle className="w-4 h-4 shrink-0"/> Password default: <b>123456</b>.</div>
                    <button type="submit" disabled={isLoading} className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800">Daftarkan Anggota Baru</button>
                  </form>
                </div>

                <div className="lg:col-span-2 bg-white p-0 rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                   <h3 className="font-bold text-slate-800 text-lg p-6 border-b border-slate-100 bg-slate-50">Daftar Anggota Koperasi</h3>
                   <table className="w-full text-left text-sm">
                     <thead className="bg-white text-slate-500 border-b border-slate-200"><tr><th className="p-4 font-bold">Info Anggota</th><th className="p-4 font-bold text-center">Status</th><th className="p-4 font-bold text-right">Aksi</th></tr></thead>
                     <tbody className="divide-y divide-slate-50">
                       {safeUsers.filter(u => u.role === 'member').map(u => (
                         <tr key={u.id} className="hover:bg-slate-50">
                           <td className="p-4"><p className="font-bold text-slate-800">{u.name}</p><p className="text-xs text-slate-500">User: {u.username}</p></td>
                           <td className="p-4 text-center"><span className={`px-3 py-1 rounded-full text-xs font-bold ${u.status === 'Aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{u.status}</span></td>
                           <td className="p-4 text-right space-x-2">
                             <button onClick={() => handleResetPassword(u)} className="text-xs font-bold px-3 py-2 rounded border border-amber-200 text-amber-600 hover:bg-amber-50">Reset Sandi</button>
                             <button onClick={() => handleToggleMember(u)} className={`text-xs font-bold px-3 py-2 rounded border ${u.status === 'Aktif' ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>{u.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}</button>
                           </td>
                         </tr>
                       )).reverse()}
                     </tbody>
                   </table>
                </div>
              </div>
            )}

            {/* --- MANAJEMEN ASET / INVENTARIS --- */}
            {currentView === 'assets' && currentUser.role === 'admin' && (
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-xl font-black text-slate-800">Manajemen Aset & Inventaris</h2>
                   <button onClick={() => {setEditingAsset(null); setShowAssetModal(true);}} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 shadow-md">
                     <Plus className="w-4 h-4"/> Tambah Aset
                   </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                   <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl"><p className="text-xs font-bold text-blue-500 uppercase">Total Item Aset</p><p className="text-3xl font-black text-slate-800">{safeAssets.length}</p></div>
                   <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-2xl"><p className="text-xs font-bold text-emerald-600 uppercase">Total Valuasi Aset</p><p className="text-3xl font-black text-slate-800">{formatRp(totalAsetTetap)}</p></div>
                </div>
                <table className="w-full text-left text-sm">
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
            )}

            {/* --- MANAJEMEN AKAD --- */}
            {currentView === 'loans' && currentUser.role === 'admin' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
                    <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-emerald-600"/> Input Akad Offline</h3>
                    <p className="text-xs text-slate-500 mb-4">Kas akan otomatis terpotong saat form disubmit.</p>
                    <form onSubmit={handleOfflineLoan} className="space-y-4">
                       <select name="userId" required className="w-full border p-3 rounded-lg outline-none text-sm"><option value="">Pilih Anggota...</option>{safeUsers.filter(u=>u.role==='member').map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select>
                       <select name="type" required className="w-full border p-3 rounded-lg outline-none text-sm"><option value="">Jenis Akad...</option><option value="Murabahah bil Wakalah">Murabahah (Kredit Barang)</option><option value="Qardh dengan Ujrah">Qardh (Pinjaman Tunai)</option></select>
                       <input name="description" placeholder="Keperluan" required className="w-full border p-3 rounded-lg text-sm outline-none" />
                       <input name="principal" type="text" placeholder="Pokok / Modal (Rp)" required className="w-full border p-3 rounded-lg font-bold outline-none" />
                       <input name="margin" type="text" placeholder="Margin Keuntungan (Rp)" className="w-full border p-3 rounded-lg font-bold outline-none" />
                       <input name="tenor" type="number" placeholder="Tenor (Bulan)" required className="w-full border p-3 rounded-lg text-sm outline-none" />
                       <button type="submit" disabled={isLoading} className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800">Aktifkan & Cairkan</button>
                    </form>
                 </div>

                 <div className="lg:col-span-2 space-y-8">
                    {/* ACC PENGAJUAN */}
                    {safeLoans.filter(l => l.status === 'Pending').length > 0 && (
                      <div className="bg-white rounded-2xl shadow-sm border-2 border-amber-200 overflow-hidden">
                        <div className="bg-amber-50 p-5 flex items-center justify-between border-b border-amber-200">
                          <h3 className="font-bold text-amber-800 flex items-center gap-2"><Clock className="w-5 h-5"/> Menunggu Evaluasi</h3>
                        </div>
                        <table className="w-full text-left text-sm">
                          <tbody className="divide-y divide-slate-100">
                            {safeLoans.filter(l => l.status === 'Pending').map(loan => (
                              <tr key={loan.id} className="bg-white">
                                <td className="p-5">
                                  <p className="font-bold text-slate-800">{safeUsers.find(u => u.id == loan.userId)?.name}</p>
                                  <p className="text-xs text-slate-500">{loan.type} | {loan.description}</p>
                                </td>
                                <td className="p-5 font-black text-slate-800">{formatRp(loan.principal)}</td>
                                <td className="p-5 text-right"><button onClick={() => setApproveLoanData(loan)} className="bg-emerald-600 text-white px-5 py-2 rounded-lg font-bold text-xs hover:bg-emerald-700">Tinjau</button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* DAFTAR AKAD AKTIF */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                      <h3 className="font-bold text-slate-800 text-lg p-6 border-b border-slate-100 bg-slate-50">Manajemen Tagihan Anggota</h3>
                      <table className="w-full text-left text-sm">
                        {/* SUDAH DIPERBAIKI: UI Kolom Tabel */}
                        <thead className="bg-white text-slate-400 border-b border-slate-100 text-xs uppercase"><tr><th className="p-5 font-bold">Anggota & ID</th><th className="p-5 font-bold">Detail Tagihan</th><th className="p-5 font-bold text-right min-w-[200px]">Aksi</th></tr></thead>
                        <tbody className="divide-y divide-slate-50">
                          {safeLoans.filter(l => l.status !== 'Pending').map(loan => (
                            <tr key={loan.id} className="hover:bg-slate-50 group">
                              <td className="p-5">
                                <p className="font-bold text-slate-800 text-base">{safeUsers.find(u => u.id == loan.userId)?.name || loan.userId}</p>
                                <p className="text-xs text-slate-400 mb-2">ID: {loan.id}</p>
                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">{loan.type}</span>
                              </td>
                              <td className="p-5 w-64">
                                <div className="flex justify-between text-slate-500 mb-1"><span className="text-xs">Total:</span> <span className="font-bold text-slate-800">{formatRp(loan.total)}</span></div>
                                <div className="flex justify-between text-slate-500 mb-2"><span className="text-xs">Sisa:</span> <span className="font-bold text-red-600">{formatRp(loan.remainingAmount)}</span></div>
                                <div className="border-t border-slate-200 pt-2 flex justify-between items-center"><span className="text-[10px] font-bold uppercase text-slate-400">CICILAN/BLN:</span> <span className="font-bold text-emerald-600">{formatRp(loan.installment)}</span></div>
                              </td>
                              <td className="p-5 text-right flex justify-end gap-2 items-center h-full">
                                {loan.status === 'Aktif' ? (
                                  <button onClick={() => handlePayInstallment(loan)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800">Terima Cicilan</button>
                                ) : (
                                  <span className="text-slate-400 font-black text-xs px-3 py-2 bg-slate-50 rounded-lg border">LUNAS</span>
                                )}
                                <button onClick={() => setEditingLoan(loan)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg" title="Edit Akad"><Edit className="w-4 h-4"/></button>
                                <button onClick={() => handleDeleteLoan(loan.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg" title="Hapus Akad"><Trash2 className="w-4 h-4"/></button>
                              </td>
                            </tr>
                          )).reverse()}
                        </tbody>
                      </table>
                    </div>
                 </div>
              </div>
            )}

            {/* --- AKUNTANSI & LAPORAN KEUANGAN --- */}
            {currentView === 'accounting' && currentUser.role === 'admin' && (
              <div className="space-y-6">
                 <div className="flex flex-wrap gap-2 no-print bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                    <button onClick={()=>setAccountingTab('jurnal')} className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm flex justify-center items-center gap-2 transition ${accountingTab==='jurnal'?'bg-slate-900 text-white':'text-slate-500 hover:bg-slate-50'}`}><BookOpen className="w-4 h-4"/> Buku Kas (Jurnal)</button>
                    <button onClick={()=>setAccountingTab('labarugi')} className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm flex justify-center items-center gap-2 transition ${accountingTab==='labarugi'?'bg-slate-900 text-white':'text-slate-500 hover:bg-slate-50'}`}><TrendingUp className="w-4 h-4"/> Laba Rugi</button>
                    <button onClick={()=>setAccountingTab('neraca')} className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm flex justify-center items-center gap-2 transition ${accountingTab==='neraca'?'bg-slate-900 text-white':'text-slate-500 hover:bg-slate-50'}`}><Scale className="w-4 h-4"/> Neraca Aktiva Pasiva</button>
                    <button onClick={()=>setAccountingTab('calk')} className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm flex justify-center items-center gap-2 transition ${accountingTab==='calk'?'bg-slate-900 text-white':'text-slate-500 hover:bg-slate-50'}`}><FileText className="w-4 h-4"/> C.A.L.K</button>
                 </div>

                 <div className="flex justify-between items-center no-print">
                    <button onClick={() => setShowTrxModal(true)} className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-md">
                      <Plus className="w-4 h-4"/> Jurnal Kas Manual
                    </button>
                    <button onClick={() => window.print()} className="bg-white border border-slate-300 text-slate-700 px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50 shadow-sm">
                      <Printer className="w-4 h-4"/> Cetak Laporan (PDF)
                    </button>
                 </div>

                 <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-200 print-container text-slate-800 print:shadow-none print:border-none print:p-0">
                    <div className="text-center mb-10 pb-6 border-b-4 border-slate-900 hidden print:block">
                       <h1 className="text-3xl font-black uppercase">Koperasi Mitra Baraya Sejahtera (MBS)</h1>
                       <p className="text-sm font-medium mt-1">Laporan Keuangan Internal - Diekstrak secara otomatis dari Sistem Syariah Core v2</p>
                       <p className="text-xs mt-1">Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>

                    {accountingTab === 'jurnal' && (
                       <div>
                          <h2 className="text-2xl font-black mb-1">Buku Kas (Jurnal Umum)</h2>
                          <p className="text-slate-500 text-sm mb-6">Mencatat seluruh arus kas masuk (Debit) dan keluar (Kredit).</p>
                          <table className="w-full text-left text-sm border-collapse border border-slate-300">
                             <thead>
                               <tr className="bg-slate-100 text-slate-700"><th className="p-3 border border-slate-300 w-24">Tanggal</th><th className="p-3 border border-slate-300">Keterangan Jurnal</th><th className="p-3 border border-slate-300 text-right w-32 bg-emerald-50">Debit (Masuk)</th><th className="p-3 border border-slate-300 text-right w-32 bg-red-50">Kredit (Keluar)</th><th className="p-3 border border-slate-300 text-right w-36 bg-blue-50">Saldo Akhir</th></tr>
                             </thead>
                             <tbody>
                               {calcTransactions.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-slate-400 font-medium">Belum ada transaksi tercatat.</td></tr>}
                               {calcTransactions.map(trx => {
                                 const usr = safeUsers.find(u => u.id === trx.userId);
                                 return(
                                 <tr key={trx.id} className="hover:bg-slate-50">
                                   <td className="p-3 border border-slate-300 text-xs font-mono">{trx.date}</td>
                                   <td className="p-3 border border-slate-300">
                                      <p className="font-bold">{trx.type}</p>
                                      <p className="text-xs text-slate-500">Ref: {trx.referenceId} {usr ? `(${usr.name})` : ''}</p>
                                   </td>
                                   <td className="p-3 border border-slate-300 text-right font-medium text-emerald-700">{trx.isIncome ? formatRp(trx.amount) : '-'}</td>
                                   <td className="p-3 border border-slate-300 text-right font-medium text-red-600">{!trx.isIncome ? formatRp(trx.amount) : '-'}</td>
                                   <td className="p-3 border border-slate-300 text-right font-black text-slate-800">{formatRp(trx.currentBalance)}</td>
                                 </tr>
                               )})}
                             </tbody>
                             <tfoot>
                                <tr className="bg-slate-900 text-white font-black text-base">
                                   <td colSpan="2" className="p-4 text-right border border-slate-800">TOTAL SALDO KAS TERSEDIA:</td>
                                   <td colSpan="3" className="p-4 text-center border border-slate-800 bg-slate-800">{formatRp(totalKas)}</td>
                                </tr>
                             </tfoot>
                          </table>
                       </div>
                    )}

                    {accountingTab === 'labarugi' && (
                       <div className="max-w-3xl mx-auto">
                          <h2 className="text-2xl font-black mb-1 text-center">Laporan Laba Rugi Sederhana</h2>
                          <p className="text-slate-500 text-sm mb-8 text-center">Periode Berjalan S.d {new Date().toLocaleDateString('id-ID')}</p>
                          <div className="border-t-4 border-slate-900 pt-6">
                             <h4 className="font-black text-lg bg-emerald-100 text-emerald-900 px-4 py-2 mb-4">A. PENDAPATAN</h4>
                             <div className="flex justify-between p-2 border-b border-slate-200"><span className="pl-4">Pendapatan Usaha & Koperasi</span><span>{formatRp(totalPendapatanUsaha)}</span></div>
                             <div className="flex justify-between p-4 bg-slate-50 font-black text-emerald-700 mt-2 mb-8"><span>TOTAL PENDAPATAN (Kotor)</span><span>{formatRp(totalPendapatanUsaha)}</span></div>

                             <h4 className="font-black text-lg bg-red-100 text-red-900 px-4 py-2 mb-4">B. BEBAN & PENGELUARAN</h4>
                             <div className="flex justify-between p-2 border-b border-slate-200"><span className="pl-4">Beban Operasional & Gaji</span><span>{formatRp(totalBebanOperasional)}</span></div>
                             <div className="flex justify-between p-4 bg-slate-50 font-black text-red-700 mt-2 mb-8"><span>TOTAL BEBAN</span><span>({formatRp(totalBebanOperasional)})</span></div>

                             <div className="flex justify-between p-6 bg-slate-900 text-white font-black text-xl">
                               <span>SHU / LABA BERSIH BERJALAN</span>
                               <span className={totalPendapatanUsaha - totalBebanOperasional < 0 ? 'text-red-400' : 'text-emerald-400'}>{formatRp(totalPendapatanUsaha - totalBebanOperasional)}</span>
                             </div>
                          </div>
                       </div>
                    )}

                    {accountingTab === 'neraca' && (
                       <div>
                          <h2 className="text-2xl font-black mb-1 text-center">Neraca Keuangan (Balance Sheet)</h2>
                          <p className="text-slate-500 text-sm mb-8 text-center">Per Tanggal: {new Date().toLocaleDateString('id-ID')}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t-4 border-slate-900 pt-6">
                             {/* AKTIVA */}
                             <div>
                               <h4 className="font-black text-xl text-center bg-blue-100 text-blue-900 py-3 mb-4">AKTIVA (ASET)</h4>
                               <p className="font-bold text-slate-800 border-b-2 border-slate-300 pb-1 mb-2 mt-4">Aset Lancar</p>
                               <div className="flex justify-between p-2"><span className="pl-4">Kas & Bank</span><span className="font-medium">{formatRp(totalKas)}</span></div>
                               <div className="flex justify-between p-2"><span className="pl-4">Piutang Pembiayaan (Anggota)</span><span className="font-medium">{formatRp(totalPiutang)}</span></div>
                               <p className="font-bold text-slate-800 border-b-2 border-slate-300 pb-1 mb-2 mt-6">Aset Tetap</p>
                               <div className="flex justify-between p-2"><span className="pl-4">Inventaris Koperasi</span><span className="font-medium">{formatRp(totalAsetTetap)}</span></div>
                               <div className="flex justify-between p-4 bg-blue-50 font-black text-blue-900 mt-6 border-t-4 border-blue-200"><span>TOTAL AKTIVA</span><span>{formatRp(totalAktiva)}</span></div>
                             </div>

                             {/* PASIVA */}
                             <div>
                               <h4 className="font-black text-xl text-center bg-slate-200 text-slate-900 py-3 mb-4">PASIVA (LIABILITAS & EKUITAS)</h4>
                               <p className="font-bold text-slate-800 border-b-2 border-slate-300 pb-1 mb-2 mt-4">Liabilitas (Kewajiban)</p>
                               <div className="flex justify-between p-2"><span className="pl-4">Kewajiban Jangka Pendek</span><span className="font-medium text-slate-400">Rp 0</span></div>
                               <p className="font-bold text-slate-800 border-b-2 border-slate-300 pb-1 mb-2 mt-6">Ekuitas (Modal & SHU)</p>
                               <div className="flex justify-between p-2"><span className="pl-4">Modal Bersih / Total Ekuitas</span><span className="font-medium">{formatRp(totalPasiva)}</span></div>
                               <div className="flex justify-between p-4 bg-slate-100 font-black text-slate-900 mt-6 border-t-4 border-slate-300"><span>TOTAL PASIVA</span><span>{formatRp(totalPasiva)}</span></div>
                             </div>
                          </div>
                       </div>
                    )}

                    {accountingTab === 'calk' && (
                       <div className="max-w-4xl mx-auto space-y-6">
                          <h2 className="text-2xl font-black mb-1 text-center">Catatan Atas Laporan Keuangan (CALK)</h2>
                          <div className="border-t-2 border-slate-200 pt-6 space-y-6 text-justify">
                             <div><h3 className="font-bold text-lg mb-2">1. Kebijakan Akuntansi Kas</h3><p className="text-sm leading-relaxed text-slate-700">Sistem ini mengakui transaksi penerimaan angsuran, simpanan, pendapatan usaha sebagai DEBIT (Kas Bertambah), dan transaksi pencairan akad, biaya operasional sebagai KREDIT (Kas Berkurang).</p></div>
                             <div><h3 className="font-bold text-lg mb-2">2. Rekonsiliasi Piutang</h3><p className="text-sm leading-relaxed text-slate-700">Total piutang sebesar <b>{formatRp(totalPiutang)}</b> ditarik secara *real-time* dari sisa tagihan anggota pada akad aktif. Ketika dicairkan, kas akan terpotong secara otomatis oleh sistem.</p></div>
                             <div><h3 className="font-bold text-lg mb-2">3. Rekapitulasi Aset & Inventaris</h3><p className="text-sm leading-relaxed text-slate-700">Koperasi memiliki <b>{safeAssets.length} item aset</b> dengan total valuasi buku sebesar <b>{formatRp(totalAsetTetap)}</b> yang dicatat pada neraca di bagian Aset Tetap.</p></div>
                             <div className="mt-16 pt-16 grid grid-cols-2 text-center text-sm font-bold">
                               <div><p className="mb-16">Mengetahui,</p><p className="underline decoration-2 underline-offset-4">Ketua Koperasi</p></div>
                               <div><p className="mb-16">Disusun Oleh,</p><p className="underline decoration-2 underline-offset-4">Bagian Keuangan / Admin</p></div>
                             </div>
                          </div>
                       </div>
                    )}
                 </div>
              </div>
            )}

            {/* --- DASHBOARD MEMBER --- */}
            {currentView === 'dashboard' && currentUser.role === 'member' && (
              <div className="space-y-8">
                {(() => {
                  const score = getCreditScore(currentUser.id);
                  const activeLoan = safeLoans.find(l => l.userId === currentUser.id && l.status === 'Aktif');
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-emerald-900 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-3xl opacity-20 -mr-20 -mt-20"></div>
                         <p className="text-emerald-300 font-bold mb-1 uppercase text-xs">{score.tier}</p>
                         <h2 className="text-3xl font-black mb-4">Plafon Pinjaman</h2>
                         <p className="text-5xl font-black text-emerald-100 mb-6">{formatRp(score.limit)}</p>
                         <div className="bg-emerald-950/50 p-4 rounded-xl text-xs font-medium text-emerald-200">
                           <p>Anda telah melunasi <b>{score.lunasCount} Akad</b>. Pertahankan kedisiplinan cicilan Anda untuk menaikkan limit pembiayaan!</p>
                         </div>
                      </div>

                      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                         <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                           {activeLoan ? <><TrendingUp className="w-5 h-5 text-amber-500"/> Ajukan Top-Up (Refinancing)</> : <><Wallet className="w-5 h-5 text-emerald-600"/> Ajukan Akad Baru</>}
                         </h3>
                         {activeLoan && <div className="mb-4 bg-amber-50 text-amber-800 text-xs p-3 rounded-xl border border-amber-200"><b>Info Top-Up:</b> Anda memiliki sisa tagihan aktif {formatRp(activeLoan.remainingAmount)}. Pencairan baru akan otomatis dipotong untuk melunasi hutang lama.</div>}
                         <form onSubmit={handleApplyLoan} className="space-y-4">
                           <select name="type" required className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none font-medium">
                             <option value="Murabahah bil Wakalah">Kredit Pembelian Barang (Murabahah)</option>
                             <option value="Qardh dengan Ujrah">Pinjaman Tunai (Qardh)</option>
                           </select>
                           <input name="description" required placeholder="Keperluan (Cth: Beli Laptop)" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none" />
                           <div className="grid grid-cols-2 gap-4">
                             <input name="principal" type="number" max={score.limit} required placeholder="Nominal" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold outline-none" />
                             <input name="tenor" type="number" min="1" max="60" required placeholder="Tenor (Bulan)" className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none" />
                           </div>
                           <button type="submit" disabled={isLoading} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 shadow-md">Kirim Pengajuan</button>
                         </form>
                      </div>
                    </div>
                  );
                })()}

                <div>
                  <h2 className="text-xl font-black text-slate-800 mb-6">Riwayat & Tagihan Anda</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {safeLoans.filter(l => l.userId == currentUser.id).length === 0 && <div className="text-slate-400 font-medium">Belum ada riwayat tagihan.</div>}
                     {safeLoans.filter(l => l.userId == currentUser.id).map(loan => (
                       <div key={loan.id} className="p-6 border border-slate-200 rounded-3xl bg-white shadow-sm flex flex-col justify-between relative overflow-hidden">
                         <div className="absolute top-0 right-0">
                           {loan.status === 'Pending' && <span className="bg-amber-100 text-amber-700 text-xs font-bold px-6 py-2 rounded-bl-2xl inline-block">⏳ Sedang Dievaluasi</span>}
                           {loan.status === 'Aktif' && <span className="bg-red-500 text-white text-xs font-bold px-6 py-2 rounded-bl-2xl inline-block shadow-md">🔴 TAGIHAN AKTIF</span>}
                           {loan.status === 'Lunas' && <span className="bg-slate-800 text-white text-xs font-bold px-6 py-2 rounded-bl-2xl inline-block">✅ LUNAS</span>}
                         </div>
                         <div className="pt-4">
                           <span className="text-xs font-bold text-emerald-600 mb-2 block uppercase">{loan.type}</span>
                           <h3 className="font-black text-xl text-slate-800 mb-1">{loan.description}</h3>
                           <p className="text-xs text-slate-400 font-mono mb-6">Ref: {loan.id}</p>
                           {loan.status === 'Pending' ? (
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><p className="text-xs text-slate-500 mb-1">Pengajuan:</p><p className="font-black text-2xl text-slate-800">{formatRp(loan.principal)}</p></div>
                           ) : (
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-slate-500 text-xs font-bold tracking-wider mb-1">SISA TAGIHAN</p>
                                <p className={`text-3xl font-black ${loan.status === 'Aktif' ? 'text-red-600' : 'text-slate-300'}`}>{formatRp(loan.remainingAmount)}</p>
                                <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between">
                                   <div><p className="text-[10px] text-slate-400 font-bold uppercase">Total Akad</p><p className="font-bold text-slate-700 text-sm">{formatRp(loan.total)}</p></div>
                                   <div className="text-right"><p className="text-[10px] text-slate-400 font-bold uppercase">Cicilan / Bln</p><p className="font-bold text-emerald-700 text-sm">{formatRp(loan.installment)}</p></div>
                                </div>
                              </div>
                           )}
                         </div>
                       </div>
                     )).reverse()}
                  </div>
                </div>
              </div>
            )}

            {/* --- PENGATURAN KUNCI --- */}
            {currentView === 'settings' && (
              <div className="max-w-md bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
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

      {/* ==========================================
          MODALS AREA 
      ========================================== */}
      
      {/* Modal Jurnal Manual */}
      {showTrxModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="font-black text-lg text-slate-800">Jurnal Kas Manual</h3>
              <button onClick={()=>setShowTrxModal(false)} className="text-slate-400 hover:text-red-500 font-bold"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleManualTrx} className="p-6 space-y-4">
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-4">
                 <button type="button" onClick={()=>setTrxTypeSelect('IN')} className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${trxTypeSelect==='IN'?'bg-emerald-600 text-white shadow':'text-slate-500'}`}>Kas Masuk</button>
                 <button type="button" onClick={()=>setTrxTypeSelect('OUT')} className={`flex-1 py-2 rounded-lg font-bold text-sm transition ${trxTypeSelect==='OUT'?'bg-red-600 text-white shadow':'text-slate-500'}`}>Kas Keluar</button>
              </div>
              <div><label className="text-xs font-bold text-slate-500">Tanggal</label><input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full border-2 p-3 rounded-xl mt-1 outline-none" required/></div>
              <div>
                <label className="text-xs font-bold text-slate-500">Kategori</label>
                <select name="type" className="w-full border-2 p-3 rounded-xl mt-1 font-bold outline-none" required>
                   {trxTypeSelect === 'IN' ? (
                     // SUDAH DIPERBAIKI: Pilihan Modal Awal
                     <>
                        <option value="Modal Awal">Modal Awal / Dana Awal Koperasi</option>
                        <option value="Pendapatan Usaha">Pendapatan Usaha (Laba/Bagi Hasil)</option>
                        <option value="Simpanan Anggota">Setoran Simpanan Anggota</option>
                        <option value="Pemasukan Lainnya">Pemasukan Lainnya</option>
                     </>
                   ) : (
                     <>
                        <option value="Biaya Operasional">Biaya Operasional (Listrik, dll)</option>
                        <option value="Gaji & Honor">Gaji Karyawan</option>
                        <option value="Pengeluaran Lainnya">Pengeluaran Lainnya</option>
                     </>
                   )}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Keterangan</label>
                <input name="description" placeholder="Contoh: Dana awal investasi" className="w-full border-2 p-3 rounded-xl mt-1 outline-none" required />
              </div>
              <div>
                <label className={`text-xs font-bold ${trxTypeSelect === 'IN' ? 'text-emerald-600' : 'text-red-600'}`}>Nominal (Rp)</label>
                <input type="number" name="amount" className="w-full border-2 p-3 rounded-xl mt-1 outline-none font-black text-lg" required />
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 shadow-xl mt-2">Simpan Jurnal</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Aset */}
      {showAssetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="font-black text-lg text-slate-800">{editingAsset ? 'Edit Data Aset' : 'Input Aset Baru'}</h3>
              <button onClick={()=>{setShowAssetModal(false); setEditingAsset(null);}}><X className="text-slate-400 hover:text-red-500 w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSaveAsset} className="p-6 space-y-4">
              <div><label className="text-xs font-bold text-slate-500">Nama Aset</label><input name="name" defaultValue={editingAsset?.name} placeholder="Cth: Laptop Admin" className="w-full border-2 p-3 rounded-xl outline-none" required/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-slate-500">Kategori</label><select name="category" defaultValue={editingAsset?.category || 'Elektronik'} className="w-full border-2 p-3 rounded-xl outline-none"><option value="Elektronik">Elektronik</option><option value="Properti">Properti</option><option value="Kendaraan">Kendaraan</option><option value="Lainnya">Lainnya</option></select></div>
                <div><label className="text-xs font-bold text-slate-500">Tgl Perolehan</label><input type="date" name="date" defaultValue={editingAsset?.purchaseDate || new Date().toISOString().split('T')[0]} className="w-full border-2 p-3 rounded-xl outline-none" required/></div>
              </div>
              <div><label className="text-xs font-bold text-blue-600">Nilai Buku / Harga (Rp)</label><input type="number" name="value" defaultValue={editingAsset?.value} className="w-full border-2 border-blue-200 p-3 rounded-xl outline-none font-black text-blue-700" required/></div>
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 mt-2 shadow-lg">Simpan Inventaris</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Akad */}
      {editingLoan && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="font-black text-lg text-slate-800">Edit Data Akad</h3>
              <button onClick={()=>setEditingLoan(null)}><X className="text-slate-400 hover:text-red-500 w-5 h-5"/></button>
            </div>
            <form onSubmit={handleEditLoan} className="p-6 space-y-4">
              <div><label className="text-xs font-bold text-slate-500">Keperluan</label><input name="description" defaultValue={editingLoan.description} className="w-full border-2 p-3 rounded-xl outline-none" required/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-slate-500">Total Piutang</label><input name="total" type="number" defaultValue={editingLoan.total} className="w-full border-2 p-3 rounded-xl outline-none" required/></div>
                <div><label className="text-xs font-bold text-slate-500">Sisa Tagihan</label><input name="remaining" type="number" defaultValue={editingLoan.remainingAmount} className="w-full border-2 border-red-200 text-red-600 p-3 rounded-xl outline-none" required/></div>
              </div>
              <div><label className="text-xs font-bold text-slate-500">Status</label><select name="status" defaultValue={editingLoan.status} className="w-full border-2 p-3 rounded-xl outline-none"><option value="Aktif">Aktif</option><option value="Lunas">Lunas</option><option value="Bermasalah">Bermasalah</option></select></div>
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 mt-2">Simpan Perubahan</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Acc & Top-Up */}
      {approveLoanData && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-slate-900 p-6 text-white border-b-4 border-emerald-500">
              <h3 className="font-bold text-xl">Persetujuan & Pencairan</h3>
              <p className="text-slate-300 text-sm mt-1">{safeUsers.find(u => u.id == approveLoanData.userId)?.name}</p>
            </div>
            <form onSubmit={handleProcessApproval} className="p-6 space-y-4 bg-slate-50">
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Pencairan Koperasi (Kas Keluar)</p>
                <p className="text-2xl font-black text-red-600">{formatRp(approveLoanData.principal)}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-emerald-800 uppercase">Margin / Jasa Koperasi (Rp)</label>
                <input name="margin" type="number" defaultValue="0" required min="0" className="w-full mt-1 border-2 border-emerald-300 p-3 rounded-lg font-bold text-emerald-900 outline-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setApproveLoanData(null)} className="flex-1 bg-white border border-slate-300 font-bold py-3 rounded-xl hover:bg-slate-100">Batal</button>
                <button type="submit" disabled={isLoading} className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700">Sahkan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @media print { body * { visibility: hidden; } .print-container, .print-container * { visibility: visible; } .print-container { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; border: none !important; box-shadow: none !important; } .no-print { display: none !important; } }
      `}} />
    </div>
  );
}