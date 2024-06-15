const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/usersRoutes');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(authRoutes);

// Server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
