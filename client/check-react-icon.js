import React from 'react';
import ReactDOMServer from 'react-dom/server';
import('lucide-react').then(m => {
  const Icon = m.ChartLineIcon;
  const html = ReactDOMServer.renderToStaticMarkup(React.createElement(Icon, { className: 'w-6 h-6' }));
  console.log(html);
}).catch(err => { console.error(err); });
