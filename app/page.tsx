"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

import DevilScene from "../components/DevilScene";

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

/* ================= SAFE STYLES ================= */

const styles: Record<string, CSSProperties> = {
  bg: {
    minHeight: "100vh",
    background: "black",
    color: "#ff3b3b",
    fontFamily: "monospace"
  },

  hellWrap: {
    position: "relative",
    height: "100vh",
    overflow: "hidden",
    background: "radial-gradient(circle at center, #120000, black)"
  },

  overlay: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at center, rgba(255,0,0,0.25), transparent 60%)",
    zIndex: 1
  },

  login: {
    position: "relative",
    zIndex: 3,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center"
  },

  box: {
    background: "rgba(0,0,0,0.8)",
    border: "1px solid red",
    padding: 20,
    borderRadius: 10,
    width: 300,
    display: "flex",
    flexDirection: "column",
    gap: 10
  },

  input: {
    padding: 10,
    background: "black",
    border: "1px solid red",
    color: "white"
  },

  btn: {
    padding: 10,
    background: "red",
    border: "none",
    cursor: "pointer"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr 1fr",
    gap: 20,
    padding: 20
  },

  card: {
    background: "rgba(0,0,0,0.7)",
    border: "1px solid red",
    padding: 15,
    borderRadius: 10
  }
};

/* ================= APP ================= */

export default function Home() {
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

  const signup = async () => {
    const res = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", res.user.uid), {
      username,
      email,
      points: 0,
      done: {}
    });

    setUserId(res.user.uid);
  };

  const login = async () => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    setUserId(res.user.uid);
  };

  const logout = async () => {
    await signOut(auth);
    setUserId(null);
    setUser(null);
  };

  /* LOAD USER */
  const initUser = async () => {
    if (!userId) return;
    const snap = await getDoc(doc(db, "users", userId));
    if (snap.exists()) setUser(snap.data());
  };

  const fetchDares = async () => {
    const snap = await getDocs(collection(db, "dares"));
    setDares(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const fetchLeaders = () => {
    const q = query(collection(db, "users"), orderBy("points", "desc"), limit(10));
    onSnapshot(q, snap => setLeaders(snap.docs.map(d => d.data())));
  };

  const fetchChat = () => {
    const q = query(collection(db, "chat"), orderBy("createdAt"));
    onSnapshot(q, snap => setMessages(snap.docs.map(d => d.data())));
  };

  const sendMsg = async () => {
    if (!msg) return;

    await addDoc(collection(db, "chat"), {
      text: msg,
      user: user?.username,
      createdAt: new Date()
    });

    setMsg("");
  };

  const done = (id: string) => user?.done?.[id];

  const accept = async (d: any) => {
    if (!user || done(d.id)) return;

    await updateDoc(doc(db, "users", userId!), {
      points: user.points + 100,
      [`done.${d.id}`]: "accepted"
    });

    initUser();
  };

  const pass = async (d: any) => {
    if (!user || done(d.id)) return;

    await updateDoc(doc(db, "users", userId!), {
      points: user.points - 200,
      [`done.${d.id}`]: "passed"
    });

    initUser();
  };

  const startTimer = (id: string, sec: number) => {
    setTimer(prev => ({ ...prev, [id]: sec }));

    const interval = setInterval(() => {
      setTimer(prev => {
        const t = (prev[id] || 0) - 1;
        if (t <= 0) {
          clearInterval(interval);
          return { ...prev, [id]: 0 };
        }
        return { ...prev, [id]: t };
      });
    }, 1000);
  };

  useEffect(() => {
    if (userId) {
      initUser();
      fetchDares();
      fetchLeaders();
      fetchChat();
    }
  }, [userId]);

  /* ================= UI ================= */

  return (
    <div style={styles.bg}>

      {/* 🔥 LOGIN HELL SCENE */}
      {!userId && (
        <div style={styles.hellWrap}>
          <div style={styles.overlay} />
          <DevilScene />

          <div style={styles.login}>
            <h1>😈 ENTER HELL REALM</h1>

            <div style={styles.box}>
              <input placeholder="Username" style={styles.input} onChange={e => setUsername(e.target.value)} />
              <input placeholder="Email" style={styles.input} onChange={e => setEmail(e.target.value)} />
              <input type="password" style={styles.input} onChange={e => setPassword(e.target.value)} />

              <button style={styles.btn} onClick={signup}>ENTER</button>
              <button style={styles.btn} onClick={login}>LOGIN</button>
            </div>
          </div>
        </div>
      )}

      {/* DASHBOARD */}
      {userId && (
        <div style={styles.grid}>

          <div style={styles.card}>
            <h2>{user?.username}</h2>
            <p>XP: {user?.points}</p>
            <button onClick={logout}>Logout</button>
          </div>

          <div style={styles.card}>
            <h2>Dares</h2>
            {dares.map(d => (
              <div key={d.id}>
                <p>{d.text}</p>
                <button disabled={done(d.id)} onClick={() => accept(d)}>Accept</button>
                <button disabled={done(d.id)} onClick={() => pass(d)}>Pass</button>
              </div>
            ))}
          </div>

          <div style={styles.card}>
            <h2>Leaders</h2>
            {leaders.map((l, i) => (
              <p key={i}>{l.username} - {l.points}</p>
            ))}

            <h2>Chat</h2>
            {messages.map((m, i) => (
              <p key={i}>{m.user}: {m.text}</p>
            ))}

            <input value={msg} onChange={e => setMsg(e.target.value)} />
            <button onClick={sendMsg}>Send</button>
          </div>

        </div>
      )}

    </div>
  );
}