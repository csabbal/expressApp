
import { TaskTypeEntity } from '../types/TaskType'
import { Repository } from './Repository'

/**
 * This class is to take care about the handling of task types in the database
 */
export class TaskTypeRepository<T extends TaskTypeEntity = TaskTypeEntity> extends Repository<T> {}


