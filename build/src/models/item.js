"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
;
const itemSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
    },
    description: String,
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
const Item = mongoose_1.default.model('items', itemSchema);
const getAll = () => {
    return Item.find({
        isDeleted: false,
    });
};
const getById = (id) => {
    return Item.findById(id);
};
const addNew = (data) => {
    return Item.create(data);
};
exports.default = {
    getAll,
    getById,
    addNew,
};
