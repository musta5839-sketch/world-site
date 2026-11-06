let shuttingDown = false;

function setShuttingDown(value) {
  shuttingDown = Boolean(value);
}

function isShuttingDown() {
  return shuttingDown;
}

module.exports = {
  setShuttingDown,
  isShuttingDown
};
