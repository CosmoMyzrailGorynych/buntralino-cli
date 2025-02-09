import {$} from 'bun';

export default async (indexPath = 'index.ts', additionalArgs?: string[]) =>
    $`bun run --inspect --watch ${indexPath} ${additionalArgs ?? ''}`;
