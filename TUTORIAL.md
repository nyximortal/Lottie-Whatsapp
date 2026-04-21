# Tutorial

Guia para quem nunca usou Node.js, terminal ou este projeto antes.

## Antes de começar

Voce precisa instalar o Node.js 18 ou superior:

- download oficial: https://nodejs.org/en/download

Depois de instalar, feche e abra o terminal de novo.

Para conferir se deu certo, rode:

```bash
node -v
npm -v
```

Se os dois comandos mostrarem uma versao, o Node foi instalado corretamente.

## 1. Baixar o projeto

Se voce ja baixou o projeto em `.zip`, extraia a pasta e abra essa pasta no terminal.

Se voce usa Git, pode clonar com:

```bash
git clone https://github.com/nyximortal/Lottie-Whatsapp.git
cd Lottie-Whatsapp
```

## 2. Instalar as dependencias

Dentro da pasta do projeto, rode:

```bash
npm install
```

Isso baixa tudo que o projeto precisa.

## 3. Rodar a interface guiada

O jeito mais simples para iniciantes e usar a CLI interativa:

```bash
npm run cli
```

Ela permite:

- escolher uma imagem
- gerar o arquivo `.was`
- selecionar um template
- enviar o sticker no WhatsApp

## 4. O que voce precisa ter em maos

Antes de usar, separe:

- uma imagem em `.png`, `.jpg`, `.jpeg` ou `.webp`
- o numero de telefone que vai receber o sticker
- o WhatsApp no celular para escanear o QR code

## 5. Primeiro envio no WhatsApp

Na primeira vez que voce enviar um sticker:

1. o terminal vai mostrar um QR code
2. abra o WhatsApp no celular
3. entre em `Aparelhos conectados`
4. toque em `Conectar um aparelho`
5. escaneie o QR code do terminal

Depois disso, a sessao fica salva na pasta `./auth_info`.

## Windows

### Instalar o Node

1. Abra o site oficial: https://nodejs.org/en/download
2. Baixe a versao LTS para Windows.
3. Execute o instalador.
4. Avance com as opcoes padrao.
5. Abra o `PowerShell` ou `Prompt de Comando`.

Teste:

```powershell
node -v
npm -v
```

### Abrir a pasta do projeto

Se a pasta estiver em `Downloads`, por exemplo:

```powershell
cd $HOME\Downloads\Lottie-Whatsapp
```

Se preferir:

1. abra a pasta no Explorador
2. clique na barra de endereco
3. digite `powershell`
4. pressione `Enter`

### Instalar e rodar

```powershell
npm install
npm run cli
```

## Linux

### Instalar o Node

Use o site oficial se quiser o jeito mais simples:

- https://nodejs.org/en/download

Em muitas distros, instalar pelo gerenciador de pacotes tambem funciona, mas a versao pode vir antiga. Se acontecer, prefira o instalador oficial.

Depois confirme:

```bash
node -v
npm -v
```

### Abrir a pasta do projeto

Exemplo:

```bash
cd ~/Downloads/Lottie-Whatsapp
```

### Instalar e rodar

```bash
npm install
npm run cli
```

## Fluxo mais simples para usar

1. coloque sua imagem dentro da pasta do projeto
2. rode `npm run cli`
3. escolha `Gerar e enviar`
4. selecione a imagem
5. escolha o template
6. defina o nome do arquivo de saida
7. informe o numero de destino
8. escaneie o QR code se for a primeira vez

## Enviar por linha de comando

Se voce nao quiser usar a interface guiada:

### Gerar o arquivo `.was`

```bash
npm run build:was -- --image ./sua-imagem.png --output ./meu-sticker.was --template expand
```

### Enviar para o WhatsApp

```bash
npm run send:was -- --to 5511999999999 --file ./meu-sticker.was
```

## Dicas importantes

- o numero deve estar no formato internacional
- se voce informar sem `55`, a CLI tenta completar automaticamente
- o projeto nao precisa de `zip` instalado no sistema
- o arquivo de sessao do WhatsApp fica em `./auth_info`
- o historico da CLI fica em `./.lottie-whatsapp.json`

## Problemas comuns

### `node` nao e reconhecido

O Node nao foi instalado corretamente, ou o terminal estava aberto antes da instalacao.

Feche o terminal, abra de novo e teste:

```bash
node -v
npm -v
```

Se ainda falhar, reinstale usando o site oficial:

- https://nodejs.org/en/download

### `npm install` falhou

Confira primeiro se o Node e o npm estao instalados:

```bash
node -v
npm -v
```

Se isso funcionar, tente rodar de novo dentro da pasta do projeto:

```bash
npm install
```

### O QR code nao apareceu

Feche o processo com `Ctrl + C` e rode novamente:

```bash
npm run cli
```

### O sticker nao foi enviado

Confira:

- se o numero esta correto
- se o QR foi escaneado
- se o arquivo `.was` foi gerado
- se o WhatsApp Web do aparelho ainda esta conectado
- a figurinha as vezes não aparece no celular, voce tem que abrir o whatsapp web e favoritar ela

## Arquivos criados pelo projeto

- `./auth_info`: guarda a sessao do WhatsApp
- `./.lottie-whatsapp.json`: guarda historico e valores recentes da CLI
- `./output.was` ou outro nome escolhido: sticker gerado
