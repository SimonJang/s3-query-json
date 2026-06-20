import {SelectObjectContentRequest} from 'aws-sdk/clients/s3';
import {FakeStream} from './fake-stream';

const AWS = require('aws-sdk');

class S3 {
	calls: SelectObjectContentRequest[] = [];

	selectObjectContent(args: SelectObjectContentRequest) {
		this.calls.push(args);

		const {
			OutputSerialization: {
				JSON: {RecordDelimiter},
			},
		} = args;

		const mockStream = new FakeStream(RecordDelimiter);

		return {
			promise: async () => Promise.resolve({Payload: mockStream}),
		};
	}
}

export const s3 = new S3();

AWS.S3 = function () {
	// tslint:disable-line
	return s3;
};
