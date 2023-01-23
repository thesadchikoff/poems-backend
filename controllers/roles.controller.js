import db from '../db.js'
import { giveRole } from '../utils/giveRole.js'
import { removeRole } from '../utils/removeRole.js'

class RolesController {
	async createRole(req, res) {
		try {
			const { value, description } = req.body
			const role = await db.query(
				`INSERT INTO roles (value, description) VALUES ($1, $2) RETURNING *`,
				[value, description]
			)
			res.status(200).json({
				result: role.rows[0],
			})
		} catch (e) {
			console.log(e)
			res.status(500).json({
				message: e,
			})
		}
	}
	async giveRoles(req, res) {
		try {
			const { user_id, role_key } = req.body
			giveRole(req, res, user_id, role_key)
		} catch (e) {
			console.log(e)
			res.status(500).json({
				message: `Error code ${e.code}. Серверная ошибка приложения, повторите попытку позже.`,
			})
		}
	}

	async removeRoles(req, res) {
		try {
			const { user_id, role_key } = req.body
			removeRole(req, res, user_id, role_key)
		} catch (e) {
			console.log(e)
			res.status(500).json({
				message: `Error code ${e.code}. Серверная ошибка приложения, повторите попытку позже.`,
			})
		}
	}
}

export default new RolesController()
