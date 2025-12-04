import React, { useState, useEffect } from 'react';
import { User, Plus, Trash2, Upload, Camera, Pencil, Save, X, FileText } from 'lucide-react';

export default function Dashboard({ profile, memories, onAddMemory, onDeleteMemory, onUpdateProfile, onLogout }) {
  // State pentru formularul de upload amintiri
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  // State pentru EDITARE PROFIL (Noutate)
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDetails, setEditDetails] = useState('');

  // Când intrăm în modul de editare, încărcăm datele curente
  useEffect(() => {
    if (profile) {
      setEditName(profile.nume);
      setEditDetails(profile.detalii);
    }
  }, [profile, isEditingProfile]);

  const handleSaveProfile = () => {
    onUpdateProfile(editName, editDetails);
    setIsEditingProfile(false);
  };

  // Upload handler
  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const submitMemory = (e) => {
    e.preventDefault();
    if (!title || !desc || !file) return;
    onAddMemory(title, desc, preview);
    setTitle('');
    setDesc('');
    setFile(null);
    setPreview(null);
  };

  return (
    <div className="min-h-screen pb-12 bg-gray-50">
      {/* HEADER */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2 rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">{profile?.nume}</h2>
              <p className="text-xs text-green-600 font-medium">● Conectat la ALMA</p>
            </div>
          </div>
          <button onClick={onLogout} className="text-sm text-gray-500 hover:text-purple-600 font-medium px-3 py-1 bg-gray-100 rounded-md">
            Ieșire
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* COLOANA STANGA: PROFIL & UPLOAD */}
        <div className="md:col-span-1 space-y-6">
          
          {/* 1. CARD COD DE CONECTARE */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg text-center relative overflow-hidden">
             {/* Decorativ */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            
            <p className="text-indigo-100 text-xs font-bold tracking-widest mb-2 uppercase">Cod Conectare Totem</p>
            <div className="text-5xl font-bold tracking-widest bg-white/20 py-4 rounded-xl backdrop-blur-sm border border-white/30 font-mono">
              {profile?.code}
            </div>
          </div>

          {/* 2. CARD DETALII PACIENT (EDITABIL) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" /> Detalii Medicale
              </h3>
              {!isEditingProfile && (
                <button 
                  onClick={() => setIsEditingProfile(true)} 
                  className="text-gray-400 hover:text-indigo-600 transition"
                  title="Editează profilul"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="p-6">
              {isEditingProfile ? (
                // --- MOD EDITARE ---
                <div className="space-y-3 animate-fadeIn">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Nume Pacient</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full p-2 border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Detalii / Biografie</label>
                    <textarea 
                      rows="4"
                      value={editDetails}
                      onChange={(e) => setEditDetails(e.target.value)}
                      className="w-full p-2 border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={handleSaveProfile}
                      className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex justify-center items-center gap-1"
                    >
                      <Save className="w-4 h-4" /> Salvează
                    </button>
                    <button 
                      onClick={() => setIsEditingProfile(false)}
                      className="bg-gray-100 text-gray-600 px-3 rounded-lg hover:bg-gray-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                // --- MOD VIZUALIZARE ---
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">Nume</p>
                    <p className="font-semibold text-gray-800">{profile?.nume}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">Context Medical & Biografie</p>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                      {profile?.detalii || "Nu există detalii adăugate."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. CARD UPLOAD */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-500" /> Adaugă Amintire
            </h3>
            <form onSubmit={submitMemory} className="space-y-4">
              <input type="text" placeholder="Titlu (ex: Ziua de naștere)" className="w-full p-2 border rounded-md text-sm outline-none focus:border-indigo-500" value={title} onChange={e => setTitle(e.target.value)} />
              <textarea placeholder="Descriere pentru AI (Cine e în poză?)" className="w-full p-2 border rounded-md text-sm outline-none focus:border-indigo-500" rows="3" value={desc} onChange={e => setDesc(e.target.value)} />
              
              <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 hover:border-indigo-300 transition">
                <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                {preview ? (
                  <div className="relative">
                    <img src={preview} className="h-32 mx-auto rounded shadow-sm object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 rounded transition text-white text-xs font-bold">Schimbă poza</div>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <Camera className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <span className="text-xs block">Apasă pentru a încărca</span>
                  </div>
                )}
              </div>

              <button type="submit" disabled={!title || !file} className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm hover:bg-black disabled:opacity-50 transition">
                <Upload className="w-4 h-4 inline mr-2" /> Încarcă Amintire
              </button>
            </form>
          </div>
        </div>

        {/* COLOANA DREAPTA: LISTA */}
        <div className="md:col-span-2">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            Cartea Vieții <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full">{memories.length}</span>
          </h3>
          
          {memories.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                <p className="text-gray-400 mb-1">Nu există amintiri încă.</p>
                <p className="text-xs text-gray-400">Începe prin a adăuga fotografii importante pentru {profile?.nume}.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {memories.map((mem) => (
                <div key={mem.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4 items-start group hover:shadow-md transition">
                  <div className="w-32 h-32 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100">
                    <img src={mem.imageSrc} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-lg text-gray-800">{mem.titlu}</h4>
                      <button onClick={() => onDeleteMemory(mem.id)} className="text-gray-300 hover:text-red-500 p-1 hover:bg-red-50 rounded transition"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <p className="text-xs text-gray-400 mb-2 font-mono">{mem.date}</p>
                    <p className="text-gray-600 text-sm leading-relaxed">{mem.descriere}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}