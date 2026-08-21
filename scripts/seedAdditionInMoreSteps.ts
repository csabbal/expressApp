import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'

dotenv.config()

/**
 * Per learning.TaskTypes["additionInMoreSteps"].description: both terms must
 * be less than 10, and their sum must be greater than 10 and no greater than 19
 * (i.e. 11-19) so the problem actually requires shifting by 10. Terms are
 * restricted to 1-9 (see existing sample doc { term1: 9, term2: 8, result: 17 }).
 */
interface AdditionDoc {
    term1: number
    term2: number
    result: number
}

function buildDocs(): AdditionDoc[] {
    const docs: AdditionDoc[] = []
    for (let term1 = 1; term1 <= 9; term1++) {
        for (let term2 = 1; term2 <= 9; term2++) {
            const result = term1 + term2
            if (result > 10 && result <= 19) {
                docs.push({ term1, term2, result })
            }
        }
    }
    return docs
}

async function seed() {
    if (!process.argv.includes('--yes')) {
        console.error('This will DELETE ALL documents in learning.additionInMoreSteps and re-seed it.')
        console.error('Re-run with --yes to confirm, e.g. npm run seed:additionInMoreSteps -- --yes')
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

    const collection = client.db('learning').collection<AdditionDoc>('additionInMoreSteps')

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
        console.error('Failed to seed additionInMoreSteps:', err)
        process.exit(1)
    })
