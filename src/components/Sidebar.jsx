import { LayoutDashboard, MessageSquare, Calendar, Ticket, Utensils, Users, Settings, PlusCircle } from 'lucide-react';
import { cn } from '../utils/cn';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard Operativo', icon: LayoutDashboard },
  { id: 'whatsapp', label: 'Consola de WhatsApp', icon: MessageSquare },
  { id: 'calendar', label: 'Calendario Canchas', icon: Calendar },
  { id: 'pool', label: 'Venta Manillas', icon: Ticket },
  { id: 'restaurant', label: 'Restaurante', icon: Utensils },
  { id: 'clients', label: 'Directorio Clientes', icon: Users },
  { id: 'infra', label: 'Gestión de infraestructura', icon: Settings },
];

export const Sidebar = ({ activeView, onViewChange }) => {
  return (
    <aside className="h-screen w-72 flex-col fixed left-0 top-0 bg-brand-purple flex p-6 gap-y-4 font-headline antialiased tracking-tight shadow-2xl z-[60]">
      <div className="flex justify-center mb-8 px-4">
        <img 
          src="/logo.png" 
          alt="Encanto Logo" 
          className="w-full h-auto object-contain" 
        />
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 transition-all duration-200 group rounded-lg",
                isActive 
                  ? "text-white font-semibold bg-brand-purple-dark border-l-4 border-primary rounded-r-lg" 
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              <Icon size={20} className={cn("transition-transform", !isActive && "group-hover:scale-110")} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/10">
        <button className="w-full bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-primary/30 hover:opacity-90">
          <PlusCircle size={20} />
          <span>Nueva Reserva</span>
        </button>
      </div>
    </aside>
  );
};
