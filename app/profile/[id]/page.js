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

  // --- CONFIGURACIÓN ADMIN ---
  const MY_ADMIN_EMAIL = "kevinfer.mt@gmail.com"; 

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Cargar datos del perfil
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

  // --- LOGICA DE SEGUIR / DEJAR DE SEGUIR ---
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
            toast("Dejaste de seguir", { icon: '👋' });
        } else {
            await setDoc(userToFollowRef, { followers: arrayUnion(currentUser.uid) }, { merge: true });
            setProfileData(prev => ({
                ...prev,
                followers: [...(prev.followers || []), currentUser.uid]
            }));
            toast.success(`Ahora sigues a ${profileData.username || "este usuario"}`);
        }
    } catch (error) {
        console.error("Error al seguir:", error);
        toast.error("Error al conectar");
    }
  };

  // --- GUARDAR PERFIL ---
  const handleSaveProfile = async () => {
    if (!newUsername.trim()) return toast.error("El usuario no puede estar vacío");
    setLoadingSave(true);

    try {
        if (newUsername !== profileData.username) {
            const q = query(collection(db, "users"), where("username", "==", newUsername));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                setLoadingSave(false);
                toast.error(`El usuario @${newUsername} ya existe.`);
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
            }
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
    
    await toast.promise(
        updateDoc(userRef, { isVerified: newStatus }),
        {
            loading: 'Procesando...',
            success: newStatus ? 'Verificado ✅' : 'Verificación quitada 🗑️',
            error: 'Error'
        }
    );
    
    setProfileData({ ...profileData, isVerified: newStatus });
  };

  if (!profileData) return <div className="p-10 text-center animate-pulse text-gray-500">Cargando perfil...</div>;

  const isMyProfile = currentUser?.uid === id;
  const isAdmin = currentUser?.email === MY_ADMIN_EMAIL;
  const isFollowing = profileData.followers?.includes(currentUser?.uid);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* --- NAVBAR --- */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50 flex items-center justify-between shadow-sm">
        <Link href="/" className="text-gray-600 hover:text-black hover:bg-gray-100 p-2 rounded-full transition">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
        </Link>
        <h1 className="font-bold text-base text-gray-900 truncate max-w-[200px]">
            {profileData.username ? `@${profileData.username}` : "Perfil"}
        </h1>
        <div className="w-9"></div> 
      </div>

      <div className="max-w-2xl mx-auto p-4">
        
        {/* --- TARJETA DEL PERFIL --- */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 mb-6">
            
            {/* Si estamos editando, mostramos el formulario LIMPIO, sin fondos raros */}
            {isEditing ? (
                <div className="p-6 animate-in fade-in">
                    <h2 className="font-bold text-lg text-gray-900 mb-4 pb-2 border-b">Editar Información</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Nombre de Usuario</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-400 font-bold">@</span>
                                <input 
                                    value={newUsername} 
                                    onChange={(e) => setNewUsername(e.target.value.replace(/\s/g, ''))} 
                                    className="w-full border border-gray-300 p-2 pl-8 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    placeholder="usuario"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Biografía</label>
                            <textarea 
                                value={newBio} 
                                onChange={(e) => setNewBio(e.target.value)}
                                className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 h-24 resize-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                placeholder="Cuéntanos sobre ti..."
                            />
                        </div>
                    </div>
                    
                    <div className="flex gap-3 mt-6">
                        <button 
                            onClick={() => setIsEditing(false)} 
                            className="flex-1 py-3 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleSaveProfile} 
                            disabled={loadingSave}
                            className="flex-1 py-3 rounded-xl font-bold text-white bg-black hover:bg-gray-800 transition shadow-lg"
                        >
                            {loadingSave ? "Guardando..." : "Guardar Cambios"}
                        </button>
                    </div>
                </div>
            ) : (
                // --- VISTA NORMAL DEL PERFIL ---
                <>
                    {/* Fondo Azul Decorativo */}
                    <div className="h-24 bg-gradient-to-r from-blue-600 to-blue-800"></div>
                    
                    <div className="px-6 pb-6 text-center -mt-12">
                        <img 
                            src={profileData.photoURL || "https://via.placeholder.com/100"} 
                            className="w-24 h-24 rounded-full border-4 border-white shadow-md mx-auto mb-3 object-cover bg-white"
                        />
                        
                        <h2 className="text-2xl font-black flex items-center justify-center gap-1 text-gray-900">
                            {profileData.displayName}
                            {profileData.isVerified && (
                                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            )}
                        </h2>
                        <p className="text-gray-500 font-medium text-sm">@{profileData.username || "usuario"}</p>
                        
                        <p className="text-gray-800 mt-4 text-sm leading-relaxed max-w-sm mx-auto">
                            {profileData.bio || "Sin biografía aún."}
                        </p>

                        <div className="flex justify-center gap-12 my-6 py-4 border-t border-b border-gray-50">
                            <div className="flex flex-col">
                                <span className="font-black text-xl text-gray-900">{profileData.followers?.length || 0}</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Seguidores</span>
                            </div>
                            <div className="flex flex-col">
                                {/* Aquí podrías calcular aciertos reales en el futuro */}
                                <span className="font-black text-xl text-gray-900">-</span> 
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Racha</span>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 justify-center">
                            {isMyProfile ? (
                                <button 
                                    onClick={() => {
                                        setNewUsername(profileData.username || "");
                                        setNewBio(profileData.bio || "");
                                        setIsEditing(true);
                                    }}
                                    className="w-full max-w-[200px] bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition shadow-sm"
                                >
                                    Editar Perfil
                                </button>
                            ) : (
                                <button 
                                    onClick={handleFollow}
                                    className={`w-full max-w-[200px] px-4 py-2.5 rounded-xl font-bold text-sm transition shadow-md
                                        ${isFollowing 
                                            ? "bg-white border border-gray-300 text-gray-600" 
                                            : "bg-blue-600 text-white hover:bg-blue-700"
                                        }
                                    `}
                                >
                                    {isFollowing ? "Siguiendo" : "Seguir"}
                                </button>
                            )}
                        </div>

                         {/* Botón de Admin */}
                         {isAdmin && !isMyProfile && (
                             <div className="mt-4">
                                <button onClick={toggleVerify} className="text-xs text-purple-600 font-bold bg-purple-50 px-3 py-1 rounded border border-purple-200">
                                    {profileData.isVerified ? "Quitar Verificado" : "Dar Verificado"}
                                </button>
                             </div>
                        )}
                    </div>
                </>
            )}
        </div>

        {/* --- TÍTULO SECCIÓN POSTS --- */}
        {!isEditing && (
            <>
                <div className="flex items-center gap-2 mb-4 px-2">
                    <span className="text-xl">📜</span>
                    <h3 className="font-bold text-gray-800 text-lg">Historial</h3>
                </div>
                <PostList user={currentUser} filterUserId={id} />
            </>
        )}

      </div>
    </div>
  );
}