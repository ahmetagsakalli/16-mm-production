export function getPhoneNumber(phone: string) {
  let number = phone.replace(/\D/g, '').replace(/^00/, '');
  if (/^0[1-9]\d{9}$/.test(number)) number = `90${number.slice(1)}`;
  else if (/^[1-9]\d{9}$/.test(number)) number = `90${number}`;
  return /^[1-9]\d{6,14}$/.test(number) ? number : '';
}

export function getInstagramHandle(url: string) {
  const handle = url.replace(/^https:\/\/(www\.)?instagram\.com\//i, '').split(/[/?#]/)[0];
  return handle ? `@${handle}` : 'Instagram';
}
