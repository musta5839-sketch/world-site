const express = require('express');
const controller = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');
const { authLimiter } = require('../middleware/rate-limiters');

const router = express.Router();

router.use(authLimiter);

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/me', authenticate, controller.me);
router.patch('/me', authenticate, controller.updateMe);

module.exports = router;
