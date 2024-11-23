type Visibility = 'public' | 'authorized';
type Expiration = 'never' | '10m' | '1h' | '1d' | '1w' | '1m' | '6m' | '1y';

const expirationToSeconds = (expiration: Expiration) => {
	switch (expiration) {
		case '10m':
			return 60 * 10;
		case '1h':
			return 60 * 60;
		case '1d':
			return 60 * 60 * 24;
		case '1w':
			return 60 * 60 * 24 * 7;
		case '1m':
			return 60 * 60 * 24 * 30;
		case '6m':
			return 60 * 60 * 24 * 30 * 6;
		case '1y':
			return 60 * 60 * 24 * 365;
		case 'never':
			return undefined;
	}
};

const generateKey = () => {
	const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let result = '';
	for (let i = 0; i < 8; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return result;
};

const customKeyIsValid = (customKey: string) => {
	const regex = /^[a-zA-Z0-9_-]+$/;
	return regex.test(customKey);
};

export class ValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ValidationError';
	}
}

export const validateVisibility = (visibility: string): Visibility => {
	if (visibility !== 'public' && visibility !== 'authorized') {
		throw new ValidationError('Invalid visibility value. Must be either "public" or "authorized"');
	}
	return visibility;
};

export const validateExpiration = (expiration: string): Expiration => {
	const validExpirations: Expiration[] = ['never', '10m', '1h', '1d', '1w', '1m', '6m', '1y'];
	if (!validExpirations.includes(expiration as Expiration)) {
		throw new ValidationError('Invalid expiration value. Must be one of: never, 10m, 1h, 1d, 1w, 1m, 6m, 1y');
	}
	return expiration as Expiration;
};

export const validateCustomKey = (customKey: string | null): string | null => {
	if (customKey) {
		if (!customKeyIsValid(customKey)) {
			throw new ValidationError('Invalid custom key. Must be alphanumeric and can contain underscores and hyphens');
		}
		if (customKey.length < 3 || customKey.length > 50) {
			throw new ValidationError('Invalid custom key. Must be between 3 and 50 characters');
		}
	}
	return customKey;
};

const isKeyAlreadyInUse = async (env: Env, key: string) => {
	const existingPaste = await env.PASTE_KV.get(key);
	return existingPaste !== null;
};

const createPaste = async ({
	env,
	content,
	visibility,
	expiration,
	title,
	customKey,
}: {
	env: Env;
	content: string;
	visibility: Visibility;
	expiration: Expiration;
	title: string | null;
	customKey: string | null;
}) => {
	const key = customKey || generateKey();
	const isKeyInUse = await isKeyAlreadyInUse(env, key);
	if (isKeyInUse) {
		throw new Error('Key already in use');
	}

	const expirationSeconds = expirationToSeconds(expiration);
	await env.PASTE_KV.put(key, content, {
		metadata: { visibility, title, createdAt: new Date().toISOString(), expirationSeconds },
		expirationTtl: expirationSeconds,
	});

	return key;
};

export default createPaste;
