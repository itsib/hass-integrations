import { createFilter } from '@rollup/pluginutils';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import * as sass from 'sass';
import { createProcessor } from 'rollup-copy-transform-css';

const { compileString: compileScss } = sass;

function cssToModule(css) {
  return `import { css } from 'lit';
export default css\`${escapeTaggedTemplate(css)}\`;`;
}

function escapeTaggedTemplate(source) {
  return source.replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('$', '\\$');
}

function handleError({ message, reason, column, line }) {
  /* c8 ignore next 2 */
  if (reason) {
    this.error(reason, { column, line });
  } else {
    this.error(message);
  }
}

export default function litScss({ include = ['**/*.scss'], exclude, minify, options, plugins } = {}) {
  const filter = createFilter(include, exclude);
  const processor = (minify || plugins) && createProcessor({ minify, plugins });

  return {
    name: 'lit-scss',

    load(id) {
      if (filter(id)) {
        this.addWatchFile(resolve(id));
      }
    },

    async transform(source, id) {
      // eslint-disable-line consistent-return
      if (filter(id)) {
        try {
          let { css, loadedUrls } = compileScss(source, options);
          for (const url of loadedUrls) {
            this.addWatchFile(fileURLToPath(url));
          }
          if (processor) {
            ({ css } = await processor.process(css, { from: id, map: false }));
          }
          return { code: cssToModule(css), map: { mappings: '' } };
        } catch (err) {
          handleError.call(this, err);
        }
      }
    },
  };
}
