const bcrypt = require("bcryptjs");

const generatePin = (length = 4) => {
  let pin = "";
  for (let i = 0; i < length; i++) {
    pin += Math.floor(Math.random() * 10);
  }
  return pin;
};

const createEncryptedPin = async (length = 4) => {
  const pin = generatePin(length);
  const hashedPin = await bcrypt.hash(pin, 10);
  return { pin, hashedPin };
};

module.exports = { generatePin, createEncryptedPin };
