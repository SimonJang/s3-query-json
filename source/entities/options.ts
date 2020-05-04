export enum DocumentType {
	JSON = 'JSON',
	NDJSON = 'NDJSON'
}

export enum CompressionType {
	NONE = 'NONE',
	GZIP = 'GZIP',
	BZIP2 = 'BZIP2'
}

type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
	{
		[K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
	}[Keys];

export interface Options {
	/**
	 * Document type of the S3 Object: Either `JSON` or `NDJSON`
	 */
	documentType?: 'JSON' | 'NDJSON';
	/**
	 * Type of compression for the S3 Object
	 */
	compressionType?: 'NONE' | 'GZIP' | 'BZIP2';
	/**
	 * Flag to indicate if a Promise or Observable needs to be returned
	 */
	promise?: boolean;
	/**
	 * Allow to scan specified ranges of the file
	 */
	scanRange?: RequireAtLeastOne<{start: string; end: string}, 'start' | 'end'>;
}
