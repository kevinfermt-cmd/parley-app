// app/match/[id]/page.js
"use client";
import { useState, useEffect, useRef } from "react";
import { db, auth } from "../../../src/lib/firebase"; 
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ChatRoom from "../../../src/components/ChatRoom";
import { App } from '@capacitor/app'; // PLUGIN PARA EL BOTÓN ATRÁS

export default function MatchPage() {
  const { id } = useParams();
  const router = useRouter();
  const [match, setMatch] = useState(null);
  const [user, setUser] = useState(null);
  
  const videoContainerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // MANEJO INTELIGENTE DEL BOTÓN ATRÁS (TV/ANDROID)
  useEffect(() => {
    if (typeof window === "undefined" || !window.Capacitor?.isNativePlatform()) return;

    const backButtonListener = App.addListener('backButton', ({ canGoBack }) => {
        if (document.fullscreenElement) {
            document.exitFullscreen(); // Si está en fullscreen, solo lo quita
        } else if (canGoBack) {
            router.back(); // Si no, vuelve a la página anterior
        } else {
            App.exitApp();
        }
    });

    return () => {
        backButtonListener.then(listener => listener.remove());
    };
  }, [router]);

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

  // ESCUDO ANTI POP-UPS (APP)
  useEffect(() => {
    if (typeof window !== "undefined" && window.Capacitor?.isNativePlatform()) {
        window.open = function() {
            console.log("Pop-up bloqueado 🛡️");
            return null;
        };
    }
  }, []);
  
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
    <div className="bg-gray-950 text-gray-100 flex flex-col h-screen w-full overflow-hidden">
      
      {/* --- NAVBAR SUPERIOR --- */}
      <div className="bg-gray-900/95 backdrop-blur-md border-b border-gray-800 px-4 py-2 shrink-0 z-40 flex items-center gap-4 shadow-xl">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-cyan-400 bg-gray-800/50 p-2 rounded-xl transition-all flex items-center gap-2 group">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 group-hover:-translate-x-1 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
        </button>
        
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
                Modo Cine
            </button>
        </div>
      </div>

      {/* --- GRID PRINCIPAL (No permite scroll global) --- */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 w-full">
          
          {/* 🎥 REPRODUCTOR DE VIDEO (75% en PC, 100% en móvil) */}
          <div className="w-full lg:w-[70%] xl:w-[75%] bg-black relative flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-gray-800 z-10">
            
            <div ref={videoContainerRef} className={`relative w-full h-full bg-black flex items-center justify-center group/video ${isFullscreen ? '' : 'aspect-video lg:aspect-auto'}`}>
                {match.videoUrl ? (
                    <iframe 
                        src={match.videoUrl} 
                        className="w-full h-full absolute inset-0 focus:outline-none" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" 
                        allowFullScreen
                    ></iframe>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-3">
                        <span className="text-cyan-500 animate-ping text-3xl">📡</span>
                        <p className="text-sm font-black uppercase tracking-widest text-gray-500">Esperando señal...</p>
                    </div>
                )}
                
                {match.videoUrl && !isFullscreen && (
                    <button 
                        onClick={toggleFullScreen}
                        className="absolute bottom-6 right-6 bg-black/70 hover:bg-cyan-600 border border-gray-500 text-white p-3 rounded-full backdrop-blur-md opacity-0 group-hover/video:opacity-100 transition-all z-20 flex items-center gap-2"
                        title="Pantalla Completa"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                        </svg>
                    </button>
                )}
            </div>
          </div>

          {/* --- PANEL LATERAL / INFERIOR (25% en PC) --- */}
          <div className="w-full lg:w-[30%] xl:w-[25%] flex flex-col bg-gray-950 overflow-hidden shrink-0 lg:shrink">
              
              <div className="p-4 shrink-0 border-b border-gray-900 bg-gray-950 z-20">
                  {isChannel ? (
                      <div className="bg-gradient-to-br from-gray-900 to-black p-4 rounded-xl shadow-md border border-gray-800 text-center relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] rounded-full"></div>
                          <h4 className="font-black text-cyan-400 text-xl italic uppercase leading-tight relative z-10">{match.channelName}</h4>
                      </div>
                  ) : (
                      <div className="bg-gray-900 p-3 rounded-xl shadow-md border border-gray-800 flex justify-between items-center relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
                          
                          <div className="flex-1 text-center">
                              <h4 className="font-black text-white text-sm uppercase leading-tight line-clamp-2">{match.homeTeam}</h4>
                          </div>

                          <div className="flex flex-col items-center px-2">
                              <div className="bg-gray-950 px-3 py-1 rounded-lg border border-gray-800 font-black text-cyan-400 text-xs italic shadow-inner">VS</div>
                          </div>

                          <div className="flex-1 text-center">
                              <h4 className="font-black text-white text-sm uppercase leading-tight line-clamp-2">{match.awayTeam}</h4>
                          </div>
                      </div>
                  )}
              </div>

              {/* Chat Container (Aislado para que solo haga scroll aquí adentro) */}
              <div className="flex-1 relative bg-gray-950 min-h-[300px] lg:min-h-0">
                  <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-2 md:p-4">
                      <ChatRoom matchId={id} user={user} />
                  </div>
              </div>

          </div>
      </div>
      
      {/* 🛑 BLOQUEO GLOBAL DEL SCROLL EN ESTA PANTALLA */}
      <style jsx global>{`
        body {
            overflow: hidden !important;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #030712; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #1f2937; border-radius: 10px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #374151; }
      `}</style>
    </div>
  );
}