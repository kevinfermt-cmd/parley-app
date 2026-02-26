// app/match/[id]/page.js
"use client";
import { useState, useEffect, useRef } from "react";
import { db, auth } from "../../../src/lib/firebase"; 
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useParams } from "next/navigation";
import Link from "next/link";
import ChatRoom from "../../../src/components/ChatRoom";

export default function MatchPage() {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [user, setUser] = useState(null);
  
  const videoContainerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchMatch = async () => {
        const docRef = doc(db, "matches", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setMatch(docSnap.data());
    };
    fetchMatch();
  }, [id]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
        if (videoContainerRef.current?.requestFullscreen) {
            videoContainerRef.current.requestFullscreen();
            setIsFullscreen(true);
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  if (!match) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-gray-500 gap-4">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
        <p className="font-bold animate-pulse">Preparando la señal...</p>
    </div>
  );

  const isChannel = match.type === "channel";

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-20">
      
      {/* --- NAVBAR SUPERIOR --- */}
      <div className="bg-gray-900/90 backdrop-blur-md border-b border-gray-800 px-4 py-3 sticky top-0 z-40 flex items-center gap-4 shadow-xl">
        <Link href="/" className="text-gray-400 hover:text-cyan-400 bg-gray-800/50 p-2 rounded-xl transition-all flex items-center gap-2 group">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 group-hover:-translate-x-1 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <span className="text-xs font-bold hidden md:inline">Volver al Inicio</span>
        </Link>
        
        <div className="flex-1 min-w-0 flex items-center justify-between">
            <div>
                {isChannel ? (
                     <h1 className="font-black text-sm md:text-xl text-cyan-400 truncate italic uppercase tracking-tight">
                        {match.channelName}
                    </h1>
                ) : (
                    <h1 className="font-black text-sm md:text-lg text-white truncate uppercase tracking-tight flex items-center gap-2">
                        {match.homeTeam} <span className="text-cyan-500 italic text-[10px] md:text-sm">VS</span> {match.awayTeam}
                    </h1>
                )}
                
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]"></span>
                    <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest">
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
                Modo TV
            </button>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto flex flex-col xl:flex-row h-auto xl:h-[calc(100vh-65px)]">
          
          {/* 🎥 REPRODUCTOR DE VIDEO */}
          <div className="w-full xl:w-[75%] bg-black relative flex flex-col justify-center border-b xl:border-b-0 xl:border-r border-gray-800 z-10">
            
            <div ref={videoContainerRef} className={`relative w-full bg-black flex items-center justify-center ${isFullscreen ? 'h-screen' : 'aspect-video xl:h-full'}`}>
                {match.videoUrl ? (
                    <iframe 
                        src={match.videoUrl} 
                        className="w-full h-full absolute inset-0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" 
                        sandbox="allow-scripts allow-same-origin allow-presentation" /* <--- LA PRISIÓN ANTI POP-UPS */
                        allowFullScreen
                    ></iframe>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-3">
                        <div className="relative">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 md:w-24 md:h-24 opacity-20">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-cyan-500 animate-ping text-xl md:text-3xl">📡</span>
                        </div>
                        <p className="text-xs md:text-sm font-black uppercase tracking-widest text-gray-500">Esperando señal de origen...</p>
                    </div>
                )}
                
                {match.videoUrl && !isFullscreen && (
                    <button 
                        onClick={toggleFullScreen}
                        className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/90 border border-gray-600/50 text-white p-2.5 rounded-lg backdrop-blur-md opacity-0 hover:opacity-100 transition-opacity z-20 flex items-center gap-2 group"
                        title="Pantalla Completa"
                    >
                        <span className="text-xs font-bold text-gray-300 group-hover:text-white hidden md:block px-1">Expandir</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-cyan-400">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                        </svg>
                    </button>
                )}
            </div>
          </div>

          {/* --- PANEL LATERAL / INFERIOR --- */}
          <div className="w-full xl:w-[25%] flex flex-col bg-gray-950 overflow-hidden h-full">
              
              <div className="p-4 md:p-6 shrink-0 border-b border-gray-900 bg-gray-950 z-20 shadow-sm">
                  {isChannel ? (
                      <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-2xl shadow-lg border border-gray-800 text-center relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full"></div>
                          <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-1">Viendo Canal</p>
                          <h4 className="font-black text-cyan-400 text-2xl md:text-3xl italic uppercase leading-tight">{match.channelName}</h4>
                      </div>
                  ) : (
                      <div className="bg-gray-900 p-4 md:p-6 rounded-2xl shadow-lg border border-gray-800 flex justify-between items-center relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
                          
                          <div className="flex-1 text-center">
                              <h4 className="font-black text-white text-sm md:text-lg uppercase leading-tight line-clamp-2">{match.homeTeam}</h4>
                              <span className="text-[9px] md:text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-1 block">Local</span>
                          </div>

                          <div className="flex flex-col items-center px-2 md:px-4">
                              <div className="bg-gray-950 px-3 py-1.5 md:px-4 md:py-2 rounded-xl border border-gray-800 font-black text-cyan-400 text-sm md:text-lg italic shadow-inner">
                                  VS
                              </div>
                          </div>

                          <div className="flex-1 text-center">
                              <h4 className="font-black text-white text-sm md:text-lg uppercase leading-tight line-clamp-2">{match.awayTeam}</h4>
                              <span className="text-[9px] md:text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-1 block">Visita</span>
                          </div>
                      </div>
                  )}
                  
                  <div className="hidden md:flex mt-4 bg-gradient-to-br from-cyan-900/10 to-gray-900 p-4 rounded-2xl border border-cyan-900/30 items-center gap-3">
                      <span className="text-xl drop-shadow-md">🔥</span>
                      <p className="text-cyan-100/90 text-[11px] font-bold leading-relaxed">
                          ¿Ves un ganador claro? <br/>
                          <span className="text-gray-500 font-medium">Comenta tu análisis en el chat y ayuda a la comunidad.</span>
                      </p>
                  </div>
              </div>

              <div className="flex-1 min-h-[400px] xl:min-h-0 bg-gray-950 relative">
                  <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-4">
                      <ChatRoom matchId={id} user={user} />
                  </div>
              </div>

          </div>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #030712; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #1f2937; 
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: #374151; 
        }
      `}</style>
    </div>
  );
}