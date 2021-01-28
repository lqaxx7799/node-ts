"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const item_1 = __importDefault(require("../services/item"));
const getAll = (request, response) => {
    item_1.default.getAll()
        .then(result => {
        response.json({
            items: result,
        });
    })
        .catch(error => {
        response.status(500);
        response.json({
            errors: error,
        });
    });
};
const getById = (request, response) => {
    const id = request.params.id;
    item_1.default.getById(id)
        .then(result => {
        response.json({
            items: result,
        });
    })
        .catch(error => {
        response.status(500);
        response.json({
            errors: error,
        });
    });
};
const addNew = (request, response) => {
    const body = request.body;
    item_1.default.addNew(body)
        .then(result => {
        response.json({
            status: 'success',
        });
    })
        .catch(error => {
        response.status(500);
        response.json({
            errors: error,
        });
    });
};
exports.default = {
    getAll,
    getById,
    addNew,
};
