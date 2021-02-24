const PENDING = 'PENDING';
const FULFILLED = 'FULFILLED';
const REJECTED = 'REJECTED';

const resolvePromise = (promise2, x, resolve, reject) => {
	if (promise2 === x) {
		return reject(new TypeError('链式调用循环引用'));
	}
	let called;

	if ((typeof x === 'object' && x !== null) || typeof x === 'function') {
		try {
			let then = x.then;
			if (typeof then === 'function') {
				then.call(
					x,
					(v) => {
						if (called) {
							return;
						}
						called = true;
						resolvePromise(promise2, v, resolve, reject);
					},
					(r) => {
						if (called) {
							return;
						}
						called = true;
						reject(r);
					}
				);
			} else {
				resolve(x);
			}
		} catch (e) {
			if (called) {
				return;
			}
			called = true;
			reject(e);
		}
	} else {
		resolve(x);
	}
};

class DPromise {
	constructor(executor) {
		this.status = PENDING;

		this.value = null;
		this.reason = null;

		this.onResolvedCallbacks = [];
		this.onRejectedCallbacks = [];

		const resolve = (value) => {
			if (this.status === PENDING) {
				this.status = FULFILLED;
				this.value = value;

				this.onResolvedCallbacks.forEach((callback) => callback());
			}
		};
		const reject = (reason) => {
			if (this.status === PENDING) {
				this.status = REJECTED;
				this.reason = reason;

				this.onRejectedCallbacks.forEach((callback) => callback());
			}
		};

		try {
			executor(resolve, reject);
		} catch (error) {
			console.log('executor error');
			reject(error);
		}
	}

	then(onFulfilled, onRejected) {
		onFulfilled =
			typeof onFulfilled === 'function' ? onFulfilled : (value) => value;
		onRejected =
			typeof onRejected === 'function'
				? onRejected
				: (err) => {
						throw err;
				  };

		let promise2 = new DPromise((resolve, reject) => {
			if (this.status === FULFILLED) {
				setTimeout(() => {
					try {
						let x = onFulfilled(this.value);
						resolvePromise(promise2, x, resolve, reject);
					} catch (e) {
						reject(e);
					}
				});
			}
			if (this.status === REJECTED) {
				setTimeout(() => {
					try {
						let x = onRejected(this.reason);

						resolvePromise(promise2, x, resolve, reject);
					} catch (e) {
						reject(e);
					}
				});
			}

			if (this.status === PENDING) {
				this.onResolvedCallbacks.push(() => {
					setTimeout(() => {
						try {
							let x = onFulfilled(this.value);
							resolvePromise(promise2, x, resolve, reject);
						} catch (e) {
							reject(e);
						}
					});
				});
				this.onRejectedCallbacks.push(() => {
					setTimeout(() => {
						try {
							let x = onRejected(this.reason);
							resolvePromise(promise2, x, resolve, reject);
						} catch (e) {
							reject(e);
						}
					});
				});
			}
		});
		return promise2;
	}
}
