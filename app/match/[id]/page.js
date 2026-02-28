// app/match/[id]/page.js
"use client";
import { useState, useEffect, useRef } from "react";
import { db, auth } from "../../../src/lib/firebase"; 
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ChatRoom from "../../../src/components/ChatRoom";
import { App } from '@capacitor/app';

export default function MatchPage() {
  const { id } = useParams();
  const router = useRouter();
  const [match, setMatch] = useState(null);
  const [user, setUser] = useState(null);
  
  const videoContainerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ==========================================
  // ESCUDO ANTI-SCROLL FANTASMA (AGRESIVO)
  // ==========================================
  useEffect(() => {
    // Forzamos el inicio arriba
    window.scrollTo(0, 0);
    
    // Si algo intenta hacer scroll hacia abajo, lo devolvemos a 0
    const lockScroll = () => {
        if (window.scrollY > 0) {
            window.scrollTo(0, 0);
        }
    };

    // Activamos el bloqueo protector
    window.addEventListener('scroll', lockScroll);
    
    // Desactivamos el bloqueo después de 1.5 segundos (cuando el chat ya cargó)
    const unlockTimer = setTimeout(() => {
        window.removeEventListener('scroll', lockScroll);
    }, 1500);

    return () => {
        window.removeEventListener('scroll', lockScroll);
        clearTimeout(unlockTimer);
    };
  }, []);

  // Botón Atrás (Android)
  useEffect(() => {
    if (typeof window === "undefined" || !window.Capacitor?.isNativePlatform()) return;
    const backButtonListener = App.addListener('backButton', ({ canGoBack }) => {
        if (document.fullscreenElement) { document.exitFullscreen(); } 
        else if (canGoBack) { router.back(); } 
        else { App.exitApp(); }
    });
    return () => { backButtonListener.then(listener => listener.remove()); };
  }, [router]);

  // Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // Fetch Match Data
  useEffect(() => {
    if (!id) return;
    const fetchMatch = async () => {
        const docRef = doc(db, "matches", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setMatch(docSnap.data());
    };
    fetchMatch();
  }, [id]);

  // Escudo anti pop-ups (App)
  useEffect(() => {
    if (typeof window !== "undefined" && window.Capacitor?.isNativePlatform()) {
        window.open = function() { return null; };
    }
  }, []);
  
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
        if (videoContainerRef.current?.requestFullscreen) { videoContainerRef.current.requestFullscreen(); setIsFullscreen(true); }
    } else {
        if (document.exitFullscreen) { document.exitFullscreen(); setIsFullscreen(false); }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => { setIsFullscreen(!!document.fullscreenElement); };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  if (!match) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-gray-500 gap-4">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
        <p className="font-black tracking-widest">Cargando...</p>
    </div>
  );

  const isChannel = match.type === "channel";

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pb-10">
      
      {/* NAVBAR */}
      <div className="bg-gray-900/95 backdrop-blur-md border-b border-gray-800 px-4 py-3 sticky top-0 z-40 flex items-center gap-4 shadow-xl">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-cyan-400 bg-gray-800/50 p-2 rounded-xl transition-all flex items-center gap-2 group">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 group-hover:-translate-x-1 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
        </button>
        
        <div className="flex-1 min-w-0 flex items-center justify-between">
            <div>
                {isChannel ? (
                     <h1 className="font-black text-base md:text-xl text-cyan-400 truncate uppercase tracking-tight">
                        {match.channelName}
                    </h1>
                ) : (
                    <h1 className="font-black text-base md:text-xl text-white truncate uppercase tracking-tight flex items-center gap-2">
                        {match.homeTeam} <span className="text-cyan-500 text-[10px] md:text-sm">VS</span> {match.awayTeam}
                    </h1>
                )}
                
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                        {match.league || match.category} <span className="text-gray-600 px-1">•</span> <span className="text-gray-300">{match.time}</span>
                    </p>
                </div>
            </div>
            
            <button 
                onClick={toggleFullScreen}
                className="hidden md:flex items-center gap-2 bg-gray-800 hover:bg-cyan-900/50 text-cyan-400 border border-gray-700 hover:border-cyan-500 px-4 py-2 rounded-lg text-xs font-bold transition-all"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
                Modo Cine
            </button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-4 md:p-6 flex flex-col gap-6">
          
          <div className="flex flex-col lg:flex-row gap-6">
              
              {/* --- EL VIDEO --- */}
              <div className={`w-full ${!isChannel ? 'lg:w-[65%]' : 'lg:w-full'}`}>
                  <div ref={videoContainerRef} className={`relative w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800 group/video ${isFullscreen ? 'h-screen rounded-none' : 'aspect-video'}`}>
                      {match.videoUrl ? (
                          <iframe 
                              src={match.videoUrl} 
                              className="w-full h-full absolute inset-0" 
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" 
                              allowFullScreen
                          ></iframe>
                      ) : (
                          <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-3">
                              <span className="text-cyan-500 animate-ping text-4xl">📡</span>
                              <p className="text-sm font-black uppercase tracking-widest text-gray-500 mt-4">Esperando señal</p>
                          </div>
                      )}
                      
                      {match.videoUrl && !isFullscreen && (
                          <button 
                              onClick={toggleFullScreen}
                              className="absolute bottom-4 right-4 bg-black/70 hover:bg-cyan-600 border border-gray-500 text-white p-3 rounded-full backdrop-blur-md opacity-0 group-hover/video:opacity-100 transition-all z-20 shadow-lg"
                          >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                              </svg>
                          </button>
                      )}
                  </div>
              </div>

              {/* --- LAS ESTADÍSTICAS (Ahora lee "match.widgetUrl" dinámicamente) --- */}
              {!isChannel && (
                  <div className="w-full lg:w-[35%] bg-gray-900 rounded-2xl border border-gray-800 p-4 shadow-xl flex flex-col min-h-[400px]">
                      <div className="flex items-center gap-2 mb-4 shrink-0">
                          <span className="text-cyan-500">📊</span>
                          <h3 className="font-black text-gray-200 uppercase tracking-widest text-sm">Match Center</h3>
                      </div>
                      
                      <div className="flex-1 w-full bg-gray-950 rounded-lg overflow-hidden relative flex items-center justify-center">
                          {match.widgetUrl ? (
                              <iframe 
                                  src={match.widgetUrl}
                                  className="absolute inset-0 w-full h-full border-none"
                                  title="Estadísticas"
                                  sandbox="allow-scripts allow-same-origin"
                              />
                          ) : (
                              <div className="text-center text-gray-600 px-4">
                                  <span className="text-3xl mb-2 block opacity-50">📉</span>
                                  <p className="text-[10px] uppercase tracking-widest font-bold">Información de estadísticas<br/>no disponible</p>
                              </div>
                          )}
                      </div>
                  </div>
              )}
          </div>

          {/* --- MARCADOR --- */}
          {!isChannel && (
              <div className="w-full">
                  <div className="bg-gradient-to-r from-gray-900 via-gray-950 to-gray-900 p-6 md:p-8 rounded-2xl shadow-lg border border-gray-800 flex justify-between items-center relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600"></div>
                      
                      <div className="flex-1 text-center">
                          <h4 className="font-black text-white text-xl md:text-3xl uppercase leading-tight">{match.homeTeam}</h4>
                          <span className="text-xs text-gray-500 font-bold tracking-widest uppercase mt-2 block">Local</span>
                      </div>

                      <div className="flex flex-col items-center px-4 md:px-8 relative z-10">
                          <div className="bg-gray-950 px-6 py-3 rounded-xl border border-gray-800 font-black text-cyan-400 text-2xl md:text-3xl shadow-2xl">VS</div>
                      </div>

                      <div className="flex-1 text-center">
                          <h4 className="font-black text-white text-xl md:text-3xl uppercase leading-tight">{match.awayTeam}</h4>
                          <span className="text-xs text-gray-500 font-bold tracking-widest uppercase mt-2 block">Visita</span>
                      </div>
                  </div>
              </div>
          )}

          {/* --- CHAT EN VIVO --- */}
          <div className="w-full h-[600px] bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl flex flex-col relative overflow-hidden">
              <div className="bg-gray-950/80 backdrop-blur-sm p-4 border-b border-gray-800 flex items-center justify-between sticky top-0 z-10">
                  <h3 className="font-black text-gray-200 uppercase tracking-widest text-sm flex items-center gap-2">
                      <span className="text-cyan-500 animate-pulse">💬</span> Chat de la Comunidad
                  </h3>
                  <span className="text-[10px] bg-cyan-900/30 text-cyan-400 px-2 py-1 rounded-full font-bold border border-cyan-800">EN VIVO</span>
              </div>
              
              <div className="flex-1 relative bg-gray-950">
                  <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-2 md:p-4">
                      <ChatRoom matchId={id} user={user} />
                  </div>
              </div>
          </div>

      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #030712; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #1f2937; border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #374151; }
      `}</style>
    </div>
  );
}