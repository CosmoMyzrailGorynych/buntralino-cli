import fs from 'fs-extra';
import path from 'path';
import {$} from 'bun';
import task from '../common/task';
import {question} from '@topcli/prompts';

export default async () => {
    // Check for neutralino.config.json first
    if (!await fs.exists('neutralino.config.json')) {
        throw new Error('No neutralino.config.json found. Please run this command in a Neutralino.js project root.');
    }

    // Copy template files
    let indexPath = 'index.ts';
    while (await fs.exists(indexPath)) {
        console.log(`The file "${indexPath}" already exists. Please choose a different name.`);
        indexPath = await question('Enter the name for your main Bun file:');
    }

    // Check/create package.json
    await task({
        text: 'Creating/augmenting package.json',
        finish: 'Package.json set successfully'
    }, (async () => {
        let packageJson: any = {};
        if (await fs.exists(path.join(process.cwd(), 'package.json'))) {
            packageJson = await fs.readJson(path.join(process.cwd(), 'package.json'));
            if (!packageJson.scripts) {
                packageJson.scripts = {};
            }
            if (!packageJson.scripts.run) {
                packageJson.scripts.run = "bun buildScripts.ts dev";
            }
            if (!packageJson.scripts.build) {
                packageJson.scripts.build = "bun buildScripts.ts build";
            }
            if (!packageJson.scripts.dev) {
                packageJson.scripts.dev = "bun buildScripts.ts dev";
            }
            if (!packageJson.scripts.preinstall) {
                packageJson.scripts.preinstall = "npx only-allow bun";
            }
        } else {
            packageJson = {
                name: path.basename(process.cwd()),
                version: "1.0.0",
                type: "module",
                scripts: {
                    "preinstall": "npx only-allow bun",
                    "run": "bun buildScripts.ts dev",
                    "dev": "bun buildScripts.ts dev",
                    "build": "bun buildScripts.ts build"
                }
            };
            await fs.writeJson('package.json', packageJson, {spaces: 2});
        }
    })());

    // Install dependencies
    await task({
        text: 'Installing Buntralino packages',
        finish: 'Buntralino packages installed successfully'
    }, (async () => {
        await $`bun add buntralino buntralino-client`.quiet();
        await $`bun add -d buntralino-cli @types/bun`.quiet();
    })());

    await task({
        text: 'Creating Buntralino entry point and build scripts',
        finish: 'Entry point and build scripts created successfully'
    }, Promise.all([
        fs.copy(
            path.join(import.meta.dir, '../templates/add/index.ts'),
            indexPath
        ),
        fs.outputFile(
            path.join(process.cwd(), 'buildScripts.ts'),
            await fs.readFile(path.join(import.meta.dir, '../templates/add/buildScripts.ts'), {
                encoding: 'utf8'
            })
            .then(text => text.replace('index.ts', indexPath))
        )
    ]));

    if (!fs.exists(path.join(process.cwd(), '.gitignore'))) {
        await task({
            text: 'Creating .gitignore',
            finish: '.gitignore created successfully'
        }, fs.copy(
            path.join(import.meta.dir, '../templates/add/.gitignore'),
            path.join(process.cwd(), '.gitignore')
        ));
    }

    console.log('\n🐇 Added Buntralino to the project! To get started, run:\n');
    console.log('    bun run dev');
    console.log(
        '\n☝️ Don\'t forget to include `buntralino-client` library into your code,' +
        ' or the connection to Buntralino won\'t work!' +
        ' A simple `import \'buntralino-client\';` will be enough.');
};
