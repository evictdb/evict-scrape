const reader = require("readline-sync");

module.exports.command = function(prompt) {
  var self = this;

  this.perform(function() {
    const captchaWait = reader.question(prompt +"\n" + "When done press ENTER in this window to continue...");
  })
  this.pause(50)
  return this;
};
