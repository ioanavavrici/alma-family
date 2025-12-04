import { useState, useEffect, useRef } from 'react';

export const useTotemLogic = () => {
  // ==========================================
  // 1. STĂRI UI
  // ==========================================
  const [status, setStatus] = useState("Standby");
  const [isSessionActive, setIsSessionActive] = useState(false);
  
  const [currentImage, setCurrentImage] = useState(null);
  const [imageTitle, setImageTitle] = useState("");
  const [isTalking, setIsTalking] = useState(false); 
  const [aiSpeaking, setAiSpeaking] = useState(false); 
  const [isThinking, setIsThinking] = useState(false); 
  const [micVolume, setMicVolume] = useState(0);

  // ==========================================
  // 2. REFERINȚE
  // ==========================================
  const sessionActiveRef = useRef(false);
  const ws = useRef(null);
  const audioContext = useRef(null);
  const processor = useRef(null);
  const inputStream = useRef(null);
  const speechRecognition = useRef(null);
  const audioQueue = useRef([]); 
  const isPlayingRef = useRef(false);
  const currentSourceNode = useRef(null);
  
  // Timerul pentru tăcere
  const silenceTimer = useRef(null); 
  // Ref pentru a măsura cât timp vorbește pacientul
  const speakingStartTimeRef = useRef(null);

  const pacientId = localStorage.getItem('totem_pacient_id');
  const pacientNume = localStorage.getItem('totem_pacient_nume');

  // ==========================================
  // 3. LOGICA DE HELPER (TIMER)
  // ==========================================

  const triggerSilenceIntervention = () => {
      console.log("🚨 TĂCERE COMPLETĂ (5s) -> Cerem indiciu.");
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ 
              type: 'text', 
              text: "(Pacientul nu a scos niciun sunet de 5 secunde. E posibil să fie blocat. Intervină cu un indiciu.)" 
          }));
          setIsThinking(true);
      }
  };

  const startSilenceTimer = () => {
    // Curățăm orice timer vechi
    if (silenceTimer.current) clearTimeout(silenceTimer.current);

    if (isSessionActive) {
        // console.log("⏳ Timer Help pornit (15s)");
        silenceTimer.current = setTimeout(triggerSilenceIntervention, 5000); 
    }
  };

  // Această funcție doar amână timerul (pentru sunete scurte)
  const delaySilenceTimer = () => {
    if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
        silenceTimer.current = setTimeout(triggerSilenceIntervention, 15000);
    }
  };

  // Această funcție OMOARĂ timerul (când pacientul a vorbit destul)
  const killSilenceTimer = () => {
    if (silenceTimer.current) {
        console.log("✅ Răspuns valid detectat -> Anulăm ajutorul AI.");
        clearTimeout(silenceTimer.current);
        silenceTimer.current = null;
    }
  };

  // ==========================================
  // 4. HELPERE AUDIO
  // ==========================================
  const stopRecording = () => {
    if (inputStream.current) {
        inputStream.current.getTracks().forEach(track => track.stop());
        inputStream.current = null;
    }
    if (processor.current) {
        processor.current.disconnect();
        processor.current = null;
    }
    setIsTalking(false);
    setMicVolume(0);
    speakingStartTimeRef.current = null;
  };

  const startCommandListener = () => {
    try { if (speechRecognition.current) speechRecognition.current.start(); } catch (e) {}
  };
  const stopCommandListener = () => {
    try { if (speechRecognition.current) speechRecognition.current.stop(); } catch (e) {}
  };

  // ==========================================
  // 5. MICROFON (CU LOGICA NOUTĂ DE VALIDARE)
  // ==========================================
  const startRawRecording = async () => {
    if (!sessionActiveRef.current) return;

    try {
      if (inputStream.current && inputStream.current.active) return;

      // MODIFICARE: AM SCOS sampleRate: 16000 de aici!
      // Lăsăm tableta să decidă (44100 sau 48000)
      const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
              channelCount: 1, 
              // sampleRate: 16000, <--- ȘTERS (Asta bloca tableta)
              echoCancellation: true, 
              noiseSuppression: true,
              autoGainControl: true
          } 
      });
      inputStream.current = stream;
      
      // AICI FORȚĂM CONVERSIA LA 16000 PENTRU SERVER
      // Browserul va face automat downsampling de la 48k la 16k
      if (!audioContext.current) {
          audioContext.current = new (window.AudioContext || window.webkitAudioContext)({ 
              sampleRate: 16000, // <--- Păstrăm aici pentru Backend
              latencyHint: 'interactive'
          });
      }
      
      if (audioContext.current.state === 'suspended') {
          await audioContext.current.resume();
      }

      const source = audioContext.current.createMediaStreamSource(stream);
      processor.current = audioContext.current.createScriptProcessor(4096, 1, 1);

      processor.current.onaudioprocess = (e) => {
        if (!sessionActiveRef.current || isPlayingRef.current) {
            if (micVolume > 0) setMicVolume(0);
            return;
        }

        const inputData = e.inputBuffer.getChannelData(0);
        
        // Calcul Volum
        let sum = 0;
        for(let i=0; i<inputData.length; i++) sum += Math.abs(inputData[i]);
        const average = sum / inputData.length;
        const vol = Math.min(100, Math.round(average * 5000));
        setMicVolume(vol);

        // Detectare Voce
        if (average > 0.005) { 
             setIsTalking(true);
             if (!speakingStartTimeRef.current) {
                 speakingStartTimeRef.current = Date.now();
                 delaySilenceTimer();
             } else {
                 const duration = Date.now() - speakingStartTimeRef.current;
                 if (duration > 1500) {
                     killSilenceTimer(); 
                 } else {
                     delaySilenceTimer();
                 }
             }
             setTimeout(() => setIsTalking(false), 200);
        } else {
            speakingStartTimeRef.current = null;
        }

        // Trimitere Server (Acum datele sunt sigur la 16000Hz datorită AudioContext)
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
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

    } catch (err) {
      console.error("❌ EROARE MICROFON:", err);
      // alert("Eroare la pornirea microfonului: " + err.message);
    }
  };

  // ==========================================
  // 6. AUDIO PLAYBACK
  // ==========================================
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
        for (let i = 0; i < bytes.length / 2; i++) float32Array[i] = dataView.getInt16(i * 2, true) / 32768.0;
        
        const audioBuffer = audioContext.current.createBuffer(1, float32Array.length, 24000);
        audioBuffer.getChannelData(0).set(float32Array);
        const source = audioContext.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.current.destination);
        currentSourceNode.current = source;
        source.onended = () => { resolve(); };
        source.start();
      } catch (e) { resolve(); }
    });
  };

  const processQueue = async () => {
    if (audioQueue.current.length === 0) {
      stopAiSpeaking();
      return;
    }
    if (!isPlayingRef.current || !sessionActiveRef.current) return;
    
    const nextChunk = audioQueue.current.shift();
    await playAudioChunk(nextChunk);
    processQueue();
  };

  const stopAiSpeaking = () => {
    if (currentSourceNode.current) try { currentSourceNode.current.stop(); } catch(e){}
    
    isPlayingRef.current = false;
    setAiSpeaking(false);
    setIsThinking(false);
    
    if (sessionActiveRef.current) {
        startRawRecording();
        startSilenceTimer(); // Resetăm timerul la începutul turei pacientului
    }
  };

  // ==========================================
  // 7. WEBSOCKET
  // ==========================================
  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = "25husv-production.up.railway.app"; 
    
    if (ws.current) ws.current.close();
    ws.current = new WebSocket(`${protocol}//${host}/totem/ws/${pacientId}`);

    ws.current.onopen = () => {
      console.log("✅ WebSocket Conectat");
      setStatus("Activ");
      startSilenceTimer();
    };

    ws.current.onmessage = (event) => {
      if (!sessionActiveRef.current) return;
      
      // Orice răspuns de la AI anulează imediat timerul
      killSilenceTimer();

      const msg = JSON.parse(event.data);

      if (msg.type === 'audio_response') {
        audioQueue.current.push(msg.data);
        if (!isPlayingRef.current) {
          isPlayingRef.current = true;
          setIsThinking(true);
          stopRecording(); 
          
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
        if (sessionActiveRef.current) setStatus("Deconectat (Reîncerc...)");
    };
  };

  // ==========================================
  // 8. CONTROL SESIUNE
  // ==========================================
  const toggleSession = async () => {
    if (sessionActiveRef.current) {
        // STOP
        sessionActiveRef.current = false;
        setIsSessionActive(false);
        setStatus("Standby");
        
        stopAiSpeaking(); 
        stopRecording();
        if (silenceTimer.current) clearTimeout(silenceTimer.current);
        if (ws.current) ws.current.close();

    } else {
        // START
        sessionActiveRef.current = true;
        setIsSessionActive(true);
        setStatus("Se conectează...");

        try {
            if (!audioContext.current) {
                audioContext.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
            }
            if (audioContext.current.state === 'suspended') {
                await audioContext.current.resume();
            }
        } catch (e) {
            console.error("AudioContext Resume Error:", e);
        }

        connectWebSocket();
        startRawRecording();
    }
  };

  // ==========================================
  // 9. INITIALIZARE
  // ==========================================
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        speechRecognition.current = new SpeechRecognition();
        speechRecognition.current.continuous = true;
        speechRecognition.current.interimResults = true;
        speechRecognition.current.lang = 'ro-RO';
        speechRecognition.current.onresult = (event) => {
          const transcript = Array.from(event.results).map(r => r[0].transcript).join('').toLowerCase();
          
          // Dacă recunoașterea vocală aude ceva, anulăm timerul
          if (transcript.length > 0) killSilenceTimer();

          if (['stop', 'gata', 'oprește', 'termină'].some(w => transcript.includes(w))) {
             stopAiSpeaking(); 
          }
        };
    }

    return () => {
      sessionActiveRef.current = false;
      stopRecording();
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
      if (ws.current) ws.current.close();
    };
  }, []);

  return {
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
    clearImage: () => setCurrentImage(null)
  };
};