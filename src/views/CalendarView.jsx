import React from 'react';
import { StatsCard } from '../components/StatsCard';
import { CourtCalendar } from '../components/CourtCalendar';
import { motion } from 'framer-motion';

const DUMMY_DATA = {
  '08:00 AM': {
    'Cancha 2': { type: 'maintenance' }
  },
  '09:00 AM': {
    'Cancha 1': { name: 'Carlos M.', status: 'paid', details: 'Cancha Completa • Regular' },
    'Cancha 3': { name: 'Marta G.', status: 'pending', details: 'Reservado hace 15m' }
  },
  '10:00 AM': {
    'Cancha 1': { name: 'Equipo Alpha', status: 'paid', details: 'Sesión de Entrenamiento' },
    'Cancha 2': { name: 'Diego P.', status: 'paid', details: 'Clínica Individual' }
  },
  '02:00 PM': {
    'Cancha 1': { name: 'Federico L.', status: 'paid', details: 'Pagado' },
    'Cancha 2': { name: 'Lucia R.', status: 'paid', details: 'Pagado' },
    'Cancha 3': { name: 'Julián B.', status: 'paid', details: 'Pagado' },
    'Cancha 4': { name: 'Sonia H.', status: 'paid', details: 'Pagado' }
  },
  '03:00 PM': {
    'Cancha 4': { type: 'maintenance' }
  }
};

export const CalendarView = () => {
  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-end">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 className="text-3xl font-extrabold font-headline tracking-tight text-brand-purple-dark">Disponibilidad Diaria</h3>
          <p className="text-slate-500 text-sm mt-1 font-medium">Gestione y supervise la asignación de las 4 canchas profesionales.</p>
        </motion.div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-6 text-[10px] font-extrabold text-slate-700 uppercase tracking-widest bg-white border border-slate-200 px-5 py-3 rounded-xl shadow-sm">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-secondary"></div>Disponible</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary"></div>Reservado</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-pending"></div>Pendiente</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-200"></div>Mantenimiento</div>
          </div>
        </div>
      </div>

      <CourtCalendar data={DUMMY_DATA} />

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard label="Ingresos Diarios" value="$1,450" trend="+12%" trendType="success" />
        <StatsCard label="Tasa de Ocupación" value="84%" trend="Prom/Pico" />
        <StatsCard label="Depósitos Pendientes" value="08" trend="Atención" trendType="danger" />
        <StatsCard label="Próximo Mant." value="Cancha 4" subtext="03:00 PM" />
      </div>
    </div>
  );
};
