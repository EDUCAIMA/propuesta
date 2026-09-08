import React, { useState } from 'react';

const Login = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('encanto_token', data.token);
        localStorage.setItem('encanto_user', JSON.stringify(data.user));
        onLoginSuccess(data.user);
      } else {
        setError(data.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F7EADF] p-6 font-['Manrope']">
      <div className="max-w-md w-full bg-white rounded-[40px] shadow-2xl shadow-brand-purple/20 border border-white overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="p-12">
          <div className="flex flex-col items-center mb-10">
            <div className="relative w-56 mb-8">
              <img src="/logo.png" alt="Encanto Logo" className="w-56 transition-transform hover:scale-105 duration-300" />
              <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: '#872B90' }}>
                <span className="text-white text-3xl font-black tracking-widest">LOGO</span>
              </div>
            </div>
            <h1 className="text-xl font-black text-brand-purple uppercase tracking-tight text-center">Inicia Sesión</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Plataforma Operativa Encanto</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-primary/10 text-primary p-4 rounded-2xl text-[10px] font-black text-center border border-primary/20 animate-shake">
                {error.toUpperCase()}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all outline-none"
                  placeholder="admin@encanto.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">lock</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border-slate-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-purple text-white py-4 rounded-2xl text-[11px] font-black shadow-xl shadow-brand-purple/30 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <span className="tracking-widest">INGRESAR AL SISTEMA</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-slate-50 text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Soporte Técnico Encanto</p>
            <p className="text-[9px] font-medium text-slate-300 mt-1 uppercase">v1.0.4 AI Powered</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
