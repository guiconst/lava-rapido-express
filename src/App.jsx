import { useEffect, useState } from "react";
import { LocalNotifications } from "@capacitor/local-notifications";
import "./App.css";

const TITULO = "Lava-Rápido Express";
const ID_INICIO = 1;
const ID_PRONTO = 100;
const ATRASO_S = 15;

const ROTULO_PERMISSAO = {
  granted: { texto: "Permitidas", classe: "ok" },
  denied: { texto: "Negadas", classe: "erro" },
  prompt: { texto: "Não solicitadas", classe: "aviso" },
  "prompt-with-rationale": { texto: "Não solicitadas", classe: "aviso" },
};

export default function App() {
  const [permissao, setPermissao] = useState("prompt");
  const [pendentes, setPendentes] = useState(0);
  const [fim, setFim] = useState(null); // timestamp do fim da lavagem
  const [restante, setRestante] = useState(0);
  const [fase, setFase] = useState("parado"); // parado | lavando | pronto
  const [status, setStatus] = useState({ tipo: "info", texto: "Pronto para começar." });

  const info = (texto) => setStatus({ tipo: "info", texto });
  const ok = (texto) => setStatus({ tipo: "ok", texto });
  const erro = (texto) => setStatus({ tipo: "erro", texto });

  // Desafio extra: contar notificações pendentes
  const contarPendentes = async () => {
    try {
      const { notifications } = await LocalNotifications.getPending();
      setPendentes(notifications.length);
    } catch (e) {
      erro(`Não foi possível contar as pendentes: ${e.message}`);
    }
  };

  const verificarPermissao = async () => {
    try {
      const { display } = await LocalNotifications.checkPermissions();
      setPermissao(display);
      return display;
    } catch (e) {
      erro(`Erro ao verificar permissão: ${e.message}`);
      return "erro";
    }
  };

  const solicitarPermissao = async () => {
    try {
      const { display } = await LocalNotifications.requestPermissions();
      setPermissao(display);
      display === "granted"
        ? ok("Permissão concedida.")
        : erro("Permissão negada. Ative as notificações nas configurações do app.");
      return display;
    } catch (e) {
      erro(`Erro ao solicitar permissão: ${e.message}`);
      return "erro";
    }
  };

  const garantirPermissao = async () => {
    const atual = await verificarPermissao();
    if (atual === "granted") return true;
    return (await solicitarPermissao()) === "granted";
  };

  const iniciarLavagem = async () => {
    if (!(await garantirPermissao())) return;
    try {
      await LocalNotifications.schedule({
        notifications: [
          // Imediata: sem "schedule"
          { id: ID_INICIO, title: TITULO, body: "Lavagem iniciada! Seu carro está sendo higienizado." },
          // Agendada: "Carro Pronto" em 15s
          {
            id: ID_PRONTO,
            title: TITULO,
            body: "Carro Pronto! Seu veículo foi totalmente higienizado!",
            schedule: { at: new Date(Date.now() + ATRASO_S * 1000) },
          },
        ],
      });
      setFim(Date.now() + ATRASO_S * 1000);
      setRestante(ATRASO_S);
      setFase("lavando");
      ok("Lavagem iniciada. Você será avisado quando o carro estiver pronto.");
      await contarPendentes();
    } catch (e) {
      erro(`Erro ao agendar: ${e.message}`);
    }
  };

  const cancelarLavagem = async () => {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: ID_PRONTO }] });
      setFim(null);
      setFase("parado");
      info("Lavagem cancelada.");
      await contarPendentes();
    } catch (e) {
      erro(`Erro ao cancelar: ${e.message}`);
    }
  };

  // Contagem regressiva visual
  useEffect(() => {
    if (!fim) return;
    const t = setInterval(() => {
      const s = Math.max(0, Math.ceil((fim - Date.now()) / 1000));
      setRestante(s);
      if (s === 0) {
        setFase("pronto");
        setFim(null);
        ok("Carro pronto! Seu veículo foi totalmente higienizado.");
        contarPendentes();
      }
    }, 250);
    return () => clearInterval(t);
  }, [fim]);

  useEffect(() => {
    verificarPermissao();
    contarPendentes();
    const sub = LocalNotifications.addListener("localNotificationReceived", contarPendentes);
    return () => {
      sub.then((s) => s.remove());
    };
  }, []);

  const progresso = fase === "pronto" ? 100 : fase === "lavando" ? ((ATRASO_S - restante) / ATRASO_S) * 100 : 0;
  const perm = ROTULO_PERMISSAO[permissao] ?? { texto: permissao, classe: "aviso" };

  return (
    <div className="app">
      <header>
        <h1>{TITULO}</h1>
        <p>Aluno 10 · Notificações locais</p>
      </header>

      <main>
        <section className="card lavagem">
          <p className="estado">
            {fase === "parado" && "Nenhuma lavagem em andamento"}
            {fase === "lavando" && `Lavando... ${restante}s`}
            {fase === "pronto" && "Carro pronto! ✨"}
          </p>
          <div className="barra" aria-hidden="true">
            <div className="barra-fill" style={{ width: `${progresso}%` }} />
          </div>
          <div className="acoes">
            <button className="primario" onClick={iniciarLavagem} disabled={fase === "lavando"}>
              {fase === "pronto" ? "Lavar de novo" : "Iniciar lavagem"}
            </button>
            {fase === "lavando" && (
              <button className="sec" onClick={cancelarLavagem}>
                Cancelar
              </button>
            )}
          </div>
        </section>

        <section className="card linha">
          <div>
            <span className="rotulo">Notificações</span>
            <span className={`chip ${perm.classe}`}>{perm.texto}</span>
          </div>
          <button className="sec pequeno" onClick={solicitarPermissao}>
            Solicitar permissão
          </button>
        </section>

        <section className="card linha">
          <div>
            <span className="rotulo">Pendentes</span>
            <span className="numero">{pendentes}</span>
          </div>
          <button className="sec pequeno" onClick={contarPendentes}>
            Contar pendentes
          </button>
        </section>

        <p className={`status ${status.tipo}`} role="status">
          {status.texto}
        </p>
      </main>
    </div>
  );
}
