import React, { useState } from 'react';

// Color definitions for the dashboard
export const COLORS = {
  teal: '#0D9488',
  orange: '#F97316',
  amber: '#F59E0B',
  purple: '#8B5CF6',
  blue: '#3B82F6',
  cyan: '#0EA5E9',
  slate: '#64748B',
  green: '#10B981',
  red: '#EF4444'
};

// 1. Mini Sparkline Chart for KPI Cards
export const SparklineChart = ({ data = [], color = COLORS.teal, height = 36 }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 160;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(' ');

  const fillPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill={`url(#grad-${color.replace('#', '')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// 2. Main KPI Card
export const KpiCardNew = ({ icon, label, value, trend, trendUp = true, color = 'teal', sparklineData }) => {
  const colorMap = {
    teal: { bg: 'bg-[#0D9488]', text: 'text-[#0D9488]', hex: COLORS.teal },
    orange: { bg: 'bg-[#F97316]', text: 'text-[#F97316]', hex: COLORS.orange },
    amber: { bg: 'bg-[#F59E0B]', text: 'text-[#F59E0B]', hex: COLORS.amber },
    purple: { bg: 'bg-[#8B5CF6]', text: 'text-[#8B5CF6]', hex: COLORS.purple },
    cyan: { bg: 'bg-[#0EA5E9]', text: 'text-[#0EA5E9]', hex: COLORS.cyan },
  };

  const c = colorMap[color] || colorMap.teal;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300">
      <div>
        <div className="flex items-center gap-3.5 mb-3">
          <div className={`w-11 h-11 ${c.bg} text-white rounded-full flex items-center justify-center shadow-sm shrink-0`}>
            <span className="material-symbols-outlined text-2xl">{icon}</span>
          </div>
          <span className="text-[12px] font-bold text-slate-500 uppercase tracking-tight">{label}</span>
        </div>

        <div className="flex items-baseline justify-between gap-2 mb-2">
          <h3 className={`text-2xl font-headline font-extrabold ${c.text} tracking-tight`}>{value}</h3>
        </div>

        <div className="flex items-center gap-1.5 mb-4 text-xs font-bold">
          <span className={`flex items-center ${trendUp ? 'text-emerald-600' : 'text-rose-500'}`}>
            <span className="material-symbols-outlined text-sm font-black">
              {trendUp ? 'arrow_upward' : 'arrow_downward'}
            </span>
            {trend}
          </span>
        </div>
      </div>

      <div className="w-full pt-1">
        <SparklineChart data={sparklineData} color={c.hex} />
      </div>
    </div>
  );
};

// 3. Line Chart (Ingresos por Día)
export const DailyIncomeLineChart = () => {
  const days = ['01', '05', '10', '15', '20', '25', '30', '31'];
  
  // Normalized points for width 600, height 200
  const currentMonthData = [
    { x: 20, y: 160, val: '$450K', day: '01' },
    { x: 95, y: 105, val: '$850K', day: '05' },
    { x: 170, y: 130, val: '$700K', day: '10' },
    { x: 245, y: 85, val: '$1.1M', day: '15' },
    { x: 320, y: 40, val: '$1.5M', day: '20' },
    { x: 395, y: 110, val: '$800K', day: '25' },
    { x: 470, y: 65, val: '$1.3M', day: '30' },
    { x: 550, y: 20, val: '$1.8M', day: '31' }
  ];

  const prevMonthData = [
    { x: 20, y: 180, val: '$200K' },
    { x: 95, y: 145, val: '$400K' },
    { x: 170, y: 140, val: '$450K' },
    { x: 245, y: 115, val: '$750K' },
    { x: 320, y: 90, val: '$950K' },
    { x: 395, y: 150, val: '$350K' },
    { x: 470, y: 105, val: '$850K' },
    { x: 550, y: 70, val: '$1.2M' }
  ];

  const currentPath = currentMonthData.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const prevPath = prevMonthData.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const [activePoint, setActivePoint] = useState(null);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-extrabold text-slate-800">Ingresos por Día</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#0D9488] rounded-full inline-block"></span>
              Este mes
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-3 h-0.5 border-b border-dashed border-slate-400 inline-block"></span>
              Mes anterior
            </span>
          </div>
          <select className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-1.5 outline-none cursor-pointer">
            <option>Este mes</option>
            <option>Mes anterior</option>
          </select>
        </div>
      </div>

      <div className="relative w-full overflow-hidden flex-1 min-h-[220px]">
        {/* Y Axis Grid Lines */}
        <div className="absolute left-0 right-0 top-0 bottom-6 flex flex-col justify-between text-[11px] font-bold text-slate-400 border-l border-b border-slate-100 pl-2">
          <div className="border-b border-slate-100/80 w-full flex justify-between"><span>$2M</span></div>
          <div className="border-b border-slate-100/80 w-full flex justify-between"><span>$1.5M</span></div>
          <div className="border-b border-slate-100/80 w-full flex justify-between"><span>$1M</span></div>
          <div className="border-b border-slate-100/80 w-full flex justify-between"><span>$500K</span></div>
          <div className="w-full flex justify-between"><span>$0</span></div>
        </div>

        {/* SVG Chart */}
        <svg viewBox="0 0 580 220" className="w-full h-full overflow-visible pl-8 pb-4">
          {/* Previous Month Dashed Line */}
          <path d={prevPath} fill="none" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 4" />
          {prevMonthData.map((p, idx) => (
            <circle key={`prev-${idx}`} cx={p.x} cy={p.y} r="3" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="2" />
          ))}

          {/* Current Month Solid Line */}
          <path d={currentPath} fill="none" stroke="#0D9488" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {currentMonthData.map((p, idx) => (
            <g key={`curr-${idx}`} className="cursor-pointer group" onMouseEnter={() => setActivePoint(p)} onMouseLeave={() => setActivePoint(null)}>
              <circle cx={p.x} cy={p.y} r="5" fill="#0D9488" stroke="#FFFFFF" strokeWidth="2" className="transition-transform group-hover:scale-125" />
            </g>
          ))}
        </svg>

        {/* Tooltip */}
        {activePoint && (
          <div
            className="absolute bg-slate-800 text-white text-[11px] font-bold px-2.5 py-1 rounded-md shadow-lg pointer-events-none -translate-x-1/2 -translate-y-full mb-2"
            style={{ left: `${(activePoint.x / 580) * 90 + 5}%`, top: `${(activePoint.y / 220) * 80}%` }}
          >
            Día {activePoint.day}: {activePoint.val}
          </div>
        )}
      </div>

      {/* X Axis Labels */}
      <div className="flex justify-between pl-8 pr-2 pt-2 text-[11px] font-bold text-slate-400 border-t border-slate-100">
        {days.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
    </div>
  );
};

// 4. Custom Donut Chart Component
export const DonutChartCustom = ({ title, total, items }) => {
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col justify-between">
      <h3 className="text-base font-extrabold text-slate-800 mb-4">{title}</h3>

      <div className="flex items-center justify-between gap-6 my-auto">
        {/* Donut SVG */}
        <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            {items.map((item, idx) => {
              const strokeDasharray = `${(item.percent / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += item.percent;

              return (
                <circle
                  key={idx}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500 hover:opacity-90 cursor-pointer"
                />
              );
            })}
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total</span>
            <span className="text-xs font-headline font-black text-slate-800 leading-tight">{total}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2.5">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                <span className="font-semibold text-slate-700 truncate">{item.label}</span>
              </div>
              <div className="text-right ml-2 shrink-0">
                <span className="font-extrabold text-slate-800 block text-[11px]">{item.amount}</span>
                <span className="text-[10px] font-bold text-slate-400">({item.percent}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 5. Bar Chart Component for "Ingresos por Servicio (Mensual)"
export const ServiceBarChart = ({ items }) => {
  const maxVal = 10; // in Millions

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-extrabold text-slate-800">Ingresos por Servicio <span className="text-xs font-normal text-slate-400">(Mensual)</span></h3>
        <select className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-1.5 outline-none cursor-pointer">
          <option>Este mes</option>
          <option>Mes anterior</option>
        </select>
      </div>

      <div className="relative flex-1 flex items-end justify-between gap-4 pt-8 pb-4 border-b border-slate-100 px-4">
        {/* Horizontal background lines */}
        <div className="absolute inset-0 flex flex-col justify-between text-[10px] font-bold text-slate-300 pointer-events-none pb-4">
          <div className="border-b border-slate-100/80 w-full flex justify-between"><span>$10M</span></div>
          <div className="border-b border-slate-100/80 w-full flex justify-between"><span>$8M</span></div>
          <div className="border-b border-slate-100/80 w-full flex justify-between"><span>$6M</span></div>
          <div className="border-b border-slate-100/80 w-full flex justify-between"><span>$4M</span></div>
          <div className="border-b border-slate-100/80 w-full flex justify-between"><span>$2M</span></div>
          <div className="w-full flex justify-between"><span>$0</span></div>
        </div>

        {/* Bars */}
        {items.map((item, idx) => {
          const heightPercent = (item.valNum / maxVal) * 100;

          return (
            <div key={idx} className="flex-1 flex flex-col items-center z-10 group cursor-pointer">
              <span className="text-[11px] font-black text-slate-700 mb-2 group-hover:scale-110 transition-transform">
                {item.formattedVal}
              </span>
              <div className="w-full max-w-[48px] bg-slate-100 rounded-t-xl overflow-hidden flex items-end h-[160px]">
                <div
                  className="w-full rounded-t-xl transition-all duration-700 group-hover:brightness-110"
                  style={{ height: `${heightPercent}%`, backgroundColor: item.color }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Icons & Titles */}
      <div className="grid grid-cols-4 gap-2 pt-3 text-center">
        {items.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-xs" style={{ backgroundColor: item.color }}>
              <span className="material-symbols-outlined text-sm">{item.icon}</span>
            </div>
            <span className="text-[10px] font-bold text-slate-700 leading-tight truncate w-full">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 6. Reservas Próximas List Component
export const UpcomingReservationsList = ({ items }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-extrabold text-slate-800">Reservas Próximas</h3>
        <button className="text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors">
          Ver todas
        </button>
      </div>

      <div className="space-y-3 my-auto">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-slate-100/60 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs" style={{ backgroundColor: item.color }}>
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-extrabold text-slate-800 truncate">{item.title}</h4>
                <p className="text-[11px] font-bold text-slate-400 truncate">{item.time}</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-200/60 shrink-0 ml-2">
              {item.status || 'Confirmada'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// 7. Bottom Banner Component ("Resumen Rápido")
export const QuickSummaryBanner = ({ stats }) => {
  return (
    <div className="bg-[#FFFDF5] border border-[#FDE68A]/70 p-5 rounded-2xl shadow-xs mt-6">
      <h4 className="text-xs font-black uppercase text-amber-900 tracking-wider mb-3.5">Resumen Rápido</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-amber-200/50">
        {/* Item 1 */}
        <div className="flex items-center gap-3 pt-2 md:pt-0">
          <div className="w-10 h-10 rounded-xl bg-[#0D9488]/10 text-[#0D9488] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">calendar_today</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase leading-none mb-1">Día con más ingresos</p>
            <p className="text-xs font-black text-slate-800">{stats?.topDay || 'Sábado'}</p>
            <p className="text-xs font-extrabold text-[#0D9488]">{stats?.topDayVal || '$3.250.000'}</p>
          </div>
        </div>

        {/* Item 2 */}
        <div className="flex items-center gap-3 pt-3 md:pt-0 md:pl-4">
          <div className="w-10 h-10 rounded-xl bg-[#F97316]/10 text-[#F97316] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">confirmation_number</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase leading-none mb-1">Servicio más solicitado</p>
            <p className="text-xs font-black text-slate-800">{stats?.topService || 'Canchas Deportivas'}</p>
            <p className="text-xs font-extrabold text-[#F97316]">{stats?.topServiceCount || '1.024 reservas'}</p>
          </div>
        </div>

        {/* Item 3 */}
        <div className="flex items-center gap-3 pt-3 md:pt-0 md:pl-4">
          <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">group_add</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase leading-none mb-1">Nuevos Clientes (Este mes)</p>
            <p className="text-xs font-black text-slate-800">{stats?.newCustomers || '132'}</p>
            <p className="text-[11px] font-bold text-emerald-600">↑ 15% vs. Abril</p>
          </div>
        </div>

        {/* Item 4 */}
        <div className="flex items-center gap-3 pt-3 md:pt-0 md:pl-4">
          <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/10 text-[#8B5CF6] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-xl">cancel</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase leading-none mb-1">Cancelaciones</p>
            <p className="text-xs font-black text-slate-800">{stats?.cancellations || '28'}</p>
            <p className="text-[11px] font-bold text-rose-500">↓ 8% vs. Abril</p>
          </div>
        </div>
      </div>
    </div>
  );
};
