// src/components/AdminMatchForm.js
"use client";
import { useState } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";

export default function AdminMatchForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const [matchData, setMatchData] = useState({
    league: "", homeTeam: "", awayTeam: "", time: "", videoUrl: ""
  });

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    const loadingToast = toast.loading("Buscando en la API...", {
        style: { background: '#1f2937', color: '#fff' }
    });
    
    try {
        const res = await fetch(`/api/search-match?q=${searchQuery}`);
        const data = await res.json();
        setSearchResults(data.response || []);
        
        if (!data.response || data.response.length === 0) {
            toast.error("No se encontraron partidos", { id: loadingToast });
        } else {
            toast.dismiss(loadingToast);
        }
    } catch (error) {
        toast.error("Error en la conexión", { id: loadingToast });
    }
  };

  const selectMatch = (match) => {
    setMatchData({
        league: match.league.name,
        homeTeam: match.teams.home.name,
        awayTeam: match.teams.away.name,
        time: match.time || "HOY",
        videoUrl: ""
    });
    setSearchResults([]);
    setSearchQuery("");
    toast.success("Datos importados", { icon: '📥' });
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!matchData.videoUrl || !matchData.homeTeam) {
        toast.error("⚠️ El link y los equipos son obligatorios.");
        return;
    }

    setLoading(true);
    
    try {
      await toast.promise(
        addDoc(collection(db, "matches"), {
            ...matchData,
            isLive: true,
            createdAt: serverTimestamp()
        }),
        {
            loading: 'Publicando señal... 📡',
            success: '¡Partido EN VIVO publicado! 🔴',
            error: 'Error al publicar ❌',
        },
        { style: { background: '#1f2937', color: '#fff' } }
      );

      setIsOpen(false);
      setMatchData({ league: "", homeTeam: "", awayTeam: "", time: "", videoUrl: "" });
      
    } catch (error) {
      console.error(error);
    }
    
    setLoading(false);
  };

  return (
    <div className="mb-6 px-4">
      {/* Botón Principal Admin */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-sm font-black py-4 rounded-2xl transition-all duration-300 flex justify-center items-center gap-2 shadow-xl border
            ${isOpen 
                ? "bg-gray-800 border-gray-700 text-gray-400" 
                : "bg-white text-black border-white hover:bg-gray-200"
            }`}
      >
        {isOpen ? "Cerrar Panel de Control" : "⚙️ GESTIONAR TRANSMISIONES"}
      </button>

      {isOpen && (
        <div className="mt-4 p-6 bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 animate-in fade-in slide-in-from-top-4 duration-300">
            
            {/* 1. SECCIÓN BUSCADOR */}
            <div className="bg-gray-950 p-4 rounded-xl mb-6 border border-gray-800">
                <p className="text-[10px] font-black text-cyan-500 mb-3 uppercase tracking-widest">1. Importar desde API</p>
                <div className="flex gap-2">
                    <input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar equipo o liga..."
                        className="flex-1 bg-gray-900 border border-gray-800 p-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                    />
                    <button onClick={handleSearch} className="bg-gray-800 text-white px-4 rounded-lg hover:bg-gray-700 transition border border-gray-700">🔍</button>
                </div>

                {/* Resultados de búsqueda */}
                {searchResults.length > 0 && (
                    <div className="mt-3 bg-gray-900 border border-gray-800 rounded-lg max-h-48 overflow-y-auto divide-y divide-gray-800 shadow-2xl">
                        {searchResults.map(m => (
                            <div key={m.fixture.id} onClick={() => selectMatch(m)} className="p-3 hover:bg-gray-800 cursor-pointer text-xs flex justify-between items-center group transition">
                                <span className="text-gray-300 group-hover:text-white">{m.teams.home.name} <span className="text-cyan-600">vs</span> {m.teams.away.name}</span>
                                <span className="text-[10px] font-black text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity uppercase">Importar</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 2. FORMULARIO MANUAL / CONFIRMACIÓN */}
            <form onSubmit={handlePublish} className="flex flex-col gap-4">
                <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">2. Configuración de Señal</p>
                
                <div className="space-y-3">
                    <input 
                        value={matchData.league} 
                        onChange={e => setMatchData({...matchData, league: e.target.value})} 
                        placeholder="Nombre de la Liga" 
                        className="input-admin" 
                    />
                    
                    <div className="flex gap-2 items-center">
                        <input value={matchData.homeTeam} onChange={e => setMatchData({...matchData, homeTeam: e.target.value})} placeholder="Local" className="input-admin text-right font-black" />
                        <span className="font-black text-gray-700 text-xs italic">VS</span>
                        <input value={matchData.awayTeam} onChange={e => setMatchData({...matchData, awayTeam: e.target.value})} placeholder="Visita" className="input-admin font-black" />
                    </div>
                    
                    <input value={matchData.time} onChange={e => setMatchData({...matchData, time: e.target.value})} placeholder="Estado / Tiempo (Ej: HOY 20:00 o EN VIVO)" className="input-admin text-center" />
                    
                    {/* Sección Crítica: Link del Video */}
                    <div className="bg-cyan-950/20 p-4 border border-cyan-900/30 rounded-xl mt-2">
                        <p className="text-[10px] font-black text-cyan-400 uppercase mb-2">Link del Stream (Embed URL)</p>
                        <input 
                            value={matchData.videoUrl} 
                            onChange={e => setMatchData({...matchData, videoUrl: e.target.value})} 
                            placeholder="https://player.vimeo.com/..." 
                            className="w-full bg-gray-950 p-2.5 border border-cyan-900/50 rounded-lg text-sm text-cyan-100 focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-cyan-900" 
                        />
                    </div>
                </div>

                <button 
                    disabled={loading} 
                    className="w-full bg-cyan-600 text-white py-4 rounded-xl font-black hover:bg-cyan-500 transition-all mt-4 shadow-lg shadow-cyan-900/20 uppercase tracking-widest text-xs"
                >
                    {loading ? "Sincronizando..." : "🚀 Lanzar Transmisión"}
                </button>
            </form>

            <style jsx>{` 
                .input-admin { 
                    @apply w-full bg-gray-950 border border-gray-800 p-3 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors placeholder-gray-700; 
                } 
            `}</style>
        </div>
      )}
    </div>
  );
}