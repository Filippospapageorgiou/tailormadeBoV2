import { getContext, setContext } from 'svelte';

const CHAT_KEY = Symbol('chat');

export class ChatStore {
	unreadCount = $state(0);

	/** Callback to refresh the unread query — set by the layout that owns the query */
	private _refreshFn: (() => void) | null = null;

	constructor(initialCount: number = 0) {
		this.unreadCount = initialCount;
	}

	/** Set the exact unread count (use from reactive query sync) */
	setCount(count: number) {
		this.unreadCount = count;
	}

	/** Register the layout's query refresh function */
	setRefreshFn(fn: () => void) {
		this._refreshFn = fn;
	}

	/** Trigger the layout's unread query to re-fetch */
	refreshCount() {
		this._refreshFn?.();
	}

	decrement(by: number = 1) {
		this.unreadCount = Math.max(0, this.unreadCount - by);
	}

	increment(by: number = 1) {
		this.unreadCount = this.unreadCount + by;
	}
}

export function setChatContext(initialCount: number = 0): ChatStore {
	const store = new ChatStore(initialCount);
	setContext(CHAT_KEY, store);
	return store;
}

export function getChatContext(): ChatStore {
	return getContext<ChatStore>(CHAT_KEY);
}
