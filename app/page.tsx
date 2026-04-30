"use client";

import { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  getDoc,
  query,
  orderBy,
  limit,
  onSnapshot
} from "firebase/firestore";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "firebase/auth";

export default function Home() {

  const ADMIN_EMAIL = "itzmahendrr@gmail.com";

  // ================= AUTH =================
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // ================= USER =================
  const [user, setUser] = useState(null);

  // ================= DARES =================
  const [dares, setDares] = useState([]);
  const [dareText, setDareText] = useState("");
  const [time, setTime] = useState(30);

  // ================= TIMER =================
  const [timers, setTimers] = useState({});

  // ================= LEADERBOARD =================
  const [leaders, setLeaders] = useState([]);

  // ================= CHAT =================
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");

  // ================= AUTH LISTENER =================
  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (u) {
        setUserId(u.uid);
        setCurrentUser(u);
      }
    });
  }, []);

  // ================= USERNAME CHECK =================
  const usernameExists = async (name) => {
    const snap = await getDoc(doc(db, "usernames", name));
    return snap.exists();
  };

  // ================= SIGNUP =================
  const signup = async () => {
    if (!username) return alert("Enter username");

    if (await usernameExists(username)) {
      return alert("Username already taken 💀");
    }

    const res = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", res.user.uid), {
      username,
      email,
      points: 0,
      level: 0,
      accepted: 0,
      passed: 0,
      rewards: [],
      dareResponses: {}, // 🔥 LOCK SYSTEM
      isPro: false,
      createdAt: new Date()
    });

    await setDoc(doc(db, "usernames", username), {
      uid: res.user.uid
    });

    setUserId(res.user.uid);
  };

  // ================= LOGIN =================
  const login = async () => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    setUserId(res.user.uid);
  };

  // ================= INIT USER =================
  const initUser = async () => {
    if (!userId) return;

    const ref = doc(db, "users", userId);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      data.level = Math.floor(data.points / 500);
      setUser(data);
    }
  };

  // ================= DARES =================
  const fetchDares = async () => {
    const snap = await getDocs(collection(db, "dares"));
    setDares(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  // ================= LEADERBOARD =================
  const fetchLeaderboard = () => {
    const q = query(collection(db, "users"), orderBy("points", "desc"), limit(10));
    onSnapshot(q, (snap) => {
      setLeaders(snap.docs.map(d => d.data()));
    });
  };

  // ================= CHAT =================
  const fetchChat = () => {
    const q = query(collection(db, "chat"), orderBy("createdAt"));
    onSnapshot(q, (snap) => {
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

  // ================= TIMER =================
  const startTimer = (id, seconds) => {
    if (timers[id]) return;

    setTimers(prev => ({ ...prev, [id]: seconds }));

    const interval = setInterval(() => {
      setTimers(prev => {
        const t = prev[id] - 1;

        if (t <= 0) {
          clearInterval(interval);

          const copy = { ...prev };
          delete copy[id];

          autoFail();
          return copy;
        }

        return { ...prev, [id]: t };
      });
    }, 1000);
  };

  const autoFail = async () => {
    if (!user) return;

    await updateDoc(doc(db, "users", userId), {
      points: user.points - 200,
      passed: user.passed + 1
    });

    initUser();
  };

  // ================= LOCK CHECK =================
  const isLocked = (dareId) => {
    return user?.dareResponses?.[dareId];
  };

  // ================= ACCEPT =================
  const accept = async (d) => {
    if (!user || isLocked(d.id)) return;

    const newPoints = user.points + 100;

    await updateDoc(doc(db, "users", userId), {
      points: newPoints,
      accepted: user.accepted + 1,
      [`dareResponses.${d.id}`]: "accepted"
    });

    startTimer(d.id, d.time || 30);
    initUser();
  };

  // ================= PASS =================
  const pass = async (d) => {
    if (!user || isLocked(d.id)) return;

    await updateDoc(doc(db, "users", userId), {
      points: user.points - 200,
      passed: user.passed + 1,
      [`dareResponses.${d.id}`]: "passed"
    });

    initUser();
  };

  // ================= CREATE DARE =================
  const createDare = async () => {
    if (currentUser?.email !== ADMIN_EMAIL) return;

    await addDoc(collection(db, "dares"), {
      text: dareText,
      time,
      createdAt: new Date()
    });

    setDareText("");
    fetchDares();
  };

  // ================= LOAD =================
  useEffect(() => {
    if (userId) {
      initUser();
      fetchDares();
      fetchLeaderboard();
      fetchChat();
    }
  }, [userId]);

  // ================= UI =================
  return (
    <div className="cyber">

      <style jsx>{`
        .cyber {
          background: radial-gradient(circle, #0a0a0a, black);
          color: #0ff;
          min-height: 100vh;
          padding: 20px;
          font-family: monospace;
        }

        .box {
          border: 1px solid #0ff;
          padding: 10px;
          margin: 10px;
          background: rgba(0,255,255,0.05);
        }

        button {
          background: black;
          color: #0ff;
          border: 1px solid #0ff;
          margin: 4px;
        }

        button:hover {
          box-shadow: 0 0 10px #0ff;
        }

        input {
          background: black;
          color: #0ff;
          border: 1px solid #0ff;
        }
      `}</style>

      <h1>😈 DARE DEVIL PRO</h1>

      {/* LOGIN */}
      {!userId && (
        <div className="box">
          <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
          <input placeholder="Password" type="password" onChange={e => setPassword(e.target.value)} />
          <input placeholder="Username" onChange={e => setUsername(e.target.value)} />

          <button onClick={signup}>SIGNUP</button>
          <button onClick={login}>LOGIN</button>
        </div>
      )}

      {/* DASHBOARD */}
      {userId && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr" }}>

          {/* PROFILE */}
          <div className="box">
            <h2>{user?.username}</h2>
            <p>Points: {user?.points}</p>
            <p>Level: {user?.level}</p>
          </div>

          {/* DARES */}
          <div className="box">
            <h2>Dares</h2>

            {currentUser?.email === ADMIN_EMAIL && (
              <div>
                <input value={dareText} onChange={e => setDareText(e.target.value)} />
                <input type="number" value={time} onChange={e => setTime(+e.target.value)} />
                <button onClick={createDare}>CREATE</button>
              </div>
            )}

            {dares.map(d => (
              <div key={d.id}>
                <p>{d.text}</p>
                {timers[d.id] && <p>⏳ {timers[d.id]}s</p>}

                <button
                  disabled={isLocked(d.id)}
                  onClick={() => accept(d)}
                >
                  ACCEPT
                </button>

                <button
                  disabled={isLocked(d.id)}
                  onClick={() => pass(d)}
                >
                  PASS
                </button>
              </div>
            ))}
          </div>

          {/* SOCIAL */}
          <div className="box">

            <h2>🏆 Leaderboard</h2>
            {leaders.map((u, i) => (
              <p key={i}>#{i+1} {u.username} - {u.points}</p>
            ))}

            <h2>💬 Chat</h2>

            <div style={{ height: 120, overflow: "auto" }}>
              {messages.map((m, i) => (
                <p key={i}><b>{m.user}:</b> {m.text}</p>
              ))}
            </div>

            <input value={msg} onChange={e => setMsg(e.target.value)} />
            <button onClick={sendMessage}>SEND</button>

          </div>

        </div>
      )}

    </div>
  );
}