import React, { useState, useEffect } from 'react';
import { User, Plus, Trash2, Upload, Camera, Activity, Pencil, Save, X, FileText } from 'lucide-react';
import api from '../api';

export default function Dashboard({ profile, memories, onRefresh, onDeleteMemory, onUpdateProfile, onLogout }) {
  // State-uri (title, desc, etc.) sunt la fel ca înainte - le omitem aici pentru claritate, 
  // dar asigură-te că le păstrezi din codul vechi sau copiază logica de mai jos.
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDetails, setEditDetails] = useState('');
  const [lastMovement, setLastMovement] = useState("Fără activitate recentă");
  const [isActive, setIsActive] = useState(false);

  useEffect(() => { if (profile) { setEditName(profile.nume); setEditDetails(profile.detalii); } }, [profile, isEditingProfile]);

  const simulateMotion = () => {
    const time = new Date().toLocaleTimeString('ro-RO');
    setLastMovement(`Activitate detectată la ${time}`);
    setIsActive(true);
    setTimeout(() => setIsActive(false), 3000);
  };
  const handleSaveProfile = () => { onUpdateProfile(editName, editDetails); setIsEditingProfile(false); };
  const handleFileChange = (e) => { const f = e.target.files[0]; if (f) { setFile(f); setPreview(URL.createObjectURL(f)); } };
  
  const submitMemory = async (e) => {
    e.preventDefault();
    if (!title || !desc || !file) { alert("Completează tot!"); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('pacient_id', profile.id); 
      formData.append('titlu', title);
      formData.append('descriere', desc);
      formData.append('file', file);
      await api.post('/familie/upload-amintire', formData);
      await onRefresh(); 
      setTitle(''); setDesc(''); setFile(null); setPreview(null);
      alert("✅ Amintire salvată!");
    } catch (err) { alert("Eroare: " + err.message); } finally { setUploading(false); }
  };

  return (
    <div className="min-h-screen pb-12 bg-gray-50">
      {/* HEADER CU CULORILE NOI */}
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-alma-rose/10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-alma-dark text-white p-2 rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-alma-dark">{profile?.nume}</h2>
              <p className="text-xs text-alma-rose font-medium">● Conectat la Cloud</p>
            </div>
          </div>
          <button onClick={onLogout} className="text-sm text-alma-gray hover:text-alma-rose font-medium px-3 py-1 bg-gray-100 rounded-md transition">
            Ieșire
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* COLOANA STANGA */}
        <div className="md:col-span-1 space-y-6">

          {/* CARD SENZOR */}
          <div className="bg-white rounded-2xl shadow-sm p-4 border border-alma-purple/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full transition-all duration-500 ${isActive ? "bg-alma-rose shadow-[0_0_10px_#a17487] scale-125" : "bg-gray-300"}`}></div>
              <div>
                <p className="text-xs text-alma-gray font-bold uppercase flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Monitorizare
                </p>
                <p className="text-sm font-semibold text-alma-dark">{lastMovement}</p>
              </div>
            </div>
            <button onClick={simulateMotion} className="text-[10px] bg-gray-100 px-2 py-1 rounded text-alma-gray border border-gray-200 hover:bg-alma-rose hover:text-white transition">Test</button>
          </div>
          
          {/* CARD COD - FOLOSIND CULORILE TALE */}
          <div className="bg-gradient-to-br from-alma-dark to-alma-purple rounded-2xl p-6 text-white shadow-xl text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <p className="text-white/60 text-xs font-bold tracking-widest mb-2 uppercase">Cod Conectare Totem</p>
            <div className="text-5xl font-bold tracking-widest bg-white/10 py-4 rounded-xl backdrop-blur-sm border border-white/10 font-mono text-white">
              {profile?.code}
            </div>
          </div>

          {/* CARD DETALII */}
          <div className="bg-white rounded-2xl shadow-sm border border-alma-purple/10 overflow-hidden">
            <div className="bg-gray-50/50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-alma-dark text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-alma-rose" /> Detalii Medicale
              </h3>
              {!isEditingProfile && (
                <button onClick={() => setIsEditingProfile(true)} className="text-alma-gray hover:text-alma-rose transition">
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="p-6">
              {isEditingProfile ? (
                <div className="space-y-3">
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full p-2 border border-alma-gray/20 rounded text-sm focus:border-alma-rose outline-none" />
                  <textarea rows="4" value={editDetails} onChange={(e) => setEditDetails(e.target.value)} className="w-full p-2 border border-alma-gray/20 rounded text-sm focus:border-alma-rose outline-none" />
                  <div className="flex gap-2">
                    <button onClick={handleSaveProfile} className="flex-1 bg-alma-rose text-white py-1 rounded text-sm hover:bg-alma-light transition"><Save className="w-4 h-4 mx-auto" /></button>
                    <button onClick={() => setIsEditingProfile(false)} className="bg-gray-100 px-3 rounded text-alma-gray hover:bg-gray-200"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-semibold text-alma-dark">{profile?.nume}</p>
                  <p className="text-sm text-alma-gray">{profile?.detalii || "Fără detalii."}</p>
                </div>
              )}
            </div>
          </div>

          {/* CARD UPLOAD */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-alma-purple/10">
            <h3 className="font-bold text-alma-dark mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-alma-rose" /> Adaugă Amintire
            </h3>
            <form onSubmit={submitMemory} className="space-y-4">
              <input type="text" placeholder="Titlu" className="w-full p-2 border border-alma-gray/20 rounded-md text-sm outline-none focus:border-alma-rose transition" value={title} onChange={e => setTitle(e.target.value)} />
              <textarea placeholder="Descriere pentru AI..." className="w-full p-2 border border-alma-gray/20 rounded-md text-sm outline-none focus:border-alma-rose transition" rows="3" value={desc} onChange={e => setDesc(e.target.value)} />
              
              <div className="relative border-2 border-dashed border-alma-gray/30 rounded-lg p-4 text-center cursor-pointer hover:bg-alma-rose/5 hover:border-alma-rose transition group">
                <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                {preview ? (
                  <img src={preview} className="h-32 mx-auto rounded shadow-sm object-cover" />
                ) : (
                  <div className="text-alma-gray group-hover:text-alma-rose transition">
                    <Camera className="w-8 h-8 mx-auto mb-2 text-alma-gray/50 group-hover:text-alma-rose/50" />
                    <span className="text-xs block">Apasă pentru upload</span>
                  </div>
                )}
              </div>

              <button type="submit" disabled={!title || !file || uploading} className="w-full bg-alma-dark text-white py-2 rounded-lg text-sm hover:bg-alma-purple disabled:opacity-50 transition shadow-lg">
                {uploading ? "Se încarcă..." : "Încarcă Amintire"}
              </button>
            </form>
          </div>
        </div>

        {/* LISTA AMINTIRI */}
        <div className="md:col-span-2">
          <h3 className="text-xl font-bold text-alma-dark mb-6 flex items-center gap-2">
            Cartea Vieții <span className="bg-alma-rose/10 text-alma-rose text-xs px-2 py-1 rounded-full">{memories.length}</span>
          </h3>
          
          {memories.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-alma-gray/20">
                <p className="text-alma-gray">Nu există amintiri locale încă.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {memories.map((mem) => (
                <div key={mem.id} className="bg-white rounded-2xl p-4 shadow-sm border border-alma-purple/5 flex gap-4 items-start hover:shadow-lg hover:border-alma-rose/20 transition duration-300">
                  <div className="w-32 h-32 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    <img src={mem.url} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-lg text-alma-dark">{mem.titlu}</h4>
                      <button onClick={() => onDeleteMemory(mem.id)} className="text-alma-gray/50 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <p className="text-xs text-alma-gray/70 mb-2">{mem.date}</p>
                    <p className="text-alma-gray text-sm leading-relaxed">{mem.descriere}</p>
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