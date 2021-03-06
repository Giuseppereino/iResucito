// @flow
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import osLocale from 'os-locale';
import normalize from 'normalize-strings';
import I18n from '../src/translations';
import { pdfValues, PdfWriter, PDFGenerator } from '../src/common';
import { SongsProcessor } from '../src/SongsProcessor';

const NodeLister = fs.promises.readdir;

const NodeReader = (path: string) => {
  return fs.promises.readFile(path, { encoding: 'utf8' });
};

const NodeStyles: SongStyles = {
  titulo: { color: '#ff0000' },
  fuente: { color: '#777777' },
  lineaNotas: { color: '#ff0000' },
  lineaTituloNotaEspecial: { color: '#ff0000' },
  lineaNotaEspecial: { color: '#444444' },
  lineaNotasConMargen: { color: '#ff0000' },
  lineaNormal: { color: '#000000' },
  pageNumber: { color: '#000000' },
  prefijo: { color: '#777777' }
};

const folderSongs = new SongsProcessor(
  path.resolve(__dirname, '../songs'),
  NodeLister,
  NodeReader,
  NodeStyles
);

class NodeJsPdfWriter extends PdfWriter {
  doc: any;
  path: string;

  constructor(pdfPath: string) {
    super(
      pdfValues.widthHeightPixels - pdfValues.marginTop * 2,
      pdfValues.marginTop,
      NodeStyles.pageNumber.color,
      NodeStyles.titulo.color,
      NodeStyles.lineaNormal.color,
      NodeStyles.fuente.color,
      NodeStyles.lineaNotas.color,
      NodeStyles.prefijo.color,
      NodeStyles.lineaTituloNotaEspecial.color,
      NodeStyles.lineaNotaEspecial.color
    );
    this.path = normalize(pdfPath);
    this.doc = new PDFDocument({
      bufferPages: true,
      autoFirstPage: false,
      size: [pdfValues.widthHeightPixels, pdfValues.widthHeightPixels]
    });
    this.doc.registerFont('thefont', 'assets/fonts/Franklin Gothic Medium.ttf');
  }

  checkLimitsCore(height: number) {
    return this.pos.y + height >= this.limiteHoja;
  }

  createPage() {
    this.doc.addPage();
  }

  addPageToDocument() {}

  moveToNextLine(height: number) {
    this.pos.y += height;
  }

  setNewColumnY(height: number) {
    this.resetY = this.pos.y + height;
  }

  async getCenteringX(text: string, font: string, size: number) {
    const width = this.doc
      .fontSize(size)
      .font('thefont')
      .widthOfString(text);
    return parseInt((pdfValues.widthHeightPixels - width) / 2);
  }

  async getCenteringY(text: string, font: string, size: number) {
    const height = this.doc
      .fontSize(size)
      .font('thefont')
      .heightOfString(text);
    return parseInt((pdfValues.widthHeightPixels - height) / 2);
  }

  writeTextCore(
    text: string,
    color: any,
    font: string,
    size: number,
    xOffset?: number
  ) {
    const x = xOffset ? this.pos.x + xOffset : this.pos.x;
    this.doc
      .fillColor(color)
      .fontSize(size)
      .font('thefont')
      .text(text, x, this.pos.y, {
        lineBreak: false
      });
  }

  async save() {
    const docsDir = path.resolve(__dirname, '../pdf');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir);
    }
    this.doc.pipe(fs.createWriteStream(this.path));
    this.doc.end();
    return this.path;
  }
}

export const generatePDF = async (
  songsToPdf: Array<SongToPdf>,
  opts: ExportToPdfOptions
) => {
  const docsDir = path.resolve(__dirname, '../pdf');
  const pdfPath = opts.createIndex
    ? `${docsDir}/iResucito${opts.fileSuffix}.pdf`
    : `${docsDir}/${songsToPdf[0].canto.titulo}.pdf`;

  var writer = new NodeJsPdfWriter(pdfPath);

  return await PDFGenerator(songsToPdf, opts, writer);
};

var program = require('commander');

program
  .version('1.0')
  .description('Generate PDF for a given song')
  .option(
    '-l, --locale [locale]',
    'Locale to use. Defaults to current OS locale'
  )
  .option(
    '-k, --key [value]',
    'Song key. Defaults to generate all songs',
    parseInt
  )
  .option('-D, --debug', 'Show debugging data (only development)');

if (!process.argv.slice(2).length) {
  program.help();
} else {
  program.parse(process.argv);
  var locale = program.locale;
  if (!locale) {
    locale = osLocale.sync();
    console.log('Locale: detected', locale);
  }
  I18n.locale = locale;
  console.log('Configured locale', I18n.locale);
  var key = program.key;
  var opts = { createIndex: true, pageNumbers: true, fileSuffix: `-${locale}` };
  if (locale !== '') {
    if (key) {
      var song = folderSongs.getSingleSongMeta(key, locale);
      if (song.files[I18n.locale]) {
        folderSongs
          .loadSingleSong(song)
          .then(() => {
            console.log('Song: ', song.titulo);
            var songlines = folderSongs.getSongLinesForRender(
              song.lines,
              I18n.locale,
              0
            );
            if (program.debug) {
              console.log(songlines);
            }
            const item: SongToPdf = {
              canto: song,
              lines: songlines
            };
            generatePDF([item], opts);
          })
          .catch(err => {
            console.log(err);
          });
      } else {
        console.log('Song not found for given locale');
      }
    } else {
      var songs = folderSongs.getSongsMeta(locale);
      console.log(`No key Song. Generating ${songs.length} songs`);
      Promise.all(folderSongs.loadSongs(songs)).then(() => {
        var items = [];
        songs.map(song => {
          if (song.files[I18n.locale]) {
            var songlines = folderSongs.getSongLinesForRender(
              song.lines,
              I18n.locale,
              0
            );
            if (program.debug) {
              console.log(songlines);
            }
            const item: SongToPdf = {
              canto: song,
              lines: songlines
            };
            items.push(item);
          } else {
            console.log(
              `Song ${song.titulo} not found for given locale ${locale}`
            );
          }
        });
        generatePDF(items, opts);
      });
    }
  }
}
