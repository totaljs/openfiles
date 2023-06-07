NEWSCHEMA('Setup', function(schema) {

	schema.define('name', String, true);
	schema.define('token', String);
	schema.define('totalapi', String);

	schema.define('op_reqtoken', String);
	schema.define('op_restoken', String);

	schema.action('save', {
		name: 'Save configuration',
		permissions: 'setup',
		action: function($, model) {
			COPY(model, MAIN.db.config);
			LOADCONFIG(model);
			MAIN.db.save();
			$.success();
		}
	});

	schema.action('read', {
		name: 'Read configuration',
		permissions: 'setup',
		action: function($) {
			$.callback(MAIN.db.config);
		}
	});

});