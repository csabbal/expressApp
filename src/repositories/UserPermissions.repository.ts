import { UserPermissionsEntity } from "../types/Permission"
import { Repository } from "./Repository"


/**
 * This class is to take care about the handling of user permissions in the database
 */
export class UserPermissionsRepository<T extends UserPermissionsEntity = UserPermissionsEntity> extends Repository<T> {}

