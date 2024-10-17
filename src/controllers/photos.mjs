import PhotoModel from '../models/photo.mjs';
import AlbumModel from '../models/album.mjs';

const Photos = class Photos {
  constructor(app, connect, authenticateToken) {
    this.app = app;
    this.PhotoModel = connect.model('Photo', PhotoModel);
    this.AlbumModel = connect.model('Album', AlbumModel);
    this.authenticateToken = authenticateToken;

    this.run();
  }

  getPhotosFromAlbum() {
    this.app.get('/album/:id/photos', this.authenticateToken, (req, res) => {
      try {
        this.AlbumModel.findById(req.params.id).populate('photos')
          .then((album) => res.status(200).json(album.photos || []))
          .catch(() => res.status(500).json({ code: 500, message: 'Internal Server error' }));
      } catch (err) {
        console.error(`[ERROR] photos -> ${err}`);
        res.status(400).json({ code: 400, message: 'Bad request' });
      }
    });
  }

  getPhotoFromAlbum() {
    this.app.get('/album/:albumId/photo/:photoId', this.authenticateToken, (req, res) => {
      try {
        this.PhotoModel.findOne({ album: req.params.albumId, _id: req.params.photoId })
          .populate('album')
          .then((photo) => res.status(200).json(photo || {}))
          .catch(() => res.status(500).json({ code: 500, message: 'Internal Server error' }));
      } catch (err) {
        console.error(`[ERROR] photos -> ${err}`);
        res.status(400).json({ code: 400, message: 'Bad request' });
      }
    });
  }

  addPhotoToAlbum() {
    this.app.post('/album/:id/photo', this.authenticateToken, (req, res) => {
      try {
        const photo = new this.PhotoModel(req.body);
        photo.album = req.params.id;

        photo.save()
          .then((savedPhoto) => this.AlbumModel.findByIdAndUpdate(req.params.id, {
            $push: { photos: savedPhoto._id }
          }, { new: true }).populate('photos'))
          .then((updatedAlbum) => res.status(201).json(updatedAlbum))
          .catch(() => res.status(500).json({ code: 500, message: 'Internal Server error' }));
      } catch (err) {
        console.error(`[ERROR] photos -> ${err}`);
        res.status(400).json({ code: 400, message: 'Bad request' });
      }
    });
  }

  editPhotoFromAlbum() {
    this.app.put('/album/:albumId/photo/:photoId', (req, res) => {
      try {
        this.PhotoModel
          .findOneAndUpdate(
            { album: req.params.albumId, _id: req.params.photoId },
            req.body,
            { new: true }
          )
          .populate('album')
          .then((photo) => res.status(200).json(photo || {}))
          .catch(() => res.status(500).json({ code: 500, message: 'Internal Server error' }));
      } catch (err) {
        console.error(`[ERROR] photos -> ${err}`);
        res.status(400).json({ code: 400, message: 'Bad request' });
      }
    });
  }

  deletePhotoFromAlbum() {
    this.app.delete('/album/:albumId/photo/:photoId', this.authenticateToken, (req, res) => {
      try {
        this.PhotoModel.findOneAndDelete({ album: req.params.albumId, _id: req.params.photoId })
          .then(() => this.AlbumModel.findByIdAndUpdate(req.params.albumId, {
            $pull: { photos: req.params.photoId }
          }, { new: true }).populate('photos'))
          .then((updatedAlbum) => res.status(204).json(updatedAlbum))
          .catch(() => res.status(500).json({ code: 500, message: 'Internal Server error' }));
      } catch (err) {
        console.error(`[ERROR] photos -> ${err}`);
        res.status(400).json({ code: 400, message: 'Bad request' });
      }
    });
  }

  run() {
    this.getPhotosFromAlbum();
    this.getPhotoFromAlbum();
    this.addPhotoToAlbum();
    this.editPhotoFromAlbum();
    this.deletePhotoFromAlbum();
  }
};

export default Photos;
