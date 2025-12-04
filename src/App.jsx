import React, { useState, useEffect } from 'react';
import SetupScreen from './components/SetupScreen';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';

function App() {
  const [view, setView] = useState('loading');
  const [profile, setProfile] = useState(null);
  const [memories, setMemories] = useState([]);

  // --- INITIALIZARE ---
  useEffect(() => {
    const savedProfile = localStorage.getItem('alma_profile');
    const savedMemories = localStorage.getItem('alma_memories');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
      if (savedMemories) setMemories(JSON.parse(savedMemories));
      setView('login');
    } else {
      setView('setup');
    }
  }, []);

  // --- HANDLERS ---
  const createProfile = (nume, detalii) => {
    const mockCode = Math.floor(1000 + Math.random() * 9000).toString();
    const newProfile = { nume, detalii, code: mockCode };
    setProfile(newProfile);
    localStorage.setItem('alma_profile', JSON.stringify(newProfile));
    setView('dashboard');
  };

  // NOUTATE: Funcția de editare profil
  const updateProfile = (numeNou, detaliiNoi) => {
    const updatedProfile = { ...profile, nume: numeNou, detalii: detaliiNoi };
    setProfile(updatedProfile);
    localStorage.setItem('alma_profile', JSON.stringify(updatedProfile));
  };

  const addMemory = (titlu, descriere, imageSrc) => {
    const newMem = {
      id: Date.now(),
      titlu, descriere, imageSrc,
      date: new Date().toLocaleDateString('ro-RO')
    };
    const updated = [newMem, ...memories];
    setMemories(updated);
    localStorage.setItem('alma_memories', JSON.stringify(updated));
  };

  const deleteMemory = (id) => {
    const updated = memories.filter(m => m.id !== id);
    setMemories(updated);
    localStorage.setItem('alma_memories', JSON.stringify(updated));
  };

  const resetApp = () => {
    if(confirm("Ștergi tot? Vei pierde profilul și amintirile.")) {
      localStorage.clear();
      setProfile(null);
      setMemories([]);
      setView('setup');
    }
  };

  // --- RENDERIZARE ---
  if (view === 'setup') {
    return <SetupScreen onComplete={createProfile} />;
  }

  if (view === 'login') {
    return (
      <LoginScreen 
        profileName={profile?.nume}
        correctCode={profile?.code}
        onLoginSuccess={() => setView('dashboard')}
        onReset={resetApp}
      />
    );
  }

  return (
    <Dashboard 
      profile={profile}
      memories={memories}
      onAddMemory={addMemory}
      onDeleteMemory={deleteMemory}
      onUpdateProfile={updateProfile} // Trimitem funcția nouă aici
      onLogout={() => setView('login')}
    />
  );
}

export default App;