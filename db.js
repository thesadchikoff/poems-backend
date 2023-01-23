import pg from 'pg'
const { Pool } = pg
const pool = new Pool({
	user: 'postgres',
	password: 'qwerty123',
	host: 'localhost',
	port: 5432,
	database: 'node_postgres',
})

export default pool
