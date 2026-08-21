import mongoose from 'mongoose'
import { AdditionInMoreStepsEntity } from '../types/AdditionInMoreSteps'
import { getLearningConnection } from '../providers/data'

/**
 * Initialization a mongoose schema to store the additionInMoreSteps practice items
 */
const AdditionInMoreStepsSchema = new mongoose.Schema({
  id: {
    required: true,
    type: String
  },
  term1: {
    required: true,
    type: Number
  },
  term2: {
    required: true,
    type: Number
  },
  result: {
    required: true,
    type: Number
  }
})

export const AdditionInMoreStepsModel = getLearningConnection()
  .model<AdditionInMoreStepsEntity>('AdditionInMoreSteps', AdditionInMoreStepsSchema, 'additionInMoreSteps')
