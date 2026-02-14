// src/components/ChatRoom.js
"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";

export default function ChatRoom({ matchId, user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const dummyDiv = useRef(null);

  useEffect(() => {
    const messagesRef = collection(db, "matches", matchId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      setTimeout(() => {
        dummyDiv.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });

    return () => unsubscribe();
  }, [matchId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    if (!user) return toast.error("Inicia sesión para chatear 🔒");

    const text = newMessage;
    setNewMessage(""); 

    try {
      await addDoc(collection(db, "matches", matchId, "messages"), {
        text: text,
        uid: user.uid,
        username: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error enviando:", error);
      toast.error("No se pudo enviar el mensaje");
    }
  };

  return (
    // CONTENEDOR PRINCIPAL: Gris muy oscuro con borde sutil
    <div className="flex flex-col h-[500px] bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
      
      {/* Cabecera del Chat (Estilo iOS Dark) */}
      <div className="bg-gray-900/50 backdrop-blur-md border-b border-gray-800 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <span className="text-lg">💬</span>
            <span className="text-xs font-black uppercase tracking-widest text-white">Hinchada</span>
        </div>
        <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-full">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
            <span className="text-[9px] font-black text-red-500 uppercase tracking-tighter">Live</span>
        </div>
      </div>

      {/* Área de Mensajes (Fondo casi negro) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-950/30">
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full opacity-20">
                <span className="text-4xl mb-2">⚽</span>
                <p className="text-xs font-bold uppercase tracking-widest text-white text-center px-10">
                    El estadio está en silencio... <br/> ¡Empieza el debate!
                </p>
            </div>
        )}
        
        {messages.map((msg) => {
          const isMe = msg.uid === user?.uid;
          return (
            <div key={msg.id} className={`flex items-start gap-2 animate-in fade-in slide-in-from-bottom-1 ${isMe ? "flex-row-reverse" : ""}`}>
              <img 
                src={msg.photoURL || "https://via.placeholder.com/30"} 
                className={`w-8 h-8 rounded-full border-2 ${isMe ? "border-cyan-500/30" : "border-gray-800"} object-cover`}
              />
              <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${
                  isMe 
                  ? "bg-cyan-600 text-white rounded-tr-none" 
                  : "bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700"
              }`}>
                {!isMe && (
                    <p className="text-[10px] font-black text-cyan-400 mb-1 uppercase tracking-tighter">
                        {msg.username}
                    </p>
                )}
                <p className="text-sm leading-relaxed font-medium">{msg.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={dummyDiv}></div>
      </div>

      {/* Input de Texto (Estilo Moderno) */}
      <form onSubmit={sendMessage} className="p-4 bg-gray-900 border-t border-gray-800 flex gap-2 items-center">
        <div className="flex-1 relative">
            <input
              disabled={!user}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={user ? "Escribe a la hinchada..." : "Inicia sesión para participar"}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
            />
        </div>
        
        <button 
            disabled={!newMessage.trim() || !user}
            type="submit" 
            className="bg-cyan-600 text-white p-2.5 rounded-xl hover:bg-cyan-500 disabled:opacity-30 disabled:grayscale transition-all shadow-lg shadow-cyan-900/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </form>
    </div>
  );
}