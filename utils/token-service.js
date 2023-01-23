import db from './../db.js'
import jwt from 'jsonwebtoken'

class TokenService {
	generateTokens(payload) {
		const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
			expiresIn: '15d',
		})
		const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
			expiresIn: '30d',
		})
		return {
			accessToken,
			refreshToken,
		}
	}
	validateAccessToken(token) {
		try {
			const userData = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
			console.log(userData)
			return userData
		} catch (e) {
			console.log(e)
			return null
		}
	}
	validateRefreshToken(token) {
		try {
			const userData = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
			return userData
		} catch (e) {
			console.log(e)
			return null
		}
	}
	async saveToken(userId, refreshToken) {
		const tokenData = await db.query('SELECT * FROM tokens WHERE user_id=$1', [
			userId,
		])
		if (tokenData.rows[0]) {
			return await db.query(
				'UPDATE tokens SET token = $1 WHERE user_id=$2 RETURNING *',
				[refreshToken, userId]
			)
		}
		const token = await db.query(
			'INSERT INTO tokens (user_id, token) VALUES ($1, $2) RETURNING *',
			[userId, refreshToken]
		)
	}

	async removeToken(refreshToken) {
		const tokenData = await db.query('DELETE FROM tokens WHERE token=$1', [
			refreshToken,
		])
		return tokenData
	}

	async findToken(refreshToken) {
		const tokenData = await db.query('SELECT * FROM tokens WHERE token=$1', [
			refreshToken,
		])
		return tokenData
	}
}

export default new TokenService()
