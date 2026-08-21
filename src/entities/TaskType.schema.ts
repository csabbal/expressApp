import mongoose from 'mongoose'
import { TaskTypeEntity } from '../types/TaskType'
import { getLearningConnection } from '../providers/data'

/**
 * Initialization a mongoose schema to store the task types
 */
const TaskTypeSchema = new mongoose.Schema({
  id: {
    required: true,
    type: String
  },
  subject: {
    required: true,
    type: String
  },
  name: {
    required: true,
    type: String
  },
  description: {
    required: true,
    type: String
  },
  rating: {
    required: true,
    type: Number
  }
})

export const TaskTypeModel = getLearningConnection().model<TaskTypeEntity>('TaskType', TaskTypeSchema, 'TaskTypes')
