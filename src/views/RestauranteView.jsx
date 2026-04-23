import React, { useState } from 'react';
import { motion } from 'framer-motion';

const CATEGORIES = [
  { id: 'all', label: 'Todas', icon: 'grid_view' },
  { id: 'entries', label: 'Entradas', icon: 'egg_alt' },
  { id: 'main', label: 'Platos Fuertes', icon: 'restaurant' },
  { id: 'burgers', label: 'Hamburguesas', icon: 'lunch_dining' },
  { id: 'drinks', label: 'Bebidas', icon: 'local_bar' },
  { id: 'desserts', label: 'Postres', icon: 'icecream' },
];

const PRODUCTS = [
  { id: 1, name: 'Bandeja Paisa', category: 'main', price: 35000, icon: 'restaurant' },
  { id: 2, name: 'Hamburguesa Especial', category: 'burgers', price: 22000, icon: 'lunch_dining' },
  { id: 3, name: 'Jugo Natural', category: 'drinks', price: 8000, icon: 'local_bar' },
  { id: 4, name: 'Patacones con Hogao', category: 'entries', price: 12000, icon: 'egg_alt' },
  { id: 5, name: 'Sopa del Día', category: 'main', price: 15000, icon: 'soup_kitchen' },
  { id: 6, name: 'Copa Helado', category: 'desserts', price: 10000, icon: 'icecream' },
  { id: 7, name: 'Café Americano', category: 'drinks', price: 4500, icon: 'local_cafe' },
  { id: 8, name: 'Pasta Carbonara', category: 'main', price: 28000, icon: 'ramen_dining' },
];

export const RestauranteView = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredProducts = activeCategory === 'all' 
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.category === activeCategory);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Products Section */}
        <div className="flex-1 flex flex-col overflow-hidden bg-surface">
          {/* Categories Bar */}
          <div className="px-8 pt-6 pb-2 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
                    activeCategory === cat.id
                      ? 'bg-brand-purple text-white shadow-md'
                      : 'bg-white text-brand-purple border border-brand-purple/10 hover:bg-brand-purple/5'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de Productos */}
          <div className="flex-1 overflow-y-auto p-8 pt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <button 
                  key={product.id}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-outline-variant hover:border-primary hover:shadow-md transition-all flex flex-col items-start gap-3 active:scale-95 group text-left relative overflow-hidden"
                >
                  <div className="w-full h-32 bg-brand-purple/5 rounded-xl flex items-center justify-center text-brand-purple/20 transition-colors group-hover:bg-primary/5 group-hover:text-primary/20">
                    <span className="material-symbols-outlined text-4xl">{product.icon}</span>
                  </div>
                  <div>
                    <p className="font-bold text-on-surface line-clamp-1 group-hover:text-primary transition-colors">{product.name}</p>
                    <p className="text-xs text-on-surface-variant font-medium">
                      {CATEGORIES.find(c => c.id === product.category)?.label}
                    </p>
                  </div>
                  <p className="text-lg font-black text-brand-purple mt-auto">
                    ${product.price.toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bill Sidebar */}
        <div className="w-[380px] flex-shrink-0 bg-white border-l border-brand-purple/10 flex flex-col shadow-xl z-10">
          <div className="p-6 border-b border-outline-variant">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-extrabold font-headline text-brand-purple">Factura Actual</h3>
              <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase">Mesa #05</span>
            </div>
            <p className="text-xs text-on-surface-variant">Cliente: Consumidor Final</p>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex items-start gap-3 pb-4 border-b border-dashed border-outline-variant">
              <div className="flex-1">
                <h4 className="text-sm font-bold text-on-surface">Bandeja Paisa</h4>
                <p className="text-xs text-on-surface-variant italic">Sin frijol negro</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-brand-purple">$35,000</p>
                <div className="flex items-center gap-2 mt-1">
                  <button className="w-6 h-6 rounded-full border border-primary text-primary flex items-center justify-center hover:bg-primary/10 transition-colors">-</button>
                  <span className="text-xs font-bold w-4 text-center">1</span>
                  <button className="w-6 h-6 rounded-full border border-primary text-primary flex items-center justify-center hover:bg-primary/10 transition-colors">+</button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 pb-4 border-b border-dashed border-outline-variant">
              <div className="flex-1">
                <h4 className="text-sm font-bold text-on-surface">Jugo Natural</h4>
                <p className="text-xs text-on-surface-variant italic">Fresa en leche</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-brand-purple">$16,000</p>
                <div className="flex items-center gap-2 mt-1">
                  <button className="w-6 h-6 rounded-full border border-primary text-primary flex items-center justify-center hover:bg-primary/10 transition-colors">-</button>
                  <span className="text-xs font-bold w-4 text-center">2</span>
                  <button className="w-6 h-6 rounded-full border border-primary text-primary flex items-center justify-center hover:bg-primary/10 transition-colors">+</button>
                </div>
              </div>
            </div>
          </div>

          {/* Totals Section */}
          <div className="p-6 bg-brand-purple/[0.02] space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant font-medium">Subtotal</span>
              <span className="text-on-surface font-bold">$51,000</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant font-medium">Impuestos (8%)</span>
              <span className="text-on-surface font-bold">$4,080</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-outline-variant">
              <span className="text-lg font-extrabold text-brand-purple">TOTAL</span>
              <span className="text-2xl font-black text-primary font-headline">$55,080</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bar */}
      <footer className="h-20 bg-brand-purple flex items-center justify-between px-8 border-t border-white/10 z-20 text-white shrink-0">
        <div className="flex items-center gap-12">
          <div className="flex gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Platos en Cocina</span>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">cooking</span>
                <span className="text-lg font-black font-headline">04</span>
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Total Bruto Hoy</span>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">monitoring</span>
                <span className="text-lg font-black font-headline">$1,840,000</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all border border-white/20">
            <span className="material-symbols-outlined text-lg">edit</span>
            <span>Editar Menú</span>
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all border border-white/20">
            <span className="material-symbols-outlined text-lg">print</span>
            <span>Imprimir Orden</span>
          </button>
          <button className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-black shadow-lg shadow-black/20 hover:brightness-110 active:scale-95 transition-all">
            <span className="material-symbols-outlined">payments</span>
            <span>COBRAR Y FACTURAR</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
