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
    // Consulta: Dame los partidos donde "isLive" sea true, ordenados por creación
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

  if (loading) return <div className="text-center py-10 animate-pulse">Cargando partidos... ⚽</div>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="font-bold text-gray-800 text-xl">🔴 Ahora Mismo</h3>
        <span className="text-red-600 text-xs font-bold bg-red-100 px-2 py-1 rounded-full animate-pulse">
            {matches.length} EN VIVO
        </span>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border border-dashed text-gray-400">
            No hay partidos en vivo en este momento. 😴
        </div>
      ) : (
        matches.map((match) => (
          <Link href={`/match/${match.id}`} key={match.id}>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition cursor-pointer relative overflow-hidden group">
              
              {/* Barra lateral roja de "Live" */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>

              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                    {match.league}
                </span>
                <span className="text-xs text-red-600 font-bold flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                    {match.time}
                </span>
              </div>

              <div className="flex items-center justify-between">
                {/* Equipo Local */}
                <div className="flex-1 text-center">
                    <h4 className="font-bold text-gray-900 text-sm md:text-base truncate">{match.homeTeam}</h4>
                </div>

                {/* Equipo Visitante */}
                <div className="flex-1 text-center">
                    <h4 className="font-bold text-gray-900 text-sm md:text-base truncate">{match.awayTeam}</h4>
                </div>
              </div>

              <div className="mt-3 text-center text-xs text-blue-500 font-semibold opacity-0 group-hover:opacity-100 transition">
                Ver Transmisión y Estadísticas →
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}