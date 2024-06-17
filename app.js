const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/usersRoutes');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(authRoutes);

// Server
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Server is running on port http://${HOST}:${PORT}`);
});
