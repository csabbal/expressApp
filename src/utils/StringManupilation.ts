/**
 * This function create a flat readable string from any object
 * @param obj given object
 * @returns {String}
 */
export function safeStringify(obj: any):string {
    const seen = new WeakSet()
    return JSON.stringify(obj, (key, value) => {
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                return
            }
            seen.add(value)
        }
        return value
    })
}