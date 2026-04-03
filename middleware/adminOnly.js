const { UserRoles } = require("../config/constant");
const ForbiddedException = require("../exceptions/ForbiddenException");

/**
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const adminOnly = (req, res, next) => {
  const user = req.user;
  if (user.role != UserRoles.ADMIN) {
    next(new ForbiddedException());
  }
  next();
};

module.exports = adminOnly;
