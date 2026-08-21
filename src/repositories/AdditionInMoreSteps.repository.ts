
import { AdditionInMoreStepsEntity } from '../types/AdditionInMoreSteps'
import { Repository } from './Repository'

/**
 * This class is to take care about the handling of additionInMoreSteps practice items in the database
 */
export class AdditionInMoreStepsRepository<
    T extends AdditionInMoreStepsEntity = AdditionInMoreStepsEntity
> extends Repository<T> {}


