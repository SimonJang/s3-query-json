# s3-query-json [![Build Status](https://travis-ci.org/SimonJang/s3-query-json.svg?branch=master)](https://travis-ci.org/SimonJang/s3-query-json)

> Query JSON and NDJSON files on Amazon S3

## About

The `selectObjectContent` [API](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#selectObjectContent-property) allows to easily query JSON and NDJSON data from S3. This node module provides a wrapper for this method, exposing the data as an aggregated result as a Promise.

See the official AWS [documentation](https://docs.aws.amazon.com/amazonglacier/latest/dev/s3-glacier-select-sql-reference-select.html) for more information.

## Install

```
$ npm install s3-query-json
```

## Usage

```js
const {query} = require('s3-query-json');

query('foobarbaz', 'users.ndjson', 'SELECT s.name FROM S3Object s')
	.then(data => console.log(data) // [{"name": "unicorn"}, {"name": "rainbow"}])

query('foobarbaz', 'users.ndjson', 'SELECT s.name FROM S3Object s', {documentType: 'NDJSON', compressionType: 'GZIP', stream: false, delimiter: '\n', scanRange: {start: 1, end: 100}})
	.then(data => console.log(data) // [{"name": "unicorn"}, {"name": "rainbow"}])
```

## API

### query(bucket, key, expression, [options])

#### bucket

Type: `String`

The name of the bucket containing your object.

#### key

Type: `String`

The key of the S3 object, either JSON or NDJSON format.

#### expression

Type: `String`

SQL query to be executed. Read the [documentation](https://docs.aws.amazon.com/amazonglacier/latest/dev/s3-glacier-select-sql-reference-select.html) on which SQL operations are allowed.

#### options

Type: `Object`

Configuration object.

##### [options.documentType]

Type: `String`
Default: `NDJSON`

Accepts either `JSON` or `NDJSON` as input.

##### [options.compressionType]

Type: `String`
Default: `NONE`

Compression used in the S3 object. Either `NONE`, `GZIP` or `BZIP2`

##### [options.stream]

Type: `Boolean`
Default: `false`

Flag to indicate if the function returns a Promise with a original readstream. This allows more advanced custom processing.

##### [options.delimiter]

Type: `string`
Default: `\n`

Delimiter with **a maximum length of 1** to separate the records that are being returned. To avoid difficult parsing, use a delimiter with no collision with the records returned.

##### [options.scanRange]

Type: `Object`
Default: `undefined`

This property can only be used with non-compressed (ND)JSON files. Allows to scan a specified range of bytes. See the [documentation](https://docs.aws.amazon.com/AmazonS3/latest/API/API_SelectObjectContent.html#AmazonS3-SelectObjectContent-request-ScanRange) for more information. When `scanRange` is provided, atleast one of keys `start` or `end` must be provided.

##### [options.scanRange.start]

Type: `Number`

Inclusive start of the range. Starts from 0

##### [options.scanRange.end]

Type: `Number`

Inclusive end of the range. This is allowed to be out of bound of the object size.


## License

MIT © [Simon Jang](https://github.com/SimonJang)
