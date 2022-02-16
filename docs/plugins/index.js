const path = require('path');
const fs = require('fs');
const nb = require('notebookjs');
const Turndown = require('turndown');
const turndownPluginGfm = require('turndown-plugin-gfm');
const minify = require('html-minifier').minify;

module.exports = function pluginJupiterNotebookDocsGenerator(context, opts) {
  const { rootJupyterNotebooksFolder, docsOutputFolder } = opts;
  const {
    siteConfig: { presets },
  } = context;

  // We'll use the classic preset to get the docs folder path
  const classicPreset = presets.find((preset) => preset[0] === '@docusaurus/preset-classic');

  if (classicPreset) {
    const [, configuration] = classicPreset;

    if (configuration && configuration.docs) {
      const originalNotebooksPath = path.join(__dirname, '../../', rootJupyterNotebooksFolder);

      const docPath = path.join(__dirname, '../', configuration.docs.path);
      const markdownNotebooksPath = docPath + docsOutputFolder;

      if (fs.existsSync(originalNotebooksPath)) {
        const files = fs.readdirSync(originalNotebooksPath, 'utf-8');

        // Setup of markdown parser, GFM adds GitHub Flavored Markdown extensions and fixes a table parse issue
        const gfm = turndownPluginGfm.gfm;
        const turndownService = new Turndown({ codeBlockStyle: 'fenced' });
        turndownService.use(gfm);

        if (files) {
          files.forEach((file) => {
            if (file.endsWith('.ipynb')) {
              const read = fs.readFileSync(originalNotebooksPath + '/' + file);
              const notebook = JSON.parse(read);
              const parsed = nb.parse(notebook);
              const html = parsed.render().outerHTML;

              // We need to minify the HTML so we can remove inline-style-tags as these are just stripped out by the markdown parser
              // which will render the css properties as plain text
              const markdown = turndownService.turndown(
                minify(html, {
                  collapseWhitespace: true,
                  removeRedundantAttributes: true,
                  removeComments: true,
                  minifyCSS: true,
                }).replace(/(<style>)(.*?)(<\/style>)/g, '')
              );

              const cappedFileName = file.charAt(0).toUpperCase() + file.slice(1);

              // Template literals don't work here, as they add unneeded tabs, which break the markdown
              const title =
                '---\n' +
                'title: ' +
                cappedFileName.replace(/.ipynb/g, '').replace('_', ' ') +
                '\n' +
                '---\n\n';

              if (!fs.existsSync(markdownNotebooksPath)) {
                fs.mkdirSync(markdownNotebooksPath);
              }

              const markdownFilePath = (markdownNotebooksPath + '/' + file).replace(
                /.ipynb/g,
                '.md'
              );
              fs.writeFileSync(markdownFilePath, title + markdown);
            }
          });
        }
      }
    }
  }
};
