import test from 'ava';
import * as sinon from 'sinon';
import {tap} from 'rxjs/operators';
import {s3} from './fixtures/fake-aws';
import {query} from '../source';
import {Observable} from 'rxjs';

const sandbox = sinon.createSandbox();

test.before(() => {
	sandbox.spy(s3, 'selectObjectContent');
});

test.after(() => {
	sandbox.restore();
});

test('should fail on validation', async t => {
	const fn = query as any;

	await t.throwsAsync(fn(), 'Expected `bucket` to be of type `string` but received type `undefined`');
	await t.throwsAsync(fn('mybucket'), 'Expected `key` to be of type `string` but received type `undefined`');
	await t.throwsAsync(
		fn('mybucket', 'foo.json'),
		'Expected `expression` to be of type `string` but received type `undefined`'
	);
	await t.throwsAsync(
		fn('mybucket', 'foo.json', 'SELECT * FROM S3Object s', {documentType: 'csv'}),
		'Expected property string `documentType` to be one of `["JSON","NDJSON"]`, got `csv` in object `options`'
	);
	await t.throwsAsync(
		fn('mybucket', 'foo.json', 'SELECT * FROM S3Object s', {documentType: 'NDJSON', promise: 1}),
		'Expected property `promise` to be of type `boolean` but received type `number` in object `options`'
	);
	await t.throwsAsync(
		fn('mybucket', 'foo.json', 'SELECT * FROM S3Object s', {documentType: 'NDJSON', promise: true, scanRange: {}}),
		'Expected property object `scanRange` to not be empty in object `options`'
	);
});

test('should return a promise with all the data', async t => {
	const data = await query('foobarbaz', 'users.ndjson', 'SELECT s.name FROM S3Object s', {
		documentType: 'JSON',
		promise: true
	});

	t.deepEqual(data, [
		{
			name: 'Foo'
		},
		{
			name: 'Bar'
		},
		{
			name: 'Foo'
		}
	]);
});

test('should return an observable which emits the different values', async t => {
	const observable = (await query('foobarbaz', 'users.ndjson', 'SELECT s.name FROM S3Object s')) as Observable<{
		name: string;
	}>;

	const records = [
		{
			name: 'Foo'
		},
		{
			name: 'Bar'
		},
		{
			name: 'Foo'
		}
	];

	let counter = 0;

	await observable.pipe(tap(data => t.deepEqual(data, records[counter++]))).toPromise();
});

test.serial('should scan a specific range of the file on S3', async t => {
	await query('foobarbaz', 'users.ndjson', 'SELECT s.name FROM S3Object s', {
		scanRange: {start: '0', end: '50'}
	});

	t.deepEqual((s3.selectObjectContent as sinon.SinonStub).lastCall.args[0], {
		Bucket: 'foobarbaz',
		Key: 'users.ndjson',
		Expression: 'SELECT s.name FROM S3Object s',
		ExpressionType: 'SQL',
		InputSerialization: {
			JSON: {
				Type: 'LINES'
			},
			CompressionType: 'NONE'
		},
		OutputSerialization: {
			JSON: {
				RecordDelimiter: ';'
			}
		},
		ScanRange: {
			Start: '0',
			End: '50'
		}
	});
});
