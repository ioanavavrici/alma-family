import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Image as ImageIcon, WifiOff, Wifi, Loader2 } from 'lucide-react';

export default function TotemInterface() {
  const [status, setStatus] = useState("Conectare...");
  const [currentImage, setCurrentImage] = useState(null);
  const [imageTitle, setImageTitle] = useState("");
  const [isTalking, setIsTalking] = useState(false); // Când vorbește pacientul
  const [aiSpeaking, setAiSpeaking] = useState(false); // Când vorbește AI-ul
  const [isThinking, setIsThinking] = useState(false); // <--- NOUTATE: Stare de "Gândire" (Delay)

  const ws = useRef(null);
  const audioContext = useRef(null);
  const processor = useRef(null);
  const inputStream = useRef(null);
  
  // --- NOUTATE: COADA DE AUDIO PENTRU DELAY ---
  const audioQueue = useRef([]); 
  const isPlayingRef = useRef(false);

  const pacientId = localStorage.getItem('totem_pacient_id');
  const pacientNume = localStorage.getItem('totem_pacient_nume');

  // --- 1. INITIALIZARE ---
  useEffect(() => {
    if (!pacientId) {
      window.location.href = '/totem';
      return;
    }
    connectWebSocket();

    return () => {
      stopRecording();
      if (ws.current) ws.current.close();
      if (audioContext.current) audioContext.current.close();
    };
  }, []);

  // --- 2. WEBSOCKET ---
  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = "25husv-production.up.railway.app"; 
    
    ws.current = new WebSocket(`${protocol}//${host}/totem/ws/${pacientId}`);

    ws.current.onopen = () => {
      console.log("✅ WebSocket Conectat!");
      setStatus("Conectat");
      startRecording();
    };

    ws.current.onmessage = async (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === 'audio_response') {
        // 1. Adăugăm bucata de sunet în coadă
        audioQueue.current.push(msg.data);

        // 2. Dacă nu redăm deja ceva, declanșăm procesul cu DELAY
        if (!isPlayingRef.current) {
          isPlayingRef.current = true;
          setIsThinking(true); // Arătăm vizual că se gândește

          // --- AICI ESTE DELAY-UL (2000ms = 2 secunde) ---
          console.log("⏳ Aștept 2 secunde înainte de a răspunde...");
          setTimeout(() => {
            setIsThinking(false);
            setAiSpeaking(true);
            processQueue(); // Începem redarea după pauză
          }, 2000); 
        }
      }

      if (msg.type === 'show_image') {
        setCurrentImage(msg.url);
        setImageTitle(msg.titlu || "Amintire");
      }
    };

    ws.current.onerror = (err) => {
      console.error("❌ Eroare WebSocket:", err);
      setStatus("Eroare Conexiune");
    };

    ws.current.onclose = () => {
      setStatus("Deconectat");
      stopRecording();
    };
  };

  // --- NOUTATE: PROCESARE COADĂ AUDIO ---
  const processQueue = async () => {
    // Dacă nu mai avem nimic în coadă, ne oprim
    if (audioQueue.current.length === 0) {
      isPlayingRef.current = false;
      setAiSpeaking(false);
      return;
    }

    // Luăm prima bucată și o redăm
    const nextChunk = audioQueue.current.shift();
    await playAudioChunk(nextChunk);
  };

  // --- 3. MICROFON ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true } 
      });
      inputStream.current = stream;
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      const source = audioContext.current.createMediaStreamSource(stream);
      processor.current = audioContext.current.createScriptProcessor(4096, 1, 1);

      processor.current.onaudioprocess = (e) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          // Dacă AI-ul vorbește sau se gândește, NU mai trimitem audio (evităm ecoul)
          if (isPlayingRef.current || isThinking) return;

          const inputData = e.inputBuffer.getChannelData(0);
          const pcmData = convertFloat32ToInt16(inputData);
          const base64Data = arrayBufferToBase64(pcmData);
          
          let sum = 0;
          for(let i=0; i<inputData.length; i++) sum += Math.abs(inputData[i]);
          if (sum / inputData.length > 0.01) {
             setIsTalking(true);
             setTimeout(() => setIsTalking(false), 200);
          }
          ws.current.send(JSON.stringify({ type: 'audio', data: base64Data }));
        }
      };

      source.connect(processor.current);
      processor.current.connect(audioContext.current.destination);

    } catch (err) {
      console.error("❌ Eroare microfon:", err);
      alert("Te rog permite accesul la microfon!");
    }
  };

  const stopRecording = () => {
    if (inputStream.current) inputStream.current.getTracks().forEach(track => track.stop());
    if (processor.current) processor.current.disconnect();
    if (audioContext.current) audioContext.current.close();
  };

  const convertFloat32ToInt16 = (float32Array) => {
    const l = float32Array.length;
    const buffer = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      buffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return buffer.buffer;
  };

  const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  // --- 4. REDARE AUDIO (Actualizat pentru coadă) ---
  const playAudioChunk = (base64String) => {
    return new Promise((resolve) => {
      try {
        if (!audioContext.current) { resolve(); return; }

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
        
        // Când se termină această bucată, trecem la următoarea
        source.onended = () => {
          processQueue(); // <--- RECURSIVITATE
          resolve();
        };

        source.start();
      } catch (e) {
        console.error("Eroare redare:", e);
        resolve();
      }
    });
  };

  // --- 5. UI ---
  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      
      {/* STATUS BAR */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/50 px-4 py-2 rounded-full border border-white/10">
        {status === "Conectat" ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
        <span className="text-xs font-mono text-gray-300">{status}</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {currentImage ? (
          <div className="animate-fadeIn w-full max-w-4xl flex flex-col items-center">
            <img 
              src={currentImage} 
              className="rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.2)] max-h-[70vh] object-contain border-4 border-white/10"
              alt="Memory"
            />
            <h2 className="mt-8 text-3xl font-bold text-center text-white/90 drop-shadow-lg bg-black/30 px-6 py-2 rounded-full backdrop-blur-sm">
                {imageTitle}
            </h2>
          </div>
        ) : (
          <div className="flex flex-col items-center animate-pulse">
             <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300 ${aiSpeaking ? "bg-indigo-500 shadow-[0_0_100px_#6366f1]" : (isThinking ? "bg-amber-500/20" : "bg-gray-800")}`}>
                {aiSpeaking ? (
                  <div className="space-x-2 flex items-center h-20">
                    <div className="w-3 bg-white animate-[bounce_1s_infinite] h-full"></div>
                    <div className="w-3 bg-white animate-[bounce_1s_infinite_0.2s] h-3/4"></div>
                    <div className="w-3 bg-white animate-[bounce_1s_infinite_0.4s] h-full"></div>
                  </div>
                ) : isThinking ? (
                   // ANIMATIE DE GANDIRE (DELAY)
                   <Loader2 className="w-24 h-24 text-amber-400 animate-spin" />
                ) : (
                  <Mic className={`w-24 h-24 transition-colors duration-200 ${isTalking ? "text-green-400 scale-110" : "text-gray-500"}`} />
                )}
             </div>
             <h1 className="mt-12 text-4xl font-bold text-center tracking-wide">
               {aiSpeaking ? "ALMA vorbește..." : (isThinking ? "Mă gândesc..." : (isTalking ? "Te ascult..." : `Salut, ${pacientNume}!`))}
             </h1>
          </div>
        )}
      </div>
      
      {currentImage && (
          <div className="absolute bottom-8 right-8 bg-white/10 p-4 rounded-full hover:bg-white/20 cursor-pointer transition backdrop-blur-md" onClick={() => setCurrentImage(null)}>
            <ImageIcon className="w-6 h-6 text-white" />
          </div>
      )}
    </div>
  );
}