const express = require('express');

const {
  createSerie,
  getSeries,
  getSerieById,
  updateSerie,
  deleteSerie
} = require('../controllers/serie.controller');

const { isAuth, isAdmin } = require('../../middlewares/auth');

const serieRouter = express.Router();

serieRouter.get('/', getSeries);
serieRouter.get('/:id', getSerieById);

serieRouter.post('/', isAuth, isAdmin, createSerie);
serieRouter.put('/:id', isAuth, isAdmin, updateSerie);
serieRouter.delete('/:id', isAuth, isAdmin, deleteSerie);

module.exports = serieRouter;