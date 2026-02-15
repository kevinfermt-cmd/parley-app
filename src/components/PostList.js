// src/components/PostList.js
"use client";
import { useState, useEffect } from "react";
import { db } from "../lib/firebase"; 
// AGREGADO: deleteDoc para borrar posts
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, where, addDoc, serverTimestamp, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import Link from "next/link"; 
import toast from "react-hot-toast";

// --- FUNCIÓN PARA LOS COLORES DE LAS CASAS ---
const getBetHouseColor = (house) => {
    switch (house) {
        case 'Ecuabet': return 'bg-yellow-400 text-black border border-yellow-500';
        case 'Betano': return 'bg-orange-600 text-white border border-orange-500';
        case 'Bet365': return 'bg-green-700 text-white border border-green-500';
        case '1xBet': return 'bg-blue-600 text-white border border-blue-500';
        default: return 'bg-gray-700 text-gray-300 border border-gray-600';
    }
};

// --- SUB-COMPONENTE DE COMENTARIOS ---
function CommentSection({ postId, user }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [loading, setLoading] = useState(false);

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
            toast.success("Comentario enviado");
        } catch (error) { console.error(error); }
        setLoading(false);
    };

    return (
        <div className="mt-4 pt-3 border-t border-gray-800 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-3 mb-3 max-h-60 overflow-y-auto">
                {comments.length === 0 && <p className="text-xs text-gray-500 italic">Sé el primero en opinar...</p>}
                {comments.map(c => (
                    <div key={c.id} className="flex gap-2 text-sm">
                        <img src={c.photoURL} className="w-6 h-6 rounded-full mt-1 border border-gray-700" />
                        <div className="bg-gray-800 p-2 rounded-lg flex-1">
                            <span className="font-bold text-xs block text-gray-300">{c.username}</span>
                            <span className="text-gray-400">{c.text}</span>
                        </div>
                    </div>
                ))}
            </div>
            {user && (
                <form onSubmit={handleSend} className="flex gap-2">
                    <input 
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder="Escribe un comentario..." 
                        className="flex-1 bg-gray-950 border border-gray-700 rounded-full px-3 py-1 text-sm focus:ring-1 focus:ring-cyan-500 outline-none text-gray-200 placeholder-gray-600"
                    />
                    <button disabled={loading || !newComment.trim()} className="text-cyan-500 font-bold text-xs disabled:opacity-50 hover:text-cyan-400 transition">Publicar</button>
                </form>
            )}
        </div>
    );
}

// --- COMPONENTE PRINCIPAL (PostList) ---
export default function PostList({ user, filterUserId = null, mode = "general", refreshTrigger }) {
  const [posts, setPosts] = useState([]);
  const [following, setFollowing] = useState([]); 
  const [expandedComments, setExpandedComments] = useState({}); 
  const [loading, setLoading] = useState(true);

  // DETECTAR ADMIN
  const isAdmin = user?.email === "kevinfer.mt@gmail.com";

  // 1. Cargar lista de seguidos
  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
        if (docSnap.exists()) {
            setFollowing(docSnap.data().following || []);
        }
    });
    return () => unsubscribe();
  }, [user]);

  // 2. Cargar Posts según el MODO
  useEffect(() => {
    setLoading(true);
    let q;
    if (filterUserId) {
      q = query(collection(db, "posts"), where("userId", "==", filterUserId), orderBy("createdAt", "desc"));
    } 
    else if (mode === "following") {
        if (following.length === 0) {
            setPosts([]); 
            setLoading(false);
            return;
        }
        q = query(collection(db, "posts"), where("userId", "in", following.slice(0, 30)), orderBy("createdAt", "desc"));
    }
    else if (mode === "trending") {
        const twelveHoursAgo = new Date();
        twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);
        q = query(collection(db, "posts"), where("createdAt", ">=", twelveHoursAgo));
    }
    else {
      q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let fetchedPosts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      if (mode === "trending") {
          fetchedPosts.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
      } 
      setPosts(fetchedPosts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [filterUserId, mode, following, refreshTrigger]); 

  // --- ACCIONES ---

  // NUEVA FUNCIÓN: BORRAR POST (SOLO ADMIN)
  const handleDeletePost = async (postId) => {
    if(!isAdmin) return;
    if(!confirm("⚠️ ADMIN: ¿Estás seguro de ELIMINAR este post? Esta acción no se puede deshacer.")) return;

    try {
        await deleteDoc(doc(db, "posts", postId));
        toast.success("Post eliminado correctamente 🗑️");
    } catch (error) {
        console.error("Error borrando post:", error);
        toast.error("Error al eliminar post");
    }
  };

  const handleValidation = async (postId, type, currentYes, currentNo) => {
    if (!user) return toast.error("Inicia sesión para validar ✅");
    
    const postRef = doc(db, "posts", postId);
    const uid = user.uid;

    try {
        if (type === "YES") {
            if (currentYes?.includes(uid)) {
                await updateDoc(postRef, { validationsYes: arrayRemove(uid) });
            } else {
                await updateDoc(postRef, { 
                    validationsYes: arrayUnion(uid),
                    validationsNo: arrayRemove(uid)
                });
                toast.success("Marcado como Acierto 🤑");
            }
        } else if (type === "NO") {
            if (currentNo?.includes(uid)) {
                await updateDoc(postRef, { validationsNo: arrayRemove(uid) });
            } else {
                await updateDoc(postRef, { 
                    validationsNo: arrayUnion(uid),
                    validationsYes: arrayRemove(uid)
                });
                toast("Marcado como Fallo", { icon: '📉' });
            }
        }
    } catch (error) {
        console.error("Error votando:", error);
    }
  };

  const handleLike = async (postId, likesArray) => {
    if (!user) return toast.error("Inicia sesión para dar like ❤️");
    const postRef = doc(db, "posts", postId);
    const isLiked = likesArray?.includes(user.uid);
    if (isLiked) await updateDoc(postRef, { likes: arrayRemove(user.uid) });
    else await updateDoc(postRef, { likes: arrayUnion(user.uid) });
  };

  const handleFollow = async (authorId) => {
    if (!user) return toast.error("Inicia sesión para seguir");
    const myRef = doc(db, "users", user.uid);
    const authorRef = doc(db, "users", authorId);
    const isFollowing = following.includes(authorId);
    
    try {
        if (isFollowing) {
            await updateDoc(myRef, { following: arrayRemove(authorId) });
            await updateDoc(authorRef, { followers: arrayRemove(user.uid) });
            toast("Dejaste de seguir", { icon: '👋' });
        } else {
            await setDoc(myRef, { following: arrayUnion(authorId) }, { merge: true });
            await setDoc(authorRef, { followers: arrayUnion(user.uid) }, { merge: true });
            toast.success("Siguiendo usuario");
        }
    } catch (error) { console.error(error); }
  };

  const toggleComments = (postId) => {
    setExpandedComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const copyToClipboard = (text) => { 
      navigator.clipboard.writeText(text); 
      toast.success("Copiado al portapapeles 📋"); 
  };

  // --- RENDER ---

  if (loading) return <div className="text-center py-10 animate-pulse text-xs font-bold text-gray-500 uppercase tracking-widest">Cargando jugadas...</div>;

  return (
    <div className="space-y-4">
      {posts.length === 0 && (
        <div className="text-center py-12 bg-gray-900/50 rounded-2xl border border-dashed border-gray-800">
             <p className="text-gray-500">No hay jugadas disponibles. ⚽</p>
        </div>
      )}

      {posts.map((post) => {
        const isLiked = post.likes?.includes(user?.uid);
        const isLink = post.betCode?.startsWith("http");
        const isMe = user?.uid === post.userId;
        const isFollowing = following.includes(post.userId);

        // Variables de Votación
        const votesYes = post.validationsYes || [];
        const votesNo = post.validationsNo || [];
        const votedYes = votesYes.includes(user?.uid);
        const votedNo = votesNo.includes(user?.uid);

        return (
          <div key={post.id} className="bg-gray-900 p-4 md:p-5 rounded-xl shadow-lg border border-gray-800 transition hover:border-gray-700 relative">
            
            {/* CABECERA */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                    <Link href={`/profile/${post.userId}`}>
                        <img 
                            src={post.userPhoto || "https://via.placeholder.com/40"} 
                            className="w-10 h-10 rounded-full mr-3 border border-gray-700 object-cover"
                        />
                    </Link>
                    <div>
                        <div className="flex items-center gap-1">
                            <Link href={`/profile/${post.userId}`} className="font-bold text-gray-200 text-sm hover:underline hover:text-cyan-400 transition">
                                {post.username}
                            </Link>
                            {post.isVerified && (
                                <svg className="w-4 h-4 text-cyan-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        <p className="text-xs text-gray-500">
                            {post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : "Ahora"}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* BOTÓN DE BORRADO PARA ADMIN */}
                    {isAdmin && (
                        <button 
                            onClick={() => handleDeletePost(post.id)}
                            className="text-gray-500 hover:text-red-500 hover:bg-red-900/20 p-2 rounded-full transition"
                            title="Eliminar Post (Admin)"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                        </button>
                    )}

                    {!isMe && user && (
                        <button 
                            onClick={() => handleFollow(post.userId)}
                            className={`text-xs font-bold px-3 py-1 rounded-full border transition
                                ${isFollowing 
                                    ? "bg-transparent border-gray-600 text-gray-400 hover:text-red-400 hover:border-red-400" 
                                    : "bg-cyan-600 border-cyan-600 text-white hover:bg-cyan-500"}
                            `}
                        >
                            {isFollowing ? "Siguiendo" : "Seguir"}
                        </button>
                    )}
                </div>
            </div>

            {/* CONTENIDO DEL POST */}
            <div className="mb-3">
              <h4 className="font-black text-gray-100 text-base uppercase tracking-tight">
                ⚽ {post.match}
              </h4>
              <p className="text-gray-300 mt-2 text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words">
                {post.prediction}
              </p>

              {/* IMAGEN DEL TICKET (NUEVO) */}
              {post.imageUrl && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-gray-800 relative group cursor-pointer">
                      <img 
                        src={post.imageUrl} 
                        alt="Ticket" 
                        className="w-full max-h-96 object-cover" 
                        loading="lazy"
                      />
                  </div>
              )}
              
              {/* TICKET DE APUESTA */}
              {post.betCode && (
                <div className="flex items-center justify-between bg-gray-950/50 p-3 rounded-lg border border-gray-800 mt-3 hover:border-gray-700 transition">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase shadow-sm ${getBetHouseColor(post.betHouse)}`}>
                            {post.betHouse || "Apuesta"}
                        </span>
                        <code className="font-mono font-bold text-gray-300 text-sm truncate ml-1">
                            {post.betCode}
                        </code>
                    </div>
                    {isLink ? (
                        <a href={post.betCode} target="_blank" rel="noopener noreferrer" className="text-xs bg-gray-800 border border-gray-700 px-3 py-1 rounded font-bold text-cyan-400 hover:bg-gray-700 hover:text-cyan-300 transition">Ver</a>
                    ) : (
                        <button onClick={() => copyToClipboard(post.betCode)} className="text-xs bg-gray-800 border border-gray-700 px-3 py-1 rounded font-bold text-cyan-400 hover:bg-gray-700 hover:text-cyan-300 transition">Copiar</button>
                    )}
                </div>
              )}
            </div>

            {/* --- BARRA DE VALIDACIÓN COMUNITARIA (NUEVO) --- */}
            <div className="bg-black/20 rounded-lg p-2 mb-3 border border-gray-800 flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">¿Acertó el pronóstico?</span>
                
                <div className="flex gap-2">
                    {/* Botón VERDE (SI) */}
                    <button 
                        onClick={() => handleValidation(post.id, "YES", votesYes, votesNo)}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition border
                            ${votedYes 
                                ? "bg-green-900/30 text-green-400 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]" 
                                : "bg-gray-800 text-gray-500 border-gray-700 hover:bg-gray-700 hover:text-green-400"}
                        `}
                    >
                        ✅ SI <span className="ml-1 opacity-60 font-mono">{votesYes.length}</span>
                    </button>

                    {/* Botón ROJO (NO) */}
                    <button 
                         onClick={() => handleValidation(post.id, "NO", votesYes, votesNo)}
                         className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition border
                            ${votedNo 
                                ? "bg-red-900/30 text-red-400 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.2)]" 
                                : "bg-gray-800 text-gray-500 border-gray-700 hover:bg-gray-700 hover:text-red-400"}
                        `}
                    >
                        ❌ NO <span className="ml-1 opacity-60 font-mono">{votesNo.length}</span>
                    </button>
                </div>
            </div>

            {/* BOTONES INTERACCIÓN */}
            <div className="flex items-center gap-6 text-gray-500 text-sm border-t pt-3 border-gray-800">
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

              <button 
                onClick={() => toggleComments(post.id)}
                className={`flex items-center transition gap-1 ${expandedComments[post.id] ? "text-cyan-500" : "hover:text-cyan-500"}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
                </svg>
                <span className="font-bold">Comentar</span>
              </button>
            </div>

            {expandedComments[post.id] && (
                <CommentSection postId={post.id} user={user} />
            )}

          </div>
        );
      })}
    </div>
  );
}