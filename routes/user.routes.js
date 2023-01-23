import Router from 'express'
import userController from '../controllers/user.controller.js'
import checkUser from '../utils/checkUser.js'
import checkAuth from '../utils/checkAuth.js'
import checkAdmin from '../utils/checkAdmin.js'
import checkAuthor from '../utils/checkAuthor.js'
import bonusesController from '../controllers/bonuses.controller.js'
import checkBan from '../utils/checkBan.js'
import { body } from 'express-validator'
import checkOwnerAccount from '../utils/checkOwnerAccount.js'
const router = new Router()

// Регистрация и авторизация
router.post(
	'/user/auth/registration',
	checkUser,
	body('email').isEmail(),
	body('password').isLength({ min: 3, max: 32 }),
	userController.createUser
)
router.post('/user/auth/login', userController.userLogin)
router.post('/user/auth/logout', userController.logout)
router.get('/refresh', userController.refresh)

// Получение данных о пользователе или пользователях
router.get('/user/:id', userController.getOneUser)
router.get('/users', checkAuth, userController.getUsers)
router.get('/auth/me', checkAuth, userController.getMe)
// Удаление пользователя
router.delete('/user/:id', checkAuth, userController.deleteUser)

// Блокировка пользователя
router.put('/user/ban/:id', checkAuth, userController.bannedUser)

// Редактирование пользователя
router.put('/user/:id', checkAuth, checkOwnerAccount, userController.updateUser)

// Операции с бонусами лояльности
router.put(
	'/user/bonuses/set/:id',
	checkAuth,
	checkAdmin,
	bonusesController.setBonuses
)
router.put(
	'/user/bonuses/give/:id',
	checkAuth,
	checkAdmin,
	bonusesController.giveBonuses
)

export default router
