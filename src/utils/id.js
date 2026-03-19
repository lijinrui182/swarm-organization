const crypto = require("node:crypto");

let counter = 0;

function createId(prefix = "id") {
  counter += 1;
  const random = crypto.randomBytes(3).toString("hex");
  return `${prefix}_${Date.now()}_${counter}_${random}`;
}

module.exports = {
  createId,
};
