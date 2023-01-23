import tokenService from './token-service.js'

const checkAuth = async (req, res, next) => {
	try {
		const authorizationHeader = req.headers.authorization
		if (!authorizationHeader) {
			return res.status(401).json({
				message: 'Вы не авторизованы!',
			})
		}
		const accessToken = authorizationHeader.split(' ')[1]
		if (!accessToken) {
			return res.status(401).json({
				message: 'Вы не авторизованы *_*',
			})
		}
		const userData = await tokenService.validateAccessToken(accessToken)
		if (!userData || userData == null) {
			return res.status(401).json({
				message: 'Вы не авторизованы :C',
			})
		}
		req.userId = userData.id
		req.user = userData
		next()
	} catch (e) {
		return res.status(401).json({
			message: 'Вы не авторизованы :)',
		})
	}
}

export default checkAuth
