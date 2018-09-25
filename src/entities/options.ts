export enum DocumentType {
	JSON = 'JSON',
	NDJSON = 'NDJSON'
}

export interface Options {
	/**
	 * Document type of the S3 Object: Either `JSON` or `NDJSON`
	 */
	documentType: string;
	/**
	 * Delimiter used when returning the results
	 */
	expression: string;
	/**
	 * Flag to indicate if a Promise or Observable needs to be returned
	 */
	promise?: boolean;
}
