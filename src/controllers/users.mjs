/* eslint-disable import/no-extraneous-dependencies */
import { check, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import UserModel from '../models/user.mjs';

const Users = class Users {
  constructor(app, connect, authenticateToken) {
    this.app = app;
    this.UserModel = connect.model('User', UserModel);
    this.authenticateToken = authenticateToken;
    this.run();
  }

  deleteById() {
    this.app.delete('/user/:id', this.authenticateToken, (req, res) => {
      this.UserModel.findByIdAndDelete(req.params.id)
        .then((user) => {
          res.status(200).json(user || {});
        })
        .catch(() => {
          res.status(500).json({
            code: 500,
            message: 'Erreur interne du serveur'
          });
        });
    });
  }

  showById() {
    this.app.get(
      '/user/:id',
      this.authenticateToken,
      (req, res) => {
        this.UserModel.findById(req.params.id)
          .then((user) => {
            res.status(200).json(user || {});
          })
          .catch(() => {
            res.status(500).json({
              code: 500,
              message: 'Erreur interne du serveur'
            });
          });
      }
    );
  }

  createValidation() {
    return [
      check('firstname').notEmpty().withMessage('Le prénom est obligatoire'),
      check('lastname').notEmpty().withMessage('Le nom de famille est obligatoire'),
      check('username').notEmpty().withMessage('Le nom d\'utilisateur est obligatoire'),
      check('password').notEmpty().withMessage('Le mot de passe est obligatoire'),
      check('avatar').notEmpty().withMessage('L\'avatar est obligatoire'),
      check('age').isNumeric().withMessage('L\'âge doit être un nombre'),
      check('city').notEmpty().withMessage('La ville est obligatoire')
    ];
  }

  create() {
    this.app.post('/user/', this.createValidation(), (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          code: 400,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      try {
        const userModel = new this.UserModel(req.body);

        this.UserModel.findOne({ username: userModel.username })
          .then((user) => {
            if (user) {
              return res.status(400).json({ message: 'Nom d\'utilisateur déjà utilisé' });
            }
            return null;
          });
        return userModel.save()
          .then((user) => res.status(200).json(user || {}))
          .catch((err) => {
            console.error(`[ERROR] users/create -> ${err}`);

            return res.status(500).json({
              code: 500,
              message: 'Internal server error'
            });
          });
      } catch (err) {
        console.error(`[ERROR] users/create -> ${err}`);
        return res.status(400).json({
          code: 400,
          message: 'Bad request'
        });
      }
    });
  }

  login() {
    this.app.post('/login', [
      check('username').notEmpty().withMessage('Le nom d\'utilisateur est obligatoire'),
      check('password').notEmpty().withMessage('Le mot de passe est obligatoire')
    ], (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          code: 400,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      try {
        return this.UserModel.findOne({ username: req.body.username }).then(async (user) => {
          if (!user) {
            return res.status(400).json({ message: 'Utilisateur non trouvé' });
          }

          const match = await bcrypt.compare(req.body.password, user.password);
          if (!match) {
            return res.status(403).json({ message: 'Mot de passe incorrect' });
          }

          const token = jwt.sign({ id: user._id, username: user.username }, this.config.jwtSecret, { expiresIn: '1h' });
          return res.status(200).json({ token });
        });
      } catch (err) {
        console.error(`[ERROR] login -> ${err}`);
        return res.status(500).json({ message: 'Internal server error' });
      }
    });
  }

  logout() {
    this.app.post('/logout', this.authenticateToken, (req, res) => {
      res.sendStatus(200);
    });
  }

  run() {
    this.create();
    this.showById();
    this.deleteById();
    this.login();
    this.logout();
  }
};

export default Users;
