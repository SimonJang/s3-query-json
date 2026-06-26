import assert from 'node:assert/strict';
import test, {beforeEach} from 'node:test';
import {s3} from './fixtures/fake-aws';

const {query} = require('../source') as typeof import('../source');

beforeEach(() => {
	s3.calls = [];
});

test('should fail on validation', async () => {
	const fn = query as any;

	await assert.rejects(() => fn(), {message: 'Bucket `undefined` should be a string'});
	await assert.rejects(() => fn('mybucket'), {message: 'Key `undefined` should be a string'});
	await assert.rejects(() => fn('mybucket', 'foo.json'), {message: 'Expression `undefined` should be a string'});
	await assert.rejects(() => fn('mybucket', 'foo.json', 'SELECT * FROM S3Object s', {documentType: 'csv'}), {
		message: 'Unknown documentType `csv`',
	});
	await assert.rejects(
		() => fn('mybucket', 'foo.json', 'SELECT * FROM S3Object s', {documentType: 'NDJSON', delimiter: '$$'}),
		{
			message: 'Delimiter must have length `1`, found 2',
		},
	);
});

test('should return a promise with all the data', async () => {
	const data = await query('foobarbaz', 'users.ndjson', 'SELECT s.name FROM S3Object s', {
		documentType: 'JSON',
		delimiter: '\n',
	});

	assert.deepEqual(data, [
		{
			name: 'Foo',
		},
		{
			name: 'Bar',
		},
		{
			name: 'Foo',
		},
	]);
});

test('should merge partial options with defaults', async () => {
	await query('foobarbaz', 'users.ndjson', 'SELECT s.name FROM S3Object s', {
		documentType: 'JSON',
	});

	assert.deepEqual(s3.calls.at(-1)?.InputSerialization, {
		JSON: {
			Type: 'DOCUMENT',
		},
		CompressionType: 'NONE',
	});
	assert.equal(s3.calls.at(-1)?.OutputSerialization.JSON?.RecordDelimiter, '\n');
});

test('should return a stream', async () => {
	const data = await query('foobarbaz', 'users.ndjson', 'SELECT s.name FROM S3Object s', {
		documentType: 'JSON',
		delimiter: '\n',
		stream: true,
	});

	assert.equal(typeof (data as any).on, 'function');
});

test('should scan a specific range of the file on S3', async () => {
	await query('foobarbaz', 'users.ndjson', 'SELECT s.name FROM S3Object s', {
		delimiter: '\n',
		scanRange: {start: 0, end: 50},
	});

	assert.deepEqual(s3.calls.at(-1), {
		Bucket: 'foobarbaz',
		Key: 'users.ndjson',
		Expression: 'SELECT s.name FROM S3Object s',
		ExpressionType: 'SQL',
		InputSerialization: {
			JSON: {
				Type: 'LINES',
			},
			CompressionType: 'NONE',
		},
		OutputSerialization: {
			JSON: {
				RecordDelimiter: '\n',
			},
		},
		ScanRange: {
			Start: 0,
			End: 50,
		},
	});
});
