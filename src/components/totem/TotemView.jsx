import React from 'react';
import { Mic, Image as ImageIcon, WifiOff, Wifi, Loader2, Play, Square, Power, X, Volume2 } from 'lucide-react';

export default function TotemView({ 
  status,
  isSessionActive,
  toggleSession, 
  currentImage, 
  imageTitle, 
  isTalking, 
  micVolume, 
  aiSpeaking, 
  isThinking, 
  pacientNume, 
  clearImage 
}) {
  
  // Helper pentru textul de stare
  const getStatusText = () => {
    if (aiSpeaking) return "Alma povestește...";
    if (isThinking) return "Mă gândesc...";
    if (micVolume > 5) return "Te aud!";
    return "Te ascult...";
  };

  return (
    <div className="min-h-screen bg-alma-dark text-white flex flex-col relative overflow-hidden transition-colors duration-500">
      
      {/* --- HEADER: STATUS CONEXIUNE --- */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <div className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full border border-alma-purple/30 backdrop-blur-sm">
            {isSessionActive ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-alma-rose" />}
            <span className="text-xs font-mono text-alma-gray uppercase">{status}</span>
        </div>
      </div>

      {/* --- CENTRU: CONȚINUT PRINCIPAL --- */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 pb-24"> 
        {/* pb-24 asigură că nimic nu intră sub butonul de jos */}

        {!isSessionActive ? (
            // ================= STAREA 1: STANDBY =================
            <div className="flex flex-col items-center animate-pulse-slow opacity-50">
                <div className="w-48 h-48 rounded-full bg-alma-dark border-4 border-alma-gray/30 flex items-center justify-center mb-8 shadow-inner">
                    <Power className="w-20 h-20 text-alma-gray" />
                </div>
                <h1 className="text-2xl font-bold text-alma-gray">Standby</h1>
                <p className="text-white/50 mt-2 text-sm">Apasă START pentru a începe</p>
            </div>
        ) : currentImage ? (
          // ================= STAREA 2: IMAGINE ACTIVĂ =================
          <div className="relative animate-fadeIn w-full max-w-4xl flex flex-col items-center bg-black/20 p-4 rounded-3xl border border-white/10 backdrop-blur-md">
            
            {/* 1. Buton ÎNCHIDE IMAGINE (Mutat sus dreapta) */}
            <button 
                onClick={clearImage}
                className="absolute -top-4 -right-4 bg-alma-rose hover:bg-red-500 text-white p-3 rounded-full shadow-lg border-2 border-alma-dark z-50 transition-transform hover:scale-110"
            >
                <X className="w-6 h-6" />
            </button>

            {/* 2. Imaginea */}
            <img 
              src={currentImage} 
              alt="Amintire" 
              className="rounded-2xl shadow-2xl max-h-[50vh] object-contain border border-white/10" 
            />

            {/* 3. Titlu */}
            <h2 className="mt-4 text-xl font-bold text-center text-white px-4">
              {imageTitle}
            </h2>

            {/* 4. MINI INDICATOR DE STATUS (Ca să știi ce face AI-ul) */}
            <div className="mt-4 w-full bg-black/30 rounded-xl p-3 flex items-center gap-4 border border-white/5">
                {/* Icoana Stării */}
                <div className={`p-2 rounded-full ${aiSpeaking ? 'bg-alma-rose animate-pulse' : isThinking ? 'bg-alma-purple animate-spin' : 'bg-emerald-500/20'}`}>
                    {aiSpeaking ? <Volume2 className="w-5 h-5 text-white" /> : 
                     isThinking ? <Loader2 className="w-5 h-5 text-white" /> : 
                     <Mic className={`w-5 h-5 ${micVolume > 5 ? 'text-emerald-400' : 'text-gray-400'}`} />}
                </div>

                {/* Textul Stării */}
                <div className="flex-1">
                    <p className="text-sm font-bold text-white/90">{getStatusText()}</p>
                    
                    {/* Bara de volum mică */}
                    {!aiSpeaking && !isThinking && (
                        <div className="w-full h-1.5 bg-gray-700 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-emerald-400 transition-all duration-75" style={{ width: `${micVolume}%` }}></div>
                        </div>
                    )}
                </div>
            </div>

          </div>
        ) : (
          // ================= STAREA 3: AVATAR STANDARD =================
          <div className="flex flex-col items-center">
             <div className={`w-64 h-64 rounded-full flex items-center justify-center transition-all duration-100 
                ${aiSpeaking 
                  ? "bg-alma-rose shadow-[0_0_120px_#a17487] scale-110" 
                  : (isThinking 
                      ? "bg-alma-purple shadow-[0_0_60px_#745f82] scale-95" 
                      : `bg-alma-dark border-4 ${micVolume > 5 ? "border-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.4)]" : "border-emerald-500/30"}`)
                }`}
                style={{ transform: !aiSpeaking && !isThinking ? `scale(${1 + micVolume/200})` : undefined }}
             >
                {aiSpeaking ? (
                   <div className="flex gap-1 h-8 items-end mb-2">
                       <div className="w-1 bg-white animate-bounce h-4"></div>
                       <div className="w-1 bg-white animate-bounce h-8"></div>
                       <div className="w-1 bg-white animate-bounce h-6"></div>
                   </div>
                ) : isThinking ? (
                   <Loader2 className="w-24 h-24 text-white/80 animate-spin" />
                ) : (
                   <Mic className={`w-28 h-28 transition-all duration-100 ${micVolume > 5 ? "text-emerald-400" : "text-emerald-500/50"}`} />
                )}
             </div>
             
             <h1 className="mt-12 text-3xl md:text-4xl font-bold text-center tracking-wide text-white/90 drop-shadow-md">
               {getStatusText()}
             </h1>

             {/* Bară volum mare */}
             {!aiSpeaking && !isThinking && (
                 <div className="mt-6 w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 transition-all duration-75 ease-out" style={{ width: `${micVolume}%` }}></div>
                 </div>
             )}
          </div>
        )}
      </div>

      {/* --- FOOTER: BUTON START/STOP --- */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center z-50 px-4">
        <button
            onClick={toggleSession}
            className={`
                flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg shadow-2xl transition-all border-2 w-full max-w-sm justify-center
                ${isSessionActive 
                    ? "bg-red-500/90 hover:bg-red-600 text-white border-red-400" 
                    : "bg-emerald-500/90 hover:bg-emerald-600 text-white border-emerald-400 animate-pulse"
                }
            `}
        >
            {isSessionActive ? <><Square className="w-6 h-6 fill-current"/> STOP SESIUNE</> : <><Play className="w-6 h-6 fill-current"/> START SESIUNE</>}
        </button>
      </div>
    </div>
  );
}