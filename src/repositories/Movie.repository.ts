
import { MovieEntity } from '../types/Movie'
import { Repository } from './Repository'

/**
 * This class is to take care about the handling of users in the database
 */
export class MovieRepository<T extends MovieEntity = MovieEntity> extends Repository<T> {}


