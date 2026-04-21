import { useState } from "react";
import { SERVICES, next7Days, dateKey, formatPhone } from "../../utils/data";
import LoyaltyBadge from "../LoyaltyBadge";
import Row from "../common/Row";
import "./ClientFlow.css";

export default function ClientFlow({ data, update, setView }) {
  const [step, setStep] = useState("phone");
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
      update((d) => {
        d.clients[rawPhone] = { phone: rawPhone, cuts: 0, freeNext: false };
        return d;
      });
      setIsNew(true);
    }
    setStep("date");
  };

  const bookedTimes = (dateStr) =>
    data.appointments
      .filter((a) => a.date === dateStr && a.status !== "cancelado")
      .map((a) => a.time);

  const availableForDay = (date) => {
    const dow = date.getDay();
    const slots = data.availableSlots[dow] || [];
    const booked = bookedTimes(dateKey(date));
    let available = slots.filter((t) => !booked.includes(t));

    // Se é hoje, filtra horários que já passaram
    const today = new Date();
    const isToday = dateKey(date) === dateKey(today);
    
    if (isToday) {
      const currentHour = today.getHours();
      const currentMinutes = today.getMinutes();
      
      available = available.filter((timeStr) => {
        const [h, m] = timeStr.split(':').map(Number);
        const slotTime = h * 60 + m; // converte para minutos
        const currentTime = currentHour * 60 + currentMinutes;
        return slotTime > currentTime; // só mostra horários futuros
      });
    }

    return available;
  };

  const handleBook = () => {
    const isFree = loyalty.enabled && client && client.freeNext;
    update((d) => {
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

  const days = next7Days().filter((d) => availableForDay(d).length > 0);

  return (
    <div className="panel">
      <header className="panel-header">
        <button className="btn-back" onClick={() => setView("home")}>← Voltar</button>
        <h2 className="panel-title">Agendamento</h2>
        <div className="steps">
          {['Telefone', 'Horário', 'Confirmação'].map((s, i) => (
            <div
              key={s}
              className="step-dot"
              style={{
                background:
                  i < (step === 'phone' ? 0 : step === 'date' ? 1 : step === 'confirm' ? 2 : 3) + 1 ||
                  step === 'done'
                    ? 'var(--gold)'
                    : 'var(--surface2)',
              }}
            />
          ))}
        </div>
      </header>

      <div className="panel-body">
        {step === 'phone' && (
          <div className="fade-in form-card">
            <h3 className="card-title">Qual é o seu número?</h3>
            <p className="card-sub">Usamos apenas seu telefone para identificação</p>
            <input
              className="input"
              placeholder="(00) 00000-0000"
              value={phone}
              onChange={(e) => {
                const fmt = formatPhone(e.target.value);
                setPhone(fmt);
                setRawPhone(fmt.replace(/\D/g, ""));
              }}
              onKeyDown={(e) => e.key === 'Enter' && handlePhoneSubmit()}
            />
            {loyalty.enabled && data.clients[rawPhone] && (
              <LoyaltyBadge client={data.clients[rawPhone]} config={loyalty} />
            )}
            <button
              className="btn-primary"
              style={{ marginTop: 24, width: '100%' }}
              onClick={handlePhoneSubmit}
              disabled={rawPhone.length < 10}
            >
              Continuar →
            </button>
          </div>
        )}

        {step === 'date' && (
          <div className="fade-in">
            {isNew && (
              <div className="welcome-bar">
                🎉 Bem-vindo! Cadastro realizado com sucesso.
              </div>
            )}
            {loyalty.enabled && client?.freeNext && (
              <div className="free-bar">
                🎁 Seu próximo corte é <strong>GRATUITO</strong>! Aproveite.
              </div>
            )}

            <div className="section">
              <h3 className="section-title">Escolha o Serviço</h3>
              <div className="service-grid">
                {SERVICES.map((s) => (
                  <button
                    key={s.id}
                    className={`service-card ${selectedService === s.id ? 'active' : ''}`}
                    onClick={() => setSelectedService(s.id)}
                  >
                    <span className="service-label">{s.label}</span>
                    <span className="service-price">
                      {client?.freeNext && loyalty.enabled ? 'GRÁTIS' : s.price}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="section">
              <h3 className="section-title">Escolha o Dia</h3>
              <div className="day-grid">
                {days.map((d) => (
                  <button
                    key={dateKey(d)}
                    className={`day-card ${selectedDate && dateKey(selectedDate) === dateKey(d) ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedDate(d);
                      setSelectedTime(null);
                    }}
                  >
                    <span className="day-name">{d.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                    <span className="day-num">{d.getDate()}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedDate && (
              <div className="section fade-in">
                <h3 className="section-title">Horários Disponíveis</h3>
                <div className="time-grid">
                  {availableForDay(selectedDate).map((t) => (
                    <button
                      key={t}
                      className={`time-slot ${selectedTime === t ? 'active' : ''}`}
                      onClick={() => setSelectedTime(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              className="btn-primary"
              style={{ width: '100%', marginTop: 24 }}
              disabled={!selectedDate || !selectedTime || !selectedService}
              onClick={() => setStep('confirm')}
            >
              Confirmar →
            </button>
          </div>
        )}

        {step === 'confirm' && (
          <div className="fade-in form-card">
            <h3 className="card-title">Confirmar Agendamento</h3>
            <div className="confirm-card">
              <Row label="Telefone" value={phone} />
              <Row label="Serviço" value={SERVICES.find((s) => s.id === selectedService)?.label} />
              <Row
                label="Data"
                value={selectedDate?.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              />
              <Row label="Horário" value={selectedTime} />
              {loyalty.enabled && client?.freeNext && (
                <Row label="Desconto" value="🎁 Corte Gratuito!" highlight />
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setStep('date')}>
                ← Voltar
              </button>
              <button className="btn-primary" style={{ flex: 2 }} onClick={handleBook}>
                Agendar ✓
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="fade-in form-card" style={{ textAlign: 'center' }}>
            <div className="success-icon">✓</div>
            <h3 className="card-title">Agendado!</h3>
            <p className="card-sub">
              Seu horário está confirmado para{' '}
              <strong>
                {selectedDate?.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </strong>{' '}
              às <strong>{selectedTime}</strong>.
            </p>
            {loyalty.enabled && <LoyaltyBadge client={data.clients[rawPhone]} config={loyalty} />}
            <button
              className="btn-primary"
              style={{ marginTop: 24, width: '100%' }}
              onClick={() => setView('home')}
            >
              Voltar ao Início
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
