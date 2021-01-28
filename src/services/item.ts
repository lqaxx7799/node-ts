import Item, { IItem } from '../models/item';

const getAll = () => {
  return Item.getAll();
}

const getById = (id: string) => {
  return Item.getById(id);
}

const addNew = (data: IItem) => {
  return Item.addNew(data);
}

export default {
  getAll,
  getById,
  addNew,
};
