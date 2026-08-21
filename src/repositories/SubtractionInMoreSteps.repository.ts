
import { SubtractionInMoreStepsEntity } from '../types/SubtractionInMoreSteps'
import { Repository } from './Repository'

/**
 * This class is to take care about the handling of subtractionInMoreSteps practice items in the database
 */
export class SubtractionInMoreStepsRepository<
    T extends SubtractionInMoreStepsEntity = SubtractionInMoreStepsEntity
> extends Repository<T> {}


