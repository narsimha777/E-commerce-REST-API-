const { Pool, Client } = require('pg');
 
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'E-COMMERCE',
  password: 'postgres',
  port: 5432,
})
 
const query = (text, params, callback) => {
  return pool.query(text, params, callback)
}

module.exports = {
  query: query
};

// const printpool = async()=>{
//   console.log(await pool.query('SELECT NOW()'))
// };

// printpool();

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'E-COMMERCE',
  password: 'postgres',
  port: 5432,
})
 
const printquery = async()=>{
  await client.connect()
  console.log(await client.query('SELECT NOW()'))
  await client.end()
};

printquery();
