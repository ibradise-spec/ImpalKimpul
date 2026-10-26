import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { uploadRoot } from './lib/storage.js';
import { notFound, errorHandler } from './middleware/error.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use(
  '/uploads',
  express.static(uploadRoot, {
    index: false,
    maxAge: '7d',
    setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
  }),
);

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

export default app;
