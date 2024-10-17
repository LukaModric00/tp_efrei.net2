import mongoose from 'mongoose';

const PhotoModel = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Le titre est obligatoire']
  },
  url: {
    type: String,
    required: [true, "L'url est obligatoire"]
  },
  description: {
    type: String,
    required: [true, 'La description est obligatoire']
  },
  album: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Album',
    required: [true, "L'album est obligatoire"]
  }
}, {
  collection: 'photos',
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

export default PhotoModel;
