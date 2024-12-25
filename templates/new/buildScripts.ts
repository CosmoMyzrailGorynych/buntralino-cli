/*
    This minimal build system uses the Buntralino CLI's programmatic API.
    The calls are equivalent to the command-line interface.

    It also uses ESBuild to bundle all the code for Neutralino.js application
    into one file. See ESBuild documentation for more details and make it your own:
    https://esbuild.github.io/

    Use this file as a base for integrating with your existing build pipelines
    or expand this code with asynchronous tasks.
*/
import * as esbuild from 'esbuild';
import * as buntralino from 'buntralino-cli';

const buntralinoIndex = 'src/bun/index.ts';

if (!process.versions.bun) {
    throw new Error('Please use Buntralino and its build scripts with Bun only. It\'s not called Nodetralino or Denolino for a reason — runtimes other than Bun are not supported.');
}

const context = await esbuild.context({
    entryPoints: ['./src/neutralino/index.ts'],
    outfile: './app/js/bundle.js',
    bundle: true,
    minify: true,
    sourcemap: 'linked',
    target: ['safari16', 'edge100'],
    // This simple plugin makes sure that only one copy of the Buntralino client is included,
    // even if it is imported with both `import` and `require`.
    plugins: [{
        name: 'dedupe-buntralino-client',
        setup({onResolve}) {
            const pattern = process.platform === 'win32' ? 'file:///' : 'file://';
            const buntralinoClient = import.meta.resolve('buntralino-client').replace(pattern, '');
            onResolve({
                filter: /^buntralino-client$/
            }, () => ({
                path: buntralinoClient
            }));
        }
    }]
});

const buildNeutralinoApp = async () => {
    await context.rebuild();
};

if (Bun.argv.includes('dev')) {
    await buildNeutralinoApp();
    await Promise.race([
        // You can pass a relative path to the main Buntralino file on Bun side here.
        // (Defaults to 'index.ts' if not provided)
        buntralino.run(buntralinoIndex),
        context.watch()
    ]);
    // Stop the file watcher when the Buntralino application exits.
    context.dispose();
} else if (Bun.argv.includes('build')) {
    await buildNeutralinoApp();
    await buntralino.build(buntralinoIndex);
    // Dispose of the ESBuild context to finish the process.
    context.dispose();
}
