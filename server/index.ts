import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { createApp } from './app.js';
import { JsonStore } from './store.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const store = new JsonStore(path.resolve(root, process.env.DATA_FILE ?? 'data/store.json'));
await store.load();
const app = createApp(store);
const dist = path.join(root, 'dist');
app.use(express.static(dist));
app.get('/{*path}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
const port = Number(process.env.PORT ?? 4000);
app.listen(port, '127.0.0.1', () => console.log(`Donezo API ready at http://127.0.0.1:${port}`));
