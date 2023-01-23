export class UserDto {
	name
	surname
	avatar
	email
	id
	is_activated
	role
	banned

	constructor(model) {
		this.name = model.name
		this.surname = model.surname
		this.avatar = model.avatar
		this.email = model.email
		this.banned = model.banned
		this.id = model.id
		this.is_activated = model.is_activated
		this.role = model.role
	}
}
