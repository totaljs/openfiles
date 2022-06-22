NEWSCHEMA('Extensions', function(schema) {

	schema.define('body', String, true);

	schema.setList(function($) {

		var arr = [];

		for (var item of F.extensions)
			arr.push({ id: item.id, name: item.name, icon: item.icon, color: item.color, author: item.author, version: item.version, summary: item.summary, readme: !!item.readme, setup: item.configuration && item.configuration.length > 0 ? true : false });

		$.callback(arr);
	});

	schema.setSave(function($, model) {
		NEWEXTENSION(model.body, function(err, module) {

			if (err) {
				$.invalid(err);
				return;
			}

			var dir = PATH.databases('extensions');
			PATH.mkdir(dir, true);
			F.Fs.writeFile(PATH.join(dir, module.id + '.js'), model.body, NOOP);
			$.success();
		});
	});

	schema.setRemove(function($) {
		var id = $.id;
		var item = F.extensions.findItem('id', id);
		if (item) {
			F.Fs.unlink(PATH.join(PATH.databases('extensions'), item.id + '.js'), NOOP);
			item.remove();
			$.success();
			FUNC.saveconfig();
		} else
			$.invalid(404);
	});

	schema.addWorkflow('download', function($) {
		var item = F.extensions.findItem('id', $.id);
		if (item) {
			F.Fs.readFile(PATH.join(PATH.databases('extensions'), item.id + '.js'), function(err, response) {
				if (response)
					$.success(response.toString('utf8'));
				else
					$.invalid(404);
			});
		} else
			$.invalid(404);
	});

	schema.addWorkflow('readme', function($) {
		var item = F.extensions.findItem('id', $.id);
		if (item)
			$.callback(item.readme || '');
		else
			$.invalid(404);
	});

	// Auto-load extensions
	(function() {

		var dir = PATH.databases('extensions');
		PATH.mkdir(dir);

		// Load configuration
		F.Fs.readFile(PATH.databases('extensions.json'), function(err, buffer) {
			var config = buffer ? buffer.toString('utf8').parseJSON(true) : {};
			F.Fs.readdir(dir, function(err, files) {
				files.wait(function(item, next) {
					F.Fs.readFile(PATH.join(dir, item), function(err, response) {
						if (response) {
							NEWEXTENSION(response.toString('utf8'), function(err) {
								err && F.error(err, 'NEWEXTENSION(\'{0}\''.format(item));
								next();
							}, module => module.config = config[module.id]);
						} else
							next();
					});
				});
			});
		});
	})();
});