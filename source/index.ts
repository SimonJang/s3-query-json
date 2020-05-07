import {S3} from 'aws-sdk';
import {SelectObjectContentRequest, ScanRange} from 'aws-sdk/clients/s3';
import {Options, DocumentType, CompressionType} from './entities';

function assertIsString(input: any, errorMessage: string): asserts input is string {
	if (typeof input === 'string') {
		return;
	}

	throw Error(errorMessage);
}

function optionalIn<T>(input: any | any[], collection: T[], errorMessage: string): asserts input is T {
	const validationSet = Array.isArray(input) ? input : [input];
	for (const item of validationSet) {
		if (item === undefined || collection.some(record => item === record)) {
			continue;
		}

		throw Error(errorMessage);
	}
}

function assert(statement: boolean, errorMessage): asserts statement is true {
	if (statement) {
		return;
	}

	throw Error(errorMessage);
}

/**
 * Query a JSON file on S3 with a specific SQL expression
 *
 * @param bucket - Name of the S3 bucket.
 * @param key - Name of the S3 JSON document
 * @param key - SQL expression to execute
 * @param opts - Specific options
 */
export const query = async <T>(
	bucket: string,
	key: string,
	expression: string,
	opts: Options = {documentType: DocumentType.NDJSON, compressionType: 'NONE', delimiter: '\n'}
): Promise<T[]> => {
	assertIsString(bucket, `Bucket \`${bucket}\` should be a string`);
	assertIsString(key, `Key \`${key}\` should be a string`);
	assertIsString(expression, `Expression \`${expression}\` should be a string`);
	assertIsString(opts.delimiter, `Delimiter \`${opts.delimiter}\` should be a string`);
	assert(opts.delimiter.length === 1, `Delimiter must have length \`1\`, found ${opts.delimiter.length}`);
	optionalIn(opts.documentType, Object.keys(DocumentType), `Unknown documentType \`${opts.documentType}\``);
	optionalIn(opts.compressionType, Object.keys(CompressionType), `Unknown compressionType \`${opts.compressionType}\``);
	optionalIn(
		Object.keys(opts.scanRange || {}),
		['start', 'end'],
		`In ScanRange only \`start\` and \`end\` are allowed, got ${JSON.stringify(opts.scanRange)}`
	);

	const s3 = new S3();

	const request: SelectObjectContentRequest = {
		Bucket: bucket,
		Key: key,
		Expression: expression,
		ExpressionType: 'SQL',
		InputSerialization: {
			JSON: {
				Type: opts.documentType === DocumentType.JSON ? 'DOCUMENT' : 'LINES'
			},
			CompressionType: opts.compressionType || CompressionType.NONE
		},
		OutputSerialization: {
			JSON: {
				RecordDelimiter: opts.delimiter
			}
		},
		ScanRange: {
			Start: opts.scanRange?.start,
			End: opts.scanRange?.end
		} as ScanRange
	};

	let result: any;

	try {
		const {Payload} = await s3.selectObjectContent(request).promise();
		result = Payload;
	} catch (err) {
		return Promise.reject(err);
	}

	if (opts.stream === true) {
		return result;
	}

	return new Promise((resolve, reject) => {
		let data = '';

		result.on('data', ({Records}) => {
			if (!Records) {
				return;
			}

			data += Records.Payload.toString();
		});
		result.on('error', err => reject(err));
		result.on('end', () => {
			const results: any[] = [];

			for (const record of data.split(opts.delimiter || '\n')) {
				if (!record.trim()) {
					continue;
				}

				results.push(JSON.parse(record));
			}

			resolve(results);
		});
	});
};
