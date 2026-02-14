// app/match/[id]/page.js
"use client";
import { useState, useEffect } from "react";
import { db, auth } from "../../../src/lib/firebase"; // Asegura la ruta correcta
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useParams } from "next/navigation";
import Link from "next/link";
import ChatRoom from "../../../src/components/ChatRoom"; // Importamos el chat

export default function MatchPage() {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [user, setUser] = useState(null);

  // Detectar usuario para el chat
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // Cargar datos del partido (Solo una vez, ya no necesitamos onSnapshot para goles)
  useEffect(() => {
    if (!id) return;
    const fetchMatch = async () => {
        const docRef = doc(db, "matches", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setMatch(docSnap.data());
    };
    fetchMatch();
  }, [id]);

  if (!match) return <div className="p-10 text-center text-white bg-gray-900 min-h-screen">Cargando estadio... 🏟️</div>;

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      
      {/* Navbar Oscuro para modo cine */}
      <div className="p-4 flex items-center gap-4 bg-black text-white sticky top-0 z-20 shadow-md">
        <Link href="/" className="bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition">
            ⬅️
        </Link>
        <div>
            <h1 className="font-bold text-sm md:text-base">{match.homeTeam} vs {match.awayTeam}</h1>
            <p className="text-xs text-gray-400 uppercase tracking-wide">{match.league} • {match.time}</p>
        </div>
      </div>

      {/* 🎥 REPRODUCTOR DE VIDEO (Pegado arriba) */}
      <div className="w-full aspect-video bg-black shadow-lg relative">
        {match.videoUrl ? (
             <iframe 
             src={match.videoUrl} 
             className="w-full h-full" 
             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
             allowFullScreen
           ></iframe>
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                <span className="text-4xl">📡</span>
                <p>Señal en espera...</p>
            </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Columna Izquierda: Info del Partido */}
        <div className="md:col-span-2 space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
                <div className="font-bold text-lg text-gray-800">{match.homeTeam}</div>
                <div className="bg-gray-100 px-3 py-1 rounded text-xs font-bold text-gray-500">VS</div>
                <div className="font-bold text-lg text-gray-800">{match.awayTeam}</div>
            </div>
            
            {/* Aquí podrías poner banners de publicidad o apuestas en el futuro */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                <p className="text-blue-800 text-sm font-medium">¿Quién gana hoy? ¡Deja tu parley en el chat! 👇</p>
            </div>
        </div>

        {/* Columna Derecha: EL CHAT */}
        <div className="md:col-span-1">
            <ChatRoom matchId={id} user={user} />
        </div>

      </div>
    </div>
  );
}