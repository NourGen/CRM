const { DataSource } = require('typeorm');
const dotenv = require('dotenv');

// Import entities
const { AcademyLedger } = require('./dist/financial/entities/academy-ledger.entity');
const { Installment } = require('./dist/financial/entities/installment.entity');
const { User } = require('./dist/sales/entities/user.entity');

dotenv.config();

const ds = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: 3306,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [AcademyLedger, Installment, User]
});

async function run() {
  await ds.initialize();
  console.log('Database connected!');

  const users = await ds.getRepository(User).find();
  console.log('--- USERS IN DATABASE ---');
  users.forEach(u => {
    console.log(`User: ${u.name} | Email: ${u.email} | Role: ${u.role}`);
  });

  const ledgerRows = await ds.getRepository(AcademyLedger).find();
  const distinctEmails = [...new Set(ledgerRows.map(r => r.salesAgentEmail))];
  console.log('\n--- DISTINCT AGENT EMAILS IN LEDGER ---');
  distinctEmails.forEach(email => {
    console.log(`Agent Email in Ledger: "${email}"`);
  });

  await ds.destroy();
}

run().catch(console.error);
