import Router from 'express'
import postController from '../controllers/post.controller.js'
import checkAuth from '../utils/checkAuth.js'
import checkAuthor from '../utils/checkAuthor.js'
import { upload } from '../storage/storage.js'
import checkBan from '../utils/checkBan.js'
const router = new Router()

router.post('/post', checkAuth, postController.createPost)
router.delete('/post/:id', checkAuth, postController.deletePost)
router.put('/post/edit/:id', checkAuth, checkAuthor, postController.updatePost)
router.get('/posts', postController.getPosts)
router.get('/posts/filter', postController.getPostByFilter)
router.get('/post/:id', checkAuth, postController.getPost)
router.get('/posts/category', postController.getCategory)
router.post('/uploads', checkAuth, upload.single('image'), (req, res) => {
	res.json({
		url: `uploads/'${req.file.fieldname}`,
	})
})

export default router
