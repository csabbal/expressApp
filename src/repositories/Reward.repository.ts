import { RewardEntity } from '../types/Reward'
import { Repository } from './Repository'

export class RewardRepository<T extends RewardEntity = RewardEntity> extends Repository<T> {}
