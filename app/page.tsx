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

/* ================= STYLES ================= */

const styles: Record<string, CSSProperties> = {
  bg: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #1a001f, #000)",
    color: "#00fff2",
    fontFamily: "monospace",
    padding: 20
  },

  hellWrap: {
    position: "relative",
    height: "100vh",
    overflow: "hidden",
    background: "black"
  },

  fireOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at bottom, rgba(255,0,0,0.5), transparent 60%), radial-gradient(circle at top, rgba(0,0,0,1), black)",
    animation: "pulse 3s infinite alternate",
    zIndex: 1
  },

  vignette: {
    position: "absolute",
    inset: 0,
    boxShadow: "inset 0 0 200px rgba(255,0,0,0.6)",
    zIndex: 2
  },

  loginCenter: {
    position: "relative",
    zIndex: 3,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center"
  },

  loginBox: {
    background: "rgba(0,0,0,0.75)",
    border: "1px solid #ff0033",
    padding: 20,
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    width: 300,
    backdropFilter: "blur(10px)"
  },

  input: {
    padding: 10,
    background: "#000",
    border: "1px solid #ff0033",
    color: "#fff",
    outline: "none"
  },

  btn: {
    padding: 10,
    background: "#ff0000",
    border: "none",
    color: "#000",
    fontWeight: "bold",
    cursor: "pointer"
  },

  ghost: {
    padding: 10,
    background: "transparent",
    border: "1px solid red",
    color: "red",
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

  /* AUTH LISTENER */
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
      user: user?.username,
      createdAt: new Date()
    });

    setMsg("");
  };

  /* ONE CHANCE RULE */
  const done = (id: string) => user?.done?.[id];

  const accept = async (d: any) => {
    if (!user || done(d.id)) return;

    await updateDoc(doc(db, "users", userId!), {
      points: user.points + 100,
      accepted: user.accepted + 1,
      [`done.${d.id}`]: "accepted"
    });

    startTimer(d.id, d.time || 30);
    initUser();
  };

  const pass = async (d: any) => {
    if (!user || done(d.id)) return;

    await updateDoc(doc(db, "users", userId!), {
      points: user.points - 200,
      passed: user.passed + 1,
      [`done.${d.id}`]: "passed"
    });

    initUser();
  };

  /* TIMER */
  const startTimer = (id: string, sec: number) => {
    if (timer[id]) return;

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

      {/* 🔥 HELL LOGIN SCENE */}
      {!userId && (
        <div style={styles.hellWrap}>

          <div style={styles.fireOverlay}></div>

          <div style={{ position: "absolute", inset: 0 }}>
            <DevilScene />
          </div>

          <div style={styles.vignette}></div>

          <div style={styles.loginCenter}>
            <h1>😈 ENTER HELL REALM</h1>

            <div style={styles.loginBox}>
              <input
                placeholder="Username"
                style={styles.input}
                onChange={e => setUsername(e.target.value)}
              />
              <input
                placeholder="Email"
                style={styles.input}
                onChange={e => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                style={styles.input}
                onChange={e => setPassword(e.target.value)}
              />

              <button style={styles.btn} onClick={signup}>ENTER</button>
              <button style={styles.ghost} onClick={login}>LOGIN</button>
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
            <button style={styles.ghost} onClick={logout}>Logout</button>
          </div>

          <div style={styles.card}>
            <h2>Dares</h2>
            {dares.map(d => (
              <div key={d.id}>
                <p>{d.text}</p>
                {timer[d.id] && <p>⏳ {timer[d.id]}s</p>}
                <button disabled={done(d.id)} onClick={() => accept(d)}>Accept</button>
                <button disabled={done(d.id)} onClick={() => pass(d)}>Pass</button>
              </div>
            ))}
          </div>

          <div style={styles.card}>
            <h2>🏆 Leaders</h2>
            {leaders.map((l, i) => (
              <p key={i}>{l.username} - {l.points}</p>
            ))}

            <h2>💬 Chat</h2>
            <div style={{ height: 120, overflow: "auto" }}>
              {messages.map((m, i) => (
                <p key={i}><b>{m.user}:</b> {m.text}</p>
              ))}
            </div>

            <input style={styles.input} value={msg} onChange={e => setMsg(e.target.value)} />
            <button style={styles.btn} onClick={sendMsg}>Send</button>
          </div>

        </div>
      )}

    </div>
  );
}