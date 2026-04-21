const fs = require("fs");
const path = require("path");
const P = require("pino");
const qrcode = require("qrcode-terminal");
const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

function printUsage() {
  console.log(`Uso:
  node send-was.js --to 5511999999999 [--file ./output.was]
                   [--auth-dir ./auth_info] [--logout]`);
}

function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (!arg.startsWith("--")) {
      throw new Error(`Argumento invalido: ${arg}`);
    }

    const key = arg.slice(2);

    if (key === "logout") {
      args.logout = true;
      continue;
    }

    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Valor ausente para --${key}`);
    }

    args[key] = value;
    i += 1;
  }

  return args;
}

async function start(config) {
  const { stickerPath, targetNumber, authFolder, logoutOnSuccess } = config;
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: P({ level: "silent" }),
    auth: state,
    browser: ["Lottie WAS Sender", "Chrome", "1.0.0"]
  });

  let sent = false;

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log("QR gerado. Escaneie com o WhatsApp no celular.");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open" && !sent) {
      sent = true;
      const jid = `${targetNumber}@s.whatsapp.net`;
      await sock.sendMessage(jid, {
        sticker: fs.readFileSync(stickerPath),
        mimetype: "application/was"
      });
      console.log(`Sticker enviado para ${targetNumber}`);
      if (logoutOnSuccess) {
        await sock.logout();
      } else {
        sock.end(undefined);
      }
      process.exit(0);
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;

      if (sent) {
        return;
      }

      if (statusCode === DisconnectReason.loggedOut) {
        console.error("Sessao desconectada do WhatsApp. Rode o script novamente para gerar outro QR.");
        process.exit(1);
      }

      console.log("Conexao fechada antes do envio. Tentando reconectar...");
      setTimeout(() => {
        start(config).catch(err => {
          console.error(err.stack || err.message);
          process.exit(1);
        });
      }, 1500);
    }
  });
}

function getConfig() {
  const args = parseArgs(process.argv.slice(2));
  const stickerPath = path.resolve(args.file || process.env.STICKER_PATH || "./output.was");
  const targetNumber = (args.to || process.env.WHATSAPP_TARGET || "").replace(/\D/g, "");
  const authFolder = path.resolve(args["auth-dir"] || process.env.BAILEYS_AUTH_DIR || "./auth_info");
  const logoutOnSuccess = Boolean(args.logout);

  if (!targetNumber) {
    printUsage();
    throw new Error("Informe o numero de destino com --to ou WHATSAPP_TARGET.");
  }

  if (!fs.existsSync(stickerPath)) {
    throw new Error(`Arquivo .was nao encontrado: ${stickerPath}`);
  }

  return { stickerPath, targetNumber, authFolder, logoutOnSuccess };
}

start(getConfig()).catch(err => {
  console.error(err.stack || err.message);
  process.exit(1);
});
