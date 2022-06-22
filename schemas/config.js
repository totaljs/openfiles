NEWSCHEMA('Config', function(schema) {

	schema.define('id', String, true);
	schema.define('data', Object, true);

	schema.setSave(function($, model) {
		var extension = F.extensions.findItem('id', model.id);
		if (extension) {
			extension.config = model.data;
			extension.configure && extension.configure(extension.config);
			$.success();
			FUNC.saveconfig();
		} else
			$.invalid(404);
	});

	schema.setRead(function($) {
		var extension = F.extensions.findItem('id', $.id);
		if (extension) {
			var model = {};
			model.configuration = extension.configuration;
			model.config = extension.config;
			$.callback(model);
		} else
			$.invalid(404);
	});

});