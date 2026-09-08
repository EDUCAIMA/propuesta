import React, { useState, useEffect } from 'react';

const Infraestructura = () => {
  const [activeTab, setActiveTab] = useState('whatsapp');
  const [settings, setSettings] = useState({
    WHATSAPP_PROVIDER: 'whapi',
    WHAPI_TOKEN: '',
    META_TOKEN: '',
    OPENAI_API_KEY: '',
    SYSTEM_PROMPT: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [health, setHealth] = useState({
    backend: 'online',
    database: 'connected',
    whatsapp: 'checking',
    openai: 'checking'
  });
  const [showUserModal, setShowUserModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'STAFF', permissions: [] });
  const [newProduct, setNewProduct] = useState({ id: null, name: '', category: 'Comida', price: 0, image: null });
  const [manillaTypes, setManillaTypes] = useState([]);
  const [newManilla, setNewManilla] = useState({ id: null, name: '', price: 0, color: 'brand-purple' });

  const [schedules, setSchedules] = useState([
    { id: 1, day: 'Lunes', open: '08:00', close: '23:00', active: true },
    { id: 2, day: 'Martes', open: '08:00', close: '23:00', active: true },
    { id: 3, day: 'Miércoles', open: '08:00', close: '23:00', active: true },
    { id: 4, day: 'Jueves', open: '08:00', close: '23:00', active: true },
    { id: 5, day: 'Viernes', open: '08:00', close: '23:00', active: true },
    { id: 6, day: 'Sábado', open: '09:00', close: '00:00', active: true },
    { id: 0, day: 'Domingo', open: '09:00', close: '22:00', active: true }
  ]);
  const [courts, setCourts] = useState([
    { id: 1, name: 'Cancha 1', sport: 'Fútbol 5' },
    { id: 2, name: 'Cancha 2', sport: 'Pádel' },
    { id: 3, name: 'Cancha 3', sport: 'Voleibol' }
  ]);
  const [newCourt, setNewCourt] = useState({ name: '', sport: 'Fútbol 5' });
  const [showCourtModal, setShowCourtModal] = useState(false);

  const [exceptions, setExceptions] = useState([]);
  const [newException, setNewException] = useState({ date: '', startTime: '', endTime: '', reason: '' });

  const [showTokens, setShowTokens] = useState(false);
  const [originalSettings, setOriginalSettings] = useState({});

  useEffect(() => {
    loadSettings();
    loadUsers();
    loadProducts();
    loadManillas();
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = () => {
    fetch('/api/health-check/status')
      .then(res => res.json())
      .then(data => {
        setHealth({
          backend: 'online',
          database: data.services.database.status === 'online' ? 'connected' : 'offline',
          whatsapp: data.services.whatsapp.status === 'online' ? 'connected' : 'offline',
          openai: data.services.openai.status === 'online' ? 'connected' : 'offline'
        });
      })
      .catch(err => setHealth(prev => ({ ...prev, backend: 'offline' })));
  };

  const loadManillas = () => {
    fetch('/api/piscina/types')
      .then(res => res.json())
      .then(data => setManillaTypes(data))
      .catch(err => console.error('Error loading manillas:', err));
  };

  const handleSaveManilla = async () => {
    try {
      const response = await fetch('/api/piscina/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newManilla)
      });
      if (response.ok) {
        setNewManilla({ id: null, name: '', price: 0, color: 'brand-purple' });
        loadManillas();
        setMessage('✅ Manilla guardada.');
      }
    } catch (error) {
      setMessage('❌ Error al guardar manilla.');
    }
  };

  const handleDeleteManilla = async (id) => {
    if (!window.confirm('¿Eliminar tipo de manilla?')) return;
    try {
      await fetch(`/api/piscina/types/${id}`, { method: 'DELETE' });
      loadManillas();
      setMessage('✅ Manilla eliminada.');
    } catch (error) {
      setMessage('❌ Error al eliminar.');
    }
  };

  const loadSettings = () => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (Object.keys(data).length > 0) {
          setSettings(prev => ({ ...prev, ...data }));
          setOriginalSettings(data);
          if (data.COURT_SCHEDULES) {
            setSchedules(JSON.parse(data.COURT_SCHEDULES));
          }
        }
      })
      .catch(err => console.error('Error loading settings:', err));
  };

  const hasChanges = Object.keys(settings).some(key => settings[key] !== originalSettings[key]);

  const loadUsers = () => {
    fetch('/api/auth/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error('Error loading users:', err));
  };

  const loadProducts = () => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error('Error loading products:', err));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          COURT_SCHEDULES: JSON.stringify(schedules)
        })
      });
      if (response.ok) {
        setOriginalSettings(settings);
        setMessage('✅ Configuración sincronizada.');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('❌ Error en la persistencia.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const togglePermission = (path) => {
    const perms = newUser.permissions.includes(path)
      ? newUser.permissions.filter(p => p !== path)
      : [...newUser.permissions, path];
    setNewUser({ ...newUser, permissions: perms });
  };

  const handleAddUser = async () => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      if (response.ok) {
        setShowUserModal(false);
        loadUsers();
      }
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const menuItems = [
    { id: 'whatsapp', label: 'WhatsApp', icon: 'chat_bubble' },
    { id: 'ai', label: 'Inteligencia Artificial', icon: 'psychology' },
    { id: 'restaurante', label: 'Config. Restaurante', icon: 'restaurant' },
    { id: 'piscina', label: 'Precios Piscina', icon: 'pool' },
    { id: 'canchas', label: 'Horarios Canchas', icon: 'calendar_month' },
    { id: 'usuarios', label: 'Usuarios y Perfiles', icon: 'badge' },
    { id: 'system', label: 'Estado del Sistema', icon: 'dns' },
  ];

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden font-['Manrope']">
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-purple flex items-center justify-center text-white shadow-lg shadow-brand-purple/20">
            <span className="material-symbols-outlined text-sm">settings</span>
          </div>
          <div>
            <h1 className="text-sm font-black text-brand-purple uppercase tracking-tight">Infraestructura</h1>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Core Configuration</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-brand-purple'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{item.icon}</span>
              <span className="text-xs font-black uppercase tracking-wider">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-slate-100">
          {hasChanges && (
            <div className="mb-4 flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg animate-pulse">
              <span className="material-symbols-outlined text-sm">warning</span>
              <span className="text-[9px] font-black uppercase">Cambios sin guardar</span>
            </div>
          )}
          <button 
            onClick={handleSave}
            disabled={loading || !hasChanges}
            className={`w-full py-3 rounded-xl text-[10px] font-black transition-all shadow-lg ${
              hasChanges 
                ? 'bg-primary text-white shadow-primary/20 hover:scale-[1.02] active:scale-95' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {loading ? 'GUARDANDO TODO' : 'GUARDAR CAMBIOS'}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-purple/10 flex items-center justify-center text-brand-purple">
              <span className="material-symbols-outlined text-[18px]">
                {menuItems.find(i => i.id === activeTab)?.icon}
              </span>
            </div>
            <h2 className="text-xs font-black text-on-surface uppercase tracking-widest">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>
          {message && (
            <span className="text-xs font-bold text-secondary animate-in fade-in slide-in-from-right-4 bg-secondary/10 px-4 py-1.5 rounded-full">
              {message}
            </span>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-10 bg-[#fbfbfb]">
          <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'whatsapp' && (
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Proveedor de Servicio</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['whapi', 'meta'].map((p) => (
                        <button
                          key={p}
                          onClick={() => setSettings({ ...settings, WHATSAPP_PROVIDER: p })}
                          className={`p-4 rounded-2xl border-2 transition-all text-left ${
                            settings.WHATSAPP_PROVIDER === p 
                              ? 'border-brand-purple bg-brand-purple/5' 
                              : 'border-slate-100 hover:border-slate-200 bg-slate-50'
                          }`}
                        >
                          <p className="text-xs font-black text-brand-purple uppercase">{p === 'whapi' ? 'Whapi.cloud' : 'Meta API Oficial'}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Token de Acceso</label>
                      <button onClick={() => setShowTokens(!showTokens)} className="text-slate-400 hover:text-brand-purple flex items-center gap-1 transition-colors">
                        <span className="material-symbols-outlined text-sm">{showTokens ? 'visibility_off' : 'visibility'}</span>
                        <span className="text-[9px] font-bold uppercase">{showTokens ? 'Ocultar' : 'Ver'}</span>
                      </button>
                    </div>
                    <input 
                      type={showTokens ? "text" : "password"}
                      name={settings.WHATSAPP_PROVIDER === 'whapi' ? 'WHAPI_TOKEN' : 'META_TOKEN'}
                      value={settings.WHATSAPP_PROVIDER === 'whapi' ? settings.WHAPI_TOKEN : settings.META_TOKEN}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border-slate-200 rounded-xl py-4 px-5 text-sm font-medium focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OpenAI API Key</label>
                      <button onClick={() => setShowTokens(!showTokens)} className="text-slate-400 hover:text-brand-purple flex items-center gap-1 transition-colors">
                        <span className="material-symbols-outlined text-sm">{showTokens ? 'visibility_off' : 'visibility'}</span>
                        <span className="text-[9px] font-bold uppercase">{showTokens ? 'Ocultar' : 'Ver'}</span>
                      </button>
                    </div>
                    <input 
                      type={showTokens ? "text" : "password"}
                      name="OPENAI_API_KEY"
                      value={settings.OPENAI_API_KEY}
                      onChange={handleChange}
                      placeholder="sk-..."
                      className="w-full bg-slate-50 border-slate-200 rounded-xl py-4 px-5 text-sm font-medium focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Prompt (Personalidad)</label>
                    <textarea 
                      name="SYSTEM_PROMPT"
                      value={settings.SYSTEM_PROMPT}
                      onChange={handleChange}
                      rows="12"
                      className="w-full bg-slate-50 border-slate-200 rounded-xl py-4 px-5 text-sm font-medium focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all resize-none font-mono"
                    ></textarea>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'restaurante' && (
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-black text-brand-purple uppercase tracking-widest">Gestión de Productos</h3>
                    <button 
                      onClick={() => setShowProductModal(true)}
                      className="bg-brand-purple text-white px-4 py-2 rounded-lg text-[10px] font-black hover:scale-105 transition-all shadow-lg shadow-brand-purple/20"
                    >
                      AÑADIR PRODUCTO
                    </button>
                  </div>
                  <div className="overflow-hidden border border-slate-100 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tighter">Nombre</th>
                          <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tighter">Categoría</th>
                          <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tighter">Precio</th>
                          <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tighter text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {products.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-4 font-bold text-slate-700">{p.name}</td>
                            <td className="px-4 py-4 text-slate-500">{p.category}</td>
                            <td className="px-4 py-4 font-bold text-brand-purple">${Number(p.price).toLocaleString()}</td>
                            <td className="px-4 py-4 text-right">
                              <button onClick={() => { setNewProduct(p); setShowProductModal(true); }} className="text-brand-purple hover:underline font-black uppercase text-[10px]">Editar</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'canchas' && (
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-black text-brand-purple uppercase tracking-widest">Configuración de Horarios Semanales</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {schedules.map((schedule) => (
                      <div key={schedule.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-24">
                          <span className="text-xs font-black text-brand-purple uppercase">{schedule.day}</span>
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-4">
                          <input type="time" value={schedule.open} className="bg-white border-slate-200 rounded-lg py-2 px-3 text-xs font-bold" />
                          <input type="time" value={schedule.close} className="bg-white border-slate-200 rounded-lg py-2 px-3 text-xs font-bold" />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${schedule.active ? 'bg-secondary' : 'bg-slate-300'}`}></div>
                          <span className="text-[10px] font-black text-slate-500 uppercase">{schedule.active ? 'Abierto' : 'Cerrado'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-black text-brand-purple uppercase tracking-widest">Canchas Disponibles</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {courts.map((court) => (
                      <div key={court.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center text-brand-purple">
                          <span className="material-symbols-outlined text-lg">sports_soccer</span>
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-700">{court.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{court.sport}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'piscina' && (
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  <h3 className="text-xs font-black text-brand-purple uppercase tracking-widest">Configuración de Manillas</h3>
                  
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre (ej: Adulto)</label>
                        <input type="text" value={newManilla.name} onChange={e => setNewManilla({...newManilla, name: e.target.value})} className="w-full bg-white border-slate-200 rounded-xl py-3 px-4 text-sm font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio</label>
                        <input type="number" value={newManilla.price} onChange={e => setNewManilla({...newManilla, price: e.target.value})} className="w-full bg-white border-slate-200 rounded-xl py-3 px-4 text-sm font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Color</label>
                        <select value={newManilla.color} onChange={e => setNewManilla({...newManilla, color: e.target.value})} className="w-full bg-white border-slate-200 rounded-xl py-3 px-4 text-sm font-bold appearance-none">
                          <option value="brand-purple">Morado</option>
                          <option value="brand-orange">Naranja</option>
                          <option value="secondary">Verde</option>
                          <option value="primary">Azul</option>
                        </select>
                      </div>
                    </div>
                    <button onClick={handleSaveManilla} className="w-full bg-brand-purple text-white py-4 rounded-xl text-[10px] font-black shadow-lg shadow-brand-purple/20">
                      {newManilla.id ? 'ACTUALIZAR MANILLA' : 'AGREGAR TIPO DE MANILLA'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {manillaTypes.map(m => (
                      <div key={m.id} className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full bg-${m.color || 'brand-purple'}`}></div>
                          <div>
                            <p className="text-xs font-black text-slate-700 uppercase">{m.name}</p>
                            <p className="text-sm font-bold text-brand-purple">${m.price.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setNewManilla(m)} className="text-slate-400 hover:text-brand-purple p-1.5"><span className="material-symbols-outlined text-sm">edit</span></button>
                          <button onClick={() => handleDeleteManilla(m.id)} className="text-slate-400 hover:text-red-500 p-1.5"><span className="material-symbols-outlined text-sm">delete</span></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'usuarios' && (
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-black text-brand-purple uppercase tracking-widest">Usuarios del Sistema</h3>
                    <button onClick={() => setShowUserModal(true)} className="bg-brand-purple text-white px-4 py-2 rounded-lg text-[10px] font-black shadow-lg shadow-brand-purple/20">NUEVO USUARIO</button>
                  </div>
                  <div className="overflow-hidden border border-slate-100 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tighter">Nombre</th>
                          <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tighter">Email</th>
                          <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-tighter">Rol</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {users.map((u) => (
                          <tr key={u.id}>
                            <td className="px-4 py-4 font-bold text-slate-700">{u.name}</td>
                            <td className="px-4 py-4 text-slate-500">{u.email}</td>
                            <td className="px-4 py-4 font-black uppercase text-[10px] text-brand-purple">{u.role}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries(health).map(([key, value]) => (
                  <div key={key} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{key}</p>
                      <p className="text-xs font-black text-brand-purple uppercase">{value}</p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${value === 'online' || value === 'connected' ? 'bg-secondary shadow-lg shadow-secondary/20' : 'bg-primary shadow-lg shadow-primary/20 animate-pulse'}`}></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {showUserModal && (
        <div className="fixed inset-0 bg-brand-purple/20 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl">
            <h2 className="text-sm font-black text-brand-purple uppercase tracking-widest mb-6">Registrar Usuario</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Nombre" onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full bg-slate-50 border-slate-100 rounded-xl py-4 px-5 text-sm font-bold" />
              <input type="email" placeholder="Email" onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full bg-slate-50 border-slate-100 rounded-xl py-4 px-5 text-sm font-bold" />
              <input type="password" placeholder="Contraseña" onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full bg-slate-50 border-slate-100 rounded-xl py-4 px-5 text-sm font-bold" />
              <button onClick={handleAddUser} className="w-full bg-brand-purple text-white py-4 rounded-xl text-[10px] font-black">REGISTRAR</button>
              <button onClick={() => setShowUserModal(false)} className="w-full text-slate-400 text-[10px] font-black uppercase">CANCELAR</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Infraestructura;
