import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx' // Logica Familie (Login -> Dashboard)
import TotemLogin from './components/totem/TotemLogin.jsx' // Login Pacient (Cod)
import TotemInterface from './components/totem/TotemInterface.jsx' // Interfata Vocala
import LandingPage from './LandingPage.jsx' // Pagina de start
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Pagina de Start - Aici alegi cine esti */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Fluxul FAMILIE (Include Login, Setup, Dashboard gestionate intern de App.jsx) */}
        <Route path="/familie" element={<App />} />
        
        {/* Fluxul PACIENT */}
        <Route path="/totem" element={<TotemLogin />} />
        <Route path="/totem/live" element={<TotemInterface />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)