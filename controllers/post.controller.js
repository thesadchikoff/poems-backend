import db from '../db.js'
import tokenService from '../utils/token-service.js'

class PostController {
	async createPost(req, res) {
		try {
			const token = (req.headers.authorization || '').replace(/Bearer\s?/, '')
			if (!token) {
				return res.status(401).json({
					message: 'Вы не авторизованы.',
				})
			}
			const userData = tokenService.validateAccessToken(token)

			if (!userData) {
				return res.status(401).json({
					message: 'Вы не авторизованы',
				})
			}
			const {
				title,
				content,
				preview_url,
				reading_time,
				category_id,
				price,
				price_now,
				payment,
				by_subscription,
			} = req.body
			const userId = userData.id
			const defaultValues = {
				views: 0,
				rate: 0,
				created_at: new Date(Date.now()),
				payment: false,
				by_subscription: false,
				price: 0,
				price_now: 0,
			}
			const newPost = await db.query(
				`INSERT INTO post (title, content, user_id, views, rate, created_at, preview_url, reading_time, category_id, payment, price, price_now, by_subscription) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
				[
					title,
					content,
					userId,
					defaultValues.views,
					defaultValues.rate,
					defaultValues.created_at,
					preview_url,
					reading_time,
					category_id,
					payment ? payment : defaultValues.payment,
					price ? price : defaultValues.price,
					price_now ? price_now : defaultValues.price_now,
					by_subscription ? by_subscription : defaultValues.by_subscription,
				]
			)
			const post = await db.query(
				`SELECT post.id AS postId, post.title AS title, post.content AS content, post.user_id, post.views AS views, post.rate AS rate, post.created_at AS created_at, post.preview_url AS preview_url, post.reading_time AS reading_time, post.update_time AS update_time, person.is_verified AS is_verified, post.category_id AS category_id, post.payment AS payment, post.price AS price, post.price_now AS price_now, post.by_subscription AS by_subscription, person.name AS name, person.surname AS surname, person.id AS userId FROM post INNER JOIN person ON person.id = post.user_id`
			)
			console.log(post.rows[0])

			// let posts = []
			// let item = {}
			// post.rows.forEach(element => {
			// 	console.log(element)
			// 	item = {}
			// 	item.id = element.postid
			// 	item.title = element.title
			// 	item.content = element.content
			// 	;(item.author = {
			// 		id: element.user_id,
			// 		name: element.name,
			// 		surname: element.surname,
			// 		verify: element.is_verified,
			// 	}),
			// 		(item.views = element.views)
			// 	item.rate = element.rate
			// 	item.created_at = element.created_at
			// 	item.preview_url = element.preview_url
			// 	item.reading_time = element.reading_time
			// 	item.update_time = element.update_time
			// 	posts.push(item)
			// })
			// console.log(posts)
			return res.json(post.rows)
		} catch (e) {
			console.log(e)
			return res.json({
				message: 'Серверная ошибка. Повторите попытку позже.',
			})
		}
	}

	async deletePost(req, res) {
		try {
			const id = req.params.id
			const postQuery = await db.query(`SELECT * FROM post WHERE id=$1`, [id])
			const post = await db.query(`DELETE FROM post WHERE id=$1`, [id])
			return res.json({
				message: `Пост с ID - ${postQuery.rows[0].id} успешно удален`,
			})
		} catch (e) {
			return res.json({
				message: `Произошла непредвиденная ошибка, возможно данного поста не существует.`,
			})
		}
	}

	async updatePost(req, res) {
		try {
			const postId = req.params.id
			const { title, content, preview_url } = req.body
			const date = new Date(Date.now())
			const post = await db.query(`SELECT * FROM post WHERE id=$1`, [postId])
			const editPost = await db.query(
				`UPDATE post SET title = $1, content = $2, update_time = $3, preview_url = $4 WHERE id = $5 RETURNING *`,
				[
					title ? title : post.rows[0].title,
					content ? content : post.rows[0].content,
					date,
					preview_url ? preview_url : post.rows[0].preview_url,
					postId,
				]
			)
			return res.status(200).json(editPost.rows[0])
		} catch (e) {
			console.log(e)
		}
	}

	async getPostByFilter(req, res) {
		try {
			const filter = req.query.category
			console.log(filter)
			const posts = await db.query(
				`SELECT post.id AS postId, post.title AS title, post.content AS content, post.user_id, post.views AS views, post.rate AS rate, post.created_at AS created_at, post.preview_url AS preview_url, post.reading_time AS reading_time, post.update_time AS update_time, post.category_id AS category_id, post.payment AS payment, post.price AS price, post.price_now AS price_now, post.by_subscription AS by_subscription, person.name AS name, person.surname AS surname, person.id AS userId, person.avatar AS avatar, person.is_verified AS is_verified, category.name AS category_name FROM post INNER JOIN person ON person.id = post.user_id INNER JOIN category ON category.id = post.category_id WHERE category.name = $1`,
				[filter]
			)
			console.log(filter)
			let postsArray = []
			let item = {}

			posts.rows.forEach(element => {
				console.log(element)
				item = {}
				item.id = element.postid
				item.title = element.title
				item.content = element.content
				;(item.author = {
					id: element.user_id,
					name: element.name,
					surname: element.surname,
					verify: element.is_verified,
					avatar: element.avatar,
				}),
					(item.views = element.views)
				item.rate = element.rate
				item.created_at = element.created_at
				item.preview_url = element.preview_url
				item.reading_time = element.reading_time
				item.update_time = element.update_time
				item.category = element.category_name
				item.payment = element.payment
				item.price = element.price
				item.price_now = element.price_now
				item.by_subscription = element.by_subscription
				postsArray.push(item)
			})
			return res.status(200).json(postsArray)
		} catch (e) {
			res.json({
				message: e,
			})
		}
	}

	async getCategory(req, res) {
		try {
			const category = await db.query('SELECT * FROM category')
			return res.status(200).json(category.rows)
		} catch (e) {
			return res.status(500).json({
				message: 'Не удалось получить список категорий',
			})
		}
	}

	async getPosts(req, res) {
		try {
			const posts = await db.query(
				`SELECT post.id AS postId, post.title AS title, post.content AS content, post.user_id, post.views AS views, post.rate AS rate, post.created_at AS created_at, post.preview_url AS preview_url, post.reading_time AS reading_time, post.update_time AS update_time, post.category_id AS category_id, post.payment AS payment, post.price AS price, post.price_now AS price_now, person.is_verified AS is_verified, post.by_subscription AS by_subscription, person.name AS name, person.avatar AS avatar, person.surname AS surname, person.id AS userId, category.name AS category_name FROM post INNER JOIN person ON person.id = post.user_id INNER JOIN category ON category.id = post.category_id`
			)
			console.log(posts)
			let postsArray = []
			let item = {}
			posts.rows.forEach(element => {
				console.log(element)
				item = {}
				item.id = element.postid
				item.title = element.title
				item.content = element.content
				;(item.author = {
					id: element.user_id,
					name: element.name,
					surname: element.surname,
					verify: element.is_verified,
					avatar: element.avatar,
				}),
					(item.views = element.views)
				item.rate = element.rate
				item.created_at = element.created_at
				item.preview_url = element.preview_url
				item.reading_time = element.reading_time
				item.update_time = element.update_time
				item.category = element.category_name
				item.payment = element.payment
				item.price = element.price
				item.price_now = element.price_now
				item.by_subscription = element.by_subscription
				postsArray.push(item)
			})
			return res.status(200).json(postsArray)
		} catch (e) {}
	}

	async getPost(req, res) {
		const postId = req.params.id
		try {
			const posts = await db.query(
				`SELECT post.id AS postId, post.title AS title, post.content AS content, post.user_id, post.views AS views, post.rate AS rate, post.created_at AS created_at, post.preview_url AS preview_url, post.reading_time AS reading_time, post.update_time AS update_time, person.is_verified AS is_verified, post.category_id AS category_id, post.payment AS payment, post.price AS price, post.price_now AS price_now, post.by_subscription AS by_subscription, person.name AS name, person.surname AS surname, person.id AS userId, category.name AS category_name FROM post INNER JOIN person ON person.id = post.user_id INNER JOIN category ON category.id = post.category_id WHERE post.id = $1`,
				[postId]
			)
			if (posts.rows[0].by_subscription) {
				if (role === 'Premium пользователь') {
					let postsArray = []
					let item = {}
					posts.rows.forEach(element => {
						console.log(element)
						item = {}
						item.id = element.postid
						item.title = element.title
						item.content = element.content
						item.author = {
							id: element.user_id,
							name: element.name,
							surname: element.surname,
							verify: element.is_verified,
						}((item.views = element.views))
						item.rate = element.rate
						item.created_at = element.created_at
						item.preview_url = element.preview_url
						item.reading_time = element.reading_time
						item.update_time = element.update_time
						item.category = element.category_name
						item.payment = element.payment
						item.price = element.price
						item.price_now = element.price_now
						item.by_subscription = element.by_subscription
						postsArray.push(item)
					})
					const incrementView = await db.query(
						`UPDATE post SET views = $1 WHERE id = $2`,
						[posts.rows[0].views + 1, postId]
					)
					return res.status(200).json({
						response: postsArray,
					})
				} else {
					return res.status(401).json({
						message: 'Данная публикация доступна лишь Premium пользователям.',
					})
				}
			} else {
				let postsArray = []
				let item = {}
				posts.rows.forEach(element => {
					console.log(element)
					item = {}
					item.id = element.postid
					item.title = element.title
					item.content = element.content
					item.author = [
						{
							id: element.user_id,
							name: element.name,
							surname: element.surname,
						},
					]
					item.views = element.views
					item.rate = element.rate
					item.created_at = element.created_at
					item.preview_url = element.preview_url
					item.reading_time = element.reading_time
					item.update_time = element.update_time
					item.category = element.category_name
					item.payment = element.payment
					item.price = element.price
					item.price_now = element.price_now
					item.by_subscription = element.by_subscription
					postsArray.push(item)
				})
				const incrementView = await db.query(
					`UPDATE post SET views = $1 WHERE id = $2`,
					[posts.rows[0].views + 1, postId]
				)
				return res.status(200).json({
					response: postsArray,
				})
			}
		} catch (e) {
			res.json({
				message: 'Такой публикации не существует',
			})
		}
	}
}

export default new PostController()
