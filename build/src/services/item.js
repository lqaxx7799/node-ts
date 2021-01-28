"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const item_1 = __importDefault(require("../models/item"));
const getAll = () => {
    return item_1.default.getAll();
};
const getById = (id) => {
    return item_1.default.getById(id);
};
const addNew = (data) => {
    return item_1.default.addNew(data);
};
exports.default = {
    getAll,
    getById,
    addNew,
};
