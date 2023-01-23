import db from '../db.js'

export const giveRole = async (req, res, user_id, roleKey) => {
	try {
		const user = await db.query('SELECT * FROM person WHERE id=$1', [user_id])
		if (user.rows.length === 0) {
			return res.status(404).json({
				statusCode: 404,
				message: `Пользователь не найден`,
			})
		}
		const role = await db.query('SELECT * FROM roles WHERE value=$1', [roleKey])
		if (role.rows.length === 0) {
			return res.status(404).json({
				statusCode: 404,
				message: `Такой роли не существует`,
			})
		}
		const role_id = role.rows[0].id
		const role_key = role.rows[0].value
		const validUser = await db.query(
			'SELECT * FROM user_roles INNER JOIN roles ON roles.id = user_roles.role_id WHERE user_id=$1 AND roles.value=$2',
			[user_id, role_key]
		)
		if (validUser.rows.length > 0) {
			return res.status(405).json({
				statusCode: 405,
				message: `Пользователь уже имеет роль ${role.rows[0].description}`,
			})
		}
		const insertRole = await db.query(
			'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) RETURNING *',
			[user_id, role_id]
		)
		return res.status(200).json({
			statusCode: 200,
			message: `Роль ${role.rows[0].description} успешно выдана!`,
			insertRole,
		})
	} catch (e) {
		console.log(e)
	}
}
