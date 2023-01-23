import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

class MailService {
	constructor() {
		this.transporter = nodemailer.createTransport({
			service: 'Yandex',
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASSWORD,
			},
		})
	}
	async sendActivationMail(to, link) {
		await this.transporter.sendMail({
			from: 'notification-pl@yandex.ru',
			to,
			subject: 'Активация аккаунта на сайте Poems Library',
			text: '',
			html: `
			<div>
				<span style="margin-bottom: 20px;">Для активации почты перейдите по ссылке ниже</span>
				<br>
				<div style="padding: 10px;"></div>
				<a style="text-decoration: none" href="${link}">🔗 Перейти</a>
			</div>
			`,
		})
	}

	async sendWelcomeMail(to, user, link) {
		await this.transporter.sendMail({
			from: 'notification-pl@yandex.ru',
			to,
			subject: 'Благодарим за регистрацию на нашем сайте!',
			text: '',
			html: `
			<div>
				<h1 style="color: #FFD700;">Welcome, my friend! 👋</h1>
				<img src="https://images.unsplash.com/photo-1600577916048-804c9191e36c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1332&q=80" alt="views"/>
				<br>
				<br>
				<span style="margin-bottom: 20px;"><b>${user}</b>, благодарим тебя за регистрацию на нашем сервисе! Мы подготовили для тебя подарок - <b>200 бонусов</b>. Получить их ты сможешь перейдя по ссылке ниже 👇</span>
				<br>
				<div style="padding: 10px;"></div>
				<a style="text-decoration: none" href="${link}">🔗 Перейти</a>
			</div>
			`,
		})
	}
}

export default new MailService()
