import {join} from 'path';

export default () => process.platform === 'win32' ?
    join(import.meta.dir, '../node_modules/.bin/neu.exe') :
    ['bun', join(import.meta.dir, '../node_modules/.bin/neu')];