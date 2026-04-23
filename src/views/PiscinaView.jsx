import React, { useState } from 'react';
import { Printer, CreditCard, Banknote, Landmark, History, PlusCircle, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

const PRICE_OPTIONS = [
  { id: 'child', label: 'Niños', price: 15000 },
  { id: 'adult', label: 'Adultos', price: 25000 },
  { id: 'agreement', label: 'Convenio', price: 10000 },
  { id: 'family', label: 'Familiar', price: 50000 },
];

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Efectivo', icon: Banknote },
  { id: 'card', label: 'Tarjeta', icon: CreditCard },
  { id: 'transfer', label: 'Transferencia', icon: Landmark },
];

const SALES_HISTORY = [
  { ref: '#MN-4582', time: '09:12 AM', type: 'Adulto', amount: 25000, color: 'brand-purple' },
  { ref: '#MN-4581', time: '09:05 AM', type: 'Niño', amount: 15000, color: 'primary' },
  { ref: '#MN-4580', time: '08:58 AM', type: 'Convenio', amount: 10000, color: 'slate' },
  { ref: '#MN-4579', time: '08:42 AM', type: 'Adulto', amount: 25000, color: 'brand-purple' },
  { ref: '#MN-4578', time: '08:35 AM', type: 'Familiar', amount: 50000, color: 'primary' },
  { ref: '#MN-4577', time: '08:15 AM', type: 'Adulto', amount: 25000, color: 'brand-purple' },
];

export const PiscinaView = () => {
  const [selectedPrice, setSelectedPrice] = useState('child');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  return (
    <div className="p-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Form Side */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:w-1/3"
        >
          <div className="bg-white p-6 rounded-3xl shadow-premium border border-slate-200 sticky top-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Banknote size={24} />
              </div>
              <h3 className="text-xl font-extrabold font-headline text-brand-purple">Nueva Venta</h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Seleccionar Precio</label>
                <div className="grid grid-cols-2 gap-3">
                  {PRICE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setSelectedPrice(opt.id)}
                      className={cn(
                        "flex flex-col items-center justify-center p-4 rounded-2xl transition-all border-2",
                        selectedPrice === opt.id 
                          ? "border-primary bg-primary/5 shadow-sm" 
                          : "border-slate-100 hover:border-primary/30 hover:bg-slate-50"
                      )}
                    >
                      <span className={cn(
                        "text-lg font-extrabold",
                        selectedPrice === opt.id ? "text-primary" : "text-slate-700"
                      )}>
                        ${opt.price.toLocaleString()}
                      </span>
                      <span className={cn(
                        "text-[10px] font-bold uppercase",
                        selectedPrice === opt.id ? "text-primary/70" : "text-slate-400"
                      )}>
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Método de Pago</label>
                <div className="flex gap-2">
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = method.icon;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={cn(
                          "flex-1 py-3 px-2 rounded-xl border transition-all text-xs font-bold flex flex-col items-center gap-1",
                          paymentMethod === method.id 
                            ? "border-brand-purple bg-brand-purple/5 text-brand-purple" 
                            : "border-slate-100 text-slate-500 hover:border-brand-purple/30"
                        )}
                      >
                        <Icon size={16} />
                        {method.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <Printer size={18} />
                REGISTRAR E IMPRIMIR
              </button>
            </div>
          </div>
        </motion.div>

        {/* History Side */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:w-2/3"
        >
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h3 className="text-2xl font-extrabold font-headline tracking-tight text-brand-purple">Historial de Ventas</h3>
              <p className="text-slate-500 text-sm mt-1">Registros de manillas emitidas el día de hoy.</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Total Recaudado</p>
              <p className="text-3xl font-headline font-extrabold text-primary">$1.450.000</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-premium overflow-hidden border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Ref. Venta</th>
                    <th className="px-6 py-4 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Hora de Venta</th>
                    <th className="px-6 py-4 text-xs font-extrabold text-slate-400 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-4 text-xs font-extrabold text-slate-400 uppercase tracking-wider text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {SALES_HISTORY.map((sale) => (
                    <tr key={sale.ref} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-700">{sale.ref}</span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-400">{sale.time}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase",
                          sale.color === 'brand-purple' ? "bg-brand-purple/10 text-brand-purple" : 
                          sale.color === 'primary' ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-500"
                        )}>
                          {sale.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-black text-slate-700">
                        ${sale.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 tracking-tight">Mostrando las últimas 6 ventas</span>
              <button className="px-4 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl text-primary hover:bg-primary/5 transition-all shadow-sm">
                Ver Reporte Diario
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
