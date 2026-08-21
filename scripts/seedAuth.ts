import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'

dotenv.config()

/**
 * Snapshot of the auth db's real dev data (users/permissions/userpermissions),
 * as it existed before the auth/movie database split. Field shapes are kept
 * exactly as stored today - e.g. permission ids are numbers, not the uuid
 * strings IEntity elsewhere expects, and userpermissions documents have no
 * top-level `id` field - rather than "corrected" to match the current schema.
 */
interface PermissionDoc {
    id: number
    component: string
    privilege: string
}

interface UserPermissionsDoc {
    userId: string
    permissions: PermissionDoc[]
}

interface UserDoc {
    id: string
    googleId?: string
    name: string
    fullName: string
    email: string
    jwtSecureCode: string
    password?: string
}

const permissions: PermissionDoc[] = [
    { id: 1, component: 'all', privilege: 'read' },
    { id: 2, component: 'all', privilege: 'write' }
]

const userPermissions: UserPermissionsDoc[] = [
    {
        userId: '7a58a862-7a9d-4882-9e4c-2384fc83bf57',
        permissions: [
            { id: 1, component: 'all', privilege: 'read' },
            { id: 2, component: 'all', privilege: 'write' }
        ]
    },
    {
        userId: '0f51988c-2a0c-4942-b63d-436a327a6457',
        permissions: [
            { id: 2, component: 'invoices', privilege: 'read' },
            { id: 2, component: 'invoices', privilege: 'write' },
            { id: 3, component: 'movie', privilege: 'read' },
            { id: 4, component: 'movie', privilege: 'write' },
            { id: 5, component: 'file', privilege: 'read' },
            { id: 6, component: 'file', privilege: 'write' }
        ]
    }
]

const users: UserDoc[] = [
    {
        id: '7a58a862-7a9d-4882-9e4c-2384fc83bf56',
        googleId: '103806383530174973574',
        name: 'Balázs Csabán',
        fullName: 'Balázs Csabán',
        email: 'bcsaban@admin.com',
        jwtSecureCode: 'e32cec62-1b9a-44a0-9eb6-a9cb475cb484'
    },
    {
        id: '7a58a862-7a9d-4882-9e4c-2384fc83bf57',
        googleId: '103806383530174973574',
        name: 'admin',
        fullName: 'admin admin',
        email: 'csabanbalazs@admin.com',
        jwtSecureCode: 'e32cec62-1b9a-44a0-9eb6-a9cb475cb484',
        password: '$2b$10$nrMCz4gJNCci2JIThuEvLedK84V81Lc4OMEESqA2lDuR8qAfRgMHC'
    },
    {
        id: 'd8a3c4f1-7f8f-4f7e-bd04-5db9f3160ed3',
        name: 'adminUser',
        fullName: 'adminUser',
        email: 'admin@admin.com',
        jwtSecureCode: 'c79be0b0-36a6-4d8a-bf2f-2f1902f49e66',
        password: '$2b$10$ZgPIoJiM6zCivutp9YMmkuQVPoc2a6oeCkD4LX7D7/uljkE4uHYCy'
    },
    {
        id: '0f51988c-2a0c-4942-b63d-436a327a6457',
        name: 'csabanbalazs@gmail.com',
        fullName: 'csabanbalazs@gmail.com',
        email: 'csabanbalazs@gmail.com',
        jwtSecureCode: '6e0f28a4-9013-44ff-ad10-42b33b5147fb',
        password: '$2b$10$H.xh9UZwqyd.F6DEM0ArMO9pHVhjKhzxpI0e95z11vuTwkl6Ao1QC'
    }
]

async function seed() {
    if (!process.argv.includes('--yes')) {
        console.error('This will DELETE ALL documents in auth.users/permissions/userpermissions and re-seed them.')
        console.error('Re-run with --yes to confirm, e.g. npm run seed:auth -- --yes')
        process.exit(1)
    }

    const {
        AUTH_DB_HOST: host = 'localhost',
        AUTH_DB_PORT: port = '27017',
        AUTH_DB_USERNAME: user,
        AUTH_DB_PASSWORD: password,
        AUTH_DB_DATABASE: database = 'auth'
    } = process.env

    const client = new MongoClient(`mongodb://${user}:${password}@${host}:${port}`)
    await client.connect()
    const db = client.db(database)

    const collections: [string, unknown[]][] = [
        ['permissions', permissions],
        ['userpermissions', userPermissions],
        ['users', users]
    ]

    for (const [name, docs] of collections) {
        const collection = db.collection(name)
        const { deletedCount } = await collection.deleteMany({})
        console.log(`${name}: deleted ${deletedCount} existing document(s).`)
        const { insertedCount } = await collection.insertMany(docs as object[])
        console.log(`${name}: inserted ${insertedCount} document(s).`)
    }

    await client.close()
}

seed()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Failed to seed auth:', err)
        process.exit(1)
    })
