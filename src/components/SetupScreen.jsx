import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function SetupScreen({ onComplete }) {
  const [nume, setNume] = useState('');
  const [detalii, setDetalii] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('nume', nume);
      formData.append('detalii_boala', detalii);
      const res = await api.post('/familie/creeaza-profil', formData);
      onComplete(res.data); 
    } catch (err) {
      alert("Eroare: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
      localStorage.removeItem('access_token');
      // Fortam reload pentru a ajunge inapoi la login in App.jsx
      window.location.reload(); 
  };

  return (
    <div className="min-h-screen bg-alma-dark flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border-t-8 border-alma-rose">
        <div className="flex justify-center mb-6">
            <div className="bg-alma-rose/10 p-4 rounded-full">
              <Heart className="w-10 h-10 text-alma-rose" fill="currentColor" />
            </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-alma-dark mb-2">Adaugă Profil Pacient</h1>
        <p className="text-center text-alma-gray mb-8">Spune-ne pe cine vom îngriji astăzi.</p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-alma-gray uppercase mb-1">Nume Pacient</label>
            <input required type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-alma-rose focus:ring-2 focus:ring-alma-rose/20 outline-none transition" placeholder="ex: Bunica Elena" value={nume} onChange={(e) => setNume(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold text-alma-gray uppercase mb-1">Detalii Medicale & Biografie</label>
            <textarea required className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-alma-rose focus:ring-2 focus:ring-alma-rose/20 outline-none transition" placeholder="Context pentru AI (ex: Are Alzheimer stadiu incipient. A fost profesoară...)" rows="4" value={detalii} onChange={(e) => setDetalii(e.target.value)} />
          </div>
          <button disabled={loading} type="submit" className="w-full bg-alma-dark text-white py-4 rounded-xl font-bold hover:bg-alma-purple transition shadow-lg">
            {loading ? "Se creează..." : "Generează Profil"}
          </button>
        </form>
        
        <div className="mt-6 text-center">
            <button onClick={handleLogout} className="text-sm text-alma-gray hover:text-red-500">
                Anulează și Ieși
            </button>
        </div>
      </div>
    </div>
  );
}