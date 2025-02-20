exports.icon = 'ti ti-network-alt';
exports.name = '@(API Tokens)';
exports.position = 3;
exports.visible = user => user.sa || user.permissions.includes('admin');

const Sessions = {};

NEWACTION('APIToken|list', {
	name: 'List of API tokens',
	route: '+API ?',
	permissions: 'admin',
	action: function($) {
		$.callback(MAIN.db.tokens);
	}
});

NEWACTION('APIToken|read', {
	name: 'Read API token',
	input: '*id',
	route: '+API ?',
	permissions: 'admin',
	action: function($, model) {
		let item = MAIN.db.tokens.findItem('id', model.id);
		if (item)
			$.callback(item);
		else
			$.invalid(404);
	}
});

NEWACTION('APIToken|save', {
	name: 'Create or update API token',
	input: 'id,*name,category,summary,isbanned:Boolean,permissions:[String]',
	route: '+API ?',
	permissions: 'admin',
	action: async function($, model) {

		if (model.id) {

			let item = MAIN.db.tokens.findItem('id', model.id);
			if (item) {
				COPY(model, item);
				item.updatedby = $.user.name;
				item.dtupdated = NOW;
				$.success(model.id);
				MAIN.db.save();
			} else
				$.invalid(404);

		} else {
			model.id = UID();

			model.token = model.id + '-' + GUID(20);
			model.token = model.token.sign(CONF.secret);

			model.dtcreated = NOW;
			model.createdby = $.user.name;

			MAIN.db.tokens.push(model);
			MAIN.db.save();
		}

		$.success(model.id);
	}
});

NEWACTION('APIToken|remove', {
	name: 'Remove API token',
	input: '*id',
	route: '+API ?',
	permissions: 'admin',
	action: function($, model) {

		let index = MAIN.db.tokens.findIndex('id', model.id);
		if (index !== -1) {
			MAIN.db.save();
			MAIN.db.tokens.splice(index, 1);
			$.success(model.id);
		} else
			$.invalid(404);

	}
});

NEWACTION('APIToken|permissions', {
	name: 'List of permissions',
	route: '+API ?',
	permissions: 'admin',
	action: async function($) {

		Total.Fs.readdir(PATH.databases(), function(err, items) {

			let arr = [];

			arr.push({ id: 'upload', name: 'Upload files' });
			arr.push({ id: 'remove', name: 'Remove files' });

			for (let item of items) {
				if (item.substring(0, 3) === 'fs-') {
					let name = item.substring(3);
					arr.push({ id: '@' + name, name: name });
				}
			}

			$.callback(arr);

		});
	}
});

ON('configure', async function() {

	if (!MAIN.db.tokens)
		MAIN.db.tokens = [];

});

FUNC.authtoken = function($, token) {
	let response = token.sign(CONF.secret, true);
	if (response) {

		let id = token.substring(0, token.indexOf('-', 7));
		let session = Sessions[id];
		if (session) {
			BLOCKED($, -1);
			$.success(session);
		} else {

			let response = MAIN.db.tokens.findItem('id', id);
			if (response) {
				BLOCKED($, -1);
				response.istoken = true;
				response.sa = false;
				response.dtlogged = NOW;

				if (response.logged)
					response.logged++;
				else
					response.logged = 1;

				Sessions[id] = response;
				$.success(response);
			} else
				$.invalid();

		}
	} else
		$.invalid();
};

ON('service', function() {
	let is = false;
	for (let key in Sessions) {
		let session = Sessions[key];
		if (session.dtexpire < NOW) {
			is = true;
			delete Sessions[key];
		}
	}
	is && MAIN.db.save();
});