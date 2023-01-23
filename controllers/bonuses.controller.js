import db from '../db.js'
import tokenService from '../utils/token-service.js'

class BonusesController {
	async setBonuses(req, res) {
		try {
			if (req.body.bonuses < 0) {
				return res.json({
					message: `Нельзя установить отрицательный баланс бонусов.`,
				})
			}
			if (!Number(req.body.bonuses)) {
				return res.json({
					message: `Пожалуйста, введите числовое значение.`,
				})
			}
			const token = (req.headers.authorization || '').replace(/Bearer\s?/, '')
			const userData = tokenService.validateAccessToken(token)
			const ownerId = userData.id
			const userId = req.params.id
			const owner = await db.query(`SELECT * FROM person WHERE id=$1`, [
				ownerId,
			])
			const updateBonuses = await db.query(
				`UPDATE person SET bonuses = $1 WHERE id = $2 RETURNING *`,
				[req.body.bonuses, userId]
			)
			if (updateBonuses.rows.length === 0) {
				return res.json({
					message: 'Такого пользователя не существует',
				})
			}
			return res.status(200).json({
				message: `Пользователь ${owner.rows[0].name} ${owner.rows[0].surname} изменил количество бонусов лояльности на ${req.body.bonuses} пользователю ${updateBonuses.rows[0].name} ${updateBonuses.rows[0].surname}. Теперь его баланс равен - ${updateBonuses.rows[0].bonuses}`,
				result: updateBonuses.rows,
			})
		} catch (e) {
			console.log(e)
		}
	}
	async giveBonuses(req, res) {
		try {
			const token = (req.headers.authorization || '').replace(/Bearer\s?/, '')
			const userData = tokenService.validateAccessToken(token)
			const ownerId = userData.id
			const userId = req.params.id
			const owner = await db.query(`SELECT * FROM person WHERE id=$1`, [
				ownerId,
			])
			const user = await db.query(`SELECT * FROM person WHERE id = $1`, [
				userId,
			])
			if (req.body.bonuses <= 0) {
				return res.json({
					message: `Количество бонусов для выдачи должно быть больше 0.`,
				})
			}
			if (!Number(req.body.bonuses)) {
				return res.json({
					message: `Пожалуйста, введите числовое значение.`,
				})
			}
			const updateBonuses = await db.query(
				`UPDATE person SET bonuses = $1 WHERE id = $2 RETURNING *`,
				[(user.rows[0].bonuses += req.body.bonuses), userId]
			)
			if (updateBonuses.rows[0].bonuses < 0) {
				const notZero = await db.query(
					`UPDATE person SET bonuses = $1 WHERE id = $2 RETURNING *`,
					[0, userId]
				)
				updateBonuses.rows[0].bonuses = 0
			}
			return res.status(200).json({
				message: `Пользователь ${owner.rows[0].name} ${owner.rows[0].surname} выдал ${req.body.bonuses} бонусов лояльности пользователю ${user.rows[0].name} ${user.rows[0].surname}. Теперь его баланс равен - ${updateBonuses.rows[0].bonuses}`,
				result: updateBonuses.rows,
			})
		} catch (e) {
			console.log(e)
		}
	}
}

export default new BonusesController()
