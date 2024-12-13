import {$} from 'bun';

export default async (indexPath = 'index.ts') => $`bun run --inspect --watch ${indexPath}`;
