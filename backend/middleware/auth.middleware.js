const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => { 
  try {
    if (!req.headers.authorization) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.decode(token);

    const { userId } = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.userId = userId;
    next();

  } 
  catch (error) {
    console.error(error);
    res.status(401).json({ msg: 'Unauthorized' });
  }
};
