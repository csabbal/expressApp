import mongoose from 'mongoose'
import { RewardEntity } from '../types/Reward'
import { getConnection } from '../providers/data'

/**
 * Initialization a mongoose schema to store rewards students have won
 */
const RewardSchema = new mongoose.Schema({
  id: {
    required: true,
    type: String
  },
  userId: {
    required: true,
    type: String,
    index: true
  },
  imageId: {
    required: true,
    type: String
  },
  category: {
    required: true,
    type: String
  },
  startedAt: {
    required: true,
    type: Date
  },
  wonAt: {
    required: true,
    type: Date
  }
})

export const RewardModel =
  getConnection('learning').model<RewardEntity>('Reward', RewardSchema, 'rewards')
