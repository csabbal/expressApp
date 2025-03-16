import bcrypt from 'bcrypt'

export async function hashValue(value:string) {
  const saltRounds = 10;
  const hashedValue = await bcrypt.hash(value, saltRounds);
  return hashedValue;
}

export async function checkValue(originalValue:string, hashedValue:string) {
    const match = await bcrypt.compare(originalValue, hashedValue);
    return match;
}