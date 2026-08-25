import { TaskFailureEntity } from '../types/TaskFailure'
import { Repository } from './Repository'

export class TaskFailureRepository<T extends TaskFailureEntity = TaskFailureEntity> extends Repository<T> {}
