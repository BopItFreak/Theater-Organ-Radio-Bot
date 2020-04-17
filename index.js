let Organ = require("./organ.js");
global.organ = new Organ();
global.truncate = function(str, max, sep) {
  max = max || 10;
  var len = str.length;
  if (len > max) {
    sep = sep || "...";
    var seplen = sep.length;
    if (seplen > max) {
      return str.substr(len - max);
    }
    var n = -0.5 * (max - len - seplen);
    var center = len / 2;
    var front = str.substr(0, center - n);
    var back = str.substr(len - center + n);
    return front + sep + back;
  }
  return str;
}

Object.defineProperty(Array.prototype, 'chunk', {
  value: function (n) {
      return Array.from(Array(Math.ceil(this.length / n)), (_, i) => this.slice(i * n, i * n + n));
  }
});