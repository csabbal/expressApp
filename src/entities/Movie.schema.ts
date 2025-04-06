import mongoose from 'mongoose'
import {MovieEntity } from '../types/Movie'

/**
 * Initialization a mongoose schema to store the movies
 */
const MovieSchema = new mongoose.Schema({
  id: {
    required: true,
    type: String
  },
 title: {
    required: true,
    type: String
  },
  description: {
    required: true,
    type: String
  },
  image: {
    required: true,
    type: String
  },
  releaseDate: {
    required: true,
    type: String
  },
  rating: {
    required: true,
    type: Number
  },
  genre: {
    required: true,
    type: String
  },
  duration: {
    required: true,
    type: String
  },
  director: {
    required: true,
    type: String
  }
})

export const MovieModel = mongoose.model<MovieEntity>('Movie', MovieSchema)