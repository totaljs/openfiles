exports.install = function() {

	CORS();

	// Files
	ROUTE('+POST    /base64/{db}/',      upload_base64, 1024 * 10);        // max. 10 MB
	ROUTE('+POST    /upload/{db}/',      upload, ['upload'], 1024 * 100);  // max. 100 MB
	ROUTE('+POST    /files/{db}/',       upload, ['upload'], 1024 * 100);  // max. 100 MB
	ROUTE('+GET     /files/{db}/         *Files --> query');
	ROUTE('+GET     /files/{db}/{id}/    *Files --> read');
	ROUTE('+POST    /files/{db}/{id}/    *Files --> update');
	ROUTE('+DELETE  /files/{db}/{id}/    *Files --> remove');

	FILE('/files/*.*', files);

	// Index
	ROUTE('GET /', index);
};

function index() {
	if (PREF.token)
		this.plain(MAIN.name + ' v' + MAIN.version);
	else
		this.redirect('/setup/');
}

const IMAGES = { jpg: 1, png: 1, jpeg: 1, gif: 1, svg: 1 };

function upload(db) {

	var self = this;

	if (!self.user.sa && (!self.user.allow_upload || (self.user.databases && !self.user.databases[db]))) {
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

		var evt = 'files_save';
		F.$events[evt] && EMIT(evt, obj.id, obj);

		if (CONF.allow_tms && F.tms.publish_cache.upload && F.tms.publishers.upload)
			PUBLISH('upload', { data: obj });

	}, function() {

		if (self.files.length && PREF.resend && PREF.resend.length) {
			// resend_fs(self, () => self.clear());
			self.autoclear(false);
		}

		self.json(output.length > 1 ? output : output[0]);

	});
}

function upload_base64(db) {

	var self = this;

	if (!self.user.sa && (!self.user.allow_upload || (self.user.databases && !self.user.databases[db]))) {
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

		var evt = 'files_save';
		F.$events[evt] && EMIT(evt, obj.id, obj);

		if (CONF.allow_tms && F.tms.publish_cache.upload && F.tms.publishers.upload)
			PUBLISH('upload', { data: obj });

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

ON('service', function() {
	if (NOW.getHours() === 0 && NOW.getMinutes() === 0) {
		for (var key in MAIN.stats) {
			if (MAIN.stats[key].today) {
				for (var subkey in MAIN.stats[key].today)
					MAIN.stats[key].today[subkey] = 0;
			}
		}
	}
});
