import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Wrench, MessageSquare } from 'lucide-react';
import { cn } from '../utils/cn';

const HOURS = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
];

const COURTS = ['Cancha 1', 'Cancha 2', 'Cancha 3', 'Cancha 4'];

const ReservationCell = ({ reservation }) => {
  if (!reservation) return (
    <div className="h-[50px] w-full bg-secondary hover:opacity-90 transition-colors group/cell cursor-pointer relative flex items-center justify-center">
      <PlusCircle className="text-white opacity-0 group-hover/cell:opacity-100 transition-opacity" size={20} />
    </div>
  );

  if (reservation.type === 'maintenance') {
    return (
      <div className="h-full w-full bg-slate-100 text-slate-500 px-3 flex items-center gap-2 font-bold italic opacity-60">
        <Wrench size={14} />
        <span>Mantenimiento</span>
      </div>
    );
  }

  const isPaid = reservation.status === 'paid';
  const isPending = reservation.status === 'pending';

  return (
    <div className={cn(
      "h-[50px] w-full p-2 flex flex-col justify-between shadow-sm relative group/popover cursor-pointer transition-transform active:scale-[0.98]",
      isPaid ? "bg-primary text-white" : "bg-pending text-brand-purple-dark"
    )}>
      <div className="flex justify-between items-start">
        <span className="font-bold text-sm tracking-tight">{reservation.name}</span>
        <span className={cn(
          "text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-widest",
          isPaid ? "bg-white/20" : "bg-black/10"
        )}>
          {isPaid ? 'Pagado' : 'Pendiente'}
        </span>
      </div>
      <div className="text-[10px] font-bold opacity-90 uppercase tracking-tighter">
        {reservation.details}
      </div>

      {/* Popover */}
      <div className="absolute left-full top-0 ml-4 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 z-40 text-on-surface hidden group-hover/popover:block pointer-events-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
            {reservation.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-brand-purple-dark">{reservation.name}</h4>
            <p className="text-[11px] text-slate-500">Miembro desde Ene 2023</p>
          </div>
        </div>
        <div className="space-y-2 mb-5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Teléfono:</span>
            <span className="font-bold text-brand-purple">+54 9 11 4455-6677</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Estado:</span>
            <span className={cn("font-extrabold", isPaid ? "text-primary" : "text-pending")}>
              {isPaid ? 'Pagado' : 'Pendiente'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 text-[11px] font-bold py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">Cancelar</button>
          <button className="flex-1 text-[11px] font-bold py-2.5 bg-[#25D366] text-white rounded-xl flex items-center justify-center gap-1 shadow-md shadow-green-200">
            <MessageSquare size={14} />
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export const CourtCalendar = ({ data }) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-brand-purple/10 relative border border-slate-200">
      {/* Contenedor con Scroll Separado */}
      <div className="max-h-[600px] overflow-y-auto overflow-x-auto custom-scrollbar rounded-2xl">
        <table className="w-full border-collapse min-w-[1000px]">
          <thead className="sticky top-0 z-30">
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="w-24 p-5 bg-slate-50 sticky left-0 z-40 border-r border-slate-200"></th>
              {COURTS.map(court => (
                <th key={court} className="p-5 text-left font-headline font-extrabold text-brand-purple-dark border-l border-slate-200 bg-slate-50">
                  {court}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-sm font-medium">
            {HOURS.map(hour => (
              <tr key={hour} className="h-[50px] group"> {/* Ajustado a 50px exactos */}
                <td className="p-4 text-xs font-bold text-slate-400 sticky left-0 bg-white z-10 text-right border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                  {hour}
                </td>
                {COURTS.map(court => (
                  <td key={`${hour}-${court}`} className="border-l border-b border-slate-100 p-0"> {/* Eliminado todo el padding */}
                    <ReservationCell reservation={data[hour]?.[court]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
