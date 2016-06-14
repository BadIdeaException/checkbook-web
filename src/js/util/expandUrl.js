"use strict";

(function() {
/**
 * Basic function to take URL templates and fill their placeholders with values. It understands a subset
 * of the functionality supported by the original $resource. This is purely intended as a workaround because
 * $resource doesn't expose its own templating mechanisms.
 *
 * The following is supported:
 * - Optional protocol and domain, i.e. https://www.example.com:8080/path/to/resource works. No validity checks are done on the URL, rather
 * it is assumed that everything up to the first single slant is part of the protocol and domain 
 * - Parameter object can contain literals, accessor expressions ('`@propertyName`'') and functions
 *
 * The following is not supported:
 * - Nested property accessors, i.e. '`@someObject.property`' will not work
 * - Multiple appearance of a placeholder will result in only the first one being filled
 * - URLs containing a fragment (#): The fragment part will be dropped
 * 
 * NOTE: This function does not encode special characters as they would normally be.
 * But since these are only going to be used as cache keys, that shouldn't matter
 *
 * @param {string} url The URL template to expand.
 * @param params Placeholder mappings
 * @param data Object to read values from if `params` contains property accessors
 *                    
 * See {@link https://docs.angularjs.org/api/ngResource/service/$resource|the Angular documentation on $resource} for specifics on these params.
 *
 * @return {string} The URL template with all placeholders replaced by values.
 */
function expandUrl(url, params, data) {
	function substitute(placeholder) {
		// Assign to value whatever the params object holds for the placeholder
		var value = params[placeholder];
		// If value is a string starting with a '@', it is a property accessor,
		// so read the corresponding value from data
		if (angular.isString(value) && value.startsWith('@'))  
			value = data[value.substr(1)];
		// If value is a function, invoke it
		else if (angular.isFunction(value))
			value = value.call(data);
		// Remove from params object - this is so we don't append parameters to
		// query that were already substituted in the path
		delete params[placeholder];

		return value;
	}
	params = angular.copy(params) || {};
	data = data || {};

	// Standard URL format: protocol://host:port/segment1/segment2/.../segmentN&query1=value1;query2=value2
	
	// Process protocol and domain, if present
	// We'll assume that if the sequence http:// or https:// is at the beginning of the url,
	// the protocol+domain is everything up to but excluding the first slant following that
	var PROTOCOL_DOMAIN_REGEX = /^https?:\/\/[^\/]+\//i; // Capture group for everything EXCEPT the final slant
	var QUERY_REGEX = /\?[^#]*/i;
	
	var result = (PROTOCOL_DOMAIN_REGEX.exec(url) || [''])[0]; // Copy protocol+domain over into result, if present...
	url = url.substring(result.length); // ...and remove it from the url
	var query = (QUERY_REGEX.exec(url) || [''])[0]; // Save query for later...
	url = url.substring(0, url.length - query.length); // ...and remove it from the url

	// Process path
	result += url
		.split('/') // Split path into segments
		.map(function(segment) { 
			return segment.startsWith(':') ?
				substitute(segment.substr(1)) :
				segment;
		})
		.join('/'); // Join processed segments using / as separator

	// Process query, if present
	result += query; // Append saved query (might be empty)
	if (Object.keys(params).length > 0) // Are there any params left that need to be appended?
		result 
			+= (query.length > 0 ? '&' : '?')
			+ Object.keys(params)
				.map(function(param) {
					return param +'=' + substitute(param);
				})
				.join('&');

	return result;
}

angular
	.module('Checkbook.Util')
	.value('expandUrl', expandUrl);
})();