const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('testkantorkantor');
});

app.listen(PORT, () => {
  console.log(`Serwer uruchomiony na porcie ${PORT}`);
  console.log(`Otwórz w przeglądarce: http://localhost:${PORT}`);
});