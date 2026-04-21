# Lottie WhatsApp Sticker Builder

Gera arquivos `.was` a partir de uma imagem e envia no WhatsApp usando templates Lottie com asset embutido em base64.

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

## Resumo Das Mudanças

- adição de uma CLI interativa para gerar e enviar stickers sem depender só de argumentos
- introdução de registro de templates em `templates/registry.json`, com validação e seleção por `id`
- expansão do builder para suportar presets de template e metadados do pack
- extração da lógica de envio/autenticação para `src/send.js`, com reconexão e mensagens de status mais claras
- persistência de histórico/defaults da CLI em `.lottie-whatsapp.json`
- remoção dos arquivos locais de exemplo da raiz, deixando o repositório mais limpo

## Uso Rápido

```bash
npm run cli
```

A CLI agora:

- lista imagens detectadas e imagens recentes
- lista arquivos `.was` detectados e recentes
- valida templates cadastrados
- tenta autenticar a sessão antes do envio
- adiciona `55` automaticamente no número se faltar
- adiciona `.was` automaticamente no nome de saída se faltar
- permite voltar nos menus com `Esc`

Estado local gerado pela CLI:

- sessão do WhatsApp: `./auth_info`
- histórico/defaults: `./.lottie-whatsapp.json`

Ambos estão ignorados no Git e podem ser removidos sem afetar o código do projeto.

## Scripts

- `npm run cli`: fluxo guiado para gerar e enviar
- `npm run build:was`: build por argumentos
- `npm run send:was`: envio por argumentos

## Build Por Linha De Comando

Exemplo mínimo:

```bash
npm run build:was -- --image ./sua-imagem.png
```

Exemplo completo:

```bash
npm run build:was -- \
  --image ./sua-imagem.png \
  --output ./meu-sticker.was \
  --template expand \
  --scale 1.2 \
  --pack-name "Meu Pack" \
  --publisher "Meu Nome" \
  --emojis "😀,🔥"
```

Opções:

- `--image`: caminho da imagem de entrada
- `--output`: caminho do arquivo `.was`
- `--template`: `id` do template registrado
- `--scale`: escala aplicada dentro do asset do template
- `--pack-name`: nome do pack mostrado no WhatsApp
- `--publisher`: publisher do pack
- `--pack-id`: ID do pack
- `--accessibility-text`: descrição de acessibilidade
- `--emojis`: emojis separados por vírgula
- `--base-folder`: sobrescreve a pasta base do template
- `--json`: sobrescreve o caminho do JSON dentro da pasta base
- `--no-fit`: desabilita o ajuste automático da imagem ao tamanho do asset
- `--list-templates`: lista os templates registrados

## Envio Por Linha De Comando

```bash
npm run send:was -- --to 5511999999999 --file ./output.was
```

Opções:

- `--to`: número de destino em formato internacional
- `--file`: caminho do `.was`
- `--auth-dir`: pasta da sessão do Baileys
- `--logout`: encerra a sessão após o envio

Na primeira execução, o sender mostra um QR no terminal. Depois disso, reutiliza a sessão salva em `./auth_info`.

## Templates

Os templates disponíveis ficam em `templates/registry.json`.

Cada item do registro define:

- `id`: nome usado na CLI e no código
- `label`: nome descritivo do template
- `description`: descrição curta
- `baseFolder`: pasta base do template
- `jsonRelativePath`: JSON da animação dentro da pasta base
- `preset`: preset aplicado na layer da imagem

Exemplo:

```json
{
  "id": "expand",
  "label": "Expand",
  "description": "Entrada ampla e assentamento suave.",
  "baseFolder": "./src/exemple",
  "jsonRelativePath": "animation/animation_secondary.json",
  "preset": "expand"
}
```

Para adicionar um template próprio:

1. Crie a pasta base do template.
2. Garanta que o JSON tenha um asset `data:image/...` embutido.
3. Adicione a entrada em `templates/registry.json`.
4. Use o `id` novo na CLI ou no código.

## Uso Por Código

```js
const path = require("path");
const { buildLottieSticker } = require("./src/index");

async function main() {
  const output = await buildLottieSticker({
    imagePath: path.resolve("/caminho/para/sua-imagem.png"),
    output: path.resolve("/caminho/para/sticker.was"),
    template: "expand",
    imageScale: 1.2,
    metadata: {
      packName: "Meu Pack",
      publisher: "Meu Nome"
    }
  });

  console.log(output);
}

main();
```

Parâmetros principais de `buildLottieSticker`:

- `imagePath`: caminho da imagem de entrada
- `buffer`: alternativa a `imagePath`
- `mime`: MIME manual quando usar `buffer`
- `output`: caminho do `.was`
- `template`: `id` do template registrado
- `baseFolder`: sobrescreve a pasta base
- `jsonRelativePath`: sobrescreve o JSON do template
- `fitToAsset`: ajusta a imagem ao tamanho do asset
- `imageScale`: escala aplicada após o ajuste
- `metadata`: sobrescreve metadados opcionais do pack

## Observações

- o projeto não cria animações do zero
- o template Lottie precisa já conter um asset em base64 para substituição
- o visual final depende do template escolhido

## Créditos

Baseado no repositório inicial: https://github.com/Pedrozz13755/Lottie-Whatsapp
