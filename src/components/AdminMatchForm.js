// src/components/AdminMatchForm.js
"use client";
import { useState } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

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
    const res = await fetch(`/api/search-match?q=${searchQuery}`);
    const data = await res.json();
    setSearchResults(data.response || []);
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
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!matchData.videoUrl || !matchData.homeTeam) return alert("Faltan datos");

    setLoading(true);
    try {
      await addDoc(collection(db, "matches"), {
        ...matchData,
        isLive: true,
        createdAt: serverTimestamp()
      });
      alert("Partido Publicado ✅");
      setIsOpen(false);
      setMatchData({ league: "", homeTeam: "", awayTeam: "", time: "", videoUrl: "" });
    } catch (error) {
      console.error(error);
      alert("Error al guardar");
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
            <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <div className="flex gap-2">
                    <input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar equipo (ej: Barcelona)..."
                        className="flex-1 p-2 border border-gray-300 rounded text-sm"
                    />
                    <button onClick={handleSearch} className="bg-gray-800 text-white px-3 rounded text-sm">🔍</button>
                </div>
                {searchResults.length > 0 && (
                    <div className="mt-2 bg-white border rounded max-h-40 overflow-y-auto">
                        {searchResults.map(m => (
                            <div key={m.fixture.id} onClick={() => selectMatch(m)} className="p-2 hover:bg-blue-50 cursor-pointer text-xs border-b">
                                {m.teams.home.name} vs {m.teams.away.name} ({m.fixture.date})
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Formulario Manual */}
            <form onSubmit={handlePublish} className="flex flex-col gap-3">
                <input value={matchData.league} onChange={e => setMatchData({...matchData, league: e.target.value})} placeholder="Liga / Competición" className="input-simple" />
                <div className="flex gap-2">
                    <input value={matchData.homeTeam} onChange={e => setMatchData({...matchData, homeTeam: e.target.value})} placeholder="Equipo Local" className="input-simple flex-1 font-bold" />
                    <span className="self-center font-bold text-gray-400">VS</span>
                    <input value={matchData.awayTeam} onChange={e => setMatchData({...matchData, awayTeam: e.target.value})} placeholder="Equipo Visitante" className="input-simple flex-1 font-bold" />
                </div>
                <input value={matchData.time} onChange={e => setMatchData({...matchData, time: e.target.value})} placeholder="Hora / Estado (Ej: 15:00 PM o EN VIVO)" className="input-simple" />
                
                <div className="bg-yellow-50 p-2 border border-yellow-200 rounded">
                    <input value={matchData.videoUrl} onChange={e => setMatchData({...matchData, videoUrl: e.target.value})} placeholder="Link del Video (Embed)" className="w-full bg-transparent outline-none text-sm" />
                </div>

                <button disabled={loading} className="bg-green-600 text-white p-3 rounded-lg font-bold hover:bg-green-700 transition">
                    {loading ? "Publicando..." : "Publicar Ahora 🚀"}
                </button>
            </form>
            <style jsx>{` .input-simple { @apply p-2 border border-gray-300 rounded text-sm w-full; } `}</style>
        </div>
      )}
    </div>
  );
}