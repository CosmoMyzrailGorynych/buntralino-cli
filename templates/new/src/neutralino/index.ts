import * as buntralino from 'buntralino-client';

// Sample Bun interaction
(async () => {
    await buntralino.ready;
    const response = await buntralino.run('sayHello', {
        message: 'Hello, Buntralino!'
    });
    if (typeof response === 'string') {
        console.log(response);
    } else {
        console.error('Got unknown response from Bun:', response);
    }
})();

(window as any).openDocs = () => Neutralino.os.open('https://buntralino.github.io/');
(window as any).openNeutralinoDocs = () => Neutralino.os.open('https://neutralino.js.org/docs/api/overview');
