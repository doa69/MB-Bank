import * as _request from 'request-promise';

export default async function solveCaptcha(base64: string): Promise<string> {
  const captchaApiBaseUrl = 'https://bank-captcha.payment.com.vn';
  const captchaTextResolver = await _request.post(
    captchaApiBaseUrl + '/resolver',
    {
      form: {
        body: base64,
      },
    }
  );

  if (!captchaTextResolver.includes('OK'))
    throw new Error('Captcha error ' + captchaTextResolver);

  const captchaContent = captchaTextResolver.split('|')[1];
  return captchaContent;
}
