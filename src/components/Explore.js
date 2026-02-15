// src/components/Explore.js
"use client";
import { useState, useEffect } from "react";
import { db, auth } from "../lib/firebase"; 
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import toast from "react-hot-toast";

export default function Explore() {
  const [currentUser, setCurrentUser] = useState(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [weeklyRanking, setWeeklyRanking] = useState([]);
  const [following, setFollowing] = useState([]); 
  const [loading, setLoading] = useState(true);

  // 1. Detectar usuario actual
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        getDoc(doc(db, "users", user.uid)).then((snap) => {
            if (snap.exists()) setFollowing(snap.data().following || []);
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. CALCULAR RANKING SEMANAL (Lógica Maestra)
  useEffect(() => {
    const calculateWeeklyRanking = async () => {
      setLoading(true);
      
      // A) Obtener fecha del Lunes de esta semana a las 00:00
      const now = new Date();
      const day = now.getDay() || 7; // Hacemos que Domingo sea 7
      if (day !== 1) now.setHours(-24 * (day - 1)); // Retrocedemos al lunes
      now.setHours(0, 0, 0, 0); // Lunes 00:00:00
      
      // B) Traer posts creados DESDE ese lunes
      const q = query(collection(db, "posts"), where("createdAt", ">=", now));
      const snapshot = await getDocs(q);

      // C) Agrupar puntos por usuario
      const userStats = {}; // { uid: { wins: 0, losses: 0, userPhoto... } }

      snapshot.forEach(doc => {
        const post = doc.data();
        const uid = post.userId;
        
        // Inicializar usuario si no existe en el mapa temporal
        if (!userStats[uid]) {
            userStats[uid] = {
                id: uid,
                username: post.username,
                photoURL: post.userPhoto,
                isVerified: post.isVerified,
                wins: 0,
                losses: 0,
                balance: 0
            };
        }

        // Contar votos de este post
        const yes = post.validationsYes?.length || 0;
        const no = post.validationsNo?.length || 0;

        if (yes > no) userStats[uid].wins += 1;
        if (no > yes) userStats[uid].losses += 1;
      });

      // D) Calcular Balance y convertir a Array
      let rankingArray = Object.values(userStats).map(user => ({
          ...user,
          balance: user.wins - user.losses
      }));

      // E) Filtrar a los que tienen 0 movimiento (opcional) y Ordenar por Balance Descendente
      rankingArray = rankingArray.filter(u => u.wins > 0 || u.losses > 0);
      rankingArray.sort((a, b) => b.balance - a.balance);

      setWeeklyRanking(rankingArray.slice(0, 10)); // Top 10
      setLoading(false);
    };

    calculateWeeklyRanking();
  }, []);

  // 3. Buscar usuarios (Igual que antes)
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    const q = query(
        collection(db, "users"), 
        where("username", ">=", search.toLowerCase()), 
        where("username", "<=", search.toLowerCase() + "\uf8ff")
    );
    const querySnapshot = await getDocs(q);
    setSearchResults(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleFollow = async (targetId) => {
    if (!currentUser) return toast.error("Inicia sesión para seguir");
    const myRef = doc(db, "users", currentUser.uid);
    const targetRef = doc(db, "users", targetId);
    const isFollowing = following.includes(targetId);

    try {
        if (isFollowing) {
            await updateDoc(myRef, { following: arrayRemove(targetId) });
            await updateDoc(targetRef, { followers: arrayRemove(currentUser.uid) });
            setFollowing(prev => prev.filter(id => id !== targetId));
            toast("Dejaste de seguir", { icon: '👋' });
        } else {
            await updateDoc(myRef, { following: arrayUnion(targetId) });
            await updateDoc(targetRef, { followers: arrayUnion(currentUser.uid) });
            setFollowing(prev => [...prev, targetId]);
            toast.success("Siguiendo usuario");
        }
    } catch (error) { console.error(error); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* 🔍 BARRA DE BÚSQUEDA */}
      <div className="bg-gray-900 p-4 rounded-2xl shadow-lg border border-gray-800">
          <form onSubmit={handleSearch} className="relative">
            <input 
              type="text" 
              placeholder="Buscar @usuario..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-3 pl-10 rounded-xl bg-gray-950 border border-gray-700 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all placeholder-gray-600"
            />
            <span className="absolute left-3 top-3.5 text-gray-500">🔍</span>
          </form>

          {/* RESULTADOS DE BÚSQUEDA */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
                <h3 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-2">Resultados</h3>
                {searchResults.map(u => (
                    <div key={u.id} className="flex items-center justify-between p-2 hover:bg-gray-800 rounded-lg transition">
                        <Link href={`/profile/${u.id}`} className="flex items-center gap-3">
                            <img src={u.photoURL} className="w-8 h-8 rounded-full border border-gray-600" />
                            <div>
                                <p className="font-bold text-sm text-gray-200">@{u.username}</p>
                            </div>
                        </Link>
                        {currentUser && currentUser.uid !== u.id && (
                            <button 
                                onClick={() => handleFollow(u.id)}
                                className={`text-[10px] font-bold px-3 py-1 rounded-full border ${following.includes(u.id) ? "border-gray-600 text-gray-400" : "bg-cyan-600 text-white border-cyan-600"}`}
                            >
                                {following.includes(u.id) ? "Siguiendo" : "Seguir"}
                            </button>
                        )}
                    </div>
                ))}
            </div>
          )}
      </div>

      {/* 🏆 RANKING SEMANAL */}
      <div className="bg-gray-900 rounded-2xl shadow-xl border border-gray-800 overflow-hidden">
        {/* Header Dorado */}
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-800 p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative z-10 flex justify-between items-center">
                <div>
                    <h3 className="font-black text-white italic tracking-tighter text-lg">
                        🏆 RANKING SEMANAL
                    </h3>
                    <p className="text-yellow-100 text-[10px] opacity-80 uppercase tracking-wide">
                        Lunes a Domingo
                    </p>
                </div>
                <div className="bg-black/30 px-3 py-1 rounded-full border border-white/10">
                    <span className="text-xs font-mono font-bold text-yellow-300">
                        Semana {new Date().toLocaleDateString()}
                    </span>
                </div>
            </div>
        </div>

        {loading ? (
             <div className="p-8 text-center text-xs text-gray-500 uppercase animate-pulse">Calculando posiciones...</div>
        ) : weeklyRanking.length === 0 ? (
            <div className="p-8 text-center">
                <p className="text-gray-400 text-sm">Nadie ha puntuado esta semana aún.</p>
                <p className="text-cyan-500 text-xs mt-1 font-bold">¡Sé el primero en acertar!</p>
            </div>
        ) : (
            <div className="divide-y divide-gray-800">
                {weeklyRanking.map((u, index) => {
                    const isTop1 = index === 0;
                    const isTop2 = index === 1;
                    const isTop3 = index === 2;
                    
                    let rankColor = "text-gray-500";
                    if (isTop1) rankColor = "text-yellow-400";
                    if (isTop2) rankColor = "text-gray-300";
                    if (isTop3) rankColor = "text-orange-400";

                    return (
                        <div key={u.id} className="flex items-center justify-between p-4 hover:bg-gray-800/50 transition group">
                            <Link href={`/profile/${u.id}`} className="flex items-center gap-4 flex-1">
                                <span className={`font-black text-xl w-6 text-center ${rankColor}`}>
                                    {index + 1}
                                </span>
                                
                                <div className="relative">
                                    <img src={u.photoURL} className={`w-10 h-10 rounded-full object-cover border-2 ${isTop1 ? "border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]" : "border-gray-700"}`} />
                                    {isTop1 && <span className="absolute -top-2 -right-1 text-xs">👑</span>}
                                </div>
                                
                                <div>
                                    <p className="font-bold text-sm text-gray-200 flex items-center gap-1 group-hover:text-cyan-400 transition">
                                        @{u.username}
                                        {u.isVerified && <svg className="w-3 h-3 text-cyan-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}
                                    </p>
                                    <div className="flex gap-2 text-[10px] mt-0.5">
                                        <span className="text-green-400 font-bold">{u.wins}W</span>
                                        <span className="text-red-400 font-bold">{u.losses}L</span>
                                    </div>
                                </div>
                            </Link>

                            {/* BALANCE SEMANAL */}
                            <div className="text-right">
                                <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-wider mb-1">Balance</span>
                                <span className={`text-lg font-black font-mono px-2 py-0.5 rounded
                                    ${u.balance > 0 ? "text-green-400 bg-green-900/20 border border-green-900" : 
                                      u.balance < 0 ? "text-red-400 bg-red-900/20 border border-red-900" : 
                                      "text-gray-400 bg-gray-800"}
                                `}>
                                    {u.balance > 0 ? `+${u.balance}` : u.balance}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      <div className="p-6 bg-gradient-to-r from-cyan-900 to-blue-950 rounded-2xl text-white relative overflow-hidden shadow-xl border border-cyan-800/50">
          <div className="relative z-10">
            <h4 className="font-black text-xl italic mb-1">¡RANKING SE REINICIA EL LUNES!</h4>
            <p className="text-xs text-cyan-200 leading-relaxed max-w-[80%]">
                Demuestra tu talento esta semana. Los contadores vuelven a cero cada lunes a las 00:00.
            </p>
          </div>
          <span className="absolute -right-6 -bottom-6 text-9xl opacity-10 italic font-black">RESET</span>
      </div>
    </div>
  );
}