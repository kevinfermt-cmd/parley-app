// app/profile/[id]/page.js
"use client";
import { useState, useEffect } from "react";
import { db, auth } from "../../../src/lib/firebase"; 
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PostList from "../../../src/components/PostList"; // Reusamos el componente bonito

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

  // --- CONFIGURACIÓN ADMIN (PON TU EMAIL AQUÍ) ---
  const MY_ADMIN_EMAIL = "kevinfer.mt@gmail.com"; // <--- CAMBIA ESTO!!!

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
        // Perfil fantasma (usuario nuevo que nunca editó su perfil)
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
    if (!currentUser) return alert("Debes iniciar sesión");
    
    // Referencia al usuario que QUEREMOS seguir (el dueño del perfil)
    const userToFollowRef = doc(db, "users", id);
    
    // Verificamos si ya lo sigo
    const isFollowing = profileData.followers?.includes(currentUser.uid);

    try {
        if (isFollowing) {
            // Dejar de seguir
            await updateDoc(userToFollowRef, { followers: arrayRemove(currentUser.uid) });
            setProfileData(prev => ({
                ...prev,
                followers: prev.followers.filter(uid => uid !== currentUser.uid)
            }));
        } else {
            // Seguir
            // Primero aseguramos que el documento exista (por si es usuario nuevo)
            await setDoc(userToFollowRef, { followers: arrayUnion(currentUser.uid) }, { merge: true });
            setProfileData(prev => ({
                ...prev,
                followers: [...(prev.followers || []), currentUser.uid]
            }));
        }
    } catch (error) {
        console.error("Error al seguir:", error);
    }
  };

  // --- GUARDAR PERFIL CON VALIDACIÓN DE USERNAME ---
  const handleSaveProfile = async () => {
    if (!newUsername.trim()) return alert("El usuario no puede estar vacío");
    setLoadingSave(true);

    // 1. Verificar si el username ya existe (y no es el mío actual)
    if (newUsername !== profileData.username) {
        const q = query(collection(db, "users"), where("username", "==", newUsername));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            setLoadingSave(false);
            return alert("⚠️ Ese @usuario ya está ocupado. Prueba otro.");
        }
    }

    // 2. Guardar
    const userRef = doc(db, "users", id);
    await setDoc(userRef, {
      bio: newBio,
      username: newUsername,
      email: currentUser.email, 
      photoURL: currentUser.photoURL,
      displayName: currentUser.displayName,
      searchKey: newUsername.toLowerCase() // Útil para búsquedas futuras
    }, { merge: true }); 

    setProfileData({ ...profileData, bio: newBio, username: newUsername });
    setIsEditing(false);
    setLoadingSave(false);
    alert("Perfil actualizado ✅");
  };

  const toggleVerify = async () => {
    const userRef = doc(db, "users", id);
    const newStatus = !profileData?.isVerified;
    await updateDoc(userRef, { isVerified: newStatus });
    setProfileData({ ...profileData, isVerified: newStatus });
  };

  if (!profileData) return <div className="p-10 text-center animate-pulse">Cargando...</div>;

  const isMyProfile = currentUser?.uid === id;
  const isAdmin = currentUser?.email === MY_ADMIN_EMAIL;
  const isFollowing = profileData.followers?.includes(currentUser?.uid);

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      
      {/* --- BARRA DE NAVEGACIÓN SUPERIOR --- */}
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 flex items-center gap-4">
        <Link href="/" className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition">
            ⬅️
        </Link>
        <h1 className="font-bold text-lg text-gray-800">
            {profileData.username ? `@${profileData.username}` : "Perfil"}
        </h1>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        
        {/* --- TARJETA DEL PERFIL --- */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 text-center relative overflow-hidden">
            {/* Fondo decorativo */}
            <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-blue-600 to-blue-400 opacity-20"></div>

            <div className="relative z-10">
                <img 
                    src={profileData.photoURL || "https://via.placeholder.com/100"} 
                    className="w-24 h-24 rounded-full border-4 border-white shadow-md mx-auto mb-4 object-cover"
                />
                
                {isEditing ? (
                    <div className="flex flex-col gap-3 max-w-xs mx-auto animate-in fade-in slide-in-from-bottom-4">
                        <label className="text-left text-xs font-bold text-gray-500">Nombre de Usuario (@)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-400">@</span>
                            <input 
                                value={newUsername} 
                                onChange={(e) => setNewUsername(e.target.value.replace(/\s/g, ''))} // Sin espacios
                                className="border p-2 pl-7 rounded w-full bg-gray-50"
                            />
                        </div>
                        
                        <label className="text-left text-xs font-bold text-gray-500">Biografía</label>
                        <textarea 
                            value={newBio} 
                            onChange={(e) => setNewBio(e.target.value)}
                            className="border p-2 rounded w-full bg-gray-50 h-20 resize-none"
                        />
                        
                        <div className="flex gap-2 justify-center mt-2">
                            <button 
                                onClick={handleSaveProfile} 
                                disabled={loadingSave}
                                className="bg-black text-white px-4 py-2 rounded-lg font-bold text-sm w-full"
                            >
                                {loadingSave ? "Guardando..." : "Guardar Cambios"}
                            </button>
                            <button onClick={() => setIsEditing(false)} className="text-red-500 text-sm font-bold w-full border border-red-200 rounded-lg">Cancelar</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <h2 className="text-2xl font-black flex items-center justify-center gap-1 text-gray-900">
                            {profileData.displayName}
                            {profileData.isVerified && (
                                <span className="bg-blue-500 text-white text-[10px] p-1 rounded-full w-5 h-5 flex items-center justify-center" title="Verificado">✓</span>
                            )}
                        </h2>
                        <p className="text-gray-500 font-medium mb-1">@{profileData.username || "sin_usuario"}</p>
                        <p className="text-gray-700 mt-2 max-w-md mx-auto text-sm leading-relaxed">
                            {profileData.bio || "👋 ¡Hola! Soy nuevo en la comunidad."}
                        </p>

                        {/* Estadísticas */}
                        <div className="flex justify-center gap-8 my-6 border-y py-4 border-gray-100">
                            <div>
                                <span className="block font-black text-xl text-gray-800">{profileData.followers?.length || 0}</span>
                                <span className="text-xs text-gray-500 font-bold tracking-wider">SEGUIDORES</span>
                            </div>
                            <div>
                                <span className="block font-black text-xl text-gray-800">--</span>
                                <span className="text-xs text-gray-500 font-bold tracking-wider">ACIERTO</span>
                            </div>
                        </div>
                        
                        {/* Botones de Acción */}
                        <div className="flex gap-3 justify-center">
                            {isMyProfile ? (
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="bg-gray-100 text-gray-800 px-6 py-2 rounded-full font-bold text-sm hover:bg-gray-200 transition"
                                >
                                    ⚙️ Editar Perfil
                                </button>
                            ) : (
                                <button 
                                    onClick={handleFollow}
                                    className={`px-8 py-2 rounded-full font-bold text-sm transition shadow-sm
                                        ${isFollowing 
                                            ? "bg-white border-2 border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-500" 
                                            : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md"
                                        }
                                    `}
                                >
                                    {isFollowing ? "Siguiendo" : "Seguir"}
                                </button>
                            )}

                            {/* Botón Admin Secreto */}
                            {isAdmin && !isMyProfile && (
                                <button 
                                    onClick={toggleVerify}
                                    className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full font-bold text-sm"
                                >
                                    {profileData.isVerified ? "Quitar Verificado" : "Dar Verificado"}
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>

        {/* --- LISTA DE POSTS (Ahora bonita) --- */}
        <h3 className="font-bold text-gray-700 mb-4 ml-1">📜 Historial de Jugadas</h3>
        
        {/* Aquí pasamos el ID para que filtre solo los posts de este usuario */}
        <PostList user={currentUser} filterUserId={id} />

      </div>
    </div>
  );
}