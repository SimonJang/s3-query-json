import test from 'ava';
import * as sinon from 'sinon';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';
import {s3} from './fixtures/fake-aws';
import {query} from '../src';

const sandbox = sinon.createSandbox();

test.before(() => {
	sandbox.spy(s3, 'selectObjectContent');
});

test.after(() => {
	sandbox.restore();
});

test('should return a promise with all the data', async t => {
	const data = await query('foobarbaz', 'users.ndjson', {expression: 'SELECT s.name FROM S3Object s', documentType: 'NDJSON', promise: true});

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
	const observable: Observable<any> = await query('foobarbaz', 'users.ndjson', {expression: 'SELECT s.name FROM S3Object s', documentType: 'NDJSON'});

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

	await observable
		.pipe(tap(data => t.deepEqual(data, records[counter++])))
		.toPromise();
});
