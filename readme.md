# s3-query-json [![Build Status](https://travis-ci.org/SimonJang/s3-query-json.svg?branch=master)](https://travis-ci.org/SimonJang/s3-query-json)

> Query JSON and NDJSON files on Amazon S3

## About

The `selectObjectContent` [API](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#selectObjectContent-property) allows to easily query JSON and NDJSON data from S3. This node module provides a wrapper for this method, exposing the data as an aggregated result as Promise or as an Observable stream of the same data using the powerful RxJS library.

See the official AWS [docs](https://docs.aws.amazon.com/amazonglacier/latest/dev/s3-glacier-select-sql-reference-select.html) for more information.

## Install

```
$ npm install s3-query-json
```

## Usage

```js
const s3Query = require('s3-query-json');

// As Promise
s3Query.query('foobarbaz', 'users.ndjson', {expression: 'SELECT s.name FROM S3Object s', documentType: 'NDJSON', promise: true})
	.then(data => console.log(data) // [{"name": "unicorn"}, {"name": "rainbow"}])

// As observable stream
s3Query.query('foobarbaz', 'users.ndjson', {expression: 'SELECT s.name FROM S3Object s WHERE s.age > 25', documentType: 'JSON'})
	.pipe(
		tap(data => console.log(data) // {"name": "unicorn"})
	)
```

## API

### query(bucketName, object, options)

#### bucketName

Type: `String`

The name of the bucket containing your object.

#### object

Type: `String`

The name of the S3 object (your JSON or NDJSON file) you wanto to query.

#### options

Type: `Object`

Configuration object.

##### options.expressions

Type: `String`

SQL query to be executed on the file. Read the [documentation](https://docs.aws.amazon.com/amazonglacier/latest/dev/s3-glacier-select-sql-reference-select.html) on which SQL operations are allowed.

##### options.documentType

Type: `String`

Accept either `JSON` or `NDJSON`

##### [options.promise]

Type: `Boolean`

Flag to indicate the preferred return type. Without the `promise` flag, an Observable is returned. Otherwise a promise, will all the aggregated data is returned.

## License

MIT © [Simon](https://github.com/SimonJang)
