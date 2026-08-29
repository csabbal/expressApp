import mongoose from 'mongoose'
import { TaskSuccessEntity } from '../types/TaskSuccess'
import { getConnection } from '../providers/data'

/**
 * Initialization a mongoose schema to store recorded task successes
 */
const TaskSuccessSchema = new mongoose.Schema({
  id: {
    required: true,
    type: String
  },
  userId: {
    required: true,
    type: String
  },
  taskId: {
    required: true,
    type: String
  },
  testId: {
    required: true,
    type: String
  },
  taskTypeName: {
    required: true,
    type: String
  },
  solvedAt: {
    required: true,
    type: Date
  }
})

export const TaskSuccessModel =
  getConnection('learning').model<TaskSuccessEntity>('TaskSuccess', TaskSuccessSchema, 'taskSuccesses')
