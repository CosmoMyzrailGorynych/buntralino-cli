import { defineConfig, PluginOption } from 'vite'
import fs from 'node:fs';
import path from 'node:path';

const bunIndex = './src/bun/index.ts';
const neuConfig = JSON.parse(fs.readFileSync('neutralino.config.json', 'utf8'));
const neuResourcesRoot = '.' + neuConfig.cli.resourcesPath;

let launchedBuntralino = false;

/** Vite plugin to run buntralino and build it when needed */
const buntralino = (): PluginOption => [{
    name: 'vite-plugin-buntralino:copy-icon',
    enforce: 'post',
    async buildStart() {
        // Copy the app icon when developing an app
        await fs.promises.mkdir('./app', {
            recursive: true
        })
        await fs.promises.copyFile('public/icon.png', path.join(neuResourcesRoot + '/icon.png'));
    }
}, {
    name: 'vite-plugin-buntralino:serve',
    apply: 'serve',
    enforce: 'post',
    async configureServer(server) {
        // Start Buntralino with the Vite server and use it
        server.httpServer?.once('listening', async () => {
            if (launchedBuntralino) {
                return;
            }
            const address = server.httpServer?.address();
            if (!address || typeof address === 'string') {
                throw new Error('Failed to get server address');
            }
            const protocol = server.config.server.https ? 'https' : 'http',
                host = '127.0.0.1',
                port = address.port;
            (await Bun.$`buntralino run ${bunIndex} -- --vitehost=${protocol}://${host}:${port}`);
            launchedBuntralino = true;
        });
    }
}, {
    name: 'vite-plugin-buntralino:build',
    apply: 'build',
    enforce: 'post',
    async closeBundle() {
        // Build Buntralino after Vite builds
        await Bun.$`buntralino build ${bunIndex}`;
    },
}];

// https://vite.dev/config/
export default defineConfig({
    plugins: [buntralino()],
    server: {
        host: '127.0.0.1',
        open: false
    },
    build: {
        outDir: neuResourcesRoot
    }
})
