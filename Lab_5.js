const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { Command } = require('commander');
const multer = require('multer');

// Ініціалізація командного рядка
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
program.parse();

const options = program.opts();

// Ініціалізація Express
const app = express();
app.use(bodyParser.text()); // Для обробки текстового тіла запитів

// Директорія для кешу
const notesDir = path.resolve(options.cache);

// Перевіряємо, чи існує директорія для кешу, і створюємо її за необхідності
if (!fs.existsSync(notesDir)) {
  fs.mkdirSync(notesDir);
}

// Налаштування multer для обробки form-data
const upload = multer();

app.get('/notes/:name', (req, res) => {
  const noteName = req.params.name;
  const notePath = path.join(notesDir, noteName);

  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Нотатку не знайдено');
  }

  const noteText = fs.readFileSync(notePath, 'utf-8');
  res.send(noteText);
});

app.put('/notes/:name', (req, res) => {
  const noteName = req.params.name;
  const notePath = path.join(notesDir, noteName);

  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Нотатку не знайдено');
  }

  fs.writeFileSync(notePath, req.body || '', 'utf-8');
  res.send('Нотатку оновлено');
});

app.delete('/notes/:name', (req, res) => {
  const noteName = req.params.name;
  const notePath = path.join(notesDir, noteName);

  if (!fs.existsSync(notePath)) {
    return res.status(404).send('Нотатку не знайдено');
  }

  fs.unlinkSync(notePath);
  res.send('Нотатку видалено');
});

app.get('/notes', (req, res) => {
  const files = fs.readdirSync(notesDir);
  const notes = files.map((file) => {
    const text = fs.readFileSync(path.join(notesDir, file), 'utf-8');
    return { name: file, text };
  });

  res.status(200).json(notes);
});

app.post('/write', upload.none(), (req, res) => {
  const { note_name: noteName, note } = req.body;

  if (!noteName || !note) {
    return res.status(400).send('Обидва параметри "note_name" та "note" є обов\'язковими');
  }

  const notePath = path.join(notesDir, noteName);

  if (fs.existsSync(notePath)) {
    return res.status(400).send('Нотатка з таким ім\'ям вже існує');
  }

  fs.writeFileSync(notePath, note, 'utf-8');
  res.status(201).send('Нотатку створено');
});

app.get('/UploadForm.html', (req, res) => {
  const formHtml = `
<!DOCTYPE html>
<html>

<body>

  <h2>Upload Form</h2>

  <form method="post" action="/write" enctype="multipart/form-data">
    <label for="note_name_input">Note Name:</label><br>
    <input type="text" id="note_name_input" name="note_name"><br><br>
    <label for="note_input">Note:</label><br>
    <textarea id="note_input" name="note" rows="4" cols="50"></textarea><br><br>
    <button>Upload</button>
  </form>

  <p>If you click the "Submit" button, the form-data will be sent to a page called "/upload".</p>

</body>

</html>
  `;
  res.status(200).send(formHtml);
});

app.listen(options.port, options.host, () => {
  console.log(`Сервер працює на http://${options.host}:${options.port}`);
});
