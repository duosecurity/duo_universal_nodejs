export const generateRandomString = (length: number): string => {
  const result = [];
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result.push(characters.charAt(Math.floor(Math.random() * charactersLength)));
  }

  return result.join('');
};

export const getTimeInSeconds = (date = new Date(Date.now())): number =>
  Math.round(date.getTime() / 1000);
