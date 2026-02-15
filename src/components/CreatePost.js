// src/components/CreatePost.js
"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "../lib/firebase"; 
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import toast from "react-hot-toast";

export default function CreatePost({ user }) {
  // --- TUS DATOS DE CLOUDINARY ---
  const CLOUD_NAME = "dfwmxdbzw"; // <--- PON TU CLOUD NAME
  const UPLOAD_PRESET = "socialbet_posts";  // <--- PON TU PRESET UNSIGNED
  // -------------------------------

  const [isExpanded, setIsExpanded] = useState(false);
  const [match, setMatch] = useState("");
  const [prediction, setPrediction] = useState("");
  const [betHouse, setBetHouse] = useState("Ecuabet");
  const [betCode, setBetCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [isUserVerified, setIsUserVerified] = useState(false);
  
  // ESTADOS PARA IMAGEN
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Verificar si es usuario verificado
  useEffect(() => {
    const checkVerification = async () => {
        if(!user) return;
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().isVerified) {
            setIsUserVerified(true);
        }
    };
    checkVerification();
  }, [user]);

  // Focus al expandir
  useEffect(() => {
    if (isExpanded && textareaRef.current) {
        textareaRef.current.focus();
    }
  }, [isExpanded]);

  // Manejar selección de imagen
  const handleImageSelect = (e) => {
      const file = e.target.files[0];
      if (file) {
          if (file.size > 5000000) return toast.error("La imagen pesa más de 5MB", { style: { background: '#333', color: '#fff' }});
          setImageFile(file);
          setPreviewUrl(URL.createObjectURL(file));
      }
  };

  const removeImage = () => {
      setImageFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!match || !prediction) {
        toast.error("¡Faltan datos! Escribe el partido y tu análisis.", {
            style: { border: '1px solid #FF4B4B', padding: '16px', color: '#fff', background: '#374151' },
            iconTheme: { primary: '#FF4B4B', secondary: '#fff' },
        });
        return;
    }

    setLoading(true);
    const toastId = toast.loading('Publicando jugada... 🎲', { style: { background: '#1f2937', color: '#fff' } });

    try {
      let uploadedImageUrl = null;

      // 1. Subir imagen a Cloudinary (si existe)
      if (imageFile) {
          const formData = new FormData();
          formData.append("file", imageFile);
          formData.append("upload_preset", UPLOAD_PRESET);

          const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
              method: "POST",
              body: formData
          });

          if (!res.ok) throw new Error("Error subiendo imagen");
          const data = await res.json();
          uploadedImageUrl = data.secure_url;
      }

      // 2. Guardar en Firebase
      await addDoc(collection(db, "posts"), {
        userId: user.uid,
        username: user.displayName,
        userPhoto: user.photoURL,
        isVerified: isUserVerified,
        match: match,           
        prediction: prediction, 
        betHouse: betHouse,     
        betCode: betCode, 
        imageUrl: uploadedImageUrl,      
        likes: [],              
        createdAt: serverTimestamp(), 
      });

      toast.success('¡Jugada publicada! Buena suerte 🍀', { id: toastId, style: { background: '#1f2937', color: '#fff' } });

      // Resetear
      setMatch("");
      setPrediction("");
      setBetCode("");
      removeImage();
      setIsExpanded(false); 
      
    } catch (error) {
      console.error("Error subiendo post:", error);
      toast.error('Error al publicar ❌', { id: toastId, style: { background: '#1f2937', color: '#fff' } });
    } finally {
        setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsExpanded(false);
    setMatch("");
    setPrediction("");
    removeImage();
  }

  if (!user) return null;

  return (
    // CARD PRINCIPAL OSCURA
    <div className="bg-gray-900 p-4 rounded-xl shadow-lg mb-6 border border-gray-800 transition-all duration-300">
      
      {/* --- CABECERA (Siempre visible) --- */}
      <div className="flex gap-3">
        <img 
            src={user.photoURL} 
            className="w-10 h-10 rounded-full border border-gray-700 object-cover" 
            alt="User"
        />
        
        {!isExpanded ? (
            <div 
                onClick={() => setIsExpanded(true)}
                className="w-full bg-gray-800 hover:bg-gray-700 cursor-pointer rounded-full px-4 flex items-center text-gray-400 transition"
            >
                <span className="text-sm font-medium truncate">¿Cuál es la fija de hoy, {user.displayName.split(" ")[0]}? 📸</span>
            </div>
        ) : (
            <div className="flex-1">
                 <p className="text-sm font-bold text-gray-200 mt-2">Crear nueva jugada</p>
            </div>
        )}
      </div>

      {/* --- ÁREA EXPANDIBLE --- */}
      {isExpanded && (
          <form onSubmit={handleSubmit} className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
            
            {/* Input del Partido */}
            <div className="mb-3">
                <input
                  type="text"
                  placeholder="Evento (Ej: LDU vs Barcelona)"
                  className="w-full p-2 border-b border-gray-700 focus:border-cyan-500 focus:outline-none text-sm font-bold bg-transparent text-white placeholder-gray-500"
                  value={match}
                  onChange={(e) => setMatch(e.target.value)}
                  autoFocus
                />
            </div>

            {/* Textarea Principal */}
            <textarea
              ref={textareaRef}
              placeholder="Escribe tu análisis aquí... ¿Por qué ganan?"
              className="w-full p-3 border border-gray-700 rounded-xl bg-gray-950/50 min-h-[100px] focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm resize-none mb-3 text-gray-200 placeholder-gray-600"
              value={prediction}
              onChange={(e) => setPrediction(e.target.value)}
            />

            {/* PREVIEW DE IMAGEN */}
            {previewUrl && (
                <div className="relative mb-4 w-full h-48 bg-gray-800 rounded-xl overflow-hidden border border-gray-700 group">
                    <img src={previewUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" alt="Preview" />
                    <button 
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-red-500 transition border border-gray-600"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Opciones de Apuesta (Ticket) */}
            <div className="bg-cyan-900/10 p-3 rounded-lg border border-cyan-800/30 mb-4">
                <p className="text-xs font-bold text-cyan-400 mb-2 uppercase tracking-wide">🎟️ Datos del Ticket (Opcional)</p>
                <div className="flex gap-2 flex-col md:flex-row">
                    <select 
                        className="p-2 border border-gray-700 rounded-lg bg-gray-950 text-gray-300 text-sm focus:outline-none focus:border-cyan-500"
                        value={betHouse}
                        onChange={(e) => setBetHouse(e.target.value)}
                    >
                        <option value="Ecuabet">Ecuabet</option>
                        <option value="Betano">Betano</option>
                        <option value="Bet365">Bet365</option>
                        <option value="1xBet">1xBet</option>
                        <option value="Otra">Otra</option>
                    </select>

                    <input 
                        type="text"
                        placeholder="Código o Link de la apuesta"
                        className="flex-1 p-2 border border-gray-700 rounded-lg bg-gray-950 text-white text-sm focus:outline-none focus:border-cyan-500 placeholder-gray-600"
                        value={betCode}
                        onChange={(e) => setBetCode(e.target.value)}
                    />
                </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                
                {/* BOTÓN CÁMARA */}
                <div>
                    <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                    />
                    <button 
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="text-gray-400 hover:text-cyan-400 transition p-2 rounded-full hover:bg-gray-800"
                        title="Subir Ticket"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                        </svg>
                    </button>
                </div>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="px-4 py-2 rounded-lg text-gray-400 font-bold hover:bg-gray-800 text-sm transition"
                    >
                        Cancelar
                    </button>

                    <button
                        disabled={loading || !match || !prediction}
                        type="submit"
                        className="bg-cyan-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-cyan-500 transition disabled:opacity-50 text-sm shadow-md shadow-cyan-900/20"
                    >
                        {loading ? "Publicando..." : "Publicar"}
                    </button>
                </div>
            </div>
          </form>
      )}
    </div>
  );
}