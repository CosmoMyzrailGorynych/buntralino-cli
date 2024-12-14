#!/usr/bin/env bun

import yargs from 'yargs';
import {hideBin } from 'yargs/helpers';

import build from './commands/build.ts';
import create from './commands/create.ts';
import run from './commands/run.ts';

yargs(hideBin(process.argv))
.command('create [name]', 'Creates an empty Buntralino project', (yargs) => {
    return yargs.positional('name', {
        type: 'string',
        describe: 'The name for the created project',
        default: 'buntralino-app'
    });
}, async (argv) => {
    const name = argv.name ?? 'buntralino-app';
    await create(name, 'new');
})
.command('add', 'Adds Buntralino to the existing Neutralino.js project', (yargs) => {
    return yargs;
}, async (argv) => {
    // TODO:
})
.command(['run [indexPath]', 'start [indexPath]'], 'Runs the Buntralino project.', (yargs) => {
    return yargs.positional('indexPath', {
        type: 'string',
        describe: 'Path to the main Bun file',
        default: 'index.ts'
    });
}, async (argv) => {
    await run(argv.indexPath);
})
.command('build [indexPath]', 'Builds the project for distribution', (yargs) => {
    return yargs.positional('indexPath', {
        type: 'string',
        describe: 'Path to the main Bun file',
        default: 'index.ts'
    }).epilog(
        'Use -- to add additional flags to Bun builder. Example: `buntralino build -- --external original-fs`' + '\n' +
        'Buntralino already passes `--compile`, `--target`, `--outfile` and minification flags.'
    );
}, async argv => {
    await build(argv.indexPath, argv._);
})
.demandCommand(1)
.recommendCommands()
.scriptName('buntralino')
.help()
.parse();


process.on('SIGINT', () => {
    console.log(':c');
    process.exit();
});

export {
    build,
    create,
    run
};
