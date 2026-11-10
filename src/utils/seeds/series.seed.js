require('dotenv').config();

const series = require('../../data/series');
const Serie = require('../../api/models/serie.model');
const mongoose = require('mongoose');

mongoose
  .connect(process.env.MONGO_URI, {
    dbName: 'series2026'
  })
  .then(async () => {
    const newSeries = [];

    for (const serie of series) {
      const existingSerie = await Serie.findOne({
        title: serie.title
      });

      if (!existingSerie) {
        newSeries.push(serie);
      }
    }

    if (newSeries.length > 0) {
      await Serie.insertMany(newSeries);

      console.log(`${newSeries.length} series añadidas`);
    } else {
      console.log('Las series de la semilla ya están guardadas');
    }
  })
  .catch((error) => {
    console.error('Error al cargar la semilla:', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());