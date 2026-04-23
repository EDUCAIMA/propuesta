import React from 'react';
import { Search, Bell, HelpCircle, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';

export const Header = ({ title }) => {
  return (
    <header className="sticky top-0 w-full h-16 flex items-center justify-between px-8 bg-white/95 backdrop-blur-xl z-50 border-b border-slate-200 font-headline font-medium">
      <div className="flex items-center gap-8 flex-1">
        <h2 className="text-lg font-extrabold text-brand-purple">{title}</h2>
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            className="w-full bg-slate-100 border-none rounded-full pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-brand-purple/20 placeholder:text-slate-400" 
            placeholder="Buscar reservas o miembros..." 
            type="text"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-4 py-1.5 bg-brand-purple text-white rounded-lg text-sm font-bold shadow-sm cursor-pointer hover:bg-brand-purple-dark transition-colors">
          <CalendarIcon size={16} />
          <span>15 de Abril, 2026</span>
          <ChevronDown size={16} className="text-primary" />
        </div>
        
        <div className="flex items-center gap-2">
          <button className="hover:bg-slate-100 rounded-full p-2 transition-all duration-300 text-brand-purple">
            <Bell size={20} />
          </button>
          <button className="hover:bg-slate-100 rounded-full p-2 transition-all duration-300 text-brand-purple">
            <HelpCircle size={20} />
          </button>
          <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-primary ml-2 cursor-pointer shadow-sm">
            <img 
              alt="Perfil del Gerente" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6dn6tcljZMKpmrlEwV8wH0aTHI9QQNusfiKfwVwVO-ie58Sok57M6k79GgbhG0LgAHnrQOF9ZxtDnMXKLlOYlXDfheCVqvmIFQQYIGpbOcwDgBWWmSk3OzNk4wEYwlTF__Ic4tojUnp13Ktp1t6WWcVgkqjUx9_vw-Hi-5s9QsJ-lZQce8gT88DxtsJPFmBUVrzkJeOe2uSD6VqDI-iBss1yXJXiOeI4L-b-1947L2HewBBPalKFbYxQQOLOUuDBkemEOjDZ0_lZS"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
