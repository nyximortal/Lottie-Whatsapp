# Tutorial

Guide for people who have never used Node.js, the terminal, or this project before.

Portuguese version: [TUTORIAL_ptbr.md](./TUTORIAL_ptbr.md)

## Before You Start

You need Node.js 18 or newer:

- Official download: https://nodejs.org/en/download

After installing it, close the terminal and open it again.

To confirm the installation:

```bash
node -v
npm -v
```

If both commands print a version, Node was installed correctly.

## 1. Download The Project

If you already downloaded the project as a `.zip`, extract it and open that folder in the terminal.

If you use Git, you can clone it with:

```bash
git clone https://github.com/nyximortal/Lottie-Whatsapp.git
cd Lottie-Whatsapp
```

## 2. Install Dependencies

Inside the project folder, run:

```bash
npm install
```

That installs everything the project needs.

## 3. Run The Guided Interface

The simplest option for beginners is the interactive CLI:

```bash
npm run cli
```

At startup it asks whether you want:

- English
- Portuguese (Brazil)

Then it lets you:

- choose an image
- build the `.was` file
- choose a template
- send the sticker to WhatsApp

## 4. What You Need Ready

Before using it, have these ready:

- an image in `.png`, `.jpg`, `.jpeg`, or `.webp`
- the phone number that will receive the sticker
- WhatsApp on your phone to scan the QR code

## 5. First WhatsApp Login

The first time you send a sticker:

1. the terminal shows a QR code
2. open WhatsApp on your phone
3. go to `Linked devices`
4. tap `Link a device`
5. scan the QR code shown in the terminal

After that, the session is saved in `./auth_info`.

## Windows

### Install Node

1. Open the official site: https://nodejs.org/en/download
2. Download the LTS version for Windows.
3. Run the installer.
4. Continue with the default options.
5. Open `PowerShell` or `Command Prompt`.

Test it:

```powershell
node -v
npm -v
```

### Open The Project Folder

If the folder is in `Downloads`, for example:

```powershell
cd $HOME\Downloads\Lottie-Whatsapp
```

Or:

1. open the folder in File Explorer
2. click the address bar
3. type `powershell`
4. press `Enter`

### Install And Run

```powershell
npm install
npm run cli
```

## Linux

### Install Node

Use the official website if you want the simplest route:

- https://nodejs.org/en/download

On many distros, the package manager also works, but the version may be too old. If that happens, use the official installer instead.

Then confirm:

```bash
node -v
npm -v
```

### Open The Project Folder

Example:

```bash
cd ~/Downloads/Lottie-Whatsapp
```

### Install And Run

```bash
npm install
npm run cli
```

## Simplest Flow

1. put your image inside the project folder
2. run `npm run cli`
3. choose the CLI language
4. choose `Build and send`
5. select the image
6. choose the template
7. define the output file name
8. enter the destination number
9. scan the QR code if this is your first time

## Send From The Command Line

If you do not want the guided interface:

### Build The `.was` File

```bash
npm run build:was -- --image ./your-image.png --output ./my-sticker.was --template expand --lang en
```

### Send To WhatsApp

```bash
npm run send:was -- --to 5511999999999 --file ./my-sticker.was --lang en
```

## Important Tips

- the number must be in international format
- if you omit `55`, the CLI tries to add it automatically
- the project does not require `zip` installed on the system
- the WhatsApp session file stays in `./auth_info`
- CLI history and saved preferences stay in `./.lottie-whatsapp.json`

## Common Problems

### `node` Is Not Recognized

Node was not installed correctly, or the terminal was already open before installation.

Close the terminal, open it again, and run:

```bash
node -v
npm -v
```

If it still fails, reinstall from the official website:

- https://nodejs.org/en/download

### `npm install` Failed

First confirm that Node and npm are installed:

```bash
node -v
npm -v
```

If that works, run the command again inside the project folder:

```bash
npm install
```

### The QR Code Did Not Appear

Stop the process with `Ctrl + C` and run it again:

```bash
npm run cli
```

Then check:

- whether the terminal showed any error
- whether the network connection is stable
- whether a previous session needs to be refreshed

### The Sticker Was Not Sent

Check:

- whether the target number is correct
- whether the `.was` file exists
- whether the QR code was scanned
- whether WhatsApp is still connected
