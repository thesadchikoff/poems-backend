import Router from 'express'
import postController from '../controllers/post.controller.js'
import checkAuth from '../utils/checkAuth.js'
import checkAuthor from '../utils/checkAuthor.js'
import rolesController from '../controllers/roles.controller.js'
import checkAdmin from '../utils/checkAdmin.js'
import checkBan from '../utils/checkBan.js'
const router = new Router()

router.post('/roles', checkAuth, checkBan, rolesController.createRole)
router.post('/roles/add_role', checkAuth, checkAdmin, rolesController.giveRoles)
router.post(
	'/roles/remove_role',
	checkAuth,
	checkAdmin,
	rolesController.removeRoles
)

export default router
