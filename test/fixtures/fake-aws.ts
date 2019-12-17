import * as AWS from 'aws-sdk';
import * as sinon from 'sinon';
import {FakeStream} from './fake-stream';

const stub: any = AWS;

class S3 {
	selectObjectContent(args) {
		const {
			OutputSerialization: {
				JSON: {RecordDelimiter}
			}
		} = args;

		const mockStream = new FakeStream(RecordDelimiter);

		return {
			promise: async () => Promise.resolve({Payload: mockStream})
		};
	}
}

export const s3 = new S3();

stub.S3 = function() {
	// tslint:disable-line
	return s3;
};
