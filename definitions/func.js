FUNC.transationlog = function(query) {
	F.Fs.appendFile(PATH.databases(query.db + '.log'), JSON.stringify(query) + '\n', NOOP);
};

FUNC.checksum = function(id) {
	var sum = 0;
	for (var i = 0; i < id.length; i++)
		sum += id.charCodeAt(i);
	return sum.toString(36);
};

FUNC.preparetokens = function() {

	MAIN.tokens = {};

	if (PREF.tokens) {
		for (var token of PREF.tokens) {

			var obj = CLONE(token);
			if (obj.databases && obj.databases.length) {
				var tmp = {};
				for (var db of obj.databases)
					tmp[db] = 1;
				obj.databases = tmp;
			} else
				obj.databases = null;

			MAIN.tokens[obj.token] = obj;
		}
	}

	if (MAIN.socket) {
		for (var key in MAIN.socket.connections) {
			var client = MAIN.socket.connections[key];
			if (client.user.token !== PREF.token) {
				var session = MAIN.tokens[client.user.token];
				if (session)
					client.user = session;
				else
					client.close(4001);
			}
		}
	}

};

FUNC.saveconfig = function() {
	var config = {};
	for (var item of F.extensions)
		config[item.id] = item.config;
	F.Fs.writeFile(PATH.databases('extensions.json'), JSON.stringify(config), NOOP);
};