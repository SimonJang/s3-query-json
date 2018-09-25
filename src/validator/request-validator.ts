import {Options, DocumentType} from '../entities';

/**
 * Validates the options object
 *
 * @param opts - Options object to be validated
 */
export const validator = (opts: Options) => {
	if (!opts) {
		throw new Error('Needs `options` for additional configuration');
	}

	if (!opts.documentType) {
		throw new Error('`documentType` is required');
	}

	if (!opts.expression) {
		throw new Error('`expression` is required');
	}

	if (DocumentType[opts.documentType] === undefined) {
		throw new Error('Unknown `documentType`');
	}

	return;
};
