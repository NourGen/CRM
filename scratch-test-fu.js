const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bsa_crm'
    });
    
    console.log('Connected successfully!');
    
    // Get all leads with status in follow up, need follow, delayed
    const [leads] = await connection.query(`
      SELECT l.id, l.name, l.status, l.follow_up_date, u.name as agent_name, u.active as agent_active
      FROM my_leads l
      LEFT JOIN users u ON l.agent_id = u.id
    `);
    
    console.log('Total leads: %d', leads.length);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const fuActions = ["follow up", "need follow", "delayed"];
    
    let totalFu = 0;
    let dueOrOverdueFu = 0;
    let dueOrOverdueFuActiveAgent = 0;
    
    leads.forEach(l => {
      const act = (l.status || "").toLowerCase().trim();
      const isFu = fuActions.some(x => act.includes(x));
      if (!isFu) return;
      if (!l.follow_up_date) return;
      
      totalFu++;
      
      const fuDay = new Date(l.follow_up_date);
      fuDay.setHours(0, 0, 0, 0);
      const diff = Math.round((fuDay.getTime() - today.getTime()) / 86400000);
      
      const isDueOrOverdue = diff <= 0;
      if (isDueOrOverdue) {
        dueOrOverdueFu++;
        if (l.agent_active) {
          dueOrOverdueFuActiveAgent++;
          console.log(`- ${l.name} | Status: ${l.status} | Date: ${l.follow_up_date} | Agent: ${l.agent_name} (Active: ${l.agent_active})`);
        }
      }
    });
    
    console.log('Total follow-ups: %d', totalFu);
    console.log('Due/Overdue follow-ups: %d', dueOrOverdueFu);
    console.log('Due/Overdue follow-ups with active agents: %d', dueOrOverdueFuActiveAgent);
    
    await connection.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
