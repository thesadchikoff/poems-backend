import db from '../db.js'
import jwt from 'jsonwebtoken'
import bc from 'bcrypt'
import { giveRole } from '../utils/giveRole.js'
import mailService from '../utils/mail-service.js'
import 'uuid'
import { config } from '../config/config.js'
import { v4 as uuidv4 } from 'uuid'
import tokenService from '../utils/token-service.js'
import { UserDto } from '../dtos/user-dto.js'
import { validationResult } from 'express-validator'

class UserController {
	async createUser(req, res) {
		try {
			const errors = validationResult(req)
			if (!errors.isEmpty()) {
				return res.status(400).json({
					message: 'Ошибка при валидации формы',
					errors,
				})
			}
			const { name, surname, email, password } = req.body
			const salt = await bc.genSalt(10)
			const hash = await bc.hash(password, salt)
			console.log(`HASH - ${hash}`)
			const defaultValues = {
				banned: false,
				bonuses: 0,
			}
			const defaultRole = await db.query('SELECT * FROM roles WHERE value=$1', [
				'USER',
			])
			console.log(process.env.SMTP_USER)
			const activationLink = uuidv4()
			const newPerson = await db.query(
				`INSERT INTO person (name, surname, email, banned, password, bonuses, activate_code, role) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
				[
					name,
					surname,
					email,
					defaultValues.banned,
					hash,
					defaultValues.bonuses,
					activationLink,
					defaultRole.rows[0].description,
				]
			)
			const user = await db.query(`SELECT * FROM person WHERE email = $1`, [
				email,
			])
			const userDto = new UserDto(user.rows[0])
			const tokens = tokenService.generateTokens({ ...userDto })
			console.log(userDto.id)
			await tokenService.saveToken(userDto.id, tokens.refreshToken)
			await mailService.sendActivationMail(
				email,
				`${config.API_URL}/api/activate/${activationLink}`
			)
			await mailService.sendWelcomeMail(
				email,
				user.rows[0].name,
				`${config.API_URL}/api/present/${activationLink}`
			)
			let userArray = []
			let userObject = {}
			user.rows.forEach(element => {
				userObject = {}
				userObject.id = element.id
				userObject.name = element.name
				userObject.surname = element.surname
				userObject.email = element.email
				userObject.bonuses = element.bonuses
				userArray.push(userObject)
			})
			res.cookie('refreshToken', tokens.refreshToken, {
				maxAge: 30 * 24 * 60 * 60 * 1000,
				httpOnly: true,
			})
			return res.json({
				...tokens,
				user: userDto,
			})
		} catch (e) {
			console.log(e)
			return res.json({
				message: 'Серверная ошибка. Повторите попытку позже.',
			})
		}
	}

	async activate(activationLink) {
		const user = await db.query(
			'SELECT activate_code FROM person whete activate_code=$1',
			[activationLink]
		)
		if (user) {
			return res.redirect(
				'https://dzen.ru/?yredirect=true&clid=2353474-306&win=463'
			)
		}

		return res.json({
			message: 'Не верная ссылка активации почты.',
		})
	}

	async present(activationLink) {
		const user = await db.query(
			'SELECT activate_code FROM person whete activate_code=$1',
			[activationLink]
		)
		if (user) {
			return res.redirect(
				'https://dzen.ru/?yredirect=true&clid=2353474-306&win=463'
			)
		}

		return res.json({
			message: 'Не верная ссылка активации почты.',
		})
	}

	async userLogin(req, res) {
		try {
			const { email, password } = req.body
			const user = await db.query(`SELECT * FROM person WHERE email = $1`, [
				email,
			])
			if (user.rows[0]) {
				const isValidPassword = await bc.compare(
					password,
					user.rows[0].password
				)
				if (!isValidPassword) {
					return res.status(400).json({
						message: 'Неверный логин или пароль',
					})
				}
				const userDto = new UserDto(user.rows[0])
				const tokens = tokenService.generateTokens({ ...userDto })
				await tokenService.saveToken(userDto.id, tokens.refreshToken)
				let userArray = []
				let userObject = {}
				user.rows.forEach(element => {
					userObject = {}
					userObject.id = element.id
					userObject.name = element.name
					userObject.surname = element.surname
					userObject.fullname = element.name + ' ' + element.surname
					userObject.email = element.email
					userObject.bonuses = element.bonuses
					userObject.role = element.role
					userArray.push(userObject)
				})
				res.cookie('refreshToken', tokens.refreshToken, {
					maxAge: 30 * 24 * 60 * 60 * 1000,
					httpOnly: true,
				})
				return res.json({ ...tokens, user: userDto })
			} else {
				res.status(404).json({
					message: `Ошибка авторизации. Повторите попытку снова.`,
				})
			}
		} catch (e) {
			console.log(e)
			res.status(500).json({
				message: `Серверная ошибка приложения. Повторите попытку позже!`,
			})
		}
	}

	async getMe(req, res) {
		try {
			const user = await db.query('SELECT * FROM person WHERE id=$1', [
				req.userId,
			])
			const userDto = new UserDto(user.rows[0])
			return res.status(200).json(user.rows[0])
		} catch (e) {
			return res.status(500).json({
				message: 'Не авторизован',
			})
		}
	}

	async logout(req, res) {
		try {
			const { refreshToken } = req.cookies
			const token = await tokenService.removeToken(refreshToken)
			res.clearCookie('refreshToken')
			return res.status(200).json(token.rows[0])
		} catch (e) {
			console.log(e)
			res.status(500).json({
				message: 'Внутрення ошибка сервера. Повторите попытку позже',
			})
		}
	}

	async refresh(req, res) {
		try {
			const { refreshToken } = req.cookies
			if (!refreshToken) {
				return res.status(401).json({
					message: 'Вы не авторизованы!',
				})
			}
			const userData = tokenService.validateRefreshToken(refreshToken)
			const tokenFromDb = tokenService.findToken(refreshToken)
			if (!userData || !(await tokenFromDb).rows) {
				return res.status(401).json({
					message: 'Вы не авторизованы :c',
				})
			}
			const user = await db.query('SELECT * FROM person WHERE id=$1', [
				userData.id,
			])
			const userDto = new UserDto(user.rows[0])
			const tokens = await tokenService.generateTokens({ ...userDto })
			await tokenService.saveToken(userDto.id, tokens.refreshToken)
			return res.status(200).json({
				...tokens,
				user: userDto,
			})
		} catch (e) {
			console.log(e)
			res.status(500).json({
				message: 'Внутрення ошибка сервера. Повторите попытку позже',
			})
		}
	}

	async getUsers(req, res) {
		const users = await db.query(`SELECT * FROM person`)
		let userArray = []
		let userObject = {}
		users.rows.forEach(item => {
			userObject = {}
			userObject.id = item.id
			userObject.name = item.name
			userObject.surname = item.surname
			userObject.banned = item.banned
			userObject.email = item.email
			userObject.varify = item.is_verified
			userObject.is_premium = item.is_premium
			userObject.avatar = item.avatar
			userArray.push(userObject)
		})
		return res.json(userArray)
	}

	async getOneUser(req, res) {
		try {
			const id = req.params.id
			const user = await db.query(`SELECT * FROM person WHERE id = $1`, [id])
			const posts = await db.query(
				`SELECT * FROM post INNER JOIN category ON category.id = post.category_id WHERE user_id = $1`,
				[id]
			)
			const phones = await db.query("SELECT * FROM phones WHERE user_id = $1", [id])
			let userObject = {}
			user.rows.forEach(item => {
				userObject = {}
				userObject.id = item.id
				userObject.name = item.name
				userObject.surname = item.surname
				userObject.fullname = item.name + ' ' + item.surname
				userObject.banned = item.banned
				userObject.role = item.role
				userObject.verify = item.is_verified
				userObject.email = item.email
				userObject.avatar = item.avatar
				userObject.is_premium = item.is_premium
				userObject.status = item.status
				userObject.birth_day = item.birth_day
				userObject.is_activated = item.is_activated
				userObject.banner = item.banner
				userObject.phones = phones.rows.map(phone => {
					return {
						number: phone.phone,
						is_visible: phone.is_visible
					}
				})
				userObject.poems = posts.rows.map(post => {
					return {
						post_id: post.postId,
						title: post.title,
						content: post.content,
						views: post.views,
						rate: post.rate,
						createdAt: post.created_at,
						preview: post.preview_url,
						reading_time: post.reading_time,
						update_time: post.update_time,
						category_id: post.category_id,
						payment: post.payment,
						price: post.price,
						price_now: post.price_now,
						category: post.name,
						by_subscription: post.by_subscription,
					}
				})
				return userObject
			})
			return res.json(userObject)
		} catch (e) {
			console.log(e)
			res.json({
				message: e,
			})
		}
	}

	async deleteUser(req, res) {
		const id = req.params.id
		const user = await db.query(`DELETE FROM person WHERE id = $1`, [id])
		return res.json(user.rows[0])
	}

	async bannedUser(req, res) {
		try {
			const token = (req.headers.authorization || '').replace(/Bearer\s?/, '')
			const userData = tokenService.validateAccessToken(token)
			req.userId = userData.id
			const id = req.params.id
			const userId = req.userId
			const query = await db.query('SELECT * FROM person WHERE id=$1', [id])
			const owner = await db.query(
				'SELECT name, surname, email, role FROM person WHERE id=$1',
				[userId]
			)
			const ban = !query.rows[0].banned
			const user = await db.query(
				`UPDATE person SET banned = $1 WHERE id = $2 RETURNING *`,
				[ban, id]
			)
			if (ban) {
				return res.json({
					message: `Пользователь ${query.rows[0].name} ${query.rows[0].surname} успешно заблокирован администратором ${owner.rows[0].name} ${owner.rows[0].surname}.`,
					blocked: user.rows[0].name + ' ' + user.rows[0].surname,
					initiator: owner.rows[0],
				})
			} else {
				console.log(userId)
				return res.json({
					message: `Пользователь ${query.rows[0].name} ${query.rows[0].surname} разблокирован администратором ${owner.rows[0].name} ${owner.rows[0].surname}.`,
					blocked: user.rows[0].name + ' ' + user.rows[0].surname,
					initiator: owner.rows[0],
				})
			}
		} catch (e) {
			console.log(e)
			return res.json({
				message: `Не удалось заблокировать пользователя. Возможно пользователя не существует.`,
			})
		}
	}

	async updateUser(req, res) {
		try {
			const id = req.params.id
			const { name, surname, email, avatar, status, birth_day, banner, phone, is_visible } = req.body
			const user = await db.query("SELECT * FROM person WHERE id = $1", [id])
			const newUser = await db.query(
				`UPDATE person SET name = $1, surname = $2, email = $3, avatar = $4, status = $5, birth_day = $6, banner = $7  WHERE id = $8 RETURNING *`,
				[name ? name : user.rows[0].name, surname ? surname : user.rows[0].surname, email ? email : user.rows[0].email, avatar ? avatar : user.rows[0].avatar, status ? status : user.rows[0].status, birth_day ? birth_day : user.rows[0].birth_day, banner ? banner : user.rows[0].banner, id]
			)
			const validPhone = await db.query("SELECT * FROM phones WHERE user_id = $1", [id])
			if (validPhone.rows.length) {
				const phones = await db.query("UPDATE phones SET phone = $1, is_visible = $2, user_id = $3 WHERE user_id=$3 RETURNING *", [phone ? phone : validPhone.rows[0].phone, is_visible ? is_visible : validPhone.rows[0].is_visible, id])
			} else {
				const addPhone = await db.query("INSERT INTO phones (phone, is_visible, user_id) VALUES ($1, $2, $3) RETURNING *", [phone && phone, is_visible ? is_visible : false, id])
			}
			const phones = await db.query("SELECT * FROM phones WHERE user_id=$1", [id])
			let userObject = {}
			user.rows.forEach(item => {
				userObject = {}
				userObject.id = item.id
				userObject.name = item.name
				userObject.surname = item.surname
				userObject.fullname = item.name + ' ' + item.surname
				userObject.email = item.email
				userObject.avatar = item.avatar
				userObject.status = item.status
				userObject.birth_day = item.birth_day
				userObject.banner = item.banner
				userObject.phones = phones.rows.map(phone => {
					return {
						number: phone.phone,
						is_visible: phone.is_visible
					}
				})
				return userObject
			})
			return res.json(userObject)
		} catch (e) {
			console.log(e)
			res.status(500).json({
				message: "Серверная ошибка приложения"
			})
		}
	}
}

export default new UserController()
