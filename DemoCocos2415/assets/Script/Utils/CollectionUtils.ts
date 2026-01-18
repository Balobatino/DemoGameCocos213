/**
 * Utility helpers for working with collections/arrays.
 */
export class CollectionUtils {
    /**
     * Remove element at index by swapping with last and popping.
     * O(1) removal but does not preserve order.
     */
    public static fastRemoveAt<T>(arr: T[], idx: number): void {
        if (!arr || idx < 0 || idx >= arr.length) return;
        const last = arr.length - 1;
        if (idx !== last) {
            arr[idx] = arr[last];
        }
        arr.pop();
    }

    /**
     * Randomly picks a specified amount of elements from the input list.
     * Returns a new list of size 'amount' (or list length if amount is larger).
     * @param list - The source list to pick from.
     * @param amount - The number of elements to pick.
     * @returns A new list with the randomly picked elements.
     */
    public static randomPickFromList<T>(list: T[], amount: number): T[] {
        if (!list || list.length === 0 || amount <= 0) {
            console.warn("CollectionUtils: randomPickFromList called with empty list or non-positive amount.");
            return [];
        }

        const pickCount = Math.min(amount, list.length);
        // clone the original list to avoid modifying it
        const result = [...list];

        // Partial Fisher-Yates shuffle to pick random elements.
        for (let i = 0; i < pickCount; i++) {
            const randomIndex = Math.floor(Math.random() * (result.length - i)) + i;
            const temp = result[i];
            result[i] = result[randomIndex];
            result[randomIndex] = temp;
        }

        return result.slice(0, pickCount);
    }
}
