import mongoose from 'mongoose'
import { FileEntity } from '../types/File'
import { getConnection } from '../providers/data'

/**
 * Initialization a mongoose schema to store uploaded file metadata
 */
const FileSchema = new mongoose.Schema({
  id: {
    required: true,
    type: String
  },
  originalName: {
    required: true,
    type: String
  },
  mimeType: {
    required: true,
    type: String
  },
  size: {
    required: true,
    type: Number
  },
  isImage: {
    required: true,
    type: Boolean
  },
  category: {
    type: String,
    default: null,
    index: true
  },
  originalPath: {
    required: true,
    type: String
  },
  lowQualityPath: {
    type: String,
    default: null
  },
  uploadedBy: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

export const FileModel = getConnection('primary').model<FileEntity>('File', FileSchema)
