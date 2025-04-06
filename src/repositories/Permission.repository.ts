import { PermissionEntity } from "../types/Permission"
import { Repository } from "./Repository"


/**
 * This class is to take care about the handling of permissions in the database
 */
export class PermissionRepository<T extends PermissionEntity = PermissionEntity> extends Repository<T> {}


