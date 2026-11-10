const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const { generateToken } = require('../../utils/token');
const mongoose = require('mongoose');
const Serie = require('../models/serie.model');
const cloudinary = require('../../config/cloudinary');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !name.trim() ||
      !email.trim() ||
      password.length < 8
    ) {
      const error = new Error(
        'Nombre y email obligatorios. La contraseña debe tener al menos 8 caracteres'
      );
      error.status = 400;
      throw error;
    }

    if (!req.file) {
      const error = new Error('Debes enviar una imagen de perfil');
      error.status = 400;
      throw error;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      const error = new Error('Ya existe un usuario con ese email');
      error.status = 409;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'user',
      image: req.file.path,
      imageId: req.file.filename
    });

    const createdUser = await newUser.save();

    return res.status(201).json({
      message: 'Usuario registrado correctamente',
      user: {
        _id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        image: createdUser.image
      }
    });
  } catch (error) {
    if (req.file) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (imageError) {
        console.error(
          'No se pudo eliminar la imagen del registro fallido:',
          imageError.message
        );
      }
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Ya existe un usuario con ese email'
      });
    }

    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: 'Email y contraseña obligatorios'
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        message: 'Email o contraseña incorrectos'
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).json({
        message: 'Email o contraseña incorrectos'
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      message: 'Login correcto',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return next(error);
  }
};

const getProfile = (req, res) => {
  return res.status(200).json({
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      image: req.user.image,
      favorites: req.user.favorites
    }
  });
};

const addFavorite = async (req, res, next) => {
  try {
    const { serieId } = req.params;

    if (!mongoose.isValidObjectId(serieId)) {
      return res.status(400).json({
        message: 'El identificador de la serie no es válido'
      });
    }

    const serie = await Serie.findById(serieId);

    if (!serie) {
      return res.status(404).json({
        message: 'Serie no encontrada'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { favorites: serieId } },
      { returnDocument: 'after', runValidators: true }
    ).populate('favorites');

    if (!updatedUser) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }

    return res.status(200).json({
      message: 'Serie añadida a favoritos',
      favorites: updatedUser.favorites
    });
  } catch (error) {
    return next(error);
  }
};

const removeFavorite = async (req, res, next) => {
  try {
    const { serieId } = req.params;

    if (!mongoose.isValidObjectId(serieId)) {
      return res.status(400).json({
        message: 'El identificador de la serie no es válido'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { favorites: serieId } },
      { returnDocument: 'after', runValidators: true }
    ).populate('favorites');

    if (!updatedUser) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }

    return res.status(200).json({
      message: 'Serie retirada de favoritos',
      favorites: updatedUser.favorites
    });
  } catch (error) {
    return next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const changes = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
          message: 'El nombre no puede estar vacío'
        });
      }

      changes.name = name.trim();
    }

    if (email !== undefined) {
      if (typeof email !== 'string' || !email.trim()) {
        return res.status(400).json({
          message: 'El email no puede estar vacío'
        });
      }

      changes.email = email.trim().toLowerCase();
    }

    if (Object.keys(changes).length === 0) {
      return res.status(400).json({
        message: 'Debes enviar un nombre o un email'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: changes },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }

    return res.status(200).json({
      message: 'Perfil actualizado',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Ya existe un usuario con ese email'
      });
    }

    return next(error);
  }
};

const updateProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'Debes enviar una imagen'
      });
    }

    const previousImageId = req.user.imageId;

    let updatedUser;

    try {
      updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
          $set: {
            image: req.file.path,
            imageId: req.file.filename
          }
        },
        { returnDocument: 'after', runValidators: true }
      );

      if (!updatedUser) {
        const error = new Error('Usuario no encontrado');
        error.status = 404;
        throw error;
      }
    } catch (error) {
      await cloudinary.uploader.destroy(req.file.filename);
      throw error;
    }

    if (previousImageId) {
      await cloudinary.uploader.destroy(previousImageId);
    }

    return res.status(200).json({
      message: 'Imagen de perfil actualizada',
      image: updatedUser.image
    });
  } catch (error) {
    return next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: 'El identificador del usuario no es válido'
      });
    }

    const isOwnAccount = req.user._id.toString() === id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwnAccount && !isAdmin) {
      return res.status(403).json({
        message: 'No puedes eliminar la cuenta de otro usuario'
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }

    if (user.imageId) {
      await cloudinary.uploader.destroy(user.imageId);
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      message: 'Cuenta eliminada correctamente'
    });
  } catch (error) {
    return next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: 'El identificador del usuario no es válido'
      });
    }

    if (role !== 'user' && role !== 'admin') {
      return res.status(400).json({
        message: 'El rol debe ser user o admin'
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: { role } },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }

    return res.status(200).json({
      message: 'Rol actualizado correctamente',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (error) {
    return next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find();

    return res.status(200).json(users);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  register,
  login,
  getProfile,
  addFavorite,
  removeFavorite,
  updateProfile,
  updateProfileImage,
  deleteUser,
  updateUserRole,
  getUsers
};