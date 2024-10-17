/* eslint-disable import/no-extraneous-dependencies */
// Dependencies
import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import https from 'https';
// Core
import config from './config.mjs';
import routes from './controllers/routes.mjs';

const Server = class Server {
  constructor() {
    this.app = express();
    this.config = config[process.argv[2]] || config.development;
  }

  async dbConnect() {
    try {
      const host = this.config.mongodb;

      this.connect = await mongoose.createConnection(host, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });

      const close = () => {
        this.connect.close((error) => {
          if (error) {
            console.error('[ERROR] api dbConnect() close() -> mongodb error', error);
          } else {
            console.log('[CLOSE] api dbConnect() -> mongodb closed');
          }
        });
      };

      this.connect.on('error', (err) => {
        setTimeout(() => {
          console.log('[ERROR] api dbConnect() -> mongodb error');
          this.connect = this.dbConnect(host);
        }, 5000);

        console.error(`[ERROR] api dbConnect() -> ${err}`);
      });

      this.connect.on('disconnected', () => {
        setTimeout(() => {
          console.log('[DISCONNECTED] api dbConnect() -> mongodb disconnected');
          this.connect = this.dbConnect(host);
        }, 5000);
      });

      process.on('SIGINT', () => {
        close();
        console.log('[API END PROCESS] api dbConnect() -> close mongodb connection');
        process.exit(0);
      });
    } catch (err) {
      console.error(`[ERROR] api dbConnect() -> ${err}`);
    }
  }

  middleware() {
    this.app.use(compression());
    this.app.use(cors());
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(bodyParser.json());
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: '[ERROR] Too many requests from this IP, please try again later.'
    });

    this.app.use(limiter);
  }

  routes() {
    const authenticateToken = (req, res, next) => {
      const authHeader = req.headers.authorization;
      const token = authHeader ? authHeader.split(' ')[1] : null;

      if (!token) {
        res.sendStatus(401);
        return;
      }

      jwt.verify(token, this.config.jwtSecret, (err, user) => {
        if (err) {
          res.sendStatus(403);
          return;
        }

        req.user = user;
        next();
      });
    };

    new routes.Users(this.app, this.connect, authenticateToken);
    new routes.Albums(this.app, this.connect, authenticateToken);
    new routes.Photos(this.app, this.connect, authenticateToken);

    this.app.use((req, res) => {
      res.status(404).json({
        code: 404,
        message: 'Not Found'
      });
    });
  }

  security() {
    this.app.use(helmet());
    this.app.disable('x-powered-by');
  }

  async run() {
    try {
      await this.dbConnect();
      this.security();
      this.middleware();
      this.routes();

      const privateKey = fs.readFileSync('server.key', 'utf8');
      const certificate = fs.readFileSync('server.cert', 'utf8');
      const credentials = { key: privateKey, cert: certificate };

      https.createServer(credentials, this.app).listen(this.config.port, () => {
        console.log(`[LAUCHED] Secure server running on https://localhost:${this.config.port}`);
      });
    } catch (err) {
      console.error(`[ERROR] Server -> ${err}`);
    }
  }
};

export default Server;
