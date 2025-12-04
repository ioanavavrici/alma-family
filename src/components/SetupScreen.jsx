import React, { useState } from 'react';
import { Heart } from 'lucide-react';

export default function SetupScreen({ onComplete }) {
  const [nume, setNume] = useState('');
  const [detalii, setDetalii] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete(nume, detalii);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-indigo-500">
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-100 p-3 rounded-full">
            <Heart className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Bun venit la ALMA</h1>
        <p className="text-center text-gray-500 mb-8">Creează un profil nou pentru pacient.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nume Pacient</label>
            <input 
              required
              type="text" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="ex: Bunica Elena"
              value={nume}
              onChange={(e) => setNume(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Detalii Medicale</label>
            <textarea 
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Detalii pentru asistentul AI..."
              rows="3"
              value={detalii}
              onChange={(e) => setDetalii(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition">
            Generează Profil
          </button>
        </form>
      </div>
    </div>
  );
}