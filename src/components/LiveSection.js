// src/components/LiveSection.js
"use client";
import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, orderBy, onSnapshot, where } from "firebase/firestore";
import Link from "next/link";

export default function LiveSection() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="text-center py-10 animate-pulse text-gray-500 font-medium">Buscando transmisiones... ⚽</div>;

  return (
    <div className="flex flex-col gap-4">
      {/* HEADER DE SECCIÓN */}
      <div className="flex items-center justify-between px-2">
        <h3 className="font-bold text-white text-xl flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
            En Vivo
        </h3>
        <span className="text-red-500 text-[10px] font-black bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full uppercase tracking-tighter">
            {matches.length} PARTIDOS
        </span>
      </div>

      {matches.length === 0 ? (
        // ESTADO VACÍO OSCURO
        <div className="text-center py-12 bg-gray-900 rounded-2xl border-2 border-dashed border-gray-800 text-gray-500 mx-1">
            <div className="text-3xl mb-2">😴</div>
            <p className="text-sm font-medium">No hay transmisiones activas ahora.</p>
            <p className="text-[10px] uppercase mt-1 tracking-widest opacity-60">Vuelve más tarde</p>
        </div>
      ) : (
        matches.map((match) => (
          <Link href={`/match/${match.id}`} key={match.id}>
            <div className="bg-gray-900 rounded-2xl shadow-xl border border-gray-800 p-5 hover:border-cyan-500/50 transition-all cursor-pointer relative overflow-hidden group">
              
              {/* Resplandor celeste de fondo al pasar el mouse */}
              <div className="absolute -right-4 -top-4 w-16 h-16 bg-cyan-500/10 blur-2xl group-hover:bg-cyan-500/20 transition-colors"></div>

              {/* Barra lateral roja indicadora de "LIVE" */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]"></div>

              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest bg-gray-800 px-2 py-0.5 rounded">
                    {match.league}
                </span>
                <span className="text-xs text-red-500 font-bold flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    {match.time}
                </span>
              </div>

              {/* MARCADOR / EQUIPOS */}
              <div className="flex items-center justify-between gap-4">
                {/* Equipo Local */}
                <div className="flex-1 flex flex-col items-center">
                    <h4 className="font-black text-white text-sm md:text-lg text-center leading-tight">
                        {match.homeTeam}
                    </h4>
                    <span className="text-[10px] text-gray-500 font-bold mt-1">LOCAL</span>
                </div>

                {/* VS / SCORE */}
                <div className="px-4 py-2 bg-gray-950 rounded-lg border border-gray-800 font-black text-cyan-400 text-lg italic shadow-inner">
                    VS
                </div>

                {/* Equipo Visitante */}
                <div className="flex-1 flex flex-col items-center">
                    <h4 className="font-black text-white text-sm md:text-lg text-center leading-tight">
                        {match.awayTeam}
                    </h4>
                    <span className="text-[10px] text-gray-500 font-bold mt-1">VISITA</span>
                </div>
              </div>

              {/* ACCIÓN HINT (iOS Style) */}
              <div className="mt-5 pt-3 border-t border-gray-800/50 flex justify-center items-center gap-2 text-[11px] text-cyan-500 font-black uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                </svg>
                Ver Señal en Vivo
              </div>

            </div>
          </Link>
        ))
      )}
    </div>
  );
}