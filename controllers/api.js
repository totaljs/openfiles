exports.install = function() {
	CORS();
	ROUTE('GET /', index);
};

function index() {
	if (CONF.token)
		this.plain(CONF.name);
	else
		this.redirect('/setup/');
}