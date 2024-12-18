import {create, events, registerMethodMap} from 'buntralino';

/**
 * Function map that allows running named functions with `buntralino.run` on the client (Neutralino) side.
 */
const functionMap = {
    sayHello: async (payload: {
        message: string
    }) => {
        await Bun.sleep(1000);
        return `Bun says "${payload.message}"!`;
    }
};

registerMethodMap(functionMap);
// or registerMethod('sayHello', functionMap.sayHello);

await create('/', {
    // Name windows to easily manipulate them and distinguish them in events
    name: 'main'
});

// Exit the app completely when the main window is closed without the `shutdown` command.
events.on('close', (windowName: string) => {
    if (windowName === 'main') {
        // eslint-disable-next-line no-process-exit
        process.exit();
    }
});