const express = require('express');

const router = express.Router();

const contactController = require('../controllers/contact');

router.post('/', contactController.contact);

module.exports = router;