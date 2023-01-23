import jwt from 'jsonwebtoken'
import db from '../db.js'
import tokenService from './token-service.js'

const checkAuthor = async (req, res, next) => {
	const postId = req.params.id
	const token = (req.headers.authorization || '').replace(/Bearer\s?/, '')

	try {
		if (token) {
			try {
				const userData = tokenService.validateAccessToken(token)
				const id = userData.id
				const admin = await db.query(
					`SELECT id, name, surname, role FROM person WHERE id=$1`,
					[id]
				)
				const editedPost = await db.query(`SELECT * FROM post WHERE id=$1`, [
					postId,
				])
				console.log(admin)
				if (
					admin.rows[0].role === 'Администратор' ||
					admin.rows[0].id === editedPost.rows[0].user_id
				) {
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

export default checkAuthor
