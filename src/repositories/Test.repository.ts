import { TestEntity } from '../types/Test'
import { Repository } from './Repository'

export class TestRepository<T extends TestEntity = TestEntity> extends Repository<T> {}
