import jwt from 'jsonwebtoken'

const checkBan = (req, res, next) => {
	const token = (req.headers.authorization || '').replace(/Bearer\s?/, '')
	const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
	const isBanned = (req.userId = decoded.banned)

	try {
		if (token) {
			if (isBanned) {
				return res.json({
					message:
						'Вы заблокированы администрацией. Функционал сайта ограничен.',
				})
			}
			next()
		} else {
			return res.json({
				message: 'Доступ ограничен',
			})
		}
	} catch (e) {
		console.log(e)
		res.json({
			message: 'Серверная ошибка приложения. Попробуйте позже',
		})
	}
}

export default checkBan
