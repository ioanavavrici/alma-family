import React, { useState, useEffect, useRef } from 'react';
import { Mic, Image as ImageIcon, WifiOff, Wifi, Loader2, StopCircle } from 'lucide-react';

export default function TotemInterface() {
  // --- STĂRI UI ---
  const [status, setStatus] = useState("Conectare...");
  const [currentImage, setCurrentImage] = useState(null);
  const [imageTitle, setImageTitle] = useState("");
  const [isTalking, setIsTalking] = useState(false); 
  const [aiSpeaking, setAiSpeaking] = useState(false); 
  const [isThinking, setIsThinking] = useState(false); 

  // --- REFERINȚE ---
  const ws = useRef(null);
  const audioContext = useRef(null);
  const processor = useRef(null);
  const inputStream = useRef(null);
  
  // Recunoaștere Vocală pentru "Cuvânt de Siguranță"
  const speechRecognition = useRef(null);

  const audioQueue = useRef([]); 
  const isPlayingRef = useRef(false);
  const currentSourceNode = useRef(null);

  const pacientId = localStorage.getItem('totem_pacient_id');
  const pacientNume = localStorage.getItem('totem_pacient_nume');

  // ==========================================
  // 1. INITIALIZARE
  // ==========================================
  useEffect(() => {
    if (!pacientId) {
      window.location.href = '/totem';
      return;
    }

    // Inițializăm Recunoașterea Vocală (pentru comanda STOP)
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      speechRecognition.current = new SpeechRecognition();
      speechRecognition.current.continuous = true;
      speechRecognition.current.interimResults = true;
      speechRecognition.current.lang = 'ro-RO'; // Ascultăm în Română

      speechRecognition.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('')
          .toLowerCase();

        console.log("👂 Comandă auzită:", transcript);

        // --- LISTA DE CUVINTE DE SIGURANȚĂ ---
        const safeWords = ['stop', 'gata', 'oprește', 'opreste', 'termină', 'destul', 'alma', 'nu'];
        
        if (safeWords.some(word => transcript.includes(word))) {
           console.log("🛑 CUVÂNT DE SIGURANȚĂ DETECTAT!");
           stopAiSpeaking();
        }
      };
    }

    connectWebSocket();

    return () => {
      stopRecording();
      if (speechRecognition.current) speechRecognition.current.stop();
      if (ws.current) ws.current.close();
      if (audioContext.current) audioContext.current.close();
    };
  }, []);

  // ==========================================
  // 2. WEBSOCKET
  // ==========================================
  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = "25husv-production.up.railway.app"; 
    
    ws.current = new WebSocket(`${protocol}//${host}/totem/ws/${pacientId}`);

    ws.current.onopen = () => {
      console.log("✅ WebSocket Conectat!");
      setStatus("Conectat");
      startRawRecording(); // Pornim microfonul normal
    };

    ws.current.onmessage = async (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'audio_response') {
        audioQueue.current.push(msg.data);

        if (!isPlayingRef.current) {
          isPlayingRef.current = true;
          setIsThinking(true);
          
          // Oprim microfonul normal și pornim ascultarea de comenzi
          stopRecording(); 
          startCommandListener();

          setTimeout(() => {
            if (isPlayingRef.current) {
                setIsThinking(false);
                setAiSpeaking(true);
                processQueue();
            }
          }, 1500); 
        }
      }

      if (msg.type === 'show_image') {
        setCurrentImage(msg.url);
        setImageTitle(msg.titlu || "Amintire");
      }
    };

    ws.current.onclose = () => {
      setStatus("Deconectat");
      stopRecording();
    };
  };

  // ==========================================
  // 3. LOGICA STOP & PLAY
  // ==========================================

  const stopAiSpeaking = () => {
    // 1. Oprim sunetul
    if (currentSourceNode.current) {
        try { currentSourceNode.current.stop(); } catch(e){}
    }
    audioQueue.current = [];
    isPlayingRef.current = false;
    setAiSpeaking(false);
    setIsThinking(false);

    // 2. Oprim ascultarea de comenzi și revenim la microfonul normal
    stopCommandListener();
    startRawRecording();
  };

  const startCommandListener = () => {
    try {
        if (speechRecognition.current) speechRecognition.current.start();
        console.log("👂 Ascult comanda STOP...");
    } catch (e) {
        // Ignorăm eroare dacă e deja pornit
    }
  };

  const stopCommandListener = () => {
    try {
        if (speechRecognition.current) speechRecognition.current.stop();
    } catch (e) {}
  };

  const processQueue = async () => {
    if (audioQueue.current.length === 0) {
      // S-a terminat coada normal -> Revenim la microfon
      stopAiSpeaking();
      return;
    }
    if (!isPlayingRef.current) return;

    const nextChunk = audioQueue.current.shift();
    await playAudioChunk(nextChunk);
  };

  const playAudioChunk = (base64String) => {
    return new Promise((resolve) => {
      try {
        if (!audioContext.current) audioContext.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });

        const binaryString = window.atob(base64String);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
        
        const float32Array = new Float32Array(bytes.length / 2);
        const dataView = new DataView(bytes.buffer);
        for (let i = 0; i < bytes.length / 2; i++) {
          float32Array[i] = dataView.getInt16(i * 2, true) / 32768.0;
        }

        const audioBuffer = audioContext.current.createBuffer(1, float32Array.length, 24000);
        audioBuffer.getChannelData(0).set(float32Array);

        const source = audioContext.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.current.destination);
        currentSourceNode.current = source;

        source.onended = () => {
          processQueue();
          resolve();
        };

        source.start();
      } catch (e) {
        resolve();
      }
    });
  };

  // ==========================================
  // 4. MICROFON NORMAL (RAW AUDIO)
  // ==========================================
  const startRawRecording = async () => {
    try {
      if (inputStream.current && inputStream.current.active) return; // Deja merge

      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: 16000 } });
      inputStream.current = stream;
      
      if (!audioContext.current) audioContext.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      
      const source = audioContext.current.createMediaStreamSource(stream);
      processor.current = audioContext.current.createScriptProcessor(4096, 1, 1);

      processor.current.onaudioprocess = (e) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN && !isPlayingRef.current) {
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Vizualizare
          let sum = 0;
          for(let i=0; i<inputData.length; i++) sum += Math.abs(inputData[i]);
          if (sum / inputData.length > 0.01) {
             setIsTalking(true);
             setTimeout(() => setIsTalking(false), 200);
          }

          // Conversie și trimitere
          const buffer = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            let s = Math.max(-1, Math.min(1, inputData[i]));
            buffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          
          let binary = '';
          const bytes = new Uint8Array(buffer.buffer);
          for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
          
          ws.current.send(JSON.stringify({ type: 'audio', data: window.btoa(binary) }));
        }
      };

      source.connect(processor.current);
      processor.current.connect(audioContext.current.destination);
      console.log("🎙️ Microfon Normal Pornit");

    } catch (err) {
      console.error("Eroare microfon:", err);
    }
  };

  const stopRecording = () => {
    if (inputStream.current) inputStream.current.getTracks().forEach(track => track.stop());
    if (processor.current) processor.current.disconnect();
  };

  // ==========================================
  // 5. INTERFAȚĂ
  // ==========================================
  return (
    <div className="min-h-screen bg-alma-dark text-white flex flex-col relative overflow-hidden transition-colors duration-500">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full border border-alma-purple/30 backdrop-blur-sm">
        {status === "Conectat" ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-alma-rose" />}
        <span className="text-xs font-mono text-alma-gray">{status}</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {currentImage ? (
          <div className="animate-fadeIn w-full max-w-4xl flex flex-col items-center">
            <img src={currentImage} className="rounded-3xl shadow-[0_0_80px_rgba(161,116,135,0.3)] max-h-[60vh] object-contain border-4 border-alma-purple/50" />
            <h2 className="mt-8 text-3xl font-bold text-center text-white drop-shadow-lg bg-alma-dark/80 px-8 py-3 rounded-full border border-alma-purple/30">{imageTitle}</h2>
          </div>
        ) : (
          <div className="flex flex-col items-center animate-pulse-slow">
             <div className={`w-64 h-64 rounded-full flex items-center justify-center transition-all duration-500 ${aiSpeaking ? "bg-alma-rose shadow-[0_0_120px_#a17487] scale-110" : (isThinking ? "bg-alma-purple shadow-[0_0_60px_#745f82] scale-95" : "bg-alma-dark border-4 border-alma-gray shadow-none")}`}>
                {aiSpeaking ? (
                  <div className="flex flex-col items-center">
                    <StopCircle className="w-20 h-20 text-white animate-pulse" />
                    <span className="text-xs font-bold mt-2 uppercase">Zi "STOP"</span>
                  </div>
                ) : isThinking ? (
                   <Loader2 className="w-24 h-24 text-white/80 animate-spin" />
                ) : (
                  <Mic className={`w-28 h-28 transition-all duration-200 ${isTalking ? "text-alma-rose scale-125" : "text-alma-gray"}`} />
                )}
             </div>
             <h1 className="mt-16 text-4xl font-bold text-center tracking-wide text-white/90">
               {aiSpeaking ? "ALMA povestește..." : (isThinking ? "Mă gândesc..." : (isTalking ? "Te ascult..." : `Salut, ${pacientNume}!`))}
             </h1>
          </div>
        )}
      </div>
      
      {currentImage && (
          <div className="absolute bottom-8 right-8 bg-alma-purple/50 p-4 rounded-full hover:bg-alma-rose cursor-pointer transition backdrop-blur-md border border-white/20 shadow-lg" onClick={() => setCurrentImage(null)}>
            <ImageIcon className="w-6 h-6 text-white" />
          </div>
      )}
      
      {/* BUTON DE SIGURANȚĂ FIZIC (PENTRU ORICE EVENTUALITATE) */}
      {aiSpeaking && (
        <button 
            onClick={stopAiSpeaking}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-full font-bold text-xl shadow-[0_0_30px_rgba(239,68,68,0.5)] flex items-center gap-2 animate-bounce"
        >
            <StopCircle className="w-6 h-6" /> STOP
        </button>
      )}
    </div>
  );
}