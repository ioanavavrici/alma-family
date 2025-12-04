import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import api from '../api';

export default function SetupScreen({ onComplete }) {
  const [nume, setNume] = useState('');
  const [detalii, setDetalii] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Backend-ul cere Form Data la /creeaza-profil
      const formData = new FormData();
      formData.append('nume', nume);
      formData.append('detalii_boala', detalii);

      const res = await api.post('/familie/creeaza-profil', formData);
      
      // Primim {id, nume, pairing_code}
      onComplete(res.data); 
      
    } catch (err) {
      alert("Eroare: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-indigo-500">
        <div className="flex justify-center mb-6">
            <div className="bg-indigo-100 p-3 rounded-full">
              <Heart className="w-8 h-8 text-indigo-600" />
            </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Adaugă un Pacient</h1>
        <p className="text-center text-gray-500 mb-8">Pentru a începe, spune-ne pe cine îngrijim.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nume Pacient</label>
            <input required type="text" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="ex: Bunica Elena" value={nume} onChange={(e) => setNume(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Detalii Medicale</label>
            <textarea required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Context pentru AI (ex: Alzheimer, îi plac pisicile...)" rows="3" value={detalii} onChange={(e) => setDetalii(e.target.value)} />
          </div>
          <button disabled={loading} type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition">
            {loading ? "Se creează..." : "Generează Profil"}
          </button>
        </form>
      </div>
    </div>
  );
}