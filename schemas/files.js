NEWSCHEMA('Files', function(schema) {

	schema.define('name', String, true);

	schema.setQuery(function($) {

		var db = $.params.db;

		if (!$.user.sa && $.user.databases && !$.user.databases[db]) {
			$.invalid(401);
			return;
		}

		var builder = FILESTORAGE(db).browse();
		builder.autofill($, 'id:string, width:number, height:number, date:date, size:number, type:string, expire:date, ext:string, removed:boolean', null, 'date_desc', 1000);
		builder.where('removed', '<>', true);
		builder.callback(function(err, response) {

			var hostname = $.query.hostname === '1' ? $.controller.hostname() : '';

			for (var item of response) {
				if (!item.removed)
					item.url = hostname + '/files/' + db + '/' + item.id + '-' + FUNC.checksum(item.id) + '.' + item.ext;
			}

			$.callback(err, response);
		});

	});

	schema.setRead(async function($) {
		FILESTORAGE($.params.db).read($.params.id, function(err, response) {

			if (err) {
				$.invalid(404);
				return;
			}

			response.url = ($.query.hostname ? $.controller.hostname() : '') + '/files/' + $.params.db + '/' + $.params.id + '-' + FUNC.checksum($.params.id) + '.' + response.ext;
			$.callback(response);

		}, true);
	});

	schema.setUpdate(function($, model) {

		var db = $.params.db;
		var id = $.params.id;

		if (!$.user.sa && (($.user.databases && !$.user.databases[db]) || $.user.allow_update)) {
			$.invalid(401);
			return;
		}

		FILESTORAGE(db).rename(id, model.name, $.done(true));

	});

	schema.setRemove(function($) {

		var db = $.params.db;
		var id = $.params.id;

		if (!$.user.sa && (($.user.databases && !$.user.databases[db]) || !$.user.allow_remove)) {
			$.invalid(401);
			return;
		}

		FILESTORAGE(db).remove(id, $.done());

	});

	schema.addWorkflow('drop', function($) {

		var db = $.params.db;

		if (!$.user.sa) {
			$.invalid(401);
			return;
		}

		FILESTORAGE(db).drop(function() {
			F.Fs.rmdir(PATH.databases('fs-' + db), () => $.success());
		});

	});

});