/*
    This minimal build system uses the Buntralino CLI's programmatic API.
    The calls are equivalent to the command-line interface.

    It also uses ESLint to bundle all the code for Neutralino.js application
    into one file. See ESBuild documentation for more details and make it your own:
    https://esbuild.github.io/

    Use this file as a base for integrating with your existing build pipelines
    or expand this code with asynchronous tasks.
*/
import * as buntralino from 'buntralino-cli';

const buntralinoIndex = 'index.ts';

if (!process.versions.bun) {
    throw new Error('Please use Buntralino and its build scripts with Bun only. It\'s not called Nodetralino or Denolino for a reason — runtimes other than Bun are not supported.');
}

const buildNeutralinoApp = async () => {
    // Run your build tasks here
};

if (Bun.argv.includes('dev')) {
    await buildNeutralinoApp();
    await buntralino.run(buntralinoIndex);
} else if (Bun.argv.includes('build')) {
    await buildNeutralinoApp();
    await buntralino.build(buntralinoIndex);
}
