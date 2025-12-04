import React, { useState, useEffect, useRef } from 'react';
import { Mic, Image as ImageIcon, WifiOff, Wifi, Loader2 } from 'lucide-react';

export default function TotemInterface() {
  const [status, setStatus] = useState("Conectare...");
  const [currentImage, setCurrentImage] = useState(null);
  const [imageTitle, setImageTitle] = useState("");
  const [isTalking, setIsTalking] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const ws = useRef(null);
  const audioContext = useRef(null);
  const processor = useRef(null);
  const inputStream = useRef(null);
  const audioQueue = useRef([]); 
  const isPlayingRef = useRef(false);

  const pacientId = localStorage.getItem('totem_pacient_id');
  const pacientNume = localStorage.getItem('totem_pacient_nume');

  // --- INITIALIZARE (La fel ca înainte) ---
  useEffect(() => {
    if (!pacientId) { window.location.href = '/totem'; return; }
    connectWebSocket();
    return () => { stopRecording(); if (ws.current) ws.current.close(); if (audioContext.current) audioContext.current.close(); };
  }, []);

  // --- WEBSOCKET & AUDIO (Logica rămâne la fel, doar UI-ul se schimbă) ---
  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = "25husv-production.up.railway.app"; 
    ws.current = new WebSocket(`${protocol}//${host}/totem/ws/${pacientId}`);

    ws.current.onopen = () => { setStatus("Conectat"); startRecording(); };
    ws.current.onmessage = async (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'audio_response') {
        audioQueue.current.push(msg.data);
        if (!isPlayingRef.current) {
          isPlayingRef.current = true;
          setIsThinking(true);
          setTimeout(() => { setIsThinking(false); setAiSpeaking(true); processQueue(); }, 2000); 
        }
      }
      if (msg.type === 'show_image') { setCurrentImage(msg.url); setImageTitle(msg.titlu || "Amintire"); }
    };
    ws.current.onclose = () => { setStatus("Deconectat"); stopRecording(); };
  };

  const processQueue = async () => {
    if (audioQueue.current.length === 0) { isPlayingRef.current = false; setAiSpeaking(false); return; }
    const nextChunk = audioQueue.current.shift();
    await playAudioChunk(nextChunk);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true } });
      inputStream.current = stream;
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      const source = audioContext.current.createMediaStreamSource(stream);
      processor.current = audioContext.current.createScriptProcessor(4096, 1, 1);
      processor.current.onaudioprocess = (e) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          if (isPlayingRef.current || isThinking) return;
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmData = convertFloat32ToInt16(inputData);
          const base64Data = arrayBufferToBase64(pcmData);
          let sum = 0; for(let i=0; i<inputData.length; i++) sum += Math.abs(inputData[i]);
          if (sum / inputData.length > 0.01) { setIsTalking(true); setTimeout(() => setIsTalking(false), 200); }
          ws.current.send(JSON.stringify({ type: 'audio', data: base64Data }));
        }
      };
      source.connect(processor.current);
      processor.current.connect(audioContext.current.destination);
    } catch (err) { alert("Microfon blocat!"); }
  };
  const stopRecording = () => { if (inputStream.current) inputStream.current.getTracks().forEach(track => track.stop()); if (processor.current) processor.current.disconnect(); if (audioContext.current) audioContext.current.close(); };
  const convertFloat32ToInt16 = (float32Array) => { const l = float32Array.length; const buffer = new Int16Array(l); for (let i = 0; i < l; i++) { let s = Math.max(-1, Math.min(1, float32Array[i])); buffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF; } return buffer.buffer; };
  const arrayBufferToBase64 = (buffer) => { let binary = ''; const bytes = new Uint8Array(buffer); const len = bytes.byteLength; for (let i = 0; i < len; i++) { binary += String.fromCharCode(bytes[i]); } return window.btoa(binary); };
  const playAudioChunk = (base64String) => { return new Promise((resolve) => { try { if (!audioContext.current) { resolve(); return; } const binaryString = window.atob(base64String); const len = binaryString.length; const bytes = new Uint8Array(len); for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i); const float32Array = new Float32Array(bytes.length / 2); const dataView = new DataView(bytes.buffer); for (let i = 0; i < bytes.length / 2; i++) { float32Array[i] = dataView.getInt16(i * 2, true) / 32768.0; } const audioBuffer = audioContext.current.createBuffer(1, float32Array.length, 24000); audioBuffer.getChannelData(0).set(float32Array); const source = audioContext.current.createBufferSource(); source.buffer = audioBuffer; source.connect(audioContext.current.destination); source.onended = () => { processQueue(); resolve(); }; source.start(); } catch (e) { resolve(); } }); };

  // --- UI ACTUALIZAT CU CULORILE TALE ---
  return (
    <div className="min-h-screen bg-alma-dark text-white flex flex-col relative overflow-hidden transition-colors duration-500">
      
      {/* STATUS BAR */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full border border-alma-purple/30 backdrop-blur-sm">
        {status === "Conectat" ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-alma-rose" />}
        <span className="text-xs font-mono text-alma-gray">{status}</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {currentImage ? (
          <div className="animate-fadeIn w-full max-w-4xl flex flex-col items-center">
            <img 
              src={currentImage} 
              className="rounded-3xl shadow-[0_0_80px_rgba(161,116,135,0.3)] max-h-[70vh] object-contain border-4 border-alma-purple/50"
              alt="Memory"
            />
            <h2 className="mt-8 text-3xl font-bold text-center text-white drop-shadow-lg bg-alma-dark/80 px-8 py-3 rounded-full border border-alma-purple/30">
                {imageTitle}
            </h2>
          </div>
        ) : (
          <div className="flex flex-col items-center animate-pulse-slow">
             {/* CERCUL PRINCIPAL ANIMAT */}
             <div className={`w-64 h-64 rounded-full flex items-center justify-center transition-all duration-700 
                ${aiSpeaking 
                    ? "bg-alma-rose shadow-[0_0_120px_#a17487]" 
                    : (isThinking 
                        ? "bg-alma-purple shadow-[0_0_60px_#745f82] scale-90" 
                        : "bg-alma-dark border-4 border-alma-gray shadow-none")
                }`}>
                
                {aiSpeaking ? (
                  // ANIMATIE VORBIRE (WAVE)
                  <div className="flex gap-2 items-center h-20">
                    <div className="w-3 bg-white animate-[bounce_1s_infinite] h-full rounded-full"></div>
                    <div className="w-3 bg-white animate-[bounce_1s_infinite_0.2s] h-3/4 rounded-full"></div>
                    <div className="w-3 bg-white animate-[bounce_1s_infinite_0.4s] h-full rounded-full"></div>
                    <div className="w-3 bg-white animate-[bounce_1s_infinite_0.2s] h-3/4 rounded-full"></div>
                    <div className="w-3 bg-white animate-[bounce_1s_infinite] h-full rounded-full"></div>
                  </div>
                ) : isThinking ? (
                   // ANIMATIE GANDIRE
                   <Loader2 className="w-24 h-24 text-white/80 animate-spin" />
                ) : (
                  // STARE REPAUS (Microfon)
                  <Mic className={`w-28 h-28 transition-all duration-300 ${isTalking ? "text-alma-rose scale-110" : "text-alma-gray"}`} />
                )}
             </div>

             <h1 className="mt-16 text-4xl font-bold text-center tracking-wide text-white/90">
               {aiSpeaking ? "ALMA povestește..." : (isThinking ? "Mă gândesc..." : (isTalking ? "Te ascult..." : `Salut, ${pacientNume}!`))}
             </h1>
          </div>
        )}
      </div>
      
      {currentImage && (
          <div 
            className="absolute bottom-8 right-8 bg-alma-purple/50 p-4 rounded-full hover:bg-alma-rose cursor-pointer transition backdrop-blur-md border border-white/20 shadow-lg" 
            onClick={() => setCurrentImage(null)}
          >
            <ImageIcon className="w-6 h-6 text-white" />
          </div>
      )}
    </div>
  );
}