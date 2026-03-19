const crypto = require("node:crypto");

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

module.exports = {
  sha256,
};
