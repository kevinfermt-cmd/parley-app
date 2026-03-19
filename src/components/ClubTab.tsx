import { useState } from "react";
import { db } from "../lib/firebase"; // Ajusta la ruta a tu firebase.js/ts si es necesario
import { doc, setDoc, query, collection, where, getDocs } from "firebase/firestore";
import { UserCircle2, LogOut, CheckCircle2, Save, X } from "lucide-react";
import toast from "react-hot-toast";

// Pasamos el profile (datos del Firestore) y onLogout (función)
export default function ClubTab({ profile, onLogout }: { profile: any, onLogout: () => void }) {
  // Estados para la Edición
  const [isEditing, setIsEditing] = useState(false);
  const [newClubName, setNewClubName] = useState(profile?.clubName || "");
  const [newUsername, setNewUsername] = useState(profile?.username?.replace('@', '') || "");
  const [newBio, setNewBio] = useState(profile?.bio || "");
  const [loadingSave, setLoadingSave] = useState(false);

  // Estadísticas del Club (Temporalmente estáticas hasta que guardemos partidos en la DB)
  // En el futuro, harías un query a la colección "matches" donde winner == profile.username
  const stats = { wins: profile?.wins || 0, draws: profile?.draws || 0, losses: profile?.losses || 0 };

  const handleSaveProfile = async () => {
    if (!newUsername.trim() || !newClubName.trim()) return toast.error("Campos vacíos");
    setLoadingSave(true);

    try {
      const formattedUsername = `@${newUsername}`;
      
      // Solo verificamos si cambió el username
      if (formattedUsername !== profile.username) {
        const q = query(collection(db, "users"), where("username", "==", formattedUsername));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setLoadingSave(false);
          toast.error(`${formattedUsername} ya existe.`);
          return;
        }
      }

      // Guardamos en Firestore
      // Nota: Aquí asumo que el ID del documento en Firestore es el UID del usuario, como lo configuramos en page.tsx
      const userRef = doc(db, "users", profile.uid || profile.id); // Ajusta según cómo guardaste el id en page.tsx
      
      await toast.promise(
        setDoc(userRef, {
          clubName: newClubName,
          bio: newBio,
          username: formattedUsername,
          searchKey: formattedUsername.toLowerCase()
        }, { merge: true }),
        {
          loading: 'Fijando contrato...',
          success: '¡Club actualizado! ✨',
          error: 'Error en la directiva',
        },
        { style: { background: '#111827', color: '#fff', border: '1px solid #1f2937' } }
      );

      // Si necesitas que el padre (page.tsx) se entere del cambio al instante, deberías pasarle una función setProfile,
      // pero por ahora si recarga la app o vuelve a iniciar sesión, se reflejará.
      
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      toast.error("Error crítico en la gestión");
    } finally {
      setLoadingSave(false);
    }
  };

  return (
    <div className="animate-in fade-in zoom-in duration-300 max-w-xl mx-auto w-full pb-10">
      
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-white tracking-widest italic">GESTIÓN DE <span className="text-indigo-400">CLUB</span></h2>
      </div>

      <div className="bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-800 transition-all relative">
        
        {isEditing ? (
          // --- MODO EDICIÓN ---
          <div className="p-6">
            <h3 className="font-bold text-lg text-white mb-6 pb-2 border-b border-gray-800 flex items-center gap-2">
              <Save className="w-5 h-5 text-indigo-400" />
              Editar Identidad del Club
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase block mb-1 tracking-widest">Nombre del Club</label>
                <input 
                  value={newClubName} 
                  onChange={(e) => setNewClubName(e.target.value)} 
                  maxLength={20}
                  className="w-full border-2 border-gray-800 p-3 rounded-xl bg-gray-950 text-white focus:outline-none focus:border-indigo-500 transition font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase block mb-1 tracking-widest">Usuario Único (@)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-indigo-500 font-black">@</span>
                  <input 
                    value={newUsername} 
                    onChange={(e) => setNewUsername(e.target.value.replace(/\s/g, ''))} 
                    maxLength={15}
                    className="w-full border-2 border-gray-800 p-3 pl-8 rounded-xl bg-gray-950 text-white focus:outline-none focus:border-indigo-500 transition font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase block mb-1 tracking-widest">Biografía o Lema</label>
                <textarea 
                  value={newBio} 
                  onChange={(e) => setNewBio(e.target.value)}
                  maxLength={100}
                  className="w-full border-2 border-gray-800 p-3 rounded-xl bg-gray-950 text-white h-24 resize-none focus:outline-none focus:border-indigo-500 transition font-medium text-sm"
                  placeholder="Lema del equipo, táctica favorita..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsEditing(false)} className="flex-1 py-3 rounded-xl font-bold text-gray-400 bg-gray-800 hover:bg-gray-700 transition flex items-center justify-center gap-2">
                <X className="w-5 h-5" /> Cancelar
              </button>
              <button onClick={handleSaveProfile} disabled={loadingSave} className="flex-1 py-3 rounded-xl font-bold text-gray-950 bg-indigo-500 hover:bg-indigo-400 transition shadow-[0_0_20px_rgba(99,102,241,0.3)] flex items-center justify-center gap-2">
                {loadingSave ? <div className="w-5 h-5 border-2 border-gray-950 border-t-transparent rounded-full animate-spin"></div> : 'Confirmar'}
              </button>
            </div>
          </div>

        ) : (
          // --- MODO VISTA (Perfil tipo credencial / SocialBet) ---
          <>
            {/* Header oscuro tipo banner */}
            <div className="h-32 bg-gradient-to-br from-indigo-900 to-gray-900 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30"></div>
              {/* Degradado inferior para mezcla suave */}
              <div className="absolute bottom-0 w-full h-12 bg-gradient-to-t from-gray-900 to-transparent"></div>
            </div>
            
            <div className="px-6 pb-6 text-center -mt-16 relative z-10">
              <div className="relative inline-block">
                <img 
                  src={profile?.photoURL || "https://ui-avatars.com/api/?name=C&background=4f46e5&color=fff"} 
                  className="w-28 h-28 rounded-full border-[6px] border-gray-900 shadow-2xl mx-auto object-cover bg-gray-800"
                  alt="Escudo"
                />
                {/* Badge Divisón */}
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-600 to-yellow-400 border-2 border-gray-900 text-gray-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">
                  DIV 10
                </div>
              </div>
              
              <h2 className="text-3xl font-black flex items-center justify-center gap-1 text-white mt-3 leading-none">
                {profile?.clubName || "Club Anónimo"}
                {profile?.isVerified && (
                  <CheckCircle2 className="w-6 h-6 text-cyan-400 fill-cyan-400/20" />
                )}
              </h2>
              <p className="text-indigo-400 font-black text-sm mt-1">{profile?.username || "@usuario"}</p>
              
              <p className="text-gray-400 mt-4 text-sm leading-relaxed max-w-sm mx-auto bg-gray-950/60 p-4 rounded-2xl border border-gray-800/50 shadow-inner italic">
                "{profile?.bio || "Preparando la táctica para el próximo duelo."}"
              </p>

              {/* --- ESTADÍSTICAS DEL CLUB --- */}
              <div className="grid grid-cols-3 gap-2 my-6 py-5 border-t border-b border-gray-800 bg-gray-950/40 rounded-2xl">
                <div className="flex flex-col border-r border-gray-800">
                  <span className="font-black text-2xl text-green-400">{stats.wins}</span>
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-1">Victorias</span>
                </div>
                <div className="flex flex-col border-r border-gray-800">
                  <span className="font-black text-2xl text-gray-400">{stats.draws}</span>
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-1">Empates</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-2xl text-red-400">{stats.losses}</span>
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-1">Derrotas</span>
                </div>
              </div>
              
              {/* Información del Mánager (Dueño) */}
              <div className="w-full bg-gray-950/80 rounded-2xl p-4 flex justify-between items-center mb-6 border border-gray-800">
                <div className="flex flex-col text-left">
                  <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Dueño / Mánager</span>
                  <span className="text-white font-bold">{profile?.ownerName || "Desconocido"}</span>
                </div>
                <UserCircle2 className="text-gray-600 w-8 h-8" />
              </div>

              {/* Botones de Acción */}
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex-1 bg-gray-800 text-white border border-gray-700 px-4 py-3.5 rounded-xl font-bold text-sm hover:bg-gray-700 transition shadow-lg flex items-center justify-center gap-2"
                >
                  Modificar Plantilla
                </button>
                <button 
                  onClick={onLogout}
                  className="bg-red-900/20 text-red-500 border border-red-900/30 px-4 py-3.5 rounded-xl font-bold hover:bg-red-900/40 transition shadow-lg flex items-center justify-center"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

    </div>
  );
}