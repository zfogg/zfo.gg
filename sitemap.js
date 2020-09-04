const SitemapGenerator = require('sitemap-generator');

// create generator
const generator = SitemapGenerator('https://zfo.gg', {
  stripQuerystring: false
});

// register event listeners
generator.on('done', () => {
  console.log('done!')
});

// start the crawler
generator.start();
