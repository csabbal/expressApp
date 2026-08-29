import { TaskSuccessEntity } from '../types/TaskSuccess'
import { Repository } from './Repository'

export class TaskSuccessRepository<T extends TaskSuccessEntity = TaskSuccessEntity> extends Repository<T> {}
