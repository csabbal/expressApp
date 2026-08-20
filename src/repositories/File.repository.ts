import { FileEntity } from '../types/File'
import { Repository } from './Repository'

/**
 * This class is to take care about the handling of uploaded file metadata in the database
 */
export class FileRepository<T extends FileEntity = FileEntity> extends Repository<T> {}
