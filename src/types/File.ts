import { IEntity } from './repositories'

export interface FileEntity extends IEntity {
    originalName: string
    mimeType: string
    size: number
    isImage: boolean
    category: string | null
    originalPath: string
    lowQualityPath: string | null
    uploadedBy: string | null
    createdAt: Date
}
