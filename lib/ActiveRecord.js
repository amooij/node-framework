/**
 * ActiveRecord
 *
 */

function ActiveRecord(object, table, client) {
	if (typeof object == 'object') {
		for (var field in object) {
			this[field] = object[field];
		}
	}
	this._table = function() {
		return table;
	};
	this._client = function() {
		return client;
	};
	return this;
}

ActiveRecord._client = false;
ActiveRecord.connect = function(user, password) {
	var Client = require('mysql').Client;
	this._client = new Client();
	this._client.user = user;
	this._client.password = password;
	this._client.connect();
};
ActiveRecord.table = function() {
	throw 'ActiveRecord is not a table, please pass a valid table as the first argument';
};
ActiveRecord.find = function() {
	var table = typeof arguments[0] == 'string' ? arguments[0] : this.table();
	var params = typeof arguments[0] == 'object' ? arguments[0] : arguments[1];
	var callback = typeof arguments[1] == 'function' ? arguments[1] : arguments[2];

	var _params = params;
	_params.limit = 1;
	this._findAll(table, _params, callback);
};
ActiveRecord.findAll = function() {
	var table = typeof arguments[0] == 'string' ? arguments[0] : this.table();
	var params = typeof arguments[0] == 'object' ? arguments[0] : arguments[1];
	var callback = typeof arguments[1] == 'function' ? arguments[1] : arguments[2];

	var sql;
	params = params || {};
	params.glue = params.glue || 'AND';

	sql = this._processFields(params);
	sql += 'FROM `' + table + '` ';
	sql += this._processConditions(params);
	console.log(sql);

	if (typeof callback == 'function') {
		this._client.query(sql).on('row', function(row) {
			callback(new this.prototype.constructor(row, table, this._client));
		}.bind(this));
	}
	else {
		this._client.query(sql);
	}
};
ActiveRecord._processFields = function(params) {
	if (typeof params['fields'] == 'array' && params['fields'].length) {
		return 'SELECT ' + params['fields'].reduce(function(iv, field) {
			iv += iv.length ? ', ' : '';
			return iv + '`' + field + '`';
		});
	}
	else {
		return 'SELECT * ';
	}
};
ActiveRecord._processConditions = function(params) {
	var where = '';
	for (var index in params) {
		if (index != 'fields' && index != 'order' && index != 'glue' && index != 'limit') {
			where += where.length ? (' ' + params.glue + ' ') : '';
			where += '`' + index + '` = \'' + params[index].replace("\\", "\\\\").replace("\'", "\\\'") + '\' ';
		}
	}
	return where.length ? ('WHERE ' + where) : '';
};
ActiveRecord.extend = function(table) {
	var _table = table;
	var ret = function(obj) {
		ActiveRecord.call(this, obj, _table);
	};
	for (fun in ActiveRecord) {
		if (typeof ActiveRecord[fun] == 'function') {
			ret[fun] = ActiveRecord[fun];
		}
	}
	for (fun in ActiveRecord.prototype) {
		ret.prototype[fun] = ActiveRecord.prototype[fun];
	}
	ret.table = function() {
		return _table;
	}
	ret._client = ActiveRecord._client;
	return ret;
};

ActiveRecord.prototype = { 
	primaryKey : 'id',
	save : function(callback) {
		var sql = '';
		var newRow = true;
		var middle = '';
	
		for (var field in this) {
			if (field == 'primaryKey') {
				// niets
			}
			else if (typeof this[field] == 'string') {
				middle += middle.length ? ', ' : '';
				middle += '`' + field + '` = \'' + this[field].replace("\\", "\\\\").replace("\'", "\\\'") + '\' '; 
			}
			else if (typeof this[field] == 'number') {
				middle += middle.length ? ', ' : '';
				middle += '`' + field + '` = ' + this[field] + ' ';
			}
			else if (typeof this[field] == 'boolean') {
				middle += middle.length ? ', ' : '';
				middle += '`' + field + '` = ' + (this[field] ? 'true' : 'false') + ' ';
			}
			if (field == this.primaryKey) {
				newRow = false;
			}
		}

		if (newRow) {
			sql = 'INSERT INTO `' + this._table() + '` SET ';
			sql += middle;
		}
		else {
			sql = 'UPDATE `' + this._table() + '` SET ';
			sql += middle;
			sql += 'WHERE `' + this.primaryKey + '` = ';
			if (typeof this[this.primaryKey] == 'string') {
				sql += '\'' + this[this.primaryKey].replace("\\", "\\\\").replace("\'", "\\\'") + '\' ';  
			}
			else {
				sql += this[this.primaryKey];
			}
		}
		console.log(sql);
		this._client().query(sql, callback);
	}
};



ActiveRecord.connect('root', '');

User = ActiveRecord.extend('user');

User.prototype.wavePenis = function() {
	console.log(this.username + ' happily waves his penis!');
};

ActiveRecord._client.query('USE boeklezers');

ActiveRecord.findAll('user', { 'email' : 'a.mooij@gmail.com' } );

User.findAll( { 'email' : 'a.mooij@gmail.com' }, function(user) { user.wavePenis(); } );

var nw = new User();
nw.name = 'Alex';
nw.save();

ActiveRecord._client.end();
