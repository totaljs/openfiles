exports.icon = 'ti ti-copy';
exports.name = '@(Files)';
exports.position = 1;
exports.permissions = [{ id: 'files', name: 'Files' }];
exports.visible = user => user.sa || user.permissions.includes('files');

exports.install = function() {

	// Public API
	ROUTE('+POST    /base64/{db}/',      upload_base64, 1024 * 10);        // max.  10 MB
	ROUTE('+POST    /upload/{db}/',      upload, ['upload'], 1024 * 100);  // max. 100 MB
	ROUTE('+POST    /files/{db}/',       upload, ['upload'], 1024 * 100);  // max. 100 MB
	ROUTE('+POST    /url/{db}/',         upload_url);
	ROUTE('+GET     /files/{db}/         *Files --> query');
	ROUTE('+GET     /files/{db}/{id}/    *Files --> read');
	ROUTE('+POST    /files/{db}/{id}/    *Files --> update');
	ROUTE('+DELETE  /files/{db}/{id}/    *Files --> remove');

	FILE('/files/*.*', files);

	// Internal
	ROUTE('+API    /api/    -files_browse/{db}         *Files   --> list');
	ROUTE('+API    /api/    -files_read/{db}/{id}      *Files   --> read');
	ROUTE('+API    /api/    +files_update/{db}/{id}    *Files   --> update');
	ROUTE('+API    /api/    -files_remove/{db}/{id}    *Files   --> remove');
	ROUTE('+API    /api/    -files_databases           *Files   --> databases');
	ROUTE('+API    /api/    -files_drop/{db}           *Files   --> drop');

};

const IMAGES = { jpg: 1, png: 1, jpeg: 1, gif: 1 };

function upload(db) {

	var self = this;

	if (!self.user.sa && (!self.user.allow_upload || (self.user.databases && self.user.databases.length && !self.user.databases.includes(db)))) {
		self.status = 401;
		self.invalid('Not allowed');
		return;
	}

	var output = [];

	self.files.wait(function(file, next) {

		var obj = {};

		obj.id = self.query.id || self.body[file.name + '_id'] || UID();
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

		file.fs(db, obj.id, next);

		var url = '/files/' + db + '/' + obj.id + '-' + FUNC.checksum(obj.id) + '.' + file.extension;
		obj.url = self.query.hostname ? self.hostname(url) : url;
		output.push(obj);

	}, function() {

		self.json(output.length > 1 ? output : output[0]);

	});
}

function upload_base64(db) {

	var self = this;

	if (!self.user.sa && (!self.user.allow_upload || (self.user.databases && self.user.databases.length && !self.user.databases.includes(db)))) {
		self.status = 401;
		self.invalid('Not allowed');
		return;
	}

	var name = self.body.filename || self.body.name;
	if (!name) {
		self.invalid('Invalid file name');
		return;
	}

	var file = self.body.file || self.body.data;

	var type = file.base64ContentType();
	if (!type) {
		self.invalid('Invalid file type');
		return;
	}

	var buffer = file.base64ToBuffer();
	if (!buffer) {
		self.invalid('Invalid file data');
		return;
	}

	var obj = {};
	obj.id = self.body.id || self.query.id || UID();
	obj.name = name;
	obj.size = buffer.length;
	obj.type = type;
	obj.ext = U.getExtension(name);

	FILESTORAGE(db).save(obj.id, obj.name, buffer, function(err, meta) {

		obj.width = meta.width;
		obj.height = meta.height;

		var url = '/files/' + db + '/' + obj.id + '-' + FUNC.checksum(obj.id) + '.' + obj.ext;
		obj.url = self.query.hostname ? self.hostname(url) : url;

		self.json(obj);
	});
}

function upload_url(db) {

	var self = this;

	if (!self.user.sa && (!self.user.allow_upload || (self.user.databases && self.user.databases.length && !self.user.databases.includes(db)))) {
		self.status = 401;
		self.invalid('Not allowed');
		return;
	}

	var file = self.body;
	var name = file.filename || file.name;
	if (!name) {
		self.invalid('Invalid file name');
		return;
	}

	if (!file.url) {
		self.invalid('Invalid file url');
		return;
	}

	var obj = {};
	obj.id = file.id || self.query.id || UID();
	obj.name = name;
	obj.ext = U.getExtension(name);

	FILESTORAGE(db).save(obj.id, obj.name, file.url, function(err, meta) {

		obj.type = meta.type || U.getContentType(obj.ext);
		obj.width = meta.width;
		obj.height = meta.height;

		var url = '/files/' + db + '/' + obj.id + '-' + FUNC.checksum(obj.id) + '.' + obj.ext;
		obj.url = self.query.hostname ? self.hostname(url) : url;

		self.json(obj);
	});
}

function files(req, res) {

	if (req.split.length !== 3) {
		res.throw404();
		return;
	}

	var db = req.split[1];
	var id = req.split[2];

	id = id.substring(0, id.lastIndexOf('.'));

	var arr = id.split('-');

	if (FUNC.checksum(arr[0]) === arr[1])
		res.filefs(db, arr[0], req.query.download === '1');
	else
		res.throw404();

}