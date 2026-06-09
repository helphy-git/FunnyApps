import { useState, useEffect, useRef } from "react";

const HOUSES = {
  gryffindor: { name: "Gryffindor", primary: "#740001", accent: "#d3a625", text: "#fff", badge: "🦁" },
  slytherin:  { name: "Slytherin",  primary: "#1a472a", accent: "#aaaaaa", text: "#fff", badge: "🐍" },
  ravenclaw:  { name: "Ravenclaw",  primary: "#0e1a40", accent: "#946b2d", text: "#fff", badge: "🦅" },
  hufflepuff: { name: "Hufflepuff", primary: "#ecb939", accent: "#372e29", text: "#372e29", badge: "🦡" },
};

const AWARD_FLAVOR = [
  "For exceptional bravery in the face of danger!",
  "Outstanding spellwork in Defence Against the Dark Arts!",
  "Brilliant answer in Transfiguration!",
  "Extraordinary potion-making under pressure!",
  "For service to the school above and beyond!",
  "Sheer nerve and outstanding courage!",
  "A remarkably clever piece of magic!",
  "For solving the mystery no one else could!",
];

const DEDUCT_FLAVOR = [
  "Wandering the corridors after hours.",
  "A truly catastrophic potion accident.",
  "Caught cheating on the O.W.L. exam.",
  "Causing absolute mayhem in the Great Hall.",
  "Unforgivable back-talk to a professor.",
  "Releasing a Niffler in the trophy room.",
  "Petrifying another student (accidentally or not).",
];

const QUICK_AMOUNTS = [5, 10, 25, 50];

const defaultMembers = [
  { id: 1, name: "Hermione Granger", house: "gryffindor", points: 250 },
  { id: 2, name: "Draco Malfoy",     house: "slytherin",  points: 180 },
  { id: 3, name: "Luna Lovegood",    house: "ravenclaw",  points: 210 },
  { id: 4, name: "Neville Longbottom", house: "gryffindor", points: 95 },
  { id: 5, name: "Cedric Diggory",   house: "hufflepuff", points: 300 },
];

function AnimatedPoints({ value }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) return;
    const start = prev.current;
    const end = value;
    const diff = end - start;
    const duration = Math.min(600, Math.abs(diff) * 8);
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(step);
      else prev.current = end;
    };
    requestAnimationFrame(step);
  }, [value]);

  return <span>{display}</span>;
}

function Sparkles({ trigger }) {
  const [sparks, setSparks] = useState([]);
  useEffect(() => {
    if (!trigger) return;
    const newSparks = Array.from({ length: 10 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 4 + Math.random() * 8,
      delay: Math.random() * 400,
      color: ["#d4af37","#fff","#ffd700","#e8b4b8"][Math.floor(Math.random()*4)],
    }));
    setSparks(newSparks);
    const t = setTimeout(() => setSparks([]), 900);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <div style={{ position:"absolute", inset:0, pointerEvents:"none", overflow:"hidden", borderRadius:"inherit" }}>
      {sparks.map(s => (
        <div key={s.id} style={{
          position: "absolute",
          left: `${s.x}%`,
          top: `${s.y}%`,
          width: s.size,
          height: s.size,
          borderRadius: "50%",
          background: s.color,
          boxShadow: `0 0 6px ${s.color}`,
          animation: `sparkPop 0.8s ease-out ${s.delay}ms both`,
        }} />
      ))}
    </div>
  );
}

function Toast({ notification, onDone }) {
  useEffect(() => {
    if (!notification) return;
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [notification]);

  if (!notification) return null;
  const isPositive = notification.delta > 0;
  return (
    <div style={{
      position: "fixed",
      top: 32,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 1000,
      background: isPositive ? "linear-gradient(135deg,#1a1208,#2a1f05)" : "linear-gradient(135deg,#1a0808,#2a0505)",
      border: `2px solid ${isPositive ? "#d4af37" : "#8b0000"}`,
      borderRadius: 12,
      padding: "16px 28px",
      color: "#f5e6c8",
      fontFamily: "'Cinzel', serif",
      textAlign: "center",
      maxWidth: 420,
      boxShadow: isPositive ? "0 0 40px rgba(212,175,55,0.4)" : "0 0 40px rgba(139,0,0,0.4)",
      animation: "toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
    }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>
        {isPositive ? "✨" : "💀"} {notification.name}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: isPositive ? "#d4af37" : "#ff4444", marginBottom: 6 }}>
        {isPositive ? "+" : ""}{notification.delta} Points
      </div>
      <div style={{ fontSize: 13, fontStyle: "italic", color: "#c9a96e", fontFamily: "'EB Garamond', serif" }}>
        "{notification.flavor}"
      </div>
    </div>
  );
}

export default function HouseCup() {
  const [members, setMembers] = useState(defaultMembers);
  const [notification, setNotification] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newHouse, setNewHouse] = useState("gryffindor");
  const [sparkTriggers, setSparkTriggers] = useState({});
  const [customAmounts, setCustomAmounts] = useState({});
  const [confirmRemove, setConfirmRemove] = useState(null);
  const nextId = useRef(100);

  const sorted = [...members].sort((a, b) => b.points - a.points);

  const housePoints = Object.keys(HOUSES).reduce((acc, h) => {
    acc[h] = members.filter(m => m.house === h).reduce((s, m) => s + m.points, 0);
    return acc;
  }, {});
  const topHouse = Object.entries(housePoints).sort((a,b) => b[1]-a[1])[0]?.[0];

  function awardPoints(id, delta) {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, points: Math.max(0, m.points + delta) } : m));
    const member = members.find(m => m.id === id);
    const flavor = delta > 0
      ? AWARD_FLAVOR[Math.floor(Math.random() * AWARD_FLAVOR.length)]
      : DEDUCT_FLAVOR[Math.floor(Math.random() * DEDUCT_FLAVOR.length)];
    setNotification({ name: member.name, delta, flavor });
    setSparkTriggers(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  }

  function addMember() {
    if (!newName.trim()) return;
    setMembers(prev => [...prev, { id: nextId.current++, name: newName.trim(), house: newHouse, points: 0 }]);
    setNewName(""); setShowAdd(false);
  }

  function removeMember(id) {
    setMembers(prev => prev.filter(m => m.id !== id));
    setConfirmRemove(null);
  }

  const rank = (i) => ["🥇","🥈","🥉"][i] || `#${i+1}`;

  return (
    <div style={{ minHeight: "100vh", background: "#06060f", fontFamily: "'EB Garamond', serif", color: "#f5e6c8" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');
        @keyframes sparkPop { 0%{opacity:1;transform:scale(0) translate(0,0)} 100%{opacity:0;transform:scale(1) translate(calc(var(--tx,0)*20px),calc(var(--ty,0)*-30px))} }
        @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(-20px) scale(0.9)} to{opacity:1;transform:translateX(-50%) translateY(0) scale(1)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes crownPulse { 0%,100%{filter:drop-shadow(0 0 8px #d4af37)} 50%{filter:drop-shadow(0 0 20px #d4af37)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a18; }
        ::-webkit-scrollbar-thumb { background: #d4af37; border-radius: 3px; }
        input, select { font-family: 'EB Garamond', serif; }
        button { cursor: pointer; }
      `}</style>

      <Toast notification={notification} onDone={() => setNotification(null)} />

      {/* Header */}
      <div style={{ textAlign:"center", padding:"40px 20px 24px", borderBottom:"1px solid rgba(212,175,55,0.2)", position:"relative" }}>
        <div style={{ fontSize:13, letterSpacing:6, textTransform:"uppercase", color:"#d4af37", marginBottom:8, fontFamily:"'Cinzel',serif" }}>
          Hogwarts School of Witchcraft & Wizardry
        </div>
        <h1 style={{ margin:0, fontSize:"clamp(36px,6vw,68px)", fontFamily:"'Cinzel',serif", fontWeight:900,
          background:"linear-gradient(135deg, #d4af37 0%, #fff8dc 40%, #d4af37 60%, #b8960c 100%)",
          backgroundSize:"200%", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
          animation:"shimmer 4s linear infinite", lineHeight:1.1 }}>
          The House Cup
        </h1>
        <div style={{ marginTop:16, fontSize:15, color:"rgba(245,230,200,0.5)", fontStyle:"italic" }}>
          ✦ Points may be awarded or taken away ✦
        </div>
      </div>

      {/* House Totals */}
      <div style={{ padding:"24px 20px 0", maxWidth:900, margin:"0 auto" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))", gap:12, marginBottom:32 }}>
          {Object.entries(HOUSES).map(([key, h]) => (
            <div key={key} style={{
              background: `linear-gradient(135deg, ${h.primary}cc, ${h.primary}88)`,
              border: `2px solid ${key === topHouse ? h.accent : "rgba(255,255,255,0.1)"}`,
              borderRadius:12, padding:"16px 12px", textAlign:"center",
              boxShadow: key === topHouse ? `0 0 24px ${h.accent}66` : "none",
              animation: key === topHouse ? "float 3s ease-in-out infinite" : "none",
              transition:"all 0.3s",
            }}>
              {key === topHouse && <div style={{ fontSize:20, animation:"crownPulse 2s ease-in-out infinite" }}>👑</div>}
              <div style={{ fontSize:28 }}>{h.badge}</div>
              <div style={{ fontFamily:"'Cinzel',serif", fontSize:13, fontWeight:600, color: h.text, marginTop:4 }}>{h.name}</div>
              <div style={{ fontSize:28, fontWeight:700, fontFamily:"'Cinzel',serif", color: h.accent, marginTop:2 }}>
                <AnimatedPoints value={housePoints[key]} />
              </div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:2 }}>points</div>
            </div>
          ))}
        </div>

        {/* Member list header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <h2 style={{ margin:0, fontFamily:"'Cinzel',serif", fontSize:20, color:"#d4af37", fontWeight:600 }}>
            ⚡ Students
          </h2>
          <button onClick={() => setShowAdd(true)} style={{
            background:"linear-gradient(135deg,#d4af37,#b8960c)",
            border:"none", borderRadius:8, padding:"8px 18px", color:"#06060f",
            fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:13, transition:"all 0.2s",
          }}
          onMouseEnter={e => e.target.style.filter="brightness(1.2)"}
          onMouseLeave={e => e.target.style.filter="none"}>
            + Enroll Student
          </button>
        </div>

        {/* Member cards */}
        <div style={{ display:"flex", flexDirection:"column", gap:12, paddingBottom:60 }}>
          {sorted.map((member, i) => {
            const house = HOUSES[member.house];
            const custom = customAmounts[member.id] || "";
            return (
              <div key={member.id} style={{
                background: `linear-gradient(135deg, #0f0f1e, #12100a)`,
                border: `1px solid ${house.primary}99`,
                borderLeft: `4px solid ${house.accent}`,
                borderRadius:12, padding:"16px 20px",
                position:"relative", overflow:"hidden",
                boxShadow:`0 2px 16px ${house.primary}44`,
                transition:"transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`0 6px 24px ${house.primary}66`; }}
              onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow=`0 2px 16px ${house.primary}44`; }}
              >
                <Sparkles trigger={sparkTriggers[member.id]} />

                <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
                  {/* Rank + name */}
                  <div style={{ display:"flex", alignItems:"center", gap:10, flex:"1 1 180px", minWidth:0 }}>
                    <span style={{ fontSize:20, minWidth:32 }}>{rank(i)}</span>
                    <div>
                      <div style={{ fontFamily:"'Cinzel',serif", fontWeight:600, fontSize:15, color:"#f5e6c8", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:160 }}>
                        {member.name}
                      </div>
                      <div style={{ fontSize:13, color: house.accent, display:"flex", alignItems:"center", gap:4 }}>
                        <span>{house.badge}</span> {house.name}
                      </div>
                    </div>
                  </div>

                  {/* Points */}
                  <div style={{ fontFamily:"'Cinzel',serif", fontSize:32, fontWeight:900, color: house.accent, minWidth:80, textAlign:"center" }}>
                    <AnimatedPoints value={member.points} />
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", fontWeight:400 }}>points</div>
                  </div>

                  {/* Quick buttons */}
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", alignItems:"center", flex:"1 1 auto", justifyContent:"flex-end" }}>
                    {QUICK_AMOUNTS.map(amt => (
                      <div key={amt} style={{ display:"flex", flexDirection:"column", gap:3 }}>
                        <button onClick={() => awardPoints(member.id, amt)} style={{
                          background:`linear-gradient(135deg, #1a3a1a, #0f2a0f)`,
                          border:"1px solid #3a7a3a", borderRadius:6, color:"#7fff7f",
                          fontFamily:"'Cinzel',serif", fontSize:12, fontWeight:600,
                          padding:"4px 8px", transition:"all 0.15s",
                        }}
                        onMouseEnter={e => { e.target.style.background="linear-gradient(135deg,#2a5a2a,#1a4a1a)"; e.target.style.boxShadow="0 0 10px #3a7a3a88"; }}
                        onMouseLeave={e => { e.target.style.background="linear-gradient(135deg,#1a3a1a,#0f2a0f)"; e.target.style.boxShadow="none"; }}>
                          +{amt}
                        </button>
                        <button onClick={() => awardPoints(member.id, -amt)} style={{
                          background:`linear-gradient(135deg, #3a1a1a, #2a0f0f)`,
                          border:"1px solid #7a3a3a", borderRadius:6, color:"#ff8080",
                          fontFamily:"'Cinzel',serif", fontSize:12, fontWeight:600,
                          padding:"4px 8px", transition:"all 0.15s",
                        }}
                        onMouseEnter={e => { e.target.style.background="linear-gradient(135deg,#5a2a2a,#4a1a1a)"; e.target.style.boxShadow="0 0 10px #7a3a3a88"; }}
                        onMouseLeave={e => { e.target.style.background="linear-gradient(135deg,#3a1a1a,#2a0f0f)"; e.target.style.boxShadow="none"; }}>
                          −{amt}
                        </button>
                      </div>
                    ))}

                    {/* Custom amount */}
                    <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                      <input
                        type="number"
                        placeholder="pts"
                        value={custom}
                        onChange={e => setCustomAmounts(prev => ({ ...prev, [member.id]: e.target.value }))}
                        style={{ width:56, background:"#0d0d1a", border:"1px solid #444", borderRadius:6,
                          color:"#f5e6c8", padding:"4px 6px", fontSize:13, textAlign:"center" }}
                      />
                      <div style={{ display:"flex", gap:3 }}>
                        <button onClick={() => { const n=parseInt(custom); if(n>0) { awardPoints(member.id, n); setCustomAmounts(p=>({...p,[member.id]:""})); } }}
                          style={{ flex:1, background:"#1a3a1a", border:"1px solid #3a7a3a", borderRadius:6, color:"#7fff7f", fontSize:12, padding:"3px 0" }}>✓</button>
                        <button onClick={() => { const n=parseInt(custom); if(n>0) { awardPoints(member.id, -n); setCustomAmounts(p=>({...p,[member.id]:""})); } }}
                          style={{ flex:1, background:"#3a1a1a", border:"1px solid #7a3a3a", borderRadius:6, color:"#ff8080", fontSize:12, padding:"3px 0" }}>✗</button>
                      </div>
                    </div>

                    {/* Remove */}
                    <button onClick={() => setConfirmRemove(member.id)} style={{
                      background:"transparent", border:"1px solid #555", borderRadius:6,
                      color:"#888", fontSize:16, padding:"6px 8px", transition:"all 0.15s",
                      lineHeight:1,
                    }}
                    onMouseEnter={e => { e.target.style.borderColor="#ff4444"; e.target.style.color="#ff4444"; }}
                    onMouseLeave={e => { e.target.style.borderColor="#555"; e.target.style.color="#888"; }}
                    title="Expel student">✕</button>
                  </div>
                </div>
              </div>
            );
          })}

          {members.length === 0 && (
            <div style={{ textAlign:"center", padding:60, color:"rgba(245,230,200,0.3)", fontStyle:"italic", fontSize:18 }}>
              The Great Hall awaits its students...
            </div>
          )}
        </div>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:500 }}
          onClick={e => { if(e.target === e.currentTarget) setShowAdd(false); }}>
          <div style={{ background:"linear-gradient(135deg,#0f0f1e,#12100a)", border:"2px solid #d4af37",
            borderRadius:16, padding:"36px 40px", minWidth:340, boxShadow:"0 0 60px rgba(212,175,55,0.3)" }}>
            <h3 style={{ margin:"0 0 24px", fontFamily:"'Cinzel',serif", color:"#d4af37", textAlign:"center", fontSize:20 }}>
              ✨ Enroll a New Student
            </h3>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:"block", fontSize:13, color:"#c9a96e", marginBottom:6, fontFamily:"'Cinzel',serif" }}>Full Name</label>
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key==="Enter" && addMember()}
                placeholder="e.g. Harry Potter"
                style={{ width:"100%", background:"#0a0a18", border:"1px solid #444", borderRadius:8,
                  color:"#f5e6c8", padding:"10px 14px", fontSize:16 }}
              />
            </div>
            <div style={{ marginBottom:28 }}>
              <label style={{ display:"block", fontSize:13, color:"#c9a96e", marginBottom:6, fontFamily:"'Cinzel',serif" }}>House</label>
              <select value={newHouse} onChange={e => setNewHouse(e.target.value)}
                style={{ width:"100%", background:"#0a0a18", border:"1px solid #444", borderRadius:8,
                  color:"#f5e6c8", padding:"10px 14px", fontSize:16 }}>
                {Object.entries(HOUSES).map(([k,h]) => (
                  <option key={k} value={k}>{h.badge} {h.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display:"flex", gap:12 }}>
              <button onClick={addMember} style={{ flex:1, background:"linear-gradient(135deg,#d4af37,#b8960c)",
                border:"none", borderRadius:8, color:"#06060f", fontFamily:"'Cinzel',serif",
                fontWeight:700, fontSize:15, padding:"12px", transition:"all 0.2s" }}
                onMouseEnter={e => e.target.style.filter="brightness(1.15)"}
                onMouseLeave={e => e.target.style.filter="none"}>
                Enroll
              </button>
              <button onClick={() => setShowAdd(false)} style={{ flex:1, background:"transparent",
                border:"1px solid #555", borderRadius:8, color:"#888",
                fontFamily:"'Cinzel',serif", fontSize:15, padding:"12px" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm remove modal */}
      {confirmRemove !== null && (() => {
        const m = members.find(x => x.id === confirmRemove);
        return (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:500 }}>
            <div style={{ background:"linear-gradient(135deg,#1a0808,#0f0606)", border:"2px solid #8b0000",
              borderRadius:16, padding:"36px 40px", maxWidth:360, textAlign:"center", boxShadow:"0 0 40px rgba(139,0,0,0.4)" }}>
              <div style={{ fontSize:36, marginBottom:12 }}>⚡</div>
              <h3 style={{ margin:"0 0 12px", fontFamily:"'Cinzel',serif", color:"#ff6666", fontSize:18 }}>
                Expel {m?.name}?
              </h3>
              <p style={{ color:"rgba(245,230,200,0.6)", fontStyle:"italic", marginBottom:24, fontSize:15 }}>
                This student will be permanently removed from the house records.
              </p>
              <div style={{ display:"flex", gap:12 }}>
                <button onClick={() => removeMember(confirmRemove)} style={{ flex:1, background:"linear-gradient(135deg,#8b0000,#5a0000)",
                  border:"1px solid #cc3333", borderRadius:8, color:"#fff",
                  fontFamily:"'Cinzel',serif", fontWeight:700, fontSize:14, padding:"11px" }}>
                  Expel
                </button>
                <button onClick={() => setConfirmRemove(null)} style={{ flex:1, background:"transparent",
                  border:"1px solid #555", borderRadius:8, color:"#888",
                  fontFamily:"'Cinzel',serif", fontSize:14, padding:"11px" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
