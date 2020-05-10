export function assertIsString(input: any, errorMessage: string): asserts input is string {
	if (typeof input === 'string') {
		return;
	}

	throw Error(errorMessage);
}

export function optionalIn<T>(input: any | any[], collection: T[], errorMessage: string): asserts input is T {
	const validationSet = Array.isArray(input) ? input : [input];
	for (const item of validationSet) {
		if (item === undefined || collection.some(record => item === record)) {
			continue;
		}

		throw Error(errorMessage);
	}
}

export function assert(statement: boolean, errorMessage): asserts statement is true {
	if (statement) {
		return;
	}

	throw Error(errorMessage);
}
