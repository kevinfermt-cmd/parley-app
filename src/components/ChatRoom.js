// src/components/ChatRoom.js
"use client";
import { useState, useEffect, useRef } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";

export default function ChatRoom({ matchId, user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const dummyDiv = useRef(null); // Para auto-scroll al fondo

  // 1. Escuchar mensajes en tiempo real para ESTE partido
  useEffect(() => {
    // La ruta en la DB será: matches / [ID_DEL_PARTIDO] / messages
    const messagesRef = collection(db, "matches", matchId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      // Hacer scroll abajo cuando llega mensaje nuevo
      dummyDiv.current?.scrollIntoView({ behavior: "smooth" });
    });

    return () => unsubscribe();
  }, [matchId]);

  // 2. Enviar Mensaje
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    if (!user) return alert("Debes iniciar sesión para chatear 🔒");

    const text = newMessage;
    setNewMessage(""); // Limpiar input rápido para UX

    try {
      await addDoc(collection(db, "matches", matchId, "messages"), {
        text: text,
        uid: user.uid,
        username: user.displayName, // O user.username si lo guardaste en tu DB personalizada
        photoURL: user.photoURL,
        createdAt: serverTimestamp()
      });
      dummyDiv.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Error enviando:", error);
    }
  };

  return (
    <div className="flex flex-col h-[400px] bg-gray-50 rounded-xl border border-gray-200 shadow-inner">
      
      {/* Cabecera del Chat */}
      <div className="bg-gray-800 text-white p-3 rounded-t-xl text-xs font-bold uppercase tracking-wider flex justify-between items-center">
        <span>💬 Chat de la Hinchada</span>
        <span className="bg-green-500 text-black px-2 rounded-full text-[10px] animate-pulse">EN VIVO</span>
      </div>

      {/* Área de Mensajes (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
        {messages.length === 0 && (
            <p className="text-center text-gray-400 text-sm mt-10">Sé el primero en gritar gol... 🦗</p>
        )}
        
        {messages.map((msg) => {
          const isMe = msg.uid === user?.uid;
          return (
            <div key={msg.id} className={`flex items-start gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
              <img 
                src={msg.photoURL || "https://via.placeholder.com/30"} 
                className="w-8 h-8 rounded-full border border-gray-200"
              />
              <div className={`max-w-[80%] p-2 rounded-lg text-sm ${
                  isMe ? "bg-blue-600 text-white rounded-tr-none" : "bg-gray-100 text-gray-800 rounded-tl-none"
              }`}>
                {!isMe && <p className="text-[10px] font-bold text-gray-500 mb-0.5">{msg.username}</p>}
                <p>{msg.text}</p>
              </div>
            </div>
          );
        })}
        {/* Elemento invisible para scroll automático */}
        <div ref={dummyDiv}></div>
      </div>

      {/* Input de Texto */}
      <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-200 rounded-b-xl flex gap-2">
        <input
          disabled={!user}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={user ? "Escribe tu jugada o grita gol..." : "Inicia sesión para chatear"}
          className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2 focus:ring-2 focus:ring-blue-500 text-sm outline-none"
        />
        <button 
            disabled={!newMessage.trim() || !user}
            type="submit" 
            className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </form>
    </div>
  );
}