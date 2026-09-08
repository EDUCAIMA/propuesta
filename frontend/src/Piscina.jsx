import React, { useState, useEffect } from 'react';
import { ensureConnected, isConnected, listPrinters, getSavedPrinter, savePrinter, printSaleTicket } from './lib/printer.js';

const TARIFF_COLORS = [
  { value: 'brand-purple', label: 'Morado' },
  { value: 'primary', label: 'Naranja' },
  { value: 'secondary', label: 'Verde Azulado' },
  { value: 'pending', label: 'Dorado' },
];

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const Piscina = () => {
  const [types, setTypes] = useState([]);
  const [sales, setSales] = useState([]);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [cart, setCart] = useState([]); // [{ typeId, name, price, quantity }]
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [loading, setLoading] = useState(false);

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [tariffForm, setTariffForm] = useState({ id: null, name: '', price: '', color: 'brand-purple' });
  const [savingTariff, setSavingTariff] = useState(false);

  const [printerStatus, setPrinterStatus] = useState('checking'); // checking | connected | disconnected
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [availablePrinters, setAvailablePrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState(getSavedPrinter());
  const [loadingPrinters, setLoadingPrinters] = useState(false);
  const [printWarning, setPrintWarning] = useState(null); // ticket payload pending retry, or null
  const [retryingPrint, setRetryingPrint] = useState(false);

  useEffect(() => {
    loadData();
    checkPrinterConnection();
  }, []);

  const checkPrinterConnection = async () => {
    try {
      await ensureConnected();
      setPrinterStatus(isConnected() ? 'connected' : 'disconnected');
    } catch (error) {
      setPrinterStatus('disconnected');
    }
  };

  const handleOpenPrinterModal = async () => {
    setShowPrinterModal(true);
    setLoadingPrinters(true);
    try {
      const printers = await listPrinters();
      setAvailablePrinters(printers.filter(Boolean));
      setPrinterStatus('connected');
    } catch (error) {
      setPrinterStatus('disconnected');
    } finally {
      setLoadingPrinters(false);
    }
  };

  const handleSelectPrinter = (name) => {
    setSelectedPrinter(name);
    savePrinter(name);
  };

  const handleRetryPrint = async () => {
    if (!printWarning) return;
    setRetryingPrint(true);
    try {
      await printSaleTicket(printWarning);
      setPrinterStatus('connected');
      setPrintWarning(null);
    } catch (printError) {
      console.error('Error printing ticket:', printError);
      setPrinterStatus('disconnected');
    } finally {
      setRetryingPrint(false);
    }
  };

  const loadData = async (dateOverride) => {
    const date = dateOverride || selectedDate;
    try {
      const tRes = await fetch('/api/piscina/types');
      const tData = await tRes.json();
      setTypes(tData);

      const sRes = await fetch(`/api/piscina/sales?date=${date}`);
      const sData = await sRes.json();
      setSales(sData);
    } catch (error) {
      console.error('Error loading pool data:', error);
    }
  };

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    loadData(newDate);
  };

  const resetTariffForm = () => setTariffForm({ id: null, name: '', price: '', color: 'brand-purple' });

  const handleOpenConfig = () => {
    resetTariffForm();
    setShowConfigModal(true);
  };

  const handleEditTariff = (t) => {
    setTariffForm({ id: t.id, name: t.name, price: t.price, color: t.color || 'brand-purple' });
  };

  const handleSaveTariff = async () => {
    if (!tariffForm.name.trim() || !tariffForm.price) return alert('Ingrese el nombre y la tarifa');
    setSavingTariff(true);
    try {
      const response = await fetch('/api/piscina/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tariffForm)
      });
      if (response.ok) {
        resetTariffForm();
        loadData();
      }
    } catch (error) {
      console.error('Error saving tariff:', error);
    } finally {
      setSavingTariff(false);
    }
  };

  const handleDeleteTariff = async (id) => {
    if (!window.confirm('¿Eliminar esta tarifa?')) return;
    try {
      await fetch(`/api/piscina/types/${id}`, { method: 'DELETE' });
      if (tariffForm.id === id) resetTariffForm();
      loadData();
    } catch (error) {
      console.error('Error deleting tariff:', error);
    }
  };

  const handleAddToCart = (type) => {
    setCart(prev => {
      const existing = prev.find(i => i.typeId === type.id);
      if (existing) {
        return prev.map(i => i.typeId === type.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { typeId: type.id, name: type.name, price: type.price, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (typeId, delta) => {
    setCart(prev => prev
      .map(i => i.typeId === typeId ? { ...i, quantity: i.quantity + delta } : i)
      .filter(i => i.quantity > 0)
    );
  };

  const handleRemoveFromCart = (typeId) => {
    setCart(prev => prev.filter(i => i.typeId !== typeId));
  };

  const cartTotal = cart.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const cartUnits = cart.reduce((acc, i) => acc + i.quantity, 0);

  const handleRegisterSale = async () => {
    if (cart.length === 0) return alert('Agregue al menos una manilla');
    setLoading(true);
    try {
      const response = await fetch('/api/piscina/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({ typeId: i.typeId, quantity: i.quantity })),
          paymentMethod: paymentMethod.toUpperCase(),
          sellerId: null // TODO: Get from auth context
        })
      });
      if (response.ok) {
        const createdSales = await response.json();
        const soldCart = cart;
        const soldTotal = cartTotal;
        setCart([]);
        handleDateChange(todayStr());

        const lines = soldCart.map(item => ({
          name: item.name,
          unitPrice: item.price,
          quantity: item.quantity,
          references: createdSales.filter(s => s.typeId === item.typeId).map(s => s.reference)
        }));
        const ticketPayload = {
          businessName: 'ENCANTO',
          moduleName: 'Acceso Piscina',
          dateLabel: new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }),
          paymentMethod,
          lines,
          total: soldTotal
        };

        try {
          await printSaleTicket(ticketPayload);
          setPrinterStatus('connected');
        } catch (printError) {
          console.error('Error printing ticket:', printError);
          setPrinterStatus('disconnected');
          setPrintWarning(ticketPayload);
        }
      }
    } catch (error) {
      console.error('Error registering sale:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalToday = sales.reduce((acc, curr) => acc + curr.priceSold, 0);
  const isToday = selectedDate === todayStr();
  const selectedDateLabel = new Date(`${selectedDate}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <>
      <header className="sticky top-0 w-full h-16 flex items-center justify-between px-8 bg-white z-50 border-b border-slate-200 font-['Manrope'] font-medium">
        <div className="flex items-center gap-8 flex-1">
          <h2 className="text-lg font-black text-brand-purple uppercase tracking-tight">Acceso Piscina</h2>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={handleOpenPrinterModal}
            className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 text-brand-purple rounded-lg text-sm font-bold border border-slate-100 hover:bg-brand-purple/5 hover:border-brand-purple/30 transition-colors"
          >
            <span className={`h-2 w-2 rounded-full ${printerStatus === 'connected' ? 'bg-secondary' : printerStatus === 'checking' ? 'bg-slate-300' : 'bg-slate-400'}`}></span>
            Impresora
          </button>
          <button
            onClick={handleOpenConfig}
            className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 text-brand-purple rounded-lg text-sm font-bold border border-slate-100 hover:bg-brand-purple/5 hover:border-brand-purple/30 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">settings</span>
            Configurar Tarifas
          </button>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 text-brand-purple rounded-lg text-sm font-bold border border-slate-100">
            <span className="material-symbols-outlined text-sm">calendar_month</span>
            <span>{new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-primary ml-2 cursor-pointer shadow-sm">
            <img alt="Perfil" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6dn6tcljZMKpmrlEwV8wH0aTHI9QQNusfiKfwVwVO-ie58Sok57M6k79GgbhG0LgAHnrQOF9ZxtDnMXKLlOYlXDfheCVqvmIFQQYIGpbOcwDgBWWmSk3OzNk4wEYwlTF__Ic4tojUnp13Ktp1t6WWcVgkqjUx9_vw-Hi-5s9QsJ-lZQce8gT88DxtsJPFmBUVrzkJeOe2uSD6VqDI-iBss1yXJXiOeI4L-b-1947L2HewBBPalKFbYxQQOLOUuDBkemEOjDZ0_lZS"/>
          </div>
        </div>
      </header>
      <div className="p-8 h-[calc(100vh-4rem)] overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-8 h-full">
          <div className="lg:w-[400px] shrink-0 overflow-y-auto">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>payments</span>
                </div>
                <h3 className="text-xl font-extrabold font-headline text-brand-purple">Nueva Venta</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Seleccionar Tipo</label>
                  <div className="grid grid-cols-2 gap-3">
                    {types.map(t => {
                      const inCart = cart.find(i => i.typeId === t.id);
                      return (
                        <button
                          key={t.id}
                          onClick={() => handleAddToCart(t)}
                          className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all ${
                            inCart
                              ? 'border-brand-purple bg-brand-purple/[0.03]'
                              : 'border-slate-100 hover:border-brand-purple/30'
                          }`}
                        >
                          {inCart && (
                            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-brand-purple text-white text-[10px] font-black flex items-center justify-center">
                              {inCart.quantity}
                            </span>
                          )}
                          <span className={`text-lg font-black ${inCart ? 'text-brand-purple' : 'text-slate-700'}`}>${t.price.toLocaleString()}</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase mt-0.5">{t.name}</span>
                        </button>
                      );
                    })}
                    {types.length === 0 && (
                      <p className="col-span-2 text-center text-[10px] text-slate-400 italic py-4">No hay tipos configurados</p>
                    )}
                  </div>
                </div>
                {cart.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Manillas Seleccionadas</label>
                    <div className="border border-slate-100 rounded-xl divide-y divide-slate-50 overflow-hidden">
                      {cart.map(item => (
                        <div key={item.typeId} className="flex items-center justify-between px-4 py-3">
                          <div>
                            <p className="text-xs font-bold text-on-surface">{item.name}</p>
                            <p className="text-[10px] text-slate-400">${item.price.toLocaleString()} c/u</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdateQuantity(item.typeId, -1)}
                                className="h-6 w-6 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:border-brand-purple hover:text-brand-purple transition-colors"
                              >
                                <span className="material-symbols-outlined text-[14px]">remove</span>
                              </button>
                              <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateQuantity(item.typeId, 1)}
                                className="h-6 w-6 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:border-brand-purple hover:text-brand-purple transition-colors"
                              >
                                <span className="material-symbols-outlined text-[14px]">add</span>
                              </button>
                            </div>
                            <button
                              onClick={() => handleRemoveFromCart(item.typeId)}
                              className="text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Método de Pago</label>
                  <div className="flex gap-2">
                    {['Efectivo', 'Tarjeta', 'Transferencia'].map(m => (
                      <button 
                        key={m}
                        onClick={() => setPaymentMethod(m)}
                        className={`flex-1 py-2 px-1 rounded-lg border text-[11px] font-bold transition-colors ${
                          paymentMethod === m 
                            ? 'border-brand-purple bg-brand-purple text-white' 
                            : 'border-slate-200 text-slate-600 hover:border-brand-purple/50'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                {cart.length > 0 && (
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-slate-500">Total ({cartUnits} {cartUnits === 1 ? 'manilla' : 'manillas'})</span>
                    <span className="text-lg font-headline font-bold text-brand-purple">${cartTotal.toLocaleString()}</span>
                  </div>
                )}
                <button
                  disabled={loading || cart.length === 0}
                  onClick={handleRegisterSale}
                  className="w-full bg-primary text-white py-3.5 rounded-xl font-black text-xs shadow-lg shadow-primary/20 hover:brightness-105 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:grayscale"
                >
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>print</span>
                  {loading ? 'REGISTRANDO...' : 'REGISTRAR Y IMPRIMIR'}
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col min-h-0">
            <div className="mb-6 flex justify-between items-end shrink-0">
              <div>
                <h3 className="text-xl font-extrabold font-headline text-brand-purple">Historial de Ventas</h3>
                <p className="text-slate-500 text-sm mt-1">
                  Registros de manillas emitidas {isToday ? 'el día de hoy' : `el ${selectedDateLabel}`}.
                </p>
              </div>
              <div className="flex items-end gap-6">
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={selectedDate}
                    max={todayStr()}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-[7px] text-sm font-bold text-slate-600 focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all outline-none"
                  />
                  {!isToday && (
                    <button
                      onClick={() => handleDateChange(todayStr())}
                      className="text-xs font-bold text-brand-purple hover:underline"
                    >
                      Hoy
                    </button>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 mb-1">Total recaudado</p>
                  <p className="text-2xl font-headline font-bold text-brand-purple leading-none">${totalToday.toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-50">
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ref. Venta</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Hora</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Pago</th>
                      <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sales.length === 0 && (
                      <tr><td colSpan="5" className="px-6 py-10 text-center text-sm text-slate-400">No hay ventas registradas {isToday ? 'hoy' : 'ese día'}.</td></tr>
                    )}
                    {sales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3.5 text-sm font-medium text-on-surface">{sale.reference}</td>
                        <td className="px-6 py-3.5 text-sm text-slate-500">
                          {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-3.5 text-sm text-slate-600">{sale.type?.name}</td>
                        <td className="px-6 py-3.5 text-sm text-slate-500">{sale.paymentMethod}</td>
                        <td className="px-6 py-3.5 text-sm font-semibold text-on-surface text-right">${sale.priceSold.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3.5 bg-slate-50 flex items-center justify-between border-t border-slate-200 shrink-0">
                <span className="text-xs text-slate-500">{sales.length} {sales.length === 1 ? 'venta registrada' : 'ventas registradas'}</span>
                <button onClick={() => loadData()} className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-white hover:border-slate-300 transition-colors">Actualizar</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showConfigModal && (
        <div className="fixed inset-0 bg-brand-purple/20 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-sm font-black text-brand-purple uppercase tracking-widest">Configurar Tarifas de Piscina</h2>
                <p className="text-xs text-slate-400 font-medium mt-1">Define los tipos de manilla y su precio de venta.</p>
              </div>
              <button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-8 overflow-y-auto space-y-8">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tarifas Actuales</label>
                <div className="border border-slate-100 rounded-2xl divide-y divide-slate-50 overflow-hidden">
                  {types.length === 0 && (
                    <p className="text-center text-[11px] text-slate-400 italic py-6">No hay tarifas configuradas todavía.</p>
                  )}
                  {types.map(t => (
                    <div key={t.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full bg-${t.color || 'brand-purple'}`}></span>
                        <div>
                          <p className="text-xs font-bold text-on-surface">{t.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">${Number(t.price).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEditTariff(t)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-brand-purple hover:bg-brand-purple/5 transition-colors">
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button onClick={() => handleDeleteTariff(t.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {tariffForm.id ? 'Editar Tarifa' : 'Nueva Tarifa'}
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border-slate-100 rounded-xl py-3.5 px-5 text-sm font-bold focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all"
                      placeholder="Ej: Niños, Adultos, Convenio, Familiar"
                      value={tariffForm.name}
                      onChange={(e) => setTariffForm({ ...tariffForm, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio</label>
                    <input
                      type="number"
                      className="w-full bg-slate-50 border-slate-100 rounded-xl py-3.5 px-5 text-sm font-bold text-brand-purple focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all"
                      placeholder="Ej: 15000"
                      value={tariffForm.price}
                      onChange={(e) => setTariffForm({ ...tariffForm, price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Color</label>
                    <select
                      className="w-full bg-slate-50 border-slate-100 rounded-xl py-3.5 px-5 text-sm font-bold appearance-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all"
                      value={tariffForm.color}
                      onChange={(e) => setTariffForm({ ...tariffForm, color: e.target.value })}
                    >
                      {TARIFF_COLORS.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 flex gap-4 shrink-0">
              {tariffForm.id && (
                <button
                  onClick={resetTariffForm}
                  className="flex-1 bg-white border border-slate-200 py-4 rounded-2xl text-[10px] font-black text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  CANCELAR EDICIÓN
                </button>
              )}
              <button
                disabled={savingTariff}
                onClick={handleSaveTariff}
                className="flex-1 bg-brand-purple text-white py-4 rounded-2xl text-[10px] font-black shadow-lg shadow-brand-purple/20 hover:bg-brand-purple-dark transition-colors disabled:opacity-50"
              >
                {savingTariff ? 'GUARDANDO...' : (tariffForm.id ? 'ACTUALIZAR TARIFA' : 'GUARDAR TARIFA')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPrinterModal && (
        <div className="fixed inset-0 bg-brand-purple/20 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h2 className="text-sm font-black text-brand-purple uppercase tracking-widest">Impresora Térmica</h2>
                <p className="text-xs text-slate-400 font-medium mt-1">Selecciona la impresora que emitirá el ticket.</p>
              </div>
              <button onClick={() => setShowPrinterModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-8 space-y-5">
              {printerStatus !== 'connected' && (
                <div className="bg-pending/10 text-pending border border-pending/20 rounded-2xl px-4 py-3 text-xs font-medium">
                  No se detecta QZ Tray. Instálalo y ábrelo desde <span className="font-bold">qz.io/download</span>, luego pulsa "Actualizar".
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Impresoras disponibles</label>
                <div className="border border-slate-100 rounded-2xl divide-y divide-slate-50 overflow-hidden max-h-56 overflow-y-auto">
                  {loadingPrinters && (
                    <p className="text-center text-[11px] text-slate-400 italic py-6">Buscando impresoras...</p>
                  )}
                  {!loadingPrinters && availablePrinters.length === 0 && (
                    <p className="text-center text-[11px] text-slate-400 italic py-6">Ninguna impresora encontrada todavía.</p>
                  )}
                  {!loadingPrinters && availablePrinters.map(name => (
                    <button
                      key={name}
                      onClick={() => handleSelectPrinter(name)}
                      className={`w-full flex items-center justify-between px-5 py-3 text-left transition-colors ${selectedPrinter === name ? 'bg-brand-purple/5' : 'hover:bg-slate-50'}`}
                    >
                      <span className="text-xs font-bold text-on-surface">{name}</span>
                      {selectedPrinter === name && (
                        <span className="material-symbols-outlined text-brand-purple text-[18px]">check_circle</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 pt-0">
              <button
                onClick={handleOpenPrinterModal}
                className="w-full bg-slate-50 border border-slate-200 py-3.5 rounded-2xl text-[10px] font-black text-slate-500 hover:bg-slate-100 transition-colors"
              >
                ACTUALIZAR
              </button>
            </div>
          </div>
        </div>
      )}

      {printWarning && (
        <div className="fixed inset-0 bg-brand-purple/20 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-pending/10 flex items-center justify-center text-pending mb-5">
                <span className="material-symbols-outlined text-3xl">print_disabled</span>
              </div>
              <h2 className="text-sm font-black text-brand-purple uppercase tracking-widest">No se pudo imprimir el ticket</h2>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                La venta ya quedó registrada, pero el ticket no llegó a la impresora. Verifica que QZ Tray esté abierto y que la impresora esté bien configurada.
              </p>
            </div>

            <div className="p-8 pt-0 space-y-3">
              <button
                disabled={retryingPrint}
                onClick={handleRetryPrint}
                className="w-full bg-primary text-white py-3.5 rounded-2xl text-[10px] font-black shadow-lg shadow-primary/20 hover:brightness-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">print</span>
                {retryingPrint ? 'REINTENTANDO...' : 'REINTENTAR IMPRESIÓN'}
              </button>
              <button
                onClick={() => { setPrintWarning(null); handleOpenPrinterModal(); }}
                className="w-full bg-slate-50 border border-slate-200 py-3.5 rounded-2xl text-[10px] font-black text-slate-500 hover:bg-slate-100 transition-colors"
              >
                CONFIGURAR IMPRESORA
              </button>
              <button
                onClick={() => setPrintWarning(null)}
                className="w-full text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors py-1"
              >
                CERRAR
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Piscina;
