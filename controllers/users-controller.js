const fetch = require("node-fetch");
const User = require("../models/User");
const asyncWrapper = require("../middlewares/asyncWrapper");
const { createCustomError } = require("../errors/custom-error");
const { updateMany } = require("../models/User");
require("dotenv").config();

const getAllUsers = asyncWrapper(async (req, res) => {
  const allUsers = await User.find({}, { password: 0 });
  if (!allUsers) {
    return next(createCustomError("There is no users", 404));
  }
  res.status(200).json(allUsers);
});

const editUserName = asyncWrapper(async (req, res) => {
  const { id: id } = req.params;
  const { newName } = req.body;
  console.log(newName);

  let user = await User.findOneAndUpdate(
    { _id: id },
    {
      userName: newName,
    },

    {
      new: true,
      runValidators: true,
    }
  );

  if (!user) {
    return next(createCustomError("User is not found", 404));
  }
  res.status(201).json("ok");
});

const isPriceCorrect = async (symbol, price) => {
  const response = await fetch(
    `https://sandbox.tradier.com/v1/markets/quotes?symbols=${symbol}&greeks=false`,
    {
      method: "get",
      headers: {
        Authorization: `Bearer ${process.env.TRADIERS_KEY}`,
        Accept: "application/json",
      },
    }
  );
  const data = await response.json();
  const realTimePrice = data.quotes.quote.last;
  console.log(price, realTimePrice);

  if (Math.abs(realTimePrice - price) > realTimePrice * 0.01) {
    return false;
  } else {
    return true;
  }
};

const buyStock = asyncWrapper(async (req, res) => {
  const { symbol, price, quantity } = req.body;
  const { id: id } = req.params;
  const priceIsRigth = await isPriceCorrect(symbol, price);
  console.log(priceIsRigth);

  if (!(await isPriceCorrect(symbol, price))) {
    console.log("wrongprice");

    return res.json("wrong_price");
  }

  let user = await User.findById(id);
  if (!user) {
    return next(createCustomError("User is not found", 404));
  }

  const holdings = user.holdings;
  let foundStock = holdings.find((stock) => stock.symbol === symbol);
  let newData;

  if (foundStock) {
    foundStock.average = parseFloat(
      (
        (foundStock.quantity * foundStock.average + quantity * price) /
        (foundStock.quantity + quantity)
      ).toFixed(2)
    );
    foundStock.quantity += quantity;
    foundStock.purchaseDates = foundStock.purchaseDates.concat({
      timestamp: Date.now(),
      quantity,
      price,
    });

    newData = {
      holdings: user.holdings.map((stock) => {
        if (stock.symbol === symbol) {
          return foundStock;
        } else {
          return stock;
        }
      }),
      cash: parseFloat((user.cash - quantity * price).toFixed(2)),
    };
  } else {
    newData = {
      holdings: [
        ...user.holdings,
        {
          symbol,
          quantity,
          average: price,
          purchaseDates: [{ timestamp: Date.now(), quantity, price }],
        },
      ],
      cash: parseFloat((user.cash - quantity * price).toFixed(2)),
    };
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: id },
    newData,

    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedUser) {
    return next(createCustomError("User is not found", 404));
  }
  res.status(201).json(updatedUser);
});

const sellStock = asyncWrapper(async (req, res) => {
  const { symbol, price, quantity } = req.body;
  const { id: id } = req.params;

  if (!(await isPriceCorrect(symbol, price))) {
    return res.json("wrong_price");
  }

  let user = await User.findById(id);
  if (!user) {
    return next(createCustomError("User is not found", 404));
  }

  const holdings = user.holdings;
  const foundStock = holdings.find((stock) => stock.symbol === symbol);
  foundStock.quantity -= quantity;
  let newData;
  if (foundStock.quantity === 0) {
    newData = {
      holdings: holdings.filter((stock) => stock.symbol !== symbol),
      cash: parseFloat((user.cash + quantity * price).toFixed(2)),
    };
  } else {
    newData = {
      holdings: holdings.map((stock) => {
        if (stock.symbol === symbol) return foundStock;
        return stock;
      }),
      cash: parseFloat((user.cash + quantity * price).toFixed(2)),
    };
  }
  const updatedUser = await User.findOneAndUpdate(
    { _id: id },
    newData,

    {
      new: true,
      runValidators: true,
    }
  );
  if (!updatedUser) {
    return next(createCustomError("User is not found", 404));
  }
  res.status(201).json(updatedUser);
});

const editWatchlist = asyncWrapper(async (req, res) => {
  const { symbol } = req.body;
  const { id: id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    return next(createCustomError("User is not found", 404));
  }
  let watchlist = user.watchlist;
  if (watchlist.includes(symbol)) {
    watchlist = watchlist.filter((ticker) => ticker !== symbol);
  } else {
    watchlist = watchlist.concat(symbol);
  }
  console.log(watchlist);

  const updatedUser = await User.findOneAndUpdate(
    { _id: id },
    { watchlist },
    {
      new: true,
      runValidators: true,
    }
  );
  if (!updatedUser) {
    return next(createCustomError("User is not found", 404));
  }
  res.status(201).json("ok");
});

module.exports = {
  editUserName,
  getAllUsers,
  buyStock,
  sellStock,
  editWatchlist,
};
