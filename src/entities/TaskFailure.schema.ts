import mongoose from 'mongoose'
import { TaskFailureEntity } from '../types/TaskFailure'
import { getConnection } from '../providers/data'

/**
 * Initialization a mongoose schema to store recorded task failures
 */
const TaskFailureSchema = new mongoose.Schema({
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
  errorMessage: {
    required: false,
    type: String,
    default: null
  },
  count: {
    required: true,
    type: Number
  },
  firstFailedAt: {
    required: true,
    type: Date
  },
  lastFailedAt: {
    required: true,
    type: Date
  }
})

export const TaskFailureModel =
  getConnection('learning').model<TaskFailureEntity>('TaskFailure', TaskFailureSchema, 'taskFailures')
