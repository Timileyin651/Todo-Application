const userModel = require('../models/users');
const logger = require('../utils/logger');

// REGISTER USER
async function registerUser(req, res) {
    const { username, email, password } = req.body;

    try {
        const user = await userModel.register(
            new userModel({ username, email }),
            password
        );

        // Automatically log in the registered user
        req.login(user, (error) => {
            if (error) {
                logger.error(error);
                return res.status(500).render('signup', {
                    error: 'Registration successful, but automatic login failed. Please log in.'
                });
            }

            return res.redirect('/tasks');
        });

    } catch (error) {
        logger.error(error);

        if (error.code === 11000) {
            return res.status(409).render('signup', {
                error: 'Username or email already registered'
            });
        }

        return res.status(400).render('signup', {
            error: error.message
        });
    }
}


// RESET PASSWORD
async function resetPassword(req, res) {
    const { username, password, new_password } = req.body;

    try {
        const user = await userModel.findOne({ username });

        if (!user) {
            return res.status(404).render('reset', {
                error: 'User not found'
            });
        }

        await user.changePassword(password, new_password);

        return res.redirect('/login');

    } catch (error) {
        logger.error(error);

        return res.status(400).render('reset', {
            error: error.message
        });
    }
}

module.exports = {
    registerUser,
    resetPassword
};
