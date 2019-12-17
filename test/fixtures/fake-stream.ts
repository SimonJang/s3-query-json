import {Readable} from 'stream';

const data = [
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

export class FakeStream extends Readable {
	dataPublished = false;
	delimiter: string;

	constructor(delimiter: string) {
		super({objectMode: true});

		this.delimiter = delimiter;
	}

	_read() {
		if (!this.dataPublished) {
			this.dataPublished = true;

			return this.push({
				Records: {
					Payload: Buffer.from(data.map(item => JSON.stringify(item)).join(this.delimiter))
				}
			});
		}

		this.dataPublished = false;

		return this.push(null);
	}
}
