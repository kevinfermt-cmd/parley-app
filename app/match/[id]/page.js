// app/match/[id]/page.js
"use client";
import { useState, useEffect } from "react";
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

  // Detectar usuario para el chat
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // Cargar datos del partido
  useEffect(() => {
    if (!id) return;
    const fetchMatch = async () => {
        const docRef = doc(db, "matches", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setMatch(docSnap.data());
    };
    fetchMatch();
  }, [id]);

  if (!match) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-gray-500 gap-4">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
        <p className="font-bold animate-pulse">Preparando la señal...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pb-20">
      
      {/* --- NAVBAR SUPERIOR MEJORADA (iOS Style Dark) --- */}
      <div className="bg-gray-900/90 backdrop-blur-md border-b border-gray-800 px-4 py-3 sticky top-0 z-50 flex items-center gap-4 shadow-xl">
        <Link href="/" className="text-gray-400 hover:text-cyan-400 bg-gray-800/50 p-2 rounded-xl transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
        </Link>
        
        <div className="flex-1 min-w-0">
            <h1 className="font-black text-sm md:text-base text-white truncate uppercase tracking-tight">
                {match.homeTeam} <span className="text-cyan-500 italic">vs</span> {match.awayTeam}
            </h1>
            <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    {match.league} • <span className="text-gray-300">{match.time}</span>
                </p>
            </div>
        </div>
      </div>

      {/* --- 🎥 REPRODUCTOR DE VIDEO (Efecto Cine) --- */}
      <div className="w-full aspect-video bg-black shadow-2xl relative border-b border-gray-800">
        {match.videoUrl ? (
             <iframe 
             src={match.videoUrl} 
             className="w-full h-full" 
             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
             allowFullScreen
           ></iframe>
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-3">
                <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 opacity-20">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-cyan-500 animate-ping">📡</span>
                </div>
                <p className="text-xs font-black uppercase tracking-widest">Esperando señal de origen...</p>
            </div>
        )}
      </div>

      {/* --- CUERPO DE LA PÁGINA --- */}
      <div className="max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Info y Marcador */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* CARD DE MARCADOR DARK */}
            <div className="bg-gray-900 p-6 rounded-2xl shadow-lg border border-gray-800 flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
                
                <div className="flex-1 text-center">
                    <h4 className="font-black text-white text-base md:text-xl uppercase">{match.homeTeam}</h4>
                    <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Local</span>
                </div>

                <div className="flex flex-col items-center px-6">
                    <div className="bg-gray-950 px-4 py-2 rounded-xl border border-gray-800 font-black text-cyan-400 text-xl italic shadow-inner">
                        VS
                    </div>
                </div>

                <div className="flex-1 text-center">
                    <h4 className="font-black text-white text-base md:text-xl uppercase">{match.awayTeam}</h4>
                    <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Visitante</span>
                </div>
            </div>
            
            {/* Banner Publicitario / Promo Cyan */}
            <div className="bg-gradient-to-br from-cyan-900/20 to-gray-900 p-5 rounded-2xl border border-cyan-800/30 flex items-center gap-4">
                <span className="text-2xl">🔥</span>
                <p className="text-cyan-100 text-sm font-bold leading-tight">
                    ¿Ves un ganador claro? <br/>
                    <span className="text-gray-400 font-medium text-xs">Comenta tu análisis en el chat y ayuda a la comunidad.</span>
                </p>
            </div>
        </div>

        {/* Columna Derecha: EL CHAT (Se adapta solo si ChatRoom es dark) */}
        <div className="lg:col-span-1 h-[500px] md:h-auto">
            <ChatRoom matchId={id} user={user} />
        </div>

      </div>
    </div>
  );
}