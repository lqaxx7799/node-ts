import Mongoose from 'mongoose';

export interface IItem {
  name: string,
  description: string,
  isDeleted: boolean,
};

const itemSchema = new Mongoose.Schema({
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

interface IItemDoc extends IItem, Mongoose.Document {}

const Item = Mongoose.model<IItemDoc>('items', itemSchema);

const getAll = () => {
  return Item.find({
    isDeleted: false,
  });
}

const getById = (id: string) => {
  return Item.findById(id);
}

const addNew = (data: IItem) => {
  return Item.create(data);
}

export default {
  getAll,
  getById,
  addNew,
};
