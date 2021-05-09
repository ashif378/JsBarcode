// Help functions
import linearizeEncodings from './help/linearizeEncodings';
import fixOptions from './help/fixOptions';

// Exceptions
import { InvalidInputException, NoElementException } from './exceptions/exceptions';

// Options
import { Options } from './options/options';
import defaults from './options/defaults';

// The prototype of the object returned from the JsBarcode() call
const API = function() {};

// The first call of the library API
// Will return an object with all barcodes calls and the data that is used
// by the renderers
const JsBarcode = function(element: any, text: string, options?: Options) {
	var api = new API();

	if (typeof element === 'string') {
		element = document.querySelector(element);
	}

	if (typeof element === 'undefined') {
		throw new NoElementException();
	}

	// Variables that will be pased through the API calls
	api._encodings = [];
	api._options = { ...defaults, ...(options || {}) };
	api._element = element;

	// If text is set, use the simple syntax (render the barcode directly)
	if (typeof text !== 'undefined') {
		options = options || defaults;

		api._encodings.push(encode(text, api._options));
		api.options(options).render();
	}

	return api;
};

// encode() handles the Encoder call and builds the binary string to be rendered
function encode(text, options) {
	// Ensure that text is a string
	text = '' + text;

	// If the input is not valid for the encoder, throw error.
	// If the valid callback option is set, call it instead of throwing error
	if (!options.encoder.valid(text, options)) {
		throw new InvalidInputException(text);
	}

	// Make a request for the binary data (and other infromation) that should be rendered
	const encoded = options.encoder.encode(text, options);

	return encoded;
}

// Sets global encoder options
// Added to the api by the JsBarcode function
API.prototype.options = function(options) {
	this._options = { ...this._options, ...options };
	return this;
};

// Will create a blank space (usually in between barcodes)
API.prototype.blank = function(size) {
	const zeroes = new Array(size + 1).join('0');
	this._encodings.push({ data: zeroes });
	return this;
};

// Will encode another barcode
API.prototype.barcode = function(text, options) {
	this._encodings.push(encode(text, { ...this._options, ...(options || {}) }));
	return this;
};

// The render API call. Calls the real render function.
API.prototype.render = function() {
	render(this._element, this._encodings, this._options);

	return this;
};

// Prepares the encodings and calls the renderer
function render(element, encodings, options: Options) {
	encodings = linearizeEncodings(encodings);

	for (let i = 0; i < encodings.length; i++) {
		encodings[i].options = { ...options, ...encodings[i].options };
		fixOptions(encodings[i].options);
	}

	fixOptions(options);

	options.renderer(element, encodings, options);
}

export default JsBarcode;