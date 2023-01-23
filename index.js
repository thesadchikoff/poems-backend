import express from 'express'
import userRouter from './routes/user.routes.js'
import postRouter from './routes/post.routes.js'
import roleRouter from './routes/roles.routes.js'
import multer from 'multer'
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import db from "./db.js";
// import errorMiddleware from './utils/error-middleware.js'
dotenv.config()
const PORT = process.env.PORT || 5000
const app = express()
app.use(cors())
app.use(cookieParser())
app.use(express.json())
app.use(express.static('./uploads'))
app.use('/api', userRouter)
app.use('/api', postRouter)
app.use('/api', roleRouter)
app.use('/api/uploads', express.static('uploads'))
app.get('/welcome', (req, res) => {
    res.send('Добро пожаловать!')
})
// app.use(errorMiddleware)
app.listen(PORT, () => console.log(`Server started on port ${PORT}`))
