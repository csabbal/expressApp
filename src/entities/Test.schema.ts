import mongoose from 'mongoose'
import { TestEntity } from '../types/Test'
import { getConnection } from '../providers/data'

/**
 * Initialization a mongoose schema to store test (practice session) records
 */
const TestSchema = new mongoose.Schema({
  id: {
    required: true,
    type: String
  },
  userId: {
    required: true,
    type: String
  },
  taskType: {
    required: true,
    type: String
  },
  rewardId: {
    required: true,
    type: String
  },
  startedAt: {
    required: true,
    type: Date
  },
  endedAt: {
    required: false,
    type: Date,
    default: null
  }
})

export const TestModel = getConnection('learning').model<TestEntity>('Test', TestSchema, 'tests')
