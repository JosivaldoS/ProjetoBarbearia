import "./SlotsTab.css";

export default function SlotsTab({ dados, atualizarDados }) {
  // Essa função funciona assim: ela gera uma lista de horários disponíveis para cada dia da semana, começando às 8h e terminando às 19h, com intervalos de 30 minutos. A função padStart é usada para garantir que os horários sejam formatados corretamente, com dois dígitos para as horas e os minutos. O resultado é uma lista de strings no formato "HH:MM", como "08:00", "08:30", "09:00", etc.
  const allTimes = [];
  for (let h = 8; h <= 19; h += 1) {
    allTimes.push(`${String(h).padStart(2, "0")}:00`);
    allTimes.push(`${String(h).padStart(2, "0")}:30`);
  }

  const toggle = (dow, time) =>
    atualizarDados((d) => {
      if (!d.availableSlots[dow]) d.availableSlots[dow] = [];
      const idx = d.availableSlots[dow].indexOf(time);
      if (idx > -1) d.availableSlots[dow].splice(idx, 1);
      else d.availableSlots[dow].push(time);
      d.availableSlots[dow].sort();
      return d;
    });

  return (
    <div>
      <p className="card-sub">Clique nos horários para ativar/desativar por dia da semana.</p>
      {[1, 2, 3, 4, 5, 6].map((dow) => (
        <div key={dow} className="slot-day">
          <h4 className="slot-day-name">
            {['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dow]}
          </h4>
          <div className="slot-grid">
            {allTimes.map((t) => {
              const active = (dados.availableSlots[dow] || []).includes(t);
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
