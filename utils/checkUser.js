import db from '../db.js'
const checkUser = async (req, res, next) => {
	const { email } = req.body
	const user = await db.query(`SELECT * FROM person WHERE email = $1`, [email])
	if (user.rows.length > 0) {
		if (user.rows[0].email === email) {
			return res.json({
				message: `Пользователь с таким email уже существует`,
			})
		}
	}
	next()
}

export default checkUser
