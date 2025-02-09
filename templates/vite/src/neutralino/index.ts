import neutralino from '@neutralinojs/lib';
neutralino.init();
import * as buntralino from 'buntralino-client';

// Sample Bun interaction
(async () => {
    await buntralino.ready;
    const TIMEOUT = {};
    const response = await Promise.race([
        buntralino.run('sayHello', {
            message: 'Hello, Buntralino!'
        }),
        new Promise(resolve => setTimeout(() => resolve(TIMEOUT), 5000))
    ]);
    const checkDiv = document.getElementById('theBunCheck')!;
    if (response === TIMEOUT) {
        console.error('No connection in 5 seconds');
        checkDiv.innerHTML = '⛔ ' + response;
        checkDiv.classList.add('error');
    } else if (typeof response === 'string') {
        console.log(response);
        checkDiv.innerHTML = '✅ ' + response;
        checkDiv.classList.add('success');
    } else {
        console.error('Got unknown response from Bun:', response);
        checkDiv.innerHTML = 'Got unknown response from Bun 🤷 Did you change the method on Bun side?';
        checkDiv.classList.add('warning');
    }
})();

(window as any).openDocs = () => neutralino.os.open('https://buntralino.ghpages.io/');
(window as any).openNeutralinoDocs = () => neutralino.os.open('https://neutralino.js.org/docs/api/overview');
(window as any).openViteDocs = () => neutralino.os.open('https://vite.dev/guide/');
