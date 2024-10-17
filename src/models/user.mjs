import mongoose from 'mongoose';

const UserModel = new mongoose.Schema({
  firstname: {
    type: String,
    required: [true, 'Le prénom est obligatoire']
  },
  lastname: {
    type: String,
    required: [true, 'Le nom de famille est obligatoire']
  },
  username: {
    type: String,
    required: [true, 'Le nom d\'utilisateur est obligatoire']
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est obligatoire']
  },
  avatar: {
    type: String,
    required: [true, 'L\'avatar est obligatoire']
  },
  age: {
    type: Number,
    required: [true, 'L\'âge est obligatoire']
  },
  city: {
    type: String,
    required: [true, 'La ville est obligatoire']
  }
}, {
  collection: 'users',
  minimize: false,
  versionKey: false
}).set('toJSON', {
  transform: (doc, ret) => {
    const retUpdated = ret;
    retUpdated.id = ret._id;

    delete retUpdated._id;

    return retUpdated;
  }
});

export default UserModel;
