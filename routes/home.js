const express = require('express');

const router = express.Router();

const homeController = require('../controllers/home');

router.get('/categories', homeController.categories);

module.exports = router;