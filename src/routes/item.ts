import express from 'express';

import itemController from '../controllers/item';
import Conversation from '../models/conversation';

const itemRouter = express.Router();

itemRouter.get('/conversation', Conversation.countConversation);
itemRouter.get('/', itemController.getAll);
itemRouter.get('/:id', itemController.getById);
itemRouter.post('/', itemController.addNew);

export default itemRouter;
