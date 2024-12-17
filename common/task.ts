import {Spinner} from '@topcli/spinner';

export default async (opts: {
    text: string,
    finish?: string
}, promise: Promise<unknown>) => {
    const spinner = new Spinner().start(opts.text);
    const val = await promise;
    spinner.succeed(opts.finish ?? opts.text);
    return val;
};