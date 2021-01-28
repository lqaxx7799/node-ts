"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const item_1 = __importDefault(require("../controllers/item"));
const itemRouter = express_1.default.Router();
itemRouter.get('/', item_1.default.getAll);
itemRouter.get('/:id', item_1.default.getById);
itemRouter.post('/', item_1.default.addNew);
exports.default = itemRouter;
