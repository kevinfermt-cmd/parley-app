// src/components/AdminMatchForm.js
"use client";
import { useState } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast"; // <--- Importamos las notificaciones bonitas

export default function AdminMatchForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // Formulario Simplificado
  const [matchData, setMatchData] = useState({
    league: "", homeTeam: "", awayTeam: "", time: "", videoUrl: ""
  });

  // Buscar (Mantenemos la búsqueda porque es útil para no escribir nombres)
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    // Toast de carga pequeñito
    const loadingToast = toast.loading("Buscando equipos...");
    
    try {
        const res = await fetch(`/api/search-match?q=${searchQuery}`);
        const data = await res.json();
        setSearchResults(data.response || []);
        
        if (!data.response || data.response.length === 0) {
            toast.error("No se encontraron partidos", { id: loadingToast });
        } else {
            toast.dismiss(loadingToast); // Quitamos el loading si encontró
        }
    } catch (error) {
        toast.error("Error en la búsqueda", { id: loadingToast });
    }
  };

  const selectMatch = (match) => {
    setMatchData({
        league: match.league.name,
        homeTeam: match.teams.home.name,
        awayTeam: match.teams.away.name,
        time: match.time || "HOY", // Hora o texto
        videoUrl: ""
    });
    setSearchResults([]);
    setSearchQuery("");
    toast.success("Datos importados ✅");
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!matchData.videoUrl || !matchData.homeTeam) {
        toast.error("⚠️ Faltan datos: Asegúrate de poner el Link y los Equipos.");
        return;
    }

    setLoading(true);
    
    try {
      // Usamos toast.promise para la experiencia de usuario completa
      await toast.promise(
        addDoc(collection(db, "matches"), {
            ...matchData,
            isLive: true,
            createdAt: serverTimestamp()
        }),
        {
            loading: 'Publicando transmisión... 📡',
            success: '¡Partido EN VIVO publicado! 🔴',
            error: 'Error al publicar ❌',
        }
      );

      setIsOpen(false);
      setMatchData({ league: "", homeTeam: "", awayTeam: "", time: "", videoUrl: "" });
      
    } catch (error) {
      console.error(error);
      // El toast.promise ya manejó el mensaje de error visualmente
    }
    
    setLoading(false);
  };

  return (
    <div className="mb-4 px-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-black text-white text-sm font-bold py-3 rounded-lg hover:bg-gray-800 transition shadow-lg flex justify-center items-center gap-2"
      >
        {isOpen ? "Cerrar Panel" : "⚙️ Admin: Publicar Partido"}
      </button>

      {isOpen && (
        <div className="mt-4 p-6 bg-white rounded-xl shadow-xl border border-gray-200 animate-in fade-in">
            
            {/* Buscador */}
            <div className="bg-gray-50 p-3 rounded-lg mb-4 border border-gray-200">
                <p className="text-xs font-bold text-gray-500 mb-2 uppercase">1. Buscar en la base de datos (Opcional)</p>
                <div className="flex gap-2">
                    <input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Ej: Barcelona, Real Madrid..."
                        className="flex-1 p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                    />
                    <button onClick={handleSearch} className="bg-gray-800 text-white px-3 rounded text-sm hover:bg-black transition">🔍</button>
                </div>
                {searchResults.length > 0 && (
                    <div className="mt-2 bg-white border rounded max-h-40 overflow-y-auto shadow-sm">
                        {searchResults.map(m => (
                            <div key={m.fixture.id} onClick={() => selectMatch(m)} className="p-2 hover:bg-blue-50 cursor-pointer text-xs border-b flex justify-between items-center group">
                                <span>{m.teams.home.name} vs {m.teams.away.name}</span>
                                <span className="text-gray-400 group-hover:text-blue-600 font-bold">Importar →</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <hr className="border-gray-100 my-4" />

            {/* Formulario Manual */}
            <form onSubmit={handlePublish} className="flex flex-col gap-3">
                <p className="text-xs font-bold text-gray-500 uppercase">2. Confirmar Datos</p>
                
                <input value={matchData.league} onChange={e => setMatchData({...matchData, league: e.target.value})} placeholder="Liga / Competición" className="input-simple" />
                
                <div className="flex gap-2 items-center">
                    <input value={matchData.homeTeam} onChange={e => setMatchData({...matchData, homeTeam: e.target.value})} placeholder="Equipo Local" className="input-simple flex-1 font-bold text-right" />
                    <span className="font-bold text-gray-400 text-xs">VS</span>
                    <input value={matchData.awayTeam} onChange={e => setMatchData({...matchData, awayTeam: e.target.value})} placeholder="Equipo Visitante" className="input-simple flex-1 font-bold" />
                </div>
                
                <input value={matchData.time} onChange={e => setMatchData({...matchData, time: e.target.value})} placeholder="Hora / Estado (Ej: 15:00 PM o EN VIVO)" className="input-simple text-center" />
                
                <div className="bg-yellow-50 p-3 border border-yellow-200 rounded-lg mt-2">
                    <p className="text-[10px] font-black text-yellow-700 uppercase mb-1">Link del Video (Embed / Iframe)</p>
                    <input value={matchData.videoUrl} onChange={e => setMatchData({...matchData, videoUrl: e.target.value})} placeholder="https://..." className="w-full bg-white p-2 border border-yellow-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" />
                </div>

                <button disabled={loading} className="bg-green-600 text-white p-3 rounded-lg font-bold hover:bg-green-700 transition mt-2 shadow-md text-sm uppercase tracking-wide">
                    {loading ? "Publicando..." : "🚀 Publicar Ahora"}
                </button>
            </form>
            <style jsx>{` .input-simple { @apply p-2 border border-gray-300 rounded text-sm w-full focus:outline-none focus:border-blue-500 transition; } `}</style>
        </div>
      )}
    </div>
  );
}