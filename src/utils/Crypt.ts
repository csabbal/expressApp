import bcrypt from 'bcrypt'

/**
 * This function is used to make a hash from any string
 * @param value 
 * @returns a hash
 */
export async function hashValue(value:string) {
  const saltRounds = 10;
  const hashedValue = await bcrypt.hash(value, saltRounds);
  return hashedValue;
}

/**
 * This function help to compare an original and hashed version of the same expression
 * @param {String} originalValue 
 * @param {String} hashedValue 
 * @returns {Boolean}
 */
export async function checkValue(originalValue:string, hashedValue:string) {
    const match = await bcrypt.compare(originalValue, hashedValue);
    return match;
}