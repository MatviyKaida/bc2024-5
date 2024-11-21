const express = require('express');
const { Command } = require('commander');
const fs = require('fs');
const path = require('path');

// Ініціалізація Commander.js
const program = new Command();

program
  .requiredOption('-h, --host <host>', 'адреса сервера')
  .requiredOption('-p, --port <port>', 'порт сервера', (value) => {
    const port = parseInt(value, 10);
    if (isNaN(port) || port <= 0 || port > 65535) {
        throw new Error('Порт повинен бути числом від 1 до 65535');
    }
    return port;
  })
  .requiredOption('-c, --cache <path>', 'шлях до директорії для кешу');

program.parse(process.argv);

const options = program.opts();

const cachePath = path.resolve(options.cache);
if (!fs.existsSync(cachePath)) {
    fs.promises.mkdir(cachePath);
}

const app = express();

app.get('/', (req, res) => {
    res.end('Server is running');
});

app.listen(options.port, options.host, () => {
    console.log(`Server is running on http://${options.host}:${options.port}`);
});
