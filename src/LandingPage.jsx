import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, User, Heart } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-alma-dark flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Element decorativ fundal */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-alma-purple/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="z-10 max-w-4xl w-full text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-alma-rose/10 rounded-full mb-6">
            <Heart className="w-8 h-8 text-alma-rose" fill="currentColor" />
        </div>
        <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">ALMA</h1>
        <p className="text-alma-gray text-xl">Companion Empatic pentru Păstrarea Amintirilor</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl z-10">
        
        {/* CARD FAMILIE */}
        <div 
          onClick={() => navigate('/familie')}
          className="group bg-white hover:bg-alma-light transition-all duration-500 rounded-3xl p-10 cursor-pointer shadow-2xl flex flex-col items-center justify-center gap-6 border-4 border-transparent hover:border-white/30 hover:-translate-y-2"
        >
          <div className="bg-alma-dark/5 p-6 rounded-full group-hover:bg-white/20 transition-colors">
            <Users className="w-16 h-16 text-alma-purple group-hover:text-white" />
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-alma-dark group-hover:text-white mb-2">Familie</h2>
            <p className="text-alma-gray group-hover:text-white/90 font-medium">Configurează profilul și încarcă amintiri.</p>
          </div>
        </div>

        {/* CARD TOTEM */}
        <div 
          onClick={() => navigate('/totem')}
          className="group bg-alma-purple hover:bg-alma-rose transition-all duration-500 rounded-3xl p-10 cursor-pointer shadow-2xl flex flex-col items-center justify-center gap-6 border-4 border-white/10 hover:border-white/30 hover:-translate-y-2"
        >
          <div className="bg-black/20 p-6 rounded-full group-hover:bg-white/20 transition-colors">
            <User className="w-16 h-16 text-white" />
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-2">Totem Pacient</h2>
            <p className="text-white/70 group-hover:text-white/90 font-medium">Interfața vocală pentru tabletă.</p>
          </div>
        </div>

      </div>
    </div>
  );
}