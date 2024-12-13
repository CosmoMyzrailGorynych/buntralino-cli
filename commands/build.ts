interface NeutralinoConfig {
    version: string;
    applicationId?: string;
    applicationName?: string;
    applicationIcon?: string;
    author?: string;
    description?: string;
    copyright?: string;
    modes?: {
        window?: {
            title?: string;
            icon?: string,
        }
    },
    cli: {
        binaryName: string
    }
}

import resedit from 'resedit-cli';
import path from 'path';
import fs from 'fs-extra';
import {$} from 'execa';
import {HERMITE, createICO} from '@ctjs/png2icons';

const platforms = [{
    os: 'linux',
    name: 'Linux arm64',
    neutralinoPostfix: 'linux_arm64',
    bunTarget: 'bun-linux-arm64'
}, {
    os: 'linux',
    name: 'Linux x64',
    neutralinoPostfix: 'linux_x64',
    bunTarget: 'bun-linux-x64'
}, {
    os: 'macos',
    name: 'MacOS arm64',
    neutralinoPostfix: 'mac_arm64',
    bunTarget: 'bun-darwin-arm64'
}, {
    os: 'macos',
    name: 'MacOS x64',
    neutralinoPostfix: 'mac_x64',
    bunTarget: 'bun-darwin-x64'
}, {
    os: 'windows',
    name: 'Windows x64',
    neutralinoPostfix: 'win_x64.exe',
    bunTarget: 'bun-windows-x64'
}];

const patchWinExecutable = async (exePath: string, neutralinoConfig: NeutralinoConfig) => {
    exePath = path.resolve(process.cwd(), exePath);
    let iconPath = path.resolve('./buntralino.png');
    if (neutralinoConfig.applicationIcon) {
        iconPath = path.resolve(process.cwd(), neutralinoConfig.applicationIcon);
    } else if (neutralinoConfig.modes?.window?.icon) {
        iconPath = path.resolve(process.cwd(), neutralinoConfig.modes.window.icon);
    }
    const ico = createICO(await fs.readFile(iconPath), HERMITE, 0, true, true)!;
    const tempFolder = await fs.mkdtemp('buntralino-temp-');
    iconPath = path.join(tempFolder, 'buntralino.ico');
    await fs.writeFile(iconPath, ico as unknown as DataView);
    const exePatch = {
        icon: [`IDR_MAINFRAME,${iconPath}`],
        'product-name': neutralinoConfig.applicationName ?? neutralinoConfig.cli?.binaryName ?? 'A Buntralino application',
        'product-version': neutralinoConfig.version.split('-')[0] + '.0',
        'file-description': neutralinoConfig.description ?? neutralinoConfig.applicationName ?? 'A Buntralino application',
        'file-version': neutralinoConfig.version.split('-')[0] + '.0',
        'original-filename': neutralinoConfig.cli?.binaryName + '.exe'
    };
    await resedit({
        in: exePath,
        out: exePath,
        ...exePatch
    });
    await fs.remove(tempFolder);
};

export default async (
    index: string = 'index.ts',
    buildArgs: (string | number)[] = [],
    projectRoot = process.cwd()
) => {
    let neutralinoConfig: NeutralinoConfig;
    try {
        neutralinoConfig = await fs.readJSON(path.resolve(process.cwd(), 'neutralino.config.json'));
    }
    catch (error) {
        console.error('neutralino.config.json not found. Make sure to run `buntralino build` in the root of your Buntralino project.');
        process.exit(1);
    }
    if (['bun', 'buntralinoOutput', 'neutralino'].includes(neutralinoConfig.cli.binaryName)) {
        throw new Error('Sorry, please pick an app name different from `bun`, `buntralinoOutput`, and `neutralino` in your neutralino.config.json :D');
    }

    const appName = neutralinoConfig.cli.binaryName;
    await $`neu build`;

    await Promise.all(platforms.map(async (pf) => {
        await fs.ensureDir('./build/bun');
        const neutralinoExePath = path.join(projectRoot, `./build/${appName}/${appName}-${pf.neutralinoPostfix}`);
        const bunExePath = path.join(projectRoot, `./build/bun/${appName}-${pf.neutralinoPostfix}`);
        const platformPostfix = pf.os === 'windows' ? '.exe' : '';
        let $$ = $;
        if (path.dirname(index) !== projectRoot) {
            $$ = $({
                cwd: path.dirname(path.resolve(projectRoot, path.dirname(index)))
            });
        }
        // Packaged bun applications for Windows silently crash if minified normally,
        // use weaker minification flags for now for Windows.
        await $$`bun build ${path.basename(index)} --compile --target=${pf.bunTarget} ${pf.os === 'windows' ? '' : '--minify --sourcemap'}  --outfile ${bunExePath} ${buildArgs}`;
        await Promise.all([
            fs.copy(neutralinoExePath, path.join(projectRoot, 'buntralinoOutput', pf.name, 'neutralino' + platformPostfix)),
            fs.copy(bunExePath, path.join(projectRoot, 'buntralinoOutput', pf.name, appName + platformPostfix))
        ]);
    }));

    console.log('Succcess! Packaged applications can be found in ' + path.join(projectRoot, './build/buntralinoOutput/'));
};
