import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import { initDataSource } from '../src/providers/data'
import { MovieModel } from '../src/entities/Movie.schema'
import { MovieEntity } from '../src/types/Movie'

dotenv.config()

/**
 * 50 critically acclaimed films (IMDb Top 250 / Sight & Sound style consensus)
 * used to seed the movies collection. `image` is left null — there is no
 * uploaded file backing these records, unlike movies created via the API.
 */
type MovieSeed = Omit<MovieEntity, 'id' | 'image'>

const topMovies: MovieSeed[] = [
    { title: 'The Godfather', description: 'The aging patriarch of an organized crime dynasty transfers control to his reluctant son.', releaseDate: '1972-03-24', rating: 9.2, genre: 'Crime', duration: '175 min', director: 'Francis Ford Coppola' },
    { title: 'The Godfather Part II', description: 'The early life of Vito Corleone and the continuing saga of his son Michael.', releaseDate: '1974-12-20', rating: 9.0, genre: 'Crime', duration: '202 min', director: 'Francis Ford Coppola' },
    { title: 'The Shawshank Redemption', description: 'Two imprisoned men bond over years, finding solace and redemption through acts of common decency.', releaseDate: '1994-10-14', rating: 9.3, genre: 'Drama', duration: '142 min', director: 'Frank Darabont' },
    { title: 'The Dark Knight', description: 'Batman faces the Joker, a criminal mastermind who plunges Gotham into anarchy.', releaseDate: '2008-07-18', rating: 9.0, genre: 'Action', duration: '152 min', director: 'Christopher Nolan' },
    { title: '12 Angry Men', description: 'A jury holdout attempts to prevent a miscarriage of justice by forcing his colleagues to reconsider the evidence.', releaseDate: '1957-04-10', rating: 9.0, genre: 'Drama', duration: '96 min', director: 'Sidney Lumet' },
    { title: "Schindler's List", description: 'A businessman gradually becomes concerned for his Jewish workforce during the Holocaust.', releaseDate: '1993-12-15', rating: 9.0, genre: 'Drama', duration: '195 min', director: 'Steven Spielberg' },
    { title: 'The Lord of the Rings: The Return of the King', description: "Gandalf and Aragorn lead the World of Men against Sauron's army to save the Ring bearer.", releaseDate: '2003-12-17', rating: 9.0, genre: 'Fantasy', duration: '201 min', director: 'Peter Jackson' },
    { title: 'Pulp Fiction', description: 'The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in tales of violence and redemption.', releaseDate: '1994-10-14', rating: 8.9, genre: 'Crime', duration: '154 min', director: 'Quentin Tarantino' },
    { title: 'The Good, the Bad and the Ugly', description: 'A bounty hunting scam brings together three men in the American Southwest during the Civil War.', releaseDate: '1966-12-23', rating: 8.8, genre: 'Western', duration: '178 min', director: 'Sergio Leone' },
    { title: 'Forrest Gump', description: 'The presidencies of Kennedy and Johnson through the eyes of an Alabama man with an IQ of 75.', releaseDate: '1994-07-06', rating: 8.8, genre: 'Drama', duration: '142 min', director: 'Robert Zemeckis' },
    { title: 'Fight Club', description: 'An insomniac office worker and a soap maker form an underground fight club that evolves into something much more.', releaseDate: '1999-10-15', rating: 8.8, genre: 'Drama', duration: '139 min', director: 'David Fincher' },
    { title: 'Inception', description: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea.', releaseDate: '2010-07-16', rating: 8.8, genre: 'Science Fiction', duration: '148 min', director: 'Christopher Nolan' },
    { title: 'The Matrix', description: 'A computer hacker learns that reality as he knows it is a simulation, and joins a rebellion to break free.', releaseDate: '1999-03-31', rating: 8.7, genre: 'Science Fiction', duration: '136 min', director: 'Lana Wachowski, Lilly Wachowski' },
    { title: 'Goodfellas', description: "The story of Henry Hill and his life in the mob, spanning the years 1955 to 1980.", releaseDate: '1990-09-19', rating: 8.7, genre: 'Crime', duration: '146 min', director: 'Martin Scorsese' },
    { title: "One Flew Over the Cuckoo's Nest", description: 'A criminal pleads insanity and is admitted to a mental institution, where he rebels against the oppressive head nurse.', releaseDate: '1975-11-19', rating: 8.7, genre: 'Drama', duration: '133 min', director: 'Milos Forman' },
    { title: 'Se7en', description: 'Two detectives hunt a serial killer who uses the seven deadly sins as his motives.', releaseDate: '1995-09-22', rating: 8.6, genre: 'Thriller', duration: '127 min', director: 'David Fincher' },
    { title: 'City of God', description: 'Two boys growing up in a violent Rio de Janeiro favela take different paths in life.', releaseDate: '2002-08-30', rating: 8.6, genre: 'Crime', duration: '130 min', director: 'Fernando Meirelles, Katia Lund' },
    { title: "It's a Wonderful Life", description: 'An angel is sent to help a desperately frustrated businessman by showing him what life would be like if he had never existed.', releaseDate: '1946-12-20', rating: 8.6, genre: 'Drama', duration: '130 min', director: 'Frank Capra' },
    { title: 'Life Is Beautiful', description: 'A Jewish father uses humor to shield his son from the horrors of a Nazi concentration camp.', releaseDate: '1997-12-20', rating: 8.6, genre: 'Drama', duration: '116 min', director: 'Roberto Benigni' },
    { title: 'The Silence of the Lambs', description: 'A young FBI trainee seeks the help of an imprisoned cannibalistic killer to catch another serial killer.', releaseDate: '1991-02-14', rating: 8.6, genre: 'Thriller', duration: '118 min', director: 'Jonathan Demme' },
    { title: 'Saving Private Ryan', description: 'Following the Normandy landings, a group of soldiers go behind enemy lines to retrieve a paratrooper.', releaseDate: '1998-07-24', rating: 8.6, genre: 'War', duration: '169 min', director: 'Steven Spielberg' },
    { title: 'Interstellar', description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.', releaseDate: '2014-11-07', rating: 8.7, genre: 'Science Fiction', duration: '169 min', director: 'Christopher Nolan' },
    { title: 'The Green Mile', description: 'The lives of guards on death row are affected by one of their charges, a black man convicted of a brutal crime yet who has a mysterious gift.', releaseDate: '1999-12-10', rating: 8.6, genre: 'Drama', duration: '189 min', director: 'Frank Darabont' },
    { title: 'Star Wars: Episode V - The Empire Strikes Back', description: 'After the rebels are overpowered by the Empire, Luke Skywalker begins Jedi training with Yoda.', releaseDate: '1980-05-21', rating: 8.7, genre: 'Science Fiction', duration: '124 min', director: 'Irvin Kershner' },
    { title: 'Terminator 2: Judgment Day', description: 'A cyborg is reprogrammed to protect a young boy who is destined to lead humanity against machines.', releaseDate: '1991-07-03', rating: 8.6, genre: 'Action', duration: '137 min', director: 'James Cameron' },
    { title: 'Back to the Future', description: "A teenager is accidentally sent thirty years into the past in a time-traveling DeLorean.", releaseDate: '1985-07-03', rating: 8.5, genre: 'Science Fiction', duration: '116 min', director: 'Robert Zemeckis' },
    { title: 'Spirited Away', description: "A young girl wanders into a world ruled by gods and witches, where humans are changed into beasts.", releaseDate: '2001-07-20', rating: 8.6, genre: 'Animation', duration: '125 min', director: 'Hayao Miyazaki' },
    { title: 'Parasite', description: 'Greed and class discrimination threaten the newly formed symbiotic relationship between a wealthy family and a poor one.', releaseDate: '2019-05-30', rating: 8.5, genre: 'Drama', duration: '132 min', director: 'Bong Joon Ho' },
    { title: 'Whiplash', description: 'A promising young drummer enrolls at a cutthroat music conservatory under the direction of an abusive instructor.', releaseDate: '2014-10-10', rating: 8.5, genre: 'Drama', duration: '106 min', director: 'Damien Chazelle' },
    { title: 'The Prestige', description: 'Two stage magicians engage in a battle to create the ultimate illusion, becoming obsessed with one-upping each other.', releaseDate: '2006-10-20', rating: 8.5, genre: 'Drama', duration: '130 min', director: 'Christopher Nolan' },
    { title: 'The Departed', description: 'An undercover cop and a mole in the police attempt to identify each other while infiltrating an Irish gang in Boston.', releaseDate: '2006-10-06', rating: 8.5, genre: 'Crime', duration: '151 min', director: 'Martin Scorsese' },
    { title: 'Gladiator', description: 'A former Roman general seeks revenge against the corrupt emperor who murdered his family and sent him into slavery.', releaseDate: '2000-05-05', rating: 8.5, genre: 'Action', duration: '155 min', director: 'Ridley Scott' },
    { title: 'The Lion King', description: 'A lion cub crown prince flees his kingdom after his father is murdered, and must learn to reclaim his throne.', releaseDate: '1994-06-24', rating: 8.5, genre: 'Animation', duration: '88 min', director: 'Roger Allers, Rob Minkoff' },
    { title: 'American History X', description: 'A former neo-nazi tries to prevent his younger brother from going down the same path he did.', releaseDate: '1998-10-30', rating: 8.5, genre: 'Drama', duration: '119 min', director: 'Tony Kaye' },
    { title: 'The Pianist', description: 'A Polish Jewish musician struggles to survive the destruction of the Warsaw ghetto during World War II.', releaseDate: '2002-09-24', rating: 8.5, genre: 'Drama', duration: '150 min', director: 'Roman Polanski' },
    { title: 'Casablanca', description: 'A cynical American expatriate struggles to decide whether or not to help his former lover and her fugitive husband escape French Morocco.', releaseDate: '1942-11-26', rating: 8.5, genre: 'Drama', duration: '102 min', director: 'Michael Curtiz' },
    { title: 'Django Unchained', description: 'A freed slave sets out to rescue his wife from a brutal Mississippi plantation owner.', releaseDate: '2012-12-25', rating: 8.4, genre: 'Western', duration: '165 min', director: 'Quentin Tarantino' },
    { title: 'The Usual Suspects', description: 'A sole survivor tells the twisty events leading up to a horrific gun battle on a boat, which began when five criminals met at a seemingly random police lineup.', releaseDate: '1995-08-16', rating: 8.5, genre: 'Crime', duration: '106 min', director: 'Bryan Singer' },
    { title: 'Léon: The Professional', description: 'A hitman mentors a young girl seeking revenge after her family is murdered by a corrupt DEA agent.', releaseDate: '1994-09-14', rating: 8.5, genre: 'Crime', duration: '110 min', director: 'Luc Besson' },
    { title: 'Modern Times', description: 'The Tramp struggles to live in modern industrial society with the help of a young homeless woman.', releaseDate: '1936-02-25', rating: 8.5, genre: 'Comedy', duration: '87 min', director: 'Charles Chaplin' },
    { title: 'Psycho', description: 'A secretary on the run stops at a motel run by a young man under the domination of his mother.', releaseDate: '1960-09-08', rating: 8.5, genre: 'Horror', duration: '109 min', director: 'Alfred Hitchcock' },
    { title: 'City Lights', description: "A tramp falls in love with a blind flower girl and pledges to raise money for an operation to restore her sight.", releaseDate: '1931-01-30', rating: 8.5, genre: 'Comedy', duration: '87 min', director: 'Charles Chaplin' },
    { title: 'Rear Window', description: 'A wheelchair-bound photographer spies on his neighbors and becomes convinced one of them has committed murder.', releaseDate: '1954-09-01', rating: 8.5, genre: 'Mystery', duration: '112 min', director: 'Alfred Hitchcock' },
    { title: 'Alien', description: 'The crew of a commercial spacecraft encounter a deadly lifeform after investigating a mysterious signal.', releaseDate: '1979-05-25', rating: 8.5, genre: 'Horror', duration: '117 min', director: 'Ridley Scott' },
    { title: 'Apocalypse Now', description: 'A U.S. Army officer is sent on a dangerous mission into Cambodia to assassinate a renegade colonel.', releaseDate: '1979-08-15', rating: 8.4, genre: 'War', duration: '147 min', director: 'Francis Ford Coppola' },
    { title: 'Memento', description: 'A man with short-term memory loss uses notes and tattoos to hunt for the man he thinks killed his wife.', releaseDate: '2000-10-11', rating: 8.4, genre: 'Mystery', duration: '113 min', director: 'Christopher Nolan' },
    { title: 'Raiders of the Lost Ark', description: 'Archaeologist and adventurer Indiana Jones is hired to locate the Ark of the Covenant before Nazi forces can obtain it.', releaseDate: '1981-06-12', rating: 8.4, genre: 'Adventure', duration: '115 min', director: 'Steven Spielberg' },
    { title: '2001: A Space Odyssey', description: 'After discovering a mysterious artifact, a spacecraft is sent to Jupiter with a sentient computer at its helm.', releaseDate: '1968-04-02', rating: 8.3, genre: 'Science Fiction', duration: '149 min', director: 'Stanley Kubrick' },
    { title: 'Amadeus', description: "The life, success and troubles of Wolfgang Amadeus Mozart, told by his peer and secret rival Antonio Salieri.", releaseDate: '1984-09-19', rating: 8.4, genre: 'Drama', duration: '160 min', director: 'Milos Forman' },
    { title: 'Toy Story', description: "A cowboy doll is threatened by a new spaceman action figure toy that becomes his owner's new favorite.", releaseDate: '1995-11-22', rating: 8.3, genre: 'Animation', duration: '81 min', director: 'John Lasseter' },
]

async function seed() {
    if (!process.argv.includes('--yes')) {
        console.error('This will DELETE ALL movies and re-seed the collection. Re-run with --yes to confirm, e.g. npm run seed:movies -- --yes')
        process.exit(1)
    }

    const {
        DB_TYPE: type,
        DB_HOST: host,
        DB_PORT: port,
        DB_USERNAME: user,
        DB_PASSWORD: password,
        DB_DATABASE: database
    } = process.env

    await initDataSource({ type, host, port, user, password, database })

    const { deletedCount } = await MovieModel.deleteMany({})
    console.log(`Deleted ${deletedCount} existing movie(s).`)

    const seeded = await MovieModel.insertMany(
        topMovies.map(movie => ({ ...movie, id: uuidv4(), image: null }))
    )
    console.log(`Inserted ${seeded.length} movie(s).`)

    await mongoose.disconnect()
}

seed()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Failed to seed movies:', err)
        process.exit(1)
    })
