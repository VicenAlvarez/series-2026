const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const incorporationSchema = new Schema(
  {
    platform: {
      type: String,
      required: true
    },
    addedAt: {
      type: Date,
      required: true
    }
  },
  { _id: false }
);

const serieSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    genres: {
      type: [String],
      required: true
    },
    incorporations: {
      type: [incorporationSchema],
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Serie = mongoose.model('Serie', serieSchema);

module.exports = Serie;