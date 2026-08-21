import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'

dotenv.config()

interface TaskTypeDoc {
    id: string
    subject: string
    name: string
    description: string
    rating: number
}

const taskTypes: Omit<TaskTypeDoc, 'id'>[] = [
    {
        subject: 'math',
        name: 'substractionInMoreSteps',
        description: 'Substraction in more steps to practice shifting by 10. the substractor should be ' +
            'less than 19, the reducer should be greater than the difference between 10 and the substractor',
        rating: 10
    },
    {
        subject: 'math',
        name: 'additionInMoreSteps',
        description: 'Addition in more steps to practice shifting by 10. The sum of the terms cannot be ' +
            'greater than 19, and both terms must be less than 10.',
        rating: 10
    }
]

async function seed() {
    if (!process.argv.includes('--yes')) {
        console.error('This will DELETE ALL documents in learning.TaskTypes and re-seed it.')
        console.error('Re-run with --yes to confirm, e.g. npm run seed:taskTypes -- --yes')
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

    const collection = client.db('learning').collection<TaskTypeDoc>('TaskTypes')

    const { deletedCount } = await collection.deleteMany({})
    console.log(`Deleted ${deletedCount} existing document(s).`)

    const docs = taskTypes.map(taskType => ({ id: uuidv4(), ...taskType }))
    const { insertedCount } = await collection.insertMany(docs)
    console.log(`Inserted ${insertedCount} document(s).`)

    await client.close()
}

seed()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Failed to seed TaskTypes:', err)
        process.exit(1)
    })
