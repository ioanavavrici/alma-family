import React, { useState, useEffect } from 'react';
import SetupScreen from './components/SetupScreen';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import api from './api';

function App() {
  const [view, setView] = useState('loading');
  const [profile, setProfile] = useState(null);
  const [memories, setMemories] = useState([]); 

  // --- INITIALIZARE ---
  useEffect(() => {
    checkAuth();
  }, []);

  // Funcție dedicată pentru a descărca amintirile
  const fetchMemories = async (pacientId) => {
    try {
        const res = await api.get(`/familie/amintiri/${pacientId}`);
        setMemories(res.data);
    } catch (err) {
        console.error("Nu am putut actualiza lista:", err);
    }
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setView('login');
      return;
    }

    try {
      const res = await api.get('/familie/pacientii-mei');
      if (res.data && res.data.length > 0) {
        const pacient = res.data[0];
        setProfile({
            id: pacient.id,
            nume: pacient.nume,
            code: pacient.pairing_code,
            detalii: pacient.detalii_boala
        });

        // Apelăm funcția de încărcare
        await fetchMemories(pacient.id);
        
        setView('dashboard');
      } else {
        setView('setup');
      }
    } catch (err) {
      console.error("Auth error:", err);
      localStorage.removeItem('access_token');
      setView('login');
    }
  };

  const handleProfileCreated = (backendData) => {
    setProfile({
        id: backendData.id,
        nume: backendData.nume,
        code: backendData.pairing_code,
        detalii: "..." 
    });
    setMemories([]);
    setView('dashboard');
  };

  // --- STERGERE ---
  const handleDeleteMemory = async (id) => {
    if (!confirm("Ești sigur că vrei să ștergi această amintire?")) return;
    try {
      await api.delete(`/familie/sterge-amintire/${id}`);
      // Refresh automat după ștergere
      if (profile?.id) await fetchMemories(profile.id);
    } catch (err) {
      alert("Eroare la ștergere: " + err.message);
    }
  };

  const updateProfileLocal = (newName, newDetails) => {
    setProfile(prev => ({ ...prev, nume: newName, detalii: newDetails }));
  };

  const handleLogout = () => {
    if(confirm("Sigur vrei să ieși?")) {
      localStorage.removeItem('access_token');
      setProfile(null);
      setMemories([]);
      setView('login');
    }
  };

  if (view === 'loading') return <div className="min-h-screen flex items-center justify-center">Se conectează...</div>;
  if (view === 'login') return <LoginScreen onLoginSuccess={checkAuth} />;
  if (view === 'setup') return <SetupScreen onComplete={handleProfileCreated} />;

  return (
    <Dashboard 
      profile={profile}
      memories={memories}
      // SCHIMBARE: Trimitem funcția de refresh, nu doar adăugare locală
      onRefresh={() => fetchMemories(profile.id)} 
      onDeleteMemory={handleDeleteMemory} 
      onUpdateProfile={updateProfileLocal}
      onLogout={handleLogout}
    />
  );
}

export default App;