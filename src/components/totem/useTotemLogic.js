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
  
  const silenceTimer = useRef(null); 
  const speakingStartTimeRef = useRef(null);
  const nextStartTimeRef = useRef(0);
  const hasPatientSpokenRef = useRef(false);

  const pacientId = localStorage.getItem('totem_pacient_id');
  const pacientNume = localStorage.getItem('totem_pacient_nume');

  // ==========================================
  // 3. RECUNOAȘTERE VOCALĂ
  // ==========================================
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        speechRecognition.current = new SpeechRecognition();
        speechRecognition.current.continuous = true; 
        speechRecognition.current.interimResults = true; 
        speechRecognition.current.lang = 'ro-RO';
        speechRecognition.current.maxAlternatives = 1;

        speechRecognition.current.onresult = (event) => {
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript.toLowerCase().trim();
                
                if (!sessionActiveRef.current && transcript.includes('alma')) {
                    try { speechRecognition.current.abort(); } catch(e){}
                    toggleSession();
                }
                if (sessionActiveRef.current && ['stop', 'gata', 'oprește', 'termină'].some(w => transcript.includes(w))) {
                    try { speechRecognition.current.abort(); } catch(e){}
                    toggleSession();
                }
            }
        };
        speechRecognition.current.onend = () => { try { speechRecognition.current.start(); } catch(e) {} };
        try { speechRecognition.current.start(); } catch(e) {}
    }
  }, []);

  // ==========================================
  // 4. TIMER ADAPTIV
  // ==========================================
  const triggerSilenceIntervention = () => {
      const textMesaj = hasPatientSpokenRef.current 
        ? "(Pacientul a vorbit și așteaptă. Răspunde-i sau confirmă.)"
        : "(Pacientul tace de 15 secunde. Oferă un indiciu blând.)";

      console.log(`🚨 TĂCERE -> ${textMesaj}`);
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ type: 'text', text: textMesaj }));
          setIsThinking(true);
      }
  };

  const startSmartTimer = () => {
    if (silenceTimer.current) clearTimeout(silenceTimer.current);
    if (!isSessionActive) return;
    const timeToWait = hasPatientSpokenRef.current ? 4000 : 15000;
    silenceTimer.current = setTimeout(triggerSilenceIntervention, timeToWait);
  };

  const killSilenceTimer = () => {
    if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
        silenceTimer.current = null;
    }
  };

  // ==========================================
  // 5. HELPERE AUDIO (DOWNSAMPLING)
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
  };

  const stopAiSpeaking = () => {
    if (currentSourceNode.current) {
        try { currentSourceNode.current.stop(); } catch(e){}
    }
    nextStartTimeRef.current = 0;
    isPlayingRef.current = false;
    setAiSpeaking(false);
    setIsThinking(false);
    
    if (sessionActiveRef.current) {
        hasPatientSpokenRef.current = false;
        startRawRecording();
        startSmartTimer();
    }
  };

  // --- FUNCȚIE MATEMATICĂ PENTRU A CONVERTI 48k -> 16k ---
  const downsampleBuffer = (buffer, inputSampleRate, outputSampleRate) => {
    if (outputSampleRate === inputSampleRate) {
        return buffer;
    }
    var sampleRateRatio = inputSampleRate / outputSampleRate;
    var newLength = Math.round(buffer.length / sampleRateRatio);
    var result = new Float32Array(newLength);
    var offsetResult = 0;
    var offsetBuffer = 0;
    while (offsetResult < result.length) {
        var nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
        var accum = 0, count = 0;
        for (var i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
            accum += buffer[i];
            count++;
        }
        result[offsetResult] = accum / count;
        offsetResult++;
        offsetBuffer = nextOffsetBuffer;
    }
    return result;
  };

  // ==========================================
  // 6. MICROFON (CU CONVERSIE SIGURĂ LA 16000Hz)
  // ==========================================
  const startRawRecording = async () => {
    if (!sessionActiveRef.current) return;

    try {
      if (inputStream.current && inputStream.current.active) return;

      const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
              channelCount: 1, 
              echoCancellation: true, 
              noiseSuppression: true,
              autoGainControl: true
          } 
      });
      inputStream.current = stream;
      
      // Lăsăm AudioContext-ul să folosească rata NATIVĂ a tabletei (ex: 48000)
      if (!audioContext.current) {
          audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioContext.current.state === 'suspended') {
          await audioContext.current.resume();
      }

      // Aflăm rata reală a tabletei
      const inputSampleRate = audioContext.current.sampleRate;
      const targetSampleRate = 16000; // Ce vrea AI-ul

      const source = audioContext.current.createMediaStreamSource(stream);
      // Buffer mare (4096) pentru eficiență
      processor.current = audioContext.current.createScriptProcessor(4096, 1, 1);

      processor.current.onaudioprocess = (e) => {
        if (!sessionActiveRef.current || isPlayingRef.current) {
            if (micVolume > 0) setMicVolume(0);
            return;
        }

        let inputData = e.inputBuffer.getChannelData(0);
        
        // --- 1. DETECTARE VOLUM (pe sunetul original) ---
        let sum = 0;
        for(let i=0; i<inputData.length; i++) sum += Math.abs(inputData[i]);
        const average = sum / inputData.length;
        setMicVolume(Math.min(100, Math.round(average * 5000)));

        if (average > 0.005) { 
             setIsTalking(true);
             if (!hasPatientSpokenRef.current) hasPatientSpokenRef.current = true;
             startSmartTimer();
             setTimeout(() => setIsTalking(false), 200);
        }

        // --- 2. DOWNSAMPLING (CONVERSIE 48k -> 16k) ---
        // Asta e cheia! Transformăm sunetul în formatul corect înainte de trimitere
        const downsampledData = downsampleBuffer(inputData, inputSampleRate, targetSampleRate);

        // --- 3. CONVERSIE ÎN INT16 PENTRU SERVER ---
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            const buffer = new Int16Array(downsampledData.length);
            for (let i = 0; i < downsampledData.length; i++) {
                let s = Math.max(-1, Math.min(1, downsampledData[i]));
                buffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            
            // Convertim la binary string -> base64
            let binary = '';
            const bytes = new Uint8Array(buffer.buffer);
            // Optimizare mică: loop mai eficient ar fi ideal, dar acesta e safe
            for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
            
            ws.current.send(JSON.stringify({ type: 'audio', data: window.btoa(binary) }));
        }
      };

      source.connect(processor.current);
      processor.current.connect(audioContext.current.destination);

    } catch (err) {
      console.error("❌ EROARE MICROFON:", err);
    }
  };

  // ==========================================
  // 7. AUDIO PLAYBACK (SEAMLESS)
  // ==========================================
  const playAudioChunk = async (base64String) => {
      try {
        if (!audioContext.current) {
            audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContext.current.state === 'suspended') {
            await audioContext.current.resume();
        }

        const binaryString = window.atob(base64String);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
        
        const float32Array = new Float32Array(bytes.length / 2);
        const dataView = new DataView(bytes.buffer);
        for (let i = 0; i < bytes.length / 2; i++) {
            float32Array[i] = dataView.getInt16(i * 2, true) / 32768.0;
        }

        const serverSampleRate = 24000; 
        const audioBuffer = audioContext.current.createBuffer(1, float32Array.length, serverSampleRate);
        audioBuffer.getChannelData(0).set(float32Array);

        const source = audioContext.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.current.destination);

        const currentTime = audioContext.current.currentTime;
        if (nextStartTimeRef.current < currentTime) {
            nextStartTimeRef.current = currentTime + 0.1;
        }

        source.start(nextStartTimeRef.current);
        nextStartTimeRef.current += audioBuffer.duration;
        currentSourceNode.current = source;

      } catch (e) {
        console.error("Playback error:", e);
      }
  };

  const processQueue = async () => {
    while (audioQueue.current.length > 0 && isPlayingRef.current && sessionActiveRef.current) {
        const nextChunk = audioQueue.current.shift();
        await playAudioChunk(nextChunk); 
    }
    if (isPlayingRef.current && sessionActiveRef.current) {
        const currentTime = audioContext.current?.currentTime || 0;
        if (audioQueue.current.length === 0 && currentTime > nextStartTimeRef.current + 0.2) {
            stopAiSpeaking(); 
        } else {
            setTimeout(processQueue, 100);
        }
    }
  };

  // ==========================================
  // 8. WEBSOCKET & SESIUNE
  // ==========================================
  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = "25husv-production.up.railway.app"; 
    
    if (ws.current) ws.current.close();
    ws.current = new WebSocket(`${protocol}//${host}/totem/ws/${pacientId}`);

    ws.current.onopen = () => {
      setStatus("Activ");
      hasPatientSpokenRef.current = false;
      startSmartTimer(); 
    };

    ws.current.onmessage = (event) => {
      if (!sessionActiveRef.current) return;
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

    ws.current.onclose = () => { if (sessionActiveRef.current) setStatus("Deconectat"); };
  };

  const toggleSession = async () => {
    if (sessionActiveRef.current) {
        sessionActiveRef.current = false;
        setIsSessionActive(false);
        setStatus("Standby");
        stopAiSpeaking(); 
        stopRecording();
        killSilenceTimer();
        if (ws.current) ws.current.close();
    } else {
        sessionActiveRef.current = true;
        setIsSessionActive(true);
        setStatus("Se conectează...");
        try {
            if (!audioContext.current) audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
            if (audioContext.current.state === 'suspended') await audioContext.current.resume();
        } catch (e) {}
        connectWebSocket();
        startRawRecording();
    }
  };

  useEffect(() => {
    return () => {
      sessionActiveRef.current = false;
      stopRecording();
      killSilenceTimer();
      if (ws.current) ws.current.close();
    };
  }, []);

  return {
    status, isSessionActive, toggleSession, currentImage, imageTitle, isTalking, micVolume, aiSpeaking, isThinking, pacientNume,
    clearImage: () => setCurrentImage(null)
  };
};