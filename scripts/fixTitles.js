var path = require('path');
var indexPath = path.resolve('../songs/index.json');
var SongsIndex = require(indexPath);
var fs = require('fs');

String.prototype.replaceAt = function(index, replacement) {
  return (
    this.substr(0, index) +
    replacement +
    this.substr(index + replacement.length)
  );
};

Object.entries(SongsIndex).forEach(([key, value]) => {
  if (value.files['pt']) {
    var original = value.files['pt'];
    var titulo = original.substr(0, original.indexOf('-'));
    var fuente = original.substr(original.indexOf('-') + 1);

    titulo = titulo.toLowerCase();
    titulo = titulo.replaceAt(0, titulo[0].toUpperCase());

    var renameTo = titulo + '-' + fuente;

    var oldPath = path.resolve(`../songs/pt/${original}.txt`);
    var newPath = path.resolve(`../songs/pt/${renameTo}.txt`);
    fs.renameSync(oldPath, newPath);
    value.files['pt'] = renameTo;

    console.log({ original, renameTo, oldPath, newPath });
  }
});
console.log(SongsIndex);
fs.writeFileSync(indexPath, JSON.stringify(SongsIndex, null, ' '));