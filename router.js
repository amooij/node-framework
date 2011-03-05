/**
 * Router
 *
 * A simple router that redirects URLS to objects, and serves static files.
 * The idea is to attach objects to paths, such as an object user to the path 'user'
 * After that, the router will forward requests starting with user to methods for this object.
 * Samples:
 * GET /user -> user.index(args)
 * GET /user/index -> user.index(args)
 * GET /user/create -> user.create(args)
 * GET /user/create/jack -> user.create('jack', args)
 * 
 * You can also define a method called 'anyMethod', which will fetch all requests for non-existing methods. 
 * GET /user/jibberish -> user.anyMethod('jibberish', args)
 *
 * Args will contain an anonymous object constructed out of the querystring.
 * The object will receive request and response as a property.
 *
 * The class also serves static files and these take priority over routes.
 * You shouldn't serve large files from this class, as the file serving operates in read-whole-file-mode.
 * Routes should be added in order of priority, i.e. '/' should probably be last, as it matches everything.
 *
 * TODO: chunked file serving
 * TODO: blockable paths to prevent source code serving
 */

module.exports = function(debug) {
	this.routes = [];
	this.debug = debug;
	return this;
};

module.exports.prototype = 
{ 
	/**
	 * Adds a new route by attaching an object to a path.
	 */
	addRoute : function(path, object) {
require('util').log(require('util').inspect(this));
		this.routes.push({ 'path' : path, 'object' : object });
	},
	/**
	 * Internal function for static file serving
	 */
	realPath : function(err, resolvedPath) {
		if (err) {
			if (this.debug) {
				require('util').log('Path not resolved');
			}
			return this.findRoute();
		}
		if (resolvedPath.length < this.filePath.length || resolvedPath.substring(0, this.filePath.length) != this.filePath) {
			if (this.debug) {
				require('util').log('Path not in current directory: ' + resolvedPath + ' ' + this.filePath);
			}
			return this.findRoute();
		}
		require('fs').readFile(this.filePath, this.fileRead.bind(this));
	},
	/**
	 * Internal function for static file serving
	 */
	fileRead : function(err, data) {
		if (err) {
			if (this.debug) {
				require('util').log('Error reading file');
			}
			return this.findRoute();
		}
		else {
			if (this.debug) {
				require('util').log('Sending file');
			}
		}
		this.response.writeHead(200, { 'Content-Type' : require('mime').lookup(this.path) });
		this.response.end(data);
	},
	/**
	 * The main request handler. You can pass this as a callback to http.createServer
	 */
	route : function(request, response) {
		this.request = request;
		this.response = response;
		this.handled = false;

		if (this.debug) {
			require('util').log('Request received for ' + request.url);
		}

		if (this.request.url.indexOf('?') == -1) {
			this.path = this.request.url;
			this.variables = {};
		}
		else {
			this.path = request.url.substring(0, request.url.indexOf('?') - 1);
			this.variables = querystring.parse(request.url.substring(request.url.indexOf('?') + 1));
		}

		this.filePath = process.cwd() + this.path;
		require('fs').realpath(this.filePath, this.realPath.bind(this));
	},
	/**
	 * Internal function that tries to match the request path in the internal routing table.
	 */
	findRoute : function() {
		this.routes.forEach(function(route) {
			if (this.path.substring(0, route.path.length) == route.path) {
				var func = this.path.substring(route.path.length);
				var fullFunc;
				var subpath = "";
				if (func[0] == '/') { 
					func = func.substring(1);
				}
				fullFunc = func;
				if (func.indexOf('/') != -1) {
					subpath = func.substring(func.indexOf('/') + 1);
					func = func.substring(0, func.indexOf('/') - 1);
				}
				if (!func.length && typeof(route.object.index) == 'function') {
					route.object.request = this.request;
					route.object.response = this.response;
					route.object.index.call(route.object, this.variables);
					this.handled = true;
				}
				else if (typeof(route.object[func]) == 'function') {
					route.object.request = this.request;
					route.object.response = this.response;
					route.object[func].apply(route.object, subpath.split('/').push(this.variables));
					this.handled = true;
				}
				else if (typeof(route.object['anyMethod']) == 'function') {
					route.object.request = this.request;
					route.object.response = this.response;
					route.object.anyMethod.apply(route.object, fullFunc.split('/').push(this.variables));
					this.handled = true;
				}	
			}
		}, this);
		if (!this.handled) {
			if (this.debug) {
				require('util').log('No route found for ' + this.path);
			}
		}

	}
}
