const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
app.use(express.static(__dirname));

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});

app.get('*', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
app.listen(port, '0.0.0.0', () => {
  console.log('Server running on port ' + port);
});
