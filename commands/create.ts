import {$} from 'execa';
import fs from 'fs-extra';
import path from 'path';
import task from '../common/task';

export default async (name = 'buntralino-app', template = 'new') => {
    const destPath = path.join(process.cwd(), name);
    if (await fs.exists(destPath)) {
        throw new Error(`The folder ${name} already exists.`);
    }
    await task({
        text: 'Copying the template',
        finish: 'Template copied successfully'
    },
        fs.copy(path.join(import.meta.dir, '../templates', template), destPath)
    );

    const $$ = $({
        cwd: destPath
    });
    await Promise.all([
        task({
            text: 'Installing dependencies',
            finish: 'Dependencies installed successfully'
         }, (async () => {
            await $$`bun install`;
            await $$`bun add buntralino buntralino-client`
            await $$`bun add -d buntralino-cli`;
        })()),

        task({
            text: 'Installing Neutralino.js',
            finish: 'Neutralino.js installed successfully'
        }, $$`neu update`),
    ]);

    if (name !== 'buntralino-app') {
        await task({
            text: 'Prefilling project\'s name…',
            finish: 'Project\'s name set successfully'
        }, Promise.all([
            fs.readJson(path.join(destPath, 'package.json'))
            .then(packageJson => {
                packageJson.name = name;
                return fs.writeJson(path.join(destPath, 'package.json'), packageJson);
            }),
            fs.readJson(path.join(destPath, 'neutralino.config.json'))
            .then(neutralinoConfig => {
                neutralinoConfig.applicationName = name;
                neutralinoConfig.modes.window.title = name;
                neutralinoConfig.cli.binaryName = name;
                return fs.writeJson(path.join(destPath, 'neutralino.config.json'), neutralinoConfig);
            })
        ]));
    }
    console.log(`\n🐇 Created a new Buntralino project at ${destPath}`);

    console.log('\nTo get started, run:\n');
    console.log(`    cd ${name}`);
    console.log('    bun run dev\n');
};