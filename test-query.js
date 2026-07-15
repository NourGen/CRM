const { DataSource } = require('typeorm');
const { Round } = require('./dist/academy/entities/round.entity');
const dotenv = require('dotenv');
dotenv.config();

const ds = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: 3306,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Round]
});

ds.initialize().then(async () => {
  const rounds = await ds.getRepository(Round).find();
  rounds.forEach(r => console.log('ROUND:', r.name, '|| status:', r.status));
  process.exit(0);
});
