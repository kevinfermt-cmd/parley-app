// src/components/PostList.js
"use client";
import { useState, useEffect } from "react";
import { db } from "../lib/firebase"; 
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, where, addDoc, serverTimestamp, getDoc, setDoc } from "firebase/firestore";
import Link from "next/link"; 

// --- SUB-COMPONENTE DE COMENTARIOS ---
function CommentSection({ postId, user }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(false);

    // Cargar comentarios en tiempo real
    useEffect(() => {
        const q = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, [postId]);

    const handleSend = async (e) => {
        e.preventDefault();
        if(!newComment.trim() || !user) return;
        setLoading(true);
        try {
            await addDoc(collection(db, "posts", postId, "comments"), {
                text: newComment,
                uid: user.uid,
                username: user.displayName,
                photoURL: user.photoURL,
                createdAt: serverTimestamp()
            });
            setNewComment("");
        } catch (error) { console.error(error); }
        setLoading(false);
    };

    return (
        <div className="mt-4 pt-3 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
            {/* Lista de Comentarios */}
            <div className="space-y-3 mb-3 max-h-60 overflow-y-auto">
                {comments.length === 0 && <p className="text-xs text-gray-400 italic">Sé el primero en opinar...</p>}
                {comments.map(c => (
                    <div key={c.id} className="flex gap-2 text-sm">
                        <img src={c.photoURL} className="w-6 h-6 rounded-full mt-1" />
                        <div className="bg-gray-50 p-2 rounded-lg flex-1">
                            <span className="font-bold text-xs block text-gray-700">{c.username}</span>
                            <span className="text-gray-600">{c.text}</span>
                        </div>
                    </div>
                ))}
            </div>
            {/* Input */}
            {user && (
                <form onSubmit={handleSend} className="flex gap-2">
                    <input 
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Escribe un comentario..." 
                        className="flex-1 bg-gray-100 border-0 rounded-full px-3 py-1 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                    <button disabled={loading || !newComment.trim()} className="text-blue-600 font-bold text-xs disabled:opacity-50">Publicar</button>
                </form>
            )}
        </div>
    );
}

// --- COMPONENTE PRINCIPAL ---
export default function PostList({ user, filterUserId = null }) {
  const [posts, setPosts] = useState([]);
  const [following, setFollowing] = useState([]); // Lista de a quién sigo yo
  const [expandedComments, setExpandedComments] = useState({}); // Qué posts tienen comentarios abiertos

  // 1. Cargar Posts
  useEffect(() => {
    let q;
    if (filterUserId) {
      q = query(collection(db, "posts"), where("userId", "==", filterUserId), orderBy("createdAt", "desc"));
    } else {
      q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    }
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [filterUserId]);

  // 2. Cargar a quién sigo (para mostrar botones de Seguir/Siguiendo)
  useEffect(() => {
    if (!user) return;
    const fetchFollowing = async () => {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            setFollowing(userDoc.data().following || []); // Array de IDs
        }
    };
    fetchFollowing();
  }, [user]);

  // --- ACCIONES ---

  const handleLike = async (postId, likesArray) => {
    if (!user) return alert("Inicia sesión para dar like ❤️");
    const postRef = doc(db, "posts", postId);
    const isLiked = likesArray?.includes(user.uid);
    if (isLiked) await updateDoc(postRef, { likes: arrayRemove(user.uid) });
    else await updateDoc(postRef, { likes: arrayUnion(user.uid) });
  };

  const handleFollow = async (authorId) => {
    if (!user) return alert("Inicia sesión para seguir usuarios");
    
    // Referencia: Yo (user.uid) sigo a Autor (authorId)
    // Actualizamos MI documento (users/mi_id) agregando a quién sigo
    const myRef = doc(db, "users", user.uid);
    const authorRef = doc(db, "users", authorId);

    // Optimista: Actualizamos estado local rápido
    const isFollowing = following.includes(authorId);
    
    try {
        if (isFollowing) {
            // Dejar de seguir
            await updateDoc(myRef, { following: arrayRemove(authorId) });
            await updateDoc(authorRef, { followers: arrayRemove(user.uid) });
            setFollowing(prev => prev.filter(id => id !== authorId));
        } else {
            // Seguir
            // Nota: Usamos setDoc con merge por si el usuario no existe aun en DB
            await setDoc(myRef, { following: arrayUnion(authorId) }, { merge: true });
            await setDoc(authorRef, { followers: arrayUnion(user.uid) }, { merge: true });
            setFollowing(prev => [...prev, authorId]);
        }
    } catch (error) { console.error(error); }
  };

  const toggleComments = (postId) => {
    setExpandedComments(prev => ({
        ...prev,
        [postId]: !prev[postId]
    }));
  };

  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); alert("Copiado! 📋"); };

  return (
    <div className="space-y-4">
      {posts.length === 0 && <p className="text-center text-gray-400 py-10">Cargando jugadas... ⚽</p>}

      {posts.map((post) => {
        const isLiked = post.likes?.includes(user?.uid);
        const isLink = post.betCode?.startsWith("http");
        const isMe = user?.uid === post.userId;
        const isFollowing = following.includes(post.userId);

        return (
          <div key={post.id} className="bg-white p-4 md:p-5 rounded-xl shadow-sm border border-gray-200">
            
            {/* CABECERA: Usuario + Verificado + Seguir */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                    <Link href={`/profile/${post.userId}`}>
                        <img 
                            src={post.userPhoto || "https://via.placeholder.com/40"} 
                            className="w-10 h-10 rounded-full mr-3 border border-gray-100 object-cover"
                        />
                    </Link>
                    <div>
                        <div className="flex items-center gap-1">
                            <Link href={`/profile/${post.userId}`} className="font-bold text-gray-900 text-sm hover:underline">
                                {post.username}
                            </Link>
                            {/* CHECK AZUL DE VERIFICADO */}
                            {post.isVerified && (
                                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        <p className="text-xs text-gray-500">
                            {post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : "Ahora"}
                        </p>
                    </div>
                </div>

                {/* BOTÓN SEGUIR (Solo si no soy yo) */}
                {!isMe && user && (
                    <button 
                        onClick={() => handleFollow(post.userId)}
                        className={`text-xs font-bold px-3 py-1 rounded-full border transition
                            ${isFollowing 
                                ? "bg-white border-gray-300 text-gray-500" 
                                : "bg-blue-600 border-blue-600 text-white"}
                        `}
                    >
                        {isFollowing ? "Siguiendo" : "Seguir"}
                    </button>
                )}
            </div>

            {/* CONTENIDO DEL POST */}
            <div className="mb-3">
              <h4 className="font-black text-gray-800 text-base uppercase tracking-tight">
                ⚽ {post.match}
              </h4>
              <p className="text-gray-700 mt-2 text-sm md:text-base leading-relaxed">
                {post.prediction}
              </p>

              {/* TICKET DE APUESTA */}
              {post.betCode && (
                <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-100 mt-3">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase">
                            {post.betHouse || "Apuesta"}
                        </span>
                        <code className="font-mono font-bold text-blue-900 text-sm truncate">
                            {post.betCode}
                        </code>
                    </div>
                    {isLink ? (
                        <a href={post.betCode} target="_blank" rel="noopener noreferrer" className="text-xs bg-white border border-blue-200 px-3 py-1 rounded font-bold text-blue-700">Ver</a>
                    ) : (
                        <button onClick={() => copyToClipboard(post.betCode)} className="text-xs bg-white border border-blue-200 px-3 py-1 rounded font-bold text-blue-700">Copiar</button>
                    )}
                </div>
              )}
            </div>

            {/* BOTONES INTERACCIÓN */}
            <div className="flex items-center gap-6 text-gray-500 text-sm border-t pt-3 border-gray-100">
              {/* Like */}
              <button 
                onClick={() => handleLike(post.id, post.likes || [])}
                className={`flex items-center transition gap-1 ${isLiked ? "text-red-500" : "hover:text-red-500"}`}
              >
                {isLiked ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
                )}
                <span className="font-bold">{post.likes?.length || 0}</span>
              </button>

              {/* Comentarios */}
              <button 
                onClick={() => toggleComments(post.id)}
                className={`flex items-center transition gap-1 ${expandedComments[post.id] ? "text-blue-600" : "hover:text-blue-600"}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                </svg>
                <span className="font-bold">Comentar</span>
              </button>
            </div>

            {/* SECCIÓN DE COMENTARIOS (Solo si está abierto) */}
            {expandedComments[post.id] && (
                <CommentSection postId={post.id} user={user} />
            )}

          </div>
        );
      })}
    </div>
  );
}