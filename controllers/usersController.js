const User = require('../models/User');
const Note = require('../models/Note');
const asyncHandler = require('express-async-handler'); //reduces the try catch block
const bcrypt = require('bcrypt'); // use to encrypt passwords

//@desc Get all users
//@route GET /users
//@access Private

const getAllUsers = asyncHandler(async (req, res) => {
	const users = await User.find().select('-password').lean();
	if (!users?.length) {
		return res.status(400).json({ message: 'No users found' });
	}
	res.json(users);
});

//@desc Create new users
//@route POST /users
//@access Private

const createNewUser = asyncHandler(async (req, res) => {
	const { username, password, roles } = req.body;

	//confirm data
	if (!username || !password || !Array.isArray(roles) || !roles.length) {
		return res.status(400).json({ message: 'All fileds are required' });
	}

	//check for duplicates
	const duplicate = await User.findOne({ username }).lean().exec();
	if (duplicate) {
		return res.status(400).json({ message: 'Duplicate Username' });
	}

	const hashedPwd = await bcrypt.hash(password, 10); // salt = 10

	const userObject = { username, password: hashedPwd, roles };

	//create and store new user
	const user = await User.create(userObject);

	if (user) {
		res.status(201).json({ message: `New user ${username} created` });
	} else {
		res.status(400).json({ message: 'Invalid user data received' });
	}
});

//@desc Update a user
//@route PATCH /users
//@access Private

const udpateUser = asyncHandler(async (req, res) => {
	const { id, username, roles, active, password } = req.body;

	//confrim data
	if (
		!id ||
		!username ||
		!Array.isArray(roles) ||
		!roles.length ||
		typeof active !== 'boolean'
	) {
		return res.status(400).json({ message: 'All fields are requried' });
	}
	const user = await User.findById(id).exec();

	if (!user) {
		return res.status(400).json({ message: 'User not found!' });
	}

	//check duplicate
	const duplicate = await User.findOne({ username }).lean().exec();
	//allow updates to original user
	if (duplicate && duplicate?._id.toString() != id) {
		return res.status(400).json({ message: 'Duplicate username' });
	}

	user.username = username;
	user.roles = roles;
	user.active = active;

	if (password) {
		user.password = await bcrypt.hash(password, 10);
	}

	const updatedUser = await user.save();

	res.json({ message: `${updatedUser.usermame} updated` });
});

//@desc Delete a user
//@route DELETE /users
//@access Private

const deleteUser = asyncHandler(async (req, res) => {
	const { id } = req.body;

	if (!id) {
		return res.status(400).json({ message: 'User id required' });
	}
	const note = await Note.findOne({ user: id }).lean().exec();
	if (note) {
		return res.status(400).json({ message: 'User has assigned noted' });
	}

	const user = await User.findById(id).exec();
	if (!user) {
		return res.status(400).json({ message: 'User not found' });
	}

	const result = await user.deleteOne();

	const reply = `Username ${result.username} deleted`;

	res.json(reply);
});

module.exports = {
	getAllUsers,
	createNewUser,
	udpateUser,
	deleteUser,
};
