import * as buntralino from 'buntralino-client';

// Sample Bun interaction
(async () => {
    await buntralino.ready;
    const response = await buntralino.run('sayHello', {
        message: 'Hello, Buntralino!'
    });
    if (response instanceof Object && 'message' in response) {
        console.log(response.message);
    } else {
        console.error('Got unknown response from Bun:', response);
    }
})();

(window as any).openDocs = () => Neutralino.os.open('https://buntralino.ghpages.io/');
(window as any).openNeutralinoDocs = () => Neutralino.os.open('https://neutralino.js.org/docs/api/overview');
