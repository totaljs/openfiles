FUNC.checksum = function(id) {
	var sum = 0;
	for (var i = 0; i < id.length; i++)
		sum += id.charCodeAt(i);
	return sum.toString(36);
};