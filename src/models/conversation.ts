import mongoose, { Schema } from 'mongoose';
import _ from 'lodash';

const ACTOR = {
  MESSAGE: 'message',
  CONVERSTION: 'conversation',
  AGENT: 'agent',
  SYSTEM: 'system',
};

const authorType = {
  VISITOR: 'visitor',
  AGENT: 'agent',
  APP: 'app',
  BOT: 'bot',
  APP_INTEGRATION: 'integration',
};

const CONVERSATION = {
  OPEN: 'open',
  CLOSED: 'closed',
};

const startUrlSchema = {
  url: String,
  title: String,
};

const authorSchema = new Schema({
  avatar: {},
  firstName: String,
  lastName: String,
  nameGenerated: Boolean,
  profilePicture: String,
  name: String,
  authorId: String,
  initial: String,
  refId: String,
  isAgent: {
    type: Boolean,
    default: false,
  },
  isBot: {
    type: Boolean,
    default: false,
  },
  isSelf: {
    type: Boolean,
    default: true,
  },
  type: {
    type: String,
    default: 'visitor',
  },
  clientType: String,
  appIntegrationId: String,
});

const conversationSchema = new Schema({
  appId: { type: String },
  creator: authorSchema,
  visitorId: String,
  assignedAt: Number,
  wouldAssignTo: Schema.Types.Mixed,
  assignedTo: String,
  deleted: {
    type: Boolean,
    default: false,
  },
  startedUrl: startUrlSchema,
  lastVisitorMessageLocation: startUrlSchema,
  conversationAssignedUUID: String,
  groupId: String,
  labelId: String,
  categoryId: String,
  reOpened: Boolean,
  channelType: String,
  awaitingResponseLevel: Number, // 0: first, 1: reply, 2: no more waiting for any
  awaitingResponseSince: Date,
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'message',
  },
  lastAgentMessage: {
    type: Schema.Types.ObjectId,
    ref: 'message',
  },
  lastMessageSince: Number,
  source: String,
  lastVisitorMessageSince: Date,
  priorityLevel: String, // 'highest', 'high'
  hiddenFromAgent: {
    type: Boolean,
    default: false,
  },
  unreadByUser: Boolean,
  unreadByAdmin: {
    type: Boolean,
    default: true,
  },
  appIntegrationId: String, // integration app
  integrateConvId: String, // reference conversation id
  meta: {
  },
  channel: {
    type: Schema.Types.ObjectId,
    ref: 'channel',
  },
  openAt: Date,
  closedAt: Date,
  lastStatusChangedById: String,
  lastStatusChangedBy: {
    type: String,
    enum: _.values(ACTOR),
    default: 'newConversation',
  },
  lastChangedByAuthor: {
    type: String,
    enum: _.values(authorType),
  },
  status: {
    type: String,
    enum: _.values(CONVERSATION),
    default: CONVERSATION.OPEN,
  },
  tags: [String],
  // the fields below are currently unused
  lastMessageLocation: String,
  firstMessageLocation: String,
  lastRespondedMillis: Number,
  lastMessageFromVisitor: Boolean,
  secondLastMessageFromVisitor: Boolean,
  lastMessageAnAwayMessage: Boolean,
  lastMessageFromAgent: Boolean,
  secondLastMessageFromAgent: Boolean,
}, {
  timestamps: true,
});

conversationSchema.index({
  appId: 1,
  status: 1,
});

const Conversation = mongoose.model('conversation', conversationSchema);

console.log(11111);

const countConversation = () => Conversation.aggregate([
  {
    $lookup: {
      from: 'messages',
      localField: 'lastMessage',
      foreignField: '_id',
      as: 'lastMessages'
    }
  },
  {
    $match: {
      appId: '5eb0cdd2547e45005db77fdc',
      status: 'open',
      $and: [
        { 'meta.botInfo.completed': false },
        { lastMessages: { $elemMatch: { 'author.isBot': true } } },
      ]
    }
  },
  {
    $group: {
      _id: '$assignedTo',
      count: { $sum: 1 }
    }
  },
])
  // .explain()
  .then((result: any) => console.log(result))
  .catch((error: any) => console.log(error))

export default {
  countConversation,
  getByIds: (conversationIds: any[]) => conversationIds,
}