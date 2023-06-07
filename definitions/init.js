var db = MAIN.db = MEMORIZE('data');

if (!db.tokens)
	db.tokens = [];

if (!db.config)
	db.config = {};

var config = db.config;

if (!config.name)
	config.name = 'OpenFiles';

if (!config.cdn)
	config.cdn = '//cdn.componentator.com';

// Fixed settings
CONF.allow_custom_titles = true;
CONF.version = '1';
CONF.op_icon = 'ti ti-copy';
CONF.op_path = '/setup/';

// Loads configuration
LOADCONFIG(db.config);

// UI components
COMPONENTATOR('ui', 'exec,locale,aselected,page,viewbox,input,importer,box,cloudeditorsimple,validate,loading,intranetcss,notify,message,errorhandler,empty,menu,colorpicker,icons,miniform,clipboard,approve,columns,iframepreview,search,searchinput,fileuploader,formdata,filesaver,filereader,ready,datagrid,tangular-filesize', true);

// Permissions
ON('ready', function() {
	for (var key in F.plugins) {
		var item = F.plugins[key];
		if (item.permissions)
			OpenPlatform.permissions.push.apply(OpenPlatform.permissions, item.permissions);
	}
});