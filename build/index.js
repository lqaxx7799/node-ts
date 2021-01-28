"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const item_1 = __importDefault(require("./src/routes/item"));
// Mongoose.connect('mongodb://localhost/test', { useNewUrlParser: true });
mongoose_1.default.connect('mongodb://18.141.14.121:27017/livechat', {
    user: 'livechat_ro',
    pass: '0tuSatzUuOLkGbvzpqrMTrK2vphqU7U',
});
const db = mongoose_1.default.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('db connected');
});
const app = express_1.default();
app.use(express_1.default.json());
app.use('/item', item_1.default);
app.listen(3002, () => {
    console.log('listening at 3002');
});
