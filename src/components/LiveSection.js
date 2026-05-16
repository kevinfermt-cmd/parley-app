// src/components/LiveSection.js
"use client";
import { useState, useEffect, useRef } from "react";
import { db, auth } from "../lib/firebase"; 
import { collection, query, orderBy, onSnapshot, where, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import toast from "react-hot-toast"; 
import { PlayCircle, Tv, Info } from "lucide-react";

// --- COMPONENTE AUXILIAR: CARRUSEL CON FLECHAS ESTILO APPLE ---
function CarouselRow({ title, items, isAdmin, handleDelete, handleEditTime, handleEditLink }) {
    const scrollRef = useRef(null);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = direction === "left" ? -400 : 400; 
            current.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
    };

    if (items.length === 0) return null;

    return (
        <div className="w-full relative group/carousel mb-6">
            {title && (
                <h3 className="text-[13px] font-bold text-gray-300 mb-3 px-2 uppercase tracking-widest flex items-center gap-2">
                    {title}
                </h3>
            )}

            {/* Flecha Izquierda (Glassmorphism) */}
            <button 
                onClick={() => scroll("left")}
                className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-white/10 text-white p-3 rounded-full opacity-0 group-hover/carousel:opacity-100 transition-all items-center justify-center shadow-[0_4px_24px_rgba(0,0,0,0.5)] active:scale-95"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
            </button>

            {/* Contenedor del Scroll */}
            <div 
                ref={scrollRef}
                className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 px-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] scroll-smooth"
            >
                {items.map((match) => (
                    <Link href={`/match/${match.id}`} key={match.id} className="snap-start shrink-0 w-[160px] md:w-[220px] group/card relative block outline-none">
                        
                        {/* Tarjeta Glassmorphism Premium */}
                        <div className="rounded-3xl bg-gray-900/40 backdrop-blur-md border border-white/5 hover:border-cyan-500/50 transition-all duration-300 h-[150px] flex flex-col relative overflow-hidden shadow-lg hover:shadow-[0_8px_30px_rgba(6,182,212,0.15)]">
                            
                            {/* Brillo interno suave (Aurora Effect) */}
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-transparent to-purple-500/0 group-hover/card:from-cyan-500/10 group-hover/card:to-purple-500/10 transition-all duration-500"></div>

                            {/* Admin Tools Cards */}
                            {isAdmin && (
                                <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity backdrop-blur-md bg-black/50 p-1 rounded-xl border border-white/10">
                                    <button onClick={(e) => handleEditTime(e, match.id, match.time)} className="text-blue-400 hover:text-white p-1 rounded text-xs transition-colors">⏱️</button>
                                    <button onClick={(e) => handleEditLink(e, match.id)} className="text-yellow-400 hover:text-white p-1 rounded text-xs transition-colors">🔗</button>
                                    <button onClick={(e) => handleDelete(e, match.id)} className="text-red-400 hover:text-white p-1 rounded text-xs transition-colors">🗑️</button>
                                </div>
                            )}

                            {/* Indicador de "En Vivo" */}
                            <div className="flex justify-between items-center px-4 pt-4 relative z-10">
                                <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm border border-white/5 px-2 py-1 rounded-full">
                                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
                                    <span className="text-[9px] text-gray-300 font-bold tracking-wider">{match.time}</span>
                                </div>
                            </div>
                            
                            {/* Contenido Central: Logo de Canal o Nombres de Equipos */}
                            <div className="flex-1 flex flex-col justify-center items-center text-center relative z-10 w-full px-4 pb-2">
                                {match.type === "channel" ? (
                                    /* LÓGICA DE CANAL CON LOGO */
                                    match.channelLogo ? (
                                        <div className="w-16 h-16 md:w-20 md:h-20 relative flex items-center justify-center">
                                            <img src={match.channelLogo} alt={match.channelName} className="max-w-full max-h-full object-contain drop-shadow-xl filter brightness-110 group-hover/card:scale-110 transition-transform duration-500" />
                                        </div>
                                    ) : (
                                        /* Fallback si el canal aún no tiene logo en BD */
                                        <div className="flex flex-col items-center justify-center gap-1">
                                            <Tv className="w-6 h-6 text-purple-400 mb-1 opacity-80" />
                                            <h4 className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 text-sm md:text-lg italic leading-tight w-full truncate">
                                                {match.channelName}
                                            </h4>
                                        </div>
                                    )
                                ) : (
                                    /* LÓGICA DE PARTIDO NORMAL */
                                    <div className="flex flex-col items-center justify-center w-full gap-1">
                                        <h4 className="font-bold text-white text-[11px] md:text-sm leading-tight truncate w-full">{match.homeTeam}</h4>
                                        <span className="text-[8px] font-black italic text-cyan-500/80 bg-cyan-500/10 px-2 py-0.5 rounded-full">VS</span>
                                        <h4 className="font-bold text-gray-400 text-[11px] md:text-sm leading-tight truncate w-full">{match.awayTeam}</h4>
                                    </div>
                                )}
                            </div>

                            {/* Barra inferior estética */}
                            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 to-purple-600 transform scale-x-0 group-hover/card:scale-x-100 transition-transform duration-500 origin-center"></div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Flecha Derecha (Glassmorphism) */}
            <button 
                onClick={() => scroll("right")}
                className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-30 bg-black/40 backdrop-blur-xl border border-white/10 hover:bg-white/10 text-white p-3 rounded-full opacity-0 group-hover/carousel:opacity-100 transition-all items-center justify-center shadow-[0_4px_24px_rgba(0,0,0,0.5)] active:scale-95"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
            </button>
        </div>
    );
}

export default function LiveSection() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const isAdmin = user?.email === "kevinfer.mt@gmail.com"; 
  const bannerScrollRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(
        collection(db, "matches"), 
        where("isLive", "==", true),
        orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMatches(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const hasSeen = localStorage.getItem("socialbet_adblock_warning");
    if (!hasSeen) setShowDisclaimer(true);
  }, []);

  const handleAcceptDisclaimer = () => {
      localStorage.setItem("socialbet_adblock_warning", "true");
      setShowDisclaimer(false);
  };

  const handleDelete = async (e, id) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    if (!confirm("¿Seguro quieres BORRAR este partido?")) return;
    try {
        await deleteDoc(doc(db, "matches", id));
        toast.success("Partido eliminado");
    } catch (error) { toast.error("Error al eliminar"); }
  };

  const handleEditTime = async (e, id, currentTime) => {
    e.preventDefault(); e.stopPropagation();
    const newTime = prompt("Actualizar Tiempo/Estado:", currentTime);
    if (newTime !== null) {
        await updateDoc(doc(db, "matches", id), { time: newTime });
        toast.success("Tiempo actualizado");
    }
  };

  const handleEditLink = async (e, id) => {
    e.preventDefault(); e.stopPropagation();
    const newLink = prompt("Nuevo Link del Video (Embed):");
    if (newLink) {
        await updateDoc(doc(db, "matches", id), { videoUrl: newLink });
        toast.success("Señal actualizada");
    }
  };

  const scrollBanner = (direction) => {
      if (bannerScrollRef.current) {
          const { current } = bannerScrollRef;
          const scrollAmount = direction === "left" ? -window.innerWidth * 0.8 : window.innerWidth * 0.8;
          current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
  };

  // --- FILTROS ---
  const bannerMatches = matches.filter(m => m.category === "Banner" && m.type !== "channel");
  const fallbackBanner = matches.filter(m => m.type !== "channel").slice(0, 3);
  const displayBanner = bannerMatches.length > 0 ? bannerMatches : fallbackBanner;
  
  const canalesPrincipales = matches.filter(m => m.category === "Principales" || !m.category);
  const canalesEcuatorianos = matches.filter(m => m.category === "Ecuatorianos");
  const canalesSudamerica = matches.filter(m => m.category === "Sudamerica");
  const canalesColombia = matches.filter(m => m.category === "Colombia");
  const canalesPeru = matches.filter(m => m.category === "Peru");
  const canalesMexico = matches.filter(m => m.category === "Mexico");
  
  const knownCategories = ["Banner", "Principales", "Ecuatorianos", "Sudamerica", "Colombia", "Peru", "Mexico", "Otros"];
  const canalesOtros = matches.filter(m => m.category === "Otros" || (m.category && !knownCategories.includes(m.category)));

  if (loading) return <div className="text-center py-20 flex flex-col items-center justify-center gap-4 animate-pulse"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div><span className="text-gray-500 text-xs font-bold uppercase tracking-widest">Sintonizando...</span></div>;

  return (
    <div className="flex flex-col gap-8 relative px-2 md:px-0">
      
      {/* --- MODAL DE AVISO ESTILO APPLE --- */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="bg-gray-900/80 backdrop-blur-3xl border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm w-full relative animate-in zoom-in-95 duration-300 text-center">
                <Info className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                <h3 className="text-xl font-black text-white mb-2">Aviso Importante</h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-8">
                    Las transmisiones son enlaces públicos y no están alojados aquí. Usa un navegador con <strong className="text-purple-400">AdBlock</strong> para evitar publicidad molesta.
                </p>
                <button onClick={handleAcceptDisclaimer} className="w-full bg-white text-black font-bold py-3.5 rounded-2xl hover:bg-gray-200 transition-transform active:scale-95">
                    Entendido
                </button>
            </div>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <div className="flex items-center justify-between mt-2 mb-2">
        <h3 className="font-black text-white text-2xl flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.8)]"></span>
            Directo
        </h3>
        <span className="text-cyan-400 text-[10px] font-black bg-cyan-400/10 border border-cyan-400/20 px-3 py-1.5 rounded-full uppercase tracking-widest">
            {matches.length} Señales
        </span>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-20 bg-gray-900/30 rounded-3xl border border-white/5 text-gray-500 backdrop-blur-sm">
            <Tv className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-sm font-bold tracking-wide">No hay transmisiones activas</p>
        </div>
      ) : (
        <>
            {/* 1. SLIDER BANNER PREMIUM */}
            {displayBanner.length > 0 && (
                <div className="relative w-full group/banner mb-4">
                    {displayBanner.length > 1 && (
                        <>
                            <button onClick={() => scrollBanner("left")} className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/30 backdrop-blur-xl border border-white/10 hover:bg-white/10 text-white p-3 rounded-full opacity-0 group-hover/banner:opacity-100 transition-all items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                            </button>
                            <button onClick={() => scrollBanner("right")} className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/30 backdrop-blur-xl border border-white/10 hover:bg-white/10 text-white p-3 rounded-full opacity-0 group-hover/banner:opacity-100 transition-all items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                            </button>
                        </>
                    )}

                    <div ref={bannerScrollRef} className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] scroll-smooth">
                        {displayBanner.map((match) => (
                            <Link href={`/match/${match.id}`} key={`banner-${match.id}`} className="snap-center shrink-0 w-full md:w-[700px] xl:w-[900px] relative group block">
                                <div className="bg-gray-900/40 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 p-6 md:p-10 hover:border-cyan-500/50 transition-all h-[220px] md:h-[280px] flex flex-col justify-center relative overflow-hidden">
                                    
                                    {isAdmin && (
                                        <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 backdrop-blur-md p-1.5 rounded-xl border border-white/10">
                                            <button onClick={(e) => handleEditTime(e, match.id, match.time)} className="text-blue-400 hover:text-white p-1.5 rounded transition-colors">⏱️</button>
                                            <button onClick={(e) => handleEditLink(e, match.id)} className="text-yellow-400 hover:text-white p-1.5 rounded transition-colors">🔗</button>
                                            <button onClick={(e) => handleDelete(e, match.id)} className="text-red-400 hover:text-white p-1.5 rounded transition-colors">🗑️</button>
                                        </div>
                                    )}

                                    {/* Globos de luz difuminados (Efecto Apple) */}
                                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-600/20 blur-[100px] rounded-full group-hover:bg-purple-600/30 transition-all duration-700 pointer-events-none"></div>
                                    <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-cyan-600/20 blur-[100px] rounded-full group-hover:bg-cyan-600/30 transition-all duration-700 pointer-events-none"></div>
                                    
                                    <div className="relative z-10 flex flex-col h-full justify-between">
                                        <div className="flex justify-between items-center">
                                            <span className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] md:text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                                                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></span>
                                                {match.time}
                                            </span>
                                            <PlayCircle className="w-8 h-8 text-white/50 group-hover:text-cyan-400 transition-colors duration-500" strokeWidth={1.5} />
                                        </div>
                                        <div className="flex items-center justify-between gap-4 mt-auto">
                                            <h4 className="font-black text-white text-xl md:text-4xl flex-1 truncate">{match.homeTeam}</h4>
                                            <span className="text-gray-500 font-black text-sm md:text-2xl px-2 opacity-50">VS</span>
                                            <h4 className="font-black text-white text-xl md:text-4xl flex-1 text-right truncate">{match.awayTeam}</h4>
                                        </div>
                                        <span className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest mt-3">{match.league}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

                        {/* CARRUSELES DINÁMICOS REDISEÑADOS */}
            <CarouselRow title="💎 Principales" items={canalesPrincipales} isAdmin={isAdmin} handleDelete={handleDelete} handleEditTime={handleEditTime} handleEditLink={handleEditLink} />
            <CarouselRow title="🇪🇨 Ecuador" items={canalesEcuatorianos} isAdmin={isAdmin} handleDelete={handleDelete} handleEditTime={handleEditTime} handleEditLink={handleEditLink} />
            <CarouselRow title="🌎 Sudamérica" items={canalesSudamerica} isAdmin={isAdmin} handleDelete={handleDelete} handleEditTime={handleEditTime} handleEditLink={handleEditLink} />
            <CarouselRow title="🇨🇴 Colombia" items={canalesColombia} isAdmin={isAdmin} handleDelete={handleDelete} handleEditTime={handleEditTime} handleEditLink={handleEditLink} />
            <CarouselRow title="🇵🇪 Perú" items={canalesPeru} isAdmin={isAdmin} handleDelete={handleDelete} handleEditTime={handleEditTime} handleEditLink={handleEditLink} />
            <CarouselRow title="🇲🇽 México" items={canalesMexico} isAdmin={isAdmin} handleDelete={handleDelete} handleEditTime={handleEditTime} handleEditLink={handleEditLink} />
            <CarouselRow title="🌐 Otros Eventos" items={canalesOtros} isAdmin={isAdmin} handleDelete={handleDelete} handleEditTime={handleEditTime} handleEditLink={handleEditLink} />
        </>
      )}
    </div>
  );
}

