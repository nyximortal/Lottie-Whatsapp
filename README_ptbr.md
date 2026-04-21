# Lottie WhatsApp Sticker Builder

Gera arquivos `.was` a partir de uma imagem e envia no WhatsApp usando templates Lottie com asset embutido em base64.

Documentacao em ingles:

- [README.md](./README.md)
- [TUTORIAL.md](./TUTORIAL.md)

## Requisitos

- Node.js 18+
- download oficial do Node.js: https://nodejs.org/en/download

## Instalacao

```bash
npm install
```

Nao precisa instalar `zip` no sistema. O `.was` e gerado com uma dependencia Node, entao o projeto funciona da mesma forma em Windows, Linux e macOS.

## Tutorial Completo

Para um passo a passo para iniciantes, incluindo instalacao do Node no Windows e Linux, veja [TUTORIAL_ptbr.md](./TUTORIAL_ptbr.md).

## Suporte A Idiomas

O projeto suporta apenas dois idiomas:

- `en`
- `pt-BR`

Comportamento atual:

- a CLI interativa pergunta o idioma ao iniciar
- o ultimo idioma escolhido na CLI fica salvo em `./.lottie-whatsapp.json`
- `build-was.js` e `send-was.js` aceitam `--lang en|pt-BR`
- `build-was.js` e `send-was.js` tambem aceitam `LOTTIE_WHATSAPP_LANG=en` ou `LOTTIE_WHATSAPP_LANG=pt-BR`

## Uso Rapido

```bash
npm run cli
```

No Termux/Android:

```bash
npm run cli:termux
```

A CLI agora:

- pergunta se voce quer ingles ou portugues
- lista imagens detectadas e imagens recentes
- lista arquivos `.was` detectados e recentes
- valida templates cadastrados
- tenta validar ou criar a sessao do WhatsApp antes do envio
- adiciona `.was` automaticamente no nome de saida se faltar
- permite voltar nos menus com `Esc`

Estado local gerado pela CLI:

- sessao do WhatsApp: `./auth_info`
- historico/defaults da CLI: `./.lottie-whatsapp.json`

Ambos estao ignorados no Git e podem ser removidos sem afetar o codigo do projeto.

## Scripts

- `npm run cli`: fluxo guiado para gerar e enviar
- `npm run cli:termux`: fluxo guiado usando `jimp`
- `npm run build:was`: build por argumentos
- `npm run build:was:termux`: build por argumentos usando `jimp`
- `npm run send:was`: envio por argumentos

## Build Por Linha De Comando

Exemplo minimo:

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
  --emojis "😀,🔥" \
  --lang pt-BR
```

Opcoes:

- `--image`: caminho da imagem de entrada
- `--output`: caminho do arquivo `.was`
- `--template`: `id` do template registrado
- `--scale`: escala aplicada dentro do asset do template
- `--pack-name`: nome do pack mostrado no WhatsApp
- `--publisher`: publisher do pack
- `--pack-id`: ID do pack
- `--accessibility-text`: descricao de acessibilidade
- `--emojis`: emojis separados por virgula
- `--base-folder`: sobrescreve a pasta base do template
- `--json`: sobrescreve o caminho do JSON dentro da pasta base
- `--lang`: `en` ou `pt-BR`
- `--no-fit`: desabilita o ajuste automatico da imagem ao tamanho do asset
- `--list-templates`: lista os templates registrados

## Envio Por Linha De Comando

```bash
npm run send:was -- --to 1234567890 --file ./output.was --lang pt-BR
```

Opcoes:

- `--to`: numero de destino em formato internacional
- `--file`: caminho do `.was`
- `--auth-dir`: pasta da sessao do Baileys
- `--lang`: `en` ou `pt-BR`
- `--logout`: encerra a sessao apos o envio

Na primeira execucao, o sender mostra um QR no terminal. Depois disso, reutiliza a sessao salva em `./auth_info`.

## Templates

Os templates disponiveis ficam em [templates/registry.json](./templates/registry.json).

Cada item do registro define:

- `id`: nome usado na CLI e no codigo
- `label`: nome exibido
- `descriptionEn`: descricao em ingles
- `descriptionPtbr`: descricao em portugues do Brasil
- `baseFolder`: pasta base do template
- `jsonRelativePath`: JSON da animacao dentro da pasta base
- `preset`: preset aplicado na layer da imagem

Exemplo:

```json
{
  "id": "expand",
  "label": "Expand",
  "descriptionEn": "Wide entrance with a smooth settle.",
  "descriptionPtbr": "Entrada ampla e assentamento suave.",
  "baseFolder": "./src/exemple",
  "jsonRelativePath": "animation/animation_secondary.json",
  "preset": "expand"
}
```

Para adicionar um template proprio:

1. Crie a pasta base do template.
2. Garanta que o JSON ja tenha um asset `data:image/...` embutido.
3. Adicione a entrada em `templates/registry.json`.
4. Use o `id` novo na CLI ou no codigo.

## Uso Por Codigo

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

Parametros principais de `buildLottieSticker`:

- `imagePath`: caminho da imagem de entrada
- `buffer`: alternativa a `imagePath`
- `mime`: MIME manual quando usar `buffer`
- `output`: caminho do `.was`
- `template`: `id` do template registrado
- `baseFolder`: sobrescreve a pasta base
- `jsonRelativePath`: sobrescreve o JSON do template
- `fitToAsset`: ajusta a imagem ao tamanho do asset
- `imageScale`: escala aplicada apos o ajuste
- `metadata`: sobrescreve metadados opcionais do pack

## Observacoes

- o projeto nao cria animacoes do zero
- o template Lottie precisa ja conter um asset em base64 para substituicao
- o visual final depende do template escolhido

## Creditos

Baseado no repositorio inicial: https://github.com/Pedrozz13755/Lottie-Whatsapp
