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

  // NUEVO: Agregamos 'channelLogo' al estado inicial
  const [matchData, setMatchData] = useState({
    type: "match", 
    league: "", 
    homeTeam: "", 
    awayTeam: "", 
    channelName: "", 
    channelLogo: "", // <--- Campo para el logo del canal
    time: "", 
    videoUrl: "", 
    widgetUrl: "", 
    category: "Principales"
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
        ...matchData,
        type: "match", 
        league: match.league.name,
        homeTeam: match.teams.home.name,
        awayTeam: match.teams.away.name,
        time: match.time || "HOY",
        videoUrl: "",
        widgetUrl: "", 
        channelLogo: "" // <--- Reseteamos el logo al importar un partido
    });
    setSearchResults([]);
    setSearchQuery("");
    toast.success("Datos importados", { icon: '📥' });
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    
    // Validaciones dinámicas según el tipo
    if (!matchData.videoUrl) return toast.error("⚠️ El link del video es obligatorio.");
    if (matchData.type === "match" && (!matchData.homeTeam || !matchData.awayTeam)) {
        return toast.error("⚠️ Faltan los equipos.");
    }
    if (matchData.type === "channel" && !matchData.channelName) {
        return toast.error("⚠️ Falta el nombre del canal.");
    }

    setLoading(true);
    
    try {
      // Preparar el paquete de datos a subir
      const payload = {
          type: matchData.type,
          category: matchData.category,
          time: matchData.time,
          videoUrl: matchData.videoUrl,
          isLive: true,
          createdAt: serverTimestamp()
      };

      if (matchData.type === "match") {
          payload.league = matchData.league;
          payload.homeTeam = matchData.homeTeam;
          payload.awayTeam = matchData.awayTeam;
          payload.widgetUrl = matchData.widgetUrl; 
      } else {
          payload.league = matchData.league || "TV"; 
          payload.channelName = matchData.channelName;
          payload.channelLogo = matchData.channelLogo; // <--- Se guarda el logo en Firebase
      }

      await toast.promise(
        addDoc(collection(db, "matches"), payload),
        {
            loading: 'Publicando señal... 📡',
            success: '¡Transmisión EN VIVO publicada! 🔴',
            error: 'Error al publicar ❌',
        },
        { style: { background: '#1f2937', color: '#fff' } }
      );

      setIsOpen(false);
      // Resetear pero mantener tipo y categoría para más velocidad si subes varios
      setMatchData({ 
          ...matchData, 
          league: "", homeTeam: "", awayTeam: "", channelName: "", channelLogo: "", time: "", videoUrl: "", widgetUrl: "" 
      });
      
    } catch (error) {
      console.error(error);
    }
    
    setLoading(false);
  };

  return (
    <div className="mb-6 px-4">
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
        <div className="mt-4 p-6 bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 animate-in fade-in slide-in-from-top-4 duration-300">
            
            <div className="bg-gray-950/50 p-4 rounded-2xl mb-6 border border-white/5">
                <p className="text-[10px] font-black text-cyan-400 mb-3 uppercase tracking-widest">1. Importar desde API (Solo Partidos)</p>
                <div className="flex gap-2">
                    <input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar equipo o liga..."
                        className="flex-1 bg-black/40 border border-white/10 p-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                    />
                    <button onClick={handleSearch} className="bg-white/10 text-white px-4 rounded-xl hover:bg-white/20 transition border border-white/10">🔍</button>
                </div>

                {searchResults.length > 0 && (
                    <div className="mt-3 bg-black/40 border border-white/10 rounded-xl max-h-48 overflow-y-auto divide-y divide-white/5 shadow-2xl">
                        {searchResults.map(m => (
                            <div key={m.fixture.id} onClick={() => selectMatch(m)} className="p-3 hover:bg-white/5 cursor-pointer text-xs flex justify-between items-center group transition">
                                <span className="text-gray-300 group-hover:text-white">{m.teams.home.name} <span className="text-cyan-600">vs</span> {m.teams.away.name}</span>
                                <span className="text-[10px] font-black text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase">Importar</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <form onSubmit={handlePublish} className="flex flex-col gap-4">
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">2. Configuración de Señal</p>
                
                {/* INTERRUPTOR: PARTIDO VS CANAL */}
                <div className="flex gap-2 bg-black/40 p-1.5 rounded-2xl border border-white/5">
                    <button 
                        type="button"
                        onClick={() => setMatchData({...matchData, type: "match"})}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${matchData.type === "match" ? "bg-cyan-600/80 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"}`}
                    >
                        ⚽ Partido
                    </button>
                    <button 
                        type="button"
                        onClick={() => setMatchData({...matchData, type: "channel"})}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${matchData.type === "channel" ? "bg-purple-600/80 text-white shadow-lg" : "text-gray-500 hover:text-gray-300"}`}
                    >
                        📺 Canal TV
                    </button>
                </div>
                
                <div className="space-y-3">
                    <input 
                        value={matchData.league} 
                        onChange={e => setMatchData({...matchData, league: e.target.value})} 
                        placeholder={matchData.type === "match" ? "Nombre de la Liga" : "Categoría (Ej: Deportes, Premium)"} 
                        className="input-admin" 
                    />
                    
                    {/* RENDERIZADO CONDICIONAL SEGÚN EL TIPO */}
                    {matchData.type === "match" ? (
                        <div className="flex gap-2 items-center">
                            <input value={matchData.homeTeam} onChange={e => setMatchData({...matchData, homeTeam: e.target.value})} placeholder="Local" className="input-admin text-right font-black" />
                            <span className="font-black text-gray-600 text-xs italic">VS</span>
                            <input value={matchData.awayTeam} onChange={e => setMatchData({...matchData, awayTeam: e.target.value})} placeholder="Visita" className="input-admin font-black" />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <input 
                                value={matchData.channelName} 
                                onChange={e => setMatchData({...matchData, channelName: e.target.value})} 
                                placeholder="Nombre del Canal (Ej: ESPN, DirecTV Sports)" 
                                className="input-admin font-black text-center text-purple-400 text-lg placeholder-gray-700" 
                            />
                            {/* NUEVO: Campo de Logo (Solo para Canales) */}
                            <div className="bg-black/30 p-4 border border-white/5 rounded-2xl mt-2">
                                <p className="text-[10px] font-black text-purple-400 uppercase mb-2">URL del Logo del Canal (Opcional)</p>
                                <input 
                                    value={matchData.channelLogo} 
                                    onChange={e => setMatchData({...matchData, channelLogo: e.target.value})} 
                                    placeholder="https://ejemplo.com/logo-espn.png" 
                                    className="w-full bg-black/40 p-2.5 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-700" 
                                />
                            </div>
                        </div>
                    )}
                    
                    <input value={matchData.time} onChange={e => setMatchData({...matchData, time: e.target.value})} placeholder="Estado / Tiempo (Ej: HOY 20:00 o EN VIVO)" className="input-admin text-center" />
                    
                    <div className="bg-black/30 p-4 border border-white/5 rounded-2xl mt-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase mb-2 block tracking-widest">Ubicación Geográfica / Categoría</label>
                        <select 
                            value={matchData.category}
                            onChange={(e) => setMatchData({...matchData, category: e.target.value})}
                            className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
                        >
                            <option value="Banner">🌟 Banner Destacado (Arriba)</option>
                            <option value="Principales">📺 Canales Principales</option>
                            <option value="Ecuatorianos">🇪🇨 Ecuador</option>
                            <option value="Sudamerica">🌎 Sudamérica</option>
                            <option value="Colombia">🇨🇴 Colombia</option>
                            <option value="Peru">🇵🇪 Perú</option>
                            <option value="Mexico">🇲🇽 México</option>
                            <option value="Otros">🌐 Otros Eventos</option>
                        </select>
                    </div>

                    <div className="bg-gradient-to-br from-cyan-900/20 to-purple-900/20 p-4 border border-white/10 rounded-2xl mt-2">
                        <p className="text-[10px] font-black text-cyan-400 uppercase mb-2">Link del Stream (Embed URL)</p>
                        <input 
                            value={matchData.videoUrl} 
                            onChange={e => setMatchData({...matchData, videoUrl: e.target.value})} 
                            placeholder="https://player.vimeo.com/..." 
                            className="w-full bg-black/60 p-3 border border-white/10 rounded-xl text-sm text-cyan-100 focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-gray-600" 
                        />
                    </div>

                    {/* Campo de Widget (Solo para Partidos) */}
                    {matchData.type === "match" && (
                        <div className="bg-black/30 p-4 border border-white/5 rounded-2xl mt-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Link del Widget de Estadísticas (Opcional)</p>
                            <input 
                                value={matchData.widgetUrl} 
                                onChange={e => setMatchData({...matchData, widgetUrl: e.target.value})} 
                                placeholder="https://widgets.sofascore.com/..." 
                                className="w-full bg-black/40 p-3 border border-white/10 rounded-xl text-sm text-gray-300 focus:outline-none focus:border-cyan-500 transition-colors placeholder-gray-700" 
                            />
                        </div>
                    )}
                </div>

                <button 
                    disabled={loading} 
                    className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 text-white py-4 rounded-xl font-black hover:opacity-90 transition-all mt-4 shadow-[0_4px_20px_rgba(6,182,212,0.3)] uppercase tracking-widest text-xs active:scale-95"
                >
                    {loading ? "Sincronizando..." : "🚀 Lanzar Transmisión"}
                </button>
            </form>

            <style jsx>{` 
                .input-admin { 
                    @apply w-full bg-black/40 border border-white/10 p-3.5 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors placeholder-gray-600; 
                } 
            `}</style>
        </div>
      )}
    </div>
  );
                          }
                               
