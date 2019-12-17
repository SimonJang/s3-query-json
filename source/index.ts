import * as AWS from 'aws-sdk';
import {SelectObjectContentRequest, ScanRange} from 'aws-sdk/clients/s3';
import ow from 'ow';
import {Observable} from 'rxjs';
import * as clean from 'obj-clean';
import {Options, DocumentType} from './entities';

const delimiter = ';';

/**
 * Query a JSON file on S3 with a specific SQL expression
 *
 * @param bucket - Name of the S3 bucket.
 * @param key - Name of the S3 JSON document
 * @param key - SQL expression to execute
 * @param opts - Specific options
 */
export const query = async (
	bucket: string,
	key: string,
	expression: string,
	opts: Options = {documentType: DocumentType.NDJSON}
): Promise<unknown> => {
	try {
		ow(bucket, 'bucket', ow.string.nonEmpty);
		ow(key, 'key', ow.string.nonEmpty);
		ow(expression, 'expression', ow.string.nonEmpty);
		ow(
			opts,
			'options',
			ow.object.partialShape({
				documentType: ow.string.oneOf(Object.keys(DocumentType)),
				scanRange: ow.optional.object.nonEmpty.hasAnyKeys('start', 'end'),
				promise: ow.optional.boolean
			})
		);
	} catch (err) {
		throw err;
	}

	const s3 = new AWS.S3();
	const container: any[] = [];

	const params: SelectObjectContentRequest = {
		Bucket: bucket,
		Key: key,
		Expression: expression,
		ExpressionType: 'SQL',
		InputSerialization: {
			JSON: {
				Type: opts.documentType === DocumentType.JSON ? 'DOCUMENT' : 'LINES'
			}
		},
		OutputSerialization: {
			JSON: {
				RecordDelimiter: delimiter
			}
		},
		ScanRange: {
			Start: opts.scanRange?.start,
			End: opts.scanRange?.end
		} as ScanRange
	};

	const {Payload} = (await s3.selectObjectContent(clean(params) as SelectObjectContentRequest).promise()) as any;

	const observable = new Observable(observer => {
		Payload.on('data', raw => {
			raw.Records.Payload.toString()
				.split(delimiter)
				.map(item => {
					if (!item.trim()) {
						return;
					}

					if (opts.promise) {
						container.push(JSON.parse(item));

						return;
					}

					observer.next(JSON.parse(item));
				});
		});

		Payload.on('error', err => {
			observer.error(err);
		});

		Payload.on('end', () => {
			if (opts.promise) {
				observer.next(container);
			}

			observer.complete();
		});

		return () => {
			Payload.destroy();
		};
	});

	if (opts.promise) {
		return observable.toPromise();
	}

	return observable;
};
