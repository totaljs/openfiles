NEWSCHEMA('Files', function(schema) {

	schema.define('name', String, true);

	schema.action('list', {
		name: 'List of files',
		params: 'db:String',
		action: function($) {

			var params = $.params;

			if (!$.user.sa && $.user.databases && !$.user.databases.includes(params.db)) {
				$.invalid(401);
				return;
			}

			var builder = FILESTORAGE(params.db).browse();
			builder.autofill($, 'id:string, width:number, height:number, date:date, size:number, type:string, expire:date, ext:string, removed:boolean', null, 'date_desc', 1000);
			builder.where('removed', '<>', true);
			builder.callback(function(err, response) {

				var hostname = $.query.hostname === '1' ? $.controller.hostname() : '';

				for (var item of response) {
					if (!item.removed && item.id)
						item.url = hostname + '/files/' + params.db + '/' + item.id + '-' + FUNC.checksum(item.id) + '.' + item.ext;
				}

				$.callback(err, response);
			});
		}
	});

	schema.action('read', {
		name: 'Reads file',
		params: 'db:String,id:String',
		action: function($) {
			var params = $.params;
			FILESTORAGE(params.db).read(params.id, function(err, response) {

				if (err) {
					$.invalid(404);
					return;
				}

				response.url = ($.query.hostname ? $.controller.hostname() : '') + '/files/' + params.db + '/' + params.id + '-' + FUNC.checksum(params.id) + '.' + response.ext;
				$.callback(response);

			}, true);
		}
	});

	schema.action('update', {
		name: 'Updates file',
		params: 'db:String,id:String',
		action: function($, model) {

			var params = $.params;

			if (!$.user.sa && (($.user.databases && !$.user.databases.includes(params.db)) || $.user.allow_update)) {
				$.invalid(401);
				return;
			}

			FILESTORAGE(params.db).rename(params.id, model.name, $.done(params.id));
		}
	});

	schema.action('remove', {
		name: 'Deletes file',
		params: 'db:String,id:String',
		action: function($) {

			var params = $.params;

			if (!$.user.sa && (($.user.databases && !$.user.databases.includes(params.db)) || !$.user.allow_remove)) {
				$.invalid(401);
				return;
			}

			FILESTORAGE(params.db).remove(params.id, () => $.success());
		}
	});

	schema.action('drop', {
		name: 'Deletes db',
		params: 'db:String',
		action: function($) {

			var params = $.params;

			if (!$.user.sa) {
				$.invalid(401);
				return;
			}

			FILESTORAGE(params.db).drop(() => F.Fs.rmdir(PATH.databases('fs-' + params.db), () => $.success()));
		}
	});

	schema.action('databases', {
		name: 'List of file databases',
		action: function($) {
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

						if (response) {
							response = +response.split(/\t|\s/)[0];
							item.size = response;
						} else
							item.size = null;

						next();
					});

				}, () => $.callback(arr));

			});
		}
	});

});