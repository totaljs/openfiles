NEWSCHEMA('Tokens', function(schema) {

	schema.action('list', {
		name: 'List of tokens',
		permissions: 'tokens',
		action: function($) {
			$.callback(MAIN.db.tokens);
		}
	});

	schema.action('read', {
		name: 'Read token',
		permissions: 'tokens',
		params: '*id:UID',
		action: function($) {
			var params = $.params;
			var item = MAIN.db.tokens.findItem('id', params.id);
			if (item)
				$.callback(item);
			else
				$.invalid('@(Token not found)');
		}
	});


	schema.action('create', {
		name: 'Create token',
		input: '*name, *token, allow_upload:Boolean, allow_remove:Boolean, allow_udpate:Boolean, databases:[String]',
		permissions: 'tokens',
		action: function($, model) {
			model.id = UID();
			MAIN.db.tokens.push(model);
			$.success(model.id);
			MAIN.db.save();
		}
	});

	schema.action('update', {
		name: 'Update token',
		input: '*name, *token, allow_upload:Boolean, allow_remove:Boolean, allow_udpate:Boolean, databases:[String]',
		params: '*id:UID',
		permissions: 'tokens',
		action: function($, model) {

			var params = $.params;
			var db = MAIN.db.tokens;
			var index = db.findIndex('id', params.id);
			if (index !== -1) {
				COPY(model, db[index]);
				$.success(params.id);
				MAIN.db.save();

			} else
				$.invalid('@(Token not found)');

		}
	});

	schema.action('remove', {
		name: 'Remove token',
		params: '*id:UID',
		permissions: 'tokens',
		action: function($) {

			var params = $.params;
			var db = MAIN.db.tokens;
			var index = db.findIndex('id', params.id);
			if (index !== -1) {
				db.splice(index, 1);
				$.success(params.id);
				MAIN.db.save();

			} else
				$.invalid('@(Token not found)');

		}
	});

});