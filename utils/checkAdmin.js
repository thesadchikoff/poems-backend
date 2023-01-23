import jwt from 'jsonwebtoken'
import db from '../db.js'
import tokenService from './token-service.js'

const checkAdmin = async (req, res, next) => {
	const token = (req.headers.authorization || '').replace(/Bearer\s?/, '')

	try {
		if (token) {
			try {
				const userData = tokenService.validateAccessToken(token)
				const role = userData.role
				console.log(role)
				if (role !== 'Администратор') {
					return res.status(406).json({
						message: 'Нет доступа',
					})
				}
				if (role === 'Администратор') {
					next()
				}
			} catch (e) {
				console.log(e)
				return res.status(403).json({
					message: 'Что-то пошло не так',
				})
			}
		} else {
			return res.status(406).json({
				message: 'Нет доступа!',
			})
		}
	} catch (e) {
		console.log(e)
		return res.status(406).json({
			message: 'Нет доступа!',
		})
	}
}

export default checkAdmin
