exports.icon = 'ti ti-key';
exports.name = '@(Tokens)';
exports.permissions = [{ id: 'tokens', name: 'Tokens' }];
exports.position = 9;
exports.visible = user => user.sa || user.permissions.includes('tokens');

exports.install = function() {
	ROUTE('+API    /api/    -tokens                *Tokens   --> list');
	ROUTE('+API    /api/    -tokens_read/{id}      *Tokens   --> read');
	ROUTE('+API    /api/    +tokens_create         *Tokens   --> create');
	ROUTE('+API    /api/    +tokens_update/{id}    *Tokens   --> update');
	ROUTE('+API    /api/    -tokens_remove/{id}    *Tokens   --> remove');
};