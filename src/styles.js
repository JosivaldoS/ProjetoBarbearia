export const styles = {
  root: { minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-body)" },
  home: { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" },
  homeBg: { position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 50%, #1a0a00 0%, #0a0a0a 60%, #0d0d12 100%)", zIndex: 0 },
  homeContent: { position: "relative", zIndex: 1, textAlign: "center", padding: "0 24px" },
  logoWrap: { marginBottom: 48 },
  logoScissors: { fontSize: 48, display: "block", marginBottom: 8, filter: "drop-shadow(0 0 20px var(--gold))" },
  logoText: { fontFamily: "var(--font-display)", fontSize: "clamp(36px,8vw,72px)", fontWeight: 700, letterSpacing: "0.1em", color: "var(--text)", margin: 0 },
  logoAccent: { color: "var(--gold)" },
  logoSub: { fontFamily: "var(--font-body)", fontSize: 14, letterSpacing: "0.4em", color: "var(--muted)", marginTop: 8, textTransform: "uppercase" },
  homeButtons: { display: "flex", flexDirection: "column", gap: 16, alignItems: "center" },
  btnArrow: { marginLeft: 8 },
  homeDecor: { position: "absolute", bottom: 32, display: "flex", alignItems: "center", gap: 16, zIndex: 1 },
  decorLine: { width: 60, height: 1, background: "var(--muted)" },
  decorText: { fontSize: 11, letterSpacing: "0.4em", color: "var(--muted)", fontFamily: "var(--font-body)" },
  panel: { minHeight: "100vh", display: "flex", flexDirection: "column" },
  panelHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)", background: "var(--surface)" },
  panelTitle: { fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, margin: 0, color: "var(--text)" },
  steps: { display: "flex", gap: 6 },
  stepDot: { width: 8, height: 8, borderRadius: "50%", transition: "background .3s" },
  panelBody: { flex: 1, padding: "20px 16px", overflowY: "auto" },
  tabBar: { display: "flex", overflowX: "auto", borderBottom: "1px solid var(--border)", background: "var(--surface)", padding: "0 12px" },
  formCard: { background: "var(--surface)", borderRadius: 16, padding: 24, border: "1px solid var(--border)", maxWidth: 480, margin: "0 auto" },
  cardTitle: { fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, margin: "0 0 8px", color: "var(--text)" },
  cardSub: { color: "var(--muted)", fontSize: 14, margin: "0 0 8px", lineHeight: 1.5 },
  input: { width: "100%", padding: "14px 16px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 16, boxSizing: "border-box", outline: "none", fontFamily: "var(--font-body)" },
  section: { marginBottom: 24 },
  sectionTitle: { fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600, marginBottom: 12, color: "var(--muted-light)", textTransform: "uppercase", letterSpacing: "0.1em" },
  serviceGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  serviceLabel: { display: "block", fontWeight: 600, fontSize: 15 },
  servicePrice: { display: "block", color: "var(--gold)", fontSize: 13, marginTop: 4 },
  dayGrid: { display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 },
  dayName: { display: "block", fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em" },
  dayNum: { display: "block", fontSize: 22, fontWeight: 700, marginTop: 2 },
  timeGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(72px,1fr))", gap: 8 },
  confirmCard: { background: "var(--surface2)", borderRadius: 12, padding: 16 },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" },
  rowLabel: { color: "var(--muted)", fontSize: 14 },
  rowValue: { fontWeight: 600, fontSize: 15 },
  successIcon: { width: 64, height: 64, borderRadius: "50%", background: "var(--gold)", color: "#000", fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontWeight: 700 },
  loyaltyBadge: { background: "linear-gradient(135deg,#1a1200,#2a1f00)", border: "1px solid var(--gold)", borderRadius: 12, padding: 16, marginTop: 20 },
  loyaltyTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  loyaltyTitle: { fontWeight: 700, color: "var(--gold)", fontSize: 14 },
  loyaltyFree: { background: "var(--gold)", color: "#000", fontSize: 11, fontWeight: 800, padding: "3px 8px", borderRadius: 20, letterSpacing: "0.05em" },
  loyaltyCount: { color: "var(--muted)", fontSize: 13 },
  loyaltyBar: { height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" },
  loyaltyFill: { height: "100%", background: "var(--gold)", borderRadius: 3, transition: "width .5s ease" },
  loyaltySub: { color: "var(--muted)", fontSize: 12, margin: "8px 0 0" },
  filterBar: { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  apCard: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 14, marginBottom: 10, display: "flex", gap: 12, alignItems: "flex-start" },
  apLeft: { minWidth: 52, textAlign: "center" },
  apDate: { fontSize: 12, color: "var(--muted)" },
  apTime: { fontSize: 18, fontWeight: 700, color: "var(--gold)", fontFamily: "var(--font-display)" },
  apMid: { flex: 1 },
  apPhone: { fontWeight: 600, fontSize: 15 },
  apService: { color: "var(--muted)", fontSize: 13, marginTop: 2 },
  apRight: { textAlign: "right" },
  badge: { fontSize: 11, padding: "3px 8px", borderRadius: 20, background: "#334155", color: "#fff", fontWeight: 600, display: "inline-block" },
  freeBadge: { fontSize: 11, padding: "2px 7px", borderRadius: 20, background: "var(--gold)", color: "#000", fontWeight: 800, marginLeft: 6 },
  slotDay: { marginBottom: 20 },
  slotDayName: { fontFamily: "var(--font-display)", fontSize: 16, marginBottom: 8, color: "var(--muted-light)" },
  slotGrid: { display: "flex", flexWrap: "wrap", gap: 6 },
  toggleRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: "1px solid var(--border)" },
  counter: { display: "flex", alignItems: "center", gap: 12 },
  counterVal: { fontSize: 20, fontWeight: 700, minWidth: 32, textAlign: "center" },
  loyaltyRow: { display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)", flexWrap: "wrap" },
  clientCard: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 12 },
  clientTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  clientMeta: { display: "flex", gap: 12, alignItems: "center", marginTop: 6 },
  miniAp: { display: "flex", gap: 12, fontSize: 13, color: "var(--muted)", padding: "6px 0", borderBottom: "1px solid var(--border)", flexWrap: "wrap" },
  welcomeBar: { background: "#052e16", border: "1px solid #16a34a", borderRadius: 10, padding: "12px 16px", marginBottom: 16, color: "#86efac", fontSize: 14 },
  freeBar: { background: "#1a1200", border: "1px solid var(--gold)", borderRadius: 10, padding: "12px 16px", marginBottom: 16, color: "var(--gold)", fontSize: 14 },
  empty: { textAlign: "center", color: "var(--muted)", padding: "40px 0", fontSize: 15 },
  error: { color: "#f87171", fontSize: 14, marginTop: 8 },
};

export const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
  :root {
    --bg: #0a0a0a;
    --surface: #111111;
    --surface2: #1a1a1a;
    --border: #2a2a2a;
    --text: #f5f0eb;
    --muted: #6b6560;
    --muted-light: #9e9890;
    --gold: #c9a84c;
    --gold-light: #e8c97a;
    --font-display: 'Playfair Display', serif;
    --font-body: 'DM Sans', sans-serif;
  }
  * { box-sizing: border-box; }
  body { margin: 0; }
  .fade-in { animation: fadeIn .35s ease; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }

  .btn-primary {
    display:flex; align-items:center; justify-content:center;
    padding: 14px 28px; background: var(--gold); color: #0a0a0a;
    font-family: var(--font-body); font-weight: 700; font-size: 15px;
    border: none; border-radius: 10px; cursor: pointer;
    transition: background .2s, transform .1s; letter-spacing: 0.03em;
    min-width: 200px;
  }
  .btn-primary:hover:not(:disabled) { background: var(--gold-light); transform:translateY(-1px); }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-ghost {
    padding: 12px 24px; background: transparent; color: var(--muted-light);
    font-family: var(--font-body); font-size: 14px; font-weight: 500;
    border: 1px solid var(--border); border-radius: 10px; cursor: pointer;
    transition: border-color .2s, color .2s; letter-spacing: 0.03em;
  }
  .btn-ghost:hover { border-color: var(--muted); color: var(--text); }
  .btn-back {
    background: none; border: none; color: var(--muted); cursor: pointer;
    font-family: var(--font-body); font-size: 14px; padding: 4px 0;
  }
  .btn-back:hover { color: var(--text); }
  .btn-sm {
    padding: 6px 12px; background: var(--surface2); color: var(--text);
    border: 1px solid var(--border); border-radius: 8px; cursor: pointer; font-size: 16px;
  }
  .btn-sm-success {
    padding: 5px 10px; background: #052e16; color: #86efac;
    border: 1px solid #16a34a; border-radius: 8px; cursor: pointer; font-size: 13px;
  }
  .btn-sm-danger {
    padding: 5px 10px; background: #2d0a0a; color: #fca5a5;
    border: 1px solid #dc2626; border-radius: 8px; cursor: pointer; font-size: 13px;
  }
  .service-card {
    padding: 14px 12px; background: var(--surface2); border: 1px solid var(--border);
    border-radius: 12px; cursor: pointer; text-align: left; color: var(--text);
    transition: border-color .2s, background .2s;
  }
  .service-card:hover { border-color: var(--muted); }
  .service-card.active { border-color: var(--gold); background: #1a1500; }
  .day-card {
    min-width: 56px; padding: 10px 8px; background: var(--surface2); border: 1px solid var(--border);
    border-radius: 12px; cursor: pointer; text-align: center; color: var(--text);
    transition: border-color .2s, background .2s;
  }
  .day-card.active { border-color: var(--gold); background: #1a1500; }
  .time-slot {
    padding: 10px 8px; background: var(--surface2); border: 1px solid var(--border);
    border-radius: 8px; cursor: pointer; color: var(--text); font-size: 14px;
    transition: all .2s;
  }
  .time-slot.active { background: var(--gold); color: #000; border-color: var(--gold); font-weight: 700; }
  .time-slot:hover:not(.active) { border-color: var(--muted); }
  .tab-btn {
    padding: 12px 14px; background: none; border: none; border-bottom: 2px solid transparent;
    color: var(--muted); cursor: pointer; font-family: var(--font-body); font-size: 13px;
    white-space: nowrap; transition: color .2s, border-color .2s;
  }
  .tab-btn.active { color: var(--gold); border-bottom-color: var(--gold); }
  .filter-btn {
    padding: 7px 14px; background: var(--surface2); border: 1px solid var(--border);
    border-radius: 20px; color: var(--muted); font-size: 13px; cursor: pointer; transition: all .2s;
  }
  .filter-btn.active { background: var(--gold); color: #000; border-color: var(--gold); font-weight:700; }
  .slot-toggle {
    padding: 6px 10px; font-size: 12px; background: var(--surface2); border: 1px solid var(--border);
    border-radius: 6px; color: var(--muted); cursor: pointer; transition: all .2s;
  }
  .slot-toggle.active { background: #1a1500; border-color: var(--gold); color: var(--gold); font-weight:600; }
  .toggle {
    width: 48px; height: 26px; border-radius: 13px; background: var(--surface2);
    border: 1px solid var(--border); cursor: pointer; position: relative; transition: background .3s;
    padding: 0;
  }
  .toggle.on { background: var(--gold); border-color: var(--gold); }
  .toggle-knob {
    display: block; width: 20px; height: 20px; background: var(--muted);
    border-radius: 50%; position: absolute; top: 2px; left: 2px;
    transition: transform .3s, background .3s;
  }
  .toggle.on .toggle-knob { transform: translateX(22px); background: #000; }
`;
