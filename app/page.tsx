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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userId, setUserId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [user, setUser] = useState(null);

  const [dare, setDare] = useState("");
  const [dares, setDares] = useState([]);
  const [time, setTime] = useState(30);

  const [activeTimers, setActiveTimers] = useState({});

  // 🏆 Leaderboard
  const [leaders, setLeaders] = useState([]);

  // 💬 Chat
  const [messages, setMessages] = useState([]);
  const [msg, setMsg] = useState("");

  // 🔐 Auth
  const signup = async () => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    setUserId(res.user.uid);
  };

  const login = async () => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    setUserId(res.user.uid);
  };

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (u) {
        setUserId(u.uid);
        setCurrentUser(u);
      }
    });
  }, []);

  // 👤 User init
  const initUser = async () => {
    if (!userId) return;

    const ref = doc(db, "users", userId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      await setDoc(ref, {
        points: 0,
        accepted: 0,
        passed: 0,
        rewards: []
      });
    }

    setUser((await getDoc(ref)).data());
  };

  // 📥 Fetch dares
  const fetchDares = async () => {
    const data = await getDocs(collection(db, "dares"));
    setDares(data.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  // 🏆 Leaderboard fetch
  const fetchLeaderboard = () => {
    const q = query(collection(db, "users"), orderBy("points", "desc"), limit(5));
    onSnapshot(q, (snap) => {
      setLeaders(snap.docs.map(d => d.data()));
    });
  };

  // 💬 Chat listener
  const fetchMessages = () => {
    const q = query(collection(db, "chat"), orderBy("createdAt", "asc"));
    onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => d.data()));
    });
  };

  // 💬 Send message
  const sendMessage = async () => {
    if (!msg) return;

    await addDoc(collection(db, "chat"), {
      text: msg,
      user: currentUser.email,
      createdAt: new Date()
    });

    setMsg("");
  };

  // 🎁 Rewards
  const checkRewards = async (points) => {
    const ref = doc(db, "users", userId);
    const snap = await getDoc(ref);
    let rewards = snap.data().rewards || [];

    if (points >= 500 && !rewards.includes("Rookie Devil")) rewards.push("Rookie Devil");
    if (points >= 1000 && !rewards.includes("Dark Player")) rewards.push("Dark Player");
    if (points >= 2000 && !rewards.includes("King of Hell")) rewards.push("King of Hell");

    await updateDoc(ref, { rewards });
  };

  // 😈 Create dare
  const createDare = async () => {
    if (currentUser?.email !== ADMIN_EMAIL) return alert("Admin only");

    await addDoc(collection(db, "dares"), {
      text: dare,
      time: time,
      createdAt: new Date()
    });

    setDare("");
    fetchDares();
  };

  // ⏳ Timer
  const startTimer = (id, seconds) => {
    if (activeTimers[id]) return;

    setActiveTimers(prev => ({ ...prev, [id]: seconds }));

    const interval = setInterval(() => {
      setActiveTimers(prev => {
        const t = prev[id] - 1;

        if (t <= 0) {
          clearInterval(interval);
          autoFail();
          const updated = { ...prev };
          delete updated[id];
          return updated;
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

    alert("⏰ Time up!");
    initUser();
  };

  const acceptDare = async (d) => {
    if (!user) return;

    const newPoints = user.points + 100;

    await updateDoc(doc(db, "users", userId), {
      points: newPoints,
      accepted: user.accepted + 1
    });

    startTimer(d.id, d.time || 30);
    await checkRewards(newPoints);
    initUser();
  };

  const passDare = async () => {
    if (!user) return;

    await updateDoc(doc(db, "users", userId), {
      points: user.points - 200,
      passed: user.passed + 1
    });

    initUser();
  };

  // 🔄 Load
  useEffect(() => {
    if (userId) {
      initUser();
      fetchDares();
      fetchLeaderboard();
      fetchMessages();
    }
  }, [userId]);

  return (
    <div style={{ background: "#0f0f0f", color: "#fff", padding: 20 }}>

      <h1 style={{ color: "red" }}>Dare Devil 😈</h1>

      {!userId && (
        <div>
          <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
          <button onClick={signup}>Signup</button>
          <button onClick={login}>Login</button>
        </div>
      )}

      {userId && (
        <div>

          {/* PROFILE */}
          {user && (
            <div>
              <h2>Profile</h2>
              <p>Points: {user.points}</p>
            </div>
          )}

          {/* LEADERBOARD */}
          <h2>🏆 Leaderboard</h2>
          {leaders.map((u, i) => (
            <p key={i}>#{i + 1} - {u.points} pts</p>
          ))}

          {/* ADMIN */}
          {currentUser?.email === ADMIN_EMAIL && (
            <div>
              <input value={dare} onChange={e => setDare(e.target.value)} />
              <input type="number" value={time} onChange={e => setTime(Number(e.target.value))} />
              <button onClick={createDare}>Create Dare</button>
            </div>
          )}

          {/* DARES */}
          <h2>Dares</h2>
          {dares.map(d => (
            <div key={d.id}>
              <p>{d.text}</p>
              {activeTimers[d.id] && <p>⏳ {activeTimers[d.id]}s</p>}
              <button onClick={() => acceptDare(d)}>Accept</button>
              <button onClick={passDare}>Pass</button>
            </div>
          ))}

          {/* CHAT */}
          <h2>💬 Community Chat</h2>
          <div style={{ maxHeight: 200, overflowY: "scroll" }}>
            {messages.map((m, i) => (
              <p key={i}><b>{m.user}:</b> {m.text}</p>
            ))}
          </div>

          <input value={msg} onChange={e => setMsg(e.target.value)} />
          <button onClick={sendMessage}>Send</button>

        </div>
      )}
    </div>
  );
}