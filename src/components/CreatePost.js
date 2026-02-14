// src/components/CreatePost.js
"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "../lib/firebase"; 
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";

export default function CreatePost({ user }) {
  const [isExpanded, setIsExpanded] = useState(false); // <--- ESTADO MAGICO
  const [match, setMatch] = useState("");
  const [prediction, setPrediction] = useState("");
  const [betHouse, setBetHouse] = useState("Ecuabet");
  const [betCode, setBetCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [isUserVerified, setIsUserVerified] = useState(false);
  
  const textareaRef = useRef(null);

  // Verificar si es usuario verificado (Check Azul)
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

  // Enfocar el textarea cuando se expande
  useEffect(() => {
    if (isExpanded && textareaRef.current) {
        textareaRef.current.focus();
    }
  }, [isExpanded]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!match || !prediction) return;

    setLoading(true);

    try {
      await addDoc(collection(db, "posts"), {
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
      });

      // Resetear todo y cerrar
      setMatch("");
      setPrediction("");
      setBetCode("");
      setIsExpanded(false); 
      
    } catch (error) {
      console.error("Error subiendo post:", error);
      alert("Hubo un error al publicar.");
    }

    setLoading(false);
  };

  const handleCancel = () => {
    setIsExpanded(false);
    setMatch("");
    setPrediction("");
  }

  if (!user) return null;

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm mb-6 border border-gray-200 transition-all duration-300">
      
      {/* --- CABECERA (Siempre visible) --- */}
      <div className="flex gap-3">
        <img 
            src={user.photoURL} 
            className="w-10 h-10 rounded-full border border-gray-200 object-cover" 
            alt="User"
        />
        
        {/* Si NO está expandido, mostramos la "píldora" tipo Facebook */}
        {!isExpanded ? (
            <div 
                onClick={() => setIsExpanded(true)}
                className="w-full bg-gray-100 hover:bg-gray-200 cursor-pointer rounded-full px-4 flex items-center text-gray-500 transition"
            >
                <span className="text-sm font-medium">¿Cuál es la fija de hoy, {user.displayName.split(" ")[0]}? ⚽</span>
            </div>
        ) : (
            // Si ESTÁ expandido, mostramos el título del formulario
            <div className="flex-1">
                 <p className="text-sm font-bold text-gray-800 mt-2">Crear nueva jugada</p>
            </div>
        )}
      </div>

      {/* --- ÁREA EXPANDIBLE (Con animación) --- */}
      {isExpanded && (
          <form onSubmit={handleSubmit} className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
            
            {/* Input del Partido */}
            <div className="mb-3">
                <input
                  type="text"
                  placeholder="Evento (Ej: LDU vs Barcelona)"
                  className="w-full p-2 border-b border-gray-200 focus:border-blue-500 focus:outline-none text-sm font-bold bg-transparent"
                  value={match}
                  onChange={(e) => setMatch(e.target.value)}
                  autoFocus
                />
            </div>

            {/* Textarea Principal */}
            <textarea
              ref={textareaRef}
              placeholder="Escribe tu análisis aquí... ¿Por qué ganan?"
              className="w-full p-3 border rounded-xl bg-gray-50 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm resize-none mb-3"
              value={prediction}
              onChange={(e) => setPrediction(e.target.value)}
            />

            {/* Opciones de Apuesta (Ticket) */}
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
                <p className="text-xs font-bold text-blue-800 mb-2 uppercase tracking-wide">🎟️ Datos del Ticket (Opcional)</p>
                <div className="flex gap-2 flex-col md:flex-row">
                    <select 
                        className="p-2 border border-blue-200 rounded-lg bg-white text-sm focus:outline-none"
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
                        className="flex-1 p-2 border border-blue-200 rounded-lg bg-white text-sm focus:outline-none"
                        value={betCode}
                        onChange={(e) => setBetCode(e.target.value)}
                    />
                </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-lg text-gray-500 font-bold hover:bg-gray-100 text-sm transition"
                >
                  Cancelar
                </button>

                <button
                  disabled={loading || !match || !prediction}
                  type="submit"
                  className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm shadow-md"
                >
                  {loading ? "Publicando..." : "Publicar"}
                </button>
            </div>
          </form>
      )}
    </div>
  );
}