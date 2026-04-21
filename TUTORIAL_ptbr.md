# Tutorial

Guia para quem nunca usou Node.js, terminal ou este projeto antes.

Versao em ingles: [TUTORIAL.md](./TUTORIAL.md)

## Antes De Comecar

Voce precisa instalar o Node.js 18 ou superior:

- download oficial: https://nodejs.org/en/download

Depois de instalar, feche e abra o terminal de novo.

Para conferir se deu certo, rode:

```bash
node -v
npm -v
```

Se os dois comandos mostrarem uma versao, o Node foi instalado corretamente.

## 1. Baixar O Projeto

Se voce ja baixou o projeto em `.zip`, extraia a pasta e abra essa pasta no terminal.

Se voce usa Git, pode clonar com:

```bash
git clone https://github.com/nyximortal/Lottie-Whatsapp.git
cd Lottie-Whatsapp
```

## 2. Instalar As Dependencias

Dentro da pasta do projeto, rode:

```bash
npm install
```

Isso baixa tudo que o projeto precisa.

## 3. Rodar A Interface Guiada

O jeito mais simples para iniciantes e usar a CLI interativa:

```bash
npm run cli
```

Ao iniciar, ela pergunta se voce quer:

- ingles
- portugues do Brasil

Depois disso, ela permite:

- escolher uma imagem
- gerar o arquivo `.was`
- selecionar um template
- enviar o sticker no WhatsApp

## 4. O Que Voce Precisa Ter Em Maos

Antes de usar, separe:

- uma imagem em `.png`, `.jpg`, `.jpeg` ou `.webp`
- o numero de telefone que vai receber o sticker
- o WhatsApp no celular para escanear o QR code

## 5. Primeiro Login No WhatsApp

Na primeira vez que voce enviar um sticker:

1. o terminal vai mostrar um QR code
2. abra o WhatsApp no celular
3. entre em `Aparelhos conectados`
4. toque em `Conectar um aparelho`
5. escaneie o QR code do terminal

Depois disso, a sessao fica salva na pasta `./auth_info`.

## Windows

### Instalar O Node

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

### Abrir A Pasta Do Projeto

Se a pasta estiver em `Downloads`, por exemplo:

```powershell
cd $HOME\Downloads\Lottie-Whatsapp
```

Se preferir:

1. abra a pasta no Explorador
2. clique na barra de endereco
3. digite `powershell`
4. pressione `Enter`

### Instalar E Rodar

```powershell
npm install
npm run cli
```

## Linux

### Instalar O Node

Use o site oficial se quiser o jeito mais simples:

- https://nodejs.org/en/download

Em muitas distros, instalar pelo gerenciador de pacotes tambem funciona, mas a versao pode vir antiga. Se acontecer, prefira o instalador oficial.

Depois confirme:

```bash
node -v
npm -v
```

### Abrir A Pasta Do Projeto

Exemplo:

```bash
cd ~/Downloads/Lottie-Whatsapp
```

### Instalar E Rodar

```bash
npm install
npm run cli
```

## Fluxo Mais Simples Para Usar

1. coloque sua imagem dentro da pasta do projeto
2. rode `npm run cli`
3. escolha o idioma da CLI
4. escolha `Gerar e enviar`
5. selecione a imagem
6. escolha o template
7. defina o nome do arquivo de saida
8. informe o numero de destino
9. escaneie o QR code se for a primeira vez

## Enviar Por Linha De Comando

Se voce nao quiser usar a interface guiada:

### Gerar O Arquivo `.was`

```bash
npm run build:was -- --image ./sua-imagem.png --output ./meu-sticker.was --template expand --lang pt-BR
```

### Enviar Para O WhatsApp

```bash
npm run send:was -- --to 1234567890 --file ./meu-sticker.was --lang pt-BR
```

## Dicas Importantes

- o numero deve estar no formato internacional
- o projeto nao precisa de `zip` instalado no sistema
- o arquivo de sessao do WhatsApp fica em `./auth_info`
- o historico da CLI e as preferencias salvas ficam em `./.lottie-whatsapp.json`

## Problemas Comuns

### `node` Nao E Reconhecido

O Node nao foi instalado corretamente, ou o terminal estava aberto antes da instalacao.

Feche o terminal, abra de novo e teste:

```bash
node -v
npm -v
```

Se ainda falhar, reinstale usando o site oficial:

- https://nodejs.org/en/download

### `npm install` Falhou

Confira primeiro se o Node e o npm estao instalados:

```bash
node -v
npm -v
```

Se isso funcionar, tente rodar de novo dentro da pasta do projeto:

```bash
npm install
```

### O QR Code Nao Apareceu

Feche o processo com `Ctrl + C` e rode novamente:

```bash
npm run cli
```

Depois confira:

- se o terminal mostrou algum erro
- se a conexao de rede esta estavel
- se uma sessao anterior precisa ser renovada

### O Sticker Nao Foi Enviado

Confira:

- se o numero de destino esta correto
- se o arquivo `.was` existe
- se o QR code foi escaneado
- se o WhatsApp continua conectado
