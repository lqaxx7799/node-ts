import express from 'express';
import Mongoose from 'mongoose';
import itemRouter from './src/routes/item';
import Event, { IEvent } from './src/models/event';
import eventController from './src/controllers/event';

Mongoose.connect('mongodb://localhost/test', { useNewUrlParser: true });
// Mongoose.connect('mongodb://18.141.14.121:27017/livechat', {
//   user: 'livechat_ro',
//   pass: '0tuSatzUuOLkGbvzpqrMTrK2vphqU7U',
// });

const db = Mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('db connected');
  
});

const app = express();

app.use(express.json());

app.use('/item', itemRouter);

app.post('/sla-insert-data', eventController.insertTestData);
app.post('/sla-report', eventController.getReport);

app.listen(3002, () => {
  console.log('listening at 3002 right now');
});
