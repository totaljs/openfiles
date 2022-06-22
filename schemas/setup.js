NEWSCHEMA('Token', function(schema) {

	schema.define('name', String, true);
	schema.define('token', String, true);

	// Permissions
	schema.define('allow_upload', Boolean);
	schema.define('allow_update', Boolean);
	schema.define('allow_remove', Boolean);

	schema.define('databases', '[String]');

});

NEWSCHEMA('Setup', function(schema) {

	schema.define('name', String, true);
	schema.define('token', String, true);
	schema.define('path', String, true);
	schema.define('tokens', '[Token]');
	schema.define('allow_tms', Boolean);
	schema.define('secret_tms', String);
	schema.define('disconnected', Boolean);

	schema.setSave(function($, model) {

		if (!PREF.path) {
			var path = model.path;
			CONF.directory_databases = path;
			if (path[0] === '~')
				path = path.substring(1);
			else
				path = PATH.root(path);
			PATH.mkdir(path);
		}

		for (var key in model)
			PREF.set(key, model[key]);

		LOADCONFIG({ name: model.name, allow_tms: model.allow_tms, secret_tms: model.secret_tms });
		$.success();
		FUNC.preparetokens();
		MAIN.socket && MAIN.socket.sendmeta();
	});

	schema.setRead(function($) {
		var data = CLONE(PREF);
		data.is = !!PREF.path;
		$.callback(data);
	});

	schema.setList(function($) {
		F.Fs.readdir(PATH.databases(), function(err, items) {
			var arr = [];

			for (var item of items) {
				if (item.substring(0, 3) === 'fs-') {
					var name = item.substring(3);
					arr.push({ id: name, name: name });
				}
			}

			arr.wait(function(item, next) {

				var dir = PATH.databases('fs-' + item.id);
				SHELL('du -hsb ' + dir, function(err, response) {

					if (response)
						response = +response.split(/\t|\s/)[0];

					item.size = response;
					next();
				});

			}, () => $.callback(arr));

		});
	});

	schema.addWorkflow('consumption', function($) {
		var data = {};
		var consumption = F.consumption;
		if (consumption) {
			data.memory = consumption.memory;
			data.usage = consumption.usage;
		} else {
			data.memory = 0;
			data.usage = 0;
		}
		$.callback(data);
	});

});