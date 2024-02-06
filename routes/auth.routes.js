const router = require("express").Router();const User = require("../models/User");
const Profile = require("../models/Profile");

/**middle ware */
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

//**JWT Secret */
const JWT_SECRET = process.env.JWT_SECRET;

router.post("/register", async (req, res) => {
  const { username, password, email } = req.body;
  /**check if username, password and email is prompted */
  if (!username || !email || password) {
    return res.status(400).send({ message: "Fill the requirement" });
  }

  /**check if username is already used */
  const foundUser = await User.findOne({ username });
  if (username === foundUser.username) {
    return res.status(400).send({ message: "Username is already used" });
  }

  /**check if email is already used */
  if (email === foundUser.username) {
    return res.status(400).send({ message: "Email is already used" });
  }

  /**hash password */
  const saltRound = 10;
  const hashedPassword = await bcrypt.hashSync(password, saltRound);

  /**pre-save new user */
  const newUser = new User({
    username,
    password: hashedPassword,
    email,
  });
  await newUser.save();

  return res.status(201).send({ message: "New user is created", newUser });
});

router.post("login", async (req, res) => {
  /**deconstruct request body */
  const { username, password } = req.body;

  /**check if username and password is prompted */
  if (!username || !password) {
    return res
      .status(400)
      .send({ message: "Username and password are required" });
  }

  /**find user using username */
  const user = User.findOne({ username });
  if (!user) {
    return res.status(404).send({ message: "User not found" });
  }

  /**check if password is valid */
  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword) {
    return res.status(400).send({ message: "Password is invalid" });
  }

  /**check if user is currently logged in */
  /**which could be hacked */
  const userLoggedIn = user.refreshToken;
  if (userLoggedIn) {
    user.updateOne({ refreshToken: null });
    return res.status(401).send({ message: "Please login again" });
  }

  /**create access token */

  const accessToken = jwt.sign({ user: username }, JWT_SECRET, {
    expiresIn: "1m",
  });

  /**create refresh token */
  const randomNumbers = (Math.random() + 1).toString(4);
  const refreshToken = jwt.sign({ id: user._id, randomNumbers }, JWT_SECRET, {
    expiresIn: "30m",
  });

  /**add new refresh token to user db document */
  await user.updateOne({ refreshToken });

  /**send refresh token as cookies to client */
  res.cookie("token", refreshToken);

  /**send access token attached to header  */
  return res.status(200).send({ message: "Login success", token: accessToken });
});

router.post("logout", async (req, res) => {
  /**get refresh token*/
  const { token } = req.cookies;
  /**if no token */
  if (!token) {
    return res.status(400).send({ message: "Token not found" });
  }
  /**get id from token*/
  const decoded = await jwt.verify(token, JWT_SECRET);
  const userId = decoded.id;

  /**remove refresh token from db and from client cookies*/
  const user = User.findOne({ _id: userId });
  await user.updateOne({ refreshToken: null });

  /**logout success */
  return res.status(200).send({ message: "Login succeeded" });
});

//**refresh route */
router.post("refresh", async (req, res) => {
  /**get refresh token from client's cookies */
  const { token } = req.cookies;
  /**if no token return unauthorized and logout*/
  if (!token) {
    return res
      .status(401)
      .send({ message: "Unauthorized! Please login again." });
  }
  /**get user from refresh token which contain user id */
  const decoded = jwt.verify(token, JWT_SECRET);
  const user = User.findOne({ _id: decoded.id });
  /**create new refresh token */
  const randomNumbers = (Math.random() + 1).toString(4);
  const NewRefreshToken = jwt.sign(
    { id: user._id, randomNumbers },
    JWT_SECRET,
    {
      expiresIn: "30m",
    }
  );
  /**if token is not match with db token, remove token from db and logout */
  if (token !== user.refreshToken) {
    await user.updateOne({ refreshToken: null });
    return res
      .status(401)
      .send({ message: "Unauthorized! Please login again." });
  }
  /**update refresh token in db */
  await user.updateOne({ refreshToken: NewRefreshToken });
  /**send new refresh token to client's cookies*/
  res.cookie("token", NewRefreshToken);
  /**create new access token */
  const accessToken = jwt.sign({ user: username }, JWT_SECRET, {
    expiresIn: "1m",
  });
  /**send new access token to client */
  return res.status(200).send({ message: "Refresh token sent", accessToken });
});

module.exports = router;
