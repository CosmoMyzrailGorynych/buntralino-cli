![Buntralino logo](https://buntralino.github.io/Buntralino.png)

# Buntralino CLI tools

Buntralino unites Bun and Neutralino.js to make a simpler, lighter alternative to Electron and NW.js. Use Neutralino.js API at client and send harder tasks to Bun while keeping your development process easy.

Buntralino is a hybrid app development framework that lets you use web technologies (HTML, CSS, JavaScript, TypeScript) to make desktop apps. Buntralino applications work by creating a Bun application that launches and manages Neutralino.js windows. Neutralino.js windows can exchange information with Bun and each other in a client-server model through websockets, with you using a nice promise-based API. Bun is a faster alternative to Node.js or Deno, while Neutralino.js uses native OS' browser and augments it with native functions.

[See the documentation for Buntralino here.](https://buntralino.github.io/)

## Installation

```sh
bun install --global buntralino-cli
```

## Usage

```sh
buntralino <command>

Commands:
  buntralino create [name]      Creates an empty Buntralino project
  buntralino add                Adds Buntralino to the existing Neutralino.js pr
                                oject
  buntralino run [indexPath]    Runs the Buntralino project.    [aliases: start]
  buntralino build [indexPath]  Builds the project for distribution

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]
```

## Development

```sh
git clone https://github.com/buntralino/buntralino-cli.git
cd ./buntralino-cli
bun install
# And you're ready to code!
```