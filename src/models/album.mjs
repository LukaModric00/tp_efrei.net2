import mongoose from 'mongoose';

const Schema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Le titre est obligatoire']
  },
  description: {
    type: String,
    required: [true, 'La description est obligatoire']
  },
  photos: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Photo'
    }
  ]
}, {
  collection: 'albums',
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

export default Schema;
