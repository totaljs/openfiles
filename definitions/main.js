MAIN.version = 1;
MAIN.name = 'OpenFiles';
MAIN.tokens = {};

ON('ready', function() {
	PREF.name && LOADCONFIG({ name: PREF.name, allow_tms: PREF.allow_tms, secret_tms: PREF.secret_tms });
	FUNC.preparetokens();
});