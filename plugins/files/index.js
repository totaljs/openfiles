exports.icon = 'ti ti-copy';
exports.name = '@(File Storage)';
exports.position = 1;
exports.permissions = [{ id: 'files', name: 'Files' }];
exports.visible = user => user.sa || user.permissions.includes('files');
exports.visible = () => true;
exports.hidden = false;
exports.import = 'extensions.html';

exports.install = function() {

	CORS();

	// REST API
	ROUTE('+POST    /base64/{db}/  <10MB', upload_base64);
	ROUTE('+POST    /upload/{db}/  <100MB @upload', upload);
	ROUTE('+POST    /files/{db}/   <100MB @upload', upload);
	ROUTE('+POST    /url/{db}/', upload_url);
	ROUTE('+GET     /files/{db}/         --> Files|API|list');
	ROUTE('+GET     /files/{db}/{id}/    --> Files|API|read');
	ROUTE('+POST    /files/{db}/{id}/    --> Files|API|update');
	ROUTE('+DELETE  /files/{db}/{id}/    --> Files|API|remove');

	// Public
	ROUTE('FILE     /files/*', files);
};

var Table = 'tbl_file';

ON('configure', async function() {

	if (CONF.tbl_file)
		Table = CONF.tbl_file;

	if (CONF.database) {
		let tbl_file = await DATA.check('information_schema.tables').where('table_schema', 'public').where('table_name', Table).promise();
		if (!tbl_file) {
			let sql = await Total.readfile(PATH.plugins('files/init.sql'), 'utf8');
			await DATA.query(sql.format(Table)).promise();
		}
	}
});

const IMAGES = { jpg: 1, png: 1, jpeg: 1, gif: 1 };

function checksum(id) {
	var sum = 0;
	for (var i = 0; i < id.length; i++)
		sum += id.charCodeAt(i);
	return sum.toString(36);
}

function upload($) {

	let user = $.user;
	let db = $.params.db;

	if (!user.sa && (!user.permissions.includes('upload') || !user.permissions.includes('@' + db))) {
		$.response.status = 401;
		$.invalid('Not allowed');
		return;
	}

	var output = [];

	$.files.wait(function(file, next) {

		let obj = {};

		obj.id = $.query.id || $.body[file.name + '_id'] || UID();
		obj.name = file.filename;
		obj.size = file.size;
		obj.type = file.type;
		obj.width = file.width;
		obj.height = file.height;
		obj.ext = file.extension;

		if (IMAGES[obj.ext] && (obj.width <= 0 || obj.height <= 0)) {
			next();
			return;
		}

		file.fs(db, obj.id, function() {

			obj.url = '/files/' + db + '/' + obj.id + '-' + checksum(obj.id) + '.' + file.extension;

			if (CONF.database) {
				let row = {};
				row.id = obj.id;
				row.db = db;
				row.width = obj.width;
				row.height = obj.height;
				row.size = obj.size;
				row.type = obj.type;
				row.name = obj.name;
				row.ext = obj.ext;
				row.createdby = $.user.name;
				DATA.insert(Table, row);
			}

			if ($.query.hostname)
				obj.url = $.hostname(obj.url);

			output.push(obj);
			next();
		});

	}, function() {
		$.json(output.length > 1 ? output : output[0]);
	});
}

function upload_base64($) {

	let user = $.user;
	let db = $.params.db;

	if (!user.sa && (!user.permissions.includes('upload') || !user.permissions.includes('@' + db))) {
		$.response.status = 401;
		$.invalid('Not allowed');
		return;
	}

	let body = $.body;
	let name = body.filename || body.name;

	if (!name) {
		$.invalid('Invalid file name');
		return;
	}

	let file = body.file || body.data;
	let type = file.base64ContentType();
	if (!type) {
		$.invalid('Invalid file type');
		return;
	}

	let buffer = file.base64ToBuffer();
	if (!buffer) {
		$.invalid('Invalid file data');
		return;
	}

	let obj = {};
	obj.id = body.id || $.query.id || UID();
	obj.name = name;
	obj.size = buffer.length;
	obj.type = type;
	obj.ext = U.getExtension(name);

	FILESTORAGE(db).save(obj.id, obj.name, buffer, function(err, meta) {

		obj.width = meta.width;
		obj.height = meta.height;
		obj.url = '/files/' + db + '/' + obj.id + '-' + checksum(obj.id) + '.' + obj.ext;

		if (CONF.database) {
			let row = {};
			row.id = obj.id;
			row.db = db;
			row.width = obj.width;
			row.height = obj.height;
			row.size = meta.size;
			row.type = obj.type;
			row.name = obj.name;
			row.ext = obj.ext;
			row.createdby = $.user.name;
			DATA.insert(Table, row);
		}

		if ($.query.hostname)
			obj.url = $.hostname(obj.url);

		$.json(obj);
	});
}

function upload_url($) {

	let user = $.user;
	let db = $.params.db;

	if (!user.sa && (!user.permissions.includes('upload') || !user.permissions.includes('@' + db))) {
		$.response.status = 401;
		$.invalid('Not allowed');
		return;
	}

	var file = $.body;
	var name = file.filename || file.name;
	if (!name) {
		$.invalid('Invalid file name');
		return;
	}

	if (!file.url) {
		$.invalid('Invalid file url');
		return;
	}

	var obj = {};
	obj.id = file.id || $.query.id || UID();
	obj.name = name;
	obj.ext = U.getExtension(name);

	FILESTORAGE(db).save(obj.id, obj.name, file.url, function(err, meta) {

		obj.type = meta.type || U.getContentType(obj.ext);
		obj.width = meta.width;
		obj.height = meta.height;
		obj.url = '/files/' + db + '/' + obj.id + '-' + checksum(obj.id) + '.' + obj.ext;

		if (CONF.database) {
			let row = {};
			row.id = obj.id;
			row.db = db;
			row.width = obj.width;
			row.height = obj.height;
			row.size = meta.size;
			row.type = obj.type;
			row.name = obj.name;
			row.ext = obj.ext;
			row.createdby = $.user.name;
			DATA.insert(Table, row);
		}

		if ($.query.hostname)
			obj.url = $.hostname(obj.url);

		$.json(obj);
	});
}

function files($) {

	if ($.split.length !== 3) {
		$.invalid(404);
		return;
	}

	var db = $.split[1];
	var id = $.split[2];

	id = id.substring(0, id.lastIndexOf('.'));

	var arr = id.split('-');

	if (checksum(arr[0]) === arr[1])
		$.filefs(db, arr[0], $.query.download === '1');
	else
		$.invalid(404);
}

NEWACTION('Files|databases', {
	name: 'List of databases',
	route: '+API ?',
	user: true,
	permissions: 'files',
	action: function($) {
		Total.Fs.readdir(PATH.databases(), function(err, items) {

			let arr = [];

			for (let item of items) {
				if (item.substring(0, 3) === 'fs-') {
					let name = item.substring(3);
					arr.push({ id: name, name: name });
				}
			}

			arr.wait(function(item, next) {

				let dir = PATH.databases('fs-' + item.id);
				SHELL('du -hsb ' + dir, function(err, response) {
					if (response)
						response = +response.split(/\t|\s/)[0];
					item.size = response;
					next();
				});

			}, () => $.callback(arr));

		});
	}
});

NEWACTION('Files|API|list', {
	name: 'List of files',
	params: '*db',
	user: true,
	action: function($) {
		$.action('Files|list', $.params).callback($);
	}
});

NEWACTION('Files|API|read', {
	name: 'List of files',
	params: '*db,*id',
	user: true,
	action: function($) {
		$.action('Files|read', $.params).callback($);
	}
});

NEWACTION('Files|list', {
	name: 'List of files',
	route: '+API ?',
	input: '*db',
	user: true,
	permissions: 'files',
	action: function($, model) {

		if (!$.user.sa && $.user.databases && !$.user.databases[model.db]) {
			$.invalid(401);
			return;
		}

		var builder = CONF.database ? DATA.list(Table) : FILESTORAGE(model.db).browse();

		builder.autoquery($.query, 'id,name,width:Number,height:Number,date:Date,size:Number,type,ext', 'date_desc', 1000);

		if (CONF.database)
			builder.where('db', model.db);
		else
			builder.where('removed', '<>', true);

		builder.callback($.successful(function(response) {

			var hostname = $.query.hostname === '1' ? $.controller.hostname() : '';

			if (response instanceof Array)
				response = { items: response, page: 1, count: response.length, pages: 1, limit: response.length };

			for (var item of response.items) {
				if (!item.removed)
					item.url = hostname + '/files/' + model.db + '/' + item.id + '-' + checksum(item.id) + '.' + item.ext;
			}

			$.callback(response);
		}));
	}
});

NEWACTION('Files|insert', {
	name: 'Insert a file',
	query: 'name',
	input: 'name,data:DataURI',
	user: true,
	action: function($, model) {
		var response = [];

		// Base64
		if (model.data) {

			var data = model.data;
			var ext;

			switch (data.type) {
				case 'image/png':
					ext = 'png';
					break;
				case 'image/jpeg':
					ext = 'jpg';
					break;
				case 'image/gif':
					ext = 'gif';
					break;
				default:
					$.callback(response);
					return;
			}

			let meta = {};
			meta.id = UID();
			meta.size = data.buffer.length;
			meta.type = data.type;
			meta.ext = ext;
			meta.name = (model.name || $.query.name || (U.random_string(10) + '_base64')).replace(/\.[0-9a-z]+$/i, '').max(40) + '.' + ext;
			meta.url = '/download/' + meta.id + '.' + meta.ext;

			FILESTORAGE('files').save(meta.id, meta.name, data.buffer, { public: 1 }, async function(err, output) {
				let file = { id: output.id, type: output.type, ext: output.ext, name: output.name, url: meta.url, width: output.width, height: output.height, size: output.size, createdby: $.user.name };
				await DATA.insert(Table, file).promise();
				file.dtcreated = NOW;
				response.push(file);
				$.callback(file);
			});

		} else {

			$.files.wait(function(file, next) {
				file.md5(async function(err, checksum) {

					let db = await DATA.read(Table).id(checksum).promise();
					if (db) {
						response.push(db);
						next();
						return;
					}

					let meta = {};
					// meta.id = UID();
					meta.id = checksum;
					meta.checksum = checksum;
					meta.name = file.filename;
					meta.type = file.type;
					meta.ext = file.ext;
					meta.size = file.size;
					meta.url = '/download/' + meta.id + '.' + meta.ext;

					file.fs('files', meta.id, { public: 1 }, async function(err, output) {
						let file = { id: output.id, type: output.type, ext: output.ext, name: output.name, url: meta.url, width: output.width, height: output.height, size: output.size, createdby: $.user.name };
						await DATA.insert(Table, file, true).id(meta.id).promise();
						file.dtcreated = NOW;
						response.push(file);
						next();
					});

				});
			}, () => $.callback(response));
		}
	}
});

NEWACTION('Files|rename', {
	name: 'Rename a file',
	input: '*db,*id,*name',
	route: '+API ?',
	user: true,
	permissions: 'files',
	action: async function($, model) {

		if (CONF.database)
			await DATA.modify(Table, { name: model.name }).id(model.id).where('db', model.db).error(404).promise($);

		FILESTORAGE(model.db).rename(model.id, model.name, $.done(model.id));
	}
});

NEWACTION('Files|clear', {
	name: 'Clear files',
	route: '+API ?',
	input: '*db',
	user: true,
	permissions: 'files',
	action: function($, model) {
		CONF.database && DATA.remove(Table).where('db', model.db);
		FILESTORAGE(model.db).clear($.done());
	}
});

NEWACTION('Files|create', {
	name: 'Create storage',
	route: '+API ?',
	input: '*name:lowercase',
	user: true,
	permissions: 'files',
	action: function($, model) {
		model.name = model.name.slug();
		let fs = FILESTORAGE(model.name);
		PATH.mkdir(fs.directory);
		$.success(model.name);
	}
});

NEWACTION('Files|remove', {
	name: 'Remove a file',
	input: '*db,*id',
	route: '+API ?',
	user: true,
	permissions: 'files',
	action: async function($, model) {

		if (!$.user.sa && (!$.user.permissions.includes('remove') || !$.user.permissions.includes('@' + db))) {
			$.invalid(401);
			return;
		}

		if (CONF.database)
			await DATA.remove(Table).id(model.id).where('db', model.db).error(404).promise($);

		FILESTORAGE(model.db).remove(model.id, $.done());
	}
});

NEWACTION('Files|read', {
	name: 'Remove a file',
	input: '*db,*id',
	route: '+API ?',
	sa: true,
	action: function($, model) {

		FILESTORAGE(model.db).read(model.id, function(err, response) {

			if (err) {
				$.invalid(404);
				return;
			}

			response.url = ($.query.hostname ? $.controller.hostname() : '') + '/files/' + model.db + '/' + model.id + '-' + checksum(model.id) + '.' + response.ext;
			$.callback(response);

		}, true);
	}
});

NEWACTION('Files|drop', {
	name: 'Drop FileStorage',
	input: '*db',
	route: '+API ?',
	sa: true,
	action: function($, model) {

		if (!$.user.sa) {
			$.invalid(401);
			return;
		}

		CONF.database && DATA.remove(Table).where('db', model.db);
		FILESTORAGE(model.db).drop(() => Total.Fs.rmdir(PATH.databases('fs-' + model.db), $.done(model.db)));
	}
});