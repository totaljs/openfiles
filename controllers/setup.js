exports.install = function() {

	ROUTE('+GET    /setup/');

	// API
	ROUTE('API    @setup    +save                      *Setup        --> save');
	ROUTE('API    @setup    -read                      *Setup        --> read');
	ROUTE('API    @setup    -list                      *Setup        --> list');
	ROUTE('API    @setup    -usage                     *Setup        --> consumption');
	ROUTE('API    @setup    -files_browse/{db}         *Files        --> query');
	ROUTE('API    @setup    -files_remove/{db}/{id}    *Files        --> remove');
	ROUTE('API    @setup    -files_drop/{db}           *Files        --> drop');
	ROUTE('API    @setup    -config_read/{id}          *Config       --> read');
	ROUTE('API    @setup    +config_save               *Config       --> save');
	ROUTE('API    @setup    -extensions_list           *Extensions   --> list');
	ROUTE('API    @setup    +extensions_save           *Extensions   --> save');
	ROUTE('API    @setup    -extensions_remove/{id}    *Extensions   --> remove');
	ROUTE('API    @setup    -extensions_download/{id}  *Extensions   --> download');
	ROUTE('API    @setup    -extensions_readme/{id}    *Extensions   --> readme');

	ROUTE('+SOCKET /setup/  @setup', 1024);
	ROUTE('+POST   /setup/', update, ['upload'], 1024 * 10);
};

function update() {
	var self = this;
	var file = self.files[0];

	if (!F.isBundle) {
		self.invalid('@(Available for bundled version only)');
		return;
	}

	if (file && file.extension === 'bundle') {
		file.move(F.Path.join(PATH.root(), '../bundles/app.bundle'), function(err) {
			if (err) {
				self.invalid(err);
			} else {
				self.success();
				setTimeout(() => F.restart(), 1000);
			}
		});
	} else
		self.invalid('Invalid file');
}