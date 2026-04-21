const path = require("path");
const qrcode = require("qrcode-terminal");
const { sendWasSticker } = require("./src/send");

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

function getConfig() {
  const args = parseArgs(process.argv.slice(2));
  const stickerPath = path.resolve(args.file || process.env.STICKER_PATH || "./output.was");
  const targetNumber = args.to || process.env.WHATSAPP_TARGET || "";
  const authFolder = path.resolve(args["auth-dir"] || process.env.BAILEYS_AUTH_DIR || "./auth_info");

  if (!targetNumber) {
    printUsage();
    throw new Error("Informe o numero de destino com --to ou WHATSAPP_TARGET.");
  }

  return {
    stickerPath,
    targetNumber,
    authFolder,
    logoutOnSuccess: Boolean(args.logout)
  };
}

sendWasSticker({
  ...getConfig(),
  onStatus: message => console.log(message),
  onQr: qr => qrcode.generate(qr, { small: true })
}).catch(err => {
  console.error(err.stack || err.message);
  process.exit(1);
});
