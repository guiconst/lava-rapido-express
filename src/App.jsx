import { useEffect, useState } from "react";
import { LocalNotifications } from "@capacitor/local-notifications";

const TITULO = "Lava-Rápido Express";
const ID_INICIO = 1;
const ID_PRONTO = 100;
const ATRASO_MS = 15 * 1000;

export default function App() {
  const [permissao, setPermissao] = useState("desconhecida");
  const [pendentes, setPendentes] = useState(0);
  const [status, setStatus] = useState({ tipo: "info", texto: "Pronto para começar." });

  const info = (texto) => setStatus({ tipo: "info", texto });
  const ok = (texto) => setStatus({ tipo: "ok", texto });
  const erro = (texto) => setStatus({ tipo: "erro", texto });

  // Desafio extra: contar notificações pendentes
  const contarPendentes = async () => {
    try {
      const { notifications } = await LocalNotifications.getPending();
      setPendentes(notifications.length);
      return notifications.length;
    } catch (e) {
      erro(`Não foi possível contar as pendentes: ${e.message}`);
      return 0;
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
            schedule: { at: new Date(Date.now() + ATRASO_MS) },
          },
        ],
      });
      ok("Lavagem iniciada. Aviso de 'Carro Pronto' em 15s.");
      await contarPendentes();
      setTimeout(contarPendentes, ATRASO_MS + 1000);
    } catch (e) {
      erro(`Erro ao agendar: ${e.message}`);
    }
  };

  const cancelarLavagem = async () => {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: ID_PRONTO }] });
      info("Agendamento cancelado.");
      await contarPendentes();
    } catch (e) {
      erro(`Erro ao cancelar: ${e.message}`);
    }
  };

  useEffect(() => {
    verificarPermissao();
    contarPendentes();
    const sub = LocalNotifications.addListener("localNotificationReceived", contarPendentes);
    return () => {
      sub.then((s) => s.remove());
    };
  }, []);

  return (
    <main className="app">
      <style>{css}</style>
      <h1>{TITULO} 🚿</h1>
      <p className="sub">Aluno 10 · Notificações locais</p>

      <section>
        <p>
          Permissão: <strong>{permissao}</strong>
        </p>
        <button onClick={solicitarPermissao}>Solicitar permissão</button>
        <button onClick={verificarPermissao} className="sec">
          Verificar
        </button>
      </section>

      <section>
        <button onClick={iniciarLavagem}>Iniciar lavagem</button>
        <button onClick={cancelarLavagem} className="sec">
          Cancelar agendamento
        </button>
      </section>

      <section>
        <p>
          Notificações pendentes: <strong>{pendentes}</strong>
        </p>
        <button onClick={contarPendentes} className="sec">
          Contar pendentes
        </button>
      </section>

      <p className={`status ${status.tipo}`} role="status">
        {status.texto}
      </p>
    </main>
  );
}

const css = `
  .app { max-width: 420px; margin: 0 auto; padding: 24px 16px; font-family: system-ui, sans-serif; color: #111; }
  h1 { font-size: 1.4rem; margin: 0; }
  .sub { color: #666; margin: 4px 0 20px; }
  section { border: 1px solid #ddd; border-radius: 10px; padding: 14px; margin-bottom: 12px; }
  section p { margin: 0 0 10px; }
  button { background: #111; color: #fff; border: 0; border-radius: 8px; padding: 10px 14px; margin: 0 8px 0 0; font-size: 0.95rem; }
  button.sec { background: #eee; color: #111; }
  .status { padding: 10px 12px; border-radius: 8px; font-size: 0.9rem; }
  .status.info { background: #f2f2f2; }
  .status.ok { background: #e6f6ea; color: #14532d; }
  .status.erro { background: #fdeaea; color: #991b1b; }
`;
