exports.icon = 'ti ti-cog';
exports.name = '@(Configuration)';
exports.permissions = [{ id: 'setup', name: 'Setup' }];
exports.position = 10;
exports.visible = user => user.sa || user.permissions.includes('setup');

exports.install = function() {
	ROUTE('+API    /api/    -setup_read    *Setup   --> read');
	ROUTE('+API    /api/    +setup_save    *Setup   --> save');
};