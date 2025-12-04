import React, { useState, useEffect } from 'react';
import SetupScreen from './components/SetupScreen';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import api from './api';

function App() {
  const [view, setView] = useState('loading'); // Stări: loading, login, setup, dashboard
  const [profile, setProfile] = useState(null);
  const [memories, setMemories] = useState([]); 

  // La pornire, verificăm autentificarea
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setView('login');
      return;
    }

    try {
      // 1. Cerem lista de pacienți de la server
      const res = await api.get('/familie/pacientii-mei');
      
      if (res.data && res.data.length > 0) {
        // Dacă există un pacient, îl încărcăm pe primul
        const pacient = res.data[0];
        
        setProfile({
            id: pacient.id,
            nume: pacient.nume,
            code: pacient.pairing_code,
            detalii: pacient.detalii_boala
        });

        // 2. --- NOUTATE: Descărcăm amintirile de pe server ---
        try {
            console.log("Se descarcă amintirile pentru pacientul:", pacient.id);
            const resMemories = await api.get(`/familie/amintiri/${pacient.id}`);
            
            // Backend-ul returnează lista formatată corect ({id, titlu, imageSrc...})
            setMemories(resMemories.data);
            console.log("Amintiri încărcate:", resMemories.data.length);
        } catch (memErr) {
            console.error("Nu am putut încărca amintirile (poate backend-ul nu e actualizat încă):", memErr);
            // Nu blocăm aplicația dacă eșuează încărcarea pozelor
        }

        setView('dashboard');
      } else {
        // Suntem logați, dar nu avem pacient -> Mergem la Setup
        setView('setup');
      }
    } catch (err) {
      console.error("Sesiune expirată sau eroare:", err);
      // Dacă tokenul nu mai e bun, curățăm tot și mergem la login
      localStorage.removeItem('access_token');
      setProfile(null);
      setMemories([]);
      setView('login');
    }
  };

  // Apelată după ce creăm un pacient nou în SetupScreen
  const handleProfileCreated = (backendData) => {
    setProfile({
        id: backendData.id,
        nume: backendData.nume,
        code: backendData.pairing_code,
        detalii: "..." // Putem face un fetch separat pentru detalii dacă e nevoie
    });
    setMemories([]); // Profil nou -> zero amintiri
    setView('dashboard');
  };

  // Funcție apelată de Dashboard după ce se încarcă o poză cu succes
  // Adaugă amintirea local pentru a o vedea instant, fără refresh
  const addMemoryLocal = (titlu, descriere, imageSrc) => {
    const newMem = {
      id: Date.now(), // ID temporar până la refresh
      titlu, 
      descriere, 
      imageSrc,
      date: "Chiar acum"
    };
    setMemories([newMem, ...memories]);
  };

  // Funcție pentru actualizarea locală a profilului după editare
  const updateProfileLocal = (newName, newDetails) => {
    // Aici am putea face și un apel către backend pentru salvare (PUT /familie/update...)
    // Momentan actualizăm doar local pentru demo
    setProfile(prev => ({ ...prev, nume: newName, detalii: newDetails }));
  };

  const handleLogout = () => {
    if(confirm("Sigur vrei să ieși din aplicație?")) {
      localStorage.removeItem('access_token');
      setProfile(null);
      setMemories([]);
      setView('login');
    }
  };

  // --- RENDERIZARE ---

  if (view === 'loading') {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <div className="font-semibold text-gray-600">Se conectează la ALMA Cloud...</div>
        </div>
    );
  }

  if (view === 'login') {
    return <LoginScreen onLoginSuccess={checkAuth} />;
  }

  if (view === 'setup') {
    return <SetupScreen onComplete={handleProfileCreated} />;
  }

  return (
    <Dashboard 
      profile={profile}
      memories={memories}
      onAddMemory={addMemoryLocal}
      // Funcția de ștergere locală (pentru demo)
      onDeleteMemory={(id) => setMemories(memories.filter(m => m.id !== id))}
      onUpdateProfile={updateProfileLocal}
      onLogout={handleLogout}
    />
  );
}

export default App;