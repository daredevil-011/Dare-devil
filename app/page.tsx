"use client";

import DevilScene from "../components/DevilScene";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  onSnapshot
} from "firebase/firestore";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "firebase/auth";

/* ================= STYLES ================= */

const styles: Record<string, CSSProperties> = {
  bg: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #1a001f, #000)",
    color: "#00fff2",
    fontFamily: "monospace",
    padding: 20
  },

  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh"
  },

  box: {
    background: "rgba(0,0,0,0.6)",
    border: "1px solid #ff00ff",
    padding: 20,
    borderRadius: 12,
    width: 300,
    display: "flex",
    flexDirection: "column",
    gap: 10
  },

  input: {
    padding: 10,
    background: "#000",
    border: "1px solid #ff00ff",
    color: "#fff",
    outline: "none"
  },

  btn: {
    padding: 10,
    background: "#ff00ff",
    border: "none",
    color: "#000",
    fontWeight: "bold",
    cursor: "pointer"
  },

  ghost: {
    padding: 10,
    background: "transparent",
    border: "1px solid #ff00ff",
    color: "#ff00ff",
    cursor: "pointer"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr 1fr",
    gap: 20
  },

  card: {
    background: "rgba(0,0,0,0.5)",
    border: "1px solid #ff00ff",
    padding: 15,
    borderRadius: 10
  }
};

/* ================= APP ================= */

export default function Home() {
  const ADMIN_EMAIL = "itzmahendrr@gmail.com";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  const [dares, setDares] = useState<any[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  const [msg, setMsg] = useState("");
  const [timer, setTimer] = useState<Record<string, number>>({});

  /* AUTH */
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (u) setUserId(u.uid);
    });
  }, []);

  /* SIGNUP */
  const signup = async () => {
    const res = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", res.user.uid), {
      username,
      email,
      points: 0,
      accepted: 0,
      passed: 0,
      done: {}
    });

    setUserId(res.user.uid);
  };

  /* LOGIN */
  const login = async () => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    setUserId(res.user.uid);
  };

  /* LOGOUT */
  const logout = async () => {
    await signOut(auth);
    setUserId(null);
    setUser(null);
  };

  /* INIT USER */
  const initUser = async () => {
    if (!userId) return;
    const snap = await getDoc(doc(db, "users", userId));
    if (snap.exists()) setUser(snap.data());
  };

  /* DARES */
  const fetchDares = async () => {
    const snap = await getDocs(collection(db, "dares"));
    setDares(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  /* LEADERBOARD */
  const fetchLeaders = () => {
    const q = query(collection(db, "users"), orderBy("points", "desc"), limit(10));
    onSnapshot(q, snap => {
      setLeaders(snap.docs.map(d => d.data()));
    });
  };

  /* CHAT */
  const fetchChat = () => {
    const q = query(collection(db, "chat"), orderBy("createdAt"));
    onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => d.data()));
    });
  };

  const sendMsg = async () => {
    if (!msg) return;

    await addDoc(collection(db, "chat"), {
      text: msg,
      user: user?.username