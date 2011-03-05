var http = require('http');
var Router = require('./router');


router = new Router(true);
router.addRoute('/', require('./controllers/index'));

require('util').log(require('util').inspect(router));
http.createServer(router.route.bind(router)).listen(8080);
