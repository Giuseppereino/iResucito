var path = require('path');
const { execSync } = require('child_process');
var indexPath = path.resolve('../songs/index.json');
var SongsIndex = require(indexPath);
var fs = require('fs');

if (process.argv.length == 3) {
  var patchPath = process.argv[2];
  if (patchPath !== '') {
    var json = fs.readFileSync(patchPath, 'utf8').normalize();
    var patch = JSON.parse(json);
    Object.entries(patch).forEach(([key, value]) => {
      var songToPatch = SongsIndex[key];
      Object.entries(value).forEach(([locale, item]) => {
        const { file, rename } = item;
        if (rename) {
          var oldName = path.resolve(`../songs/${locale}/${file}.txt`);
          var newName = path.resolve(`../songs/${locale}/${rename}.txt`);
          execSync(`git mv --force "${oldName}" "${newName}"`);
          Object.assign(songToPatch.files, { [locale]: rename });
        } else {
          Object.assign(songToPatch.files, { [locale]: file });
        }
      });
    });
    console.log(SongsIndex);
    fs.writeFileSync(indexPath, JSON.stringify(SongsIndex, null, ' '));
  }
} else {
  console.log('node applyPatch Path/To/SongsIndexPatch.json');
}
