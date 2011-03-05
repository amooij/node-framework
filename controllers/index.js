module.exports = {
	index : function() {
		this.response.writeHead(200, { 'Content-Type' : 'text/html' });
		this.response.write('<!DOCTYPE html><html><head><title>Node</title></head><body><h1>Welkom</h1><p>Op mijn mooie pagina.</p>');
		this.response.end();
	}
};
