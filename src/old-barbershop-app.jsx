
import { useState, useEffect } from "react";

// ── Utility helpers ─────────────────────────────────────────────────────────
const STORAGE_KEY = "barbearia_data";

const defaultData = {
  clients: {},          // { phone: { name, cuts, freeNext } }
  appointments: [],     // { id, phone, date, time, service, status }
  availableSlots: {     // dayOfWeek (0=Sun…6=Sat) -> [times]
    1: ["09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30"],
    2: ["09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30"],
    3: ["09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30"],
    4: ["09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30"],
    5: ["09:00","09:30","10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30"],
    6: ["09:00","09:30","10:00","10:30","11:00"],
  },
  loyaltyConfig: {
    enabled: true,
    cutsRequired: 5,   // every N cuts → 1 free
  },
  barberPassword: "1234",
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultData, ...JSON.parse(raw) };
  } catch {}
  return defaultData;
}
function saveData(d) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
}

const DAYS_PT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const SERVICES = [
  { id: "corte", label: "Corte", price: "R$ 35" },
  { id: "barba", label: "Barba", price: "R$ 25" },
  { id: "corte_barba", label: "Corte + Barba", price: "R$ 55" },
  { id: "degradê", label: "Degradê", price: "R$ 40" },
];

function formatPhone(v) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}

function next7Days() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function dateKey(d) {
  return d.toISOString().split("T")[0];
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [data, setData] = useState(loadData);
  const [view, setView] = useState("home"); // home | client | barber
  const [barberAuth, setBarberAuth] = useState(false);

  const update = (fn) => setData(prev => {
    const next = fn(structuredClone(prev));
    saveData(next);
    return next;
  });

  return (
    <div style={styles.root}>
      <style>{css}</style>
      {view === "home" && <HomeScreen setView={setView} />}
      {view === "client" && (
        <ClientFlow data={data} update={update} setView={setView} />
      )}
      {view === "barber" && (
        <BarberPanel
          data={data}
          update={update}
          setView={setView}
          auth={barberAuth}
          setAuth={setBarberAuth}
        />
      )}
    </div>
  );
}

// ── Home ──────────────────────────────────────────────────────────────────────
function HomeScreen({ setView }) {
  return (
    <div style={styles.home}>
      <div style={styles.homeBg} />
      <div style={styles.homeContent}>
        <div style={styles.logoWrap}>
          <span style={styles.logoScissors}>✂</span>
          <h1 style={styles.logoText}>NAVALHA<span style={styles.logoAccent}>&</span>CO.</h1>
          <p style={styles.logoSub}>Barbearia Tradicional</p>
        </div>
        <div style={styles.homeButtons}>
          <button className="btn-primary" onClick={() => setView("client")}>
            <span>Agendar Horário</span>
            <span style={styles.btnArrow}>→</span>
          </button>
          <button className="btn-ghost" onClick={() => setView("barber")}>
            Painel do Barbeiro
          </button>
        </div>
      </div>
      <div style={styles.homeDecor}>
        <div style={styles.decorLine} />
        <span style={styles.decorText}>EST. 2024</span>
        <div style={styles.decorLine} />
      </div>
    </div>
  );
}

// ── Client Flow ───────────────────────────────────────────────────────────────
function ClientFlow({ data, update, setView }) {
  const [step, setStep] = useState("phone"); // phone | date | confirm | done
  const [phone, setPhone] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [rawPhone, setRawPhone] = useState("");

  const client = data.clients[rawPhone];
  const loyalty = data.loyaltyConfig;

  const handlePhoneSubmit = () => {
    if (rawPhone.length < 10) return;
    const exists = !!data.clients[rawPhone];
    if (!exists) {
      update(d => { d.clients[rawPhone] = { phone: rawPhone, cuts: 0, freeNext: false }; return d; });
      setIsNew(true);
    }
    setStep("date");
  };

  const bookedTimes = (dateStr) =>
    data.appointments
      .filter(a => a.date === dateStr && a.status !== "cancelado")
      .map(a => a.time);

  const availableForDay = (date) => {
    const dow = date.getDay();
    const slots = data.availableSlots[dow] || [];
    const booked = bookedTimes(dateKey(date));
    return slots.filter(t => !booked.includes(t));
  };

  const handleBook = () => {
    const isFree = loyalty.enabled && client && client.freeNext;
    update(d => {
      const ap = {
        id: Date.now(),
        phone: rawPhone,
        date: dateKey(selectedDate),
        time: selectedTime,
        service: selectedService,
        status: "agendado",
        isFree,
      };
      d.appointments.push(ap);
      // loyalty
      if (loyalty.enabled) {
        if (!d.clients[rawPhone]) d.clients[rawPhone] = { cuts: 0, freeNext: false };
        const c = d.clients[rawPhone];
        if (isFree) {
          c.freeNext = false;
        } else {
          c.cuts = (c.cuts || 0) + 1;
          if (c.cuts % loyalty.cutsRequired === 0) c.freeNext = true;
        }
      }
      return d;
    });
    setStep("done");
  };

  const days = next7Days().filter(d => availableForDay(d).length > 0);

  return (
    <div style={styles.panel}>
      <header style={styles.panelHeader}>
        <button className="btn-back" onClick={() => setView("home")}>← Voltar</button>
        <h2 style={styles.panelTitle}>Agendamento</h2>
        <div style={styles.steps}>
          {["Telefone","Horário","Confirmação"].map((s,i) => (
            <div key={s} style={{
              ...styles.stepDot,
              background: i < (step==="phone"?0:step==="date"?1:step==="confirm"?2:3) + 1 || step==="done" ? "var(--gold)" : "var(--surface2)"
            }} />
          ))}
        </div>
      </header>

      <div style={styles.panelBody}>
        {step === "phone" && (
          <div className="fade-in" style={styles.formCard}>
            <h3 style={styles.cardTitle}>Qual é o seu número?</h3>
            <p style={styles.cardSub}>Usamos apenas seu telefone para identificação</p>
            <input
              style={styles.input}
              placeholder="(00) 00000-0000"
              value={phone}
              onChange={e => {
                const fmt = formatPhone(e.target.value);
                setPhone(fmt);
                setRawPhone(fmt.replace(/\D/g,""));
              }}
              onKeyDown={e => e.key === "Enter" && handlePhoneSubmit()}
            />
            {loyalty.enabled && data.clients[rawPhone] && (
              <LoyaltyBadge client={data.clients[rawPhone]} config={loyalty} />
            )}
            <button className="btn-primary" style={{marginTop:24,width:"100%"}} onClick={handlePhoneSubmit}
              disabled={rawPhone.length < 10}>
              Continuar →
            </button>
          </div>
        )}

        {step === "date" && (
          <div className="fade-in">
            {isNew && (
              <div style={styles.welcomeBar}>
                🎉 Bem-vindo! Cadastro realizado com sucesso.
              </div>
            )}
            {loyalty.enabled && client?.freeNext && (
              <div style={styles.freeBar}>
                🎁 Seu próximo corte é <strong>GRATUITO</strong>! Aproveite.
              </div>
            )}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Escolha o Serviço</h3>
              <div style={styles.serviceGrid}>
                {SERVICES.map(s => (
                  <button key={s.id} className={`service-card ${selectedService===s.id?"active":""}`}
                    onClick={() => setSelectedService(s.id)}>
                    <span style={styles.serviceLabel}>{s.label}</span>
                    <span style={styles.servicePrice}>{client?.freeNext && loyalty.enabled ? "GRÁTIS" : s.price}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Escolha o Dia</h3>
              <div style={styles.dayGrid}>
                {days.map(d => (
                  <button key={dateKey(d)} className={`day-card ${selectedDate && dateKey(selectedDate)===dateKey(d)?"active":""}`}
                    onClick={() => { setSelectedDate(d); setSelectedTime(null); }}>
                    <span style={styles.dayName}>{DAYS_PT[d.getDay()]}</span>
                    <span style={styles.dayNum}>{d.getDate()}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedDate && (
              <div style={styles.section} className="fade-in">
                <h3 style={styles.sectionTitle}>Horários Disponíveis</h3>
                <div style={styles.timeGrid}>
                  {availableForDay(selectedDate).map(t => (
                    <button key={t} className={`time-slot ${selectedTime===t?"active":""}`}
                      onClick={() => setSelectedTime(t)}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button className="btn-primary" style={{width:"100%",marginTop:24}}
              disabled={!selectedDate || !selectedTime || !selectedService}
              onClick={() => setStep("confirm")}>
              Confirmar →
            </button>
          </div>
        )}

        {step === "confirm" && (
          <div className="fade-in" style={styles.formCard}>
            <h3 style={styles.cardTitle}>Confirmar Agendamento</h3>
            <div style={styles.confirmCard}>
              <Row label="Telefone" value={phone} />
              <Row label="Serviço" value={SERVICES.find(s=>s.id===selectedService)?.label} />
              <Row label="Data" value={selectedDate?.toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"})} />
              <Row label="Horário" value={selectedTime} />
              {loyalty.enabled && client?.freeNext && (
                <Row label="Desconto" value="🎁 Corte Gratuito!" highlight />
              )}
            </div>
            <div style={{display:"flex",gap:12,marginTop:24}}>
              <button className="btn-ghost" style={{flex:1}} onClick={() => setStep("date")}>← Voltar</button>
              <button className="btn-primary" style={{flex:2}} onClick={handleBook}>Agendar ✓</button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="fade-in" style={{...styles.formCard,textAlign:"center"}}>
            <div style={styles.successIcon}>✓</div>
            <h3 style={styles.cardTitle}>Agendado!</h3>
            <p style={styles.cardSub}>
              Seu horário está confirmado para{" "}
              <strong>{selectedDate?.toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long"})}</strong>{" "}
              às <strong>{selectedTime}</strong>.
            </p>
            {loyalty.enabled && (
              <LoyaltyBadge client={data.clients[rawPhone]} config={loyalty} />
            )}
            <button className="btn-primary" style={{marginTop:24,width:"100%"}} onClick={() => setView("home")}>
              Voltar ao Início
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div style={styles.row}>
      <span style={styles.rowLabel}>{label}</span>
      <span style={{...styles.rowValue, color: highlight ? "var(--gold)" : "var(--text)"}}>{value}</span>
    </div>
  );
}

function LoyaltyBadge({ client, config }) {
  if (!config.enabled || !client) return null;
  const cuts = client.cuts || 0;
  const req = config.cutsRequired;
  const progress = cuts % req;
  const pct = (progress / req) * 100;

  return (
    <div style={styles.loyaltyBadge}>
      <div style={styles.loyaltyTop}>
        <span style={styles.loyaltyTitle}>✂ Fidelidade</span>
        {client.freeNext
          ? <span style={styles.loyaltyFree}>GRÁTIS DISPONÍVEL!</span>
          : <span style={styles.loyaltyCount}>{progress}/{req} cortes</span>
        }
      </div>
      <div style={styles.loyaltyBar}>
        <div style={{...styles.loyaltyFill, width: `${client.freeNext?100:pct}%`}} />
      </div>
      {!client.freeNext && (
        <p style={styles.loyaltySub}>
          Faltam <strong>{req - progress}</strong> corte{req-progress!==1?"s":""} para o próximo gratuito!
        </p>
      )}
    </div>
  );
}

// ── Barber Panel ──────────────────────────────────────────────────────────────
function BarberPanel({ data, update, setView, auth, setAuth }) {
  const [pw, setPw] = useState("");
  const [tab, setTab] = useState("agenda"); // agenda | slots | loyalty | clients
  const [pwError, setPwError] = useState(false);

  if (!auth) return (
    <div style={styles.panel}>
      <header style={styles.panelHeader}>
        <button className="btn-back" onClick={() => setView("home")}>← Voltar</button>
        <h2 style={styles.panelTitle}>Área do Barbeiro</h2>
        <div />
      </header>
      <div style={styles.panelBody}>
        <div className="fade-in" style={styles.formCard}>
          <div style={{textAlign:"center",marginBottom:24}}>
            <span style={{fontSize:48}}>🔐</span>
            <h3 style={styles.cardTitle}>Acesso Restrito</h3>
            <p style={styles.cardSub}>Digite a senha do barbeiro</p>
          </div>
          <input type="password" style={styles.input} placeholder="Senha"
            value={pw} onChange={e => { setPw(e.target.value); setPwError(false); }}
            onKeyDown={e => {
              if (e.key === "Enter") {
                if (pw === data.barberPassword) setAuth(true);
                else setPwError(true);
              }
            }}
          />
          {pwError && <p style={styles.error}>Senha incorreta. (padrão: 1234)</p>}
          <button className="btn-primary" style={{width:"100%",marginTop:16}}
            onClick={() => { if (pw === data.barberPassword) setAuth(true); else setPwError(true); }}>
            Entrar
          </button>
        </div>
      </div>
    </div>
  );

  const tabs = [
    {id:"agenda",label:"📅 Agenda"},
    {id:"slots",label:"⏰ Horários"},
    {id:"loyalty",label:"⭐ Fidelidade"},
    {id:"clients",label:"👥 Clientes"},
  ];

  return (
    <div style={styles.panel}>
      <header style={styles.panelHeader}>
        <button className="btn-back" onClick={() => { setAuth(false); setView("home"); }}>← Sair</button>
        <h2 style={styles.panelTitle}>Painel do Barbeiro</h2>
        <div />
      </header>
      <div style={styles.tabBar}>
        {tabs.map(t => (
          <button key={t.id} className={`tab-btn ${tab===t.id?"active":""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={styles.panelBody}>
        {tab === "agenda" && <AgendaTab data={data} update={update} />}
        {tab === "slots" && <SlotsTab data={data} update={update} />}
        {tab === "loyalty" && <LoyaltyTab data={data} update={update} />}
        {tab === "clients" && <ClientsTab data={data} update={update} />}
      </div>
    </div>
  );
}

function AgendaTab({ data, update }) {
  const [filter, setFilter] = useState("todos");
  const today = dateKey(new Date());
  let apps = [...data.appointments].sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time));
  if (filter === "hoje") apps = apps.filter(a => a.date === today);
  if (filter === "pendentes") apps = apps.filter(a => a.status === "agendado");
  if (filter === "futuros") apps = apps.filter(a => a.date >= today);

  const cancel = (id) => update(d => {
    const a = d.appointments.find(x => x.id === id);
    if (a) a.status = "cancelado";
    return d;
  });
  const complete = (id) => update(d => {
    const a = d.appointments.find(x => x.id === id);
    if (a) a.status = "concluído";
    return d;
  });

  return (
    <div>
      <div style={styles.filterBar}>
        {["todos","hoje","futuros","pendentes"].map(f => (
          <button key={f} className={`filter-btn ${filter===f?"active":""}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>
      {apps.length === 0 && <div style={styles.empty}>Nenhum agendamento encontrado.</div>}
      {apps.map(a => {
        const svc = SERVICES.find(s => s.id === a.service);
        const dateObj = new Date(a.date + "T12:00:00");
        return (
          <div key={a.id} style={{...styles.apCard, opacity: a.status==="cancelado"?0.5:1}}>
            <div style={styles.apLeft}>
              <div style={styles.apDate}>{dateObj.toLocaleDateString("pt-BR",{day:"numeric",month:"short"})}</div>
              <div style={styles.apTime}>{a.time}</div>
            </div>
            <div style={styles.apMid}>
              <div style={styles.apPhone}>{formatPhone(a.phone)}</div>
              <div style={styles.apService}>{svc?.label} {a.isFree && <span style={styles.freeBadge}>GRÁTIS</span>}</div>
            </div>
            <div style={styles.apRight}>
              <span style={{...styles.badge, background: statusColor(a.status)}}>{a.status}</span>
              {a.status === "agendado" && (
                <div style={{display:"flex",gap:6,marginTop:8}}>
                  <button className="btn-sm-success" onClick={() => complete(a.id)}>✓</button>
                  <button className="btn-sm-danger" onClick={() => cancel(a.id)}>✕</button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function statusColor(s) {
  if (s === "agendado") return "#2563eb";
  if (s === "concluído") return "#16a34a";
  if (s === "cancelado") return "#dc2626";
  return "#6b7280";
}

function SlotsTab({ data, update }) {
  const allTimes = [];
  for (let h = 8; h <= 19; h++) {
    allTimes.push(`${String(h).padStart(2,"0")}:00`);
    allTimes.push(`${String(h).padStart(2,"0")}:30`);
  }

  const toggle = (dow, time) => update(d => {
    if (!d.availableSlots[dow]) d.availableSlots[dow] = [];
    const idx = d.availableSlots[dow].indexOf(time);
    if (idx > -1) d.availableSlots[dow].splice(idx, 1);
    else d.availableSlots[dow].push(time);
    d.availableSlots[dow].sort();
    return d;
  });

  return (
    <div>
      <p style={styles.cardSub}>Clique nos horários para ativar/desativar por dia da semana.</p>
      {[1,2,3,4,5,6].map(dow => (
        <div key={dow} style={styles.slotDay}>
          <h4 style={styles.slotDayName}>{["","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"][dow]}</h4>
          <div style={styles.slotGrid}>
            {allTimes.map(t => {
              const active = (data.availableSlots[dow]||[]).includes(t);
              return (
                <button key={t} className={`slot-toggle ${active?"active":""}`} onClick={() => toggle(dow, t)}>
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function LoyaltyTab({ data, update }) {
  const cfg = data.loyaltyConfig;
  return (
    <div style={styles.formCard}>
      <h3 style={styles.cardTitle}>⭐ Programa de Fidelidade</h3>
      <div style={styles.toggleRow}>
        <span style={styles.rowLabel}>Ativar Fidelidade</span>
        <button className={`toggle ${cfg.enabled?"on":""}`}
          onClick={() => update(d => { d.loyaltyConfig.enabled = !d.loyaltyConfig.enabled; return d; })}>
          <span className="toggle-knob" />
        </button>
      </div>
      {cfg.enabled && (
        <>
          <div style={styles.row}>
            <span style={styles.rowLabel}>Cortes para ganhar 1 grátis</span>
            <div style={styles.counter}>
              <button className="btn-sm" onClick={() => update(d => { if(d.loyaltyConfig.cutsRequired>2) d.loyaltyConfig.cutsRequired--; return d; })}>−</button>
              <span style={styles.counterVal}>{cfg.cutsRequired}</span>
              <button className="btn-sm" onClick={() => update(d => { d.loyaltyConfig.cutsRequired++; return d; })}>+</button>
            </div>
          </div>
          <p style={styles.cardSub}>
            A cada <strong>{cfg.cutsRequired}</strong> cortes realizados, o próximo será gratuito automaticamente.
          </p>
        </>
      )}
      <h3 style={{...styles.sectionTitle,marginTop:32}}>Visão Geral dos Clientes</h3>
      {Object.values(data.clients).map(c => (
        <div key={c.phone} style={styles.loyaltyRow}>
          <span style={styles.apPhone}>{formatPhone(c.phone)}</span>
          <span style={styles.cardSub}>{c.cuts||0} corte{(c.cuts||0)!==1?"s":""}</span>
          {c.freeNext && <span style={styles.freeBadge}>GRÁTIS</span>}
          {cfg.enabled && !c.freeNext && (
            <span style={styles.cardSub}>
              Faltam {cfg.cutsRequired - ((c.cuts||0) % cfg.cutsRequired)}
            </span>
          )}
          <button className="btn-sm-success" title="Registrar corte manualmente"
            onClick={() => update(d => {
              if (!d.clients[c.phone]) return d;
              d.clients[c.phone].cuts = (d.clients[c.phone].cuts||0)+1;
              if (cfg.enabled && d.clients[c.phone].cuts % cfg.cutsRequired === 0)
                d.clients[c.phone].freeNext = true;
              return d;
            })}>+corte</button>
        </div>
      ))}
      {Object.keys(data.clients).length === 0 && <div style={styles.empty}>Nenhum cliente cadastrado ainda.</div>}
    </div>
  );
}

function ClientsTab({ data, update }) {
  const [search, setSearch] = useState("");
  const clients = Object.values(data.clients).filter(c =>
    c.phone.includes(search.replace(/\D/g,""))
  );
  return (
    <div>
      <input style={styles.input} placeholder="Buscar por telefone..."
        value={search} onChange={e => setSearch(e.target.value)} />
      {clients.length === 0 && <div style={styles.empty}>Nenhum cliente encontrado.</div>}
      {clients.map(c => {
        const appts = data.appointments.filter(a => a.phone === c.phone);
        const done = appts.filter(a => a.status === "concluído").length;
        return (
          <div key={c.phone} style={styles.clientCard}>
            <div style={styles.clientTop}>
              <span style={styles.apPhone}>{formatPhone(c.phone)}</span>
              <span style={styles.badge}>{done} concluídos</span>
            </div>
            <div style={styles.clientMeta}>
              <span style={styles.cardSub}>Total de cortes: {c.cuts||0}</span>
              {c.freeNext && <span style={styles.freeBadge}>PRÓXIMO GRÁTIS</span>}
            </div>
            <div style={{marginTop:8}}>
              {appts.slice(-3).reverse().map(a => (
                <div key={a.id} style={styles.miniAp}>
                  <span>{new Date(a.date+"T12:00:00").toLocaleDateString("pt-BR")}</span>
                  <span>{a.time}</span>
                  <span>{SERVICES.find(s=>s.id===a.service)?.label}</span>
                  <span style={{...styles.badge,background:statusColor(a.status)}}>{a.status}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = {
  root: { minHeight:"100vh", background:"var(--bg)", color:"var(--text)", fontFamily:"var(--font-body)" },
  home: { minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" },
  homeBg: { position:"absolute", inset:0, background:"radial-gradient(ellipse at 20% 50%, #1a0a00 0%, #0a0a0a 60%, #0d0d12 100%)", zIndex:0 },
  homeContent: { position:"relative", zIndex:1, textAlign:"center", padding:"0 24px" },
  logoWrap: { marginBottom:48 },
  logoScissors: { fontSize:48, display:"block", marginBottom:8, filter:"drop-shadow(0 0 20px var(--gold))" },
  logoText: { fontFamily:"var(--font-display)", fontSize:"clamp(36px,8vw,72px)", fontWeight:700, letterSpacing:"0.1em", color:"var(--text)", margin:0 },
  logoAccent: { color:"var(--gold)" },
  logoSub: { fontFamily:"var(--font-body)", fontSize:14, letterSpacing:"0.4em", color:"var(--muted)", marginTop:8, textTransform:"uppercase" },
  homeButtons: { display:"flex", flexDirection:"column", gap:16, alignItems:"center" },
  btnArrow: { marginLeft:8 },
  homeDecor: { position:"absolute", bottom:32, display:"flex", alignItems:"center", gap:16, zIndex:1 },
  decorLine: { width:60, height:1, background:"var(--muted)" },
  decorText: { fontSize:11, letterSpacing:"0.4em", color:"var(--muted)", fontFamily:"var(--font-body)" },
  panel: { minHeight:"100vh", display:"flex", flexDirection:"column" },
  panelHeader: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", borderBottom:"1px solid var(--border)", background:"var(--surface)" },
  panelTitle: { fontFamily:"var(--font-display)", fontSize:20, fontWeight:700, margin:0, color:"var(--text)" },
  steps: { display:"flex", gap:6 },
  stepDot: { width:8, height:8, borderRadius:"50%", transition:"background .3s" },
  panelBody: { flex:1, padding:"20px 16px", overflowY:"auto" },
  tabBar: { display:"flex", overflowX:"auto", borderBottom:"1px solid var(--border)", background:"var(--surface)", padding:"0 12px" },
  formCard: { background:"var(--surface)", borderRadius:16, padding:24, border:"1px solid var(--border)", maxWidth:480, margin:"0 auto" },
  cardTitle: { fontFamily:"var(--font-display)", fontSize:22, fontWeight:700, margin:"0 0 8px", color:"var(--text)" },
  cardSub: { color:"var(--muted)", fontSize:14, margin:"0 0 8px", lineHeight:1.5 },
  input: { width:"100%", padding:"14px 16px", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, color:"var(--text)", fontSize:16, boxSizing:"border-box", outline:"none", fontFamily:"var(--font-body)" },
  section: { marginBottom:24 },
  sectionTitle: { fontFamily:"var(--font-display)", fontSize:16, fontWeight:600, marginBottom:12, color:"var(--muted-light)", textTransform:"uppercase", letterSpacing:"0.1em" },
  serviceGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 },
  serviceLabel: { display:"block", fontWeight:600, fontSize:15 },
  servicePrice: { display:"block", color:"var(--gold)", fontSize:13, marginTop:4 },
  dayGrid: { display:"flex", gap:8, overflowX:"auto", paddingBottom:4 },
  dayName: { display:"block", fontSize:11, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.1em" },
  dayNum: { display:"block", fontSize:22, fontWeight:700, marginTop:2 },
  timeGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(72px,1fr))", gap:8 },
  confirmCard: { background:"var(--surface2)", borderRadius:12, padding:16 },
  row: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:"1px solid var(--border)" },
  rowLabel: { color:"var(--muted)", fontSize:14 },
  rowValue: { fontWeight:600, fontSize:15 },
  successIcon: { width:64, height:64, borderRadius:"50%", background:"var(--gold)", color:"#000", fontSize:28, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontWeight:700 },
  loyaltyBadge: { background:"linear-gradient(135deg,#1a1200,#2a1f00)", border:"1px solid var(--gold)", borderRadius:12, padding:16, marginTop:20 },
  loyaltyTop: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 },
  loyaltyTitle: { fontWeight:700, color:"var(--gold)", fontSize:14 },
  loyaltyFree: { background:"var(--gold)", color:"#000", fontSize:11, fontWeight:800, padding:"3px 8px", borderRadius:20, letterSpacing:"0.05em" },
  loyaltyCount: { color:"var(--muted)", fontSize:13 },
  loyaltyBar: { height:6, background:"rgba(255,255,255,0.1)", borderRadius:3, overflow:"hidden" },
  loyaltyFill: { height:"100%", background:"var(--gold)", borderRadius:3, transition:"width .5s ease" },
  loyaltySub: { color:"var(--muted)", fontSize:12, margin:"8px 0 0" },
  filterBar: { display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" },
  apCard: { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:14, marginBottom:10, display:"flex", gap:12, alignItems:"flex-start" },
  apLeft: { minWidth:52, textAlign:"center" },
  apDate: { fontSize:12, color:"var(--muted)" },
  apTime: { fontSize:18, fontWeight:700, color:"var(--gold)", fontFamily:"var(--font-display)" },
  apMid: { flex:1 },
  apPhone: { fontWeight:600, fontSize:15 },
  apService: { color:"var(--muted)", fontSize:13, marginTop:2 },
  apRight: { textAlign:"right" },
  badge: { fontSize:11, padding:"3px 8px", borderRadius:20, background:"#334155", color:"#fff", fontWeight:600, display:"inline-block" },
  freeBadge: { fontSize:11, padding:"2px 7px", borderRadius:20, background:"var(--gold)", color:"#000", fontWeight:800, marginLeft:6 },
  slotDay: { marginBottom:20 },
  slotDayName: { fontFamily:"var(--font-display)", fontSize:16, marginBottom:8, color:"var(--muted-light)" },
  slotGrid: { display:"flex", flexWrap:"wrap", gap:6 },
  toggleRow: { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 0", borderBottom:"1px solid var(--border)" },
  counter: { display:"flex", alignItems:"center", gap:12 },
  counterVal: { fontSize:20, fontWeight:700, minWidth:32, textAlign:"center" },
  loyaltyRow: { display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid var(--border)", flexWrap:"wrap" },
  clientCard: { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, padding:16, marginBottom:12 },
  clientTop: { display:"flex", justifyContent:"space-between", alignItems:"center" },
  clientMeta: { display:"flex", gap:12, alignItems:"center", marginTop:6 },
  miniAp: { display:"flex", gap:12, fontSize:13, color:"var(--muted)", padding:"6px 0", borderBottom:"1px solid var(--border)", flexWrap:"wrap" },
  welcomeBar: { background:"#052e16", border:"1px solid #16a34a", borderRadius:10, padding:"12px 16px", marginBottom:16, color:"#86efac", fontSize:14 },
  freeBar: { background:"#1a1200", border:"1px solid var(--gold)", borderRadius:10, padding:"12px 16px", marginBottom:16, color:"var(--gold)", fontSize:14 },
  empty: { textAlign:"center", color:"var(--muted)", padding:"40px 0", fontSize:15 },
  error: { color:"#f87171", fontSize:14, marginTop:8 },
};

const css = `
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
