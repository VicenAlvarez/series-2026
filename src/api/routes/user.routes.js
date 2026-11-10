const express = require('express');

const {
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
} = require('../controllers/user.controller');

const { isAuth, isAdmin } = require('../../middlewares/auth');
const { upload } = require('../../middlewares/upload');

const userRouter = express.Router();
userRouter.get('/', isAuth, isAdmin, getUsers);

userRouter.post('/register', upload.single('image'), register);
userRouter.post('/login', login);

userRouter.get('/profile', isAuth, getProfile);
userRouter.put('/profile', isAuth, updateProfile);
userRouter.put(
  '/profile/image',
  isAuth,
  upload.single('image'),
  updateProfileImage
);

userRouter.post('/favorites/:serieId', isAuth, addFavorite);
userRouter.delete('/favorites/:serieId', isAuth, removeFavorite);

userRouter.delete('/:id', isAuth, deleteUser);
userRouter.put('/:id/role', isAuth, isAdmin, updateUserRole);

module.exports = userRouter;