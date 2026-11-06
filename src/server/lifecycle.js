const { setShuttingDown } = require('../runtime/shutdown-state');

function startServer({
  app,
  config,
  pool,
  processRef = process,
  logger = console,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
  exit = (code) => process.exit(code)
}) {
  if (!app || typeof app.listen !== 'function') {
    throw new TypeError('app.listen is required');
  }

  if (
    !config ||
    !Number.isInteger(config.port) ||
    config.port < 1 ||
    config.port > 65535
  ) {
    throw new TypeError('A valid server port is required');
  }

  if (!pool || typeof pool.end !== 'function') {
    throw new TypeError('pool.end is required');
  }

  let shuttingDown = false;

  const server = app.listen(config.port, '0.0.0.0', () => {
    logger.log(`WORLD SERVER: http://localhost:${config.port}`);
    logger.log(`API HEALTH: http://localhost:${config.port}/api/health`);
  });

  function shutdown() {
    if (shuttingDown) return;

    shuttingDown = true;
    setShuttingDown(true);

    const forceExit = setTimer(() => exit(1), 10000);
    forceExit.unref?.();

    server.close(async (error) => {
      if (error) {
        logger.error('HTTP server shutdown error:', error);
        clearTimer(forceExit);
        exit(1);
        return;
      }

      try {
        await pool.end();
        logger.log('WORLD SERVER STOPPED');
        clearTimer(forceExit);
        exit(0);
      } catch (shutdownError) {
        logger.error('Shutdown error:', shutdownError);
        clearTimer(forceExit);
        exit(1);
      }
    });
  }

  processRef.on('SIGINT', shutdown);
  processRef.on('SIGTERM', shutdown);

  return {
    server,
    shutdown,
    isShuttingDown: () => shuttingDown
  };
}

module.exports = { startServer };
