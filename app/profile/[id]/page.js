// app/profile/[id]/page.js
"use client";
import { useState, useEffect } from "react";
import { db, auth } from "../../../src/lib/firebase"; 
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PostList from "../../../src/components/PostList";
import toast from "react-hot-toast";
import { BookImage, BadgeCheck } from "lucide-react";

import { ALL_CATALOGS } from "../../../src/data/albumCatalog";

export default function ProfilePage() {
  const { id } = useParams(); 
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null); 
  const [profileData, setProfileData] = useState(null); 
  
  // ESTADÍSTICAS
  const [stats, setStats] = useState({ wins: 0, losses: 0, pending: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  // ÁLBUMES
  const [albumsProgress, setAlbumsProgress] = useState([]);

  // EDICIÓN
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newBio, setNewBio] = useState("");
  const [loadingSave, setLoadingSave] = useState(false);

  const MY_ADMIN_EMAIL = "kevinfer.mt@gmail.com"; 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 1. CARGAR DATOS DEL PERFIL
  useEffect(() => {
    if (!id) return;
    const fetchProfile = async () => {
      const docRef = doc(db, "users", id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfileData(data);
        
        setNewName(data.displayName || data.clubName || "");
        // Limpiamos el @ al cargar por si acaso venía de datos viejos
        setNewUsername(data.username?.replace(/^@/, '') || "");
        setNewBio(data.bio || "");
      } else {
        setProfileData({ displayName: "Usuario Desconocido", followers: [] });
      }
    };
    fetchProfile();
  }, [id]);

  // 2. CARGAR PROGRESO DE ÁLBUMES
  useEffect(() => {
    if (!id) return;
    const fetchAlbumsProgress = async () => {
      const progressArr = [];
      
      for (const [albumId, catalogData] of Object.entries(ALL_CATALOGS)) {
        try {
          const inventoryRef = collection(db, "users", id, "albums", albumId, "inventory");
          const snap = await getDocs(inventoryRef);
          
          const unlockedCount = snap.size;
          const totalCards = catalogData.cards.length;
          
          if (unlockedCount > 0) {
            progressArr.push({
              id: albumId,
              name: catalogData.info.name,
              unlocked: unlockedCount,
              total: totalCards,
              percent: Math.round((unlockedCount / totalCards) * 100)
            });
          }
        } catch (error) {
          console.error(`Error cargando álbum ${albumId}:`, error);
        }
      }
      setAlbumsProgress(progressArr);
    };
    fetchAlbumsProgress();
  }, [id]);

  // 3. CALCULAR ESTADÍSTICAS
  useEffect(() => {
    if (!id) return;
    const calculateStats = async () => {
        setLoadingStats(true);
        try {
            const q = query(collection(db, "posts"), where("userId", "==", id));
            const querySnapshot = await getDocs(q);
            
            let wins = 0;
            let losses = 0;
            let pending = 0;

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const yes = data.validationsYes?.length || 0;
                const no = data.validationsNo?.length || 0;

                if (yes === 0 && no === 0) pending++;
                else if (yes > no) wins++;
                else if (no > yes) losses++;
            });
            setStats({ wins, losses, pending });
        } catch (error) {
            console.error("Error calculando stats:", error);
        }
        setLoadingStats(false);
    };
    calculateStats();
  }, [id]);

  const handleFollow = async () => {
    if (!currentUser) return toast.error("Debes iniciar sesión para seguir 🔒");
    const userToFollowRef = doc(db, "users", id);
    const isFollowing = profileData.followers?.includes(currentUser.uid);

    try {
        if (isFollowing) {
            await updateDoc(userToFollowRef, { followers: arrayRemove(currentUser.uid) });
            setProfileData(prev => ({ ...prev, followers: prev.followers.filter(uid => uid !== currentUser.uid) }));
            toast("Dejaste de seguir 👋", { style: { background: '#333', color: '#fff' } });
        } else {
            await setDoc(userToFollowRef, { followers: arrayUnion(currentUser.uid) }, { merge: true });
            setProfileData(prev => ({ ...prev, followers: [...(prev.followers || []), currentUser.uid] }));
            toast.success(`Siguiendo a ${profileData.username}`, { style: { background: '#333', color: '#fff' } });
        }
    } catch (error) {
        toast.error("Error al conectar");
    }
  };

  // LÓGICA DE GUARDADO CORREGIDA (Sin @ en Firebase)
  const handleSaveProfile = async () => {
    const cleanUsername = newUsername.trim().replace(/^@/, '').toLowerCase();
    
    if (!cleanUsername || !newName.trim()) return toast.error("Revisa los campos obligatorios");
    setLoadingSave(true);

    try {
        const currentCleanUsername = profileData.username?.replace(/^@/, '').toLowerCase();

        // Solo validamos si el usuario decidió cambiar su username
        if (cleanUsername !== currentCleanUsername) {
            const q = query(collection(db, "users"), where("searchKey", "==", cleanUsername));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                setLoadingSave(false);
                toast.error(`El usuario @${cleanUsername} ya está en uso.`);
                return;
            }
        }

        // Guardamos todo limpio sin el @
        await toast.promise(
            setDoc(doc(db, "users", id), {
                displayName: newName.trim(),
                bio: newBio.trim(),
                username: cleanUsername,
                searchKey: cleanUsername 
            }, { merge: true }),
            { loading: 'Guardando...', success: '¡Perfil actualizado! ✨', error: 'Error al guardar' },
            { style: { background: '#333', color: '#fff' } }
        );

        setProfileData({ ...profileData, displayName: newName, bio: newBio, username: cleanUsername });
        setIsEditing(false);

    } catch (error) {
        console.error(error);
        toast.error("Hubo un problema al guardar.");
    } finally {
        setLoadingSave(false);
    }
  };

  const toggleVerify = async () => {
    const userRef = doc(db, "users", id);
    const newStatus = !profileData?.isVerified;
    await updateDoc(userRef, { isVerified: newStatus });
    setProfileData({ ...profileData, isVerified: newStatus });
    toast.success("Estado de verificación actualizado");
  };

  if (!profileData) return <div className="p-10 text-center animate-pulse text-gray-500 bg-gray-950 min-h-screen">Cargando perfil...</div>;

  const isMyProfile = currentUser?.uid === id;
  const isAdmin = currentUser?.email === MY_ADMIN_EMAIL;
  const isFollowing = profileData.followers?.includes(currentUser?.uid);

  const totalFinished = stats.wins + stats.losses;
  const winRate = totalFinished > 0 ? Math.round((stats.wins / totalFinished) * 100) : 0;
  const balance = stats.wins - stats.losses;

  // Renderizado seguro del username con @
  const displayUsername = profileData.username?.replace(/^@/, '');

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 pb-24">
      
      {/* NAVBAR */}
      <div className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 px-4 py-3 sticky top-0 z-50 flex items-center justify-between shadow-md">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-cyan-400 p-2 rounded-full transition hover:bg-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
        </button>
        <h1 className="font-bold text-base text-white truncate max-w-[200px]">
            {displayUsername ? `@${displayUsername}` : "Perfil"}
        </h1>
        <div className="w-9"></div> 
      </div>

      <div className="max-w-2xl mx-auto p-4">
        
        {/* TARJETA DEL PERFIL */}
        <div className="bg-gray-900 rounded-3xl shadow-xl overflow-hidden border border-gray-800 mb-6 transition-all relative">
            {isEditing ? (
                // ... (mantenemos el modo edición exactamente igual)
                <div className="p-6 animate-in fade-in slide-in-from-bottom-2">
                    <h2 className="font-bold text-lg text-white mb-4 pb-2 border-b border-gray-800">Editar Perfil</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Nombre</label>
                            <input value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={25} className="w-full border border-gray-700 p-3 rounded-lg bg-gray-950 text-white focus:ring-2 focus:ring-cyan-500/50" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Usuario Único (@)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-3.5 text-cyan-500 font-bold">@</span>
                                <input value={newUsername} onChange={(e) => setNewUsername(e.target.value.replace(/\s/g, ''))} maxLength={15} className="w-full border border-gray-700 p-3 pl-8 rounded-lg bg-gray-950 text-white focus:ring-2 focus:ring-cyan-500/50" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase block mb-1">Biografía</label>
                            <textarea value={newBio} onChange={(e) => setNewBio(e.target.value)} maxLength={100} className="w-full border border-gray-700 p-3 rounded-lg bg-gray-950 text-white h-24 resize-none focus:ring-2 focus:ring-cyan-500/50" placeholder="Escribe algo sobre ti..." />
                        </div>
                    </div>
                    
                    <div className="flex gap-3 mt-6">
                        <button onClick={() => setIsEditing(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-400 bg-gray-800 hover:bg-gray-700 transition">Cancelar</button>
                        <button onClick={handleSaveProfile} disabled={loadingSave} className="flex-1 py-3 rounded-xl font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition shadow-lg shadow-cyan-900/20">
                            {loadingSave ? "Guardando..." : "Confirmar"}
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="h-28 bg-gradient-to-br from-indigo-900 to-gray-900 relative overflow-hidden border-b border-gray-800">
                        <div className="absolute inset-0 bg-black/20"></div>
                    </div>
                    
                    <div className="px-6 pb-6 text-center -mt-12 relative z-10">
                        <div className="relative inline-block">
                          <img src={profileData.photoURL || "https://via.placeholder.com/100"} className="w-24 h-24 rounded-full border-[5px] border-gray-950 shadow-2xl mx-auto mb-2 object-cover bg-gray-800" />
                          <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-yellow-600 to-yellow-400 border border-gray-900 text-gray-950 text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg">DIV 10</div>
                        </div>
                        
                        {/* NOMBRE CON EL CHECK PERFECTO AL LADO */}
                        <div className="flex items-center justify-center gap-1.5 w-full px-4 mt-2">
                            <h2 className="text-2xl font-black text-white truncate max-w-[80%]">
                                {profileData.displayName || profileData.clubName || displayUsername}
                            </h2>
                            {profileData.isVerified && (
                                <BadgeCheck className="w-6 h-6 text-cyan-400 shrink-0" strokeWidth={2.5} />
                            )}
                        </div>
                        <p className="text-cyan-500 font-bold text-sm mt-0.5">@{displayUsername}</p>
                        
                        <p className="text-gray-400 mt-3 text-sm leading-relaxed max-w-sm mx-auto bg-gray-950/40 p-3 rounded-xl border border-gray-800/50 italic">
                            "{profileData.bio || "Analista en ascenso."}"
                        </p>

                        {/* ESTADÍSTICAS */}
                        <div className="grid grid-cols-4 gap-2 my-5 py-4 border-t border-b border-gray-800 bg-gray-950/30 rounded-xl">
                            <div className="flex flex-col border-r border-gray-800">
                                <span className="font-black text-lg text-white">{profileData.followers?.length || 0}</span>
                                <span className="text-[9px] text-gray-500 font-bold uppercase">Seguidores</span>
                            </div>
                            <div className="flex flex-col border-r border-gray-800">
                                <span className="font-black text-lg text-green-400">{loadingStats ? "-" : stats.wins}</span>
                                <span className="text-[9px] text-gray-500 font-bold uppercase">Aciertos</span>
                            </div>
                            <div className="flex flex-col border-r border-gray-800">
                                <span className="font-black text-lg text-red-400">{loadingStats ? "-" : stats.losses}</span>
                                <span className="text-[9px] text-gray-500 font-bold uppercase">Fallos</span>
                            </div>
                            <div className="flex flex-col">
                                <span className={`font-black text-lg ${balance >= 0 ? "text-cyan-400" : "text-orange-400"}`}>
                                    {loadingStats ? "-" : (balance > 0 ? `+${balance}` : balance)}
                                </span>
                                <span className="text-[9px] text-gray-500 font-bold uppercase">Balance</span>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 justify-center">
                            {isMyProfile ? (
                                <button onClick={() => setIsEditing(true)} className="w-full max-w-[200px] bg-gray-800 text-white border border-gray-700 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-700 transition shadow-lg">
                                    Modificar Perfil
                                </button>
                            ) : (
                                <button onClick={handleFollow} className={`w-full max-w-[200px] px-4 py-2.5 rounded-xl font-bold text-sm transition shadow-lg ${isFollowing ? "bg-transparent border border-gray-700 text-gray-400" : "bg-cyan-600 text-white hover:bg-cyan-500 shadow-cyan-900/20"}`}>
                                    {isFollowing ? "Siguiendo" : "Seguir"}
                                </button>
                            )}
                        </div>

                         {isAdmin && !isMyProfile && (
                             <div className="mt-4">
                                <button onClick={toggleVerify} className="text-[10px] text-cyan-400 font-bold bg-cyan-950/30 px-3 py-1.5 rounded-lg border border-cyan-900/50 uppercase tracking-tighter">
                                    {profileData.isVerified ? "Revocar Verificado" : "Dar Check Azul"}
                                </button>
                             </div>
                        )}
                    </div>
                </>
            )}
        </div>

        {/* --- VITRINA DE ÁLBUMES COMPLETADOS --- */}
        {albumsProgress.length > 0 && !isEditing && (
            <div className="mb-8 px-2 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-2 mb-4">
                    <BookImage className="w-5 h-5 text-cyan-500" />
                    <h3 className="font-black text-white uppercase tracking-widest text-sm">Colección de Álbumes</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {albumsProgress.map(album => (
                        <div key={album.id} className="bg-gray-900 border border-gray-800 p-4 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden">
                            <div 
                              className="absolute left-0 bottom-0 h-1 bg-gradient-to-r from-cyan-600 to-blue-500" 
                              style={{ width: `${album.percent}%` }}
                            ></div>
                            
                            <div className="relative z-10">
                                <p className="text-sm font-black text-white italic">{album.name}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{album.unlocked} de {album.total} Cromos</p>
                            </div>
                            <div className="relative z-10 flex flex-col items-end">
                                <span className="text-cyan-400 font-black text-lg leading-none">{album.percent}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* LISTA DE POSTS */}
        {!isEditing && (
            <div className="mt-4">
                <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-cyan-500 rounded-full"></div>
                        <h3 className="font-bold text-white text-lg">Historial de Jugadas</h3>
                    </div>
                    <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded font-mono">
                        Winrate: <span className="text-white font-bold">{winRate}%</span>
                    </span>
                </div>
                <PostList user={currentUser} filterUserId={id} />
            </div>
        )}

      </div>
    </div>
  );
}