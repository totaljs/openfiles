const REG_SETUP = /\/(api|setup)\//;

var USER = { sa: true, permissions: EMPTYARRAY };
var DDOS = {};

AUTH(function($) {

	if (DDOS[$.ip] && DDOS[$.ip] > 5) {
		$.invalid();
		return;
	}

	var token = $.headers['x-token'] || $.query.token || '0';

	if (REG_SETUP.test($.url)) {

		// Setup interface
		if (CONF.op_reqtoken && CONF.op_restoken) {
			OpenPlatform.auth($);
			return;
		}

		if (!CONF.token || CONF.token === token) {
			if (DDOS[$.ip])
				delete DDOS[$.ip];
			$.success(USER);
		} else {
			if (DDOS[$.ip])
				DDOS[$.ip]++;
			else
				DDOS[$.ip] = 1;
			$.invalid();
		}

		return;
	}

	var item = MAIN.db.tokens.findItem('token', token);
	if (item) {
		$.success(item);
		return;
	}

	if (DDOS[$.ip])
		DDOS[$.ip]++;
	else
		DDOS[$.ip] = 1;

	$.invalid();

});

ON('service', function(counter) {
	if (counter % 15 === 0)
		DDOS = {};
});