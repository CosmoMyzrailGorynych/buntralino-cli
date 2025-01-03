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
        binaryName: string;
        distributionPath?: string;
    }
}

import resedit from 'resedit-cli';
import path from 'path';
import fs from 'fs-extra';
import {$} from 'bun';
import {HERMITE, createICO, createICNS} from '@ctjs/png2icons';
import task from '../common/task';

type BuntralinoPlatform = {
    os: 'linux' | 'macos' | 'windows';
    name: string;
    neutralinoPostfix: string;
    bunTarget: string;
}
const platforms: BuntralinoPlatform[] = [{
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

const defaultIconPath = path.join(import.meta.dir, '../Buntralino.png');
const getIconPath = (neutralinoConfig: NeutralinoConfig, projectRoot: string) => {
    let iconPath = defaultIconPath;
    if (neutralinoConfig.applicationIcon) {
        iconPath = neutralinoConfig.applicationIcon;
    } else if (neutralinoConfig.modes?.window?.icon) {
        iconPath = neutralinoConfig.modes.window.icon;
    }
    // Make the path relative
    if (iconPath !== defaultIconPath && iconPath.startsWith('/')) {
        iconPath = iconPath.slice(1);
    }
    return path.join(projectRoot, iconPath);
};

const makeWindowsBinGui = async (exePath: string) => {
    const IMAGE_SUBSYSTEM_GUI = 2;
    const HEADER_OFFSET_LOCATION = 0x3C;
    const SUBSYSTEM_OFFSET = 0x5C;

    const fd = await fs.open(exePath, 'r+');
    const buffer = Buffer.alloc(4);
    // Read PE header offset from 0x3C
    await fs.read(fd, buffer as unknown as Uint8Array, 0, 4, HEADER_OFFSET_LOCATION);
    const peHeaderOffset = buffer.readUInt32LE(0);

    // Seek to the subsystem field in the PE header
    const subsystemOffset = peHeaderOffset + SUBSYSTEM_OFFSET;
    const subsystemBuffer = Buffer.alloc(2);
    subsystemBuffer.writeUInt16LE(IMAGE_SUBSYSTEM_GUI, 0);

    // Write the new subsystem value
    await fs.write(fd, subsystemBuffer as unknown as Uint8Array, 0, 2, subsystemOffset);
    await fs.close(fd);
};
const patchWinExecutable = async (exePath: string, projectRoot: string, neutralinoConfig: NeutralinoConfig) => task({
    text: 'Patching a Windows executable with metadata and icons',
    finish: 'Windows executable patched'
}, (async () => {
    exePath = path.resolve(process.cwd(), exePath);

    await makeWindowsBinGui(exePath);

    const tempFolder = await fs.mkdtemp('buntralino-temp-');
    try {
        let iconPath = getIconPath(neutralinoConfig, projectRoot);
        const ico = createICO(await fs.readFile(iconPath), HERMITE, 0, true, true)!;
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
    } finally {
        await fs.remove(tempFolder);
    }
})());

const getInfoPlist = (appName: string, appId: string) => `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>${appName}</string>
    <key>CFBundleDisplayName</key>
    <string>${appName}</string>
    <key>CFBundleIdentifier</key>
    <string>${appId}</string>
    <key>CFBundleIconFile</key>
    <string>icon.icns</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>LSApplicationCategoryType</key>
    <string>public.app-category.developer-tools</string>
    <key>LSMinimumSystemVersion</key>
    <string>13.0.0</string>
    <key>LSUIElement</key>
    <true/>
</dict>
</plist>`;

const makeMacApp = async (opts: {
    projectRoot: string,
    pf: typeof platforms[0],
    appName: string,
    bunOutPath: string,
    neuOutPath: string,
    resourcesNeuOutPath: string,
    neutralinoConfig: NeutralinoConfig
}) => {
    // Create Mac app bundle structure
    const appBundle = path.join(process.cwd(), 'build', `${opts.pf.name} App`, `${opts.appName}.app`);
    const contentsPath = path.join(appBundle, 'Contents');
    const macOsPath = path.join(contentsPath, 'MacOS');
    const resourcesPath = path.join(contentsPath, 'Resources');

    let iconPath = getIconPath(opts.neutralinoConfig, opts.projectRoot);

    await task({
        text: `Creating ${opts.pf.name} application bundle`,
        finish: `${opts.pf.name} application bundle created successfully`
    }, (async () => {
        await Promise.all([
            fs.ensureDir(macOsPath),
            fs.ensureDir(resourcesPath)
        ]);
        await Promise.all([
            // Copy Bun executable to MacOS folder as main app executable
            fs.copy(opts.bunOutPath, path.join(macOsPath, opts.appName)),
            // Copy Neutralino binary and resources to Resources folder
            fs.copy(opts.neuOutPath, path.join(resourcesPath, 'neutralino')),
            fs.copy(opts.resourcesNeuOutPath, path.join(resourcesPath, 'resources.neu')),
            // Bake icons for the Map app
            fs.writeFile(
                path.join(resourcesPath, 'icon.icns'),
                createICNS(await fs.readFile(iconPath), HERMITE, 0) as unknown as DataView
            )
        ]);
        // Make the executables runnable
        await Promise.all([
            fs.chmod(path.join(macOsPath, opts.appName), '755'), // rwx r-x r-x
            fs.chmod(path.join(resourcesPath, 'neutralino'), '755')
        ]);
        // Create Info.plist to hide console window
        await fs.writeFile(
            path.join(contentsPath, 'Info.plist'),
            getInfoPlist(opts.appName, opts.neutralinoConfig.applicationId ?? opts.appName)
        );
    })());
};

export default async (
    index: string = 'index.ts',
    buildArgs: (string | number)[] = [],
    projectRoot = process.cwd()
) => {
    let neutralinoConfig: NeutralinoConfig;
    try {
        neutralinoConfig = await fs.readJSON(path.resolve(projectRoot, 'neutralino.config.json'));
    }
    catch (error) {
        console.error('neutralino.config.json not found. Make sure to run `buntralino build` in the root of your Buntralino project.');
        process.exit(1);
    }
    const platformNames = platforms.map((pf) => pf.name);
    if (['bun', 'neutralino', ...platformNames].includes(neutralinoConfig.cli.binaryName)) {
        throw new Error('Please pick an app name different from `bun`, `neutralino`, and build targets\' names in your `neutralino.config.json`.');
    }

    const appName = neutralinoConfig.cli.binaryName;

    const buildsDir = path.join(projectRoot, 'build');
    const neuBuildsDir = path.join(projectRoot, neutralinoConfig.cli.distributionPath ?? 'dist', `${appName}`);
    const bunBuildsDir = path.join(buildsDir, 'bun');
    if (await fs.exists(buildsDir)) {
        await task({
            text: 'Removing stale builds',
            finish: 'Stale builds removed'
        }, fs.remove(buildsDir));
    }

    await task({
        text: 'Building the Neutralino.js app',
        finish: 'Neutralino.js app has been built successfully'
    }, $`bunx --bun @neutralinojs/neu build`.cwd(projectRoot).quiet());

    await task({
        text: 'Packaging Bun into single-file executables',
        finish: 'Bun packed successfully'
    }, Promise.all(platforms.map(async (pf) => {
        await fs.ensureDir('./build/bun');
        const neutralinoExePath = path.join(neuBuildsDir, `${appName}-${pf.neutralinoPostfix}`);
        const resourcesNeuPath = path.join(neuBuildsDir, `resources.neu`);
        const bunExePath = path.join(bunBuildsDir, `${appName}-${pf.neutralinoPostfix}`);
        const platformPostfix = pf.os === 'windows' ? '.exe' : '';
        let cwd = process.cwd();
        if (path.dirname(index) !== projectRoot) {
            cwd = path.join(projectRoot, path.dirname(index))
        }
        // Packaged bun applications for Windows silently crash if minified normally,
        // use weaker minification flags for now for Windows.
        const win = pf.os === 'windows';
        const minify = win ? [] : ['--minify', '--sourcemap'];
        await $`bun build ${path.basename(index)} --compile --target=${pf.bunTarget} ${minify} --outfile ${bunExePath} ${buildArgs}`
            .cwd(cwd).quiet();
        const bunOutPath = path.join(buildsDir, pf.name, appName + platformPostfix)
        const neuOutPath = path.join(buildsDir, pf.name, 'neutralino' + platformPostfix);
        const resourcesNeuOutPath = path.join(buildsDir, pf.name, 'resources.neu');
        await Promise.all([
            fs.copy(neutralinoExePath, neuOutPath),
            fs.copy(bunExePath, bunOutPath),
            fs.copy(resourcesNeuPath, resourcesNeuOutPath)
        ]);

        // Make sure the output executables have the +x permission flag
        if (pf.os !== 'windows') {
            await Promise.all([
                fs.chmod(neuOutPath, '755'), // rwx r-x r-x
                fs.chmod(bunOutPath, '755')
            ]);
        }
        // Building on Windows magically fails, probably because of filesystem buffering and/or antivirus scanning.
        // Wait a bit for the Windows executable to cool, and only then patch it.
        if (process.platform === 'win32' && pf.os === 'windows') {
            await task({
                text: 'Waiting a couple seconds because Windows is an idiot',
                finish: 'We have waited a couple seconds for ' + pf.name + ' because Windows is an idiot'
            }, new Promise(resolve => setTimeout(resolve, 5_000)));
        }
        if (pf.os === 'windows') {
            await patchWinExecutable(bunOutPath, projectRoot, neutralinoConfig);
        }
        if (pf.os === 'macos') {
            await makeMacApp({
                projectRoot,
                pf,
                appName,
                bunOutPath,
                neuOutPath,
                resourcesNeuOutPath,
                neutralinoConfig
            });
        }
    })));

    console.log('\n🐇 Succcess! Packaged applications can be found in ' + buildsDir);

    // Remove unneeded folders
    fs.remove(bunBuildsDir);
    fs.remove(neuBuildsDir);
};
