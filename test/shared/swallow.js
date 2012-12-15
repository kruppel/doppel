module.exports = function (thrower) {
  try { thrower(); }
  catch (e) { return e; }
};
