"use client";

import { useEffect, useState } from "react";
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

export default function Home() {

  const ADMIN_EMAIL = "itzmahendrr@gmail.com";

  // AUTH
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // DATA
  const [user, setUser] = useState(null);
  const [dares, setDares] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [messages, setMessages] = useState([]);

  const [dareText, setDareText] = useState("");
  const [msg, setMsg] = useState("");

  // AUTH LISTENER
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (u) {
        setUserId(u.uid);
        setCurrentUser(u);
      }
    });
  }, []);

  // SIGNUP
  const signup = async () => {
    if (!username) return alert("Enter username");

    const res = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", res.user.uid), {
      username,
      email,
      points: 0,
      accepted: 0,
      passed: 0,
      dareResponses: {},
      createdAt: new Date()
    });

    setUserId(res.user.uid);
  };

  // LOGIN
  const login = async () => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    setUserId(res.user.uid);
  };

  // LOGOUT
  const logout = async () => {
    await signOut(auth);
    setUserId(null);
    setUser(null);
    setCurrentUser(null);
  };

  // INIT USER
  const initUser = async () => {
    if (!userId) return;
    const snap = await getDoc(doc(db, "users", userId));
    if (snap.exists()) setUser(snap.data());
  };

  // FETCH DARES
  const fetchDares = async () => {
    const snap = await getDocs(collection(db, "dares"));
    setDares(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  // LEADERBOARD
  const fetchLeaderboard = () => {
    const q = query(collection(db, "users"), orderBy("points", "desc"), limit(10));
    onSnapshot(q, snap => {
      setLeaders(snap.docs.map(d => d.data()));
    });
  };

  // CHAT
  const fetchChat = () => {
    const q = query(collection(db, "chat"), orderBy("createdAt"));
    onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => d.data()));
    });
  };

  const sendMessage = async () => {
    if (!msg) return;

    await addDoc(collection(db, "chat"), {
      text: msg,
      user: user?.username,
      createdAt: new Date()
    });

    setMsg("");
  };

  const isLocked = (id) => user?.dareResponses?.[id];

  const accept = async (d) => {
    if (!user || isLocked(d.id)) return;

    await updateDoc(doc(db, "users", userId), {
      points: user.points + 100,
      accepted: user.accepted + 1,
      [`dareResponses.${d.id}`]: "accepted"
    });

    initUser();
  };

  const pass = async (d) => {
    if (!user || isLocked(d.id)) return;

    await updateDoc(doc(db, "users", userId), {
      points: user.points - 200,
      passed: user.passed + 1,
      [`dareResponses.${d.id}`]: "passed"
    });

    initUser();
  };

  useEffect(() => {
    if (userId) {
      initUser();
      fetchDares();
      fetchLeaderboard();
      fetchChat();
    }
  }, [userId]);

  return (
    <div style={styles.bg}>

      {/* 🌌 LOGIN — ANIME 3D DEVIL SCENE */}
      {!userId && (
        <div style={styles.scene}>

          <div style={styles.glow}></div>

          <div style={styles.characterWrap}>
            <img
              src="https://i.imgur.com/8Qf6vQp.png"
              style={styles.character}
              alt="devil"
            />
            <h1 style={styles.title}>☠ Welcome Soul</h1>
            <p style={styles.sub}>Enter the Dare Realm</p>
          </div>

          <div style={styles.box}>
            <input placeholder="Email" onChange={e => setEmail(e.target.value)} style={styles.input} />
            <input placeholder="Password" type="password" onChange={e => setPassword(e.target.value)} style={styles.input} />
            <input placeholder="Username" onChange={e => setUsername(e.target.value)} style={styles.input} />

            <button onClick={signup} style={styles.btn}>ENTER HELL</button>
            <button onClick={login} style={styles.btnGhost}>RETURN SOUL</button>
          </div>

        </div>
      )}

      {/* ⚔ DASHBOARD */}
      {userId && (
        <div style={styles.grid}>

          {/* PROFILE */}
          <div>
            <h2>{user?.username}</h2>
            <p>XP: {user?.points}</p>

            <button onClick={logout} style={styles.logout}>
              Logout
            </button>
          </div>

          {/* DARES */}
          <div>
            <h2>Dares</h2>

            {currentUser?.email === ADMIN_EMAIL && (
              <div>
                <input value={dareText} onChange={e => setDareText(e.target.value)} />
                <button onClick={() =>
                  addDoc(collection(db, "dares"), {
                    text: dareText,
                    createdAt: new Date()
                  })
                }>
                  Create
                </button>
              </div>
            )}

            {dares.map(d => (
              <div key={d.id}>
                <p>{d.text}</p>

                <button disabled={isLocked(d.id)} onClick={() => accept(d)}>
                  Accept
                </button>

                <button disabled={isLocked(d.id)} onClick={() => pass(d)}>
                  Pass
                </button>
              </div>
            ))}
          </div>

          {/* SOCIAL */}
          <div>
            <h2>🏆 Leaders</h2>
            {leaders.map((u, i) => (
              <p key={i}>#{i + 1} {u.username} - {u.points}</p>
            ))}

            <h2>💬 Chat</h2>

            <div style={{ height: 120, overflow: "auto" }}>
              {messages.map((m, i) => (
                <p key={i}><b>{m.user}:</b> {m.text}</p>
              ))}
            </div>

            <input value={msg} onChange={e => setMsg(e.target.value)} />
            <button onClick={sendMessage}>Send</button>
          </div>

        </div>
      )}
    </div>
  );
}

/* ================= CYBER ANIME STYLES ================= */

const styles = {

  bg: {
    background: "#05010a",
    color: "#0ff",
    minHeight: "100vh",
    fontFamily: "monospace"
  },

  scene: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center"
  },

  glow: {
    position: "absolute",
    width: 400,
    height: 400,
    background: "radial-gradient(circle, purple, transparent)",
    filter: "blur(120px)",
    opacity: 0.4
  },

  characterWrap: {
    textAlign: "center"
  },

  character: {
    width: 180,
    filter: "drop-shadow(0 0 25px purple)",
    animation: "float 3s infinite ease-in-out"
  },

  title: {
    color: "#ff00ff"
  },

  sub: {
    color: "#aaa"
  },

  box: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: 20,
    border: "1px solid purple",
    background: "rgba(0,0,0,0.5)"
  },

  input: {
    padding: 10,
    background: "black",
    border: "1px solid purple",
    color: "white"
  },

  btn: {
    background: "purple",
    padding: 10,
    color: "white"
  },

  btnGhost: {
    background: "transparent",
    border: "1px solid purple",
    color: "purple",
    padding: 10
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr 1fr",
    gap: 20,
    padding: 20
  },

  logout: {
    background: "red",
    color: "white",
    border: "none",
    padding: 8
  }
};