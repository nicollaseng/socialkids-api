const router = require('express').Router();

router.use('/health', require('./health'));
router.use('/graphql', require('./graphql'));
router.use('/recibo', require('./recibo'));
router.use('/profile', require('./profile'));

module.exports = router;
