#!/usr/bin/env bun

import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {select, question} from '@topcli/prompts';

import build from './commands/build.ts';
import create from './commands/create.ts';
import run from './commands/run.ts';
import add from './commands/add.ts';

const templates = [{
    name: 'new',
    description: 'The default minimal Buntralino template with ESBuild for bundling scripts for the Neutralino app.'
}, {
    name: 'vite',
    description: 'A Buntralino template with Vite as frontend builder and task runner. Can be expanded for any UI framework.'
}];

yargs(hideBin(process.argv))
.command('create [name] [templateName]', 'Creates an empty Buntralino project', (yargs) => {
    return yargs
    .positional('name', {
        type: 'string',
        describe: 'The name for the created project'
    })
    .positional('templateName', {
        type: 'string',
        describe: 'The name of the template to clone.',
        choices: templates.map(t => t.name)
    })
    .epilog(`Templates' descriptions:\n\n${templates.map(t => `${t.name}\n    ${t.description}`).join('\n')}`);
}, async (argv) => {
    let name, templateName;
    if (argv.name) {
        name = argv.name;
    } else {
        name = await question('Enter your project\'s name:', {
            defaultValue: 'buntralino-app'
        });
        name ??= 'buntralino-app';
    }
    if (argv.templateName && templates.find(t => t.name === argv.templateName)) {
        templateName = argv.templateName;
    } else {
        templateName = await select('Choose a template:', {
            choices: templates.map(t => ({
                label: t.name,
                value: t.name,
                description: t.description
            }))
        });
    }
    await create(name, templateName);
})
.command('add', 'Adds Buntralino to the existing Neutralino.js project', (yargs) => {
    return yargs;
}, async () => {
    await add();
})
.command(['run [indexPath]', 'start'], 'Runs the Buntralino project.', (yargs) => {
    return yargs.positional('indexPath', {
        type: 'string',
        describe: 'Path to the main Bun file',
        default: 'index.ts'
    }).epilog(
        'Use -- to provide additional arguments to the main script. Example: `buntralino run index.ts -- --devMode`'
    );
}, async (argv) => {
    await run(argv.indexPath, argv._.slice(1).map(e => e.toString()));
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
    await build(argv.indexPath, argv._.slice(1));
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
