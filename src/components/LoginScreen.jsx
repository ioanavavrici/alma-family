import React, { useState } from 'react';
import { Lock, ArrowRight, RefreshCw } from 'lucide-react';

export default function LoginScreen({ profileName, correctCode, onLoginSuccess, onReset }) {
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputCode === correctCode) {
      onLoginSuccess();
    } else {
      setError('Cod incorect.');
      setInputCode('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border-t-4 border-purple-500">
        <div className="flex justify-center mb-6">
          <div className="bg-purple-100 p-3 rounded-full">
            <Lock className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-center text-gray-800">Salut, Familie!</h1>
        <p className="text-center text-gray-500 mb-6 text-sm">
          
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            required
            type="text" 
            className="w-full p-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest font-bold focus:ring-2 focus:ring-purple-500 outline-none"
            placeholder="0000"
            maxLength="4"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
          />
          
          {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

          <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2">
            Intră în Cont <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <button onClick={onReset} className="text-xs text-gray-400 hover:text-red-500 flex items-center justify-center gap-1 mx-auto">
            <RefreshCw className="w-3 h-3" />
            Faceți un cont nou
          </button>
        </div>
      </div>
    </div>
  );
}