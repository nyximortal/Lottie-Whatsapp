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
const { t } = require("./i18n");

function hasSavedAuth(authFolder) {
  return fs.existsSync(path.join(path.resolve(authFolder), "creds.json"));
}

async function ensureWhatsAppSession({
  authFolder = "./auth_info",
  onQr,
  onStatus
}) {
  const resolvedAuthFolder = path.resolve(authFolder);
  const hadSavedAuth = hasSavedAuth(resolvedAuthFolder);
  const { state, saveCreds } = await useMultiFileAuthState(resolvedAuthFolder);
  const { version } = await fetchLatestBaileysVersion();

  return new Promise((resolve, reject) => {
    const sock = makeWASocket({
      version,
      logger: P({ level: "silent" }),
      auth: state,
      browser: ["Lottie WAS Auth", "Chrome", "1.0.0"]
    });

    let finished = false;
    let sawQr = false;

    const finish = async callback => {
      if (finished) {
        return;
      }

      finished = true;

      try {
        await callback();
      } catch (error) {
        reject(error);
      }
    };

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        sawQr = true;

        if (typeof onStatus === "function") {
          onStatus(
            hadSavedAuth ? t("send.sessionExpired") : t("send.loginRequired")
          );
        }

        if (typeof onQr === "function") {
          onQr(qr);
        } else {
          qrcode.generate(qr, { small: true });
        }
      }

      if (connection === "open") {
        await finish(async () => {
          if (typeof onStatus === "function") {
            onStatus(hadSavedAuth ? t("send.sessionValidated") : t("send.loginCompleted"));
          }

          sock.end(undefined);
          resolve({
            authFolder: resolvedAuthFolder,
            reusedSession: hadSavedAuth
          });
        });

        return;
      }

      if (connection === "close" && !finished) {
        const statusCode = lastDisconnect?.error?.output?.statusCode;

        if (statusCode === DisconnectReason.loggedOut) {
          finished = true;
          reject(new Error(t("send.sessionDisconnected")));
          return;
        }

        finished = true;

        if (typeof onStatus === "function") {
          onStatus(
            sawQr ? t("send.connectionClosedAfterQr") : t("send.connectionClosedValidating")
          );
        }

        setTimeout(() => {
          ensureWhatsAppSession({
            authFolder: resolvedAuthFolder,
            onQr,
            onStatus
          }).then(resolve).catch(reject);
        }, 1500);
      }
    });
  });
}

async function sendWasSticker({
  stickerPath,
  targetNumber,
  authFolder = "./auth_info",
  logoutOnSuccess = false,
  onQr,
  onStatus
}) {
  const resolvedStickerPath = path.resolve(stickerPath);
  const resolvedAuthFolder = path.resolve(authFolder);
  const normalizedTarget = String(targetNumber || "").replace(/\D/g, "");

  if (!normalizedTarget) {
    throw new Error(t("send.targetRequired"));
  }

  if (!fs.existsSync(resolvedStickerPath)) {
    throw new Error(t("send.fileNotFound", { path: resolvedStickerPath }));
  }

  const { state, saveCreds } = await useMultiFileAuthState(resolvedAuthFolder);
  const { version } = await fetchLatestBaileysVersion();

  if (typeof onStatus === "function") {
    onStatus(t("send.connectingToSend", { file: path.basename(resolvedStickerPath) }));
  }

  return new Promise((resolve, reject) => {
    const sock = makeWASocket({
      version,
      logger: P({ level: "silent" }),
      auth: state,
      browser: ["Lottie WAS Sender", "Chrome", "1.0.0"]
    });

    let sent = false;
    let finished = false;

    const finish = async (fn) => {
      if (finished) {
        return;
      }

      finished = true;
      try {
        await fn();
      } catch (error) {
        reject(error);
      }
    };

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async ({ connection, lastDisconnect, qr }) => {
      if (connection === "connecting" && typeof onStatus === "function") {
        onStatus(t("send.connectingSession"));
      }

      if (qr) {
        if (typeof onStatus === "function") {
          onStatus(t("send.qrGenerated"));
        }

        if (typeof onQr === "function") {
          onQr(qr);
        } else {
          qrcode.generate(qr, { small: true });
        }
      }

      if (connection === "open" && !sent) {
        sent = true;

        await finish(async () => {
          const jid = `${normalizedTarget}@s.whatsapp.net`;

          if (typeof onStatus === "function") {
            onStatus(t("send.sessionConnected", { number: normalizedTarget }));
          }

          await sock.sendMessage(jid, {
            sticker: fs.readFileSync(resolvedStickerPath),
            mimetype: "application/was"
          });

          if (typeof onStatus === "function") {
            onStatus(t("send.stickerSent", { number: normalizedTarget }));
          }

          if (logoutOnSuccess) {
            await sock.logout();
          } else {
            sock.end(undefined);
          }

          resolve({
            targetNumber: normalizedTarget,
            stickerPath: resolvedStickerPath
          });
        });

        return;
      }

      if (connection === "close" && !finished) {
        const statusCode = lastDisconnect?.error?.output?.statusCode;

        if (sent) {
          return;
        }

        if (statusCode === DisconnectReason.loggedOut) {
          finished = true;
          reject(new Error(t("send.sessionDisconnectedAgain")));
          return;
        }

        finished = true;

        if (typeof onStatus === "function") {
          onStatus(t("send.connectionClosedBeforeSend"));
        }

        setTimeout(() => {
          sendWasSticker({
            stickerPath: resolvedStickerPath,
            targetNumber: normalizedTarget,
            authFolder: resolvedAuthFolder,
            logoutOnSuccess,
            onQr,
            onStatus
          }).then(resolve).catch(reject);
        }, 1500);
      }
    });
  });
}

module.exports = {
  hasSavedAuth,
  ensureWhatsAppSession,
  sendWasSticker
};
