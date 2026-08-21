import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'

dotenv.config()

/**
 * Per learning.TaskTypes["substractionInMoreSteps"].description: the
 * substractor must be less than 19, and the reducer must be greater than
 * the difference between the substractor and 10 - i.e. reducer > substractor - 10.
 * This is the inverse of additionInMoreSteps: substractor is a two-digit sum
 * (11-18), reducer is a single digit (1-9) large enough that subtracting it
 * requires shifting through 10 (see existing sample doc
 * { substractor: 17, reducer: 8, result: 9 }: 17 - 10 = 7, and 8 > 7).
 */
interface SubtractionDoc {
    id: string
    substractor: number
    reducer: number
    result: number
}

function buildDocs(): SubtractionDoc[] {
    const docs: SubtractionDoc[] = []
    for (let substractor = 11; substractor < 19; substractor++) {
        for (let reducer = 1; reducer <= 9; reducer++) {
            if (reducer > substractor - 10) {
                docs.push({ id: uuidv4(), substractor, reducer, result: substractor - reducer })
            }
        }
    }
    return docs
}

async function seed() {
    if (!process.argv.includes('--yes')) {
        console.error('This will DELETE ALL documents in learning.substructionInMoreSteps and re-seed it.')
        console.error('Re-run with --yes to confirm, e.g. npm run seed:substructionInMoreSteps -- --yes')
        process.exit(1)
    }

    const {
        DB_HOST: host = 'localhost',
        DB_PORT: port = '27017',
        DB_USERNAME: user,
        DB_PASSWORD: password
    } = process.env

    const client = new MongoClient(`mongodb://${user}:${password}@${host}:${port}`)
    await client.connect()

    const collection = client.db('learning').collection<SubtractionDoc>('substructionInMoreSteps')

    const { deletedCount } = await collection.deleteMany({})
    console.log(`Deleted ${deletedCount} existing document(s).`)

    const docs = buildDocs()
    const { insertedCount } = await collection.insertMany(docs)
    console.log(`Inserted ${insertedCount} document(s).`)

    await client.close()
}

seed()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Failed to seed substructionInMoreSteps:', err)
        process.exit(1)
    })
