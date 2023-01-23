import jwt from 'jsonwebtoken'
import db from '../db.js'
import tokenService from './token-service.js'

const checkOwnerAccount = async (req, res, next) => {
	const token = (req.headers.authorization || '').replace(/Bearer\s?/, '')
	try {
		if (token) {
			try {
				const userData = tokenService.validateAccessToken(token)
				const id = userData.id
				const user = await db.query(
					`SELECT id, name, surname, role FROM person WHERE id=$1`,
					[id]
				)

				if (user.rows[0].role === 'Администратор' || user.rows[0].id === id) {
					next()
				} else {
					return res.status(406).json({
						message: 'Нет доступа',
					})
				}
			} catch (e) {
				console.log(e)
				return res.status(403).json({
					message: 'Что-то пошло не так',
				})
			}
		} else {
			return res.status(406).json({
				message: 'Нет доступа',
			})
		}
	} catch (e) {
		console.log(e)
		return res.status(406).json({
			message: 'Нет доступа',
		})
	}
}

export default checkOwnerAccount
