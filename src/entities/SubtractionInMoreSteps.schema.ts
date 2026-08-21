import mongoose from 'mongoose'
import { SubtractionInMoreStepsEntity } from '../types/SubtractionInMoreSteps'
import { getLearningConnection } from '../providers/data'

/**
 * Initialization a mongoose schema to store the subtractionInMoreSteps practice items.
 * The real Mongo collection is named 'substructionInMoreSteps' (a pre-existing
 * misspelling in the learning db); the TS/route layer uses the correct spelling.
 */
const SubtractionInMoreStepsSchema = new mongoose.Schema({
  id: {
    required: true,
    type: String
  },
  substractor: {
    required: true,
    type: Number
  },
  reducer: {
    required: true,
    type: Number
  },
  result: {
    required: true,
    type: Number
  }
})

export const SubtractionInMoreStepsModel = getLearningConnection()
  .model<SubtractionInMoreStepsEntity>(
    'SubtractionInMoreSteps', SubtractionInMoreStepsSchema, 'substructionInMoreSteps'
  )
