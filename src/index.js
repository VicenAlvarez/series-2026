require('dotenv').config();
const express = require('express');
const { connectDB } = require('./config/db');
const serieRouter = require('./api/routes/serie.routes');

const app = express();
const PORT = process.env.PORT || 3000;

const userRouter = require('./api/routes/user.routes');

app.use(express.json());

app.use('/api/users', userRouter);
app.use('/api/series', serieRouter);

app.get('/', (req, res) => {
  return res.status(200).json({
    message: 'API de series 2026 funcionando'
  });
});

app.use((req, res) => {
  return res.status(404).json({
    message: 'Ruta no encontrada'
  });
});

app.use((error, req, res, next) => {
  console.error(error.message);

  const status = error.status || (
    error.name === 'ValidationError' ? 400 : 500
  );

  return res.status(status).json({
    message: status === 500
      ? 'Error interno del servidor'
      : error.message
  });
});

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Servidor disponible en http://localhost:${PORT}`);
  });
};

startServer();