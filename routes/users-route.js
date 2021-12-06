const express = require("express");
const router = express.Router();

const {
  getAllUsers,
  editUserName,
  buyStock,
  sellStock,
  editWatchlist,
} = require("../controllers/users-controller");
router.route("/").get(getAllUsers);

//////////////
router.route("/buy/:id").patch(buyStock);
router.route("/sell/:id").patch(sellStock);
router.route("/editwatchlist/:id").patch(editWatchlist);
router.route("/editname/:id").patch(editUserName);

module.exports = router;
