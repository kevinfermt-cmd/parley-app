// src/components/CreatePost.js
"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "../lib/firebase"; 
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import toast from "react-hot-toast";

export default function CreatePost({ user }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [match, setMatch] = useState("");
  const [prediction, setPrediction] = useState("");
  const [betHouse, setBetHouse] = useState("Ecuabet");
  const [betCode, setBetCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [isUserVerified, setIsUserVerified] = useState(false);
  
  const textareaRef = useRef(null);

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

  useEffect(() => {
    if (isExpanded && textareaRef.current) {
        textareaRef.current.focus();
    }
  }, [isExpanded]);

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

    try {
      await toast.promise(
        addDoc(collection(db, "posts"), {
            userId: user.uid,
            username: user.displayName,
            userPhoto: user.photoURL,
            isVerified: isUserVerified,
            match: match,           
            prediction: prediction, 
            betHouse: betHouse,     
            betCode: betCode,       
            likes: [],              
            createdAt: serverTimestamp(), 
        }),
        {
            loading: 'Publicando jugada... 🎲',
            success: '¡Jugada publicada! Buena suerte 🍀',
            error: 'Error al publicar ❌',
        },
        {
            style: {
                minWidth: '250px',
                background: '#1f2937',
                color: '#fff',
            }
        }
      );

      setMatch("");
      setPrediction("");
      setBetCode("");
      setIsExpanded(false); 
      
    } catch (error) {
      console.error("Error subiendo post:", error);
    } finally {
        setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsExpanded(false);
    setMatch("");
    setPrediction("");
  }

  if (!user) return null;

  return (
    // CAMBIO: Fondo gris oscuro (gray-900) y borde sutil
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
                // CAMBIO: Fondo del input falso en gris más claro (gray-800)
                className="w-full bg-gray-800 hover:bg-gray-700 cursor-pointer rounded-full px-4 flex items-center text-gray-400 transition"
            >
                <span className="text-sm font-medium">¿Cuál es la fija de hoy, {user.displayName.split(" ")[0]}? ⚽</span>
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
                  // CAMBIO: Texto blanco, placeholder gris, borde cyan al enfocar
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
              // CAMBIO: Fondo muy oscuro (gray-950), texto claro
              className="w-full p-3 border border-gray-700 rounded-xl bg-gray-950/50 min-h-[100px] focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm resize-none mb-3 text-gray-200 placeholder-gray-600"
              value={prediction}
              onChange={(e) => setPrediction(e.target.value)}
            />

            {/* Opciones de Apuesta (Ticket) */}
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 mb-4">
                <p className="text-xs font-bold text-cyan-400 mb-2 uppercase tracking-wide">🎟️ Datos del Ticket (Opcional)</p>
                <div className="flex gap-2 flex-col md:flex-row">
                    <select 
                        // CAMBIO: Select oscuro
                        className="p-2 border border-gray-600 rounded-lg bg-gray-900 text-gray-200 text-sm focus:outline-none focus:border-cyan-500"
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
                        className="flex-1 p-2 border border-gray-600 rounded-lg bg-gray-900 text-white text-sm focus:outline-none focus:border-cyan-500 placeholder-gray-500"
                        value={betCode}
                        onChange={(e) => setBetCode(e.target.value)}
                    />
                </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-800">
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
                  // CAMBIO: Botón Cyan
                  className="bg-cyan-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-cyan-500 transition disabled:opacity-50 text-sm shadow-md shadow-cyan-900/20"
                >
                  {loading ? "Publicando..." : "Publicar"}
                </button>
            </div>
          </form>
      )}
    </div>
  );
}