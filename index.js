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

function escapeCodeBlock(text) {
  return text.replace(/```/g, '\\`\\`\\`');
}
function escapeInlineCode(text) {
  return text.replace(/(?<=^|[^`])`(?=[^`]|$)/g, '\\`');
}
function escapeItalic(text) {
  let i = 0;
  text = text.replace(/(?<=^|[^*])\*([^*]|\*\*|$)/g, (_, match) => {
    if (match === '**') return ++i % 2 ? `\\*${match}` : `${match}\\*`;
    return `\\*${match}`;
  });
  i = 0;
  return text.replace(/(?<=^|[^_])_([^_]|__|$)/g, (_, match) => {
    if (match === '__') return ++i % 2 ? `\\_${match}` : `${match}\\_`;
    return `\\_${match}`;
  });
}
function escapeBold(text) {
  let i = 0;
  return text.replace(/\*\*(\*)?/g, (_, match) => {
    if (match) return ++i % 2 ? `${match}\\*\\*` : `\\*\\*${match}`;
    return '\\*\\*';
  });
}
function escapeUnderline(text) {
  let i = 0;
  return text.replace(/__(_)?/g, (_, match) => {
    if (match) return ++i % 2 ? `${match}\\_\\_` : `\\_\\_${match}`;
    return '\\_\\_';
  });
}
function escapeStrikethrough(text) {
  return text.replace(/~~/g, '\\~\\~');
}
function escapeSpoiler(text) {
  return text.replace(/\|\|/g, '\\|\\|');
}

global.escapeMarkdown = function(
  text,
  {
    codeBlock = true,
    inlineCode = true,
    bold = true,
    italic = true,
    underline = true,
    strikethrough = true,
    spoiler = true,
    codeBlockContent = true,
    inlineCodeContent = true,
  } = {},
) {
  if (!codeBlockContent) {
    return text
      .split('```')
      .map((subString, index, array) => {
        if (index % 2 && index !== array.length - 1) return subString;
        return escapeMarkdown(subString, {
          inlineCode,
          bold,
          italic,
          underline,
          strikethrough,
          spoiler,
          inlineCodeContent,
        });
      })
      .join(codeBlock ? '\\`\\`\\`' : '```');
  }
  if (!inlineCodeContent) {
    return text
      .split(/(?<=^|[^`])`(?=[^`]|$)/g)
      .map((subString, index, array) => {
        if (index % 2 && index !== array.length - 1) return subString;
        return escapeMarkdown(subString, {
          codeBlock,
          bold,
          italic,
          underline,
          strikethrough,
          spoiler,
        });
      })
      .join(inlineCode ? '\\`' : '`');
  }
  if (inlineCode) text = escapeInlineCode(text);
  if (codeBlock) text = escapeCodeBlock(text);
  if (italic) text = escapeItalic(text);
  if (bold) text = escapeBold(text);
  if (underline) text = escapeUnderline(text);
  if (strikethrough) text = escapeStrikethrough(text);
  if (spoiler) text = escapeSpoiler(text);
  return text;
}

