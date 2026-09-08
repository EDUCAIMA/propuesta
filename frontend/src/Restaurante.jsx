import React, { useState, useEffect } from 'react';

const Restaurante = () => {
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ id: null, name: '', category: 'Platos Fuertes', price: '', image: null });
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const handleSaveProduct = async () => {
    try {
      const method = newProduct.id ? 'PUT' : 'POST';
      const url = newProduct.id ? `/api/products/${newProduct.id}` : '/api/products';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      if (res.ok) {
        setShowProductModal(false);
        setNewProduct({ id: null, name: '', category: 'Platos Fuertes', price: '', image: null });
        fetchProducts();
      }
    } catch (err) {
      console.error('Error saving product:', err);
    }
  };

  const handleDeleteProduct = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('¿Eliminar producto?')) return;
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product', err);
    }
  };

  const handleEditProduct = (prod, e) => {
    e.stopPropagation();
    setNewProduct({
      id: prod.id,
      name: prod.name,
      category: prod.category,
      price: prod.price,
      image: prod.image || null
    });
    setShowProductModal(true);
  };

  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('todas');
  const [isEditingMenu, setIsEditingMenu] = useState(false);
  const [orders, setOrders] = useState([]);
  const [showOrdersPanel, setShowOrdersPanel] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [completedOrder, setCompletedOrder] = useState(null);
  const [printOrder, setPrintOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/sales?type=RESTAURANTE');
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const getOrderRef = (order) => order.id ? `#${order.id.slice(-6).toUpperCase()}` : '#------';

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct({ ...newProduct, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: item.quantity + delta };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const taxes = subtotal * 0.08;
  const total = subtotal + taxes;

  const handleCheckout = async () => {
    if (cart.length === 0 || isCheckingOut) return;
    setIsCheckingOut(true);
    setCheckoutError('');
    const payload = {
      type: 'RESTAURANTE',
      items: { mesa: 'Mesa #05', mesero: 'Juan Pérez', products: cart, subtotal, taxes },
      totalAmount: total
    };
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('El servidor rechazó la venta');
      const order = await res.json();
      setOrders(prev => [order, ...prev]);
      setCompletedOrder(order);
      setCart([]);
    } catch (err) {
      console.error('Error registrando la venta:', err);
      setCheckoutError('No se pudo guardar la orden. Verifica la conexión con el servidor e intenta de nuevo.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const categories = [
    { id: 'todas', label: 'Todas' },
    { id: 'entradas', label: 'Entradas' },
    { id: 'platos', label: 'Platos Fuertes' },
    { id: 'hamburguesas', label: 'Hamburguesas' },
    { id: 'bebidas', label: 'Bebidas' },
    { id: 'postres', label: 'Postres' }
  ];

  const filteredProducts = activeCategory === 'todas'
    ? products
    : products.filter(p => p.category === categories.find(c => c.id === activeCategory)?.label);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-surface">
      {/* Top Header */}
      <header className="h-16 flex items-center justify-between px-6 bg-surface shrink-0">
        <h1 className="text-xl font-extrabold text-brand-purple tracking-tight uppercase">Punto de Venta POS</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowOrdersPanel(true)}
            className="relative flex items-center gap-2 bg-white text-brand-purple px-4 py-2 rounded-lg font-bold text-sm border border-outline-variant hover:bg-brand-purple/5 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">receipt_long</span>
            Órdenes
            {orders.length > 0 && (
              <span className="ml-1 min-w-[20px] h-5 px-1 rounded-full bg-brand-orange text-white text-[10px] font-black flex items-center justify-center">
                {orders.length}
              </span>
            )}
          </button>
          <div className="flex items-center gap-2 bg-brand-purple/5 text-brand-purple px-4 py-2 rounded-lg font-bold text-sm border border-brand-purple/10">
            <span className="material-symbols-outlined text-lg">person</span>
            Mesero: Juan Pérez
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-800 text-white flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined">person</span>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex min-h-0">
        
        {/* Left Side: Products Menu */}
        <div className="flex-1 flex flex-col p-6 pt-0 bg-surface min-w-0">
          
          {/* Categories Tabs */}
          <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide shrink-0">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-6 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors border ${
                  activeCategory === cat.id 
                    ? 'bg-brand-purple text-white border-brand-purple' 
                    : 'bg-white text-brand-purple border-outline-variant hover:bg-brand-purple/5'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
              {filteredProducts.length === 0 && (
                <div className="col-span-full py-10 text-center text-slate-400 font-bold italic">No hay productos en esta categoría.</div>
              )}
              {filteredProducts.map(prod => (
                <div key={prod.id} onClick={() => { if (!isEditingMenu) addToCart(prod); }} className={`bg-white rounded-2xl p-4 border border-outline-variant shadow-sm hover:shadow-md hover:border-brand-purple/30 transition-all group flex flex-col h-full relative ${isEditingMenu ? 'cursor-default' : 'cursor-pointer'}`}>
                  {isEditingMenu && (
                    <div className="absolute top-2 right-2 flex gap-1 z-10">
                      <button onClick={(e) => handleEditProduct(prod, e)} className="w-8 h-8 rounded-full bg-white shadow flex items-center justify-center text-slate-500 hover:text-brand-purple hover:bg-slate-50">
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                      <button onClick={(e) => handleDeleteProduct(prod.id, e)} className="w-8 h-8 rounded-full bg-white shadow flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-slate-50">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  )}
                  <div className="bg-brand-purple/5 rounded-xl h-28 mb-4 flex items-center justify-center group-hover:bg-brand-purple/10 transition-colors overflow-hidden">
                    {prod.image ? (
                      <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-4xl text-brand-purple/20 group-hover:text-brand-purple/40">{prod.icon || 'restaurant'}</span>
                    )}
                  </div>
                  <div className="mt-auto">
                    <h3 className="font-bold text-on-surface truncate" title={prod.name}>{prod.name}</h3>
                    <p className="text-[10px] font-medium text-on-surface-variant uppercase tracking-wider mb-2">{prod.category}</p>
                    <p className="text-lg font-black text-brand-purple">${Number(prod.price).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Invoice/Cart */}
        <div className="w-96 bg-white border-l border-outline-variant flex flex-col shrink-0">
          <div className="p-6 border-b border-outline-variant">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-black text-brand-purple">Factura Actual</h2>
              <span className="bg-brand-orange/10 text-brand-orange text-[10px] font-black px-2 py-1 rounded uppercase">Mesa #05</span>
            </div>
            <p className="text-xs font-medium text-on-surface-variant">Cliente: Consumidor Final</p>
          </div>

          <div className="flex-1 overflow-y-auto p-0">
            {cart.length === 0 && (
              <div className="p-6 text-center text-slate-400 font-bold italic mt-10">
                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">shopping_cart</span>
                <p>El carrito está vacío</p>
              </div>
            )}
            {cart.map(item => (
              <div key={item.id} className="px-6 py-4 border-b border-outline-variant hover:bg-surface/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="pr-4">
                    <p className="text-sm font-bold text-on-surface leading-tight">{item.name}</p>
                    <p className="text-[10px] text-brand-purple font-black mt-1">${Number(item.price).toLocaleString()}</p>
                  </div>
                  <p className="text-sm font-black text-brand-purple shrink-0">${(item.price * item.quantity).toLocaleString()}</p>
                </div>
                <div className="flex justify-end items-center gap-3">
                  <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded-full border border-brand-orange text-brand-orange flex items-center justify-center hover:bg-brand-orange/10 transition-colors">
                    <span className="material-symbols-outlined text-[16px]">remove</span>
                  </button>
                  <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded-full border border-brand-orange text-brand-orange flex items-center justify-center hover:bg-brand-orange/10 transition-colors">
                    <span className="material-symbols-outlined text-[16px]">add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-white border-t border-outline-variant shrink-0">
            {checkoutError && (
              <div className="mb-4 bg-primary/10 text-primary p-3 rounded-xl text-[11px] font-black text-center border border-primary/20">
                {checkoutError}
              </div>
            )}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm font-medium text-on-surface-variant">
                <span>Subtotal</span>
                <span className="text-on-surface font-bold">${subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-medium text-on-surface-variant">
                <span>Impuestos (8%)</span>
                <span className="text-on-surface font-bold">${taxes.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex justify-between items-end pt-4 border-t border-outline-variant">
              <span className="text-lg font-black text-brand-purple">TOTAL</span>
              <span className="text-2xl font-black text-brand-orange">${total.toLocaleString()}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Footer Action Bar */}
      <footer className="h-16 bg-brand-purple shrink-0 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 text-white">
            <span className="material-symbols-outlined text-brand-orange">local_fire_department</span>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-80">Platos en Cocina</p>
              <p className="text-lg font-black leading-none">04</p>
            </div>
          </div>
          <div className="h-8 w-px bg-white/20"></div>
          <div className="flex items-center gap-2 text-white">
            <span className="material-symbols-outlined text-brand-orange">trending_up</span>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-80">Total Bruto Hoy</p>
              <p className="text-lg font-black leading-none">$1.840.000</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowProductModal(true)}
            className="h-12 px-6 rounded-xl bg-brand-purple text-white font-bold text-sm flex items-center gap-2 hover:bg-brand-purple-dark transition-colors shadow-lg shadow-brand-purple/20"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            Nuevo Producto
          </button>
          <button
            onClick={() => setIsEditingMenu(v => !v)}
            className={`h-12 px-6 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors shadow-lg ${
              isEditingMenu
                ? 'bg-brand-orange text-white shadow-brand-orange/20 hover:bg-brand-orange/90'
                : 'bg-brand-purple text-white shadow-brand-purple/20 hover:bg-brand-purple-dark'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{isEditingMenu ? 'done' : 'edit'}</span>
            {isEditingMenu ? 'Finalizar Edición' : 'Editar Menú'}
          </button>
          <button className="h-12 px-6 rounded-xl bg-brand-purple text-white font-bold text-sm flex items-center gap-2 hover:bg-brand-purple-dark transition-colors shadow-lg shadow-brand-purple/20">
            <span className="material-symbols-outlined text-[20px]">print</span>
            Imprimir Orden
          </button>
          <button
            onClick={handleCheckout}
            className="h-12 px-8 rounded-xl bg-primary text-white font-black text-sm flex items-center gap-3 shadow-lg shadow-primary/30 hover:bg-opacity-90 transition-all hover:-translate-y-0.5 ml-2 disabled:opacity-50 disabled:hover:translate-y-0"
            disabled={cart.length === 0 || isCheckingOut}
          >
            {isCheckingOut ? (
              <span className="material-symbols-outlined text-[22px] animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: '"FILL" 1' }}>payments</span>
            )}
            {isCheckingOut ? 'PROCESANDO...' : 'COBRAR Y FACTURAR'}
          </button>
        </div>
      </footer>

      {/* Modal Nuevo Producto */}
      {showProductModal && (
        <div className="fixed inset-0 bg-brand-purple/20 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <h2 className="text-sm font-black text-brand-purple uppercase tracking-widest">Crear Producto</h2>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre del Producto</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-50 border-slate-100 rounded-xl py-4 px-5 text-sm font-bold focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all" 
                  placeholder="Ej: Hamburguesa Especial"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</label>
                  <select 
                    className="w-full bg-slate-50 border-slate-100 rounded-xl py-4 px-5 text-sm font-bold appearance-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  >
                    <option>Entradas</option>
                    <option>Platos Fuertes</option>
                    <option>Hamburguesas</option>
                    <option>Bebidas</option>
                    <option>Postres</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio</label>
                  <input 
                    type="number" 
                    className="w-full bg-slate-50 border-slate-100 rounded-xl py-4 px-5 text-sm font-bold text-brand-purple focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all" 
                    placeholder="Ej: 15000"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Foto del Producto</label>
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                    {newProduct.image ? (
                      <img src={newProduct.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-slate-400 text-2xl">image</span>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="w-full bg-slate-50 border-slate-100 rounded-xl py-3 px-4 text-sm font-medium file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-brand-purple/10 file:text-brand-purple hover:file:bg-brand-purple/20 transition-all cursor-pointer"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>
            </div>
            <div className="p-8 bg-slate-50 flex gap-4">
              <button 
                onClick={() => setShowProductModal(false)}
                className="flex-1 bg-white border border-slate-200 py-4 rounded-2xl text-[10px] font-black text-slate-500 hover:bg-slate-50 transition-colors"
              >
                DESCARTAR
              </button>
              <button 
                onClick={handleSaveProduct}
                className="flex-1 bg-brand-purple text-white py-4 rounded-2xl text-[10px] font-black shadow-lg shadow-brand-purple/20 hover:bg-brand-purple-dark transition-colors"
              >
                {newProduct.id ? 'ACTUALIZAR PRODUCTO' : 'GUARDAR PRODUCTO'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Venta Exitosa */}
      {completedOrder && (
        <div className="fixed inset-0 bg-brand-purple/20 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-300">
            <div className="p-8 pb-6 text-center">
              <div className="w-20 h-20 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mx-auto mb-5">
                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
              </div>
              <h2 className="text-xl font-black text-on-surface mb-1">¡Venta registrada con éxito!</h2>
              <p className="text-sm font-medium text-on-surface-variant">
                Orden {getOrderRef(completedOrder)} · {completedOrder.items?.mesa}
              </p>
            </div>

            <div className="mx-8 border-t border-dashed border-slate-200"></div>

            <div className="p-8 pt-6">
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1 mb-4">
                {(completedOrder.items?.products || []).map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="font-bold text-on-surface">{item.quantity}x {item.name}</span>
                    <span className="font-bold text-on-surface-variant">${(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-outline-variant flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Cobrado</p>
                  <p className="text-[10px] font-medium text-on-surface-variant mt-1">
                    {completedOrder.createdAt ? new Date(completedOrder.createdAt).toLocaleString() : ''}
                  </p>
                </div>
                <span className="text-2xl font-black text-brand-orange">${Number(completedOrder.totalAmount).toLocaleString()}</span>
              </div>
            </div>

            <div className="p-8 pt-0 flex gap-4">
              <button
                onClick={() => { setCompletedOrder(null); setShowOrdersPanel(true); }}
                className="flex-1 bg-white border border-slate-200 py-4 rounded-2xl text-[10px] font-black text-brand-purple hover:bg-slate-50 transition-colors"
              >
                VER ÓRDENES
              </button>
              <button
                onClick={() => setCompletedOrder(null)}
                className="flex-1 bg-brand-purple text-white py-4 rounded-2xl text-[10px] font-black shadow-lg shadow-brand-purple/20 hover:bg-brand-purple-dark transition-colors"
              >
                NUEVA VENTA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel de Órdenes Generadas */}
      {showOrdersPanel && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div onClick={() => setShowOrdersPanel(false)} className="absolute inset-0 bg-brand-purple/20 backdrop-blur-sm"></div>
          <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col">
            <div className="p-6 border-b border-outline-variant flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-black text-brand-purple">Órdenes del Día</h2>
                <p className="text-xs font-medium text-on-surface-variant">
                  {orders.length} orden{orders.length === 1 ? '' : 'es'} generada{orders.length === 1 ? '' : 's'}
                </p>
              </div>
              <button onClick={() => setShowOrdersPanel(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="px-6 py-4 border-b border-outline-variant bg-surface shrink-0 grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-3 border border-outline-variant">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Órdenes Hoy</p>
                <p className="text-lg font-black text-brand-purple">{orders.length}</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-outline-variant">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Vendido</p>
                <p className="text-lg font-black text-brand-orange">
                  ${orders.reduce((acc, o) => acc + Number(o.totalAmount || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {orders.length === 0 && (
                <div className="text-center text-slate-400 font-bold italic mt-10">
                  <span className="material-symbols-outlined text-4xl mb-2 opacity-50 block">receipt_long</span>
                  Aún no se han generado órdenes.
                </div>
              )}
              {orders.map(order => (
                <div
                  key={order.id}
                  onClick={() => setPrintOrder(order)}
                  className="bg-white rounded-2xl p-4 border border-outline-variant hover:border-brand-purple/30 hover:shadow-sm transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm font-black text-brand-purple">{getOrderRef(order)}</p>
                      <p className="text-[10px] font-medium text-on-surface-variant">
                        {order.items?.mesa || '—'} · {order.items?.mesero || '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="bg-secondary/10 text-secondary text-[9px] font-black px-2 py-1 rounded uppercase">
                        {order.status === 'COMPLETED' ? 'Pagada' : order.status}
                      </span>
                      <span className="w-7 h-7 rounded-full bg-brand-purple/5 text-brand-purple flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-[16px]">print</span>
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant font-medium mb-2 line-clamp-2">
                    {(order.items?.products || []).map(p => `${p.quantity}x ${p.name}`).join(', ')}
                  </p>
                  <div className="flex justify-between items-center pt-2 border-t border-outline-variant">
                    <span className="text-[10px] font-bold text-slate-400">
                      {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                    <span className="text-sm font-black text-brand-orange">${Number(order.totalAmount).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Comanda de Cocina (Imprimir) */}
      {printOrder && (
        <div className="fixed inset-0 bg-brand-purple/20 backdrop-blur-sm z-[110] flex items-center justify-center p-6 print:bg-white print:p-0 print:backdrop-blur-none">
          <div className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden print:shadow-none print:border-0 print:rounded-none print:max-w-full">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center print:hidden">
              <h2 className="text-sm font-black text-brand-purple uppercase tracking-widest">Comanda de Cocina</h2>
              <button onClick={() => setPrintOrder(null)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div id="kitchen-ticket" className="p-8 font-mono">
              <div className="text-center mb-4">
                <p className="text-lg font-black uppercase tracking-widest">Encanto Restaurante</p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Comanda de Cocina</p>
              </div>
              <div className="border-t border-b border-dashed border-slate-300 py-3 mb-4 space-y-1 text-sm">
                <div className="flex justify-between"><span className="font-bold">Orden</span><span>{getOrderRef(printOrder)}</span></div>
                <div className="flex justify-between"><span className="font-bold">Mesa</span><span>{printOrder.items?.mesa || '—'}</span></div>
                <div className="flex justify-between"><span className="font-bold">Mesero</span><span>{printOrder.items?.mesero || '—'}</span></div>
                <div className="flex justify-between"><span className="font-bold">Hora</span><span>{printOrder.createdAt ? new Date(printOrder.createdAt).toLocaleString() : ''}</span></div>
              </div>
              <div className="space-y-3">
                {(printOrder.items?.products || []).map(item => (
                  <div key={item.id} className="flex justify-between text-base font-black">
                    <span>{item.quantity}x {item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 pt-2 flex gap-4 print:hidden">
              <button
                onClick={() => setPrintOrder(null)}
                className="flex-1 bg-white border border-slate-200 py-4 rounded-2xl text-[10px] font-black text-slate-500 hover:bg-slate-50 transition-colors"
              >
                CERRAR
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 bg-brand-purple text-white py-4 rounded-2xl text-[10px] font-black shadow-lg shadow-brand-purple/20 hover:bg-brand-purple-dark transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                IMPRIMIR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Restaurante;
