import { useState } from "react";
import { SERVICES, next7Days, dateKey, formatPhone } from "../utils/data";
import LoyaltyBadge from "./LoyaltyBadge";
import Row from "./common/Row";
import { styles } from "../styles";

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
    return slots.filter((t) => !booked.includes(t));
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
    <div style={styles.panel}>
      <header style={styles.panelHeader}>
        <button className="btn-back" onClick={() => setView("home")}>← Voltar</button>
        <h2 style={styles.panelTitle}>Agendamento</h2>
        <div style={styles.steps}>
          {['Telefone', 'Horário', 'Confirmação'].map((s, i) => (
            <div
              key={s}
              style={{
                ...styles.stepDot,
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

      <div style={styles.panelBody}>
        {step === 'phone' && (
          <div className="fade-in" style={styles.formCard}>
            <h3 style={styles.cardTitle}>Qual é o seu número?</h3>
            <p style={styles.cardSub}>Usamos apenas seu telefone para identificação</p>
            <input
              style={styles.input}
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
                {SERVICES.map((s) => (
                  <button
                    key={s.id}
                    className={`service-card ${selectedService === s.id ? 'active' : ''}`}
                    onClick={() => setSelectedService(s.id)}
                  >
                    <span style={styles.serviceLabel}>{s.label}</span>
                    <span style={styles.servicePrice}>
                      {client?.freeNext && loyalty.enabled ? 'GRÁTIS' : s.price}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Escolha o Dia</h3>
              <div style={styles.dayGrid}>
                {days.map((d) => (
                  <button
                    key={dateKey(d)}
                    className={`day-card ${selectedDate && dateKey(selectedDate) === dateKey(d) ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedDate(d);
                      setSelectedTime(null);
                    }}
                  >
                    <span style={styles.dayName}>{d.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                    <span style={styles.dayNum}>{d.getDate()}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedDate && (
              <div style={styles.section} className="fade-in">
                <h3 style={styles.sectionTitle}>Horários Disponíveis</h3>
                <div style={styles.timeGrid}>
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
          <div className="fade-in" style={styles.formCard}>
            <h3 style={styles.cardTitle}>Confirmar Agendamento</h3>
            <div style={styles.confirmCard}>
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
          <div className="fade-in" style={{ ...styles.formCard, textAlign: 'center' }}>
            <div style={styles.successIcon}>✓</div>
            <h3 style={styles.cardTitle}>Agendado!</h3>
            <p style={styles.cardSub}>
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
