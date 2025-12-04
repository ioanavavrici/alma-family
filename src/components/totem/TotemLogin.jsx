import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ArrowRight, Loader2 } from 'lucide-react';
import api from '../../api';

export default function TotemLogin() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/totem/login', { code });
      localStorage.setItem('totem_pacient_id', res.data.pacient_id);
      localStorage.setItem('totem_pacient_nume', res.data.nume);
      navigate('/totem/live');
    } catch (err) {
      setError("Cod incorect.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-alma-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-3xl shadow-2xl backdrop-blur-sm">
        
        <div className="flex justify-center mb-8">
          <div className="bg-alma-rose p-4 rounded-full shadow-[0_0_30px_#a17487]">
            <User className="w-10 h-10 text-white" />
          </div>
        </div>

        <h1 className="text-white text-3xl font-bold text-center mb-2">Totem Pacient</h1>
        <p className="text-alma-gray text-center mb-8">Introdu codul de conectare</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <input 
              type="text" 
              maxLength="4"
              placeholder="0000"
              className="w-full bg-black/30 text-white text-center text-5xl tracking-[1.5rem] py-6 rounded-2xl border-2 border-alma-purple/30 focus:border-alma-rose outline-none font-mono transition-all focus:shadow-[0_0_20px_#a17487] placeholder-white/10"
              value={code}
              onChange={e => setCode(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-3 rounded-xl text-center text-sm font-medium animate-pulse">
              {error}
            </div>
          )}

          <button 
            disabled={loading || code.length < 4}
            className="w-full bg-alma-rose text-white py-4 rounded-xl text-xl font-bold hover:bg-alma-light transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>START <ArrowRight className="w-6 h-6" /></>}
          </button>
        </form>

        <div className="mt-8 text-center">
            <button onClick={() => navigate('/')} className="text-alma-gray hover:text-white text-sm transition">
                ← Înapoi la meniul principal
            </button>
        </div>
      </div>
    </div>
  );
}