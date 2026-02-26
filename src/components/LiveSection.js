// src/components/LiveSection.js
"use client";
import { useState, useEffect, useRef } from "react";
import { db, auth } from "../lib/firebase"; 
import { collection, query, orderBy, onSnapshot, where, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import toast from "react-hot-toast"; 

// --- COMPONENTE AUXILIAR: CARRUSEL CON FLECHAS ---
function CarouselRow({ title, items, isAdmin, handleDelete, handleEditTime, handleEditLink, cardType }) {
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
        <div className="w-full relative group/carousel">
            {title && (
                <h3 className="text-sm font-bold text-gray-400 mb-3 px-2 uppercase tracking-wide flex items-center gap-2">
                    {title}
                </h3>
            )}

            {/* Flecha Izquierda (PC) */}
            <button 
                onClick={() => scroll("left")}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-black/60 hover:bg-black/90 text-white p-3 rounded-r-xl opacity-0 group-hover/carousel:opacity-100 transition-opacity items-center justify-center h-24 backdrop-blur-sm"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
            </button>

            {/* Contenedor del Scroll */}
            <div 
                ref={scrollRef}
                className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-4 px-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] scroll-smooth"
            >
                {items.map((match) => (
                    <Link href={`/match/${match.id}`} key={match.id} className="snap-start shrink-0 w-[160px] md:w-[200px] group relative block">
                        <div className={`
                            rounded-xl border p-4 transition-all h-[140px] flex flex-col relative overflow-hidden
                            ${cardType === 'ecuador' || cardType === 'colombia' || cardType === 'mexico'
                                ? "bg-gradient-to-br from-yellow-900/20 to-blue-900/20 border-gray-800 hover:border-yellow-500/80 hover:ring-2 hover:ring-yellow-500/30" 
                                : "bg-gray-900 border-gray-800 hover:border-cyan-500/80 hover:ring-2 hover:ring-cyan-500/30"}
                        `}>
                            
                            {/* Admin Tools Cards */}
                            {isAdmin && (
                                <div className="absolute top-1 right-1 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => handleEditTime(e, match.id, match.time)} className="bg-blue-600/80 text-white p-1 rounded text-[10px]">⏱️</button>
                                    <button onClick={(e) => handleEditLink(e, match.id)} className="bg-yellow-600/80 text-white p-1 rounded text-[10px]">🔗</button>
                                    <button onClick={(e) => handleDelete(e, match.id)} className="bg-red-600/80 text-white p-1 rounded text-[10px]">🗑️</button>
                                </div>
                            )}

                            <div className="flex justify-between items-center mb-2 relative z-10">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(220,38,38,0.8)]"></span>
                                <span className="text-[10px] text-gray-400 font-bold">{match.time}</span>
                            </div>
                            
                            {/* LÓGICA DE DIBUJADO: Partido vs Canal */}
                            <div className="flex-1 flex flex-col justify-center items-center text-center relative z-10 w-full">
                                {match.type === "channel" ? (
                                     <h4 className="font-black text-cyan-400 text-lg md:text-xl italic leading-tight w-full truncate">{match.channelName}</h4>
                                ) : (
                                    <>
                                        <h4 className="font-black text-gray-100 text-sm leading-tight line-clamp-2 w-full">{match.homeTeam}</h4>
                                        <span className={`text-[9px] font-black italic my-0.5 ${cardType === 'ecuador' || cardType === 'colombia' ? 'text-yellow-500' : 'text-cyan-500'}`}>VS</span>
                                        <h4 className="font-black text-gray-100 text-sm leading-tight line-clamp-2 w-full">{match.awayTeam}</h4>
                                    </>
                                )}
                            </div>

                            <div className={`absolute bottom-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left
                                ${cardType === 'ecuador' || cardType === 'colombia' || cardType === 'mexico' ? 'bg-gradient-to-r from-yellow-500 to-blue-600' : 'bg-gradient-to-r from-cyan-600 to-blue-600'}
                            `}></div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Flecha Derecha (PC) */}
            <button 
                onClick={() => scroll("right")}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-black/60 hover:bg-black/90 text-white p-3 rounded-l-xl opacity-0 group-hover/carousel:opacity-100 transition-opacity items-center justify-center h-24 backdrop-blur-sm"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
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
        toast.success("Partido eliminado 🗑️");
    } catch (error) { toast.error("Error al eliminar"); }
  };

  const handleEditTime = async (e, id, currentTime) => {
    e.preventDefault(); e.stopPropagation();
    const newTime = prompt("Actualizar Tiempo/Estado:", currentTime);
    if (newTime !== null) {
        await updateDoc(doc(db, "matches", id), { time: newTime });
        toast.success("Tiempo actualizado ⏱️");
    }
  };

  const handleEditLink = async (e, id) => {
    e.preventDefault(); e.stopPropagation();
    const newLink = prompt("Nuevo Link del Video (Embed):");
    if (newLink) {
        await updateDoc(doc(db, "matches", id), { videoUrl: newLink });
        toast.success("Señal actualizada 📡");
    }
  };

  const scrollBanner = (direction) => {
      if (bannerScrollRef.current) {
          const { current } = bannerScrollRef;
          const scrollAmount = direction === "left" ? -window.innerWidth * 0.8 : window.innerWidth * 0.8;
          current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
  };


  // --- LÓGICA ESTRICTA DE FILTRADO ---
  
  // 1. BANNER: SOLO Partidos. Prioridad Categoría "Banner", sino toma los 3 más recientes.
  const bannerMatches = matches.filter(m => m.category === "Banner" && m.type !== "channel");
  const fallbackBanner = matches.filter(m => m.type !== "channel").slice(0, 3);
  const displayBanner = bannerMatches.length > 0 ? bannerMatches : fallbackBanner;
  
  // 2. FILAS ESPECÍFICAS
  const canalesPrincipales = matches.filter(m => m.category === "Principales" || !m.category); // Fallback histórico
  const canalesEcuatorianos = matches.filter(m => m.category === "Ecuatorianos");
  const canalesSudamerica = matches.filter(m => m.category === "Sudamerica");
  const canalesColombia = matches.filter(m => m.category === "Colombia");
  const canalesPeru = matches.filter(m => m.category === "Peru");
  const canalesMexico = matches.filter(m => m.category === "Mexico");
  
  // 3. CAJÓN DE SASTRE (Para todo lo demás o lo etiquetado como "Otros")
  const knownCategories = ["Banner", "Principales", "Ecuatorianos", "Sudamerica", "Colombia", "Peru", "Mexico", "Otros"];
  const canalesOtros = matches.filter(m => m.category === "Otros" || (m.category && !knownCategories.includes(m.category)));

  if (loading) return <div className="text-center py-10 animate-pulse text-gray-500 font-medium">Cargando señales... 📺</div>;

  return (
    <div className="flex flex-col gap-6 relative">
      
      {/* --- MODAL DE AVISO --- */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-gray-900 border border-gray-700 p-6 rounded-2xl shadow-2xl max-w-sm w-full relative animate-in zoom-in-95 duration-300">
                <div className="flex justify-center mb-4">
                    <div className="bg-yellow-500/10 p-3 rounded-full border border-yellow-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-yellow-500"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                    </div>
                </div>
                <h3 className="text-xl font-black text-white text-center mb-2">Aviso Importante</h3>
                <p className="text-gray-400 text-sm text-center leading-relaxed mb-6">
                    Las transmisiones son enlaces públicos recopilados de internet y <strong>no están alojados en SocialBet</strong>.
                    <br/><br/>
                    <span className="text-yellow-400 font-bold">⚠️ RECOMENDACIÓN:</span> Usa un navegador con <strong>AdBlock</strong> para evitar publicidad externa.
                </p>
                <button onClick={handleAcceptDisclaimer} className="w-full bg-cyan-600 text-white font-bold py-3 rounded-xl hover:bg-cyan-500 transition shadow-lg shadow-cyan-900/20">
                    Entendido, gracias
                </button>
            </div>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <div className="flex items-center justify-between px-2">
        <h3 className="font-bold text-white text-xl flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
            TV en Vivo
        </h3>
        <span className="text-red-500 text-[10px] font-black bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full uppercase tracking-tighter">
            {matches.length} SEÑALES
        </span>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-12 bg-gray-900 rounded-2xl border-2 border-dashed border-gray-800 text-gray-500 mx-1">
            <div className="text-3xl mb-2">📺</div>
            <p className="text-sm font-medium">No hay transmisiones activas ahora.</p>
        </div>
      ) : (
        <>
            {/* 1. SLIDER BANNER (SOLO PARTIDOS) */}
            {displayBanner.length > 0 && (
                <div className="relative w-full group/banner">
                    {displayBanner.length > 1 && (
                        <>
                            <button onClick={() => scrollBanner("left")} className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover/banner:opacity-100 transition-opacity items-center justify-center backdrop-blur-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                            </button>
                            <button onClick={() => scrollBanner("right")} className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-30 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover/banner:opacity-100 transition-opacity items-center justify-center backdrop-blur-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                            </button>
                        </>
                    )}

                    <div ref={bannerScrollRef} className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 px-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] scroll-smooth">
                        {displayBanner.map((match) => (
                            <Link href={`/match/${match.id}`} key={`banner-${match.id}`} className="snap-center shrink-0 w-[85vw] md:w-[600px] xl:w-[800px] relative group block">
                                <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-xl border border-gray-800 p-6 md:p-8 hover:border-cyan-500 transition-all h-40 md:h-56 flex flex-col justify-center relative overflow-hidden">
                                    
                                    {isAdmin && (
                                        <div className="absolute top-2 right-2 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => handleEditTime(e, match.id, match.time)} className="bg-blue-600/80 text-white p-1.5 rounded text-xs hover:bg-blue-500">⏱️</button>
                                            <button onClick={(e) => handleEditLink(e, match.id)} className="bg-yellow-600/80 text-white p-1.5 rounded text-xs hover:bg-yellow-500">🔗</button>
                                            <button onClick={(e) => handleDelete(e, match.id)} className="bg-red-600/80 text-white p-1.5 rounded text-xs hover:bg-red-500">🗑️</button>
                                        </div>
                                    )}

                                    <div className="absolute -right-10 -bottom-10 w-32 h-32 md:w-48 md:h-48 bg-cyan-500/20 blur-3xl rounded-full group-hover:bg-cyan-500/30 transition-all"></div>
                                    
                                    <div className="relative z-10 flex flex-col h-full justify-between">
                                        <div className="flex justify-between items-center">
                                            <span className="bg-red-600 text-white text-[9px] md:text-xs font-black px-2 py-0.5 rounded shadow-[0_0_8px_rgba(220,38,38,0.8)] animate-pulse">EN VIVO</span>
                                            <span className="text-cyan-400 text-xs md:text-sm font-bold">{match.time}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 mt-2">
                                            <h4 className="font-black text-white text-lg md:text-3xl flex-1 truncate">{match.homeTeam}</h4>
                                            <span className="text-gray-500 font-black italic text-sm md:text-xl px-2">VS</span>
                                            <h4 className="font-black text-white text-lg md:text-3xl flex-1 text-right truncate">{match.awayTeam}</h4>
                                        </div>
                                        <span className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-widest mt-2">{match.league}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* CARRUSELES DINÁMICOS */}
            
            <CarouselRow 
                title="📺 Canales Principales" 
                items={canalesPrincipales} 
                isAdmin={isAdmin} handleDelete={handleDelete} handleEditTime={handleEditTime} handleEditLink={handleEditLink} cardType="main" 
            />

            <CarouselRow 
                title="🇪🇨 Ecuador" 
                items={canalesEcuatorianos} 
                isAdmin={isAdmin} handleDelete={handleDelete} handleEditTime={handleEditTime} handleEditLink={handleEditLink} cardType="ecuador" 
            />
            
            <CarouselRow 
                title="🌎 Sudamérica" 
                items={canalesSudamerica} 
                isAdmin={isAdmin} handleDelete={handleDelete} handleEditTime={handleEditTime} handleEditLink={handleEditLink} cardType="other" 
            />
            
            <CarouselRow 
                title="🇨🇴 Colombia" 
                items={canalesColombia} 
                isAdmin={isAdmin} handleDelete={handleDelete} handleEditTime={handleEditTime} handleEditLink={handleEditLink} cardType="colombia" 
            />
            
            <CarouselRow 
                title="🇵🇪 Perú" 
                items={canalesPeru} 
                isAdmin={isAdmin} handleDelete={handleDelete} handleEditTime={handleEditTime} handleEditLink={handleEditLink} cardType="other" 
            />
            
            <CarouselRow 
                title="🇲🇽 México" 
                items={canalesMexico} 
                isAdmin={isAdmin} handleDelete={handleDelete} handleEditTime={handleEditTime} handleEditLink={handleEditLink} cardType="mexico" 
            />

            <CarouselRow 
                title="🌐 Otros Eventos" 
                items={canalesOtros} 
                isAdmin={isAdmin} handleDelete={handleDelete} handleEditTime={handleEditTime} handleEditLink={handleEditLink} cardType="other" 
            />
        </>
      )}
    </div>
  );
}