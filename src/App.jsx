import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { CalendarView } from './views/CalendarView';
import { PiscinaView } from './views/PiscinaView';
import { RestauranteView } from './views/RestauranteView';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [activeView, setActiveView] = useState('calendar');

  const getTitle = (view) => {
    switch(view) {
      case 'dashboard': return 'Dashboard Operativo';
      case 'whatsapp': return 'Consola de WhatsApp';
      case 'calendar': return 'Planificador de Canchas';
      case 'pool': return 'Venta de Manillas (Piscina)';
      case 'restaurant': return 'Venta Restaurante (POS)';
      case 'clients': return 'Directorio de Clientes';
      case 'infra': return 'Gestión de Infraestructura';
      default: return 'Encanto';
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      
      <main className="ml-72 min-h-screen flex flex-col">
        <Header title={getTitle(activeView)} />
        
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              className="h-full"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeView === 'calendar' && <CalendarView />}
              {activeView === 'pool' && <PiscinaView />}
              {activeView === 'restaurant' && <RestauranteView />}
              {activeView !== 'calendar' && activeView !== 'pool' && activeView !== 'restaurant' && (
                <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-8 text-center">
                  <div className="w-24 h-24 bg-brand-purple/10 rounded-full flex items-center justify-center text-brand-purple mb-6">
                    <span className="material-symbols-outlined text-5xl">construction</span>
                  </div>
                  <h3 className="text-2xl font-bold text-brand-purple-dark mb-2">Sección en Construcción</h3>
                  <p className="text-slate-500 max-w-md">
                    Estamos trabajando para traerte la mejor experiencia en la gestión de {getTitle(activeView).toLowerCase()}.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default App;
