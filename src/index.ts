import * as AWS from 'aws-sdk';
import {Observable} from 'rxjs';
import {validator} from './validator';
import {Options, DocumentType} from './entities';
import {SelectObjectContentRequest} from 'aws-sdk/clients/s3';

const delimiter = ';';

/**
 * Query a JSON file on S3 with a specific SQL expression
 *
 * @param bucket - Name of the S3 bucket.
 * @param key - Name of the S3 JSON document
 * @param opts - Specific options
 */
export const query = async (bucket: string, key: string, opts: Options): Promise<any | Observable<any> | void> => {
	validator(opts);

	const s3 = new AWS.S3();

	const params: SelectObjectContentRequest = {
		Bucket: bucket,
		Key: key,
		Expression: opts.expression,
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
		}
	};

	const {Payload} = await s3.selectObjectContent(params).promise() as any;

	// If no payload, return
	if (!Payload) {
		return;
	}

	const observable: Observable<any[]> = Observable.create(observer => {
		const container: any[] = [];

		Payload.on('data', raw => {
			const {Records} = raw;

			if (!Records) {
				return;
			}

			raw.Records.Payload
				.toString()
				.split(delimiter)
				.map(item => {
					if (!item.trim()) {
						return;
					}

					if (opts.promise) {
						container.push(JSON.parse(item));
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
	});

	if (opts.promise) {
		return observable.toPromise();
	}

	return observable;
};
