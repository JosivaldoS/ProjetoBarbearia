import { useState } from "react";
import { dateKey, formatPhone, statusColor, contarCortesReais } from "../../utils/data";
import "./AgendaTab.css";

/**
 * AbaAgenda — lista e gerencia agendamentos.
 * Admin vê todos os agendamentos de todos os barbeiros.
 * Barbeiro comum vê apenas os seus próprios.
 *
 * @prop {boolean} eAdmin — se verdadeiro, exibe todos os agendamentos e nome do barbeiro
 */
export default function AgendaTab({ dados, atualizarDados, barbeiro, eAdmin }) {
  const [filtro, setFiltro] = useState("futuros");
  const hoje = dateKey(new Date());

  // Admin vê tudo; barbeiro comum filtra pelo seu próprio id
  let lista = [...dados.agendamentos]
    .filter(a => eAdmin || !a.barbeiroId || a.barbeiroId === barbeiro.id)
    .sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario));

  if (filtro === "hoje")      lista = lista.filter(a => a.data === hoje);
  if (filtro === "pendentes") lista = lista.filter(a => a.status === "agendado");
  if (filtro === "futuros")   lista = lista.filter(a => a.data >= hoje);

  const concluir = id => atualizarDados(d => {
    const ag = d.agendamentos.find(x => x.id === id);
    if (!ag) return d;

    // Marca o agendamento como concluído — ÚNICA fonte de verdade para fidelidade
    ag.status = "concluído";
    ag.concluido = true;

    // ── Atualiza fidelidade do cliente ────────────────────────
    const cfg = d.fidelidadeConfig;
    if (cfg.ativo) {
      const clienteDoBarbeiro = d.clientes[ag.telefone || ag.phone];
      if (clienteDoBarbeiro) {
        // Reconta os cortes reais a partir dos agendamentos concluídos
        const cortesReais = contarCortesReais(d.agendamentos, ag.telefone || ag.phone);

        // Atualiza o campo denormalizado para exibição rápida na UI
        clienteDoBarbeiro.cortes = cortesReais;

        // Verifica se atingiu o limiar para o próximo gratuito
        if (cortesReais > 0 && cortesReais % cfg.cortesNecessarios === 0) {
          clienteDoBarbeiro.proximoGratis = true;
        }
      }
    }

    return d;
  });

  const cancelar = id => atualizarDados(d => {
    const a = d.agendamentos.find(x => x.id === id);
    if (a) a.status = "cancelado";
    return d;
  });

  return (
    <div>
      <div className="filter-bar">
        {["todos","hoje","futuros","pendentes"].map(f => (
          <button key={f} className={`filter-btn ${filtro===f?"active":""}`} onClick={() => setFiltro(f)}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>
      {lista.length === 0 && <div className="empty">Nenhum agendamento encontrado.</div>}
      {lista.map(ag => {
        const srv = dados.servicos?.find(s => s.id === ag.servicoId || s.id === ag.service);
        const cli = dados.clientes[ag.telefone || ag.phone];
        const dataObj = new Date((ag.data || ag.date) + "T12:00:00");
        // Quando admin, mostra o nome do barbeiro responsável por este agendamento
        const barbeiroDoAg = eAdmin
          ? dados.barbeiros?.find(b => b.id === ag.barbeiroId)
          : null;

        return (
          <div key={ag.id} className="ap-card" style={{ opacity: ag.status==="cancelado"?0.5:1 }}>
            <div className="ap-left">
              <div className="ap-date">{dataObj.toLocaleDateString("pt-BR",{day:"numeric",month:"short"})}</div>
              <div className="ap-time">{ag.horario || ag.time}</div>
            </div>
            <div className="ap-mid">
              <div className="ap-phone">{cli?.nome || formatPhone(ag.telefone || ag.phone || "")}</div>
              <div className="ap-service">
                {srv?.label || ag.servicoId}
                {ag.eGratis && <span className="free-badge">GRÁTIS</span>}
                {ag.pagamento === "pix" && <span className="pix-badge">PIX ✓</span>}
              </div>
              {/* Admin: exibe o nome do barbeiro responsável pelo atendimento */}
              {barbeiroDoAg && (
                <div style={{ fontSize:12, color:"var(--muted)", marginTop:4 }}>
                  ✂ {barbeiroDoAg.nome}
                </div>
              )}
            </div>
            <div className="ap-right">
              <span className="badge" style={{ background: statusColor(ag.status) }}>{ag.status}</span>
              {ag.status === "agendado" && (
                <div style={{ display:"flex", gap:6, marginTop:8 }}>
                  <button className="btn-sm-success" onClick={() => concluir(ag.id)}>✓</button>
                  <button className="btn-sm-danger" onClick={() => cancelar(ag.id)}>✕</button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
