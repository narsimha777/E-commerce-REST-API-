const bcrypt = require('bcrypt');

const passwordHash = async (password, saltRounds) => {
  try {
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (err) {
    console.error('Error hashing password:', err.message);
    throw err; 
  }
};

const authenticate = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (err) {
    console.error('Error comparing passwords:', err.message);
    throw err; 
  }
};

module.exports = {
  passwordHash: passwordHash,
  authenticate: authenticate
};
