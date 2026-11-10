const Serie = require('../models/serie.model');
const mongoose = require('mongoose');
const User = require('../models/user.model');

const validateSerie = (data, isUpdate) => {
  const { genres, incorporations } = data;

  if (!isUpdate || genres !== undefined) {
    if (!Array.isArray(genres) || genres.length === 0) {
      return 'La serie debe tener al menos un género';
    }
  }

  if (!isUpdate || incorporations !== undefined) {
    if (!Array.isArray(incorporations) || incorporations.length === 0) {
      return 'La serie debe tener al menos una incorporación';
    }

    const allowedPlatforms = ['Netflix', 'Prime Video', 'Disney+', 'HBO Max'];

    for (const incorporation of incorporations) {
      if (!incorporation || !allowedPlatforms.includes(incorporation.platform)) {
        return 'La plataforma no está permitida';
      }

      const date = new Date(incorporation.addedAt);

      if (date.getUTCFullYear() !== 2026) {
        return 'La fecha de incorporación debe pertenecer a 2026';
      }
    }
  }
};

const createSerie = async (req, res, next) => {
  try {
    const { title, description, genres, incorporations } = req.body || {};
    const validationError = validateSerie({ genres, incorporations }, false);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const newSerie = new Serie({
      title,
      description,
      genres,
      incorporations
    });

    const createdSerie = await newSerie.save();

    return res.status(201).json(createdSerie);
  } catch (error) {
    return next(error);
  }
};

const getSeries = async (req, res, next) => {
  try {
    const { platform, genre } = req.query;
    const filters = {};

    if (platform) {
      filters['incorporations.platform'] = platform;
    }

    if (genre) {
      filters.genres = genre;
    }

    const series = await Serie.find(filters);

    return res.status(200).json(series);
  } catch (error) {
    return next(error);
  }
};

const getSerieById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: 'El identificador de la serie no es válido'
      });
    }

    const serie = await Serie.findById(id);

    if (!serie) {
      return res.status(404).json({
        message: 'Serie no encontrada'
      });
    }

    return res.status(200).json(serie);
  } catch (error) {
    return next(error);
  }
};

const updateSerie = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: 'El identificador de la serie no es válido'
      });
    }

    const allowedFields = [
      'title',
      'description',
      'genres',
      'incorporations'
    ];

    const body = req.body || {};
    const changes = {};

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        changes[field] = body[field];
      }
    });

    if (Object.keys(changes).length === 0) {
      return res.status(400).json({
        message: 'No has enviado campos para actualizar'
      });
    }

    const validationError = validateSerie(changes, true);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const updatedSerie = await Serie.findByIdAndUpdate(
      id,
      { $set: changes },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedSerie) {
      return res.status(404).json({
        message: 'Serie no encontrada'
      });
    }

    return res.status(200).json(updatedSerie);
  } catch (error) {
    return next(error);
  }
};

const deleteSerie = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: 'El identificador de la serie no es válido'
      });
    }

    const deletedSerie = await Serie.findByIdAndDelete(id);

    if (!deletedSerie) {
      return res.status(404).json({
        message: 'Serie no encontrada'
      });
    }

    await User.updateMany(
      { favorites: id },
      { $pull: { favorites: id } }
    );

    return res.status(200).json({
      message: 'Serie eliminada correctamente',
      serie: deletedSerie
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createSerie,
  getSeries,
  getSerieById,
  updateSerie,
  deleteSerie
};