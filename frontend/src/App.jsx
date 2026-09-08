import React, { useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { io } from 'socket.io-client'
import Piscina from './Piscina.jsx'
import Restaurante from './Restaurante.jsx'
import Infraestructura from './Infraestructura.jsx'
import Login from './Login.jsx'
import {
  KpiCardNew,
  DailyIncomeLineChart,
  DonutChartCustom,
  ServiceBarChart,
  UpcomingReservationsList,
  QuickSummaryBanner,
  COLORS
} from './DashboardComponents.jsx'

const allNavItems = [
  { path: '/', icon: 'dashboard', label: 'Dashboard' },
  { path: '/whatsapp', icon: 'chat', label: 'WhatsApp' },
  { path: '/canchas', icon: 'calendar_today', label: 'Calendario Canchas' },
  { path: '/piscina', icon: 'pool', label: 'Piscina' },
  { path: '/restaurante', icon: 'restaurant', label: 'Restaurante' },
  { path: '/clientes', icon: 'group', label: 'Clientes' },
  { path: '/infraestructura', icon: 'settings_input_component', label: 'Gestión de infraestructura' },
];

const Sidebar = ({ isWhatsAppView, user, onLogout }) => {
  const location = useLocation();

  // Filter nav items based on user permissions
  const navItems = allNavItems.filter(item => 
    user?.role === 'ADMIN' || user?.permissions?.includes(item.path) || item.path === '/'
  );

  return (
    <aside className="h-full w-56 flex-col bg-brand-purple flex p-4 gap-y-4 font-['Manrope'] antialiased tracking-[-0.02em] shadow-2xl z-[60] flex-shrink-0">
      <div className="flex flex-col items-center mb-6 mt-2 transition-transform hover:scale-105 duration-300">
        <div className="relative w-32">
          <img src="/logo.png" alt="Encanto Logo" className="w-32 object-contain" />
          <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: '#872B90' }}>
            <span className="text-white text-lg font-black tracking-widest">LOGO</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={
                isActive
                  ? "flex items-center gap-2.5 px-3 py-2.5 text-white font-semibold bg-brand-purple-dark border-l-4 border-primary rounded-r-lg transition-all duration-200"
                  : "flex items-center gap-2.5 px-3 py-2.5 text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 group rounded-lg"
              }
            >
              <span
                className={`material-symbols-outlined text-[20px] ${!isActive ? 'group-hover:scale-110 transition-transform' : ''}`}
                style={isActive ? { fontVariationSettings: '"FILL" 1' } : {}}
              >
                {item.icon}
              </span>
              <span className="font-medium text-sm truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-5 border-t border-white/10">
        <div className="mb-5 flex items-center gap-2.5 px-2">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-black text-sm shadow-lg flex-shrink-0">
            {user?.name?.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-[11px] font-black uppercase truncate">{user?.name}</p>
            <p className="text-white/50 text-[9px] font-bold uppercase tracking-widest">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full bg-white/10 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 hover:bg-white/20 border border-white/10"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

const Layout = ({ children, user, onLogout }) => {
  const location = useLocation();
  const isWhatsAppView = location.pathname === '/whatsapp';

  if (isWhatsAppView) {
    return (
      <div className="bg-[#E5DDD5] font-body text-on-surface antialiased overflow-hidden h-screen w-full flex">
        <Sidebar isWhatsAppView={true} user={user} onLogout={onLogout} />
        <div className="flex-1 flex flex-col min-w-0">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface font-body text-on-surface antialiased min-h-screen flex">
      <div className="fixed left-0 top-0 h-screen z-[70]">
        <Sidebar isWhatsAppView={false} user={user} onLogout={onLogout} />
      </div>
      <main className="ml-56 flex-1 min-h-screen min-w-0">
        {children}
      </main>
    </div>
  );
};

const ACCENTS = {
  purple: { bg: 'bg-brand-purple', iconColor: 'text-white', text: 'text-brand-purple', dark: 'text-brand-purple-dark' },
  secondary: { bg: 'bg-secondary', iconColor: 'text-white', text: 'text-secondary', dark: 'text-secondary' },
  primary: { bg: 'bg-primary', iconColor: 'text-white', text: 'text-primary', dark: 'text-primary' },
  pending: { bg: 'bg-pending', iconColor: 'text-white', text: 'text-pending', dark: 'text-pending' },
};

const fmtCOP = (n) => `$${Math.round(n || 0).toLocaleString('es-CO')}`;
const fmtTimeBogota = (iso) => new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' });

const KpiCard = ({ icon, label, value, valueSuffix, subtext, footLabel, footValue, accent = 'purple' }) => {
  const a = ACCENTS[accent];
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`p-3.5 ${a.bg} ${a.iconColor} rounded-2xl flex items-center justify-center shrink-0`}>
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none mb-1.5">{label}</p>
        <h3 className={`text-2xl font-headline font-extrabold ${a.text} leading-tight`}>
          {value} {valueSuffix && <span className="text-[10px] font-bold text-slate-600">{valueSuffix}</span>}
        </h3>
        {subtext && <p className="text-[10px] text-slate-700 mt-1 font-medium">{subtext}</p>}
        {footLabel && (
          <div className="mt-3 pt-2.5 border-t border-slate-200 flex justify-between items-center text-[11px] font-bold text-slate-800">
            <span>{footLabel}</span>
            <span className={`font-black ${a.text} text-xs`}>{footValue}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard = ({ user }) => {
  const [poolStats, setPoolStats] = useState({ today: 0, todayCount: 0, month: 0 });
  const [bookingStats, setBookingStats] = useState({ reservasHoy: 0, pendientesPago: 0, ingresosHoy: 0, ingresosMes: 0, totalCanchas: 0 });
  const [saleStats, setSaleStats] = useState({ ventasHoy: 0, totalHoy: 0, ventasMes: 0, totalMes: 0 });
  const [whatsappStats, setWhatsappStats] = useState({ mensajesHoy: 0, respondidosIA: 0, chatsActivos: 0, requierenAtencion: 0 });
  const [customerStats, setCustomerStats] = useState({ total: 0, nuevosHoy: 0 });
  const [courts, setCourts] = useState([]);
  const [todayBookings, setTodayBookings] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const fetchAll = async () => {
      const bogotaToday = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
      const [pool, booking, sale, whatsapp, customer, courtsRes, bookingsRes] = await Promise.allSettled([
        fetch('/api/piscina/stats').then(r => r.json()),
        fetch('/api/bookings/stats').then(r => r.json()),
        fetch('/api/sales/stats?type=RESTAURANTE').then(r => r.json()),
        fetch('/api/whatsapp/stats').then(r => r.json()),
        fetch('/api/customers/stats').then(r => r.json()),
        fetch('/api/courts').then(r => r.json()),
        fetch(`/api/bookings?date=${bogotaToday}`).then(r => r.json()),
      ]);

      if (pool.status === 'fulfilled') setPoolStats(pool.value);
      else console.error('Error fetching pool stats:', pool.reason);

      if (booking.status === 'fulfilled') setBookingStats(booking.value);
      else console.error('Error fetching booking stats:', booking.reason);

      if (sale.status === 'fulfilled') setSaleStats(sale.value);
      else console.error('Error fetching sale stats:', sale.reason);

      if (whatsapp.status === 'fulfilled') setWhatsappStats(whatsapp.value);
      else console.error('Error fetching whatsapp stats:', whatsapp.reason);

      if (customer.status === 'fulfilled') setCustomerStats(customer.value);
      else console.error('Error fetching customer stats:', customer.reason);

      if (courtsRes.status === 'fulfilled' && Array.isArray(courtsRes.value)) setCourts(courtsRes.value);
      else console.error('Error fetching courts:', courtsRes.reason);

      if (bookingsRes.status === 'fulfilled' && Array.isArray(bookingsRes.value)) setTodayBookings(bookingsRes.value);
      else console.error('Error fetching bookings:', bookingsRes.reason);

      setLastUpdated(new Date());
    };

    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  const now = new Date();
  const ingresosTotalesHoy = (bookingStats.ingresosHoy || 0) + (poolStats.today || 0) + (saleStats.totalHoy || 0);
  const ingresosTotalesMes = (bookingStats.ingresosMes || 0) + (poolStats.month || 0) + (saleStats.totalMes || 0);
  const pctIA = whatsappStats.mensajesHoy > 0 ? Math.round((whatsappStats.respondidosIA / whatsappStats.mensajesHoy) * 100) : 0;

  const courtRows = courts.map((court) => {
    const activeBooking = todayBookings.find((b) =>
      b.courtId === court.id && new Date(b.startTime) <= now && new Date(b.endTime) >= now
    );
    return { court, booking: activeBooking };
  });

  const alerts = todayBookings
    .filter((b) => b.status !== 'CONFIRMED')
    .map((b) => ({
      id: b.id,
      title: `Pago pendiente · ${b.court?.name || 'Cancha'}`,
      subtitle: `${b.customer?.name || 'Cliente'} · ${fmtTimeBogota(b.startTime)}`,
    }));

  const proximos = todayBookings
    .filter((b) => new Date(b.startTime) > now)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .slice(0, 3);

  return (
    <div className="bg-[#FAF8F5] min-h-screen text-slate-800 font-['Manrope'] pb-12">
      {/* Top Header */}
      <header className="sticky top-0 w-full flex flex-col md:flex-row items-start md:items-center justify-between px-8 py-4 bg-[#FAF8F5]/90 backdrop-blur-xl z-50 border-b border-slate-200/60 gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0D5C52]">Dashboard</h1>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Resumen general de operaciones e ingresos</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range Picker Dropdown */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer transition-colors">
            <span className="material-symbols-outlined text-sm text-slate-500">calendar_today</span>
            <span>01 May - 31 May, 2025</span>
            <span className="material-symbols-outlined text-sm text-slate-400">expand_more</span>
          </div>

          {/* Notification Button */}
          <button className="relative w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-600 shadow-2xs hover:bg-slate-50 transition-colors">
            <span className="material-symbols-outlined text-lg">notifications</span>
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center border-2 border-white">
              3
            </span>
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs cursor-pointer hover:bg-slate-50 transition-colors">
            <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-200 bg-teal-100 flex items-center justify-center shrink-0">
              {user?.photoUrl ? (
                <img alt={user?.name} className="w-full h-full object-cover" src={user.photoUrl} />
              ) : (
                <span className="text-xs font-black text-[#0D5C52]">
                  {user?.name?.charAt(0) || 'E'}
                </span>
              )}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-extrabold text-slate-800 leading-tight">
                Hola, {user?.name?.split(' ')[0] || 'Eduardo'}
              </span>
              <span className="text-[9px] font-bold text-slate-400 leading-tight uppercase">
                {user?.role === 'ADMIN' ? 'Administrador' : user?.role || 'Administrador'}
              </span>
            </div>
            <span className="material-symbols-outlined text-sm text-slate-400 ml-1">expand_more</span>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard Area */}
      <div className="px-8 pt-6">
        {/* 1. Top Row: 5 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <KpiCardNew
            icon="payments"
            label="Ingresos Totales"
            value={ingresosTotalesMes > 0 ? fmtCOP(ingresosTotalesMes) : "$24.580.000"}
            trend="18.5% vs. Abril"
            trendUp={true}
            color="teal"
            sparklineData={[15, 22, 18, 26, 24, 30, 28, 35, 42]}
          />
          <KpiCardNew
            icon="calendar_today"
            label="Reservas Totales"
            value={bookingStats.reservasHoy > 0 ? String(bookingStats.reservasHoy) : "1.248"}
            trend="12.3% vs. Abril"
            trendUp={true}
            color="orange"
            sparklineData={[10, 14, 12, 16, 15, 20, 18, 22, 28]}
          />
          <KpiCardNew
            icon="group"
            label="Clientes Atendidos"
            value={customerStats.total > 0 ? String(customerStats.total) : "856"}
            trend="9.7% vs. Abril"
            trendUp={true}
            color="amber"
            sparklineData={[8, 12, 10, 15, 14, 18, 16, 21, 25]}
          />
          <KpiCardNew
            icon="trending_up"
            label="Ticket Promedio"
            value="$28.720"
            trend="14.2% vs. Abril"
            trendUp={true}
            color="purple"
            sparklineData={[12, 16, 14, 19, 18, 22, 20, 25, 30]}
          />
          <KpiCardNew
            icon="account_balance_wallet"
            label="Pendientes de Pago"
            value={bookingStats.pendientesPago > 0 ? fmtCOP(bookingStats.pendientesPago * 50000) : "$2.340.000"}
            trend="8.3% vs. Abril"
            trendUp={false}
            color="cyan"
            sparklineData={[28, 25, 22, 20, 18, 15, 14, 12, 10]}
          />
        </div>

        {/* 2. Middle Row: Line Chart (60%) & Donut Chart (40%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
          <div className="lg:col-span-7">
            <DailyIncomeLineChart />
          </div>
          <div className="lg:col-span-5">
            <DonutChartCustom
              title="Ingresos por Servicio"
              total={ingresosTotalesMes > 0 ? fmtCOP(ingresosTotalesMes) : "$24.580.000"}
              items={[
                { label: 'Canchas Deportivas', amount: '$9.850.000', percent: 40, color: COLORS.teal },
                { label: 'Piscina', amount: '$5.620.000', percent: 23, color: COLORS.orange },
                { label: 'Restaurante', amount: '$4.750.000', percent: 19, color: COLORS.amber },
                { label: 'Salón de Eventos', amount: '$4.360.000', percent: 18, color: COLORS.purple }
              ]}
            />
          </div>
        </div>

        {/* 3. Bottom Row: Bar Chart, Payment Methods & Upcoming Reservations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <ServiceBarChart
            items={[
              { label: 'Canchas Deportivas', formattedVal: '$9.85M', valNum: 9.85, color: COLORS.teal, icon: 'sports_soccer' },
              { label: 'Piscina', formattedVal: '$5.62M', valNum: 5.62, color: COLORS.orange, icon: 'pool' },
              { label: 'Restaurante', formattedVal: '$4.75M', valNum: 4.75, color: COLORS.amber, icon: 'restaurant' },
              { label: 'Salón de Eventos', formattedVal: '$4.36M', valNum: 4.36, color: COLORS.purple, icon: 'celebration' }
            ]}
          />

          <DonutChartCustom
            title="Métodos de Pago"
            total={ingresosTotalesMes > 0 ? fmtCOP(ingresosTotalesMes) : "$24.580.000"}
            items={[
              { label: 'Tarjeta', amount: '$12.450.000', percent: 51, color: COLORS.teal },
              { label: 'Efectivo', amount: '$7.120.000', percent: 29, color: COLORS.blue },
              { label: 'Transferencia', amount: '$3.680.000', percent: 15, color: COLORS.orange },
              { label: 'Otros', amount: '$1.330.000', percent: 5, color: COLORS.purple }
            ]}
          />

          <UpcomingReservationsList
            items={[
              { title: 'Cancha Sintética 1', time: 'Mañana, 9:00 AM - 10:00 AM', color: COLORS.teal, icon: 'sports_soccer', status: 'Confirmada' },
              { title: 'Piscina - Familiar', time: 'Mañana, 11:00 AM - 1:00 PM', color: COLORS.orange, icon: 'pool', status: 'Confirmada' },
              { title: 'Restaurante - Mesa 8', time: 'Mañana, 1:30 PM', color: COLORS.amber, icon: 'restaurant', status: 'Confirmada' },
              { title: 'Salón de Eventos', time: 'Mañana, 4:00 PM - 10:00 PM', color: COLORS.purple, icon: 'celebration', status: 'Confirmada' }
            ]}
          />
        </div>

        {/* 4. Bottom Banner: Quick Summary */}
        <QuickSummaryBanner />
      </div>
    </div>
  );
};

const ConsolaWhatsApp = () => {
  const [chats, setChats] = useState([]);
  const [autoPilot, setAutoPilot] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [activePhone, setActivePhone] = useState('demo_chat');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => { scrollToBottom(); }, [messages]);

  const fetchChats = () => {
    fetch('/api/whatsapp/chats')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setChats(data);
          if (activePhone === 'demo_chat' && data.length > 0) {
            setActivePhone(data[0].phone);
            setAutoPilot(data[0].autoPilot);
          }
        }
      })
      .catch(err => console.error('Error fetching chats:', err));
  };

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (activePhone && activePhone !== 'demo_chat') {
      fetch(`/api/whatsapp/messages?phone=${activePhone}`)
        .then(res => res.json())
        .then(data => {
          setMessages(Array.isArray(data) ? data : []);
        })
        .catch(err => console.error('Error fetching messages:', err));
    }
  }, [activePhone]);

  useEffect(() => {
    // En dev el backend está en :4001 (el frontend Vite en :5181)
    // En Docker usa VITE_BACKEND_URL inyectado en el contenedor
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4001';
    const socket = io(backendUrl);

    socket.on('connect', () => console.log('Connected to WebSocket'));

    socket.on('whatsapp_message', (msg) => {
      if (msg.phone === activePhone) {
        setMessages(prev => [...prev, { type: 'msg', ...msg }]);
      }
      fetchChats();
    });

    socket.on('ai_thought', (thought) => {
      if (thought.phone === activePhone) {
        setMessages(prev => [...prev, { type: 'thought', ...thought }]);
      }
    });

    socket.on('autopilot_status', (data) => {
      if (data.phone === activePhone) {
        setAutoPilot(data.autoPilot);
      }
      setChats(prev => prev.map(c => c.phone === data.phone ? { ...c, autoPilot: data.autoPilot } : c));
    });

    return () => socket.disconnect();
  }, [activePhone]);

  const activeChat = chats.find(c => c.phone === activePhone);
  const displayName = activeChat ? activeChat.name : (activePhone === 'demo_chat' ? 'Diego P.' : activePhone);

  const toggleAutoPilot = async () => {
    const newState = !autoPilot;
    setAutoPilot(newState);
    try {
      await fetch('/api/whatsapp/toggle-autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: activePhone, autoPilot: newState })
      });
    } catch (error) {
      console.error('Failed to toggle autopilot', error);
    }
  };

  const handleSendManualMessage = async () => {
    if (!inputText.trim()) return;
    const textToSend = inputText;
    setInputText('');
    try {
      await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: activePhone, text: textToSend, operatorName: 'Operador (Admin)' })
      });
    } catch (error) {
      console.error('Failed to send message', error);
    }
  };

  const handleSimulateClientMessage = async () => {
    if (!inputText.trim()) return;
    const textToSend = inputText;
    setInputText('');
    try {
      await fetch('/api/whatsapp/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: activePhone, text: textToSend, name: 'Diego P.' })
      });
    } catch (error) {
      console.error('Failed to simulate message', error);
    }
  };

  return (
    <>
      <div className="flex-1 flex overflow-hidden">
        <aside className="h-full w-80 bg-white border-r border-slate-200 flex flex-col z-[55] flex-shrink-0">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-xs font-black text-brand-purple uppercase tracking-[0.1em] mb-4">Conversaciones Activas</h3>
            <div className="relative">
              <input className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-xs font-medium focus:ring-primary focus:border-primary" placeholder="Buscar chat..." type="text"/>
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {chats.map(chat => (
              <div 
                key={chat.phone}
                className={`p-4 border-b border-slate-100 border-l-4 cursor-pointer hover:bg-slate-50 transition-colors ${activePhone === chat.phone ? 'bg-brand-purple/5 border-brand-purple' : 'border-transparent'}`} 
                onClick={() => {
                  setActivePhone(chat.phone);
                  setAutoPilot(chat.autoPilot);
                }}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-sm text-on-surface">{chat.name}</span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${chat.autoPilot ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>
                    {chat.autoPilot ? 'IA ACTIVA' : 'HUMANO'}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400">+{chat.phone}</span>
                </div>
              </div>
            ))}
            {chats.length === 0 && (
              <div 
                className={`p-4 border-b border-slate-100 border-l-4 cursor-pointer hover:bg-slate-50 transition-colors ${activePhone === 'demo_chat' ? 'bg-brand-purple/5 border-brand-purple' : 'border-transparent'}`} 
                onClick={() => {
                  setActivePhone('demo_chat');
                  setAutoPilot(true);
                }}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-sm text-on-surface">Diego P. (Demo)</span>
                  <span className="text-[10px] font-bold text-slate-400">Ahora</span>
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${autoPilot ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>
                    {autoPilot ? 'IA ACTIVA' : 'HUMANO'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1 italic">Conectado y listo...</p>
              </div>
            )}
          </div>
        </aside>
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#efe7de]">
          <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 z-50">
            <div className="flex items-center gap-4">
              <div className={`w-2.5 h-2.5 rounded-full ${autoPilot ? 'bg-secondary pulse-soft' : 'bg-primary'}`}></div>
              <div>
                <h2 className="text-sm font-extrabold text-brand-purple uppercase tracking-tight">
                  {autoPilot ? 'AI THOUGHT STREAM' : 'MODO INTERVENCIÓN MANUAL'}
                </h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                  Viendo: {displayName} / {autoPilot ? 'Encanto-Core-v4' : 'Control Humano'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-200 shadow-sm transition-all">
                <span className={`text-[10px] font-black uppercase tracking-widest ${autoPilot ? 'text-secondary' : 'text-slate-400'}`}>
                  Piloto Automático
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    checked={autoPilot} 
                    onChange={toggleAutoPilot}
                    className="sr-only peer" 
                    type="checkbox"
                  />
                  <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary"></div>
                </label>
              </div>
              <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
              <div className="flex items-center gap-1">
                <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><span className="material-symbols-outlined text-xl">refresh</span></button>
                <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><span className="material-symbols-outlined text-xl">settings</span></button>
              </div>
            </div>
          </header>
          
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 flex flex-col scroll-smooth">
            <div className="flex justify-center w-full my-2">
              <div className="bg-white/40 backdrop-blur-sm border border-slate-300/30 px-6 py-2 rounded-full text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-xs">lock</span> Sesión Segura: Socket Conectado
                </p>
              </div>
            </div>
            
            {messages.length === 0 && (
               <div className="text-center text-slate-400 text-sm mt-10">Esperando mensajes entrantes...</div>
            )}

            {messages.map((item, idx) => {
               if (item.type === 'thought') {
                 return null;
               } else if (item.type === 'msg' && !item.fromMe) {
                 return (
                    <div key={idx} className="flex flex-col items-start max-w-2xl w-full animate-in fade-in slide-in-from-bottom-4">
                      <div className="flex items-center gap-2 mb-1 ml-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{item.name || 'Cliente'}</span>
                      </div>
                      <div className="relative bg-white p-4 rounded-3xl rounded-tl-none shadow-sm border border-slate-100 max-w-full">
                         <p className="text-sm text-slate-700 leading-relaxed font-medium">{item.text}</p>
                      </div>
                    </div>
                 );
               } else if (item.type === 'msg' && item.fromMe && item.name === 'AI OVERSEER') {
                 return (
                    <div key={idx} className="flex flex-col items-start max-w-2xl w-full animate-in fade-in slide-in-from-bottom-4">
                      <div className="flex items-center gap-2 mb-1 ml-2">
                        <span className="text-[10px] font-bold text-[#2BAB9A] uppercase tracking-tight">{item.name}</span>
                      </div>
                      <div className="relative bg-[#2BAB9A] text-white p-4 rounded-3xl rounded-tl-none shadow-sm max-w-full">
                         <p className="text-sm leading-relaxed font-medium">{item.text}</p>
                      </div>
                    </div>
                 );
               } else if (item.type === 'msg' && item.fromMe) {
                 return (
                    <div key={idx} className="flex flex-col items-end w-full space-y-2 animate-in fade-in slide-in-from-bottom-4">
                      <div className="flex items-center gap-2 mr-2">
                        <span className="text-[10px] text-slate-400 uppercase font-black">{item.name}</span>
                        <span className={`w-2 h-2 rounded-full ${item.autoPilot ? 'bg-secondary' : 'bg-primary'}`}></span>
                      </div>
                      <div className="relative text-white p-4 rounded-3xl rounded-tr-none shadow-md max-w-2xl text-sm font-medium bg-brand-purple">
                        {item.text}
                      </div>
                    </div>
                 );
               }
               return null;
            })}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-50">
            <div className="max-w-4xl mx-auto flex items-center gap-3">
              {autoPilot ? (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-[#2BAB9A]/10 text-[#2BAB9A] rounded-xl text-[9px] font-black uppercase tracking-wider border border-[#2BAB9A]/20 shrink-0">
                  <span className="material-symbols-outlined text-xs">smart_toy</span>
                  <span>Simulador</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-purple/10 text-brand-purple rounded-xl text-[9px] font-black uppercase tracking-wider border border-brand-purple/20 shrink-0">
                  <span className="material-symbols-outlined text-xs">person</span>
                  <span>Operador</span>
                </div>
              )}
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (autoPilot ? handleSimulateClientMessage() : handleSendManualMessage())}
                  className={`w-full bg-slate-100 border-none rounded-2xl py-3 px-5 text-sm focus:ring-2 placeholder:text-slate-400 font-medium ${
                    autoPilot ? 'focus:ring-[#2BAB9A]/20' : 'focus:ring-brand-purple/20'
                  }`} 
                  placeholder={
                    autoPilot 
                      ? "Simular mensaje entrante del cliente (ej: 'Quiero reservar tenis mañana a las 3pm')..." 
                      : "Escribe un mensaje como operador..."
                  }
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-brand-purple transition-colors">
                  <span className="material-symbols-outlined">mood</span>
                </button>
              </div>
              {autoPilot ? (
                <button 
                  onClick={handleSimulateClientMessage} 
                  className="px-5 h-11 rounded-2xl bg-[#2BAB9A] text-white flex items-center gap-1.5 justify-center shadow-lg shadow-[#2BAB9A]/30 hover:scale-105 active:scale-95 transition-all text-xs font-black uppercase tracking-wider"
                >
                  <span className="material-symbols-outlined text-sm">person</span>
                  <span>Simular</span>
                </button>
              ) : (
                <button 
                  onClick={handleSendManualMessage} 
                  className="px-5 h-11 rounded-2xl bg-brand-purple text-white flex items-center gap-1.5 justify-center shadow-lg shadow-brand-purple/30 hover:scale-105 active:scale-95 transition-all text-xs font-black uppercase tracking-wider"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                  <span>Enviar</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <footer className="bg-white border-t border-slate-200 p-4 z-[70]">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#FAA422] rounded-xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-white uppercase tracking-widest">IA Health Rate</span>
              <span className="text-white text-[10px] font-black bg-white/20 px-1.5 py-0.5 rounded-full">+2.4</span>
            </div>
            <div className="mt-auto">
              <span className="text-3xl font-headline font-black text-white">98.4%</span>
            </div>
          </div>
          <div className="bg-[#FAA422] rounded-xl p-4 flex flex-col">
            <div className="flex items-center mb-4">
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Diarias</span>
            </div>
            <div className="mt-auto">
              <span className="text-3xl font-headline font-black text-white">124</span>
            </div>
          </div>
          <div className="bg-[#FAA422] rounded-xl p-4 flex flex-col">
            <div className="flex items-center mb-4">
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Agenda Impact</span>
            </div>
            <div className="mt-auto">
              <span className="text-3xl font-headline font-black text-white">+18%</span>
            </div>
          </div>
          <div className="bg-[#FAA422] rounded-xl p-4 flex flex-col">
            <div className="flex items-center mb-4">
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Reservas Hoy</span>
            </div>
            <div className="mt-auto flex items-baseline justify-between">
              <span className="text-3xl font-headline font-black text-white">08</span>
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-tighter">1 Pendiente</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

const PAYMENT_STATUS_OPTIONS = [
  { value: 'CONFIRMED', label: 'Pago Total' },
  { value: 'PARCIAL', label: 'Pago Parcial' },
  { value: 'PENDING', label: 'Pendiente de Pago' },
];

const CalendarioCanchas = () => {
  const [slotDuration, setSlotDuration] = useState(60); // 60 or 90
  const [courts, setCourts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [schedules, setSchedules] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateMenuOpen, setDateMenuOpen] = useState(false);
  const dateMenuRef = useRef(null);
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(64);
  const [bookingModal, setBookingModal] = useState(null); // { court, slotTime }
  const [bookingForm, setBookingForm] = useState({ name: '', phone: '', paymentStatus: 'PENDING', totalPrice: '', amountPaid: '' });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [manageBookingModal, setManageBookingModal] = useState(null); // { booking, court, slotTime }
  const [manageBookingSaving, setManageBookingSaving] = useState(false);
  const [manageBookingError, setManageBookingError] = useState('');
  const [pricing, setPricing] = useState({}); // { [courtId]: { [hourKey]: price } }
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [pricingDraft, setPricingDraft] = useState({});
  const [pricingSaving, setPricingSaving] = useState(false);
  const [courtsModalOpen, setCourtsModalOpen] = useState(false);
  const [newCourt, setNewCourt] = useState({ name: '', type: 'FUTBOL', description: '' });
  const [courtSaving, setCourtSaving] = useState(false);
  const [courtError, setCourtError] = useState('');
  const [receipts, setReceipts] = useState([]);
  const [receiptsModalOpen, setReceiptsModalOpen] = useState(false);
  const [receiptActionId, setReceiptActionId] = useState(null);
  const [courtDeletingId, setCourtDeletingId] = useState(null);

  const fetchCourts = () => {
    fetch('/api/courts')
      .then(res => res.json())
      .then(data => setCourts(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Error fetching courts:', err);
        setCourts([]);
      });
  };

  useEffect(() => {
    fetchCourts();

    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object') {
          if (data.COURT_SCHEDULES) setSchedules(JSON.parse(data.COURT_SCHEDULES));
          if (data.COURT_PRICING) setPricing(JSON.parse(data.COURT_PRICING));
        }
      })
      .catch(err => console.error('Error fetching settings:', err));
  }, []);

  const fetchBookings = () => {
    const dateStr = selectedDate.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    fetch(`/api/bookings?date=${dateStr}`)
      .then(res => res.json())
      .then(data => setBookings(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Error fetching bookings:', err);
        setBookings([]);
      });
  };

  useEffect(() => {
    fetchBookings();
  }, [selectedDate]);

  const fetchReceipts = () => {
    fetch('/api/bookings/receipts?status=PENDING_REVIEW')
      .then(res => res.json())
      .then(data => setReceipts(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error('Error fetching receipts:', err);
        setReceipts([]);
      });
  };

  useEffect(() => {
    fetchReceipts();
    const interval = setInterval(fetchReceipts, 30000);
    return () => clearInterval(interval);
  }, []);

  const openReceiptsModal = () => {
    fetchReceipts();
    setReceiptsModalOpen(true);
  };

  const reviewReceipt = async (id, action) => {
    setReceiptActionId(id);
    try {
      await fetch(`/api/bookings/receipts/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewedBy: 'Operador (Admin)' })
      });
      await fetchReceipts();
      fetchBookings();
    } catch (err) {
      console.error(`Error al ${action} comprobante:`, err);
    } finally {
      setReceiptActionId(null);
    }
  };

  useEffect(() => {
    if (!dateMenuOpen) return;
    const handleClickOutside = (e) => {
      if (dateMenuRef.current && !dateMenuRef.current.contains(e.target)) {
        setDateMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dateMenuOpen]);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const updateHeight = () => setHeaderHeight(el.offsetHeight);
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const changeDay = (delta) => {
    setSelectedDate(prev => {
      const next = new Date(prev);
      next.setDate(next.getDate() + delta);
      return next;
    });
  };

  const goToToday = () => {
    setSelectedDate(new Date());
    setDateMenuOpen(false);
  };

  const handleDateInputChange = (e) => {
    if (!e.target.value) return;
    const [year, month, day] = e.target.value.split('-').map(Number);
    setSelectedDate(new Date(year, month - 1, day));
    setDateMenuOpen(false);
  };

  const getCurrentDaySchedule = () => {
    if (!schedules) return { open: '08:00', close: '22:00', active: true };
    const formatter = new Intl.DateTimeFormat('es-ES', { weekday: 'long', timeZone: 'America/Bogota' });
    let currentDayName = formatter.format(selectedDate);
    currentDayName = currentDayName.charAt(0).toUpperCase() + currentDayName.slice(1);
    return schedules.find(s => s.day === currentDayName) || { open: '08:00', close: '22:00', active: true };
  };

  const schedule = getCurrentDaySchedule();
  const startHour = parseInt(schedule.open.split(':')[0]);
  const endHour = parseInt(schedule.close.split(':')[0]);

  const generateTimeSlots = (startHour, endHour, duration) => {
    const slots = [];
    const dateStr = selectedDate.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
    const [year, month, day] = dateStr.split('-').map(Number);

    let current = new Date(year, month - 1, day, startHour, 0, 0, 0);
    const end = new Date(year, month - 1, day, endHour, 0, 0, 0);

    while (current < end) {
      slots.push(new Date(current));
      current = new Date(current.getTime() + duration * 60000);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots(startHour, endHour, slotDuration);

  const formatSlotTime = (date) => date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });


  const getHourKey = (date) => String(date.getHours()).padStart(2, '0');

  const COURT_ICONS = {
    FUTBOL: 'sports_soccer',
    TENIS: 'sports_tennis',
    PADEL: 'sports_tennis',
    VOLEIBOL: 'sports_volleyball',
  };
  const getCourtIcon = (type) => COURT_ICONS[type] || 'stadium';

  const openPricingModal = () => {
    setPricingDraft(pricing);
    setPricingModalOpen(true);
  };

  const closePricingModal = () => {
    if (pricingSaving) return;
    setPricingModalOpen(false);
  };

  const updatePricingDraft = (courtId, hourKey, value) => {
    setPricingDraft(prev => ({
      ...prev,
      [courtId]: { ...prev[courtId], [hourKey]: value }
    }));
  };

  const savePricing = async () => {
    setPricingSaving(true);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ COURT_PRICING: JSON.stringify(pricingDraft) })
      });
      setPricing(pricingDraft);
      setPricingModalOpen(false);
    } catch (err) {
      console.error('Error saving pricing:', err);
    } finally {
      setPricingSaving(false);
    }
  };

  const openCourtsModal = () => {
    setCourtError('');
    setNewCourt({ name: '', type: 'FUTBOL', description: '' });
    setCourtsModalOpen(true);
  };

  const closeCourtsModal = () => {
    if (courtSaving) return;
    setCourtsModalOpen(false);
  };

  const handleAddCourt = async (e) => {
    e.preventDefault();
    if (!newCourt.name.trim()) {
      setCourtError('El nombre de la cancha es obligatorio.');
      return;
    }
    setCourtSaving(true);
    setCourtError('');
    try {
      const res = await fetch('/api/courts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCourt)
      });
      if (!res.ok) throw new Error('Error al crear la cancha');
      setNewCourt({ name: '', type: 'FUTBOL', description: '' });
      fetchCourts();
    } catch (err) {
      setCourtError('No se pudo crear la cancha. Intenta de nuevo.');
    } finally {
      setCourtSaving(false);
    }
  };

  const handleDeleteCourt = async (court) => {
    if (!window.confirm(`¿Eliminar "${court.name}"? Esta acción no se puede deshacer.`)) return;
    setCourtDeletingId(court.id);
    try {
      const res = await fetch(`/api/courts/${court.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar la cancha');
      fetchCourts();
    } catch (err) {
      setCourtError('No se pudo eliminar la cancha.');
    } finally {
      setCourtDeletingId(null);
    }
  };

  const openBookingModal = (court, slotTime) => {
    const hourKey = getHourKey(slotTime);
    const initialPrice = pricing?.[court.id]?.[hourKey] ?? '';
    setBookingModal({ court, slotTime });
    setBookingForm({ name: '', phone: '', paymentStatus: 'PENDING', totalPrice: initialPrice, amountPaid: '' });
    setBookingError('');
  };

  const closeBookingModal = () => {
    if (bookingSubmitting) return;
    setBookingModal(null);
  };

  const openManageBookingModal = (booking, court, slotTime) => {
    setManageBookingError('');
    setManageBookingModal({ booking, court, slotTime });
  };

  const closeManageBookingModal = () => {
    if (manageBookingSaving) return;
    setManageBookingModal(null);
  };

  const handleFacturarBooking = async () => {
    setManageBookingSaving(true);
    setManageBookingError('');
    try {
      const res = await fetch(`/api/bookings/${manageBookingModal.booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CONFIRMED',
          isPaid: true,
          amountPaid: manageBookingModal.booking.totalPrice
        })
      });
      if (!res.ok) throw new Error('Error al facturar');
      fetchBookings();
      setManageBookingModal(null);
    } catch (err) {
      setManageBookingError('No se pudo facturar la reserva. Intenta de nuevo.');
    } finally {
      setManageBookingSaving(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!window.confirm('¿Cancelar esta reserva? La cancha quedará disponible nuevamente.')) return;
    setManageBookingSaving(true);
    setManageBookingError('');
    try {
      const res = await fetch(`/api/bookings/${manageBookingModal.booking.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al cancelar');
      fetchBookings();
      setManageBookingModal(null);
    } catch (err) {
      setManageBookingError('No se pudo cancelar la reserva. Intenta de nuevo.');
    } finally {
      setManageBookingSaving(false);
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!bookingForm.name.trim() || !bookingForm.phone.trim()) {
      setBookingError('Nombre y teléfono son obligatorios.');
      return;
    }
    
    const totalPrice = parseFloat(bookingForm.totalPrice) || 0;
    const isParcial = bookingForm.paymentStatus === 'PARCIAL';
    const isConfirmed = bookingForm.paymentStatus === 'CONFIRMED';
    
    let amountPaid = 0;
    if (isParcial) {
      amountPaid = parseFloat(bookingForm.amountPaid);
      if (!bookingForm.amountPaid || isNaN(amountPaid) || amountPaid <= 0) {
        setBookingError('Ingresa el valor del abono.');
        return;
      }
      if (amountPaid > totalPrice) {
        setBookingError('El valor del abono no puede superar el valor total de la cancha.');
        return;
      }
    } else if (isConfirmed) {
      amountPaid = totalPrice;
    }

    setBookingSubmitting(true);
    setBookingError('');

    const startTime = new Date(bookingModal.slotTime);
    const endTime = new Date(startTime.getTime() + slotDuration * 60000);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId: bookingModal.court.id,
          customerName: bookingForm.name.trim(),
          customerPhone: bookingForm.phone.trim(),
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          status: bookingForm.paymentStatus,
          isPaid: isConfirmed,
          amountPaid: amountPaid,
          totalPrice: totalPrice
        })
      });
      if (!res.ok) throw new Error('Error al crear la reserva');
      fetchBookings();
      setBookingModal(null);
    } catch (err) {
      setBookingError('No se pudo crear la reserva. Intenta de nuevo.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  return (
    <>
      <header ref={headerRef} className="sticky top-0 w-full min-h-16 flex flex-wrap items-center justify-between gap-y-2 px-4 py-2.5 bg-white/95 backdrop-blur-xl z-50 border-b border-slate-200 font-['Manrope'] font-medium">
        <div className="flex-1"></div>
        <div className="flex flex-wrap items-center justify-end gap-3 gap-y-2">
          <div className="relative flex items-center gap-1" ref={dateMenuRef}>
            <button
              type="button"
              onClick={() => changeDay(-1)}
              title="Día anterior"
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-brand-purple transition-colors"
            >
              <span className="material-symbols-outlined text-base">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={() => setDateMenuOpen(prev => !prev)}
              className="flex items-center gap-2 px-4 py-1.5 bg-brand-purple text-white rounded-lg text-sm font-bold shadow-sm hover:bg-brand-purple-dark transition-colors"
            >
              <span className="material-symbols-outlined text-sm">calendar_month</span>
              <span>{selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Bogota' })}</span>
              <span className={`material-symbols-outlined text-sm transition-transform ${dateMenuOpen ? 'rotate-180' : ''}`}>keyboard_arrow_down</span>
            </button>
            <button
              type="button"
              onClick={() => changeDay(1)}
              title="Día siguiente"
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-brand-purple transition-colors"
            >
              <span className="material-symbols-outlined text-base">chevron_right</span>
            </button>

            {dateMenuOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 w-64">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Elegir fecha</label>
                <input
                  type="date"
                  value={selectedDate.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })}
                  onChange={handleDateInputChange}
                  className="w-full bg-slate-100 border-none rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-brand-purple/30"
                />
                <button
                  type="button"
                  onClick={goToToday}
                  className="w-full mt-3 py-2 rounded-xl text-xs font-black uppercase tracking-wide bg-slate-100 text-brand-purple hover:bg-slate-200 transition-colors"
                >
                  Hoy
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 text-[10px] font-extrabold text-slate-700 uppercase tracking-widest bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-secondary"></div>Disponible</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-primary"></div>Pago Total</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-brand-purple"></div>Pago Parcial</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#FAA422]"></div>Pendiente</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-200"></div>Mantenimiento</div>
          </div>
          <button
            onClick={openPricingModal}
            className="flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 text-brand-purple rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">sell</span>
            <span>Precios</span>
          </button>
          <button
            onClick={openCourtsModal}
            className="flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 text-brand-purple rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">sports_soccer</span>
            <span>Canchas</span>
          </button>
          <button
            onClick={openReceiptsModal}
            className="relative flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-200 text-brand-purple rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">receipt_long</span>
            <span>Comprobantes</span>
            {receipts.length > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 rounded-full bg-[#FAA422] text-white text-[10px] font-black flex items-center justify-center">
                {receipts.length}
              </span>
            )}
          </button>
          <div className="flex items-center gap-2">
            <button className="hover:bg-slate-100 rounded-full p-2 transition-all duration-300">
              <span className="material-symbols-outlined text-brand-purple">notifications</span>
            </button>
            <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-primary ml-2 cursor-pointer shadow-sm">
              <img alt="Perfil del Gerente" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6dn6tcljZMKpmrlEwV8wH0aTHI9QQNusfiKfwVwVO-ie58Sok57M6k79GgbhG0LgAHnrQOF9ZxtDnMXKLlOYlXDfheCVqvmIFQQYIGpbOcwDgBWWmSk3OzNk4wEYwlTF__Ic4tojUnp13Ktp1t6WWcVgkqjUx9_vw-Hi-5s9QsJ-lZQce8gT88DxtsJPFmBUVrzkJeOe2uSD6VqDI-iBss1yXJXiOeI4L-b-1947L2HewBBPalKFbYxQQOLOUuDBkemEOjDZ0_lZS"/>
            </div>
          </div>
        </div>
      </header>
      <div className="p-3 overflow-hidden" style={{ height: `calc(100vh - ${headerHeight}px)` }}>
        <div className="bg-white rounded-2xl shadow-xl shadow-brand-purple/10 overflow-hidden relative border border-slate-200 h-full flex flex-col">
          <div className="overflow-auto flex-1">
            <table className="w-full border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-200">
                  <th className="w-28 p-4 bg-slate-50 sticky left-0 top-0 z-30 text-right align-middle">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hora</span>
                  </th>
                  {courts.length === 0 && (
                    <th className="p-5 text-left font-headline font-black text-slate-400 border-l border-slate-200 uppercase tracking-wider text-xs italic sticky top-0 z-20 bg-slate-50">Cargando canchas...</th>
                  )}
                  {courts.map(court => (
                    <th key={court.id} className="p-4 text-left border-l border-slate-200 sticky top-0 z-20 bg-slate-50 min-w-[150px]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-md bg-brand-purple/10 flex items-center justify-center text-brand-purple shrink-0">
                          <span className="material-symbols-outlined text-base">{getCourtIcon(court.type)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-headline font-black text-brand-purple-dark uppercase tracking-wider text-xs truncate">{court.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{court.type}</p>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm font-medium">
                {timeSlots.map((time) => {
                  const [timeValue, timePeriod] = formatSlotTime(time).split(' ');
                  return (
                  <tr key={time.getTime()} className="h-20 group border-b border-slate-50">
                    <td className="w-28 px-4 py-2 sticky left-0 z-10 bg-white group-hover:bg-slate-50 text-right border-r border-slate-100 transition-colors">
                      <div className="flex flex-col items-end leading-tight gap-0.5">
                        <span className="text-xs font-black text-slate-700 tabular-nums">{timeValue}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{timePeriod}</span>
                      </div>
                    </td>
                    {courts.length === 0 && <td className="border-l border-slate-100 p-1 bg-slate-50"></td>}
                    {courts.map((cancha) => {
                      // Find if there's a booking for this court and time
                      const booking = bookings.find(b => {
                        const bStart = new Date(b.startTime);
                        return b.courtId === cancha.id && bStart.getHours() === time.getHours() && bStart.getMinutes() === time.getMinutes();
                      });

                      if (booking) {
                        const isBlockage = booking.type === 'BLOCKAGE' || booking.status === 'BLOCKED';

                        if (isBlockage) return (
                          <td key={cancha.id} className="border-l border-slate-100 p-1">
                            <div className="h-full w-full bg-slate-200 rounded-md flex items-center justify-center gap-2 text-slate-500 font-black text-[9px] uppercase italic">
                              <span className="material-symbols-outlined text-sm">build</span>
                              <span>{booking.status === 'BLOCKED' ? 'BLOQUEADO' : 'Mantenimiento'}</span>
                            </div>
                          </td>
                        );

                        const paymentStyles = {
                          PENDING: { bg: 'bg-[#FAA422]', label: 'Pendiente Pago' },
                          PARCIAL: { bg: 'bg-brand-purple', label: 'Pago Parcial' },
                          CONFIRMED: { bg: 'bg-primary', label: 'Reserva Confirmada' },
                        };
                        const { bg, label } = paymentStyles[booking.status] || paymentStyles.CONFIRMED;

                        return (
                          <td
                            key={cancha.id}
                            onClick={() => openManageBookingModal(booking, cancha, time)}
                            className="border-l border-slate-100 p-1 cursor-pointer"
                          >
                            <div className={`h-full w-full ${bg} text-white rounded-md p-3 flex flex-col justify-between shadow-md shadow-primary/20 hover:brightness-95 transition-all`}>
                              <span className="font-black text-[11px] uppercase truncate">{label}</span>
                              <span className="text-[9px] font-bold opacity-80 uppercase">{booking.customer?.name || 'Cliente'}</span>
                              {booking.status === 'PARCIAL' && (
                                <span className="text-[9px] font-bold opacity-80">Abono: ${Number(booking.amountPaid || 0).toLocaleString('es-CO')}</span>
                              )}
                            </div>
                          </td>
                        );
                      }

                      const price = pricing?.[cancha.id]?.[getHourKey(time)];

                      return (
                        <td
                          key={cancha.id}
                          onClick={() => openBookingModal(cancha, time)}
                          className="border-l border-slate-100 p-1 cursor-pointer"
                        >
                          <div className="h-full w-full bg-[#2BAB9A] hover:bg-[#238a7c] text-white rounded-md shadow-sm transition-all relative flex flex-col justify-center items-center min-h-[4.5rem] p-3">
                            {price != null && price !== '' ? (
                              <span className="font-black text-[11px] uppercase tracking-wide">
                                ${Number(price).toLocaleString('es-CO')}
                              </span>
                            ) : (
                              <span className="text-[10px] font-black uppercase tracking-wider opacity-90">Disponible</span>
                            )}
                            <div className="absolute inset-0 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity bg-black/10 rounded-md">
                              <span className="material-symbols-outlined text-white text-xl font-bold">add_circle</span>
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {pricingModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4"
          onClick={closePricingModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-8 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-extrabold text-brand-purple uppercase">Precios por Cancha y Horario</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Define el valor de cada franja. Se mostrará como referencia en las casillas disponibles del calendario.</p>
              </div>
              <button onClick={closePricingModal} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-3 text-left text-[10px] font-black text-slate-400 uppercase sticky left-0 bg-slate-50"></th>
                    {courts.map(court => (
                      <th key={court.id} className="p-3 text-left text-[10px] font-black text-brand-purple-dark uppercase whitespace-nowrap">{court.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map(time => {
                    const hourKey = getHourKey(time);
                    return (
                      <tr key={hourKey} className="border-b border-slate-50">
                        <td className="p-3 text-[10px] font-black text-slate-400 uppercase whitespace-nowrap sticky left-0 bg-white">{formatSlotTime(time)}</td>
                        {courts.map(court => (
                          <td key={court.id} className="p-2">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                              <input
                                type="number"
                                min="0"
                                value={pricingDraft[court.id]?.[hourKey] ?? ''}
                                onChange={(e) => updatePricingDraft(court.id, hourKey, e.target.value)}
                                className="w-full bg-slate-100 border-none rounded-lg pl-6 pr-2 py-1.5 text-xs focus:ring-2 focus:ring-brand-purple/30"
                                placeholder="0"
                              />
                            </div>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 pt-6">
              <button
                type="button"
                onClick={closePricingModal}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={savePricing}
                disabled={pricingSaving}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-brand-purple text-white hover:bg-brand-purple-dark transition-colors disabled:opacity-50"
              >
                {pricingSaving ? 'Guardando...' : 'Guardar Precios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {courtsModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4"
          onClick={closeCourtsModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-extrabold text-brand-purple uppercase">Gestionar Canchas</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Agrega o quita canchas del calendario de reservas.</p>
              </div>
              <button onClick={closeCourtsModal} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-2 mb-6">
              {courts.length === 0 && (
                <p className="text-xs text-slate-400 italic">Aún no hay canchas registradas.</p>
              )}
              {courts.map(court => (
                <div key={court.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-xs font-black text-slate-700">{court.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{court.type}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCourt(court)}
                    disabled={courtDeletingId === court.id}
                    className="text-slate-400 hover:text-primary p-1.5 disabled:opacity-50"
                    title="Eliminar cancha"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddCourt} className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nueva Cancha</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Nombre</label>
                  <input
                    type="text"
                    value={newCourt.name}
                    onChange={(e) => setNewCourt({ ...newCourt, name: e.target.value })}
                    className="w-full bg-slate-100 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-purple/30"
                    placeholder="Ej: Cancha 4"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Tipo</label>
                  <select
                    value={newCourt.type}
                    onChange={(e) => setNewCourt({ ...newCourt, type: e.target.value })}
                    className="w-full bg-slate-100 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-purple/30 appearance-none"
                  >
                    <option value="FUTBOL">Fútbol</option>
                    <option value="TENIS">Tenis</option>
                    <option value="PADEL">Pádel</option>
                    <option value="VOLEIBOL">Voleibol</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Descripción (opcional)</label>
                <input
                  type="text"
                  value={newCourt.description}
                  onChange={(e) => setNewCourt({ ...newCourt, description: e.target.value })}
                  className="w-full bg-slate-100 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-purple/30"
                  placeholder="Ej: Cancha sintética techada"
                />
              </div>

              {courtError && (
                <p className="text-primary text-xs font-bold">{courtError}</p>
              )}

              <button
                type="submit"
                disabled={courtSaving}
                className="w-full py-2.5 rounded-xl font-bold text-sm bg-brand-purple text-white hover:bg-brand-purple-dark transition-colors disabled:opacity-50"
              >
                {courtSaving ? 'Guardando...' : 'Agregar Cancha'}
              </button>
            </form>
          </div>
        </div>
      )}

      {receiptsModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4"
          onClick={() => setReceiptsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-extrabold text-brand-purple uppercase">Comprobantes por Verificar</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Pagos que clientes enviaron por WhatsApp. Revisa la imagen antes de confirmar.</p>
              </div>
              <button onClick={() => setReceiptsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              {receipts.length === 0 && (
                <p className="text-xs text-slate-400 italic">No hay comprobantes pendientes de revisión.</p>
              )}
              {receipts.map(r => (
                <div key={r.id} className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  {r.imageData ? (
                    <img
                      src={r.imageData}
                      alt="Comprobante"
                      className="w-28 h-28 object-cover rounded-lg border border-slate-200 shrink-0 cursor-pointer"
                      onClick={() => window.open(r.imageData, '_blank')}
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-300 shrink-0">
                      <span className="material-symbols-outlined text-3xl">image_not_supported</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-700">
                      {r.booking?.customer?.name || 'Cliente'} <span className="text-slate-400 font-medium">· +{r.booking?.customer?.phone}</span>
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-0.5">
                      {r.booking?.court?.name} · {r.booking?.startTime ? new Date(r.booking.startTime).toLocaleString('es-CO', { timeZone: 'America/Bogota', dateStyle: 'medium', timeStyle: 'short' }) : ''}
                    </p>
                    <div className="mt-2 flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-black text-brand-purple">
                        {r.legible ? `$${Number(r.amountDetected).toLocaleString('es-CO')}` : 'Monto no legible'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{r.paymentMethod}</span>
                      {!r.legible && (
                        <span className="text-[9px] font-black uppercase text-[#FAA422]">Imagen poco clara</span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Saldo total reserva: ${Number(r.booking?.totalPrice || 0).toLocaleString('es-CO')} · Abonado hasta ahora: ${Number(r.booking?.amountPaid || 0).toLocaleString('es-CO')}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={receiptActionId === r.id}
                        onClick={() => reviewReceipt(r.id, 'verify')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black uppercase bg-secondary/10 text-secondary hover:bg-secondary/20 transition-colors disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-sm">check_circle</span> Verificar
                      </button>
                      <button
                        type="button"
                        disabled={receiptActionId === r.id}
                        onClick={() => reviewReceipt(r.id, 'reject')}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black uppercase bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-sm">cancel</span> Rechazar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {manageBookingModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4"
          onClick={closeManageBookingModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-extrabold text-brand-purple uppercase">Gestionar Reserva</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  {manageBookingModal.court.name} • {formatSlotTime(manageBookingModal.slotTime)}
                </p>
              </div>
              <button onClick={closeManageBookingModal} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Cliente</span>
                <span className="font-bold text-slate-700">{manageBookingModal.booking.customer?.name || 'Cliente'}</span>
              </div>
              {manageBookingModal.booking.customer?.phone && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Teléfono</span>
                  <span className="font-bold text-slate-700">{manageBookingModal.booking.customer.phone}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Valor Total</span>
                <span className="font-bold text-slate-700">${Number(manageBookingModal.booking.totalPrice || 0).toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Abonado</span>
                <span className="font-bold text-slate-700">${Number(manageBookingModal.booking.amountPaid || 0).toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-2">
                <span className="text-slate-600">Saldo Pendiente</span>
                <span className="text-brand-purple">
                  ${Math.max(0, Number(manageBookingModal.booking.totalPrice || 0) - Number(manageBookingModal.booking.amountPaid || 0)).toLocaleString('es-CO')}
                </span>
              </div>
            </div>

            {manageBookingError && (
              <p className="text-primary text-xs font-bold mb-4">{manageBookingError}</p>
            )}

            <div className="space-y-3">
              {manageBookingModal.booking.status !== 'CONFIRMED' && (
                <button
                  type="button"
                  onClick={handleFacturarBooking}
                  disabled={manageBookingSaving}
                  className="w-full py-2.5 rounded-xl font-bold text-sm bg-primary text-white hover:opacity-90 transition-colors disabled:opacity-50"
                >
                  {manageBookingSaving ? 'Procesando...' : 'Facturar (Marcar como Pagada)'}
                </button>
              )}
              <button
                type="button"
                onClick={handleCancelBooking}
                disabled={manageBookingSaving}
                className="w-full py-2.5 rounded-xl font-bold text-sm bg-white border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Cancelar Reserva (Liberar Cancha)
              </button>
              <button
                type="button"
                onClick={closeManageBookingModal}
                disabled={manageBookingSaving}
                className="w-full py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {bookingModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4"
          onClick={closeBookingModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-extrabold text-brand-purple uppercase">Nueva Reserva</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">
                  {bookingModal.court.name} • {formatSlotTime(bookingModal.slotTime)}
                </p>
              </div>
              <button onClick={closeBookingModal} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Nombre</label>
                <input
                  type="text"
                  value={bookingForm.name}
                  onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                  className="w-full bg-slate-100 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-purple/30"
                  placeholder="Nombre del cliente"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Teléfono</label>
                <input
                  type="tel"
                  value={bookingForm.phone}
                  onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                  className="w-full bg-slate-100 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-purple/30"
                  placeholder="Número de teléfono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Valor de la Cancha / Reserva</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={bookingForm.totalPrice}
                    onChange={(e) => setBookingForm({ ...bookingForm, totalPrice: e.target.value })}
                    className="w-full bg-slate-100 border-none rounded-xl pl-8 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-purple/30"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Estado de pago</label>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_STATUS_OPTIONS.map(opt => (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setBookingForm({ ...bookingForm, paymentStatus: opt.value })}
                      className={`px-2 py-2 rounded-lg text-[9px] font-black uppercase tracking-wide transition-all border ${
                        bookingForm.paymentStatus === opt.value
                          ? 'bg-brand-purple text-white border-brand-purple'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-brand-purple/40'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {bookingForm.paymentStatus === 'CONFIRMED' && (
                <div className="bg-emerald-50 text-emerald-800 rounded-xl p-4 text-xs font-semibold space-y-1 border border-emerald-100">
                  <div className="flex justify-between">
                    <span>Valor del pago (Total):</span>
                    <span>${(parseFloat(bookingForm.totalPrice) || 0).toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-emerald-200/50 pt-1">
                    <span>Saldo Pendiente:</span>
                    <span>$0</span>
                  </div>
                </div>
              )}

              {bookingForm.paymentStatus === 'PARCIAL' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Valor del abono</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={bookingForm.amountPaid}
                        onChange={(e) => setBookingForm({ ...bookingForm, amountPaid: e.target.value })}
                        className="w-full bg-slate-100 border-none rounded-xl pl-8 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-purple/30"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="bg-brand-purple/5 text-brand-purple rounded-xl p-4 text-xs font-semibold space-y-1 border border-brand-purple/10">
                    <div className="flex justify-between">
                      <span>Valor de la Cancha / Reserva:</span>
                      <span>${(parseFloat(bookingForm.totalPrice) || 0).toLocaleString('es-CO')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Abonado:</span>
                      <span>${(parseFloat(bookingForm.amountPaid) || 0).toLocaleString('es-CO')}</span>
                    </div>
                    <div className="flex justify-between font-bold border-t border-brand-purple/20 pt-1">
                      <span>Saldo Pendiente:</span>
                      <span>${Math.max(0, (parseFloat(bookingForm.totalPrice) || 0) - (parseFloat(bookingForm.amountPaid) || 0)).toLocaleString('es-CO')}</span>
                    </div>
                  </div>
                </div>
              )}

              {bookingForm.paymentStatus === 'PENDING' && (
                <div className="bg-amber-50 text-amber-800 rounded-xl p-4 text-xs font-semibold space-y-1 border border-amber-100">
                  <div className="flex justify-between">
                    <span>Valor del pago (Abonado):</span>
                    <span>$0</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-amber-200/50 pt-1">
                    <span>Saldo Pendiente:</span>
                    <span>${(parseFloat(bookingForm.totalPrice) || 0).toLocaleString('es-CO')}</span>
                  </div>
                </div>
              )}

              {bookingError && (
                <p className="text-primary text-xs font-bold">{bookingError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeBookingModal}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={bookingSubmitting}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-brand-purple text-white hover:bg-brand-purple-dark transition-colors disabled:opacity-50"
                >
                  {bookingSubmitting ? 'Guardando...' : 'Confirmar Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const CLIENT_AVATAR_STYLES = {
  secondary: 'bg-secondary/20 text-secondary',
  primary: 'bg-primary/20 text-primary',
  pending: 'bg-pending/20 text-pending',
};

const CLIENT_STATUS_STYLES = {
  RECURRENTE: 'bg-secondary/10 text-secondary',
  PREMIUM: 'bg-primary/10 text-primary',
  NUEVO: 'bg-slate-100 text-slate-500',
};

const CLIENT_SOURCE_DOT = {
  secondary: 'bg-secondary',
  primary: 'bg-primary',
  slate: 'bg-slate-400',
};

const CLIENT_SOURCE_DOT_BY_NAME = {
  'WhatsApp Bot': 'secondary',
  'Restaurant POS': 'primary',
  'Manual Entry': 'slate',
};

const INITIAL_CLIENTS = [
  {
    id: 1,
    name: 'Diego P.',
    contact: '+51 987 654 321',
    initials: 'DP',
    accent: 'secondary',
    source: 'WhatsApp Bot',
    sourceDot: 'secondary',
    status: 'RECURRENTE',
    ltv: '$1,420.00',
    ltvDetail: '12 reservas',
    lastInteraction: 'Hace 4 mins',
    lastInteractionDetail: 'Cancha 2 a las 18:00...',
  },
  {
    id: 2,
    name: 'Marta G.',
    contact: 'm.garcia@email.com',
    initials: 'MG',
    accent: 'primary',
    source: 'Restaurant POS',
    sourceDot: 'primary',
    status: 'PREMIUM',
    ltv: '$3,850.50',
    ltvDetail: '45 visitas',
    lastInteraction: 'Hoy 12:45',
    lastInteractionDetail: 'Almuerzo Ejecutivo',
  },
  {
    id: 3,
    name: 'Carlos R.',
    contact: 'ID: 88231',
    initials: 'CR',
    accent: 'pending',
    source: 'Manual Entry',
    sourceDot: 'slate',
    status: 'NUEVO',
    ltv: '$0.00',
    ltvDetail: 'Prospecto',
    lastInteraction: 'Ayer 18:20',
    lastInteractionDetail: 'Consulta de precios corporativos',
  },
];

const getClientInitials = (name) => {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((p) => p[0].toUpperCase()).join('') || '?';
};

const DirectorioClientes = () => {
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [viewClient, setViewClient] = useState(null);
  const [editClient, setEditClient] = useState(null);
  const [editForm, setEditForm] = useState(null);

  const filteredClients = clients.filter((c) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesTerm = !term
      || c.name.toLowerCase().includes(term)
      || c.source.toLowerCase().includes(term)
      || c.contact.toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'TODOS' || c.status === statusFilter;
    return matchesTerm && matchesStatus;
  });

  const openEditModal = (client) => {
    setEditForm({ ...client });
    setEditClient(client);
    setViewClient(null);
  };

  const closeEditModal = () => {
    setEditClient(null);
    setEditForm(null);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    setClients((prev) => prev.map((c) => (
      c.id === editClient.id ? { ...editForm, id: c.id, accent: c.accent, initials: getClientInitials(editForm.name) } : c
    )));
    closeEditModal();
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh)] overflow-hidden bg-white">
      <header className="border-b border-slate-200 bg-white shrink-0 px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-brand-purple/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-brand-purple">person_search</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-brand-purple uppercase tracking-tight">Directorio de Clientes</h2>
                <span className="text-[9px] font-black text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded-full">
                  {filteredClients.length} de {clients.length}
                </span>
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">Customer Intelligence Grid • Real-time Sync</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, fuente o ID..."
                className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-9 pr-4 text-xs font-medium focus:ring-2 focus:ring-primary/30 focus:border-primary w-64"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs font-bold text-slate-600 uppercase tracking-wide focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none cursor-pointer"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="NUEVO">Nuevo</option>
              <option value="RECURRENTE">Recurrente</option>
              <option value="PREMIUM">Premium</option>
            </select>
            <button className="bg-brand-purple text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-brand-purple-dark transition-colors">
              <span className="material-symbols-outlined text-sm">person_add</span>
              CREAR CLIENTE
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-0 high-density-grid">
        <div className="min-w-[1000px]">
          <table className="w-full border-collapse text-left bg-white">
            <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 shadow-sm">
              <tr>
                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100">Cliente</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100 flex items-center gap-1 cursor-pointer hover:text-brand-purple">
                  Ingestion Source <span className="material-symbols-outlined text-xs">expand_more</span>
                </th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100">Estado Perfil</th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100 flex items-center gap-1 cursor-pointer hover:text-brand-purple">
                  Lifetime Value <span className="material-symbols-outlined text-xs">unfold_more</span>
                </th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100 flex items-center gap-1 cursor-pointer hover:text-brand-purple">
                  Last Interaction <span className="material-symbols-outlined text-xs">unfold_more</span>
                </th>
                <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                    No se encontraron clientes con ese criterio.
                  </td>
                </tr>
              )}
              {filteredClients.map((client, idx) => (
                <tr key={client.id} className={`hover:bg-slate-50 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${CLIENT_AVATAR_STYLES[client.accent]}`}>{client.initials}</div>
                      <div>
                        <div className="text-sm font-bold text-on-surface">{client.name}</div>
                        <div className="text-[10px] text-slate-400 font-medium">{client.contact}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${CLIENT_SOURCE_DOT[client.sourceDot]}`}></span>
                      <span className="text-xs font-bold text-slate-700">{client.source}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${CLIENT_STATUS_STYLES[client.status]}`}>{client.status}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-black text-brand-purple">{client.ltv}</div>
                    <div className="text-[10px] text-slate-400">{client.ltvDetail}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-bold text-slate-700">{client.lastInteraction}</div>
                    <div className="text-[10px] text-slate-400 italic">"{client.lastInteractionDetail}"</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setViewClient(client)}
                        title="Ver cliente"
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-brand-purple-dark transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(client)}
                        title="Editar cliente"
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-brand-purple/10 hover:text-brand-purple transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {viewClient && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4"
          onClick={() => setViewClient(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm ${CLIENT_AVATAR_STYLES[viewClient.accent]}`}>{viewClient.initials}</div>
                <div>
                  <h3 className="text-lg font-extrabold text-brand-purple-dark">{viewClient.name}</h3>
                  <p className="text-xs text-slate-400 font-medium">{viewClient.contact}</p>
                </div>
              </div>
              <button onClick={() => setViewClient(null)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fuente</p>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${CLIENT_SOURCE_DOT[viewClient.sourceDot]}`}></span>
                  <p className="text-sm font-bold text-slate-700">{viewClient.source}</p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado</p>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${CLIENT_STATUS_STYLES[viewClient.status]}`}>{viewClient.status}</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Lifetime Value</p>
                <p className="text-sm font-black text-brand-purple">{viewClient.ltv}</p>
                <p className="text-[10px] text-slate-400">{viewClient.ltvDetail}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Última Interacción</p>
                <p className="text-sm font-bold text-slate-700">{viewClient.lastInteraction}</p>
                <p className="text-[10px] text-slate-400 italic truncate">"{viewClient.lastInteractionDetail}"</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setViewClient(null)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => openEditModal(viewClient)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-brand-purple text-white hover:bg-brand-purple-dark transition-colors"
              >
                Editar Cliente
              </button>
            </div>
          </div>
        </div>
      )}

      {editClient && editForm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4"
          onClick={closeEditModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-extrabold text-brand-purple uppercase">Editar Cliente</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">Actualiza los datos de {editClient.name}.</p>
              </div>
              <button onClick={closeEditModal} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Nombre</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-slate-100 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-purple/30"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Contacto (teléfono, email o ID)</label>
                <input
                  type="text"
                  required
                  value={editForm.contact}
                  onChange={(e) => setEditForm({ ...editForm, contact: e.target.value })}
                  className="w-full bg-slate-100 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-purple/30"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Fuente</label>
                  <select
                    value={editForm.source}
                    onChange={(e) => {
                      const source = e.target.value;
                      setEditForm({ ...editForm, source, sourceDot: CLIENT_SOURCE_DOT_BY_NAME[source] });
                    }}
                    className="w-full bg-slate-100 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-purple/30 appearance-none"
                  >
                    <option value="WhatsApp Bot">WhatsApp Bot</option>
                    <option value="Restaurant POS">Restaurant POS</option>
                    <option value="Manual Entry">Manual Entry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Estado</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full bg-slate-100 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-purple/30 appearance-none"
                  >
                    <option value="NUEVO">Nuevo</option>
                    <option value="RECURRENTE">Recurrente</option>
                    <option value="PREMIUM">Premium</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Lifetime Value</label>
                  <input
                    type="text"
                    value={editForm.ltv}
                    onChange={(e) => setEditForm({ ...editForm, ltv: e.target.value })}
                    className="w-full bg-slate-100 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-purple/30"
                    placeholder="$0.00"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Detalle LTV</label>
                  <input
                    type="text"
                    value={editForm.ltvDetail}
                    onChange={(e) => setEditForm({ ...editForm, ltvDetail: e.target.value })}
                    className="w-full bg-slate-100 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-purple/30"
                    placeholder="Ej: 12 reservas"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Nota de última interacción</label>
                <input
                  type="text"
                  value={editForm.lastInteractionDetail}
                  onChange={(e) => setEditForm({ ...editForm, lastInteractionDetail: e.target.value })}
                  className="w-full bg-slate-100 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-brand-purple/30"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-brand-purple text-white hover:bg-brand-purple-dark transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('encanto_user');
      const token = localStorage.getItem('encanto_token');
      if (savedUser && token) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Error parsing saved user:', error);
      localStorage.removeItem('encanto_user');
      localStorage.removeItem('encanto_token');
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('encanto_token');
    localStorage.removeItem('encanto_user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-brand-purple">
        <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <Router>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/whatsapp" element={<ConsolaWhatsApp />} />
          <Route path="/canchas" element={<CalendarioCanchas />} />
          <Route path="/clientes" element={<DirectorioClientes />} />
          <Route path="/piscina" element={<Piscina />} />
          <Route path="/restaurante" element={<Restaurante />} />
          <Route path="/infraestructura" element={<Infraestructura />} />
          <Route path="*" element={<Dashboard user={user} />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
