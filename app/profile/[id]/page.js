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

export default function ProfilePage() {
  const { id } = useParams(); 
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null); 
  const [profileData, setProfileData] = useState(null); 
  
  // Edición
  const [isEditing, setIsEditing] = useState(false);
  const [newBio, setNewBio] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [loadingSave, setLoadingSave] = useState(false);

  const MY_ADMIN_EMAIL = "kevinfer.mt@gmail.com"; 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchProfile = async () => {
      const docRef = doc(db, "users", id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setProfileData(docSnap.data());
        setNewBio(docSnap.data().bio || "");
        setNewUsername(docSnap.data().username || "");
      } else {
        setProfileData({ 
            displayName: "Usuario Nuevo", 
            followers: [] 
        });
      }
    };
    fetchProfile();
  }, [id]);

  const handleFollow = async () => {
    if (!currentUser) return toast.error("Debes iniciar sesión para seguir 🔒");
    
    const userToFollowRef = doc(db, "users", id);
    const isFollowing = profileData.followers?.includes(currentUser.uid);

    try {
        if (isFollowing) {
            await updateDoc(userToFollowRef, { followers: arrayRemove(currentUser.uid) });
            setProfileData(prev => ({
                ...prev,
                followers: prev.followers.filter(uid => uid !== currentUser.uid)
            }));
            toast("Dejaste de seguir 👋", { style: { background: '#333', color: '#fff' } });
        } else {
            await setDoc(userToFollowRef, { followers: arrayUnion(currentUser.uid) }, { merge: true });
            setProfileData(prev => ({
                ...prev,
                followers: [...(prev.followers || []), currentUser.uid]
            }));
            toast.success(`Siguiendo a @${profileData.username}`, { style: { background: '#333', color: '#fff' } });
        }
    } catch (error) {
        console.error(error);
        toast.error("Error al conectar");
    }
  };

  const handleSaveProfile = async () => {
    if (!newUsername.trim()) return toast.error("El usuario no puede estar vacío");
    setLoadingSave(true);

    try {
        if (newUsername !== profileData.username) {
            const q = query(collection(db, "users"), where("username", "==", newUsername));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                setLoadingSave(false);
                toast.error(`@${newUsername} ya existe.`);
                return;
            }
        }

        await toast.promise(
            setDoc(doc(db, "users", id), {
                bio: newBio,
                username: newUsername,
                email: currentUser.email, 
                photoURL: currentUser.photoURL,
                displayName: currentUser.displayName,
                searchKey: newUsername.toLowerCase() 
            }, { merge: true }),
            {
                loading: 'Guardando...',
                success: '¡Perfil actualizado! ✨',
                error: 'Error al guardar',
            },
            { style: { background: '#333', color: '#fff' } }
        );

        setProfileData({ ...profileData, bio: newBio, username: newUsername });
        setIsEditing(false);

    } catch (error) {
        console.error(error);
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

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 pb-24">
      
      {/* --- NAVBAR --- */}
      <div className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 px-4 py-3 sticky top-0 z-50 flex items-center justify-between shadow-md">
        <Link href="/" className="text-gray-400 hover:text-cyan-400 p-2 rounded-full transition hover:bg-gray-800">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
        </Link>
        <h1 className="font-bold text-base text-white truncate max-w-[200px]">
            {profileData.username ? `@${profileData.username}` : "Perfil"}
        </h1>
        <div className="w-9"></div> 
      </div>

      <div className="max-w-2xl mx-auto p-4">
        
        {/* --- TARJETA DEL PERFIL --- */}
        <div className="bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-800 mb-6 transition-all">
            
            {isEditing ? (
                <div className="p-6 animate-in fade-in slide-in-from-bottom-2">
                    <h2 className="font-bold text-lg text-white mb-4 pb-2 border-b border-gray-800">Configuración de Perfil</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Nombre de Usuario (@)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-cyan-500 font-bold">@</span>
                                <input 
                                    value={newUsername} 
                                    onChange={(e) => setNewUsername(e.target.value.replace(/\s/g, ''))} 
                                    className="w-full border border-gray-700 p-2 pl-8 rounded-lg bg-gray-950 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
                                    placeholder="usuario"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Biografía</label>
                            <textarea 
                                value={newBio} 
                                onChange={(e) => setNewBio(e.target.value)}
                                className="w-full border border-gray-700 p-3 rounded-lg bg-gray-950 text-white h-24 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
                                placeholder="Cuéntanos tu estrategia de apuestas..."
                            />
                        </div>
                    </div>
                    
                    <div className="flex gap-3 mt-6">
                        <button onClick={() => setIsEditing(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-400 bg-gray-800 hover:bg-gray-700 transition">Cancelar</button>
                        <button onClick={handleSaveProfile} disabled={loadingSave} className="flex-1 py-3 rounded-xl font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition shadow-lg shadow-cyan-900/20">
                            {loadingSave ? "Guardando..." : "Guardar"}
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Header decorativo oscuro */}
                    <div className="h-28 bg-gradient-to-br from-cyan-900 to-gray-900"></div>
                    
                    <div className="px-6 pb-6 text-center -mt-12">
                        <img 
                            src={profileData.photoURL || "https://via.placeholder.com/100"} 
                            className="w-24 h-24 rounded-full border-4 border-gray-950 shadow-2xl mx-auto mb-3 object-cover bg-gray-800"
                        />
                        
                        <h2 className="text-2xl font-black flex items-center justify-center gap-1 text-white">
                            {profileData.displayName}
                            {profileData.isVerified && (
                                <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            )}
                        </h2>
                        <p className="text-cyan-500 font-bold text-sm">@{profileData.username || "tipster"}</p>
                        
                        <p className="text-gray-400 mt-4 text-sm leading-relaxed max-w-sm mx-auto bg-gray-950/40 p-3 rounded-xl border border-gray-800/50">
                            {profileData.bio || "🎯 Analista deportivo en busca de la fija."}
                        </p>

                        {/* Estadísticas */}
                        <div className="flex justify-center gap-12 my-6 py-4 border-t border-b border-gray-800">
                            <div className="flex flex-col">
                                <span className="font-black text-xl text-white">{profileData.followers?.length || 0}</span>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Seguidores</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-xl text-white">0</span> 
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Aciertos</span>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 justify-center">
                            {isMyProfile ? (
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="w-full max-w-[200px] bg-gray-800 text-white border border-gray-700 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-700 transition shadow-lg"
                                >
                                    Editar Perfil
                                </button>
                            ) : (
                                <button 
                                    onClick={handleFollow}
                                    className={`w-full max-w-[200px] px-4 py-2.5 rounded-xl font-bold text-sm transition shadow-lg
                                        ${isFollowing 
                                            ? "bg-transparent border border-gray-700 text-gray-400" 
                                            : "bg-cyan-600 text-white hover:bg-cyan-500 shadow-cyan-900/20"
                                        }
                                    `}
                                >
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

        {/* --- LISTA DE POSTS --- */}
        {!isEditing && (
            <div className="mt-8">
                <div className="flex items-center gap-2 mb-4 px-2">
                    <div className="w-1.5 h-6 bg-cyan-500 rounded-full"></div>
                    <h3 className="font-bold text-white text-lg">Historial de Jugadas</h3>
                </div>
                <PostList user={currentUser} filterUserId={id} />
            </div>
        )}

      </div>
    </div>
  );
}