# Lava-Rápido Express 🚿

App da **Aula 15 — Recursos de Hardware: Notificações Locais** (Programação para Dispositivos Móveis II, SENAI).
Exercício designado: **Aluno 10 — Lava-Rápido Express**.

> Alerta imediato de início da lavagem e agendamento de 15s para "Carro Pronto".

## O que o app faz

- Solicita e verifica a permissão nativa de notificações (obrigatória no Android 13+).
- Ao tocar em **Iniciar lavagem**, dispara na hora a notificação "Lavagem iniciada".
- Agenda a notificação **"Carro Pronto"** para 15 segundos depois (funciona com o app fechado).
- **Desafio extra:** conta as notificações pendentes com `getPending()`.
- Mostra contagem regressiva da lavagem, mensagens de status e de erro, e permite cancelar o agendamento.

## Tecnologias

React 19 · Vite · Capacitor 8 · `@capacitor/local-notifications`

## Prints e demonstração

<!-- Substitua pelos seus arquivos dentro de docs/ -->
![Print do app](docs/print-app.png)
![Demonstração](docs/demo.gif)

## Baixar o APK

O APK é gerado automaticamente pelo GitHub Actions a cada push na `main`:

- Aba **Releases** → **APK mais recente** → `lava-rapido-express.apk`
- ou aba **Actions** → último workflow → **Artifacts**

## Rodar localmente

```bash
npm install
npm run build
npx cap sync android
npx cap open android   # abre no Android Studio e rode no celular via USB
```

Para ver só a interface no navegador: `npm run dev` (as notificações nativas só funcionam no Android).

## Estrutura

```
src/App.jsx                  # tela e lógica das notificações
android/                     # projeto nativo gerado pelo Capacitor
.github/workflows/android.yml  # build do APK no GitHub Actions
```
