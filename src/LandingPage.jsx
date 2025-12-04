import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, User } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        
        {/* CARD FAMILIE */}
        <div 
          onClick={() => navigate('/familie')}
          className="bg-white rounded-3xl p-10 cursor-pointer hover:scale-105 transition duration-300 flex flex-col items-center justify-center gap-6 shadow-2xl"
        >
          <div className="bg-indigo-100 p-6 rounded-full">
            <Users className="w-16 h-16 text-indigo-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Familie</h2>
          <p className="text-gray-500 text-center">Încarcă amintiri și gestionează profilul pacientului.</p>
        </div>

        {/* CARD TOTEM (PACIENT) */}
        <div 
          onClick={() => navigate('/totem')}
          className="bg-indigo-600 rounded-3xl p-10 cursor-pointer hover:scale-105 transition duration-300 flex flex-col items-center justify-center gap-6 shadow-2xl"
        >
          <div className="bg-white/20 p-6 rounded-full">
            <User className="w-16 h-16 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">Totem Pacient</h2>
          <p className="text-indigo-200 text-center">Interfața simplificată pentru tabletă.</p>
        </div>

      </div>
    </div>
  );
}