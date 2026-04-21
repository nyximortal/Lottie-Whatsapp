# Lottie WhatsApp Sticker Builder

Gera arquivos `.was` a partir de uma imagem e de um template Lottie com asset embutido em base64.

## Requisitos

- Node.js 18+
- `zip` instalado no sistema

## Instalação

```bash
npm install
```

Se `zip` não estiver instalado:

```bash
apt install zip
```

## Estrutura padrão

O projeto já inclui um template em `src/exemple/animation/animation_secondary.json`.

O builder:

- copia a pasta base do template
- substitui a imagem embutida no JSON
- ajusta a imagem para o tamanho do asset quando necessário
- compacta o resultado e salva como `.was`

## Gerar um `.was`

Comando mínimo:

```bash
npm run build:was -- --image ./img.png
```

Saída padrão:

```text
./output.was
```

Exemplo com nome de saída e escala:

```bash
npm run build:was -- \
  --image ./img.png \
  --output ./meu-sticker.was \
  --scale 1.2
```

Opções:

- `--image`: caminho da imagem de entrada
- `--output`: caminho do arquivo `.was`
- `--scale`: escala aplicada dentro do asset do template
- `--base-folder`: pasta base do template Lottie
- `--json`: caminho do JSON dentro da pasta base
- `--no-fit`: desabilita o ajuste automático da imagem ao tamanho do asset

## Enviar no WhatsApp

Para enviar o `.was`, use o script com Baileys:

```bash
npm run send:was -- --to 5511999999999 --file ./output.was
```

Na primeira execução, o script mostra um QR no terminal. Depois do pareamento, ele reutiliza a sessão salva em `./auth_info`.

Opções:

- `--to`: número de destino em formato internacional
- `--file`: caminho do `.was`
- `--auth-dir`: pasta da sessão do Baileys
- `--logout`: encerra a sessão após o envio

## Uso por código

```js
const path = require("path");
const { buildLottieSticker } = require("./src/index");

async function main() {
  const output = await buildLottieSticker({
    baseFolder: path.resolve(__dirname, "src", "exemple"),
    imagePath: path.resolve(__dirname, "img.png"),
    output: path.resolve(__dirname, "sticker.was"),
    imageScale: 1.2
  });

  console.log(output);
}

main();
```

Parâmetros de `buildLottieSticker`:

- `baseFolder`: pasta base do template
- `imagePath`: caminho da imagem de entrada
- `buffer`: alternativa a `imagePath`
- `mime`: MIME manual quando usar `buffer`
- `output`: caminho do `.was`
- `jsonRelativePath`: JSON do template dentro da pasta base
- `fitToAsset`: ajusta a imagem ao tamanho do asset
- `imageScale`: escala aplicada após o ajuste

## Observações

- O projeto não cria animações do zero.
- O template Lottie precisa já conter um asset em base64 para substituição.
- O visual final depende do template escolhido.

## Créditos

Baseado no repositório inicial: https://github.com/Pedrozz13755/Lottie-Whatsapp

Vou atualizando esse repositório conforme descubro mais sobre os formatos, templates e limitações >:D
