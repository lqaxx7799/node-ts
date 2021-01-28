import express from 'express';
import itemService from '../services/item';

const getAll = (request:express.Request, response:express.Response) => {
  itemService.getAll()
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

const getById = (request:express.Request, response:express.Response) => {
  const id = request.params.id as string;
  itemService.getById(id)
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
}

const addNew = (request:express.Request, response:express.Response) => {
  const body = request.body;
  itemService.addNew(body)
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
}

export default {
  getAll,
  getById,
  addNew,
};
