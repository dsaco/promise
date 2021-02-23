const PENDING = 'PENDING';
const FULFILLED = 'FULFILLED';
const REJECTED = 'REJECTED';

class DPromise {
	constructor(executor) {
		this.status = PENDING;
		this.value = null;
		this.callbacks = [];
		executor(this._resolve.bind(this), this._reject.bind(this));
	}

	_resolve(value) {
		if (this.status === PENDING) {
			if (
				value &&
				typeof value === 'object' &&
				typeof value.then === 'function'
			) {
				value.then.call(value, this._resolve.bind(this));
				return;
			}
			this.status = FULFILLED;
			this.value = value;
			this.callbacks.forEach((callback) => {
				this._handle(callback);
			});
		}
	}
	_reject(reason) {
		if (this.status === PENDING) {
			this.status = REJECTED;
			this.value = reason;
			this.callbacks.forEach((callback) => {
				this._handle(callback);
			});
		}
	}
	_handle(callback) {
		if (this.status === PENDING) {
			this.callbacks.push(callback);
			return;
		}
		if (this.status === FULFILLED) {
			if (!callback.onFulfilled) {
				callback.resolve(this.value);
				return;
			}
			try {
				const result = callback.onFulfilled(this.value);
				callback.resolve(result);
			} catch (error) {
				callback.reject(error);
			}
			return;
		}
		if (this.status === REJECTED) {
			if (!callback.onRejected) {
				callback.reject(this.value);
				return;
			}
			try {
				const reason = callback.onRejected(this.value);
				callback.reject(reason);
			} catch (error) {
				callback.reject(error);
			}
			return;
		}
	}

	then(onFulfilled = null, onRejected = null) {
		return new DPromise((resolve, reject) => {
			this._handle({
				onFulfilled,
				resolve,
				onRejected,
				reject,
			});
		});
	}
}

function delay(ms = 1000) {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve([1, 2, 3]);
		}, ms);
	});
}

new DPromise((resolve) => {
	resolve('first value');
})
	.then(() => {
		console.log('then1 resolve');
		console.log(a);
	})

	.then(() => {
		console.log('then2 resolve');
	})
	.then(
		() => {
			console.log('then3 resolve');
			return 'from then3';
		},
		(e) => {
			console.log('then3 reject');
			console.log(e.message);
		}
	)
	.then(
		() => {
			console.log('then4 resolve');
			return 'from then4';
		},
		(e) => {
			console.log('then4 reject');
			console.log(e);
		}
	)
	.then(
		(res) => {
			console.log('last then resolve');
			console.log(res);
		},
		(err) => {
			console.log('last then reject');
			console.log(err);
		}
	);
