import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx' // Familia
import TotemLogin from './components/totem/TotemLogin.jsx' // Vom crea asta
import TotemInterface from './components/totem/TotemInterface.jsx' // Vom crea asta
import LandingPage from './LandingPage.jsx' // Pagina de start
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/familie" element={<App />} />
        <Route path="/totem" element={<TotemLogin />} />
        <Route path="/totem/live" element={<TotemInterface />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)