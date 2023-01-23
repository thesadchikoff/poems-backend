import multer from 'multer'

const storage = multer.diskStorage({
	destination: (_, __, cb) =>{
		cb(null, 'uploads')
	},
	filename: (req, file, cb) => {
		cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname)
	},
})

const types = ['image/png', 'image/jpeg', 'image/jpg']

const filefilter = (req, file, cb) => {
	if (types.includes(file.mimetype)) {
		cb(null, true)
	} else {
		cb(null, false)
	}
}

export const upload = multer({ storage, filefilter })
