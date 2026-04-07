import { styles } from "../styles";

export default function SlotsTab({ data, update }) {
  const allTimes = [];
  for (let h = 8; h <= 19; h += 1) {
    allTimes.push(`${String(h).padStart(2, "0")}:00`);
    allTimes.push(`${String(h).padStart(2, "0")}:30`);
  }

  const toggle = (dow, time) =>
    update((d) => {
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
      {[1, 2, 3, 4, 5, 6].map((dow) => (
        <div key={dow} style={styles.slotDay}>
          <h4 style={styles.slotDayName}>
            {['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dow]}
          </h4>
          <div style={styles.slotGrid}>
            {allTimes.map((t) => {
              const active = (data.availableSlots[dow] || []).includes(t);
              return (
                <button
                  key={t}
                  className={`slot-toggle ${active ? 'active' : ''}`}
                  onClick={() => toggle(dow, t)}
                >
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
