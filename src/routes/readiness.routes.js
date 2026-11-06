const express = require('express');
const { query } = require('../database/query');
const { isShuttingDown } = require('../runtime/shutdown-state');

const router = express.Router();

router.get('/', async (req, res, next) => {
  if (isShuttingDown()) {
    return res.status(503).json({
      success: false,
      application: 'WORLD',
      status: 'shutting_down',
      database: 'not_checked'
    });
  }

  try {
    await query('SELECT 1');

    if (isShuttingDown()) {
      return res.status(503).json({
        success: false,
        application: 'WORLD',
        status: 'shutting_down',
        database: 'connected'
      });
    }

    return res.status(200).json({
      success: true,
      application: 'WORLD',
      status: 'ready',
      database: 'connected'
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
